import { count, desc, eq, sum } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireApiPlatformAdmin } from "@/lib/auth/api";
import { getDb } from "@/lib/db";
import { tenantTokenBalances, tokenUsageLogs } from "@/lib/db/schema";
import { getRemainingTokens } from "@/lib/tokens";

export async function GET(request: Request) {
  const auth = await requireApiPlatformAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  const db = getDb();

  const logs = tenantId
    ? await db
        .select()
        .from(tokenUsageLogs)
        .where(eq(tokenUsageLogs.tenantId, tenantId))
        .orderBy(desc(tokenUsageLogs.createdAt))
        .limit(100)
    : await db.select().from(tokenUsageLogs).orderBy(desc(tokenUsageLogs.createdAt)).limit(100);

  const [balanceRows, usageRows] = await Promise.all([
    db.select().from(tenantTokenBalances),
    db
      .select({ tenantId: tokenUsageLogs.tenantId, calls: count(), tokens: sum(tokenUsageLogs.totalTokens) })
      .from(tokenUsageLogs)
      .groupBy(tokenUsageLogs.tenantId),
  ]);

  return NextResponse.json({
    balances: balanceRows.map((balance) => ({
      ...balance,
      remainingTokens: getRemainingTokens(balance),
    })),
    usageByTenant: usageRows.map((row) => ({
      tenantId: row.tenantId,
      calls: Number(row.calls),
      tokens: Number(row.tokens ?? 0),
    })),
    logs,
  });
}
