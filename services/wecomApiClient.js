// Browser client for the fullstack WeCom API. It overlays real account rows on
// top of the richer feature-branch mock state until RPA/Webhook workers exist.
(function initWecomApiClient() {
  const base = window.JELLY_WECOM_API_BASE || "";

  async function request(path, options = {}) {
    const response = await fetch(`${base}${path}`, {
      method: options.method || "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const contentType = response.headers.get("content-type") || "";
    const body = contentType.includes("application/json") ? await response.json() : await response.text();
    if (!response.ok) {
      const message = typeof body === "object" ? body.error || body.detail : body;
      throw new Error(message || `Request failed: ${response.status}`);
    }
    return body;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function mapAccount(row) {
    const settings = row.settings || {};
    return {
      id: row.id,
      name: row.name,
      alias: settings.alias || row.name,
      avatar: (row.name || "企").slice(0, 1),
      accountId: row.accountId,
      instanceId: row.instanceId,
      subject: settings.subject || "本地 V1",
      status: row.status,
      group: row.groupName,
      assistant: row.assistantName,
      messageEnabled: Boolean(row.messageEnabled),
      aiEnabled: Boolean(row.aiEnabled),
      heartbeat: row.heartbeat || "-",
      owner: settings.owner || "Kelvin",
      lastAction: settings.lastAction || "本地 API 同步",
      remark: settings.remark || "来自 wecom_accounts 表",
    };
  }

  function accountPatchBody(body = {}) {
    return {
      ...body,
      groupName: body.groupName ?? body.group,
      assistantName: body.assistantName ?? body.assistant,
    };
  }

  function mockStateWithAccounts(accounts) {
    const initial = window.wecomMock?.cloneInitialState ? window.wecomMock.cloneInitialState() : {};
    const mappedAccounts = accounts.map(mapAccount);
    const accountGroups = [...new Set([...(initial.accountGroups || []), ...mappedAccounts.map((account) => account.group).filter(Boolean)])];
    const assistants = [...new Set([...(initial.assistants || []), ...mappedAccounts.map((account) => account.assistant).filter(Boolean)])];
    return {
      ...clone(initial),
      accounts: mappedAccounts.length ? mappedAccounts : initial.accounts || [],
      accountGroups,
      assistants,
      logs: [
        {
          id: "log-api-bootstrap",
          date: new Date().toISOString().slice(0, 10),
          time: new Date().toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
          operator: "系统",
          operation: "本地 API 同步",
          accountId: mappedAccounts[0]?.id || "",
          groupId: "",
          target: "wecom_accounts",
          type: "系统",
          content: `同步 ${mappedAccounts.length} 个托管账号`,
          reply: "真实 RPA/Webhook 待接入",
          status: "成功",
          detail: "GET /api/app/wecom/accounts",
        },
        ...(initial.logs || []),
      ],
    };
  }

  function get(path) {
    if (path === "/api/wecom/bootstrap") {
      return request("/api/app/wecom/accounts").then((payload) => mockStateWithAccounts(payload.accounts || []));
    }
    if (path === "/api/health") {
      return request("/api/app/bootstrap");
    }
    return request(path);
  }

  function post(path, body) {
    if (path === "/api/wecom/accounts") {
      return Promise.resolve({
        id: `local-wecom-${Date.now()}`,
        ...body,
        status: body?.status || "待扫码",
        mock: true,
      });
    }
    return request(path, { method: "POST", body });
  }

  function patch(path, body) {
    const accountMatch = path.match(/^\/api\/wecom\/accounts\/(.+)$/);
    if (accountMatch) {
      return request("/api/app/wecom/accounts", {
        method: "PATCH",
        body: { id: decodeURIComponent(accountMatch[1]), ...accountPatchBody(body) },
      }).then((payload) => mapAccount(payload.account));
    }
    return request(path, { method: "PATCH", body });
  }

  function del(path) {
    if (path.startsWith("/api/wecom/accounts/")) return Promise.resolve({ ok: true, mock: true });
    return request(path, { method: "DELETE" });
  }

  window.wecomApi = {
    get,
    post,
    patch,
    delete: del,
    bootstrap: () => get("/api/wecom/bootstrap"),
    health: () => get("/api/health"),
  };
})();
