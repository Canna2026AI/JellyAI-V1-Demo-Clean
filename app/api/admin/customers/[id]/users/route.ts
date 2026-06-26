import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireApiPlatformAdmin } from "@/lib/auth/api";
import { hashPassword } from "@/lib/auth/password";
import { getDb } from "@/lib/db";
import { auditLogs, tenants, users } from "@/lib/db/schema";
import { createTenantUserSchema } from "@/lib/validators";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Params) {
  const auth = await requireApiPlatformAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = createTenantUserSchema.safeParse({
    tenantId: id,
    account: body?.account,
    password: body?.password,
    displayName: body?.displayName,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "账号数据无效" }, { status: 400 });
  }

  const db = getDb();
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, parsed.data.tenantId)).limit(1);
  if (!tenant) {
    return NextResponse.json({ error: "客户不存在" }, { status: 404 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const [user] = await db
    .insert(users)
    .values({
      tenantId: parsed.data.tenantId,
      account: parsed.data.account,
      displayName: parsed.data.displayName,
      role: "tenant_user",
      status: "active",
      passwordHash,
    })
    .returning();

  await db.insert(auditLogs).values({
    actorUserId: auth.user.id,
    tenantId: tenant.id,
    action: "api.tenant_user.create",
    metadata: { account: user.account, displayName: user.displayName },
  });

  return NextResponse.json({ user }, { status: 201 });
}
