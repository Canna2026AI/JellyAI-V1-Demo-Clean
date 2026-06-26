import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireApiPlatformAdmin } from "@/lib/auth/api";
import { getDb } from "@/lib/db";
import { aiModels, auditLogs } from "@/lib/db/schema";
import { updateAiModelSchema } from "@/lib/validators";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireApiPlatformAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateAiModelSchema.safeParse({
    modelId: id,
    provider: body?.provider,
    displayName: body?.displayName,
    modelIdValue: body?.modelId,
    status: body?.status,
    isDefault: body?.isDefault,
    contextWindow: body?.contextWindow,
    baseUrl: body?.baseUrl,
    apiKeyEnvName: body?.apiKeyEnvName,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "模型数据无效" }, { status: 400 });
  }

  const db = getDb();
  const [existing] = await db.select().from(aiModels).where(eq(aiModels.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "模型不存在" }, { status: 404 });
  }

  const nextStatus = parsed.data.status ?? existing.status;
  const nextIsDefault = nextStatus === "active" ? (parsed.data.isDefault ?? existing.isDefault) : false;
  if (nextIsDefault && nextStatus !== "active") {
    return NextResponse.json({ error: "停用模型不能设为默认模型" }, { status: 400 });
  }

  if (nextIsDefault) {
    await db.update(aiModels).set({ isDefault: false, updatedAt: new Date() });
  }

  const [model] = await db
    .update(aiModels)
    .set({
      provider: parsed.data.provider ?? existing.provider,
      displayName: parsed.data.displayName ?? existing.displayName,
      modelId: parsed.data.modelIdValue ?? existing.modelId,
      status: nextStatus,
      isDefault: nextIsDefault,
      contextWindow: parsed.data.contextWindow ?? existing.contextWindow,
      baseUrl: parsed.data.baseUrl ?? existing.baseUrl,
      apiKeyEnvName: parsed.data.apiKeyEnvName ?? existing.apiKeyEnvName,
      updatedAt: new Date(),
    })
    .where(eq(aiModels.id, id))
    .returning();

  await db.insert(auditLogs).values({
    actorUserId: auth.user.id,
    action: "api.ai_model.update",
    metadata: { id: model.id, provider: model.provider, modelId: model.modelId, status: model.status },
  });

  return NextResponse.json({ model });
}
