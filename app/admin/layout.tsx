import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePlatformAdmin();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="brand-mark" />
          <span>JellyAI 后台</span>
        </div>
        <nav className="admin-nav">
          <Link href="/admin">数据总览</Link>
          <Link href="/admin/customers">客户管理</Link>
          <Link href="/admin/models">模型与 Token</Link>
          <Link href="/admin/system">系统配置</Link>
          <Link href="/app">客户前台</Link>
        </nav>
        <div className="muted">
          <div>{user.displayName}</div>
          <div>{user.account}</div>
        </div>
        <LogoutButton />
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
