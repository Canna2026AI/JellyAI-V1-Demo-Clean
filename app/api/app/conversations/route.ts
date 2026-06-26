import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireApiTenantUser } from "@/lib/auth/api";
import { getDb } from "@/lib/db";
import { auditLogs, conversations } from "@/lib/db/schema";

export async function GET() {
  const auth = await requireApiTenantUser();
  if (auth.error) return auth.error;

  const rows = await getDb()
    .select()
    .from(conversations)
    .where(eq(conversations.tenantId, auth.user.tenantId))
    .orderBy(desc(conversations.updatedAt));

  return NextResponse.json({ conversations: rows });
}

export async function POST(request: Request) {
  const auth = await requireApiTenantUser();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const customerName = String(body?.customerName ?? "").trim();
  if (!customerName) {
    return NextResponse.json({ error: "客户名称必填" }, { status: 400 });
  }

  const db = getDb();
  const [conversation] = await db
    .insert(conversations)
    .values({
      tenantId: auth.user.tenantId,
      customerName,
      channel: String(body?.channel ?? "企业微信"),
      status: String(body?.status ?? "AI对话"),
      assignedTo: String(body?.assignedTo ?? "AI"),
      lastMessage: String(body?.lastMessage ?? ""),
      priority: String(body?.priority ?? "normal"),
      metadata: typeof body?.metadata === "object" && body.metadata ? body.metadata : {},
    })
    .returning();

  await db.insert(auditLogs).values({
    actorUserId: auth.user.id,
    tenantId: auth.user.tenantId,
    action: "conversation.create",
    metadata: { conversationId: conversation.id, customerName: conversation.customerName },
  });

  return NextResponse.json({ conversation }, { status: 201 });
}
