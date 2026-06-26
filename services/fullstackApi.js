// Same-origin bootstrap probe from the customer web demo to the Next.js API.

(function initFullstackApi() {
  const pageMap = {
    conversations: "chat",
    agents: "ai",
    channels: "channels",
    wecom: "wechat",
    knowledge: "knowledge",
  };
  const urlParams = new URLSearchParams(window.location.search);
  const moduleName = urlParams.get("module");
  if (pageMap[moduleName]) {
    state.page = pageMap[moduleName];
    if (moduleName === "agents") state.assistantSub = "assistant";
    if (moduleName === "conversations" && urlParams.get("conversation")) {
      state.selectedConversation = urlParams.get("conversation");
      state.chatLoading = false;
    }
  }

  state.fullstackApi = {
    status: "loading",
    loadedAt: null,
    errors: [],
    bootstrap: null,
  };

  async function request(path, options = {}) {
    const response = await fetch(path, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || `${path} ${response.status}`);
    }
    return payload;
  }

  async function loadFullstackData() {
    const tasks = {
      bootstrap: request("/api/app/bootstrap"),
      channels: request("/api/app/channels"),
      wecom: request("/api/app/wecom/accounts"),
      agents: request("/api/app/agents"),
      knowledge: request("/api/app/knowledge-bases"),
      conversations: request("/api/app/conversations"),
    };

    const entries = await Promise.all(
      Object.entries(tasks).map(async ([key, task]) => {
        try {
          return [key, await task];
        } catch (error) {
          return [key, error];
        }
      }),
    );
    const data = Object.fromEntries(entries);
    state.fullstackApi.errors = entries.filter(([, value]) => value instanceof Error).map(([key, error]) => `${key}: ${error.message}`);
    state.fullstackApi.bootstrap = data.bootstrap instanceof Error ? null : data.bootstrap;
    state.fullstackApi.modules = Object.fromEntries(
      Object.entries(data).filter(([key, value]) => key !== "bootstrap" && !(value instanceof Error))
    );

    state.fullstackApi.status = state.fullstackApi.errors.length ? "partial" : "ready";
    state.fullstackApi.loadedAt = new Date().toISOString();
    if (typeof render === "function") render();
  }

  loadFullstackData();
})();
