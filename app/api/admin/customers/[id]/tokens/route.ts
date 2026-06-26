import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireApiPlatformAdmin } from "@/lib/auth/api";
import { getDb } from "@/lib/db";
import { auditLogs, tenantTokenBalances, tokenAdjustments } from "@/lib/db/schema";
import { adjustTenantTokensSchema } from "@/lib/validators";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const auth = await requireApiPlatformAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = adjustTenantTokensSchema.safeParse({
    tenantId: id,
    deltaTokens: body?.deltaTokens,
    reason: body?.reason ?? "api_adjustment",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Token 调整数据无效" }, { status: 400 });
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(tenantTokenBalances)
    .where(eq(tenantTokenBalances.tenantId, parsed.data.tenantId))
    .limit(1);
  const balance = existing ?? (await db.insert(tenantTokenBalances).values({ tenantId: parsed.data.tenantId }).returning())[0];
  const nextTotal = Math.max(balance.usedTokens, balance.totalTokens + parsed.data.deltaTokens);
  const actualDelta = nextTotal - balance.totalTokens;

  const [nextBalance] = await db
    .update(tenantTokenBalances)
    .set({ totalTokens: nextTotal, updatedAt: new Date() })
    .where(eq(tenantTokenBalances.tenantId, parsed.data.tenantId))
    .returning();
  await db.insert(tokenAdjustments).values({
    tenantId: parsed.data.tenantId,
    actorUserId: auth.user.id,
    deltaTokens: actualDelta,
    reason: parsed.data.reason,
  });
  await db.insert(auditLogs).values({
    actorUserId: auth.user.id,
    tenantId: parsed.data.tenantId,
    action: "api.tenant.tokens_adjust",
    metadata: { requestedDelta: parsed.data.deltaTokens, actualDelta, nextTotal, reason: parsed.data.reason },
  });

  return NextResponse.json({ tokenBalance: nextBalance, actualDelta });
}
