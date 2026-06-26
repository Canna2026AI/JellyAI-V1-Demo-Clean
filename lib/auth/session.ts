import { randomBytes, createHash } from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { sessions, tenants, users, type UserRole } from "@/lib/db/schema";

export const SESSION_COOKIE = "jellyai_session";
const SESSION_DAYS = 7;

export type CurrentUser = {
  id: string;
  account: string;
  displayName: string;
  role: UserRole;
  status: string;
  tenantId: string | null;
  tenantName: string | null;
  tenantStatus: string | null;
};

export type PlatformAdminUser = CurrentUser & {
  role: "platform_admin";
};

export type TenantCurrentUser = CurrentUser & {
  role: "tenant_user";
  tenantId: string;
};

function getAuthSecret() {
  const secret = process.env.SESSION_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is required for authentication.");
  }
  return secret;
}

function hashToken(token: string) {
  return createHash("sha256").update(`${token}:${getAuthSecret()}`).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const requestHeaders = await headers();

  await getDb().insert(sessions).values({
    userId,
    tokenHash,
    expiresAt,
    userAgent: requestHeaders.get("user-agent"),
    ipAddress: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? requestHeaders.get("x-real-ip"),
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await getDb().delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [row] = await getDb()
    .select({
      sessionId: sessions.id,
      userId: users.id,
      account: users.account,
      displayName: users.displayName,
      role: users.role,
      status: users.status,
      tenantId: users.tenantId,
      tenantName: tenants.name,
      tenantStatus: tenants.status,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .leftJoin(tenants, eq(tenants.id, users.tenantId))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!row) {
    return null;
  }

  if (row.status !== "active" || (row.tenantId && row.tenantStatus !== "active")) {
    await getDb().delete(sessions).where(eq(sessions.id, row.sessionId));
    return null;
  }

  return {
    id: row.userId,
    account: row.account,
    displayName: row.displayName,
    role: row.role as UserRole,
    status: row.status,
    tenantId: row.tenantId,
    tenantName: row.tenantName,
    tenantStatus: row.tenantStatus,
  };
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePlatformAdmin(): Promise<PlatformAdminUser> {
  const user = await requireUser();
  if (user.role !== "platform_admin") redirect("/app");
  return user as PlatformAdminUser;
}

export async function requireTenantUser(): Promise<TenantCurrentUser> {
  const user = await requireUser();
  if (user.role !== "tenant_user" || !user.tenantId) redirect("/admin");
  return user as TenantCurrentUser;
}
