// AI agents page and modal events.

function bindAgentSearchInput(selector, stateKey, options = {}) {
  const input = document.querySelector(selector);
  if (!input) return;
  input.addEventListener("input", () => {
    const cursor = input.selectionStart || input.value.length;
    options.beforeRender?.();
    state[stateKey] = input.value;
    render();
    const nextInput = document.querySelector(selector);
    if (nextInput) {
      nextInput.focus();
      nextInput.setSelectionRange(cursor, cursor);
    }
  });
}

function bindAgentEvents() {
  ensureAgentState();
  bindAgentSearchInput("[data-agent-search]", "agentSearchQuery");
  bindAgentSearchInput("[data-agent-knowledge-search]", "agentKnowledgeSearchQuery");
  bindAgentSearchInput("[data-skill-search]", "skillSearchQuery");
  bindAgentSearchInput("[data-ai-tool-search]", "aiToolSearchQuery");
  bindAgentSearchInput("[data-agent-intent-search]", "agentIntentSearchQuery");
  bindAgentSearchInput("[data-agent-summary-search]", "agentSummarySearchQuery");
  bindAgentSearchInput("[data-agent-model-search]", "agentModelSearchQuery", { beforeRender: captureAgentSettingsDraft });
  document.querySelectorAll("[data-agent-filter]").forEach((el) =>
    el.addEventListener("click", () => setState({ agentStatusFilter: el.dataset.agentFilter }))
  );
  document.querySelectorAll("[data-agent-status-toggle]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleAgentStatus(el.dataset.agentStatusToggle);
    })
  );
  document.querySelectorAll("[data-assistant-sub]").forEach((el) =>
    el.addEventListener("click", () => setState({ page: "ai", selectedAssistant: null, assistantSub: el.dataset.assistantSub }))
  );
  document.querySelectorAll("[data-open-assistant]").forEach((el) => el.addEventListener("click", () => openAgent(el.dataset.openAssistant, "setting")));
  document.querySelectorAll("[data-detail-tab]").forEach((el) => el.addEventListener("click", () => setState({ detailTab: el.dataset.detailTab })));
  const modelToggle = document.querySelector("[data-toggle-model-panel]");
  if (modelToggle) modelToggle.addEventListener("click", () => {
    captureAgentSettingsDraft();
    setState({ detailModelOpen: !state.detailModelOpen });
  });
  document.querySelectorAll("[data-detail-model]").forEach((el) =>
    el.addEventListener("click", () => {
      captureAgentSettingsDraft();
      state.agentSettingsDraft.model = el.dataset.detailModel;
      state.detailModelOpen = false;
      showToast(`已选择模型：${el.dataset.detailModel}`);
      render();
    })
  );
  const saveSettings = document.querySelector("[data-agent-save-settings]");
  if (saveSettings) saveSettings.addEventListener("click", saveAgentSettings);
  document.querySelectorAll("[data-agent-remove-knowledge]").forEach((el) =>
    el.addEventListener("click", () => {
      const agent = getSelectedAgent();
      setAgentRelation(agent, "knowledgeBaseIds", agent.knowledgeBaseIds.filter((id) => id !== el.dataset.agentRemoveKnowledge));
      showToast("知识库已移除");
    })
  );
  document.querySelectorAll("[data-agent-remove-skill]").forEach((el) =>
    el.addEventListener("click", () => {
      const agent = getSelectedAgent();
      setAgentRelation(agent, "skillIds", agent.skillIds.filter((id) => id !== el.dataset.agentRemoveSkill));
      showToast("技能已移除");
    })
  );
  document.querySelectorAll("[data-agent-remove-tool]").forEach((el) =>
    el.addEventListener("click", () => {
      const agent = getSelectedAgent();
      setAgentRelation(agent, "toolIds", agent.toolIds.filter((id) => id !== el.dataset.agentRemoveTool));
      showToast("工具已移除");
    })
  );
  document.querySelectorAll("[data-detail-action]").forEach((el) =>
    el.addEventListener("click", () => showToast(`${el.dataset.detailAction}已触发`))
  );
  document.querySelectorAll("[data-tool-picker-tab]").forEach((el) =>
    el.addEventListener("click", () => setState({ detailToolPickerTab: el.dataset.toolPickerTab }))
  );
  document.querySelectorAll("[data-tool-picker-app]").forEach((el) =>
    el.addEventListener("click", () => showToast(`已选择应用：${el.dataset.toolPickerApp}`))
  );

document.querySelectorAll("[data-skill-filter]").forEach((el) =>
    el.addEventListener("click", () => setState({ skillFilter: el.dataset.skillFilter }))
  );
  const skillGuideClose = document.querySelector("[data-skill-guide-close]");
  if (skillGuideClose) skillGuideClose.addEventListener("click", () => setState({ skillGuideVisible: false }));
  const skillChannel = document.querySelector("[data-skill-channel]");
  if (skillChannel) skillChannel.addEventListener("click", () => showToast("渠道筛选已展开"));
  document.querySelectorAll("[data-skill-open]").forEach((el) =>
    el.addEventListener("click", () => setState({ page: "skillEdit", selectedAssistant: null, assistantSub: "skill", selectedSkillId: el.dataset.skillOpen }))
  );
  const skillCreate = document.querySelector("[data-skill-create]");
  if (skillCreate) skillCreate.addEventListener("click", () => setState({ page: "skillEdit", selectedAssistant: null, assistantSub: "skill", selectedSkillId: null }));
  document.querySelectorAll("[data-back-skills]").forEach((el) =>
    el.addEventListener("click", () => setState({ page: "ai", assistantSub: "skill", selectedSkillId: null }))
  );
  const skillSave = document.querySelector("[data-skill-save]");
  if (skillSave) skillSave.addEventListener("click", () => {
    saveSkillFromEditor();
  });
  document.querySelectorAll("[data-ai-tool-filter]").forEach((el) =>
    el.addEventListener("click", () => setState({ aiToolFilter: el.dataset.aiToolFilter }))
  );
  const aiToolGuideClose = document.querySelector("[data-ai-tool-guide-close]");
  if (aiToolGuideClose) aiToolGuideClose.addEventListener("click", () => setState({ aiToolGuideVisible: false }));
  const toolCategory = document.querySelector(".tool-category");
  if (toolCategory) toolCategory.addEventListener("click", () => showToast("工具类别筛选已展开"));
  const summaryEnable = document.querySelector("[data-summary-enable]");
  if (summaryEnable) {
    summaryEnable.addEventListener("click", () => {
      showToast("已跳转到 AI 自动化，可开启 AI 知识补充");
      setState({ page: "ai", assistantSub: "auto" });
    });
  }
  document.querySelectorAll("[data-automation-toggle]").forEach((el) =>
    el.addEventListener("click", () => showToast(`${el.dataset.automationToggle}已更新`))
  );

  const assistantInput = document.getElementById("assistantInput");
  if (assistantInput) {
    assistantInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendAssistantMessage();
      }
    });
  }
  const assistantSend = document.getElementById("assistantSend");
  if (assistantSend) assistantSend.addEventListener("click", sendAssistantMessage);
}

function bindAgentModalEvents() {
  document.querySelectorAll("[data-close-modal]").forEach((el) =>
    el.addEventListener("click", () => {
      state.agentModalSelection = [];
      state.agentToolSelection = [];
      state.agentModalAgentId = null;
      state.agentToolModalAgentId = null;
      state.agentSkillModalAgentId = null;
      state.importSkillSearchQuery = "";
      state.agentToolPickerSearchQuery = "";
      state.agentModelSearchQuery = "";
    })
  );
  document.querySelectorAll("[data-import-skill-select]").forEach((el) =>
    el.addEventListener("change", () => {
      const skillId = el.dataset.importSkillSelect;
      const selected = new Set(state.importSkillSelected);
      if (el.checked) selected.add(skillId);
      else selected.delete(skillId);
      setState({ importSkillSelected: Array.from(selected) });
    })
  );
  bindAgentSearchInput("[data-import-skill-search]", "importSkillSearchQuery");
  bindAgentSearchInput("[data-tool-picker-search]", "agentToolPickerSearchQuery");
  document.querySelectorAll("[data-agent-knowledge-select]").forEach((el) =>
    el.addEventListener("change", () => {
      const selected = new Set(state.agentModalSelection);
      if (el.checked) selected.add(el.dataset.agentKnowledgeSelect);
      else selected.delete(el.dataset.agentKnowledgeSelect);
      setState({ agentModalSelection: Array.from(selected) });
    })
  );
  document.querySelectorAll("[data-agent-tool-select]").forEach((el) =>
    el.addEventListener("change", () => {
      const selected = new Set(state.agentToolSelection);
      if (el.checked) selected.add(el.dataset.agentToolSelect);
      else selected.delete(el.dataset.agentToolSelect);
      setState({ agentToolSelection: Array.from(selected) });
    })
  );
}

function sendAssistantMessage() {
  const agent = getSelectedAgent();
  const input = document.getElementById("assistantInput");
  const text = input.value.trim();
  if (!text || !agent || state.agentChatLoading) return;
  agent.messages.push({ role: "user", text });
  input.value = "";
  state.agentChatLoading = true;
  render();
  window.setTimeout(() => {
    const reply = generateAgentReply(agent, text);
    agent.messages.push({ role: "assistant", text: reply.text, meta: reply.meta });
    state.agentChatLoading = false;
    render();
  }, 450);
}
