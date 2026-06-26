import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import { getDb, closeDb } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import {
  agents,
  aiModels,
  auditLogs,
  channels,
  conversations,
  customers,
  knowledgeBases,
  messages,
  modelConfigs,
  organizations,
  tenantModelSettings,
  tenantRecords,
  tenants,
  tenantTokenBalances,
  tokenUsage,
  tokenUsageLogs,
  users,
  wecomAccounts,
} from "@/lib/db/schema";
import { DEFAULT_TENANT_TOKENS } from "@/lib/tokens";

config({ path: ".env.local" });
config();

async function main() {
  const account = process.env.ADMIN_EMAIL ?? process.env.SEED_ADMIN_ACCOUNT;
  const password = process.env.ADMIN_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD;
  const tenantAccount = process.env.TENANT_EMAIL ?? process.env.SEED_TENANT_ACCOUNT ?? "tenant@jellyai.local";
  const tenantPassword = process.env.TENANT_PASSWORD ?? process.env.SEED_TENANT_PASSWORD ?? password;
  const demoTenantName = process.env.SEED_TENANT_NAME ?? "欧诚国际物流";

  if (!account || !password || !tenantPassword) {
    throw new Error("ADMIN_EMAIL, ADMIN_PASSWORD and TENANT_PASSWORD are required.");
  }
  if (password.length < 8 || tenantPassword.length < 8) {
    throw new Error("Seed passwords must be at least 8 characters.");
  }

  const db = getDb();
  const passwordHash = await hashPassword(password);
  const [existing] = await db.select().from(users).where(eq(users.account, account)).limit(1);

  if (existing) {
    await db
      .update(users)
      .set({
        tenantId: null,
        role: "platform_admin",
        status: "active",
        displayName: existing.displayName || "平台管理员",
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));
    console.log(`Updated platform admin: ${account}`);
  } else {
    const [admin] = await db
      .insert(users)
      .values({
        account,
        displayName: "平台管理员",
        role: "platform_admin",
        status: "active",
        passwordHash,
      })
      .returning();
    await db.insert(auditLogs).values({
      actorUserId: admin.id,
      action: "platform_admin.seed",
      metadata: { account },
    });
    console.log(`Created platform admin: ${account}`);
  }

  let [model] = await db
    .select()
    .from(aiModels)
    .where(and(eq(aiModels.provider, "doubao"), eq(aiModels.modelId, "doubao-seed-1-6")))
    .limit(1);
  if (!model) {
    [model] = await db
      .insert(aiModels)
      .values({
        provider: "doubao",
        displayName: "豆包 Seed 1.6",
        modelId: "doubao-seed-1-6",
        status: "active",
        isDefault: true,
        contextWindow: 256000,
        baseUrl: process.env.MODEL_BASE_URL ?? "https://ark.cn-beijing.volces.com/api/v3",
        apiKeyEnvName: "MODEL_API_KEY",
      })
      .returning();
  }

  const [existingModelConfig] = await db
    .select()
    .from(modelConfigs)
    .where(and(eq(modelConfigs.provider, model.provider), eq(modelConfigs.modelId, model.modelId)))
    .limit(1);
  if (existingModelConfig) {
    await db
      .update(modelConfigs)
      .set({
        aiModelId: model.id,
        displayName: model.displayName,
        status: model.status,
        isDefault: model.isDefault,
        baseUrl: model.baseUrl,
        apiKeyEnvName: model.apiKeyEnvName,
        updatedAt: new Date(),
      })
      .where(eq(modelConfigs.id, existingModelConfig.id));
  } else {
    await db.insert(modelConfigs).values({
      aiModelId: model.id,
      provider: model.provider,
      displayName: model.displayName,
      modelId: model.modelId,
      status: model.status,
      isDefault: model.isDefault,
      baseUrl: model.baseUrl,
      apiKeyEnvName: model.apiKeyEnvName,
      metadata: { source: "seed-admin" },
    });
  }

  let [tenant] = await db.select().from(tenants).where(eq(tenants.name, demoTenantName)).limit(1);
  if (!tenant) {
    [tenant] = await db.insert(tenants).values({ name: demoTenantName, status: "active" }).returning();
    console.log(`Created demo tenant: ${demoTenantName}`);
  } else if (tenant.status !== "active") {
    [tenant] = await db.update(tenants).set({ status: "active", updatedAt: new Date() }).where(eq(tenants.id, tenant.id)).returning();
  }

  await db
    .insert(tenantTokenBalances)
    .values({ tenantId: tenant.id, totalTokens: DEFAULT_TENANT_TOKENS, usedTokens: 0 })
    .onConflictDoNothing();
  await db
    .insert(tenantModelSettings)
    .values({ tenantId: tenant.id, selectedModelId: model.id })
    .onConflictDoUpdate({
      target: tenantModelSettings.tenantId,
      set: { selectedModelId: model.id, updatedAt: new Date() },
    });

  const tenantPasswordHash = await hashPassword(tenantPassword);
  const [existingTenantUser] = await db.select().from(users).where(eq(users.account, tenantAccount)).limit(1);
  if (existingTenantUser) {
    await db
      .update(users)
      .set({
        tenantId: tenant.id,
        role: "tenant_user",
        status: "active",
        displayName: existingTenantUser.displayName || "Kelvin",
        passwordHash: tenantPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existingTenantUser.id));
    console.log(`Updated demo tenant user: ${tenantAccount}`);
  } else {
    await db.insert(users).values({
      tenantId: tenant.id,
      account: tenantAccount,
      displayName: "Kelvin",
      role: "tenant_user",
      status: "active",
      passwordHash: tenantPasswordHash,
    });
    console.log(`Created demo tenant user: ${tenantAccount}`);
  }

  let [organization] = await db.select().from(organizations).where(eq(organizations.tenantId, tenant.id)).limit(1);
  if (!organization) {
    [organization] = await db
      .insert(organizations)
      .values({
        tenantId: tenant.id,
        name: demoTenantName,
        slug: "demo-logistics",
        status: "active",
        plan: "local_demo",
        metadata: { source: "seed-admin" },
      })
      .returning();
  }

  const customerRows = [
    { name: "Canna郑", contactName: "Canna郑", contactPhone: "13900139002", source: "企业微信", status: "active" },
    { name: "演示联系人", contactName: "演示联系人", contactPhone: "13700137003", source: "网站页面", status: "active" },
  ];
  for (const row of customerRows) {
    const [existingCustomer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.tenantId, tenant.id), eq(customers.name, row.name)))
      .limit(1);
    if (existingCustomer) {
      await db.update(customers).set({ ...row, organizationId: organization.id, updatedAt: new Date() }).where(eq(customers.id, existingCustomer.id));
    } else {
      await db.insert(customers).values({ ...row, tenantId: tenant.id, organizationId: organization.id, metadata: { source: "seed-admin" } });
    }
  }

  const channelRows = [
    {
      provider: "wecom-hosting",
      name: "企业微信代运营(私聊/群聊)",
      category: "社交媒体",
      status: "已接入",
      accountCount: 1,
      description: "托管企业微信客户端到 JellyAI 云端，统一承接私聊、群聊、AI 回复和人工协作。",
    },
    {
      provider: "web-widget",
      name: "Web页面",
      category: "网站/小程序",
      status: "未接入",
      accountCount: 0,
      description: "在官网、落地页或产品页面嵌入在线客服浮窗，承接访客咨询。",
    },
  ];
  let wecomChannelId: string | null = null;
  for (const row of channelRows) {
    const [existingChannel] = await db
      .select()
      .from(channels)
      .where(and(eq(channels.tenantId, tenant.id), eq(channels.provider, row.provider)))
      .limit(1);
    const values = { ...row, tenantId: tenant.id, config: { source: "seed-admin" }, lastSyncAt: new Date() };
    const [savedChannel] = existingChannel
      ? await db.update(channels).set({ ...values, updatedAt: new Date() }).where(eq(channels.id, existingChannel.id)).returning()
      : await db.insert(channels).values(values).returning();
    if (row.provider === "wecom-hosting") wecomChannelId = savedChannel.id;
  }

  const [existingWecom] = await db
    .select()
    .from(wecomAccounts)
    .where(and(eq(wecomAccounts.tenantId, tenant.id), eq(wecomAccounts.accountId, "ZhuLi01")))
    .limit(1);
  const wecomValues = {
    tenantId: tenant.id,
    channelId: wecomChannelId,
    name: "测试",
    accountId: "ZhuLi01",
    instanceId: "65efc4ad2cb38280fa3f12a5",
    status: "在线",
    groupName: "销售一组",
    assistantName: "物流客服助手",
    messageEnabled: true,
    aiEnabled: true,
    heartbeat: "刚刚",
    settings: { mode: "mock-local", todo: "真实 RPA 托管待接入" },
  };
  if (existingWecom) {
    await db.update(wecomAccounts).set({ ...wecomValues, updatedAt: new Date() }).where(eq(wecomAccounts.id, existingWecom.id));
  } else {
    await db.insert(wecomAccounts).values(wecomValues);
  }

  let [knowledge] = await db
    .select()
    .from(knowledgeBases)
    .where(and(eq(knowledgeBases.tenantId, tenant.id), eq(knowledgeBases.name, "物流问答")))
    .limit(1);
  if (knowledge) {
    [knowledge] = await db
      .update(knowledgeBases)
      .set({ documentCount: 3, vectorCount: 1280, status: "active", updatedAt: new Date() })
      .where(eq(knowledgeBases.id, knowledge.id))
      .returning();
  } else {
    [knowledge] = await db
      .insert(knowledgeBases)
      .values({
        tenantId: tenant.id,
        name: "物流问答",
        description: "欧洲海运、派送时效、报价规则演示知识库。",
        kind: "多模态",
        status: "active",
        documentCount: 3,
        vectorCount: 1280,
        storagePath: "storage/knowledge/uploads",
        metadata: { source: "seed-admin", vectorStore: "mock" },
      })
      .returning();
  }

  let [agent] = await db.select().from(agents).where(and(eq(agents.tenantId, tenant.id), eq(agents.name, "物流客服助手"))).limit(1);
  const agentValues = {
    tenantId: tenant.id,
    name: "物流客服助手",
    description: "面向跨境物流咨询的 AI 智能体，可回答报价、时效和转人工问题。",
    status: "active",
    model: model.displayName,
    prompt: "基于物流问答知识库回答客户问题，缺少报价字段时先收集国家、城市、重量和件数。",
    channel: "企业微信",
    tools: ["转人工服务", "企业微信消息发送", "知识库检索"],
    knowledgeBaseIds: [knowledge.id],
    metadata: { source: "seed-admin" },
  };
  if (agent) {
    [agent] = await db.update(agents).set({ ...agentValues, updatedAt: new Date() }).where(eq(agents.id, agent.id)).returning();
  } else {
    [agent] = await db.insert(agents).values(agentValues).returning();
  }

  let [conversation] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.tenantId, tenant.id), eq(conversations.customerName, "Canna郑")))
    .limit(1);
  if (!conversation) {
    [conversation] = await db
      .insert(conversations)
      .values({
        tenantId: tenant.id,
        customerName: "Canna郑",
        channel: "企业微信",
        status: "AI对话",
        assignedTo: "AI",
        agentId: agent.id,
        lastMessage: "50kg 到德国怎么报价",
        priority: "normal",
        metadata: { phone: "13900139002", source: "seed-admin" },
      })
      .returning();
  }

  const [existingMessage] = await db.select().from(messages).where(eq(messages.conversationId, conversation.id)).limit(1);
  if (!existingMessage) {
    await db.insert(messages).values([
      {
        tenantId: tenant.id,
        conversationId: conversation.id,
        senderType: "customer",
        senderName: "Canna郑",
        body: "给我一个总价，我的重量是 50kg，到德国。",
      },
      {
        tenantId: tenant.id,
        conversationId: conversation.id,
        senderType: "assistant",
        senderName: "物流客服助手",
        body: "请补充目的城市、件数和地址类型后可整理报价参考。",
        metadata: { model: model.displayName, source: "mock-local" },
      },
    ]);
  }

  const [seedUsage] = await db
    .select()
    .from(tokenUsageLogs)
    .where(and(eq(tokenUsageLogs.tenantId, tenant.id), eq(tokenUsageLogs.action, "seed.demo_chat")))
    .limit(1);
  const [tenantUser] = await db.select().from(users).where(eq(users.account, tenantAccount)).limit(1);
  if (!seedUsage && tenantUser) {
    await db.insert(tokenUsageLogs).values({
      tenantId: tenant.id,
      userId: tenantUser.id,
      modelId: model.id,
      promptTokens: 96,
      completionTokens: 42,
      totalTokens: 138,
      action: "seed.demo_chat",
      metadata: { conversationId: conversation.id, mock: true },
    });
    await db.insert(tokenUsage).values({
      tenantId: tenant.id,
      userId: tenantUser.id,
      modelName: model.displayName,
      promptTokens: 96,
      completionTokens: 42,
      totalTokens: 138,
      action: "seed.demo_chat",
      metadata: { conversationId: conversation.id, mock: true },
    });
  }

  const demoRecords = [
    { module: "conversations", recordType: "conversation", payload: { customer: "Canna郑", status: "AI 接待中" } },
    { module: "agents", recordType: "assistant", payload: { name: "物流客服助手", status: "在线" } },
    { module: "channels", recordType: "channel", payload: { name: "企业微信代运营(私聊/群聊)", status: "已接入" } },
    { module: "wecom", recordType: "account", payload: { name: "测试", accountId: "ZhuLi01", status: "在线" } },
    { module: "knowledge", recordType: "knowledge_base", payload: { name: "物流问答", vectors: 1280, status: "已启用" } },
  ];
  for (const record of demoRecords) {
    const [existingRecord] = await db
      .select()
      .from(tenantRecords)
      .where(and(eq(tenantRecords.tenantId, tenant.id), eq(tenantRecords.module, record.module), eq(tenantRecords.recordType, record.recordType)))
      .limit(1);
    if (!existingRecord) {
      await db.insert(tenantRecords).values({ tenantId: tenant.id, ...record });
    }
  }

  await db.insert(auditLogs).values({
    actorUserId: existing?.id ?? null,
    tenantId: tenant.id,
    action: "fullstack_v1.seed",
    metadata: { tenant: demoTenantName, tenantAccount, modules: ["conversations", "agents", "channels", "wecom", "knowledge"] },
  });
  console.log(`Seeded fullstack V1 demo tenant: ${demoTenantName}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
