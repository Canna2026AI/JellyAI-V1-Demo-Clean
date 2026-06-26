import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { tenantRecords, tenants, tenantTokenBalances, users } from "@/lib/db/schema";
import { DEFAULT_TENANT_TOKENS, getRemainingTokens } from "@/lib/tokens";
import { createTenantFromForm, createTenantUserFromForm, setTenantStatusFromForm } from "../actions";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const db = getDb();
  const [tenantRows, userCounts, recordCounts, tokenBalances] = await Promise.all([
    db.select().from(tenants).orderBy(desc(tenants.createdAt)),
    db.select({ tenantId: users.tenantId, count: count() }).from(users).where(eq(users.role, "tenant_user")).groupBy(users.tenantId),
    db.select({ tenantId: tenantRecords.tenantId, count: count() }).from(tenantRecords).groupBy(tenantRecords.tenantId),
    db.select().from(tenantTokenBalances),
  ]);

  const userCountByTenant = new Map(userCounts.map((item) => [item.tenantId, Number(item.count)]));
  const recordCountByTenant = new Map(recordCounts.map((item) => [item.tenantId, Number(item.count)]));
  const tokenBalanceByTenant = new Map(tokenBalances.map((item) => [item.tenantId, item]));

  return (
    <>
      <header className="admin-header">
        <div className="admin-title">
          <h1>客户管理</h1>
          <span className="muted">创建客户、开通账号密码、启停客户。</span>
        </div>
      </header>

      <section className="split-grid">
        <div className="admin-card">
          <h2>客户列表</h2>
          <table className="table">
            <thead>
              <tr>
                <th>客户</th>
                <th>状态</th>
                <th>账号数</th>
                <th>数据量</th>
                <th>Token</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {tenantRows.map((tenant) => {
                const balance = tokenBalanceByTenant.get(tenant.id);
                return (
                  <tr key={tenant.id}>
                    <td>
                      <Link href={`/admin/customers/${tenant.id}`}>{tenant.name}</Link>
                      <div className="muted">{tenant.id}</div>
                    </td>
                    <td>
                      <span className={`status-pill ${tenant.status === "active" ? "" : "disabled"}`}>
                        {tenant.status === "active" ? "启用" : "停用"}
                      </span>
                    </td>
                    <td>{userCountByTenant.get(tenant.id) ?? 0}</td>
                    <td>{recordCountByTenant.get(tenant.id) ?? 0}</td>
                    <td>
                      <strong>{getRemainingTokens(balance).toLocaleString("zh-CN")}</strong>
                      <div className="muted">
                        已用 {(balance?.usedTokens ?? 0).toLocaleString("zh-CN")} / 总额{" "}
                        {(balance?.totalTokens ?? 0).toLocaleString("zh-CN")}
                      </div>
                    </td>
                    <td>
                      <form action={setTenantStatusFromForm}>
                        <input type="hidden" name="tenantId" value={tenant.id} />
                        <input type="hidden" name="status" value={tenant.status === "active" ? "disabled" : "active"} />
                        <button className="button" type="submit">
                          {tenant.status === "active" ? "停用" : "启用"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {!tenantRows.length ? (
                <tr>
                  <td colSpan={6} className="muted">
                    暂无客户
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <aside className="form-stack">
          <form className="admin-card form-stack" action={createTenantFromForm}>
            <h3>创建客户</h3>
            <label>
              客户名称
              <input className="input" name="name" required minLength={2} />
            </label>
            <label>
              状态
              <select className="select" name="status" defaultValue="active">
                <option value="active">启用</option>
                <option value="disabled">停用</option>
              </select>
            </label>
            <label>
              <span>
                <input name="initializeDemoData" type="checkbox" defaultChecked /> 初始化 demo 数据
              </span>
            </label>
            <label>
              初始 Token 额度
              <input className="input" name="initialTokens" type="number" min={0} defaultValue={DEFAULT_TENANT_TOKENS} />
            </label>
            <button className="button primary" type="submit">
              创建客户
            </button>
          </form>

          <form className="admin-card form-stack" action={createTenantUserFromForm}>
            <h3>创建客户账号</h3>
            <label>
              所属客户
              <select className="select" name="tenantId" required>
                <option value="">请选择客户</option>
                {tenantRows.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            </label>
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
        </aside>
      </section>
    </>
  );
}
