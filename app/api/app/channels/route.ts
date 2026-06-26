import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireApiTenantUser } from "@/lib/auth/api";
import { getDb } from "@/lib/db";
import { auditLogs, channels } from "@/lib/db/schema";

export async function GET() {
  const auth = await requireApiTenantUser();
  if (auth.error) return auth.error;

  const rows = await getDb().select().from(channels).where(eq(channels.tenantId, auth.user.tenantId)).orderBy(desc(channels.updatedAt));
  return NextResponse.json({ channels: rows });
}

export async function POST(request: Request) {
  const auth = await requireApiTenantUser();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const provider = String(body?.provider ?? "").trim();
  if (!name || !provider) {
    return NextResponse.json({ error: "渠道名称和 provider 必填" }, { status: 400 });
  }

  const db = getDb();
  const [channel] = await db
    .insert(channels)
    .values({
      tenantId: auth.user.tenantId,
      name,
      provider,
      category: String(body?.category ?? "社交媒体"),
      status: String(body?.status ?? "未接入"),
      accountCount: Number(body?.accountCount ?? 0),
      description: String(body?.description ?? ""),
      config: typeof body?.config === "object" && body.config ? body.config : {},
      lastSyncAt: new Date(),
    })
    .returning();

  await db.insert(auditLogs).values({
    actorUserId: auth.user.id,
    tenantId: auth.user.tenantId,
    action: "channel.create",
    metadata: { channelId: channel.id, provider: channel.provider },
  });

  return NextResponse.json({ channel }, { status: 201 });
}
