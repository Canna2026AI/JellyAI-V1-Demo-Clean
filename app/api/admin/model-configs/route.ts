import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireApiPlatformAdmin } from "@/lib/auth/api";
import { getDb } from "@/lib/db";
import { aiModels, auditLogs, modelConfigs } from "@/lib/db/schema";

export async function GET() {
  const auth = await requireApiPlatformAdmin();
  if (auth.error) return auth.error;

  const configs = await getDb().select().from(modelConfigs).orderBy(desc(modelConfigs.isDefault), desc(modelConfigs.updatedAt));
  return NextResponse.json({
    modelConfigs: configs.map((config) => ({
      ...config,
      apiKeyConfigured: Boolean(process.env[config.apiKeyEnvName]),
    })),
  });
}

export async function PATCH(request: Request) {
  const auth = await requireApiPlatformAdmin();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const id = String(body?.id ?? "");
  if (!id) {
    return NextResponse.json({ error: "model config id 必填" }, { status: 400 });
  }

  const db = getDb();
  const [existing] = await db.select().from(modelConfigs).where(eq(modelConfigs.id, id)).limit(1);
  if (!existing) {
    return NextResponse.json({ error: "模型配置不存在" }, { status: 404 });
  }
  if (body?.isDefault === true) {
    await db.update(modelConfigs).set({ isDefault: false, updatedAt: new Date() });
    await db.update(aiModels).set({ isDefault: false, updatedAt: new Date() });
  }

  const next = {
    provider: body?.provider === undefined ? existing.provider : String(body.provider),
    displayName: body?.displayName === undefined ? existing.displayName : String(body.displayName),
    modelId: body?.modelId === undefined ? existing.modelId : String(body.modelId),
    status: body?.status === undefined ? existing.status : String(body.status),
    isDefault: body?.isDefault === undefined ? existing.isDefault : Boolean(body.isDefault),
    baseUrl: body?.baseUrl === undefined ? existing.baseUrl : String(body.baseUrl),
    apiKeyEnvName: body?.apiKeyEnvName === undefined ? existing.apiKeyEnvName : String(body.apiKeyEnvName),
    updatedAt: new Date(),
  };

  const [config] = await db.update(modelConfigs).set(next).where(eq(modelConfigs.id, id)).returning();
  if (existing.aiModelId) {
    await db
      .update(aiModels)
      .set({
        provider: next.provider,
        displayName: next.displayName,
        modelId: next.modelId,
        status: next.status,
        isDefault: next.status === "active" ? next.isDefault : false,
        baseUrl: next.baseUrl,
        apiKeyEnvName: next.apiKeyEnvName,
        updatedAt: new Date(),
      })
      .where(eq(aiModels.id, existing.aiModelId));
  }

  await db.insert(auditLogs).values({
    actorUserId: auth.user.id,
    tenantId: config.tenantId,
    action: "model_config.update",
    metadata: { id: config.id, provider: config.provider, modelId: config.modelId, status: config.status },
  });

  return NextResponse.json({ modelConfig: config });
}
