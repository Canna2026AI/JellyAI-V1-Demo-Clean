import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireApiTenantUser } from "@/lib/auth/api";
import { getDb } from "@/lib/db";
import { auditLogs, conversations, messages, tokenUsage } from "@/lib/db/schema";
import { consumeTenantTokens, getTenantSelectedModel } from "@/lib/tokens";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireApiTenantUser();
  if (auth.error) return auth.error;
  const { id } = await params;

  const db = getDb();
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.tenantId, auth.user.tenantId)))
    .limit(1);
  if (!conversation) {
    return NextResponse.json({ error: "对话不存在" }, { status: 404 });
  }

  const rows = await db
    .select()
    .from(messages)
    .where(and(eq(messages.conversationId, id), eq(messages.tenantId, auth.user.tenantId)))
    .orderBy(asc(messages.createdAt));

  return NextResponse.json({ conversation, messages: rows });
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireApiTenantUser();
  if (auth.error) return auth.error;
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const text = String(body?.message ?? body?.body ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "消息内容必填" }, { status: 400 });
  }

  const db = getDb();
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.tenantId, auth.user.tenantId)))
    .limit(1);
  if (!conversation) {
    return NextResponse.json({ error: "对话不存在" }, { status: 404 });
  }

  const model = await getTenantSelectedModel(auth.user.tenantId);
  if (!model) {
    return NextResponse.json({ error: "暂无可用模型，请先配置模型" }, { status: 400 });
  }

  const usageLog = await consumeTenantTokens({
    tenantId: auth.user.tenantId,
    userId: auth.user.id,
    model,
    message: text,
  });
  const [usage] = await db
    .insert(tokenUsage)
    .values({
      tenantId: auth.user.tenantId,
      userId: auth.user.id,
      modelName: model.displayName,
      promptTokens: usageLog.promptTokens,
      completionTokens: usageLog.completionTokens,
      totalTokens: usageLog.totalTokens,
      action: "conversation.message.send",
      metadata: { conversationId: conversation.id, tokenUsageLogId: usageLog.id, mock: true },
    })
    .returning();

  const reply = `已收到：${text.slice(0, 80)}。本地 V1 已写入消息和 token 用量；真实模型回复待接入 MODEL_API_KEY。`;
  const [userMessage, assistantMessage] = await db
    .insert(messages)
    .values([
      {
        tenantId: auth.user.tenantId,
        conversationId: conversation.id,
        senderType: "user",
        senderName: auth.user.displayName,
        body: text,
        tokenUsageId: usage.id,
        metadata: { source: "local-api" },
      },
      {
        tenantId: auth.user.tenantId,
        conversationId: conversation.id,
        senderType: "assistant",
        senderName: model.displayName,
        body: reply,
        tokenUsageId: usage.id,
        metadata: { source: "mock-local", model: model.modelId },
      },
    ])
    .returning();

  await db
    .update(conversations)
    .set({ lastMessage: text, status: "AI对话", updatedAt: new Date() })
    .where(and(eq(conversations.id, conversation.id), eq(conversations.tenantId, auth.user.tenantId)));
  await db.insert(auditLogs).values({
    actorUserId: auth.user.id,
    tenantId: auth.user.tenantId,
    action: "conversation.message.send",
    metadata: { conversationId: conversation.id, tokenUsage: usageLog.totalTokens, mock: true },
  });

  return NextResponse.json({
    message: userMessage,
    assistantMessage,
    tokenUsage: usage,
    tokenUsageLog: usageLog,
  });
}
