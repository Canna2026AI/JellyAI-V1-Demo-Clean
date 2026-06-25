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

function findChannelById(channelId) {
  return channels.find((channel) => channel.id === channelId) || null;
}

function getFilteredChannels(view) {
  const query = view.query.trim().toLowerCase();
  return channels
    .filter((channel) => channelMatchesCategory(channel, view.category))
    .filter((channel) => {
      if (!query) return true;
      return [
        channel.name,
        channel.description,
        channel.status,
        channel.category,
        channel.accountCount,
        ...(channel.tags || []),
      ].join(" ").toLowerCase().includes(query);
    });
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
  const saved = state.channelMockForms?.[channel.id] || {};
  return {
    accountName: saved.accountName || "",
    owner: saved.owner || "",
    assistant: saved.assistant || "物流客服助手",
    remark: saved.remark || "",
  };
}
