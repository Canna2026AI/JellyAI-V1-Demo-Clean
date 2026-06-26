// Browser API client for the AI agents module on the Next.js fullstack API.

(function () {
  const API_BASE = "/api/app";

  function buildQuery(params) {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") query.set(key, value);
    });
    const text = query.toString();
    return text ? `?${text}` : "";
  }

  async function request(path, options = {}) {
    const headers = {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    };
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: "include",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload?.error?.message || payload?.error || `请求失败：${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload;
  }

  function mapStatus(status) {
    return status === "active" || status === "enabled" || status === "启用" ? "enabled" : "disabled";
  }

  function mapKnowledgeBase(row) {
    const metadata = row.metadata || {};
    return {
      id: row.id,
      name: row.name,
      description: row.description || "",
      type: row.kind || metadata.sourceType || "多模态",
      count: `${Number(row.documentCount || 0)}条数据`,
      chunkCount: Number(row.vectorCount || 0),
      status: row.status === "active" ? "启用" : row.status || "启用",
      icon: metadata.icon || "◎",
    };
  }

  function mapAgent(row) {
    const metadata = row.metadata || {};
    return {
      id: row.id,
      name: row.name,
      description: row.description || "",
      status: mapStatus(row.status),
      model: row.model || "local-mock-model",
      opening: metadata.opening || "您好，我是 JellyAI 智能客服助手，请问需要什么帮助？",
      prompt: row.prompt || "请根据知识库和业务规则回复客户。",
      contextLimit: Number(metadata.contextLimit || 4),
      showToken: metadata.showToken !== false,
      knowledgeBaseIds: Array.isArray(row.knowledgeBaseIds) ? row.knowledgeBaseIds : [],
      skillIds: Array.isArray(metadata.skillIds) ? metadata.skillIds : [],
      toolIds: Array.isArray(row.tools) ? row.tools : [],
      intents: Array.isArray(metadata.intents) ? metadata.intents : [],
      integrations: row.channel ? [row.channel] : ["通用"],
      members: Array.isArray(metadata.members) ? metadata.members : ["Kelvin"],
      messages: Array.isArray(metadata.messages)
        ? metadata.messages
        : [{ role: "assistant", text: metadata.opening || "您好，我是 JellyAI 智能客服助手，请问需要什么帮助？" }],
    };
  }

  async function listKnowledgeBases() {
    const payload = await request("/knowledge-bases");
    return (payload.knowledgeBases || []).map(mapKnowledgeBase);
  }

  function localOk(extra = {}) {
    return Promise.resolve({ ok: true, mock: true, ...extra });
  }

  window.agentsService = {
    async bootstrap() {
      const [agentPayload, knowledgePayload] = await Promise.all([
        request("/agents"),
        request("/knowledge-bases").catch(() => ({ knowledgeBases: [] })),
      ]);
      return {
        agents: (agentPayload.agents || []).map(mapAgent),
        knowledgeBases: (knowledgePayload.knowledgeBases || []).map(mapKnowledgeBase),
      };
    },
    health() {
      return request("/bootstrap");
    },
    async listAgents(params = {}) {
      const payload = await request(`/agents${buildQuery(params)}`);
      return (payload.agents || []).map(mapAgent);
    },
    async getAgent(id) {
      const payload = await request(`/agents/${encodeURIComponent(id)}`);
      return mapAgent(payload.agent);
    },
    async createAgent(payload) {
      const result = await request("/agents", {
        method: "POST",
        body: {
          name: payload.name,
          description: payload.description,
          status: "active",
          model: payload.model,
          prompt: payload.prompt,
          channel: "通用",
          metadata: {
            opening: payload.opening,
            contextLimit: payload.contextLimit,
            showToken: payload.showToken,
          },
        },
      });
      return mapAgent(result.agent);
    },
    async updateAgent(id, patch) {
      const result = await request(`/agents/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: {
          name: patch.name,
          description: patch.description,
          status: patch.status === "enabled" ? "active" : patch.status === "disabled" ? "disabled" : patch.status,
          model: patch.model,
          prompt: patch.prompt,
          tools: patch.toolIds || patch.tools,
          knowledgeBaseIds: patch.knowledgeBaseIds,
          metadata: patch,
        },
      });
      return mapAgent(result.agent);
    },
    deleteAgent(id) {
      return localOk({ id, todo: "agent delete API" });
    },
    saveModelConfig(id, patch) {
      return this.updateAgent(id, patch);
    },
    bindKnowledgeBases(id, ids) {
      return this.updateAgent(id, { knowledgeBaseIds: ids });
    },
    removeKnowledgeBase(id, knowledgeBaseId) {
      return localOk({ id, knowledgeBaseId, todo: "agent knowledge unlink API" });
    },
    bindSkills(id, ids) {
      return localOk({ id, ids, todo: "agent skills API" });
    },
    removeSkill(id, skillId) {
      return localOk({ id, skillId, todo: "agent skills API" });
    },
    bindTools(id, ids) {
      return this.updateAgent(id, { tools: ids, toolIds: ids });
    },
    removeTool(id, toolId) {
      return localOk({ id, toolId, todo: "agent tools API" });
    },
    sendChat(id, message) {
      return localOk({ id, message, reply: "本地 V1 暂未接入智能体独立聊天接口。" });
    },
    listKnowledgeBases,
    async createKnowledgeBase(payload) {
      const result = await request("/knowledge-bases", { method: "POST", body: payload });
      return mapKnowledgeBase(result.knowledgeBase);
    },
    uploadKnowledgeFile(payload) {
      return localOk({ payload, todo: "knowledge upload API" });
    },
    updateKnowledgeUpload(uploadId, payload) {
      return localOk({ uploadId, payload, todo: "knowledge upload API" });
    },
    deleteKnowledgeBase(id) {
      return localOk({ id, todo: "knowledge delete API" });
    },
    listSkills(params = {}) {
      void params;
      return localOk({ items: typeof skills !== "undefined" ? skills : [], todo: "skills API" }).then((payload) => payload.items);
    },
    createSkill(payload) {
      return localOk({ payload, todo: "skills API" });
    },
    updateSkill(id, patch) {
      return localOk({ id, patch, todo: "skills API" });
    },
    deleteSkill(id) {
      return localOk({ id, todo: "skills API" });
    },
    listTools() {
      return localOk({ items: typeof aiTools !== "undefined" ? aiTools : [], todo: "tools API" }).then((payload) => payload.items);
    },
    createTool(payload) {
      return localOk({ payload, todo: "tools API" });
    },
  };
})();
