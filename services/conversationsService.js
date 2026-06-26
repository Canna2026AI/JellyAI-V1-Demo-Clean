// Browser-side API adapter for the Next.js fullstack conversations API.

window.conversationService = (() => {
  const baseUrl = "/api/app/conversations";
  let backendOnline = false;
  let warnedOffline = false;

  async function request(path, options = {}) {
    if (!canUseBackend()) return null;
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      credentials: "include",
      ...options,
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || payload.message || `API ${response.status}`);
    }
    backendOnline = true;
    if (response.status === 204) return null;
    return response.json();
  }

  function canUseBackend() {
    return ["http:", "https:"].includes(window.location.protocol);
  }

  function statusColor(status) {
    return status === "AI对话" || status === "AI接待" || status === "已解决" ? "green" : "orange";
  }

  function senderRole(senderType) {
    if (senderType === "assistant") return "ai";
    if (senderType === "user") return "me";
    if (senderType === "system") return "system";
    return "customer";
  }

  function timeOfDay(value) {
    const date = new Date(value || Date.now());
    if (Number.isNaN(date.getTime())) return "刚刚";
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  }

  function mapMessage(row) {
    return {
      id: row.id,
      role: senderRole(row.senderType),
      text: row.body,
      createdAt: timeOfDay(row.createdAt),
      meta: row.metadata?.model ? `模型：${row.metadata.model}` : row.metadata?.source ? `来源：${row.metadata.source}` : "",
    };
  }

  function mapConversation(row, messages = []) {
    const metadata = row.metadata || {};
    const channel = row.channel || "企业微信";
    const status = row.status || "AI对话";
    const isAi = status.includes("AI") || row.assignedTo === "AI";
    const name = row.customerName || "未命名客户";
    return {
      id: row.id,
      name,
      avatar: name.slice(0, 1) || "客",
      owner: row.assignedTo || "AI",
      assignee: row.assignedTo || "AI",
      type: isAi ? "ai" : "manual",
      assignedToMe: !isAi,
      channel,
      channelIcon: channel.slice(0, 1) || "渠",
      sourceName: metadata.sourceName || channel,
      sourceId: metadata.sourceId || row.id.slice(0, 8),
      hostedAccountId: metadata.hostedAccountId || metadata.accountId || "-",
      externalId: metadata.externalId || metadata.phone || "-",
      hosted: Boolean(metadata.hosted ?? channel.includes("企业微信")),
      status,
      statusColor: statusColor(status),
      unread: Boolean(metadata.unread ?? false),
      updatedAt: row.updatedAt || row.createdAt || new Date().toISOString(),
      starred: Boolean(metadata.starred ?? false),
      viewTags: Array.isArray(metadata.viewTags) && metadata.viewTags.length ? metadata.viewTags : [channel],
      tags: Array.isArray(metadata.tags) ? metadata.tags : [],
      customer: {
        name,
        remark: metadata.remark || channel,
        phone: metadata.phone || "",
        company: metadata.company || "",
        city: metadata.city || "",
      },
      members: Array.isArray(metadata.members) ? metadata.members : [],
      messages,
    };
  }

  async function loadState() {
    try {
      const payload = await request("");
      const rows = payload?.conversations || [];
      const conversations = await Promise.all(
        rows.map(async (row) => {
          try {
            const detail = await request(`/${encodeURIComponent(row.id)}/messages`);
            return mapConversation(row, (detail?.messages || []).map(mapMessage));
          } catch (error) {
            console.warn("Conversation messages unavailable:", error.message);
            return mapConversation(row, []);
          }
        })
      );
      backendOnline = true;
      return {
        conversations,
        customViews: window.customConversationViews || undefined,
        quickMessages: window.quickMessageData || undefined,
        settings: {},
      };
    } catch (error) {
      backendOnline = false;
      if (!warnedOffline) {
        warnedOffline = true;
        console.info("Conversations API unavailable, using local demo storage.", error.message);
      }
      return null;
    }
  }

  function sync(path, options = {}) {
    if (!backendOnline) return Promise.resolve(null);
    return request(path, options).catch((error) => {
      console.warn("Conversations backend sync failed:", error.message);
      return null;
    });
  }

  function json(method, body) {
    return { method, body: JSON.stringify(body || {}) };
  }

  async function sendMessage(conversationId, payload) {
    const result = await sync(
      `/${encodeURIComponent(conversationId)}/messages`,
      json("POST", { message: payload?.content || payload?.message || payload?.body || "" })
    );
    if (result && typeof window.scheduleConversationBackendRefresh === "function") {
      window.scheduleConversationBackendRefresh();
    }
    return result;
  }

  function mockOk(extra = {}) {
    return backendOnline ? Promise.resolve({ ok: true, mock: true, ...extra }) : Promise.resolve(null);
  }

  return {
    isOnline: () => backendOnline,
    login: () => Promise.resolve({ ok: true, localSession: true }),
    loadState,
    list: (params = {}) => sync(`?${new URLSearchParams(params).toString()}`),
    getMeta: () => mockOk(),
    getConversation: (conversationId) => sync(`/${encodeURIComponent(conversationId)}/messages`),
    getMessages: (conversationId, params = {}) => sync(`/${encodeURIComponent(conversationId)}/messages?${new URLSearchParams(params).toString()}`),
    getAuditLogs: () => mockOk(),
    saveConversations: () => mockOk({ todo: "bulk conversation persistence" }),
    markRead: () => mockOk({ todo: "conversation read state persistence" }),
    sendMessage,
    addNote: () => mockOk({ todo: "conversation notes persistence" }),
    updateConversation: () => mockOk({ todo: "conversation patch API" }),
    updateCustomer: () => mockOk({ todo: "conversation customer patch API" }),
    updateStatus: () => mockOk({ todo: "conversation status patch API" }),
    transferToHuman: () => mockOk({ todo: "conversation assignment API" }),
    updateTags: () => mockOk({ todo: "conversation tags API" }),
    updateHosting: () => mockOk({ todo: "conversation hosting API" }),
    updateStarred: () => mockOk({ todo: "conversation star API" }),
    saveCustomViews: () => mockOk({ todo: "custom views API" }),
    saveQuickMessages: () => mockOk({ todo: "quick replies API" }),
    deleteQuickReply: () => mockOk({ todo: "quick replies API" }),
    saveWorkHours: () => mockOk({ todo: "work hours API" }),
    saveAutomation: () => mockOk({ todo: "automation settings API" }),
    saveForwarding: () => mockOk({ todo: "forwarding settings API" }),
    ingestChannelMessage: () => mockOk({ todo: "channel webhook ingest API" }),
    subscribe: () => null,
  };
})();
