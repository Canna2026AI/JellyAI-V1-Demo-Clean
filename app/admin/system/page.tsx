import { count } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { aiModels, tenants, tokenUsageLogs, users } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

function envStatus(name: string, fallbackName?: string) {
  const configured = Boolean(process.env[name] || (fallbackName ? process.env[fallbackName] : ""));
  return {
    name: fallbackName ? `${name} / ${fallbackName}` : name,
    configured,
  };
}

export default async function AdminSystemPage() {
  const db = getDb();
  const [[tenantTotal], [userTotal], [modelTotal], [usageTotal], models] = await Promise.all([
    db.select({ value: count() }).from(tenants),
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(aiModels),
    db.select({ value: count() }).from(tokenUsageLogs),
    db.select().from(aiModels),
  ]);
  const envRows = [
    envStatus("DATABASE_URL"),
    envStatus("SESSION_SECRET", "AUTH_SECRET"),
    envStatus("ADMIN_EMAIL", "SEED_ADMIN_ACCOUNT"),
    envStatus("ADMIN_PASSWORD", "SEED_ADMIN_PASSWORD"),
    envStatus("MODEL_API_KEY", "OPENAI_API_KEY"),
    envStatus("MODEL_BASE_URL"),
    envStatus("NODE_ENV"),
  ];

  return (
    <>
      <header className="admin-header">
        <div className="admin-title">
          <h1>系统配置</h1>
          <span className="muted">查看运行环境、数据库连接和模型接入配置。</span>
        </div>
      </header>

      <section className="admin-grid">
        <div className="admin-card metric">
          <span className="muted">数据库状态</span>
          <strong>已连接</strong>
        </div>
        <div className="admin-card metric">
          <span className="muted">客户数</span>
          <strong>{Number(tenantTotal.value)}</strong>
        </div>
        <div className="admin-card metric">
          <span className="muted">用户数</span>
          <strong>{Number(userTotal.value)}</strong>
        </div>
        <div className="admin-card metric">
          <span className="muted">模型数</span>
          <strong>{Number(modelTotal.value)}</strong>
        </div>
        <div className="admin-card metric">
          <span className="muted">Token 记录</span>
          <strong>{Number(usageTotal.value)}</strong>
        </div>
      </section>

      <section className="split-grid">
        <div className="admin-card">
          <h2>环境变量</h2>
          <table className="table">
            <thead>
              <tr>
                <th>变量</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {envRows.map((item) => (
                <tr key={item.name}>
                  <td>{item.name}</td>
                  <td>
                    <span className={`status-pill ${item.configured ? "" : "disabled"}`}>
                      {item.configured ? "已配置" : "未配置"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="admin-card">
          <h2>模型密钥映射</h2>
          <div className="record-list">
            {models.map((model) => (
              <div className="record-row" key={model.id}>
                <div>
                  <strong>{model.displayName}</strong>
                  <div className="muted">{model.provider} · {model.modelId}</div>
                </div>
                <div>
                  <strong>{model.apiKeyEnvName}</strong>
                  <div className="muted">{model.baseUrl || "未配置 Base URL"}</div>
                </div>
              </div>
            ))}
            {!models.length ? <span className="muted">暂无模型</span> : null}
          </div>
        </aside>
      </section>
    </>
  );
}
