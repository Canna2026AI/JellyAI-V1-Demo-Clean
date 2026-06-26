import { count, desc, sum } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { aiModels, tokenUsageLogs } from "@/lib/db/schema";
import { createAiModelFromForm, setAiModelStatusFromForm, setDefaultAiModelFromForm } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminModelsPage() {
  const db = getDb();
  const [models, usageRows] = await Promise.all([
    db.select().from(aiModels).orderBy(desc(aiModels.isDefault), desc(aiModels.createdAt)),
    db
      .select({
        modelId: tokenUsageLogs.modelId,
        calls: count(),
        tokens: sum(tokenUsageLogs.totalTokens),
      })
      .from(tokenUsageLogs)
      .groupBy(tokenUsageLogs.modelId),
  ]);

  const usageByModel = new Map(
    usageRows.map((row) => [
      row.modelId,
      {
        calls: Number(row.calls),
        tokens: Number(row.tokens ?? 0),
      },
    ]),
  );

  return (
    <>
      <header className="admin-header">
        <div className="admin-title">
          <h1>模型与 Token</h1>
          <span className="muted">配置平台统一可用的大模型，并查看模型级 token 消耗。</span>
        </div>
      </header>

      <section className="split-grid">
        <div className="admin-card">
          <h2>模型列表</h2>
          <table className="table">
            <thead>
              <tr>
                <th>模型</th>
                <th>供应商</th>
                <th>模型 ID</th>
                <th>接入配置</th>
                <th>上下文</th>
                <th>调用</th>
                <th>Token</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model) => {
                const usage = usageByModel.get(model.id) ?? { calls: 0, tokens: 0 };
                return (
                  <tr key={model.id}>
                    <td>
                      <strong>{model.displayName}</strong>
                      {model.isDefault ? <div className="muted">全局默认</div> : null}
                    </td>
                    <td>{model.provider}</td>
                    <td>{model.modelId}</td>
                    <td>
                      <strong>{model.apiKeyEnvName}</strong>
                      <div className="muted">{model.baseUrl || "未配置 Base URL"}</div>
                    </td>
                    <td>{model.contextWindow ? model.contextWindow.toLocaleString("zh-CN") : "-"}</td>
                    <td>{usage.calls}</td>
                    <td>{usage.tokens.toLocaleString("zh-CN")}</td>
                    <td>
                      <span className={`status-pill ${model.status === "active" ? "" : "disabled"}`}>
                        {model.status === "active" ? "启用" : "停用"}
                      </span>
                    </td>
                    <td>
                      <div className="inline-actions">
                        <form action={setAiModelStatusFromForm}>
                          <input type="hidden" name="modelId" value={model.id} />
                          <input type="hidden" name="status" value={model.status === "active" ? "disabled" : "active"} />
                          <button className="button" type="submit">
                            {model.status === "active" ? "停用" : "启用"}
                          </button>
                        </form>
                        {model.status === "active" && !model.isDefault ? (
                          <form action={setDefaultAiModelFromForm}>
                            <input type="hidden" name="modelId" value={model.id} />
                            <button className="button" type="submit">
                              设默认
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!models.length ? (
                <tr>
                  <td colSpan={9} className="muted">
                    暂无模型，请先添加一个模型。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <aside>
          <form className="admin-card form-stack" action={createAiModelFromForm}>
            <h3>新增模型</h3>
            <label>
              供应商
              <input className="input" name="provider" placeholder="doubao / openai / qwen" required />
            </label>
            <label>
              展示名称
              <input className="input" name="displayName" placeholder="豆包 Seed 1.6" required />
            </label>
            <label>
              模型 ID
              <input className="input" name="modelId" placeholder="doubao-seed-1-6" required />
            </label>
            <label>
              上下文窗口 Token
              <input className="input" name="contextWindow" type="number" min={0} defaultValue={0} />
            </label>
            <label>
              Base URL
              <input className="input" name="baseUrl" placeholder="https://api.example.com/v1" defaultValue={process.env.MODEL_BASE_URL ?? ""} />
            </label>
            <label>
              API Key 环境变量名
              <input className="input" name="apiKeyEnvName" defaultValue="MODEL_API_KEY" required />
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
                <input name="isDefault" type="checkbox" /> 设为全局默认
              </span>
            </label>
            <button className="button primary" type="submit">
              添加模型
            </button>
          </form>
        </aside>
      </section>
    </>
  );
}
