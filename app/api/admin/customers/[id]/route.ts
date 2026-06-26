import { count, desc, eq, sum } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireApiPlatformAdmin } from "@/lib/auth/api";
import { getDb } from "@/lib/db";
import { tenantRecords, tenants, tenantTokenBalances, tokenUsageLogs, users } from "@/lib/db/schema";
import { setTenantStatusSchema } from "@/lib/validators";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireApiPlatformAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const db = getDb();
  const [[tenant], tenantUsers, moduleCounts, recentRecords, [tokenBalance], [usageSummary], recentTokenLogs] = await Promise.all([
    db.select().from(tenants).where(eq(tenants.id, id)).limit(1),
    db.select().from(users).where(eq(users.tenantId, id)).orderBy(desc(users.createdAt)),
    db.select({ module: tenantRecords.module, count: count() }).from(tenantRecords).where(eq(tenantRecords.tenantId, id)).groupBy(tenantRecords.module),
    db.select().from(tenantRecords).where(eq(tenantRecords.tenantId, id)).orderBy(desc(tenantRecords.createdAt)).limit(50),
    db.select().from(tenantTokenBalances).where(eq(tenantTokenBalances.tenantId, id)).limit(1),
    db
      .select({ calls: count(), tokens: sum(tokenUsageLogs.totalTokens) })
      .from(tokenUsageLogs)
      .where(eq(tokenUsageLogs.tenantId, id)),
    db.select().from(tokenUsageLogs).where(eq(tokenUsageLogs.tenantId, id)).orderBy(desc(tokenUsageLogs.createdAt)).limit(50),
  ]);

  if (!tenant) {
    return NextResponse.json({ error: "客户不存在" }, { status: 404 });
  }

  return NextResponse.json({
    customer: tenant,
    users: tenantUsers,
    modules: moduleCounts.map((item) => ({ module: item.module, count: Number(item.count) })),
    records: recentRecords,
    tokenBalance: tokenBalance ?? null,
    tokenUsage: {
      calls: Number(usageSummary?.calls ?? 0),
      tokens: Number(usageSummary?.tokens ?? 0),
    },
    tokenUsageLogs: recentTokenLogs,
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireApiPlatformAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = setTenantStatusSchema.safeParse({ tenantId: id, status: body?.status });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "客户状态无效" }, { status: 400 });
  }

  const [tenant] = await getDb()
    .update(tenants)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(tenants.id, parsed.data.tenantId))
    .returning();
  if (!tenant) {
    return NextResponse.json({ error: "客户不存在" }, { status: 404 });
  }

  return NextResponse.json({ customer: tenant });
}
