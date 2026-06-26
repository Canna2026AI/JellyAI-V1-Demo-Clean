import { and, count, desc, eq } from "drizzle-orm";
import { requireTenantUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { tenantRecords, tenants, tenantTokenBalances, tokenUsageLogs } from "@/lib/db/schema";
import { moduleLabels } from "@/lib/demo-data";
import { ensureTenantTokenBalance, getActiveAiModels, getRemainingTokens, getTenantSelectedModel } from "@/lib/tokens";
import { LogoutButton } from "@/components/LogoutButton";
import { selectTenantModelFromForm, sendTenantMessageFromForm } from "./actions";

export const dynamic = "force-dynamic";

const workspaceModules = [
  { id: "conversations", label: "聚合对话", description: "查看客户会话、发送消息并写入本地 messages/token usage。", href: "/app/workspace?module=conversations" },
  { id: "agents", label: "AI 智能体", description: "管理客服智能体、提示词、模型和关联知识库。", href: "/app/workspace?module=agents" },
  { id: "channels", label: "对话渠道", description: "读取本地 channels API，展示已接入和可接入渠道。", href: "/app/workspace?module=channels" },
  { id: "wecom", label: "企业微信托管", description: "读取 wecom_accounts，可本地更新托管状态。", href: "/app/workspace?module=wecom" },
  { id: "knowledge", label: "知识库", description: "读取/创建 knowledge_bases，向量库暂用本地 mock。", href: "/app/workspace?module=knowledge" },
];

export default async function TenantAppPage() {
  const user = await requireTenantUser();
  const db = getDb();
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, user.tenantId)).limit(1);
  await ensureTenantTokenBalance(user.tenantId);
  const [moduleCounts, recentRecords, recentMessages, [tokenBalance], activeModels, selectedModel, recentTokenLogs] = await Promise.all([
    db
      .select({ module: tenantRecords.module, count: count() })
      .from(tenantRecords)
      .where(eq(tenantRecords.tenantId, user.tenantId))
      .groupBy(tenantRecords.module),
    db.select().from(tenantRecords).where(eq(tenantRecords.tenantId, user.tenantId)).orderBy(desc(tenantRecords.createdAt)).limit(10),
    db
      .select()
      .from(tenantRecords)
      .where(and(eq(tenantRecords.tenantId, user.tenantId), eq(tenantRecords.recordType, "chat_message")))
      .orderBy(desc(tenantRecords.createdAt))
      .limit(6),
    db.select().from(tenantTokenBalances).where(eq(tenantTokenBalances.tenantId, user.tenantId)).limit(1),
    getActiveAiModels(),
    getTenantSelectedModel(user.tenantId),
    db
      .select()
      .from(tokenUsageLogs)
      .where(eq(tokenUsageLogs.tenantId, user.tenantId))
      .orderBy(desc(tokenUsageLogs.createdAt))
      .limit(6),
  ]);
  const totalTokens = tokenBalance?.totalTokens ?? 0;
  const usedTokens = tokenBalance?.usedTokens ?? 0;
  const remainingTokens = getRemainingTokens(tokenBalance);
  const usagePercent = totalTokens > 0 ? Math.min(100, Math.round((usedTokens / totalTokens) * 100)) : 0;

  return (
    <div className="tenant-app-shell">
      <header className="tenant-app-topbar">
        <div className="brand">
          <span className="brand-mark" />
          <span>Jelly AI</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="muted">
            {user.displayName} · {tenant?.name ?? user.tenantName}
          </span>
          <LogoutButton className="button" />
        </div>
      </header>

      <main className="tenant-app-main">
        <section className="tenant-app-header">
          <div className="tenant-app-title">
            <h1>{tenant?.name ?? "客户工作台"}</h1>
            <span className="muted">当前登录账号只能读取本客户的数据。</span>
          </div>
          <a className="button primary" href="/api/app/bootstrap" target="_blank">
            查看数据接口
          </a>
        </section>

        <section className="tenant-module-grid">
          {workspaceModules.map((item) => (
            <a className="tenant-app-card metric" href={item.href} key={item.id}>
              <span className="muted">{item.label}</span>
              <strong style={{ fontSize: 22 }}>{Number(moduleCounts.find((countItem) => countItem.module === item.id)?.count ?? 0)}</strong>
              <span className="muted">{item.description}</span>
            </a>
          ))}
        </section>

        <section className="tenant-module-grid">
          <div className="tenant-app-card metric">
            <span className="muted">当前模型</span>
            <strong>{selectedModel?.displayName ?? "未配置"}</strong>
            <span className="muted">{selectedModel ? `${selectedModel.provider} · ${selectedModel.modelId}` : "请联系平台管理员"}</span>
          </div>
          <div className="tenant-app-card metric">
            <span className="muted">Token 剩余</span>
            <strong>{remainingTokens.toLocaleString("zh-CN")}</strong>
            <div className="token-progress" aria-label="Token 使用进度">
              <span style={{ width: `${usagePercent}%` }} />
            </div>
            <span className="muted">
              已用 {usedTokens.toLocaleString("zh-CN")} / 总额 {totalTokens.toLocaleString("zh-CN")}
            </span>
          </div>
          {moduleCounts.map((item) => (
            <div className="tenant-app-card metric" key={item.module}>
              <span className="muted">{moduleLabels[item.module] ?? item.module}</span>
              <strong>{Number(item.count)}</strong>
            </div>
          ))}
          {!moduleCounts.length ? (
            <div className="tenant-app-card">
              <h2>暂无数据</h2>
              <p className="muted">请联系平台管理员初始化或导入业务数据。</p>
            </div>
          ) : null}
        </section>

        <section className="split-grid">
          <div className="form-stack">
            <section className="tenant-app-card form-stack">
              <div>
                <h2>发送一次对话</h2>
                <span className="muted">提交后会按当前模型写入对话记录，并扣减本客户 Token。</span>
              </div>
              <form className="form-stack" action={sendTenantMessageFromForm}>
                <label>
                  对话内容
                  <textarea
                    className="textarea"
                    name="message"
                    rows={5}
                    maxLength={4000}
                    placeholder="输入客户咨询、AI 回复测试或内部演示内容"
                    required
                  />
                </label>
                <button className="button primary" type="submit" disabled={!selectedModel || remainingTokens <= 0}>
                  发送并消耗 Token
                </button>
              </form>
            </section>

            <section className="tenant-app-card">
              <h2>最近对话</h2>
              <div className="record-list">
                {recentMessages.map((record) => (
                  <div className="record-row" key={record.id}>
                    <div>
                      <strong>{String(record.payload.model ?? selectedModel?.displayName ?? "模型")}</strong>
                      <div className="muted">{String(record.payload.message ?? "")}</div>
                    </div>
                    <span className="muted">{record.createdAt.toLocaleString("zh-CN")}</span>
                  </div>
                ))}
                {!recentMessages.length ? <span className="muted">暂无对话记录</span> : null}
              </div>
            </section>

            <section className="tenant-app-card">
              <h2>最近业务记录</h2>
              <div className="record-list">
                {recentRecords.map((record) => (
                  <div className="record-row" key={record.id}>
                    <div>
                      <strong>{moduleLabels[record.module] ?? record.module}</strong>
                      <div className="muted">{record.recordType}</div>
                    </div>
                    <span className="muted">{record.createdAt.toLocaleString("zh-CN")}</span>
                  </div>
                ))}
                {!recentRecords.length ? <span className="muted">暂无记录</span> : null}
              </div>
            </section>
          </div>

          <aside className="form-stack">
            <form className="tenant-app-card form-stack" action={selectTenantModelFromForm}>
              <h3>选择模型</h3>
              <label>
                可用模型
                <select className="select" name="modelId" defaultValue={selectedModel?.id ?? ""} required>
                  <option value="">请选择模型</option>
                  {activeModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.displayName} · {model.provider}
                    </option>
                  ))}
                </select>
              </label>
              <button className="button primary" type="submit" disabled={!activeModels.length}>
                应用模型
              </button>
            </form>

            <section className="tenant-app-card">
              <h3>最近 Token 消耗</h3>
              <div className="record-list">
                {recentTokenLogs.map((log) => (
                  <div className="record-row" key={log.id}>
                    <span>{log.totalTokens.toLocaleString("zh-CN")} Token</span>
                    <span className="muted">{log.createdAt.toLocaleString("zh-CN")}</span>
                  </div>
                ))}
                {!recentTokenLogs.length ? <span className="muted">暂无消耗记录</span> : null}
              </div>
            </section>

            <section className="tenant-app-card">
              <h3>租户隔离规则</h3>
              <p className="muted">
                API 根据服务器 session 解析 tenant_id，读写条件强制包含当前租户；前端无法通过传入其他客户 ID 访问数据。
              </p>
            </section>
          </aside>
        </section>

      </main>
    </div>
  );
}
