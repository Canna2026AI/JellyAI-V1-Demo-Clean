"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import {
  aiModels,
  auditLogs,
  tenantModelSettings,
  tenantRecords,
  tenants,
  tenantTokenBalances,
  tokenAdjustments,
  users,
} from "@/lib/db/schema";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import {
  adjustTenantTokensSchema,
  createAiModelSchema,
  createTenantSchema,
  createTenantUserSchema,
  resetPasswordSchema,
  selectTenantModelSchema,
  setAiModelStatusSchema,
  setDefaultAiModelSchema,
  setTenantStatusSchema,
} from "@/lib/validators";
import { demoTenantRecords } from "@/lib/demo-data";
import { DEFAULT_TENANT_TOKENS, ensureTenantModelSetting } from "@/lib/tokens";

export async function createTenant(input: {
  name: string;
  status?: "active" | "disabled";
  initializeDemoData?: boolean;
  initialTokens?: number;
}) {
  const admin = await requirePlatformAdmin();
  const parsed = createTenantSchema.parse({
    name: input.name,
    status: input.status ?? "active",
    initializeDemoData: input.initializeDemoData ?? true,
    initialTokens: input.initialTokens ?? DEFAULT_TENANT_TOKENS,
  });

  const db = getDb();
  const [tenant] = await db.insert(tenants).values({ name: parsed.name, status: parsed.status }).returning();
  await db.insert(tenantTokenBalances).values({ tenantId: tenant.id, totalTokens: parsed.initialTokens, usedTokens: 0 });
  await ensureTenantModelSetting(tenant.id);

  if (parsed.initializeDemoData) {
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
    actorUserId: admin.id,
    tenantId: tenant.id,
    action: "tenant.create",
    metadata: { name: tenant.name, initializeDemoData: parsed.initializeDemoData, initialTokens: parsed.initialTokens },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/customers");
  return tenant;
}

export async function createTenantUser(input: { tenantId: string; account: string; password: string; displayName: string }) {
  const admin = await requirePlatformAdmin();
  const parsed = createTenantUserSchema.parse(input);
  const passwordHash = await hashPassword(parsed.password);

  const db = getDb();
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, parsed.tenantId)).limit(1);
  if (!tenant) throw new Error("客户不存在");

  const [user] = await db
    .insert(users)
    .values({
      tenantId: parsed.tenantId,
      account: parsed.account,
      displayName: parsed.displayName,
      role: "tenant_user",
      status: "active",
      passwordHash,
    })
    .returning();

  await db.insert(auditLogs).values({
    actorUserId: admin.id,
    tenantId: parsed.tenantId,
    action: "tenant_user.create",
    metadata: { account: user.account, displayName: user.displayName },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${parsed.tenantId}`);
  return user;
}

export async function resetTenantUserPassword(input: { userId: string; newPassword: string }) {
  const admin = await requirePlatformAdmin();
  const parsed = resetPasswordSchema.parse(input);
  const passwordHash = await hashPassword(parsed.newPassword);

  const db = getDb();
  const [user] = await db.select().from(users).where(and(eq(users.id, parsed.userId), eq(users.role, "tenant_user"))).limit(1);
  if (!user || !user.tenantId) throw new Error("客户账号不存在");

  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, parsed.userId));
  await db.insert(auditLogs).values({
    actorUserId: admin.id,
    tenantId: user.tenantId,
    action: "tenant_user.password_reset",
    metadata: { account: user.account },
  });

  revalidatePath(`/admin/customers/${user.tenantId}`);
}

export async function setTenantStatus(input: { tenantId: string; status: "active" | "disabled" }) {
  const admin = await requirePlatformAdmin();
  const parsed = setTenantStatusSchema.parse(input);
  const db = getDb();

  await db.update(tenants).set({ status: parsed.status, updatedAt: new Date() }).where(eq(tenants.id, parsed.tenantId));
  await db.insert(auditLogs).values({
    actorUserId: admin.id,
    tenantId: parsed.tenantId,
    action: "tenant.status_update",
    metadata: { status: parsed.status },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${parsed.tenantId}`);
}

export async function createAiModel(input: {
  provider: string;
  displayName: string;
  modelId: string;
  status?: "active" | "disabled";
  isDefault?: boolean;
  contextWindow?: number;
  baseUrl?: string;
  apiKeyEnvName?: string;
}) {
  const admin = await requirePlatformAdmin();
  const parsed = createAiModelSchema.parse({
    ...input,
    status: input.status ?? "active",
    isDefault: input.isDefault ?? false,
    contextWindow: input.contextWindow ?? 0,
    baseUrl: input.baseUrl ?? process.env.MODEL_BASE_URL ?? "",
    apiKeyEnvName: input.apiKeyEnvName ?? "MODEL_API_KEY",
  });
  const db = getDb();

  if (parsed.isDefault) {
    await db.update(aiModels).set({ isDefault: false, updatedAt: new Date() });
  }

  const [model] = await db
    .insert(aiModels)
    .values({
      provider: parsed.provider,
      displayName: parsed.displayName,
      modelId: parsed.modelId,
      status: parsed.status,
      isDefault: parsed.status === "active" ? parsed.isDefault : false,
      contextWindow: parsed.contextWindow,
      baseUrl: parsed.baseUrl,
      apiKeyEnvName: parsed.apiKeyEnvName,
    })
    .returning();

  await db.insert(auditLogs).values({
    actorUserId: admin.id,
    action: "ai_model.create",
    metadata: { provider: model.provider, modelId: model.modelId, displayName: model.displayName, baseUrl: model.baseUrl },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/models");
  revalidatePath("/app");
  return model;
}

async function ensureActiveDefaultModel() {
  const db = getDb();
  const [activeDefault] = await db
    .select()
    .from(aiModels)
    .where(and(eq(aiModels.status, "active"), eq(aiModels.isDefault, true)))
    .limit(1);
  if (activeDefault) return;

  const [fallback] = await db.select().from(aiModels).where(eq(aiModels.status, "active")).orderBy(desc(aiModels.createdAt)).limit(1);
  if (fallback) {
    await db.update(aiModels).set({ isDefault: true, updatedAt: new Date() }).where(eq(aiModels.id, fallback.id));
  }
}

export async function setAiModelStatus(input: { modelId: string; status: "active" | "disabled" }) {
  const admin = await requirePlatformAdmin();
  const parsed = setAiModelStatusSchema.parse(input);
  const db = getDb();

  await db
    .update(aiModels)
    .set(
      parsed.status === "disabled"
        ? { status: parsed.status, isDefault: false, updatedAt: new Date() }
        : { status: parsed.status, updatedAt: new Date() },
    )
    .where(eq(aiModels.id, parsed.modelId));
  await ensureActiveDefaultModel();

  await db.insert(auditLogs).values({
    actorUserId: admin.id,
    action: "ai_model.status_update",
    metadata: { modelId: parsed.modelId, status: parsed.status },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/models");
  revalidatePath("/app");
}

export async function setDefaultAiModel(input: { modelId: string }) {
  const admin = await requirePlatformAdmin();
  const parsed = setDefaultAiModelSchema.parse(input);
  const db = getDb();
  const [model] = await db.select().from(aiModels).where(eq(aiModels.id, parsed.modelId)).limit(1);
  if (!model || model.status !== "active") throw new Error("只能将启用模型设为默认模型");

  await db.update(aiModels).set({ isDefault: false, updatedAt: new Date() });
  await db.update(aiModels).set({ isDefault: true, updatedAt: new Date() }).where(eq(aiModels.id, parsed.modelId));
  await db.insert(auditLogs).values({
    actorUserId: admin.id,
    action: "ai_model.default_update",
    metadata: { provider: model.provider, modelId: model.modelId, displayName: model.displayName },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/models");
  revalidatePath("/app");
}

export async function setTenantModel(input: { tenantId: string; modelId: string }) {
  const admin = await requirePlatformAdmin();
  const tenantId = String(input.tenantId);
  const parsed = selectTenantModelSchema.parse({ modelId: input.modelId });
  const db = getDb();
  const [model] = await db
    .select()
    .from(aiModels)
    .where(and(eq(aiModels.id, parsed.modelId), eq(aiModels.status, "active")))
    .limit(1);
  if (!model) throw new Error("模型不存在或未启用");

  await db
    .insert(tenantModelSettings)
    .values({ tenantId, selectedModelId: model.id, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: tenantModelSettings.tenantId,
      set: { selectedModelId: model.id, updatedAt: new Date() },
    });

  await db.insert(auditLogs).values({
    actorUserId: admin.id,
    tenantId,
    action: "tenant.model_update",
    metadata: { provider: model.provider, modelId: model.modelId, displayName: model.displayName },
  });

  revalidatePath(`/admin/customers/${tenantId}`);
  revalidatePath("/app");
}

export async function adjustTenantTokens(input: { tenantId: string; deltaTokens: number; reason?: string }) {
  const admin = await requirePlatformAdmin();
  const parsed = adjustTenantTokensSchema.parse({
    tenantId: input.tenantId,
    deltaTokens: input.deltaTokens,
    reason: input.reason ?? "manual_adjustment",
  });
  const db = getDb();

  const [existing] = await db
    .select()
    .from(tenantTokenBalances)
    .where(eq(tenantTokenBalances.tenantId, parsed.tenantId))
    .limit(1);
  const balance = existing ?? (await db.insert(tenantTokenBalances).values({ tenantId: parsed.tenantId }).returning())[0];
  const nextTotal = Math.max(balance.usedTokens, balance.totalTokens + parsed.deltaTokens);
  const actualDelta = nextTotal - balance.totalTokens;

  await db
    .update(tenantTokenBalances)
    .set({ totalTokens: nextTotal, updatedAt: new Date() })
    .where(eq(tenantTokenBalances.tenantId, parsed.tenantId));
  await db.insert(tokenAdjustments).values({
    tenantId: parsed.tenantId,
    actorUserId: admin.id,
    deltaTokens: actualDelta,
    reason: parsed.reason,
  });
  await db.insert(auditLogs).values({
    actorUserId: admin.id,
    tenantId: parsed.tenantId,
    action: "tenant.tokens_adjust",
    metadata: { requestedDelta: parsed.deltaTokens, actualDelta, reason: parsed.reason, nextTotal },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${parsed.tenantId}`);
  revalidatePath("/app");
}

export async function createTenantFromForm(formData: FormData) {
  await createTenant({
    name: String(formData.get("name") ?? ""),
    status: String(formData.get("status") ?? "active") as "active" | "disabled",
    initializeDemoData: formData.get("initializeDemoData") === "on",
    initialTokens: Number(formData.get("initialTokens") ?? DEFAULT_TENANT_TOKENS),
  });
}

export async function createTenantUserFromForm(formData: FormData) {
  await createTenantUser({
    tenantId: String(formData.get("tenantId") ?? ""),
    account: String(formData.get("account") ?? ""),
    password: String(formData.get("password") ?? ""),
    displayName: String(formData.get("displayName") ?? ""),
  });
}

export async function resetTenantUserPasswordFromForm(formData: FormData) {
  await resetTenantUserPassword({
    userId: String(formData.get("userId") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
  });
}

export async function setTenantStatusFromForm(formData: FormData) {
  await setTenantStatus({
    tenantId: String(formData.get("tenantId") ?? ""),
    status: String(formData.get("status") ?? "active") as "active" | "disabled",
  });
}

export async function createAiModelFromForm(formData: FormData) {
  await createAiModel({
    provider: String(formData.get("provider") ?? ""),
    displayName: String(formData.get("displayName") ?? ""),
    modelId: String(formData.get("modelId") ?? ""),
    status: String(formData.get("status") ?? "active") as "active" | "disabled",
    isDefault: formData.get("isDefault") === "on",
    contextWindow: Number(formData.get("contextWindow") ?? 0),
    baseUrl: String(formData.get("baseUrl") ?? ""),
    apiKeyEnvName: String(formData.get("apiKeyEnvName") ?? "MODEL_API_KEY"),
  });
}

export async function setAiModelStatusFromForm(formData: FormData) {
  await setAiModelStatus({
    modelId: String(formData.get("modelId") ?? ""),
    status: String(formData.get("status") ?? "active") as "active" | "disabled",
  });
}

export async function setDefaultAiModelFromForm(formData: FormData) {
  await setDefaultAiModel({
    modelId: String(formData.get("modelId") ?? ""),
  });
}

export async function setTenantModelFromForm(formData: FormData) {
  await setTenantModel({
    tenantId: String(formData.get("tenantId") ?? ""),
    modelId: String(formData.get("modelId") ?? ""),
  });
}

export async function adjustTenantTokensFromForm(formData: FormData) {
  await adjustTenantTokens({
    tenantId: String(formData.get("tenantId") ?? ""),
    deltaTokens: Number(formData.get("deltaTokens") ?? 0),
    reason: String(formData.get("reason") ?? "manual_adjustment"),
  });
}
