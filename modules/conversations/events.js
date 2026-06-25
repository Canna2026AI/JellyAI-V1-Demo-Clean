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

  bindWorkHoursEvents();
  bindQuickMessageSettingsEvents();
  bindConversationListEvents();
  bindConversationDetailEvents();
  bindConversationInfoEvents();
}

function bindWorkHoursEvents() {
  document.querySelector("[data-work-hours-switch]")?.addEventListener("click", () => {
    workHoursSettings.enabled = !workHoursSettings.enabled;
    saveWorkHoursSettings();
    setState({});
  });
  document.querySelectorAll("[data-add-work-time]").forEach((el) => el.addEventListener("click", () => {
    const index = Number(el.dataset.addWorkTime);
    workHoursSettings.schedules[index]?.ranges.push({ start: "09:00", end: "18:00" });
    saveWorkHoursSettings();
    setState({});
  }));
  document.querySelectorAll("[data-remove-work-time]").forEach((el) => el.addEventListener("click", () => {
    const [scheduleIndex, rangeIndex] = el.dataset.removeWorkTime.split(":").map(Number);
    const schedule = workHoursSettings.schedules[scheduleIndex];
    if (!schedule) return;
    schedule.ranges.splice(rangeIndex, 1);
    if (!schedule.ranges.length) schedule.ranges.push({ start: "09:00", end: "18:00" });
    saveWorkHoursSettings();
    setState({});
  }));
  document.querySelector("[data-add-work-schedule]")?.addEventListener("click", () => {
    workHoursSettings.schedules.push({ day: "周一至周五", ranges: [{ start: "09:00", end: "18:00" }] });
    saveWorkHoursSettings();
    setState({});
  });
  document.querySelectorAll("[data-remove-work-schedule]").forEach((el) =>
    el.addEventListener("click", () => {
      workHoursSettings.schedules.splice(Number(el.dataset.removeWorkSchedule), 1);
      if (!workHoursSettings.schedules.length) workHoursSettings.schedules.push({ day: "周一至周五", ranges: [{ start: "09:00", end: "18:00" }] });
      saveWorkHoursSettings();
      setState({});
    })
  );
  document.querySelector("[data-work-hours-save]")?.addEventListener("click", () => {
    syncWorkHoursFromDom();
    saveWorkHoursSettings();
    showToast("工作时间设置已保存");
    setState({ chatSettingsOpen: false });
  });
  document.querySelector("[data-chat-settings-back]")?.addEventListener("click", () =>
    setState({ chatSettingsOpen: false })
  );
}

function syncWorkHoursFromDom() {
  const schedules = Array.from(document.querySelectorAll("[data-work-schedule-row]")).map((row) => ({
    day: row.querySelector("[data-work-day]")?.value || "周一至周五",
    ranges: Array.from(row.querySelectorAll("[data-work-range-row]")).map((range) => ({
      start: range.querySelector("[data-work-start]")?.value || "09:00",
      end: range.querySelector("[data-work-end]")?.value || "18:00",
    })),
  }));
  workHoursSettings.schedules = schedules.length ? schedules : [{ day: "周一至周五", ranges: [{ start: "09:00", end: "18:00" }] }];
  workHoursSettings.afterHoursAction = document.querySelector("[data-after-hours-action]")?.value || workHoursSettings.afterHoursAction;
  workHoursSettings.afterHoursText = document.querySelector("[data-after-hours-text]")?.textContent.trim() || workHoursSettings.afterHoursText;
}

function bindQuickMessageSettingsEvents() {
  const quickMessageSearch = document.querySelector("[data-quick-message-search]");
  if (quickMessageSearch) quickMessageSearch.addEventListener("input", () => {
    const query = quickMessageSearch.value;
    setState({ quickMessageSearch: query });
    const nextInput = document.querySelector("[data-quick-message-search]");
    nextInput?.focus();
    nextInput?.setSelectionRange(query.length, query.length);
  });
  document.querySelectorAll("[data-quick-reply-delete]").forEach((el) => el.addEventListener("click", () => {
    openConversationConfirm("删除快捷回复", "删除后当前 Demo 中将不再展示该快捷回复。", "删除", () => {
      const index = quickMessageData.replies.findIndex((reply) => reply.id === el.dataset.quickReplyDelete);
      if (index >= 0) quickMessageData.replies.splice(index, 1);
      saveQuickMessageData();
      state.modal = null;
      showToast("快捷回复已删除");
    });
  }));
}

function bindConversationListEvents() {
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
    const query = chatSearchInput.value;
    setState({ chatSearchQuery: query });
    const nextInput = document.querySelector("[data-chat-search-input]");
    nextInput?.focus();
    nextInput?.setSelectionRange(query.length, query.length);
  });
  document.querySelector("[data-chat-search-close]")?.addEventListener("click", () => setState({ chatSearchOpen: false, chatSearchModeOpen: false, chatSearchQuery: "" }));
  document.querySelector("[data-chat-status-filter]")?.addEventListener("change", (event) => setState({ chatStatusFilter: event.target.value, selectedConversation: null }));
  document.querySelector("[data-chat-channel-filter]")?.addEventListener("change", (event) => setState({ chatChannelFilter: event.target.value, selectedConversation: null }));
  document.querySelectorAll("[data-conversation]").forEach((el) =>
    el.addEventListener("click", () => {
      markConversationRead(el.dataset.conversation);
      setState({ selectedConversation: el.dataset.conversation, chatLoading: true, chatSortOpen: false, chatSearchModeOpen: false });
      window.setTimeout(() => {
        if (state.selectedConversation === el.dataset.conversation) setState({ chatLoading: false });
      }, 180);
    })
  );
  document.querySelector("[data-hide-channel-promo]")?.addEventListener("click", (event) => {
    event.currentTarget.closest(".join-card")?.remove();
  });
}

function bindConversationDetailEvents() {
  document.querySelectorAll("[data-quick-insert]").forEach((el) => el.addEventListener("click", () => {
    const reply = quickMessageData.replies.find((item) => item.id === el.dataset.quickInsert);
    const input = document.getElementById("convInput");
    if (!reply || !input) return;
    const prefix = input.value.trim() ? `${input.value.trim()}\n` : "";
    input.value = `${prefix}${reply.content}`;
    input.focus();
    showToast("快捷回复已插入");
  }));
  const convSend = document.getElementById("convSend");
  if (convSend) convSend.addEventListener("click", sendConvMessage);
  const input = document.getElementById("convInput");
  if (input) input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    sendConvMessage();
  });
}

function bindConversationInfoEvents() {
  document.querySelector("[data-transfer-human]")?.addEventListener("click", () => {
    const conv = getSelectedConversation();
    if (!conv) return;
    openConversationConfirm("转入人工", `确认将“${conv.name}”转入 Kelvin 处理？`, "确认转入", () => {
      transferConversationToHuman(conv.id);
      state.modal = null;
      showToast("已转入人工");
    });
  });
  document.querySelector("[data-conversation-status]")?.addEventListener("change", (event) => {
    const conv = getSelectedConversation();
    if (!conv) return;
    updateConversationStatus(conv.id, event.target.value);
    showToast("会话状态已更新");
    setState({});
  });
  document.querySelectorAll("[data-customer-tag]").forEach((el) => el.addEventListener("click", () => {
    const conv = getSelectedConversation();
    if (!conv) return;
    toggleConversationTag(conv.id, el.dataset.customerTag);
    showToast("客户标签已更新");
    setState({});
  }));
  document.querySelector("[data-add-customer-tag]")?.addEventListener("click", () => {
    const conv = getSelectedConversation();
    const input = document.querySelector("[data-new-customer-tag]");
    if (!conv || !input) return;
    if (!addConversationTag(conv.id, input.value)) {
      showToast("请输入标签名称");
      return;
    }
    showToast("客户标签已添加");
    setState({});
  });
  document.querySelector("[data-hosted-toggle]")?.addEventListener("click", () => {
    const conv = getSelectedConversation();
    if (!conv) return;
    const enabled = toggleConversationHosted(conv.id);
    showToast(`托管状态已${enabled ? "开启" : "暂停"}`);
    setState({});
  });
  document.querySelector("[data-star-conversation]")?.addEventListener("click", () => {
    const conv = getSelectedConversation();
    if (!conv) return;
    conv.starred = !conv.starred;
    if (conv.starred && !conv.viewTags.includes("收藏")) conv.viewTags.push("收藏");
    if (!conv.starred) conv.viewTags = conv.viewTags.filter((tag) => tag !== "收藏");
    saveConversationData();
    showToast(conv.starred ? "已收藏会话" : "已取消收藏");
    setState({});
  });
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

function sendConvMessage() {
  const input = document.getElementById("convInput");
  const text = input?.value.trim();
  const conv = getSelectedConversation();
  if (!input || !conv) return;
  if (!text) {
    showToast("请输入回复内容");
    return;
  }
  addConversationMessage(conv.id, text, "me");
  input.value = "";
  showToast("消息已发送");
  setState({});
  requestAnimationFrame(() => {
    const box = document.querySelector(".conv-messages");
    if (box) box.scrollTop = box.scrollHeight;
  });
}
