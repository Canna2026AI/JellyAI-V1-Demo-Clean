import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireApiTenantUser } from "@/lib/auth/api";
import { getDb } from "@/lib/db";
import { agents, auditLogs } from "@/lib/db/schema";

export async function GET() {
  const auth = await requireApiTenantUser();
  if (auth.error) return auth.error;

  const rows = await getDb().select().from(agents).where(eq(agents.tenantId, auth.user.tenantId)).orderBy(desc(agents.updatedAt));
  return NextResponse.json({ agents: rows });
}

export async function POST(request: Request) {
  const auth = await requireApiTenantUser();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "智能体名称必填" }, { status: 400 });
  }

  const db = getDb();
  const [agent] = await db
    .insert(agents)
    .values({
      tenantId: auth.user.tenantId,
      name,
      description: String(body?.description ?? ""),
      status: String(body?.status ?? "active"),
      model: String(body?.model ?? "local-mock-model"),
      prompt: String(body?.prompt ?? ""),
      channel: String(body?.channel ?? "通用"),
      tools: Array.isArray(body?.tools) ? body.tools.map(String) : [],
      knowledgeBaseIds: Array.isArray(body?.knowledgeBaseIds) ? body.knowledgeBaseIds.map(String) : [],
      metadata: typeof body?.metadata === "object" && body.metadata ? body.metadata : {},
    })
    .returning();

  await db.insert(auditLogs).values({
    actorUserId: auth.user.id,
    tenantId: auth.user.tenantId,
    action: "agent.create",
    metadata: { agentId: agent.id, name: agent.name },
  });

  return NextResponse.json({ agent }, { status: 201 });
}
