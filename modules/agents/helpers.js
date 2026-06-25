// Frontend helpers for the AI agents module. Arrays remain the render cache;
// writes are persisted through services/agentsService.js when the backend is running.

function ensureAgentState() {
  if (!state.agentSearchQuery) state.agentSearchQuery = "";
  if (!state.agentStatusFilter) state.agentStatusFilter = "all";
  if (!state.agentKnowledgeSearchQuery) state.agentKnowledgeSearchQuery = "";
  if (!state.skillSearchQuery) state.skillSearchQuery = "";
  if (!state.aiToolSearchQuery) state.aiToolSearchQuery = "";
  if (!state.importSkillSearchQuery) state.importSkillSearchQuery = "";
  if (!state.agentToolPickerSearchQuery) state.agentToolPickerSearchQuery = "";
  if (!state.agentModelSearchQuery) state.agentModelSearchQuery = "";
  if (!state.agentIntentSearchQuery) state.agentIntentSearchQuery = "";
  if (!state.agentSummarySearchQuery) state.agentSummarySearchQuery = "";
  if (!state.selectedAgentId && state.selectedAssistant) state.selectedAgentId = state.selectedAssistant;
  if (!state.agentModalSelection) state.agentModalSelection = [];
  if (!state.agentToolSelection) state.agentToolSelection = [];
  if (!state.agentChatLoading) state.agentChatLoading = false;
  if (typeof state.agentBackendLoaded !== "boolean") state.agentBackendLoaded = false;
  if (typeof state.agentBackendLoading !== "boolean") state.agentBackendLoading = false;
  if (typeof state.agentBackendSaving !== "boolean") state.agentBackendSaving = false;
  if (typeof state.agentBackendOffline !== "boolean") state.agentBackendOffline = false;
  if (typeof state.agentBackendAttempted !== "boolean") state.agentBackendAttempted = false;
}

function replaceCollection(collection, items) {
  collection.splice(0, collection.length, ...(items || []));
}

function removeById(collection, id) {
  const index = collection.findIndex((entry) => entry.id === id);
  if (index >= 0) collection.splice(index, 1);
}

function getAgentApi() {
  return window.agentsService || null;
}

function applyAgentBackendData(data) {
  if (!data) return;
  if (data.models) replaceCollection(aiAgentModels, data.models);
  if (data.integrations) replaceCollection(aiAgentIntegrations, data.integrations);
  if (data.knowledgeBases) replaceCollection(knowledgeBases, data.knowledgeBases);
  if (data.skills) replaceCollection(skills, data.skills);
  if (data.tools) replaceCollection(aiTools, data.tools);
  if (data.toolOptions) replaceCollection(aiAgentToolOptions, data.toolOptions);
  if (data.agents) replaceCollection(aiAgents, data.agents);
  const selectedExists = aiAgents.some((agent) => agent.id === state.selectedAgentId);
  if (state.selectedAgentId && !selectedExists) {
    state.selectedAgentId = aiAgents[0]?.id || null;
    state.selectedAssistant = state.selectedAgentId;
  }
}

function handleAgentApiError(error, fallbackMessage = "后端暂时不可用，当前操作未保存") {
  state.agentBackendOffline = true;
  const message = error?.message || fallbackMessage;
  showToast(message);
}

async function syncAgentDataFromBackend(options = {}) {
  ensureAgentState();
  const api = getAgentApi();
  if (!api || state.agentBackendLoading || state.agentBackendLoaded || state.agentBackendAttempted) return;
  state.agentBackendAttempted = true;
  state.agentBackendLoading = true;
  if (!options.silent) render();
  try {
    const data = await api.bootstrap();
    applyAgentBackendData(data);
    state.agentBackendLoaded = true;
    state.agentBackendOffline = false;
  } catch (error) {
    state.agentBackendOffline = true;
    if (!state.agentBackendNoticeShown && !options.silent) {
      showToast("后端未连接，当前使用页面内演示数据");
      state.agentBackendNoticeShown = true;
    }
  } finally {
    state.agentBackendLoading = false;
    render();
  }
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

function getAgentKnowledgeBases() {
  ensureAgentState();
  const query = state.agentKnowledgeSearchQuery.trim().toLowerCase();
  return knowledgeBases.filter((kb) => !query || `${kb.name} ${kb.type} ${kb.count}`.toLowerCase().includes(query));
}

function getFilteredSkills() {
  ensureAgentState();
  const query = state.skillSearchQuery.trim().toLowerCase();
  return skills.filter((skill) => {
    const matchesFilter = state.skillFilter === "all" || skill.source === state.skillFilter;
    const matchesQuery = !query || `${skill.name} ${skill.desc} ${skill.channel}`.toLowerCase().includes(query);
    return matchesFilter && matchesQuery;
  });
}

function getFilteredAiTools() {
  ensureAgentState();
  const query = state.aiToolSearchQuery.trim().toLowerCase();
  return aiTools.filter((tool) => {
    const matchesFilter = state.aiToolFilter !== "connected" || tool.connected;
    const matchesQuery = !query || `${tool.name} ${tool.status} ${tool.icon}`.toLowerCase().includes(query);
    return matchesFilter && matchesQuery;
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

function buildLocalAgent(payload) {
  const id = `agent-${Date.now()}`;
  return {
    id,
    name: payload.name,
    description: payload.description,
    status: "enabled",
    model: payload.model,
    opening: payload.opening,
    prompt: payload.prompt,
    contextLimit: payload.contextLimit,
    showToken: payload.showToken,
    knowledgeBaseIds: [],
    skillIds: [],
    toolIds: [],
    intents: [],
    integrations: [],
    members: ["Kelvin"],
    messages: [{ role: "assistant", text: payload.opening }],
  };
}

async function createAgentFromForm() {
  const payload = {
    name: document.getElementById("newAssistantName")?.value.trim() || "新建助手",
    description: document.getElementById("newAssistantDesc")?.value.trim() || "用于新的客户服务场景",
    model: document.getElementById("newAssistantModel")?.value || aiAgentModels[0],
    opening: document.getElementById("newAssistantOpening")?.value.trim() || "您好，我是您的智能助手，请问需要什么帮助？",
    prompt: "请在此补充助手的功能与步骤设置。",
    contextLimit: 4,
    showToken: true,
  };
  let agent;
  const api = getAgentApi();
  state.agentBackendSaving = true;
  try {
    agent = api ? await api.createAgent(payload) : buildLocalAgent(payload);
    aiAgents.unshift(agent);
  } catch (error) {
    if (state.agentBackendLoaded) {
      handleAgentApiError(error, "创建助手失败");
      return;
    }
    agent = buildLocalAgent(payload);
    aiAgents.unshift(agent);
    handleAgentApiError(error, "后端未连接，已仅在当前页面创建");
  } finally {
    state.agentBackendSaving = false;
  }
  state.modal = null;
  state.agentSearchQuery = "";
  state.agentStatusFilter = "all";
  openAgent(agent.id, "setting");
  showToast("创建助手成功");
}

function updateSelectedAgent(patch) {
  const agent = getSelectedAgent();
  if (!agent) return null;
  Object.assign(agent, patch);
  return agent;
}

async function deleteSelectedAgent() {
  const agent = getSelectedAgent();
  if (!agent) return;
  const api = getAgentApi();
  state.agentBackendSaving = true;
  try {
    if (api) await api.deleteAgent(agent.id);
  } catch (error) {
    state.agentBackendSaving = false;
    if (state.agentBackendLoaded) {
      handleAgentApiError(error, "删除智能体失败");
      return;
    }
    handleAgentApiError(error, "后端未连接，已仅在当前页面删除");
  }
  const index = aiAgents.findIndex((item) => item.id === agent.id);
  if (index >= 0) aiAgents.splice(index, 1);
  state.agentBackendSaving = false;
  state.modal = null;
  state.selectedAssistant = null;
  state.selectedAgentId = null;
  state.detailTab = "setting";
  showToast("智能体已删除");
  render();
}

async function toggleAgentStatus(agentId) {
  const agent = aiAgents.find((item) => item.id === agentId);
  if (!agent) return;
  const previousStatus = agent.status;
  agent.status = previousStatus === "enabled" ? "disabled" : "enabled";
  render();
  const api = getAgentApi();
  try {
    if (api) {
      const saved = await api.updateAgent(agent.id, { status: agent.status });
      Object.assign(agent, saved);
    }
  } catch (error) {
    if (state.agentBackendLoaded) agent.status = previousStatus;
    handleAgentApiError(error, "状态更新失败");
    render();
    return;
  }
  showToast(agent.status === "enabled" ? "智能体已启用" : "智能体已停用");
  render();
}

async function saveAgentSettings() {
  const agent = getSelectedAgent();
  if (!agent) return;
  captureAgentSettingsDraft();
  const draft = getAgentSettingsDraft(agent);
  const patch = {
    name: draft.name,
    description: draft.description,
    model: draft.model,
    prompt: draft.prompt,
    opening: draft.opening,
    contextLimit: draft.contextLimit,
    showToken: draft.showToken,
  };
  const api = getAgentApi();
  state.agentBackendSaving = true;
  try {
    const saved = api ? await api.saveModelConfig(agent.id, patch) : updateSelectedAgent(patch);
    Object.assign(agent, saved);
  } catch (error) {
    state.agentBackendSaving = false;
    if (state.agentBackendLoaded) {
      handleAgentApiError(error, "模型配置保存失败");
      return;
    }
    updateSelectedAgent(patch);
    handleAgentApiError(error, "后端未连接，已仅在当前页面保存");
  }
  if (agent.messages?.length) agent.messages[0] = { role: "assistant", text: agent.opening };
  state.agentBackendSaving = false;
  state.detailModelOpen = false;
  state.agentSettingsDraft = null;
  showToast("模型配置已保存");
  render();
}

async function saveSkillFromEditor() {
  const existing = skills.find((item) => item.id === state.selectedSkillId);
  const name = document.getElementById("skillNameInput")?.value.trim() || "未命名技能";
  const desc = document.getElementById("skillDescInput")?.value.trim() || "用于补充智能体执行能力";
  const prompt = document.getElementById("skillPromptInput")?.textContent.trim() || "请描述技能触发条件与执行步骤。";
  const payload = { name, desc, prompt, channel: existing?.channel || "通用", source: existing?.source || "mine", icon: existing?.icon || "AI", tool: Boolean(existing?.tool) };
  const api = getAgentApi();
  try {
    if (existing) {
      const saved = api ? await api.updateSkill(existing.id, payload) : Object.assign(existing, payload);
      Object.assign(existing, saved);
    } else {
      const saved = api
        ? await api.createSkill(payload)
        : { ...payload, id: `skill-${Date.now()}` };
      skills.unshift(saved);
    }
  } catch (error) {
    if (state.agentBackendLoaded) {
      handleAgentApiError(error, existing ? "技能保存失败" : "技能创建失败");
      return;
    }
    if (existing) Object.assign(existing, payload);
    else skills.unshift({ ...payload, id: `skill-${Date.now()}` });
    handleAgentApiError(error, "后端未连接，已仅在当前页面保存技能");
  }
  if (existing) {
    showToast("技能已保存");
  } else {
    showToast("技能已创建并启用");
  }
  state.page = "ai";
  state.assistantSub = "skill";
  state.selectedSkillId = null;
  state.skillFilter = "all";
  state.skillSearchQuery = "";
  render();
}

async function deleteSelectedSkill() {
  const skill = skills.find((item) => item.id === state.selectedSkillId);
  if (!skill) return;
  const api = getAgentApi();
  try {
    if (api) await api.deleteSkill(skill.id);
  } catch (error) {
    if (state.agentBackendLoaded) {
      handleAgentApiError(error, "技能删除失败");
      return;
    }
    handleAgentApiError(error, "后端未连接，已仅在当前页面删除技能");
  }
  removeById(skills, skill.id);
  aiAgents.forEach((agent) => {
    agent.skillIds = (agent.skillIds || []).filter((id) => id !== skill.id);
  });
  state.modal = null;
  state.page = "ai";
  state.assistantSub = "skill";
  state.selectedSkillId = null;
  showToast("技能已删除");
  render();
}

async function createCustomToolFromForm() {
  const name = document.getElementById("customToolName")?.value.trim() || "内部订单查询";
  const desc = document.getElementById("customToolDesc")?.value.trim() || "根据订单号查询物流轨迹、费用和签收状态。";
  const payload = {
    name,
    status: "已创建 · 待授权",
    icon: name.slice(0, 2).toUpperCase(),
    connected: false,
    desc,
    action: "调用第三方接口",
  };
  const api = getAgentApi();
  try {
    const saved = api ? await api.createTool(payload) : { tool: { ...payload, id: `tool-${Date.now()}` }, toolOption: { ...payload, id: `tool-${Date.now()}` } };
    aiTools.unshift(saved.tool);
    aiAgentToolOptions.unshift(saved.toolOption);
  } catch (error) {
    if (state.agentBackendLoaded) {
      handleAgentApiError(error, "自定义工具创建失败");
      return;
    }
    const localId = `tool-${Date.now()}`;
    aiTools.unshift({ ...payload, id: localId });
    aiAgentToolOptions.unshift({ id: localId, name, action: payload.action, icon: payload.icon, status: payload.status });
    handleAgentApiError(error, "后端未连接，已仅在当前页面创建工具");
  }
  state.modal = null;
  state.aiToolFilter = "all";
  state.aiToolSearchQuery = "";
  showToast("自定义工具已创建");
  render();
}

async function deleteSelectedKnowledgeBase() {
  const knowledgeBaseId = state.selectedKnowledgeBaseId;
  const knowledgeBase = knowledgeBases.find((item) => item.id === knowledgeBaseId);
  if (!knowledgeBase) return;
  const api = getAgentApi();
  try {
    if (api) await api.deleteKnowledgeBase(knowledgeBase.id);
  } catch (error) {
    if (state.agentBackendLoaded) {
      handleAgentApiError(error, "知识库删除失败");
      return;
    }
    handleAgentApiError(error, "后端未连接，已仅在当前页面删除知识库");
  }
  removeById(knowledgeBases, knowledgeBase.id);
  aiAgents.forEach((agent) => {
    agent.knowledgeBaseIds = (agent.knowledgeBaseIds || []).filter((id) => id !== knowledgeBase.id);
  });
  state.modal = null;
  state.selectedKnowledgeBaseId = null;
  showToast("知识库已删除");
  render();
}

async function setAgentRelation(agent, key, ids, successMessage = "配置已保存") {
  if (!agent) return;
  const previous = [...(agent[key] || [])];
  agent[key] = ids;
  render();
  const api = getAgentApi();
  try {
    let saved = agent;
    if (api && key === "knowledgeBaseIds") saved = await api.bindKnowledgeBases(agent.id, ids);
    if (api && key === "skillIds") saved = await api.bindSkills(agent.id, ids);
    if (api && key === "toolIds") saved = await api.bindTools(agent.id, ids);
    Object.assign(agent, saved);
  } catch (error) {
    if (state.agentBackendLoaded) agent[key] = previous;
    handleAgentApiError(error, "配置保存失败");
    render();
    return;
  }
  showToast(successMessage);
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
