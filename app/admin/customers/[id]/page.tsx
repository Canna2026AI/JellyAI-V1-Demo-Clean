import Link from "next/link";
import { count, desc, eq, sum } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import {
  aiModels,
  auditLogs,
  tenantModelSettings,
  tenantRecords,
  tenants,
  tenantTokenBalances,
  tokenAdjustments,
  tokenUsageLogs,
  users,
} from "@/lib/db/schema";
import { moduleLabels } from "@/lib/demo-data";
import { getRemainingTokens } from "@/lib/tokens";
import {
  adjustTenantTokensFromForm,
  createTenantUserFromForm,
  resetTenantUserPasswordFromForm,
  setTenantModelFromForm,
  setTenantStatusFromForm,
} from "../../actions";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const db = getDb();
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  if (!tenant) notFound();

  const [
    tenantUsers,
    moduleCounts,
    recentRecords,
    recentLogs,
    activeModels,
    [modelSetting],
    [tokenBalance],
    userUsageRows,
    recentTokenLogs,
    recentAdjustments,
  ] = await Promise.all([
    db.select().from(users).where(eq(users.tenantId, id)).orderBy(desc(users.createdAt)),
    db
      .select({ module: tenantRecords.module, count: count() })
      .from(tenantRecords)
      .where(eq(tenantRecords.tenantId, id))
      .groupBy(tenantRecords.module),
    db.select().from(tenantRecords).where(eq(tenantRecords.tenantId, id)).orderBy(desc(tenantRecords.createdAt)).limit(12),
    db.select().from(auditLogs).where(eq(auditLogs.tenantId, id)).orderBy(desc(auditLogs.createdAt)).limit(8),
    db.select().from(aiModels).where(eq(aiModels.status, "active")).orderBy(desc(aiModels.isDefault), aiModels.createdAt),
    db.select().from(tenantModelSettings).where(eq(tenantModelSettings.tenantId, id)).limit(1),
    db.select().from(tenantTokenBalances).where(eq(tenantTokenBalances.tenantId, id)).limit(1),
    db
      .select({
        userId: tokenUsageLogs.userId,
        calls: count(),
        tokens: sum(tokenUsageLogs.totalTokens),
      })
      .from(tokenUsageLogs)
      .where(eq(tokenUsageLogs.tenantId, id))
      .groupBy(tokenUsageLogs.userId),
    db.select().from(tokenUsageLogs).where(eq(tokenUsageLogs.tenantId, id)).orderBy(desc(tokenUsageLogs.createdAt)).limit(10),
    db.select().from(tokenAdjustments).where(eq(tokenAdjustments.tenantId, id)).orderBy(desc(tokenAdjustments.createdAt)).limit(8),
  ]);
  const userUsageById = new Map(
    userUsageRows.map((row) => [
      row.userId,
      {
        calls: Number(row.calls),
        tokens: Number(row.tokens ?? 0),
      },
    ]),
  );
  const userById = new Map(tenantUsers.map((user) => [user.id, user]));
  const modelById = new Map(activeModels.map((model) => [model.id, model]));
  const selectedModel =
    activeModels.find((model) => model.id === modelSetting?.selectedModelId) ?? activeModels.find((model) => model.isDefault) ?? null;
  const totalUsedTokens = tokenBalance?.usedTokens ?? 0;
  const remainingTokens = getRemainingTokens(tokenBalance);

  return (
    <>
      <header className="admin-header">
        <div className="admin-title">
          <Link className="muted" href="/admin/customers">
            返回客户列表
          </Link>
          <h1>{tenant.name}</h1>
          <span className="muted">{tenant.id}</span>
        </div>
        <form action={setTenantStatusFromForm}>
          <input type="hidden" name="tenantId" value={tenant.id} />
          <input type="hidden" name="status" value={tenant.status === "active" ? "disabled" : "active"} />
          <button className="button" type="submit">
            {tenant.status === "active" ? "停用客户" : "启用客户"}
          </button>
        </form>
      </header>

      <section className="admin-grid">
        <div className="admin-card metric">
          <span className="muted">客户状态</span>
          <strong>{tenant.status === "active" ? "启用" : "停用"}</strong>
        </div>
        <div className="admin-card metric">
          <span className="muted">账号数</span>
          <strong>{tenantUsers.length}</strong>
        </div>
        <div className="admin-card metric">
          <span className="muted">业务模块</span>
          <strong>{moduleCounts.length}</strong>
        </div>
        <div className="admin-card metric">
          <span className="muted">Token 剩余</span>
          <strong>{remainingTokens.toLocaleString("zh-CN")}</strong>
        </div>
        <div className="admin-card metric">
          <span className="muted">Token 已消耗</span>
          <strong>{totalUsedTokens.toLocaleString("zh-CN")}</strong>
        </div>
        <div className="admin-card metric">
          <span className="muted">当前模型</span>
          <strong>{selectedModel?.displayName ?? "未配置"}</strong>
        </div>
      </section>

      <section className="split-grid">
        <div className="form-stack">
          <section className="admin-card">
            <h2>客户账号</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>账号</th>
                  <th>姓名</th>
                  <th>状态</th>
                  <th>Token 用量</th>
                  <th>最近登录</th>
                  <th>重置密码</th>
                </tr>
              </thead>
              <tbody>
                {tenantUsers.map((user) => {
                  const usage = userUsageById.get(user.id) ?? { calls: 0, tokens: 0 };
                  return (
                    <tr key={user.id}>
                      <td>{user.account}</td>
                      <td>{user.displayName}</td>
                      <td>
                        <span className={`status-pill ${user.status === "active" ? "" : "disabled"}`}>
                          {user.status === "active" ? "启用" : "停用"}
                        </span>
                      </td>
                      <td>
                        <strong>{usage.tokens.toLocaleString("zh-CN")}</strong>
                        <div className="muted">{usage.calls} 次对话</div>
                      </td>
                      <td>{user.lastLoginAt ? user.lastLoginAt.toLocaleString("zh-CN") : "-"}</td>
                      <td>
                        <form className="form-stack" action={resetTenantUserPasswordFromForm}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input className="input" name="newPassword" type="password" placeholder="新密码" minLength={8} required />
                          <button className="button" type="submit">
                            重置
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
                {!tenantUsers.length ? (
                  <tr>
                    <td colSpan={6} className="muted">
                      暂无账号
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </section>

          <section className="admin-card">
            <h2>Token 消耗明细</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>账号</th>
                  <th>模型</th>
                  <th>输入</th>
                  <th>输出</th>
                  <th>合计</th>
                </tr>
              </thead>
              <tbody>
                {recentTokenLogs.map((log) => {
                  const logUser = userById.get(log.userId);
                  const logModel = log.modelId ? modelById.get(log.modelId) : null;
                  return (
                    <tr key={log.id}>
                      <td>{log.createdAt.toLocaleString("zh-CN")}</td>
                      <td>{logUser?.displayName ?? log.userId}</td>
                      <td>{logModel?.displayName ?? "历史模型"}</td>
                      <td>{log.promptTokens.toLocaleString("zh-CN")}</td>
                      <td>{log.completionTokens.toLocaleString("zh-CN")}</td>
                      <td>{log.totalTokens.toLocaleString("zh-CN")}</td>
                    </tr>
                  );
                })}
                {!recentTokenLogs.length ? (
                  <tr>
                    <td colSpan={6} className="muted">
                      暂无 Token 消耗
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </section>

          <section className="admin-card">
            <h2>最近业务数据</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>模块</th>
                  <th>类型</th>
                  <th>数据</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                {recentRecords.map((record) => (
                  <tr key={record.id}>
                    <td>{moduleLabels[record.module] ?? record.module}</td>
                    <td>{record.recordType}</td>
                    <td>{JSON.stringify(record.payload)}</td>
                    <td>{record.createdAt.toLocaleString("zh-CN")}</td>
                  </tr>
                ))}
                {!recentRecords.length ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      暂无业务数据
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </section>
        </div>

        <aside className="form-stack">
          <form className="admin-card form-stack" action={createTenantUserFromForm}>
            <h3>新增客户账号</h3>
            <input type="hidden" name="tenantId" value={tenant.id} />
            <label>
              登录账号
              <input className="input" name="account" required minLength={3} />
            </label>
            <label>
              显示名称
              <input className="input" name="displayName" required />
            </label>
            <label>
              初始密码
              <input className="input" name="password" type="password" required minLength={8} />
            </label>
            <button className="button primary" type="submit">
              开通账号
            </button>
          </form>

          <form className="admin-card form-stack" action={setTenantModelFromForm}>
            <h3>客户模型选择</h3>
            <input type="hidden" name="tenantId" value={tenant.id} />
            <label>
              当前可用模型
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
              保存模型
            </button>
          </form>

          <form className="admin-card form-stack" action={adjustTenantTokensFromForm}>
            <h3>Token 额度调整</h3>
            <input type="hidden" name="tenantId" value={tenant.id} />
            <div className="record-list">
              <div className="record-row">
                <span>总额度</span>
                <strong>{(tokenBalance?.totalTokens ?? 0).toLocaleString("zh-CN")}</strong>
              </div>
              <div className="record-row">
                <span>已消耗</span>
                <strong>{totalUsedTokens.toLocaleString("zh-CN")}</strong>
              </div>
              <div className="record-row">
                <span>可用余额</span>
                <strong>{remainingTokens.toLocaleString("zh-CN")}</strong>
              </div>
            </div>
            <label>
              增减 Token
              <input className="input" name="deltaTokens" type="number" step={1} defaultValue={1000} required />
            </label>
            <label>
              调整原因
              <input className="input" name="reason" defaultValue="后台手动调整" required maxLength={200} />
            </label>
            <button className="button primary" type="submit">
              更新额度
            </button>
          </form>

          <section className="admin-card">
            <h3>模块数据统计</h3>
            <div className="record-list">
              {moduleCounts.map((item) => (
                <div className="record-row" key={item.module}>
                  <span>{moduleLabels[item.module] ?? item.module}</span>
                  <strong>{Number(item.count)}</strong>
                </div>
              ))}
              {!moduleCounts.length ? <span className="muted">暂无数据</span> : null}
            </div>
          </section>

          <section className="admin-card">
            <h3>最近额度调整</h3>
            <div className="record-list">
              {recentAdjustments.map((adjustment) => (
                <div className="record-row" key={adjustment.id}>
                  <span>{adjustment.deltaTokens > 0 ? "+" : ""}{adjustment.deltaTokens.toLocaleString("zh-CN")}</span>
                  <span className="muted">{adjustment.createdAt.toLocaleString("zh-CN")}</span>
                </div>
              ))}
              {!recentAdjustments.length ? <span className="muted">暂无调整记录</span> : null}
            </div>
          </section>

          <section className="admin-card">
            <h3>最近操作日志</h3>
            <div className="record-list">
              {recentLogs.map((log) => (
                <div className="record-row" key={log.id}>
                  <span>{log.action}</span>
                  <span className="muted">{log.createdAt.toLocaleString("zh-CN")}</span>
                </div>
              ))}
              {!recentLogs.length ? <span className="muted">暂无日志</span> : null}
            </div>
          </section>
        </aside>
      </section>
    </>
  );
}
