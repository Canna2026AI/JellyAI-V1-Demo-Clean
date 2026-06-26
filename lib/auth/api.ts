import { NextResponse } from "next/server";
import {
  getCurrentUser,
  type PlatformAdminUser,
  type TenantCurrentUser,
} from "@/lib/auth/session";

type ApiAuthResult<T> = { user: T; error?: never } | { user?: never; error: NextResponse };

export async function requireApiPlatformAdmin(): Promise<ApiAuthResult<PlatformAdminUser>> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "未登录" }, { status: 401 }) };
  }
  if (user.role !== "platform_admin") {
    return { error: NextResponse.json({ error: "无权访问后台 API" }, { status: 403 }) };
  }
  return { user: user as PlatformAdminUser };
}

export async function requireApiTenantUser(): Promise<ApiAuthResult<TenantCurrentUser>> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: NextResponse.json({ error: "未登录" }, { status: 401 }) };
  }
  if (user.role !== "tenant_user" || !user.tenantId) {
    return { error: NextResponse.json({ error: "无权访问客户 API" }, { status: 403 }) };
  }
  return { user: user as TenantCurrentUser };
}
