// WeCom helper functions shared by WeCom renderers, modals, and events.

function getWechatAccount(accountId) {
  return state.wecomAccounts.find((account) => account.id === accountId);
}

function getWechatStatusClass(status) {
  return {
    在线: "green",
    初始化中: "blue",
    待扫码: "orange",
    离线: "orange",
    异常: "red",
    暂停: "",
    跳过: "orange",
    成功: "green",
  }[status] || "";
}

function renderWechatStatusTag(status) {
  const cls = getWechatStatusClass(status);
  return `<span class="tag ${cls}">${escapeHtml(status)}</span>`;
}

function renderWechatSwitch(checked, type, id) {
  return `<span class="switch ${checked ? "on" : ""}" data-wecom-switch="${type}" data-wecom-id="${escapeHtml(id)}"></span>`;
}

function getWechatFilteredAccounts() {
  const query = state.wechatAccountFilter.trim().toLowerCase();
  return state.wecomAccounts.filter((account) => {
    const matchesQuery = !query || [account.name, account.id, account.accountId, account.instanceId].some((value) => String(value).toLowerCase().includes(query));
    const matchesStatus = state.wechatStatusFilter === "全部状态" || account.status === state.wechatStatusFilter;
    const matchesGroup = state.wechatGroupFilter === "全部小组" || account.group === state.wechatGroupFilter;
    const matchesAssistant = state.wechatAssistantFilter === "全部助手" || account.assistant === state.wechatAssistantFilter;
    return matchesQuery && matchesStatus && matchesGroup && matchesAssistant;
  });
}
