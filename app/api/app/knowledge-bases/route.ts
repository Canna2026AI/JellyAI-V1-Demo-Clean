import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireApiTenantUser } from "@/lib/auth/api";
import { getDb } from "@/lib/db";
import { auditLogs, knowledgeBases } from "@/lib/db/schema";

export async function GET() {
  const auth = await requireApiTenantUser();
  if (auth.error) return auth.error;

  const rows = await getDb()
    .select()
    .from(knowledgeBases)
    .where(eq(knowledgeBases.tenantId, auth.user.tenantId))
    .orderBy(desc(knowledgeBases.updatedAt));
  return NextResponse.json({ knowledgeBases: rows });
}

export async function POST(request: Request) {
  const auth = await requireApiTenantUser();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "知识库名称必填" }, { status: 400 });
  }

  const db = getDb();
  const [knowledgeBase] = await db
    .insert(knowledgeBases)
    .values({
      tenantId: auth.user.tenantId,
      name,
      description: String(body?.description ?? ""),
      kind: String(body?.kind ?? "多模态"),
      status: String(body?.status ?? "active"),
      documentCount: Number(body?.documentCount ?? 0),
      vectorCount: Number(body?.vectorCount ?? 0),
      storagePath: String(body?.storagePath ?? ""),
      metadata: typeof body?.metadata === "object" && body.metadata ? body.metadata : { vectorStore: "mock" },
    })
    .returning();

  await db.insert(auditLogs).values({
    actorUserId: auth.user.id,
    tenantId: auth.user.tenantId,
    action: "knowledge_base.create",
    metadata: { knowledgeBaseId: knowledgeBase.id, name: knowledgeBase.name, vectorStore: "mock" },
  });

  return NextResponse.json({ knowledgeBase }, { status: 201 });
}
