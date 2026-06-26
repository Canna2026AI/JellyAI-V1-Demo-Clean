import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  aiModels,
  tenantModelSettings,
  tenantRecords,
  tenantTokenBalances,
  tokenUsageLogs,
  type AiModel,
  type TenantTokenBalance,
} from "@/lib/db/schema";

export const DEFAULT_TENANT_TOKENS = 10000;

export function estimateMessageTokens(message: string) {
  const promptTokens = Math.max(1, Math.ceil(message.trim().length / 2));
  const completionTokens = Math.max(32, Math.ceil(promptTokens * 0.45));
  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
  };
}

export async function ensureTenantTokenBalance(tenantId: string, initialTokens = DEFAULT_TENANT_TOKENS) {
  const db = getDb();
  await db
    .insert(tenantTokenBalances)
    .values({ tenantId, totalTokens: initialTokens, usedTokens: 0 })
    .onConflictDoNothing();

  const [balance] = await db.select().from(tenantTokenBalances).where(eq(tenantTokenBalances.tenantId, tenantId)).limit(1);
  return balance;
}

export async function getActiveAiModels() {
  return getDb().select().from(aiModels).where(eq(aiModels.status, "active")).orderBy(desc(aiModels.isDefault), aiModels.createdAt);
}

export async function getDefaultAiModel() {
  const [defaultModel] = await getDb()
    .select()
    .from(aiModels)
    .where(and(eq(aiModels.status, "active"), eq(aiModels.isDefault, true)))
    .limit(1);

  if (defaultModel) return defaultModel;

  const [fallback] = await getDb().select().from(aiModels).where(eq(aiModels.status, "active")).orderBy(aiModels.createdAt).limit(1);
  return fallback ?? null;
}

export async function getTenantSelectedModel(tenantId: string): Promise<AiModel | null> {
  const db = getDb();
  const [selected] = await db
    .select({ model: aiModels })
    .from(tenantModelSettings)
    .innerJoin(aiModels, eq(aiModels.id, tenantModelSettings.selectedModelId))
    .where(and(eq(tenantModelSettings.tenantId, tenantId), eq(aiModels.status, "active")))
    .limit(1);

  if (selected?.model) return selected.model;
  return getDefaultAiModel();
}

export async function ensureTenantModelSetting(tenantId: string) {
  const model = await getDefaultAiModel();
  if (!model) return null;

  await getDb()
    .insert(tenantModelSettings)
    .values({ tenantId, selectedModelId: model.id })
    .onConflictDoNothing();

  return getTenantSelectedModel(tenantId);
}

export function getRemainingTokens(balance: Pick<TenantTokenBalance, "totalTokens" | "usedTokens"> | undefined | null) {
  if (!balance) return 0;
  return Math.max(0, balance.totalTokens - balance.usedTokens);
}

export async function consumeTenantTokens(input: {
  tenantId: string;
  userId: string;
  message: string;
  model: AiModel;
}) {
  const usage = estimateMessageTokens(input.message);
  const db = getDb();

  return db.transaction(async (tx) => {
    await tx
      .insert(tenantTokenBalances)
      .values({ tenantId: input.tenantId, totalTokens: DEFAULT_TENANT_TOKENS, usedTokens: 0 })
      .onConflictDoNothing();

    const [balance] = await tx
      .select()
      .from(tenantTokenBalances)
      .where(eq(tenantTokenBalances.tenantId, input.tenantId))
      .limit(1);

    if (!balance) throw new Error("Token 余额不存在");
    if (getRemainingTokens(balance) < usage.totalTokens) {
      throw new Error("Token 余额不足，请联系平台管理员增加额度");
    }

    const [log] = await tx
      .insert(tokenUsageLogs)
      .values({
        tenantId: input.tenantId,
        userId: input.userId,
        modelId: input.model.id,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        totalTokens: usage.totalTokens,
        action: "chat.message",
        metadata: {
          provider: input.model.provider,
          modelId: input.model.modelId,
          messagePreview: input.message.slice(0, 120),
        },
      })
      .returning();

    await tx
      .update(tenantTokenBalances)
      .set({
        usedTokens: sql`${tenantTokenBalances.usedTokens} + ${usage.totalTokens}`,
        updatedAt: new Date(),
      })
      .where(eq(tenantTokenBalances.tenantId, input.tenantId));

    await tx.insert(tenantRecords).values({
      tenantId: input.tenantId,
      module: "conversations",
      recordType: "chat_message",
      payload: {
        message: input.message,
        model: input.model.displayName,
        provider: input.model.provider,
        tokenUsage: usage.totalTokens,
      },
    });

    return log;
  });
}
