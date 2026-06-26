// Browser client for the Next.js fullstack channels API.

const channelsService = (() => {
  const apiBase = window.JELLY_CHANNELS_API_BASE || "";
  const localAccountKey = "jellyai-channel-local-accounts";

  async function request(path, options = {}) {
    const headers = {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    };
    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      credentials: "include",
      headers: { ...headers, ...(options.headers || {}) },
    });
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? await response.json() : await response.text();
    if (!response.ok) {
      const message = payload?.error?.message || payload?.message || `请求失败：${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload;
  }

  function readLocalAccounts() {
    try {
      return JSON.parse(window.localStorage?.getItem(localAccountKey) || "{}");
    } catch {
      return {};
    }
  }

  function writeLocalAccounts(value) {
    window.localStorage?.setItem(localAccountKey, JSON.stringify(value));
  }

  function iconFor(item) {
    if (item.provider === "wecom-hosting" || item.category === "企业微信") return "企";
    if (item.provider?.includes("wechat")) return "微";
    if (item.provider?.includes("web")) return "W";
    if (item.provider?.includes("douyin")) return "抖";
    if (item.provider?.includes("xiaohongshu")) return "红";
    return (item.name || "渠").slice(0, 1);
  }

  function mapChannel(item) {
    const localAccounts = readLocalAccounts()[item.provider] || readLocalAccounts()[item.id] || [];
    const config = item.config || {};
    const accountRecords = [...(Array.isArray(config.accountRecords) ? config.accountRecords : []), ...localAccounts];
    const status = accountRecords.length ? "已接入" : item.status;
    const accountCount = Math.max(Number(item.accountCount || 0), accountRecords.length);
    return {
      id: item.provider || item.id,
      databaseId: item.id,
      name: item.name,
      description: item.description || "本地全栈 API 返回的渠道配置。",
      status,
      accountCount,
      action: status === "已接入" ? "管理" : "添加账号",
      icon: iconFor(item),
      category: item.category || "社交媒体",
      tags: [...new Set([status === "已接入" ? "已绑定" : "未绑定", item.category || "社交媒体"])],
      route: item.provider === "wecom-hosting" ? "wechat" : config.route || "",
      isOpen: item.status !== "开发中",
      accounts: accountRecords.map((account) => account.accountName || account.label || account.name).filter(Boolean),
      accountRecords,
      guide: config.guide || "当前渠道已接入本地 API 列表；真实授权、Webhook 和账号管理按 TODO 继续完善。",
      fields: Array.isArray(config.fields) && config.fields.length ? config.fields : ["账号名称", "负责人", "绑定 AI 助手", "备注"],
    };
  }

  async function health() {
    return request("/api/app/bootstrap");
  }

  async function listChannels(params = {}) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) query.set(key, value);
    }
    const suffix = query.toString() ? `?${query}` : "";
    const payload = await request(`/api/app/channels${suffix}`);
    return (payload.channels || []).map(mapChannel);
  }

  async function connectChannel(channelId, formValues) {
    const localAccounts = readLocalAccounts();
    const account = {
      id: `local-${channelId}-${Date.now()}`,
      accountName: formValues.accountName,
      owner: formValues.owner,
      assistant: formValues.assistant,
      remark: formValues.remark,
      status: "本地已保存",
    };
    localAccounts[channelId] = [...(localAccounts[channelId] || []), account];
    writeLocalAccounts(localAccounts);
    return { ok: true, account, mock: true, message: "渠道配置已保存到本地演示账号，真实授权接口待接入。" };
  }

  async function testChannel(channelId, formValues) {
    return {
      ok: true,
      mock: true,
      channelId,
      message: `${formValues.accountName || "当前账号"} 连接测试通过（本地 mock）`,
    };
  }

  async function deleteAccount(channelId, accountId) {
    const localAccounts = readLocalAccounts();
    localAccounts[channelId] = (localAccounts[channelId] || []).filter((account) => account.id !== accountId);
    writeLocalAccounts(localAccounts);
    return { ok: true, mock: true };
  }

  return {
    health,
    listChannels,
    connectChannel,
    testChannel,
    deleteAccount,
  };
})();

window.channelsService = channelsService;
