import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { getDb } from "@/lib/db";
import { auditLogs, tenants, users } from "@/lib/db/schema";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "登录信息无效" }, { status: 400 });
  }

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.account, parsed.data.account)).limit(1);
  if (!user || user.status !== "active") {
    return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
  }

  if (user.tenantId) {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1);
    if (!tenant || tenant.status !== "active") {
      return NextResponse.json({ error: "账号已停用" }, { status: 403 });
    }
  }

  const passwordOk = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!passwordOk) {
    return NextResponse.json({ error: "账号或密码错误" }, { status: 401 });
  }

  await createSession(user.id);
  await db.update(users).set({ lastLoginAt: new Date(), updatedAt: new Date() }).where(eq(users.id, user.id));
  await db.insert(auditLogs).values({
    actorUserId: user.id,
    tenantId: user.tenantId,
    action: "auth.login",
    metadata: { account: user.account, role: user.role },
  });

  return NextResponse.json({
    ok: true,
    redirectTo: user.role === "platform_admin" ? "/admin" : "/app/workspace?module=conversations",
  });
}
