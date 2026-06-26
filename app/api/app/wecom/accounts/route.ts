import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireApiTenantUser } from "@/lib/auth/api";
import { getDb } from "@/lib/db";
import { auditLogs, wecomAccounts } from "@/lib/db/schema";

export async function GET() {
  const auth = await requireApiTenantUser();
  if (auth.error) return auth.error;

  const accounts = await getDb()
    .select()
    .from(wecomAccounts)
    .where(eq(wecomAccounts.tenantId, auth.user.tenantId))
    .orderBy(desc(wecomAccounts.updatedAt));

  return NextResponse.json({
    accounts,
    mode: "mock-local",
    todo: "真实企业微信托管、RPA 心跳和 webhook 仍待接入。",
  });
}

export async function PATCH(request: Request) {
  const auth = await requireApiTenantUser();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const id = String(body?.id ?? "");
  if (!id) {
    return NextResponse.json({ error: "wecom account id 必填" }, { status: 400 });
  }

  const patch = {
    status: body?.status === undefined ? undefined : String(body.status),
    groupName: body?.groupName === undefined ? undefined : String(body.groupName),
    assistantName: body?.assistantName === undefined ? undefined : String(body.assistantName),
    messageEnabled: body?.messageEnabled === undefined ? undefined : Boolean(body.messageEnabled),
    aiEnabled: body?.aiEnabled === undefined ? undefined : Boolean(body.aiEnabled),
    heartbeat: body?.heartbeat === undefined ? undefined : String(body.heartbeat),
    updatedAt: new Date(),
  };
  const cleanPatch = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));

  const db = getDb();
  const [account] = await db
    .update(wecomAccounts)
    .set(cleanPatch)
    .where(and(eq(wecomAccounts.id, id), eq(wecomAccounts.tenantId, auth.user.tenantId)))
    .returning();
  if (!account) {
    return NextResponse.json({ error: "企业微信账号不存在" }, { status: 404 });
  }

  await db.insert(auditLogs).values({
    actorUserId: auth.user.id,
    tenantId: auth.user.tenantId,
    action: "wecom_account.update",
    metadata: { accountId: account.accountId, patch: cleanPatch },
  });

  return NextResponse.json({ account });
}
