// Aggregated conversation page and modal events.

function bindConversationEvents() {
document.querySelector("[data-agent-status-toggle]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    setState({ agentStatusOpen: !state.agentStatusOpen });
  });
  document.querySelectorAll("[data-agent-status]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      setState({ agentStatus: el.dataset.agentStatus, agentStatusOpen: false });
      showToast(`坐席状态已切换为${el.dataset.agentStatus}`);
    })
  );

document.querySelectorAll("[data-chat-settings-open]").forEach((el) =>
    el.addEventListener("click", () => setState({ chatSettingsOpen: true, chatSettingsTab: el.dataset.chatSettingsOpen, chatSortOpen: false, chatSearchOpen: false, agentStatusOpen: false }))
  );

document.querySelectorAll("[data-chat-filter]").forEach((el) =>
    el.addEventListener("click", () => setState({ chatFilter: el.dataset.chatFilter, selectedConversation: null, chatSettingsOpen: false, chatSortOpen: false, chatSearchModeOpen: false, chatSearchQuery: "" }))
  );
  document.querySelectorAll("[data-chat-settings]").forEach((el) =>
    el.addEventListener("click", () => setState({ chatSettingsOpen: !state.chatSettingsOpen, chatSearchOpen: false, chatSortOpen: false }))
  );
  document.querySelector("[data-chat-sidebar-toggle]")?.addEventListener("click", () =>
    setState({ chatSidebarCollapsed: !state.chatSidebarCollapsed, chatSortOpen: false, chatSearchModeOpen: false })
  );
  document.querySelectorAll("[data-chat-settings-tab]").forEach((el) =>
    el.addEventListener("click", () => setState({ chatSettingsTab: el.dataset.chatSettingsTab }))
  );
  document.querySelector("[data-work-hours-switch]")?.addEventListener("click", () =>
    setState({ workHoursEnabled: !state.workHoursEnabled })
  );
  document.querySelector("[data-add-work-time]")?.addEventListener("click", () =>
    setState({ workTimeRangeCount: state.workTimeRangeCount + 1 })
  );
  document.querySelectorAll("[data-remove-work-time]").forEach((el) =>
    el.addEventListener("click", () => setState({ workTimeRangeCount: Math.max(1, state.workTimeRangeCount - 1) }))
  );
  document.querySelector("[data-add-work-schedule]")?.addEventListener("click", () =>
    setState({ workScheduleCount: state.workScheduleCount + 1 })
  );
  document.querySelectorAll("[data-remove-work-schedule]").forEach((el) =>
    el.addEventListener("click", () => setState({ workScheduleCount: Math.max(1, state.workScheduleCount - 1) }))
  );
  document.querySelector("[data-chat-settings-back]")?.addEventListener("click", () =>
    setState({ chatSettingsOpen: false })
  );
  const quickMessageSearch = document.querySelector("[data-quick-message-search]");
  if (quickMessageSearch) quickMessageSearch.addEventListener("input", () => {
    const query = quickMessageSearch.value;
    setState({ quickMessageSearch: query });
    const nextInput = document.querySelector("[data-quick-message-search]");
    nextInput?.focus();
    nextInput?.setSelectionRange(query.length, query.length);
  });
  document.querySelectorAll("[data-quick-reply-delete]").forEach((el) => el.addEventListener("click", () => {
    const index = quickMessageData.replies.findIndex((reply) => reply.id === el.dataset.quickReplyDelete);
    if (index >= 0) quickMessageData.replies.splice(index, 1);
    saveQuickMessageData();
    setState({});
    showToast("快捷回复已删除");
  }));
  const chatSortToggle = document.querySelector("[data-chat-sort-toggle]");
  if (chatSortToggle) chatSortToggle.addEventListener("click", () => setState({ chatSortOpen: !state.chatSortOpen }));
  document.querySelectorAll("[data-chat-sort]").forEach((el) =>
    el.addEventListener("click", () => setState({ chatSort: el.dataset.chatSort, chatSortOpen: false }))
  );
  const chatSearchToggle = document.querySelector("[data-chat-search-toggle]");
  if (chatSearchToggle) chatSearchToggle.addEventListener("click", () => {
    setState({ chatSearchOpen: !state.chatSearchOpen, chatSearchModeOpen: false, chatSortOpen: false, chatSearchQuery: state.chatSearchOpen ? "" : state.chatSearchQuery });
    document.querySelector("[data-chat-search-input]")?.focus();
  });
  const chatSearchModeToggle = document.querySelector("[data-chat-search-mode-toggle]");
  if (chatSearchModeToggle) chatSearchModeToggle.addEventListener("click", () => setState({ chatSearchModeOpen: !state.chatSearchModeOpen }));
  document.querySelectorAll("[data-chat-search-mode]").forEach((el) =>
    el.addEventListener("click", () => {
      setState({ chatSearchMode: el.dataset.chatSearchMode, chatSearchModeOpen: false });
      document.querySelector("[data-chat-search-input]")?.focus();
    })
  );
  const chatSearchInput = document.querySelector("[data-chat-search-input]");
  if (chatSearchInput) chatSearchInput.addEventListener("input", () => {
    state.chatSearchQuery = chatSearchInput.value;
    const conversations = sortConversations(conversationMap[state.chatFilter] || []).filter(matchesConversationSearch);
    const listHead = document.querySelector(".conv-search-panel");
    if (!listHead) return;
    let node = listHead.nextElementSibling;
    while (node && !node.classList.contains("join-card")) {
      const next = node.nextElementSibling;
      node.remove();
      node = next;
    }
    listHead.insertAdjacentHTML("afterend", conversations.length
      ? conversations.map((item) => renderConversationItem(item)).join("")
      : `<div class="empty" style="min-height:240px">未找到匹配的对话</div>`);
    document.querySelectorAll("[data-conversation]").forEach((el) =>
      el.addEventListener("click", () => setState({ selectedConversation: el.dataset.conversation }))
    );
  });
  const chatSearchClose = document.querySelector("[data-chat-search-close]");
  if (chatSearchClose) chatSearchClose.addEventListener("click", () => setState({ chatSearchOpen: false, chatSearchModeOpen: false, chatSearchQuery: "" }));
  document.querySelectorAll("[data-conversation]").forEach((el) =>
    el.addEventListener("click", () => setState({ selectedConversation: el.dataset.conversation }))
  );

const convSend = document.getElementById("convSend");
  if (convSend) convSend.addEventListener("click", sendConvMessage);
}

function bindConversationModalEvents() {
document.querySelectorAll("[data-custom-view-step]").forEach((el) =>
    el.addEventListener("click", () => {
      const targetStep = Number(el.dataset.customViewStep);
      if (targetStep < state.customViewStep) setState({ customViewStep: targetStep, customViewFieldOpen: false });
    })
  );
  const customViewNameInput = document.querySelector("[data-custom-view-name]");
  if (customViewNameInput) customViewNameInput.addEventListener("input", () => {
    state.customViewName = customViewNameInput.value.slice(0, 100);
    const count = document.querySelector("[data-custom-view-name-count]");
    const next = document.querySelector("[data-custom-view-next]");
    const canContinue = Boolean(state.customViewName.trim());
    if (count) count.textContent = `${state.customViewName.length} / 100`;
    if (next) {
      next.disabled = !canContinue;
      next.classList.toggle("disabled", !canContinue);
    }
  });
  document.querySelectorAll("[data-custom-view-access]").forEach((el) =>
    el.addEventListener("click", () => setState({ customViewAccess: el.dataset.customViewAccess }))
  );
  const customViewPrev = document.querySelector("[data-custom-view-prev]");
  if (customViewPrev) customViewPrev.addEventListener("click", () => setState({ customViewStep: Math.max(1, state.customViewStep - 1), customViewFieldOpen: false }));
  const customViewNext = document.querySelector("[data-custom-view-next]");
  if (customViewNext) customViewNext.addEventListener("click", () => {
    if (state.customViewStep === 1 && !state.customViewName.trim()) {
      showToast("请先填写视图名称");
      return;
    }
    if (state.customViewStep === 3) {
      const viewName = state.customViewName.trim();
      if (customConversationViews.includes(viewName) || conversationFilters.includes(viewName)) {
        showToast("该对话组名称已存在");
        return;
      }
      customConversationViews.push(viewName);
      conversationMap[viewName] = [];
      saveCustomConversationViews(customConversationViews);
      setState({ modal: null, customViewStep: 1, customViewName: "", customViewFilterRows: 1, customViewFieldOpen: false, customViewManual: false, chatFilter: viewName, selectedConversation: null });
      showToast(`对话组“${viewName}”已创建`);
      return;
    }
    setState({ customViewStep: state.customViewStep + 1, customViewFieldOpen: false });
  });

const quickReplyRequired = document.querySelectorAll("[data-quick-reply-required]");
  if (quickReplyRequired.length) {
    const updateQuickReplySave = () => {
      const group = document.getElementById("quickReplyGroup")?.value;
      const content = document.getElementById("quickReplyContent")?.textContent.trim();
      const save = document.querySelector(".quick-reply-modal [data-modal-ok]");
      if (save) save.disabled = !(group && content);
    };
    quickReplyRequired.forEach((el) => {
      el.addEventListener("input", updateQuickReplySave);
      el.addEventListener("change", updateQuickReplySave);
    });
  }
  const quickGroupName = document.getElementById("quickGroupName");
  if (quickGroupName) {
    quickGroupName.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      document.querySelector(".quick-group-modal [data-modal-ok]")?.click();
    });
  }
  document.querySelectorAll("[data-quick-format]").forEach((el) =>
    el.addEventListener("click", () => {
      document.getElementById("quickReplyContent")?.focus();
      document.execCommand(el.dataset.quickFormat, false, el.dataset.formatValue || null);
    })
  );
}

async function sendConvMessage() {
  const input = document.getElementById("convInput");
  const text = input.value.trim();
  if (!text) return;
  const conversationId = state.selectedConversation;
  if (conversationId) {
    try {
      const response = await fetch(`/api/app/conversations/${conversationId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "消息发送失败");
      state.convMessages.push({ role: "me", text: payload.message?.body || text });
      if (payload.assistantMessage?.body) {
        state.convMessages.push({
          role: "ai",
          text: payload.assistantMessage.body,
          meta: payload.tokenUsage ? `消耗 token：${payload.tokenUsage.totalTokens}` : "",
        });
      }
      input.value = "";
      showToast("消息已写入本地 API");
      render();
      return;
    } catch (error) {
      showToast(`${error.message}，已保留在本地 Demo`);
    }
  }
  state.convMessages.push({ role: "me", text });
  input.value = "";
  render();
}
