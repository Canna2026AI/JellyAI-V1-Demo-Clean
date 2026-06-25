// AI flow page and modal events.

function bindFlowEvents() {
document.querySelectorAll("[data-flow-sub]").forEach((el) =>
    el.addEventListener("click", () => setState({ page: "flow", flowSub: el.dataset.flowSub, flowEditing: false }))
  );
  document.querySelectorAll("[data-flow-template-filter]").forEach((el) =>
    el.addEventListener("click", () => setState({ flowTemplateFilter: el.dataset.flowTemplateFilter }))
  );
  document.querySelectorAll("[data-flow-my-filter]").forEach((el) =>
    el.addEventListener("click", () => setState({ flowMyFilter: el.dataset.flowMyFilter }))
  );
  document.querySelectorAll("[data-flow-template-view]").forEach((el) =>
    el.addEventListener("click", () => setState({ drawer: "flowTemplateDetail", selectedFlowTemplateId: el.dataset.flowTemplateView }))
  );
  const flowBack = document.querySelector("[data-flow-back]");
  if (flowBack) flowBack.addEventListener("click", () => setState({ flowEditing: false, flowSub: "mine" }));
  const flowModelPicker = document.querySelector("[data-flow-model-picker]");
  if (flowModelPicker) flowModelPicker.addEventListener("click", () => showToast("模型选择已展开"));
  document.querySelectorAll("[data-flow-picker-tab]").forEach((el) =>
    el.addEventListener("click", () => {
      const key = el.dataset.flowPickerKey;
      if (key === "flowTriggerCategory") setState({ flowTriggerCategory: el.dataset.flowPickerTab });
      if (key === "flowActionCategory") setState({ flowActionCategory: el.dataset.flowPickerTab });
    })
  );
  document.querySelectorAll("[data-flow-trigger-option]").forEach((el) =>
    el.addEventListener("click", () => showToast(`已选择触发事件：${el.dataset.flowTriggerOption}`))
  );
  document.querySelectorAll("[data-flow-action-option]").forEach((el) =>
    el.addEventListener("click", () => showToast(`已选择执行动作：${el.dataset.flowActionOption}`))
  );
  const flowTemplateAdd = document.querySelector("[data-flow-template-add]");
  if (flowTemplateAdd) {
    flowTemplateAdd.addEventListener("click", () => {
      showToast("模板已添加到助手");
      setState({ drawer: null });
    });
  }

const flowTest = document.querySelector("[data-flow-test]");
  if (flowTest) flowTest.addEventListener("click", () => showToast("流程测试成功：AI 回复已发送至企业微信"));
}

function bindFlowModalEvents() {
  // Flow picker modal tabs use the same page-level flow selectors after render.
  bindFlowEvents();
}
