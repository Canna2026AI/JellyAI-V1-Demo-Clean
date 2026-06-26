import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireApiTenantUser } from "@/lib/auth/api";
import { getDb } from "@/lib/db";
import { agents, auditLogs } from "@/lib/db/schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireApiTenantUser();
  if (auth.error) return auth.error;
  const { id } = await context.params;

  const [agent] = await getDb()
    .select()
    .from(agents)
    .where(and(eq(agents.id, id), eq(agents.tenantId, auth.user.tenantId)))
    .limit(1);
  if (!agent) {
    return NextResponse.json({ error: "智能体不存在" }, { status: 404 });
  }

  return NextResponse.json({ agent });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireApiTenantUser();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const body = await request.json().catch(() => null);

  const patch = {
    name: body?.name === undefined ? undefined : String(body.name),
    description: body?.description === undefined ? undefined : String(body.description),
    status: body?.status === undefined ? undefined : String(body.status),
    model: body?.model === undefined ? undefined : String(body.model),
    prompt: body?.prompt === undefined ? undefined : String(body.prompt),
    channel: body?.channel === undefined ? undefined : String(body.channel),
    tools: body?.tools === undefined ? undefined : Array.isArray(body.tools) ? body.tools.map(String) : [],
    knowledgeBaseIds:
      body?.knowledgeBaseIds === undefined ? undefined : Array.isArray(body.knowledgeBaseIds) ? body.knowledgeBaseIds.map(String) : [],
    metadata: body?.metadata === undefined ? undefined : typeof body.metadata === "object" && body.metadata ? body.metadata : {},
    updatedAt: new Date(),
  };
  const cleanPatch = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));

  const db = getDb();
  const [agent] = await db
    .update(agents)
    .set(cleanPatch)
    .where(and(eq(agents.id, id), eq(agents.tenantId, auth.user.tenantId)))
    .returning();
  if (!agent) {
    return NextResponse.json({ error: "智能体不存在" }, { status: 404 });
  }

  await db.insert(auditLogs).values({
    actorUserId: auth.user.id,
    tenantId: auth.user.tenantId,
    action: "agent.update",
    metadata: { agentId: agent.id, patch: cleanPatch },
  });

  return NextResponse.json({ agent });
}
