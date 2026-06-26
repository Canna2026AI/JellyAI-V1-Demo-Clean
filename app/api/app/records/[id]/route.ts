import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireApiTenantUser } from "@/lib/auth/api";
import { getDb } from "@/lib/db";
import { tenantRecords } from "@/lib/db/schema";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireApiTenantUser();
  if (auth.error) return auth.error;
  const { user } = auth;
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const payload = body?.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "payload 必须是对象" }, { status: 400 });
  }

  const [record] = await getDb()
    .update(tenantRecords)
    .set({ payload, updatedAt: new Date() })
    .where(and(eq(tenantRecords.id, id), eq(tenantRecords.tenantId, user.tenantId)))
    .returning();

  if (!record) return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  return NextResponse.json({ record });
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireApiTenantUser();
  if (auth.error) return auth.error;
  const { user } = auth;
  const { id } = await params;
  const [record] = await getDb()
    .delete(tenantRecords)
    .where(and(eq(tenantRecords.id, id), eq(tenantRecords.tenantId, user.tenantId)))
    .returning();

  if (!record) return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
