import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireApiTenantUser } from "@/lib/auth/api";
import { getDb } from "@/lib/db";
import { tenantRecords } from "@/lib/db/schema";
import { tenantRecordSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const auth = await requireApiTenantUser();
  if (auth.error) return auth.error;
  const { user } = auth;
  const { searchParams } = new URL(request.url);
  const moduleName = searchParams.get("module");
  const db = getDb();

  const rows = await db
    .select()
    .from(tenantRecords)
    .where(
      moduleName
        ? and(eq(tenantRecords.tenantId, user.tenantId), eq(tenantRecords.module, moduleName))
        : eq(tenantRecords.tenantId, user.tenantId),
    )
    .orderBy(desc(tenantRecords.createdAt))
    .limit(100);

  return NextResponse.json({ records: rows });
}

export async function POST(request: Request) {
  const auth = await requireApiTenantUser();
  if (auth.error) return auth.error;
  const { user } = auth;
  const body = await request.json().catch(() => null);
  const parsed = tenantRecordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "数据无效" }, { status: 400 });
  }

  const [record] = await getDb()
    .insert(tenantRecords)
    .values({
      tenantId: user.tenantId,
      module: parsed.data.module,
      recordType: parsed.data.recordType,
      payload: parsed.data.payload,
    })
    .returning();

  return NextResponse.json({ record }, { status: 201 });
}
