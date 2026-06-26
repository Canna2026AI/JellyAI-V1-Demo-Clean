import { count, desc, sum } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireApiPlatformAdmin } from "@/lib/auth/api";
import { getDb } from "@/lib/db";
import { aiModels, auditLogs, tokenUsageLogs } from "@/lib/db/schema";
import { createAiModelSchema } from "@/lib/validators";

export async function GET() {
  const auth = await requireApiPlatformAdmin();
  if (auth.error) return auth.error;

  const db = getDb();
  const [models, usageRows] = await Promise.all([
    db.select().from(aiModels).orderBy(desc(aiModels.isDefault), desc(aiModels.createdAt)),
    db
      .select({ modelId: tokenUsageLogs.modelId, calls: count(), tokens: sum(tokenUsageLogs.totalTokens) })
      .from(tokenUsageLogs)
      .groupBy(tokenUsageLogs.modelId),
  ]);
  const usageByModel = new Map(
    usageRows.map((row) => [row.modelId, { calls: Number(row.calls), tokens: Number(row.tokens ?? 0) }]),
  );

  return NextResponse.json({
    models: models.map((model) => ({
      ...model,
      usage: usageByModel.get(model.id) ?? { calls: 0, tokens: 0 },
      apiKeyConfigured: Boolean(process.env[model.apiKeyEnvName]),
    })),
  });
}

export async function POST(request: Request) {
  const auth = await requireApiPlatformAdmin();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const parsed = createAiModelSchema.safeParse({
    ...body,
    baseUrl: body?.baseUrl ?? process.env.MODEL_BASE_URL ?? "",
    apiKeyEnvName: body?.apiKeyEnvName ?? "MODEL_API_KEY",
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "模型数据无效" }, { status: 400 });
  }

  const db = getDb();
  if (parsed.data.isDefault) {
    await db.update(aiModels).set({ isDefault: false, updatedAt: new Date() });
  }
  const [model] = await db
    .insert(aiModels)
    .values({
      provider: parsed.data.provider,
      displayName: parsed.data.displayName,
      modelId: parsed.data.modelId,
      status: parsed.data.status,
      isDefault: parsed.data.status === "active" ? parsed.data.isDefault : false,
      contextWindow: parsed.data.contextWindow,
      baseUrl: parsed.data.baseUrl,
      apiKeyEnvName: parsed.data.apiKeyEnvName,
    })
    .returning();

  await db.insert(auditLogs).values({
    actorUserId: auth.user.id,
    action: "api.ai_model.create",
    metadata: {
      provider: model.provider,
      modelId: model.modelId,
      displayName: model.displayName,
      baseUrl: model.baseUrl,
      apiKeyEnvName: model.apiKeyEnvName,
    },
  });

  return NextResponse.json({ model }, { status: 201 });
}
