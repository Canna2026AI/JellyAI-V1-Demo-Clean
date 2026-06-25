// Browser-side API adapter for the conversations backend.

window.conversationService = (() => {
  const baseUrl = "/api/conversations";
  let backendOnline = false;
  let warnedOffline = false;

  async function request(path, options = {}) {
    if (!canUseBackend()) return null;
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message || `API ${response.status}`);
    }
    backendOnline = true;
    if (response.status === 204) return null;
    return response.json();
  }

  function canUseBackend() {
    return ["http:", "https:"].includes(window.location.protocol);
  }

  async function loadState() {
    try {
      const state = await request("/state");
      backendOnline = Boolean(state);
      return state;
    } catch (error) {
      backendOnline = false;
      if (!warnedOffline) {
        warnedOffline = true;
        console.info("Conversations backend unavailable, using local demo storage.", error.message);
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

  return {
    isOnline: () => backendOnline,
    loadState,
    list: (params = {}) => sync(`?${new URLSearchParams(params).toString()}`),
    getMeta: () => sync("/meta"),
    getConversation: (conversationId) => sync(`/${encodeURIComponent(conversationId)}`),
    getMessages: (conversationId, params = {}) => sync(`/${encodeURIComponent(conversationId)}/messages?${new URLSearchParams(params).toString()}`),
    getAuditLogs: (params = {}) => sync(`/audit-logs?${new URLSearchParams(params).toString()}`),
    saveConversations: (conversations) => sync("", json("PUT", { conversations })),
    markRead: (conversationId, unread = false) => sync(`/${encodeURIComponent(conversationId)}/read`, json("PATCH", { unread })),
    sendMessage: (conversationId, payload) => sync(`/${encodeURIComponent(conversationId)}/messages`, json("POST", payload)),
    updateConversation: (conversationId, patch) => sync(`/${encodeURIComponent(conversationId)}`, json("PATCH", patch)),
    updateCustomer: (conversationId, patch) => sync(`/${encodeURIComponent(conversationId)}/customer`, json("PATCH", patch)),
    updateStatus: (conversationId, status) => sync(`/${encodeURIComponent(conversationId)}/status`, json("PATCH", { status })),
    transferToHuman: (conversationId, assignee = "Kelvin") => sync(`/${encodeURIComponent(conversationId)}/assignee`, json("PATCH", { assignee, mode: "manual" })),
    updateTags: (conversationId, tags) => sync(`/${encodeURIComponent(conversationId)}/tags`, json("PATCH", { tags })),
    updateHosting: (conversationId, enabled) => sync(`/${encodeURIComponent(conversationId)}/hosting`, json("PATCH", { enabled })),
    updateStarred: (conversationId, starred) => sync(`/${encodeURIComponent(conversationId)}/star`, json("PATCH", { starred })),
    saveCustomViews: (customViews) => sync("/custom-views", json("PUT", { customViews })),
    saveQuickMessages: (quickMessages) => sync("/quick-replies", json("PUT", quickMessages)),
    deleteQuickReply: (replyId) => sync(`/quick-replies/${encodeURIComponent(replyId)}`, { method: "DELETE" }),
    saveWorkHours: (settings) => sync("/settings/worktime", json("PATCH", settings)),
    saveAutomation: (settings) => sync("/settings/automation", json("PATCH", settings)),
    saveForwarding: (settings) => sync("/settings/forwarding", json("PATCH", settings)),
  };
})();
