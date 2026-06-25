// Channels helper functions.

function getChannelViewState() {
  return {
    category: state.channelCategory || "全部",
    query: state.channelSearchQuery || "",
    loading: Boolean(state.channelLoading),
    activeId: state.channelActiveId || null,
    modalMode: state.channelModalMode || "detail",
  };
}

function getChannelsWithMockState() {
  return channels.map((channel) => applyChannelMockState(channel));
}

function applyChannelMockState(channel) {
  const saved = getChannelMockConfig(channel.id);
  if (!saved) return channel;
  const savedAccount = formatChannelMockAccount(saved);
  return {
    ...channel,
    status: "已接入",
    accountCount: channel.accountCount + 1,
    action: channel.route === "wechat" ? "管理" : "新增账号",
    tags: [...new Set([...(channel.tags || []).filter((tag) => tag !== "未绑定"), "已绑定", channel.category])],
    accounts: [...channel.accounts, savedAccount],
    mockAccountName: savedAccount,
  };
}

function getChannelMockConfig(channelId) {
  return state.channelMockForms?.[channelId] || null;
}

function formatChannelMockAccount(config) {
  const owner = config.owner ? ` / ${config.owner}` : "";
  return `${config.accountName}${owner}（Mock）`;
}

function findChannelById(channelId) {
  return getChannelsWithMockState().find((channel) => channel.id === channelId) || null;
}

function getFilteredChannels(view) {
  const query = view.query.trim().toLowerCase();
  return getChannelsWithMockState()
    .filter((channel) => channelMatchesCategory(channel, view.category))
    .filter((channel) => {
      if (!query) return true;
      return getChannelSearchText(channel).includes(query);
    });
}

function getChannelSearchText(channel) {
  return [
    channel.name,
    channel.description,
    channel.status,
    channel.category,
    channel.accountCount,
    channel.guide,
    ...(channel.tags || []),
    ...(channel.accounts || []),
    ...(channel.fields || []),
  ].join(" ").toLowerCase();
}

function channelMatchesCategory(channel, category) {
  if (category === "全部") return true;
  if (category === "已绑定") return channel.status === "已接入";
  if (category === "未绑定") return channel.status !== "已接入";
  return channel.category === category || (channel.tags || []).includes(category);
}

function getGroupedChannels(list, category) {
  if (category && category !== "全部") return [[category, list]].filter(([, items]) => items.length);
  return [
    ["已绑定", list.filter((channel) => channel.status === "已接入")],
    ["未绑定", list.filter((channel) => channel.status === "未接入")],
    ["开发中", list.filter((channel) => channel.status === "开发中")],
  ].filter(([, items]) => items.length);
}

function getChannelFormValues(channel) {
  const saved = getChannelMockConfig(channel.id) || {};
  return {
    accountName: saved.accountName || "",
    owner: saved.owner || "",
    assistant: saved.assistant || "物流客服助手",
    remark: saved.remark || "",
  };
}

function getChannelActionLabel(channel) {
  if (channel.route === "wechat") return "管理";
  if (!channel.isOpen) return "查看说明";
  if (channel.status === "已接入") return "新增账号";
  return "添加账号";
}

function getChannelStatusTitle(status) {
  if (status === "已接入") return "该渠道已有可用账号";
  if (status === "开发中") return "该渠道暂未开放真实接入";
  return "该渠道尚未配置账号";
}
