// WeCom helper functions shared by WeCom renderers, modals, and events.

function ensureWecomState() {
  if (window.wecomService) window.wecomService.ensureState();
}

function getWechatAccount(accountId) {
  ensureWecomState();
  return window.wecomService?.getAccount(accountId) || state.wecomAccounts.find((account) => account.id === accountId);
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
    处理中: "blue",
    失败: "red",
  }[status] || "";
}

function renderWechatStatusTag(status) {
  const cls = getWechatStatusClass(status);
  return `<span class="tag ${cls}">${escapeHtml(status)}</span>`;
}

function renderWechatSwitch(checked, type, id) {
  return `<span class="switch ${checked ? "on" : ""}" data-wecom-switch="${type}" data-wecom-id="${escapeHtml(id)}"></span>`;
}

function renderWechatOption(value, label, selected) {
  return `<option value="${escapeHtml(value)}" ${value === selected ? "selected" : ""}>${escapeHtml(label)}</option>`;
}

function renderWechatAccountOptions(selectedId) {
  ensureWecomState();
  return state.wecomAccounts.map((account) => renderWechatOption(account.id, `${account.name} / ${account.accountId}`, selectedId)).join("");
}

function renderWechatAssistantOptions(selected) {
  ensureWecomState();
  return state.wecomAssistants.map((assistant) => renderWechatOption(assistant, assistant, selected)).join("");
}

function renderWechatGroupOptions(selected) {
  ensureWecomState();
  return state.wecomAccountGroups.map((group) => renderWechatOption(group, group, selected)).join("");
}

function renderWecomPagination(pager) {
  if (!pager || !Number.isFinite(pager.pageCount) || pager.pageCount <= 1) return "";
  return `<div class="wecom-pagination">
    <span>共 ${pager.total} 条，每页 ${pager.pageSize} 条</span>
    <div>
      <button class="button small" data-wecom-page="prev" ${pager.page <= 1 ? "disabled" : ""}>上一页</button>
      <span>${pager.page} / ${pager.pageCount}</span>
      <button class="button small" data-wecom-page="next" ${pager.page >= pager.pageCount ? "disabled" : ""}>下一页</button>
    </div>
  </div>`;
}

function getWechatFilteredAccounts() {
  ensureWecomState();
  if (window.wecomService) return window.wecomService.listAccounts().items;
  const query = state.wechatAccountFilter.trim().toLowerCase();
  return state.wecomAccounts.filter((account) => {
    const matchesQuery = !query || [account.name, account.id, account.accountId, account.instanceId].some((value) => String(value).toLowerCase().includes(query));
    const matchesStatus = state.wechatStatusFilter === "全部状态" || account.status === state.wechatStatusFilter;
    const matchesGroup = state.wechatGroupFilter === "全部小组" || account.group === state.wechatGroupFilter;
    const matchesAssistant = state.wechatAssistantFilter === "全部助手" || account.assistant === state.wechatAssistantFilter;
    return matchesQuery && matchesStatus && matchesGroup && matchesAssistant;
  });
}

function getWechatAccountPageResult() {
  ensureWecomState();
  if (window.wecomService) return window.wecomService.listAccounts();
  const items = getWechatFilteredAccounts();
  return { items, total: items.length, page: 1, pageSize: items.length || 1, pageCount: 1 };
}
