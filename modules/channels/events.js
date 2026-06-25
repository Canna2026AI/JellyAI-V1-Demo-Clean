// Channels page events.

function bindChannelEvents() {
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
    setState({ channelLoading: true, channelActiveId: null });
    window.setTimeout(() => {
      state.channelLoading = false;
      render();
      showToast("渠道列表已刷新");
    }, 450);
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
    el.addEventListener("click", () => saveChannelMockConfig(el.dataset.channelSave))
  );
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

function saveChannelMockConfig(channelId) {
  const channel = findChannelById(channelId);
  const form = document.querySelector("[data-channel-form]");
  if (!channel || !form) return;
  const data = new FormData(form);
  const accountName = String(data.get("accountName") || "").trim();
  if (!accountName) {
    showToast("请输入账号名称");
    return;
  }
  state.channelMockForms = {
    ...(state.channelMockForms || {}),
    [channelId]: {
      accountName,
      owner: String(data.get("owner") || "").trim(),
      assistant: String(data.get("assistant") || ""),
      remark: String(data.get("remark") || "").trim(),
    },
  };
  setState({ channelActiveId: null, channelModalMode: "detail" });
  showToast(`${channel.name}配置已保存（Mock）`);
}
