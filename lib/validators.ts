import { z } from "zod";

export const loginSchema = z.object({
  account: z.string().trim().min(1, "请输入账号"),
  password: z.string().min(1, "请输入密码"),
});

export const createTenantSchema = z.object({
  name: z.string().trim().min(2, "客户名称至少 2 个字符"),
  status: z.enum(["active", "disabled"]).default("active"),
  initializeDemoData: z.boolean().default(true),
  initialTokens: z.coerce.number().int().min(0).max(100_000_000).default(10000),
});

export const createTenantUserSchema = z.object({
  tenantId: z.string().uuid(),
  account: z.string().trim().min(3, "账号至少 3 个字符"),
  password: z.string().min(8, "密码至少 8 个字符"),
  displayName: z.string().trim().min(1, "请输入姓名"),
});

export const resetPasswordSchema = z.object({
  userId: z.string().uuid(),
  newPassword: z.string().min(8, "密码至少 8 个字符"),
});

export const setTenantStatusSchema = z.object({
  tenantId: z.string().uuid(),
  status: z.enum(["active", "disabled"]),
});

export const createAiModelSchema = z.object({
  provider: z.string().trim().min(1, "请输入模型供应商"),
  displayName: z.string().trim().min(1, "请输入模型名称"),
  modelId: z.string().trim().min(1, "请输入模型 ID"),
  status: z.enum(["active", "disabled"]).default("active"),
  isDefault: z.boolean().default(false),
  contextWindow: z.coerce.number().int().min(0).max(10_000_000).default(0),
  baseUrl: z.string().trim().max(500).default(""),
  apiKeyEnvName: z.string().trim().min(1).max(100).default("MODEL_API_KEY"),
});

export const setAiModelStatusSchema = z.object({
  modelId: z.string().uuid(),
  status: z.enum(["active", "disabled"]),
});

export const setDefaultAiModelSchema = z.object({
  modelId: z.string().uuid(),
});

export const updateAiModelSchema = z.object({
  modelId: z.string().uuid(),
  provider: z.string().trim().min(1).optional(),
  displayName: z.string().trim().min(1).optional(),
  modelIdValue: z.string().trim().min(1).optional(),
  status: z.enum(["active", "disabled"]).optional(),
  isDefault: z.boolean().optional(),
  contextWindow: z.coerce.number().int().min(0).max(10_000_000).optional(),
  baseUrl: z.string().trim().max(500).optional(),
  apiKeyEnvName: z.string().trim().min(1).max(100).optional(),
});

export const adjustTenantTokensSchema = z.object({
  tenantId: z.string().uuid(),
  deltaTokens: z.coerce.number().int().min(-100_000_000).max(100_000_000),
  reason: z.string().trim().min(1).max(200).default("manual_adjustment"),
});

export const selectTenantModelSchema = z.object({
  modelId: z.string().uuid(),
});

export const sendTenantMessageSchema = z.object({
  message: z.string().trim().min(1, "请输入对话内容").max(4000, "单次消息不能超过 4000 字"),
});

export const tenantRecordSchema = z.object({
  module: z.string().trim().min(1),
  recordType: z.string().trim().min(1),
  payload: z.record(z.string(), z.unknown()).default({}),
});
