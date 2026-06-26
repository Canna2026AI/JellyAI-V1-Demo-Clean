import Link from "next/link";
import { requireTenantUser } from "@/lib/auth/session";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

const modules: Record<string, string> = {
  conversations: "聚合对话",
  agents: "AI 智能体",
  channels: "对话渠道",
  wecom: "企业微信托管",
  knowledge: "知识库",
};

type WorkspacePageProps = {
  searchParams: Promise<{ module?: string }>;
};

export default async function WorkspacePage({ searchParams }: WorkspacePageProps) {
  const user = await requireTenantUser();
  const params = await searchParams;
  const selectedModule = params.module && modules[params.module] ? params.module : "conversations";
  const iframeSrc = `/workspace/index.html?module=${encodeURIComponent(selectedModule)}`;

  return (
    <div className="tenant-app-shell workspace-page">
      <header className="tenant-app-topbar workspace-topbar">
        <div className="brand">
          <span className="brand-mark" />
          <span>Jelly AI</span>
        </div>
        <nav className="workspace-tabs" aria-label="前台模块">
          {Object.entries(modules).map(([id, label]) => (
            <Link className={id === selectedModule ? "active" : ""} href={`/app/workspace?module=${id}`} key={id}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="inline-actions">
          <span className="muted">{user.displayName}</span>
          <Link className="button" href="/app">
            总览
          </Link>
          <LogoutButton className="button" />
        </div>
      </header>
      <iframe className="workspace-frame" src={iframeSrc} title={`JellyAI ${modules[selectedModule]} 前台`} />
    </div>
  );
}
