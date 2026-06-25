// Browser API client for the AI agents module.

(function () {
  const API_BASE = "/api";

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
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) {
      const message = payload?.error?.message || `请求失败：${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload.data;
  }

  window.agentsService = {
    bootstrap() {
      return request("/agents/bootstrap");
    },
    health() {
      return request("/health");
    },
    listAgents(params = {}) {
      return request(`/agents${buildQuery(params)}`);
    },
    getAgent(id) {
      return request(`/agents/${encodeURIComponent(id)}`);
    },
    createAgent(payload) {
      return request("/agents", { method: "POST", body: payload });
    },
    updateAgent(id, patch) {
      return request(`/agents/${encodeURIComponent(id)}`, { method: "PATCH", body: patch });
    },
    deleteAgent(id) {
      return request(`/agents/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
    saveModelConfig(id, patch) {
      return request(`/agents/${encodeURIComponent(id)}/model-config`, { method: "PATCH", body: patch });
    },
    bindKnowledgeBases(id, ids) {
      return request(`/agents/${encodeURIComponent(id)}/knowledge-bases`, { method: "POST", body: { ids, mode: "replace" } });
    },
    removeKnowledgeBase(id, knowledgeBaseId) {
      return request(`/agents/${encodeURIComponent(id)}/knowledge-bases/${encodeURIComponent(knowledgeBaseId)}`, { method: "DELETE" });
    },
    bindSkills(id, ids) {
      return request(`/agents/${encodeURIComponent(id)}/skills`, { method: "POST", body: { ids, mode: "replace" } });
    },
    removeSkill(id, skillId) {
      return request(`/agents/${encodeURIComponent(id)}/skills/${encodeURIComponent(skillId)}`, { method: "DELETE" });
    },
    bindTools(id, ids) {
      return request(`/agents/${encodeURIComponent(id)}/tools`, { method: "POST", body: { ids, mode: "replace" } });
    },
    removeTool(id, toolId) {
      return request(`/agents/${encodeURIComponent(id)}/tools/${encodeURIComponent(toolId)}`, { method: "DELETE" });
    },
    sendChat(id, message) {
      return request(`/agents/${encodeURIComponent(id)}/chat`, { method: "POST", body: { message } });
    },
    listKnowledgeBases() {
      return request("/knowledge-bases");
    },
    deleteKnowledgeBase(id) {
      return request(`/knowledge-bases/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
    listSkills(params = {}) {
      return request(`/skills${buildQuery(params)}`);
    },
    createSkill(payload) {
      return request("/skills", { method: "POST", body: payload });
    },
    updateSkill(id, patch) {
      return request(`/skills/${encodeURIComponent(id)}`, { method: "PATCH", body: patch });
    },
    deleteSkill(id) {
      return request(`/skills/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
    listTools() {
      return request("/tools");
    },
    createTool(payload) {
      return request("/tools", { method: "POST", body: payload });
    },
  };
})();
