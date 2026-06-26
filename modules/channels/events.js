// Channels page events.

function bindChannelEvents() {
  ensureChannelBackendLoaded();

  document.querySelectorAll("[data-channel-category]").forEach((el) =>
    el.addEventListener("click", () => setState({ channelCategory: el.dataset.channelCategory, channelActiveId: null, channelModalMode: "detail" }))
  );

  const channelSearch = document.querySelector("[data-channel-search]");
  if (channelSearch) channelSearch.addEventListener("input", () => {
    state.channelSearchQuery = channelSearch.value;
    window.clearTimeout(state.channelSearchTimer);
    state.channelSearchTimer = window.setTimeout(() => render(), 80);
  });

  const channelReset = document.querySelector("[data-channel-reset]");
  if (channelReset) channelReset.addEventListener("click", () => setState({ channelSearchQuery: "" }));

  const channelRefresh = document.querySelector("[data-channel-refresh]");
  if (channelRefresh) channelRefresh.addEventListener("click", () => {
    if (state.channelLoading) return;
    refreshChannelsFromBackend({ toast: true });
  });

  document.querySelectorAll("[data-channel-detail]").forEach((el) =>
    el.addEventListener("click", () => openChannelDetail(el.dataset.channelDetail))
  );
  document.querySelectorAll("[data-channel-detail]").forEach((el) =>
    el.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openChannelDetail(el.dataset.channelDetail);
      }
    })
  );

  document.querySelectorAll("[data-channel-primary]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      handleChannelPrimary(el.dataset.channelPrimary);
    })
  );

  document.querySelectorAll("[data-channel-route]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      showToast("已进入企业微信托管");
    })
  );

  document.querySelectorAll("[data-channel-close]").forEach((el) =>
    el.addEventListener("click", () => setState({ channelActiveId: null, channelModalMode: "detail" }))
  );

  document.querySelectorAll("[data-channel-connect]").forEach((el) =>
    el.addEventListener("click", () => setState({ channelActiveId: el.dataset.channelConnect, channelModalMode: "connect" }))
  );

  document.querySelectorAll("[data-channel-unavailable]").forEach((el) =>
    el.addEventListener("click", () => {
      const channel = findChannelById(el.dataset.channelUnavailable);
      setState({ channelActiveId: null, channelModalMode: "detail" });
      showToast(`${channel?.name || "该渠道"}暂未开放，开发中（Demo）`);
    })
  );

  document.querySelectorAll("[data-channel-save]").forEach((el) =>
    el.addEventListener("click", () => saveChannelConfig(el.dataset.channelSave))
  );

  document.querySelectorAll("[data-channel-test]").forEach((el) =>
    el.addEventListener("click", () => testChannelConfig(el.dataset.channelTest))
  );

  document.querySelectorAll("[data-channel-remove]").forEach((el) =>
    el.addEventListener("click", () => removeChannelAccount(el.dataset.channelRemove, el.dataset.channelAccountId))
  );
}

function ensureChannelBackendLoaded() {
  if (state.channelBackendRequested) return;
  state.channelBackendRequested = true;
  refreshChannelsFromBackend({ toast: false, initial: true });
}

async function refreshChannelsFromBackend(options = {}) {
  if (!window.channelsService) return false;
  state.channelLoading = true;
  state.channelActiveId = null;
  render();
  try {
    const nextChannels = await channelsService.listChannels();
    replaceChannels(nextChannels);
    state.channelBackendAvailable = true;
    state.channelLoading = false;
    render();
    if (options.toast) showToast("渠道列表已从后端刷新");
    return true;
  } catch (error) {
    state.channelBackendAvailable = false;
    state.channelLoading = false;
    render();
    if (options.toast) showToast("后端暂不可用，已保留静态渠道数据");
    return false;
  }
}

function openChannelDetail(channelId) {
  const channel = findChannelById(channelId);
  if (channel && !channel.isOpen) showToast(`${channel.name}暂未开放，开发中（Demo）`);
  setState({ channelActiveId: channelId, channelModalMode: "detail" });
}

function handleChannelPrimary(channelId) {
  const channel = findChannelById(channelId);
  if (!channel) return;
  if (!channel.isOpen) {
    showToast(`${channel.name}暂未开放，开发中（Demo）`);
    return;
  }
  setState({ channelActiveId: channelId, channelModalMode: channel.status === "已接入" ? "detail" : "connect" });
}

async function saveChannelConfig(channelId) {
  const channel = findChannelById(channelId);
  const form = document.querySelector("[data-channel-form]");
  if (!channel || !form) return;
  const data = new FormData(form);
  const accountName = String(data.get("accountName") || "").trim();
  if (!accountName) {
    showToast("请输入账号名称");
    return;
  }
  const payload = {
    accountName,
    owner: String(data.get("owner") || "").trim(),
    assistant: String(data.get("assistant") || ""),
    remark: String(data.get("remark") || "").trim(),
  };
  if (state.channelBackendAvailable && window.channelsService) {
    try {
      await channelsService.connectChannel(channelId, payload);
      await refreshChannelsFromBackend();
      setState({ channelActiveId: null, channelModalMode: "detail" });
      showToast(`${channel.name}配置已保存`);
    } catch (error) {
      showToast(error.message || "配置保存失败");
    }
    return;
  }
  state.channelMockForms = {
    ...(state.channelMockForms || {}),
    [channelId]: payload,
  };
  setState({ channelActiveId: null, channelModalMode: "detail" });
  showToast(`${channel.name}配置已保存（静态模式）`);
}

async function testChannelConfig(channelId) {
  const channel = findChannelById(channelId);
  const form = document.querySelector("[data-channel-form]");
  if (!channel || !form) return;
  const data = new FormData(form);
  const accountName = String(data.get("accountName") || "").trim();
  if (!accountName) {
    showToast("请先填写账号名称");
    return;
  }
  const payload = {
    accountName,
    owner: String(data.get("owner") || "").trim(),
    assistant: String(data.get("assistant") || ""),
    remark: String(data.get("remark") || "").trim(),
  };
  if (state.channelBackendAvailable && window.channelsService) {
    try {
      const result = await channelsService.testChannel(channelId, payload);
      showToast(result.message || `${channel.name}连接测试通过`);
    } catch (error) {
      showToast(error.message || "连接测试失败");
    }
    return;
  }
  showToast(`${channel.name}连接测试通过（静态模式）`);
}

async function removeChannelAccount(channelId, accountId) {
  const channel = findChannelById(channelId);
  if (state.channelBackendAvailable && window.channelsService && accountId) {
    try {
      await channelsService.deleteAccount(channelId, accountId);
      await refreshChannelsFromBackend();
      setState({ channelActiveId: channelId, channelModalMode: "detail" });
      showToast(`${channel?.name || "渠道"}账号已移除`);
    } catch (error) {
      showToast(error.message || "账号移除失败");
    }
    return;
  }
  if (!state.channelMockForms?.[channelId]) return;
  delete state.channelMockForms[channelId];
  setState({ channelActiveId: channelId, channelModalMode: "detail" });
  showToast(`${channel?.name || "渠道"}账号已移除`);
}
