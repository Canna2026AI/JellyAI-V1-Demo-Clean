// Global shell, navigation, topbar, and public modal/drawer events.

function bindEvents() {
document.querySelectorAll("[data-top-popover]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      const target = el.dataset.topPopover;
      setState({ topPopover: state.topPopover === target ? null : target });
    })
  );
  document.querySelectorAll("[data-open-conversation-intro]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      setState({ drawer: "conversationIntro", topPopover: null, agentStatusOpen: false });
    })
  );
document.querySelectorAll("[data-recharge-step]").forEach((el) =>
    el.addEventListener("click", () => {
      const nextAmount = Math.max(100, state.rechargeAmount + Number(el.dataset.rechargeStep || 0));
      setState({ rechargeAmount: nextAmount });
    })
  );
  const rechargeInput = document.querySelector("[data-recharge-amount]");
  if (rechargeInput) rechargeInput.addEventListener("input", () => {
    const value = Number(rechargeInput.value);
    state.rechargeAmount = Number.isFinite(value) ? Math.max(100, value) : 100;
  });
const marketingToggle = document.querySelector("[data-marketing-toggle]");
  if (marketingToggle) {
    marketingToggle.addEventListener("click", () => {
      setState({ page: "marketing", selectedAssistant: null, marketingNavOpen: state.page === "marketing" ? !state.marketingNavOpen : true });
    });
  }
  const sidebarCollapse = document.querySelector("[data-sidebar-collapse]");
  if (sidebarCollapse) sidebarCollapse.addEventListener("click", () => setState({ sidebarCollapsed: !state.sidebarCollapsed }));
  document.querySelectorAll("[data-marketing-sub]").forEach((el) =>
    el.addEventListener("click", () => setState({ page: "marketing", selectedAssistant: null, marketingNavOpen: true, marketingSub: el.dataset.marketingSub, marketingAccountTab: "accounts" }))
  );
document.querySelectorAll("[data-demo-action]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      showToast(`${el.dataset.demoAction}（Demo）`);
    })
  );
  document.querySelectorAll("[data-page]").forEach((el) =>
    el.addEventListener("click", () => {
      const page = el.dataset.page;
      if (!page) return;
      if (page === "knowledgeCreate") {
        if (typeof resetKnowledgeCreateState === "function") {
          resetKnowledgeCreateState({ page, selectedAssistant: null, assistantSub: "knowledge", topPopover: null, agentStatusOpen: false });
        } else {
          setState({ page, selectedAssistant: null, assistantSub: "knowledge", knowledgeCreateStep: 1, knowledgeCreateType: "", knowledgeVectorMode: "row", knowledgeSegmentMode: "auto", knowledgePreview: false, topPopover: null, agentStatusOpen: false });
        }
        return;
      }
      if (page === "wechat" && state.page !== "wechat") {
        setState({ page, selectedAssistant: null, wechatTab: "accounts", topPopover: null, agentStatusOpen: false });
        return;
      }
      if (page === "flow" && state.page !== "flow") {
        setState({ page, selectedAssistant: null, flowEditing: false, topPopover: null, agentStatusOpen: false });
        return;
      }
      setState({ page, selectedAssistant: null, topPopover: null, agentStatusOpen: false });
    })
  );
document.querySelectorAll("[data-modal]").forEach((el) => el.addEventListener("click", () => {
    const modalName = el.dataset.modal;
    if (modalName === "customView") {
      setState({ modal: modalName, topPopover: null, customViewStep: 1, customViewName: "", customViewAccess: "all", customViewFilterRows: 1, customViewFieldOpen: false, customViewManual: false });
      return;
    }
    if (modalName === "authAccount") {
      setState({ modal: modalName, topPopover: null, authStep: 1, authAccountTarget: null });
      return;
    }
    setState({ modal: modalName, topPopover: null });
  }));
  document.querySelectorAll("[data-drawer]").forEach((el) => el.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setState({ drawer: el.dataset.drawer, topPopover: null, agentStatusOpen: false });
  }));
document.querySelectorAll("[data-close-modal]").forEach((el) => el.addEventListener("click", () => setState({ modal: null, knowledgeStep: 1, authStep: 1, authAccountTarget: null, importSkillSelected: [], customViewStep: 1, customViewName: "", customViewFilterRows: 1, customViewFieldOpen: false, customViewManual: false })));
document.querySelectorAll("[data-close-drawer]").forEach((el) => el.addEventListener("click", () => setState({ drawer: null })));
const modalOk = document.querySelector("[data-modal-ok]");
  if (modalOk) modalOk.addEventListener("click", () => {
    if (!window.__modalOk) {
      render();
      return;
    }
    const result = window.__modalOk();
    if (result && typeof result.then === "function") result.finally(render);
    else render();
  });
  document.querySelectorAll("[data-switch]").forEach((el) => el.addEventListener("click", () => el.classList.toggle("on")));
}

function bindCurrentPageEvents() {
  if (state.selectedAssistant || state.page === "ai" || state.page === "skillEdit") return bindAgentEvents?.();
  const pageBinders = {
    chat: bindConversationEvents,
    channels: bindChannelEvents,
    wechat: bindWecomEvents,
    knowledge: bindKnowledgeEvents,
    knowledgeCreate: bindKnowledgeEvents,
    flow: bindFlowEvents,
    marketing: bindMarketingEvents,
    contacts: bindContactEvents,
    analytics: bindAnalyticsEvents,
    teach: bindSettingsEvents,
    settings: bindSettingsEvents,
    profile: bindSettingsEvents,
  };
  pageBinders[state.page]?.();
}

function bindActiveModalEvents() {
  const modalBinders = {
    createAssistant: bindAgentModalEvents,
    importSkill: bindAgentModalEvents,
    addSkillTool: bindAgentModalEvents,
    associateKnowledge: bindAgentModalEvents,
    deleteSkill: bindAgentModalEvents,
    deleteKnowledge: bindAgentModalEvents,
    createCustomTool: bindAgentModalEvents,
    assistantToolPicker: bindAgentModalEvents,
    customView: bindConversationModalEvents,
    quickGroup: bindConversationModalEvents,
    quickReply: bindConversationModalEvents,
    importKnowledge: bindKnowledgeModalEvents,
    knowledgeWizard: bindKnowledgeModalEvents,
    authAccount: bindWecomModalEvents,
    groupMembers: bindWecomModalEvents,
    ruleConfig: bindWecomModalEvents,
    blastTask: bindMarketingModalEvents,
    autoFriendTask: bindMarketingModalEvents,
    keywordReplyTask: bindMarketingModalEvents,
    keywordGroupTask: bindMarketingModalEvents,
    sopTask: bindMarketingModalEvents,
    groupManageTask: bindMarketingModalEvents,
    materialTask: bindMarketingModalEvents,
    materialGroupTask: bindMarketingModalEvents,
    tagGroupTask: bindMarketingModalEvents,
    keywordTagTask: bindMarketingModalEvents,
    blacklistTask: bindMarketingModalEvents,
    createFlow: bindFlowModalEvents,
    addFlowTrigger: bindFlowModalEvents,
    addFlowAction: bindFlowModalEvents,
    createField: bindContactModalEvents,
    inviteMember: bindSettingsModalEvents,
    createRole: bindSettingsModalEvents,
    alertBot: bindSettingsModalEvents,
  };
  modalBinders[state.modal]?.();
}
