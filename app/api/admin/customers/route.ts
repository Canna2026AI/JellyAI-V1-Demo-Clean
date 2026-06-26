import { count, desc, eq, sum } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireApiPlatformAdmin } from "@/lib/auth/api";
import { getDb } from "@/lib/db";
import { auditLogs, tenantRecords, tenants, tenantTokenBalances, tokenUsageLogs, users } from "@/lib/db/schema";
import { demoTenantRecords } from "@/lib/demo-data";
import { DEFAULT_TENANT_TOKENS, ensureTenantModelSetting } from "@/lib/tokens";
import { createTenantSchema } from "@/lib/validators";

export async function GET() {
  const auth = await requireApiPlatformAdmin();
  if (auth.error) return auth.error;

  const db = getDb();
  const [tenantRows, userCounts, recordCounts, balances, usageRows] = await Promise.all([
    db.select().from(tenants).orderBy(desc(tenants.createdAt)),
    db.select({ tenantId: users.tenantId, count: count() }).from(users).where(eq(users.role, "tenant_user")).groupBy(users.tenantId),
    db.select({ tenantId: tenantRecords.tenantId, count: count() }).from(tenantRecords).groupBy(tenantRecords.tenantId),
    db.select().from(tenantTokenBalances),
    db
      .select({ tenantId: tokenUsageLogs.tenantId, calls: count(), tokens: sum(tokenUsageLogs.totalTokens) })
      .from(tokenUsageLogs)
      .groupBy(tokenUsageLogs.tenantId),
  ]);

  const userCountByTenant = new Map(userCounts.map((item) => [item.tenantId, Number(item.count)]));
  const recordCountByTenant = new Map(recordCounts.map((item) => [item.tenantId, Number(item.count)]));
  const balanceByTenant = new Map(balances.map((item) => [item.tenantId, item]));
  const usageByTenant = new Map(usageRows.map((item) => [item.tenantId, { calls: Number(item.calls), tokens: Number(item.tokens ?? 0) }]));

  return NextResponse.json({
    customers: tenantRows.map((tenant) => ({
      ...tenant,
      users: userCountByTenant.get(tenant.id) ?? 0,
      records: recordCountByTenant.get(tenant.id) ?? 0,
      tokenBalance: balanceByTenant.get(tenant.id) ?? null,
      tokenUsage: usageByTenant.get(tenant.id) ?? { calls: 0, tokens: 0 },
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireApiPlatformAdmin();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = createTenantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "客户数据无效" }, { status: 400 });
  }

  const db = getDb();
  const [tenant] = await db.insert(tenants).values({ name: parsed.data.name, status: parsed.data.status }).returning();
  await db.insert(tenantTokenBalances).values({
    tenantId: tenant.id,
    totalTokens: parsed.data.initialTokens ?? DEFAULT_TENANT_TOKENS,
    usedTokens: 0,
  });
  await ensureTenantModelSetting(tenant.id);

  if (parsed.data.initializeDemoData) {
    await db.insert(tenantRecords).values(
      demoTenantRecords.map((record) => ({
        tenantId: tenant.id,
        module: record.module,
        recordType: record.recordType,
        payload: record.payload,
      })),
    );
  }

  await db.insert(auditLogs).values({
    actorUserId: auth.user.id,
    tenantId: tenant.id,
    action: "api.tenant.create",
    metadata: {
      name: tenant.name,
      initializeDemoData: parsed.data.initializeDemoData,
      initialTokens: parsed.data.initialTokens,
    },
  });

  return NextResponse.json({ customer: tenant }, { status: 201 });
}
