import Link from "next/link";
import { count, desc, eq, sum } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { aiModels, auditLogs, tenantRecords, tenants, tenantTokenBalances, tokenUsageLogs, users } from "@/lib/db/schema";
import { getRemainingTokens } from "@/lib/tokens";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const db = getDb();
  const [
    [tenantTotal],
    [activeTenantTotal],
    [userTotal],
    [recordTotal],
    [activeModelTotal],
    [defaultModel],
    tenantRows,
    tokenBalances,
    tenantUsageRows,
    recentLogs,
  ] = await Promise.all([
    db.select({ value: count() }).from(tenants),
    db.select({ value: count() }).from(tenants).where(eq(tenants.status, "active")),
    db.select({ value: count() }).from(users).where(eq(users.role, "tenant_user")),
    db.select({ value: count() }).from(tenantRecords),
    db.select({ value: count() }).from(aiModels).where(eq(aiModels.status, "active")),
    db.select().from(aiModels).where(eq(aiModels.isDefault, true)).limit(1),
    db.select().from(tenants).orderBy(desc(tenants.createdAt)),
    db.select().from(tenantTokenBalances),
    db
      .select({
        tenantId: tokenUsageLogs.tenantId,
        calls: count(),
        tokens: sum(tokenUsageLogs.totalTokens),
      })
      .from(tokenUsageLogs)
      .groupBy(tokenUsageLogs.tenantId),
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(8),
  ]);
  const tokenBalanceByTenant = new Map(tokenBalances.map((item) => [item.tenantId, item]));
  const usageByTenant = new Map(
    tenantUsageRows.map((item) => [
      item.tenantId,
      {
        calls: Number(item.calls),
        tokens: Number(item.tokens ?? 0),
      },
    ]),
  );
  const totalTokens = tokenBalances.reduce((total, item) => total + item.totalTokens, 0);
  const usedTokens = tokenBalances.reduce((total, item) => total + item.usedTokens, 0);
  const remainingTokens = tokenBalances.reduce((total, item) => total + getRemainingTokens(item), 0);

  return (
    <>
      <header className="admin-header">
        <div className="admin-title">
          <h1>平台数据总览</h1>
          <span className="muted">查看客户、账号、模型、token 消耗和最近后台操作。</span>
        </div>
        <div className="inline-actions">
          <Link className="button" href="/admin/models">
            模型配置
          </Link>
          <Link className="button primary" href="/admin/customers">
            管理客户
          </Link>
        </div>
      </header>

      <section className="admin-grid">
        <div className="admin-card metric">
          <span className="muted">客户总数</span>
          <strong>{Number(tenantTotal.value)}</strong>
        </div>
        <div className="admin-card metric">
          <span className="muted">启用客户</span>
          <strong>{Number(activeTenantTotal.value)}</strong>
        </div>
        <div className="admin-card metric">
          <span className="muted">客户账号</span>
          <strong>{Number(userTotal.value)}</strong>
        </div>
        <div className="admin-card metric">
          <span className="muted">业务记录</span>
          <strong>{Number(recordTotal.value)}</strong>
        </div>
        <div className="admin-card metric">
          <span className="muted">启用模型</span>
          <strong>{Number(activeModelTotal.value)}</strong>
        </div>
        <div className="admin-card metric">
          <span className="muted">Token 总额度</span>
          <strong>{totalTokens.toLocaleString("zh-CN")}</strong>
        </div>
        <div className="admin-card metric">
          <span className="muted">Token 已消耗</span>
          <strong>{usedTokens.toLocaleString("zh-CN")}</strong>
        </div>
        <div className="admin-card metric">
          <span className="muted">Token 剩余</span>
          <strong>{remainingTokens.toLocaleString("zh-CN")}</strong>
        </div>
      </section>

      <section className="split-grid">
        <div className="admin-card">
          <h2>客户 Token 概览</h2>
          <table className="table">
            <thead>
              <tr>
                <th>客户</th>
                <th>额度</th>
                <th>已用</th>
                <th>剩余</th>
                <th>对话次数</th>
              </tr>
            </thead>
            <tbody>
              {tenantRows.map((tenant) => {
                const balance = tokenBalanceByTenant.get(tenant.id);
                const usage = usageByTenant.get(tenant.id) ?? { calls: 0, tokens: 0 };
                return (
                  <tr key={tenant.id}>
                    <td>
                      <Link href={`/admin/customers/${tenant.id}`}>{tenant.name}</Link>
                      <div className="muted">{tenant.status === "active" ? "启用" : "停用"}</div>
                    </td>
                    <td>{(balance?.totalTokens ?? 0).toLocaleString("zh-CN")}</td>
                    <td>{(balance?.usedTokens ?? usage.tokens).toLocaleString("zh-CN")}</td>
                    <td>{getRemainingTokens(balance).toLocaleString("zh-CN")}</td>
                    <td>{usage.calls}</td>
                  </tr>
                );
              })}
              {!tenantRows.length ? (
                <tr>
                  <td colSpan={5} className="muted">
                    暂无客户
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <aside className="admin-card">
          <h2>当前默认模型</h2>
          {defaultModel ? (
            <div className="record-list">
              <div className="record-row">
                <span>名称</span>
                <strong>{defaultModel.displayName}</strong>
              </div>
              <div className="record-row">
                <span>供应商</span>
                <strong>{defaultModel.provider}</strong>
              </div>
              <div className="record-row">
                <span>模型 ID</span>
                <strong>{defaultModel.modelId}</strong>
              </div>
            </div>
          ) : (
            <span className="muted">暂无默认模型</span>
          )}
        </aside>
      </section>

      <section className="admin-card">
        <h2>最近操作</h2>
        <table className="table">
          <thead>
            <tr>
              <th>时间</th>
              <th>动作</th>
              <th>客户</th>
              <th>详情</th>
            </tr>
          </thead>
          <tbody>
            {recentLogs.map((log) => (
              <tr key={log.id}>
                <td>{log.createdAt.toLocaleString("zh-CN")}</td>
                <td>{log.action}</td>
                <td>{log.tenantId ?? "-"}</td>
                <td>{JSON.stringify(log.metadata)}</td>
              </tr>
            ))}
            {!recentLogs.length ? (
              <tr>
                <td colSpan={4} className="muted">
                  暂无操作记录
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </>
  );
}
