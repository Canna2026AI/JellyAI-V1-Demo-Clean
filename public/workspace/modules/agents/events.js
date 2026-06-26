// AI agents page and modal events.

function bindAgentEvents() {
document.querySelectorAll("[data-assistant-sub]").forEach((el) =>
    el.addEventListener("click", () => setState({ page: "ai", selectedAssistant: null, assistantSub: el.dataset.assistantSub }))
  );
  document.querySelectorAll("[data-open-assistant]").forEach((el) => el.addEventListener("click", () => setState({ selectedAssistant: el.dataset.openAssistant, detailTab: "setting" })));
  document.querySelectorAll("[data-detail-tab]").forEach((el) => el.addEventListener("click", () => setState({ detailTab: el.dataset.detailTab })));
  const modelToggle = document.querySelector("[data-toggle-model-panel]");
  if (modelToggle) modelToggle.addEventListener("click", () => setState({ detailModelOpen: !state.detailModelOpen }));
  document.querySelectorAll("[data-detail-model]").forEach((el) =>
    el.addEventListener("click", () => {
      state.detailModelOpen = false;
      showToast(`已选择模型：${el.dataset.detailModel}`);
      render();
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
    showToast(state.selectedSkillId ? "技能已保存" : "技能已创建并启用");
    setState({ page: "ai", assistantSub: "skill", selectedSkillId: null });
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

const assistantSend = document.getElementById("assistantSend");
  if (assistantSend) assistantSend.addEventListener("click", sendAssistantMessage);
}

function bindAgentModalEvents() {
document.querySelectorAll("[data-import-skill-select]").forEach((el) =>
    el.addEventListener("change", () => {
      const skillId = el.dataset.importSkillSelect;
      const selected = new Set(state.importSkillSelected);
      if (el.checked) selected.add(skillId);
      else selected.delete(skillId);
      setState({ importSkillSelected: Array.from(selected) });
    })
  );
}

function sendAssistantMessage() {
  const input = document.getElementById("assistantInput");
  const text = input.value.trim();
  if (!text) return;
  state.messages.push({ role: "user", text });
  state.messages.push({
    role: "assistant",
    text: "已根据物流问答知识库为您查询：该渠道支持欧洲多国派送，具体价格需要根据重量、派送国家、地址类型和件数核算。",
    meta: "多模态知识库：物流问答 · 执行成功 · 消耗 token：532 · 动作执行：1次 · 预估费用：0.001元",
  });
  render();
}
