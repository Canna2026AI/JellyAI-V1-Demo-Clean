// Mock service helpers for the AI agents module.

function ensureAgentState() {
  if (!state.agentSearchQuery) state.agentSearchQuery = "";
  if (!state.agentStatusFilter) state.agentStatusFilter = "all";
  if (!state.selectedAgentId && state.selectedAssistant) state.selectedAgentId = state.selectedAssistant;
  if (!state.agentModalSelection) state.agentModalSelection = [];
  if (!state.agentToolSelection) state.agentToolSelection = [];
  if (!state.agentChatLoading) state.agentChatLoading = false;
}

function getAgents() {
  ensureAgentState();
  const query = state.agentSearchQuery.trim().toLowerCase();
  return aiAgents.filter((agent) => {
    const matchesQuery = !query || `${agent.name} ${agent.description}`.toLowerCase().includes(query);
    const matchesStatus = state.agentStatusFilter === "all" || agent.status === state.agentStatusFilter;
    return matchesQuery && matchesStatus;
  });
}

function getSelectedAgent() {
  ensureAgentState();
  return aiAgents.find((agent) => agent.id === state.selectedAgentId) || aiAgents.find((agent) => agent.id === state.selectedAssistant) || aiAgents[0];
}

function getAgentSettingsDraft(agent) {
  if (!agent) return null;
  if (!state.agentSettingsDraft || state.agentSettingsDraft.agentId !== agent.id) {
    state.agentSettingsDraft = {
      agentId: agent.id,
      name: agent.name,
      description: agent.description,
      model: agent.model,
      prompt: agent.prompt,
      opening: agent.opening,
      contextLimit: agent.contextLimit,
      showToken: agent.showToken,
    };
  }
  return state.agentSettingsDraft;
}

function captureAgentSettingsDraft() {
  const agent = getSelectedAgent();
  if (!agent) return;
  state.agentSettingsDraft = {
    agentId: agent.id,
    name: document.getElementById("agentNameInput")?.value.trim() || agent.name,
    description: document.getElementById("agentDescInput")?.value.trim() || agent.description,
    model: document.getElementById("agentModelInput")?.value || agent.model,
    prompt: document.getElementById("agentPromptInput")?.textContent.trim() || agent.prompt,
    opening: document.getElementById("agentOpeningInput")?.textContent.trim() || agent.opening,
    contextLimit: Number(document.getElementById("agentContextInput")?.value || agent.contextLimit),
    showToken: document.getElementById("agentShowTokenInput")?.classList.contains("on") ?? agent.showToken,
  };
}

function openAgent(agentId, tab = "setting") {
  state.selectedAgentId = agentId;
  state.selectedAssistant = agentId;
  state.detailTab = tab;
  state.detailModelOpen = false;
  state.agentSettingsDraft = null;
  render();
}

function createAgentFromForm() {
  const name = document.getElementById("newAssistantName")?.value.trim() || "新建助手";
  const description = document.getElementById("newAssistantDesc")?.value.trim() || "用于新的客户服务场景";
  const model = document.getElementById("newAssistantModel")?.value || aiAgentModels[0];
  const opening = document.getElementById("newAssistantOpening")?.value.trim() || "您好，我是您的智能助手，请问需要什么帮助？";
  const id = `agent-${Date.now()}`;
  aiAgents.unshift({
    id,
    name,
    description,
    status: "enabled",
    model,
    opening,
    prompt: "请在此补充助手的功能与步骤设置。",
    contextLimit: 4,
    showToken: true,
    knowledgeBaseIds: [],
    skillIds: [],
    toolIds: [],
    intents: [],
    integrations: [],
    members: ["Kelvin"],
    messages: [{ role: "assistant", text: opening }],
  });
  state.modal = null;
  state.agentSearchQuery = "";
  state.agentStatusFilter = "all";
  openAgent(id, "setting");
  showToast("创建助手成功");
}

function updateSelectedAgent(patch) {
  const agent = getSelectedAgent();
  if (!agent) return null;
  Object.assign(agent, patch);
  return agent;
}

function deleteSelectedAgent() {
  const agent = getSelectedAgent();
  if (!agent) return;
  const index = aiAgents.findIndex((item) => item.id === agent.id);
  if (index >= 0) aiAgents.splice(index, 1);
  state.modal = null;
  state.selectedAssistant = null;
  state.selectedAgentId = null;
  state.detailTab = "setting";
  showToast("智能体已删除");
  render();
}

function toggleAgentStatus(agentId) {
  const agent = aiAgents.find((item) => item.id === agentId);
  if (!agent) return;
  agent.status = agent.status === "enabled" ? "disabled" : "enabled";
  showToast(agent.status === "enabled" ? "智能体已启用" : "智能体已停用");
  render();
}

function saveAgentSettings() {
  const agent = getSelectedAgent();
  if (!agent) return;
  captureAgentSettingsDraft();
  const draft = getAgentSettingsDraft(agent);
  updateSelectedAgent({
    name: draft.name,
    description: draft.description,
    model: draft.model,
    prompt: draft.prompt,
    opening: draft.opening,
    contextLimit: draft.contextLimit,
    showToken: draft.showToken,
  });
  agent.messages[0] = { role: "assistant", text: agent.opening };
  state.detailModelOpen = false;
  state.agentSettingsDraft = null;
  showToast("模型配置已保存");
  render();
}

function setAgentRelation(agent, key, ids) {
  agent[key] = ids;
  showToast("配置已保存");
  render();
}

function generateAgentReply(agent, text) {
  const hasKnowledge = agent.knowledgeBaseIds.length > 0;
  const hasTools = agent.toolIds.length > 0;
  const hasSkills = agent.skillIds.length > 0;
  const lower = text.toLowerCase();
  if (text.includes("报价") || text.includes("价格") || lower.includes("price")) {
    return {
      text: "可以，我需要重量、目的国家/城市、件数和地址类型。收到这些信息后，我会按已绑定的报价规则整理参考报价。",
      meta: `${hasKnowledge ? "知识库：物流问答 · " : ""}${hasTools ? "工具执行：报价字段校验 · " : ""}消耗 token：486 · 预估费用：0.001元`,
    };
  }
  if (text.includes("人工") || text.includes("客服")) {
    return {
      text: "已识别到转人工意图。我会先整理当前问题摘要，并提示人工客服接入处理。",
      meta: `${hasSkills ? "技能：转人工服务 · " : ""}意图：转人工 · 执行成功`,
    };
  }
  return {
    text: `已收到：“${text}”。我会基于当前助手的模型、知识库、技能和工具配置生成回复。`,
    meta: `${agent.model} · ${hasKnowledge ? "已检索知识库" : "未绑定知识库"} · ${hasTools ? "可调用工具" : "未添加工具"} · 消耗 token：352`,
  };
}
