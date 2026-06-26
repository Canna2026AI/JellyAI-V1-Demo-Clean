import { count, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireApiTenantUser } from "@/lib/auth/api";
import { getDb } from "@/lib/db";
import { tenantRecords, tenants, tenantTokenBalances, tokenUsageLogs } from "@/lib/db/schema";
import { moduleLabels } from "@/lib/demo-data";
import { ensureTenantTokenBalance, getActiveAiModels, getRemainingTokens, getTenantSelectedModel } from "@/lib/tokens";

export async function GET() {
  const auth = await requireApiTenantUser();
  if (auth.error) return auth.error;
  const { user } = auth;
  const db = getDb();
  await ensureTenantTokenBalance(user.tenantId);

  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1);
  const [[tokenBalance], activeModels, selectedModel, moduleCounts, recentRecords, recentTokenLogs] = await Promise.all([
    db.select().from(tenantTokenBalances).where(eq(tenantTokenBalances.tenantId, user.tenantId)).limit(1),
    getActiveAiModels(),
    getTenantSelectedModel(user.tenantId),
    db
      .select({ module: tenantRecords.module, count: count() })
      .from(tenantRecords)
      .where(eq(tenantRecords.tenantId, user.tenantId))
      .groupBy(tenantRecords.module),
    db
      .select()
      .from(tenantRecords)
      .where(eq(tenantRecords.tenantId, user.tenantId))
      .orderBy(desc(tenantRecords.createdAt))
      .limit(20),
    db
      .select()
      .from(tokenUsageLogs)
      .where(eq(tokenUsageLogs.tenantId, user.tenantId))
      .orderBy(desc(tokenUsageLogs.createdAt))
      .limit(20),
  ]);

  return NextResponse.json({
    tenant,
    user,
    tokenBalance: tokenBalance
      ? {
          totalTokens: tokenBalance.totalTokens,
          usedTokens: tokenBalance.usedTokens,
          remainingTokens: getRemainingTokens(tokenBalance),
        }
      : null,
    selectedModel,
    models: activeModels,
    modules: moduleCounts.map((item) => ({
      module: item.module,
      label: moduleLabels[item.module] ?? item.module,
      count: Number(item.count),
    })),
    records: recentRecords,
    tokenUsageLogs: recentTokenLogs,
  });
}
