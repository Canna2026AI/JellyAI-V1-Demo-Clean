import { boolean, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index("tenants_status_idx").on(table.status),
  }),
);

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    status: text("status").notNull().default("active"),
    plan: text("plan").notNull().default("local_demo"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index("organizations_tenant_idx").on(table.tenantId),
    tenantSlugIdx: uniqueIndex("organizations_tenant_slug_idx").on(table.tenantId, table.slug),
    statusIdx: index("organizations_status_idx").on(table.status),
  }),
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
    account: text("account").notNull(),
    displayName: text("display_name").notNull(),
    role: text("role").notNull(),
    status: text("status").notNull().default("active"),
    passwordHash: text("password_hash").notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    accountIdx: uniqueIndex("users_account_idx").on(table.account),
    tenantIdx: index("users_tenant_idx").on(table.tenantId),
    roleIdx: index("users_role_idx").on(table.role),
    statusIdx: index("users_status_idx").on(table.status),
  }),
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    contactName: text("contact_name").notNull().default(""),
    contactEmail: text("contact_email").notNull().default(""),
    contactPhone: text("contact_phone").notNull().default(""),
    source: text("source").notNull().default("local_demo"),
    status: text("status").notNull().default("active"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index("customers_tenant_idx").on(table.tenantId),
    organizationIdx: index("customers_organization_idx").on(table.organizationId),
    statusIdx: index("customers_status_idx").on(table.status),
  }),
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tokenIdx: uniqueIndex("sessions_token_hash_idx").on(table.tokenHash),
    userIdx: index("sessions_user_idx").on(table.userId),
    expiresIdx: index("sessions_expires_idx").on(table.expiresAt),
  }),
);

export const tenantRecords = pgTable(
  "tenant_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    module: text("module").notNull(),
    recordType: text("record_type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantModuleIdx: index("tenant_records_tenant_module_idx").on(table.tenantId, table.module),
    recordTypeIdx: index("tenant_records_type_idx").on(table.recordType),
  }),
);

export const aiModels = pgTable(
  "ai_models",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    provider: text("provider").notNull(),
    displayName: text("display_name").notNull(),
    modelId: text("model_id").notNull(),
    status: text("status").notNull().default("active"),
    isDefault: boolean("is_default").notNull().default(false),
    contextWindow: integer("context_window").notNull().default(0),
    baseUrl: text("base_url").notNull().default(""),
    apiKeyEnvName: text("api_key_env_name").notNull().default("MODEL_API_KEY"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    providerModelIdx: uniqueIndex("ai_models_provider_model_idx").on(table.provider, table.modelId),
    statusIdx: index("ai_models_status_idx").on(table.status),
    defaultIdx: index("ai_models_default_idx").on(table.isDefault),
  }),
);

export const tenantModelSettings = pgTable(
  "tenant_model_settings",
  {
    tenantId: uuid("tenant_id")
      .primaryKey()
      .references(() => tenants.id, { onDelete: "cascade" }),
    selectedModelId: uuid("selected_model_id").references(() => aiModels.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    selectedModelIdx: index("tenant_model_settings_selected_model_idx").on(table.selectedModelId),
  }),
);

export const modelConfigs = pgTable(
  "model_configs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
    aiModelId: uuid("ai_model_id").references(() => aiModels.id, { onDelete: "set null" }),
    provider: text("provider").notNull(),
    displayName: text("display_name").notNull(),
    modelId: text("model_id").notNull(),
    status: text("status").notNull().default("active"),
    isDefault: boolean("is_default").notNull().default(false),
    baseUrl: text("base_url").notNull().default(""),
    apiKeyEnvName: text("api_key_env_name").notNull().default("MODEL_API_KEY"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index("model_configs_tenant_idx").on(table.tenantId),
    aiModelIdx: index("model_configs_ai_model_idx").on(table.aiModelId),
    providerModelIdx: index("model_configs_provider_model_idx").on(table.provider, table.modelId),
    statusIdx: index("model_configs_status_idx").on(table.status),
  }),
);

export const tenantTokenBalances = pgTable("tenant_token_balances", {
  tenantId: uuid("tenant_id")
    .primaryKey()
    .references(() => tenants.id, { onDelete: "cascade" }),
  totalTokens: integer("total_tokens").notNull().default(10000),
  usedTokens: integer("used_tokens").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tokenUsageLogs = pgTable(
  "token_usage_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    modelId: uuid("model_id").references(() => aiModels.id, { onDelete: "set null" }),
    promptTokens: integer("prompt_tokens").notNull(),
    completionTokens: integer("completion_tokens").notNull(),
    totalTokens: integer("total_tokens").notNull(),
    action: text("action").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index("token_usage_logs_tenant_idx").on(table.tenantId),
    userIdx: index("token_usage_logs_user_idx").on(table.userId),
    modelIdx: index("token_usage_logs_model_idx").on(table.modelId),
  }),
);

export const tokenUsage = pgTable(
  "token_usage",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    modelConfigId: uuid("model_config_id").references(() => modelConfigs.id, { onDelete: "set null" }),
    modelName: text("model_name").notNull().default("local-mock-model"),
    promptTokens: integer("prompt_tokens").notNull().default(0),
    completionTokens: integer("completion_tokens").notNull().default(0),
    totalTokens: integer("total_tokens").notNull().default(0),
    action: text("action").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index("token_usage_tenant_idx").on(table.tenantId),
    userIdx: index("token_usage_user_idx").on(table.userId),
    modelConfigIdx: index("token_usage_model_config_idx").on(table.modelConfigId),
    actionIdx: index("token_usage_action_idx").on(table.action),
  }),
);

export const tokenAdjustments = pgTable(
  "token_adjustments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    deltaTokens: integer("delta_tokens").notNull(),
    reason: text("reason").notNull().default("manual_adjustment"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index("token_adjustments_tenant_idx").on(table.tenantId),
    actorIdx: index("token_adjustments_actor_idx").on(table.actorUserId),
  }),
);

export const channels = pgTable(
  "channels",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    provider: text("provider").notNull(),
    category: text("category").notNull().default("社交媒体"),
    status: text("status").notNull().default("未接入"),
    accountCount: integer("account_count").notNull().default(0),
    description: text("description").notNull().default(""),
    config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index("channels_tenant_idx").on(table.tenantId),
    tenantProviderIdx: uniqueIndex("channels_tenant_provider_idx").on(table.tenantId, table.provider),
    statusIdx: index("channels_status_idx").on(table.status),
    categoryIdx: index("channels_category_idx").on(table.category),
  }),
);

export const wecomAccounts = pgTable(
  "wecom_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    channelId: uuid("channel_id").references(() => channels.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    accountId: text("account_id").notNull(),
    instanceId: text("instance_id").notNull().default("local-instance"),
    status: text("status").notNull().default("待扫码"),
    groupName: text("group_name").notNull().default("默认小组"),
    assistantName: text("assistant_name").notNull().default("未绑定"),
    messageEnabled: boolean("message_enabled").notNull().default(false),
    aiEnabled: boolean("ai_enabled").notNull().default(false),
    heartbeat: text("heartbeat").notNull().default("-"),
    settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index("wecom_accounts_tenant_idx").on(table.tenantId),
    channelIdx: index("wecom_accounts_channel_idx").on(table.channelId),
    tenantAccountIdx: uniqueIndex("wecom_accounts_tenant_account_idx").on(table.tenantId, table.accountId),
    statusIdx: index("wecom_accounts_status_idx").on(table.status),
  }),
);

export const agents = pgTable(
  "agents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    status: text("status").notNull().default("active"),
    model: text("model").notNull().default("local-mock-model"),
    prompt: text("prompt").notNull().default(""),
    channel: text("channel").notNull().default("通用"),
    tools: jsonb("tools").$type<string[]>().notNull().default([]),
    knowledgeBaseIds: jsonb("knowledge_base_ids").$type<string[]>().notNull().default([]),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index("agents_tenant_idx").on(table.tenantId),
    tenantNameIdx: uniqueIndex("agents_tenant_name_idx").on(table.tenantId, table.name),
    statusIdx: index("agents_status_idx").on(table.status),
  }),
);

export const knowledgeBases = pgTable(
  "knowledge_bases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    kind: text("kind").notNull().default("multimodal"),
    status: text("status").notNull().default("active"),
    documentCount: integer("document_count").notNull().default(0),
    vectorCount: integer("vector_count").notNull().default(0),
    storagePath: text("storage_path").notNull().default(""),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index("knowledge_bases_tenant_idx").on(table.tenantId),
    tenantNameIdx: uniqueIndex("knowledge_bases_tenant_name_idx").on(table.tenantId, table.name),
    statusIdx: index("knowledge_bases_status_idx").on(table.status),
  }),
);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    customerName: text("customer_name").notNull(),
    channel: text("channel").notNull().default("企业微信"),
    status: text("status").notNull().default("AI对话"),
    assignedTo: text("assigned_to").notNull().default("AI"),
    agentId: uuid("agent_id").references(() => agents.id, { onDelete: "set null" }),
    lastMessage: text("last_message").notNull().default(""),
    priority: text("priority").notNull().default("normal"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index("conversations_tenant_idx").on(table.tenantId),
    agentIdx: index("conversations_agent_idx").on(table.agentId),
    statusIdx: index("conversations_status_idx").on(table.status),
    channelIdx: index("conversations_channel_idx").on(table.channel),
  }),
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderType: text("sender_type").notNull(),
    senderName: text("sender_name").notNull().default(""),
    body: text("body").notNull(),
    tokenUsageId: uuid("token_usage_id").references(() => tokenUsage.id, { onDelete: "set null" }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index("messages_tenant_idx").on(table.tenantId),
    conversationIdx: index("messages_conversation_idx").on(table.conversationId),
    senderTypeIdx: index("messages_sender_type_idx").on(table.senderType),
  }),
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    tenantIdx: index("audit_logs_tenant_idx").on(table.tenantId),
    actorIdx: index("audit_logs_actor_idx").on(table.actorUserId),
    actionIdx: index("audit_logs_action_idx").on(table.action),
  }),
);

export type Tenant = typeof tenants.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type TenantRecord = typeof tenantRecords.$inferSelect;
export type AiModel = typeof aiModels.$inferSelect;
export type TenantModelSetting = typeof tenantModelSettings.$inferSelect;
export type ModelConfig = typeof modelConfigs.$inferSelect;
export type TenantTokenBalance = typeof tenantTokenBalances.$inferSelect;
export type TokenUsageLog = typeof tokenUsageLogs.$inferSelect;
export type TokenUsage = typeof tokenUsage.$inferSelect;
export type TokenAdjustment = typeof tokenAdjustments.$inferSelect;
export type Channel = typeof channels.$inferSelect;
export type WecomAccount = typeof wecomAccounts.$inferSelect;
export type Agent = typeof agents.$inferSelect;
export type KnowledgeBase = typeof knowledgeBases.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;

export type UserRole = "platform_admin" | "tenant_user";
export type AccountStatus = "active" | "disabled";
