"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { aiModels, auditLogs, tenantModelSettings } from "@/lib/db/schema";
import { requireTenantUser } from "@/lib/auth/session";
import { consumeTenantTokens, getTenantSelectedModel } from "@/lib/tokens";
import { selectTenantModelSchema, sendTenantMessageSchema } from "@/lib/validators";

export async function selectTenantModelFromForm(formData: FormData) {
  const user = await requireTenantUser();
  const parsed = selectTenantModelSchema.parse({
    modelId: String(formData.get("modelId") ?? ""),
  });
  const db = getDb();
  const [model] = await db
    .select()
    .from(aiModels)
    .where(and(eq(aiModels.id, parsed.modelId), eq(aiModels.status, "active")))
    .limit(1);
  if (!model) throw new Error("模型不存在或未启用");

  await db
    .insert(tenantModelSettings)
    .values({ tenantId: user.tenantId, selectedModelId: model.id, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: tenantModelSettings.tenantId,
      set: { selectedModelId: model.id, updatedAt: new Date() },
    });

  await db.insert(auditLogs).values({
    actorUserId: user.id,
    tenantId: user.tenantId,
    action: "tenant.model_self_select",
    metadata: { provider: model.provider, modelId: model.modelId, displayName: model.displayName },
  });

  revalidatePath("/app");
  revalidatePath("/api/app/bootstrap");
}

export async function sendTenantMessageFromForm(formData: FormData) {
  const user = await requireTenantUser();
  const parsed = sendTenantMessageSchema.parse({
    message: String(formData.get("message") ?? ""),
  });
  const model = await getTenantSelectedModel(user.tenantId);
  if (!model) throw new Error("暂无可用模型，请联系平台管理员配置模型");

  const log = await consumeTenantTokens({
    tenantId: user.tenantId,
    userId: user.id,
    model,
    message: parsed.message,
  });

  await getDb().insert(auditLogs).values({
    actorUserId: user.id,
    tenantId: user.tenantId,
    action: "tenant.chat_message",
    metadata: { model: model.displayName, totalTokens: log.totalTokens },
  });

  revalidatePath("/app");
  revalidatePath("/admin");
  revalidatePath("/admin/customers");
  revalidatePath("/api/app/bootstrap");
}
