// Same-origin adapter from the static demo to the Next.js fullstack API.

(function initFullstackApi() {
  const pageMap = {
    conversations: "chat",
    agents: "ai",
    channels: "channels",
    wecom: "wechat",
    knowledge: "knowledge",
  };
  const moduleName = new URLSearchParams(window.location.search).get("module");
  if (pageMap[moduleName]) {
    state.page = pageMap[moduleName];
    if (moduleName === "agents") state.assistantSub = "assistant";
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

  function shortId(value) {
    return String(value || "").slice(0, 8) || "local";
  }

  function timeLabel(value) {
    if (!value) return "刚刚";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "刚刚";
    const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}小时前`;
    return `${Math.round(minutes / 1440)}天前`;
  }

  function applyChannels(payload) {
    if (!payload || !Array.isArray(payload.channels) || !Array.isArray(channels)) return;
    const apiChannels = payload.channels.map((item) => {
      const isWecom = item.provider === "wecom-hosting";
      const key = isWecom ? "wechat" : item.provider || shortId(item.id);
      channelCategoryMap[item.name] = item.category || "社交媒体";
      return [
        item.name,
        item.description || "本地 API 返回的渠道配置。",
        item.status,
        Number(item.accountCount || 0),
        item.status === "已接入" ? "管理" : "添加账号",
        isWecom ? "企" : "W",
        item.category || "社交媒体",
        key,
      ];
    });
    const apiNames = new Set(apiChannels.map((item) => item[0]));
    const staticChannels = channels.filter(([name]) => !apiNames.has(name));
    channels.splice(0, channels.length, ...apiChannels, ...staticChannels);
  }

  function applyWecom(payload) {
    if (!payload || !Array.isArray(payload.accounts)) return;
    state.wecomAccounts = payload.accounts.map((item) => ({
      id: item.id,
      name: item.name,
      avatar: (item.name || "企").slice(0, 1),
      accountId: item.accountId,
      instanceId: item.instanceId,
      status: item.status,
      group: item.groupName,
      assistant: item.assistantName,
      messageEnabled: Boolean(item.messageEnabled),
      aiEnabled: Boolean(item.aiEnabled),
      heartbeat: item.heartbeat || "-",
    }));
  }

  function applyAgents(payload) {
    if (!payload || !Array.isArray(payload.agents)) return;
    state.fullstackAgents = payload.agents.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      model: item.model,
      status: item.status,
      tools: item.tools || [],
      channel: item.channel,
    }));
  }

  function applyKnowledge(payload) {
    if (!payload || !Array.isArray(payload.knowledgeBases) || !Array.isArray(knowledgeBases)) return;
    knowledgeBases.splice(
      0,
      knowledgeBases.length,
      ...payload.knowledgeBases.map((item) => ({
        id: item.id,
        name: item.name,
        count: `${Number(item.documentCount || 0)}条数据`,
        type: item.kind || "多模态",
        icon: "◎",
        size: `${Number(item.vectorCount || 0).toLocaleString("zh-CN")} vectors`,
      })),
    );
  }

  function applyConversations(payload) {
    if (!payload || !Array.isArray(payload.conversations)) return;
    const list = payload.conversations.map((item) => [
      item.id,
      item.customerName,
      item.assignedTo || "AI",
      timeLabel(item.updatedAt),
      item.lastMessage || "暂无消息",
      item.status === "人工对话" ? "orange" : "green",
      item.status !== "人工对话",
      item.metadata?.phone || "",
    ]);
    conversationMap["全部对话"] = list;
    conversationMap["AI对话"] = list.filter((item) => item[6]);
    conversationMap["人工对话"] = list.filter((item) => !item[6]);
    conversationMap["企业微信托管"] = list.filter((item) => String(item[1] || "").includes("Canna") || String(item[4] || "").includes("德国"));
    if (!state.selectedConversation && list[0]) state.selectedConversation = list[0][0];
  }

  function applyMessages(payload) {
    if (!payload || !Array.isArray(payload.messages)) return;
    state.convMessages = payload.messages.map((item) => {
      const senderType = String(item.senderType || "");
      return {
        role: senderType === "assistant" ? "ai" : senderType === "user" ? "me" : "other",
        text: item.body,
        meta: item.metadata?.model ? `模型：${item.metadata.model}` : "",
      };
    });
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

    if (!(data.channels instanceof Error)) applyChannels(data.channels);
    if (!(data.wecom instanceof Error)) applyWecom(data.wecom);
    if (!(data.agents instanceof Error)) applyAgents(data.agents);
    if (!(data.knowledge instanceof Error)) applyKnowledge(data.knowledge);
    if (!(data.conversations instanceof Error)) {
      applyConversations(data.conversations);
      const firstConversation = data.conversations.conversations?.[0];
      if (firstConversation?.id) {
        try {
          applyMessages(await request(`/api/app/conversations/${firstConversation.id}/messages`));
        } catch (error) {
          state.fullstackApi.errors.push(`messages: ${error.message}`);
        }
      }
    }

    state.fullstackApi.status = state.fullstackApi.errors.length ? "partial" : "ready";
    state.fullstackApi.loadedAt = new Date().toISOString();
    if (typeof render === "function") render();
  }

  loadFullstackData();
})();
