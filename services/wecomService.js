// WeCom mock service facade. All operations are local mock mutations.
(function initWecomService() {
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function ensureState() {
    if (typeof state === "undefined" || !window.wecomMock) return;
    if (!state.__wecomHydrated) {
      const initial = window.wecomMock.cloneInitialState();
      state.wecomAssistants = initial.assistants;
      state.wecomAccountGroups = initial.accountGroups;
      state.wecomContacts = initial.contacts;
      state.wecomAccounts = initial.accounts;
      state.wecomRules = initial.rules;
      state.wecomAdvancedSettings = initial.advancedSettings;
      state.wecomGroups = initial.groups;
      state.wecomLogs = initial.logs;
      state.__wecomHydrated = true;
    }
    Object.assign(state, {
      wechatAccountFilter: state.wechatAccountFilter || "",
      wechatStatusFilter: state.wechatStatusFilter || "全部状态",
      wechatGroupFilter: state.wechatGroupFilter || "全部小组",
      wechatAssistantFilter: state.wechatAssistantFilter || "全部助手",
      wechatAccountPage: state.wechatAccountPage || 1,
      wechatAccountPageSize: state.wechatAccountPageSize || 5,
      wechatLogQuery: state.wechatLogQuery || "",
      wechatLogTarget: state.wechatLogTarget || "",
      wechatLogType: state.wechatLogType || "全部类型",
      wechatLogAccount: state.wechatLogAccount || "全部账号",
      wechatLogGroup: state.wechatLogGroup || "全部群聊",
      wechatLogDateStart: state.wechatLogDateStart || "2026-06-13",
      wechatLogDateEnd: state.wechatLogDateEnd || "2026-06-20",
      wecomGroupQuery: state.wecomGroupQuery || "",
      wecomActiveAccountId: state.wecomActiveAccountId || null,
      wecomActiveRuleId: state.wecomActiveRuleId || null,
      wecomActiveGroupId: state.wecomActiveGroupId || null,
      wecomLoading: state.wecomLoading || {},
      consoleStatus: state.consoleStatus || [],
    });
  }

  function nextNumber(items, prefix, base) {
    const max = items.reduce((value, item) => {
      const num = Number(String(item.id).replace(prefix, ""));
      return Number.isFinite(num) ? Math.max(value, num) : value;
    }, base);
    return max + 1;
  }

  function getAccount(id) {
    ensureState();
    return state.wecomAccounts.find((account) => account.id === id);
  }

  function getRule(id) {
    ensureState();
    return state.wecomRules.find((rule) => rule.id === id);
  }

  function getGroup(id) {
    ensureState();
    return state.wecomGroups.find((group) => group.id === id);
  }

  function addLog(partial) {
    ensureState();
    const id = `log-${Date.now()}-${state.wecomLogs.length + 1}`;
    state.wecomLogs.unshift({
      id,
      date: window.wecomMock.today(),
      time: window.wecomMock.nowLabel(),
      operator: "系统",
      operation: "后台操作",
      accountId: state.wecomAccounts[0]?.id || "",
      groupId: "",
      target: "-",
      type: "私聊",
      content: "-",
      reply: "-",
      status: "成功",
      detail: "Mock 操作记录",
      ...partial,
    });
  }

  function listAccounts() {
    ensureState();
    const query = String(state.wechatAccountFilter || "").trim().toLowerCase();
    const rows = state.wecomAccounts.filter((account) => {
      const text = [account.name, account.alias, account.id, account.accountId, account.instanceId, account.subject, account.owner].join(" ").toLowerCase();
      const matchesQuery = !query || text.includes(query);
      const matchesStatus = state.wechatStatusFilter === "全部状态" || account.status === state.wechatStatusFilter;
      const matchesGroup = state.wechatGroupFilter === "全部小组" || account.group === state.wechatGroupFilter;
      const matchesAssistant = state.wechatAssistantFilter === "全部助手" || account.assistant === state.wechatAssistantFilter;
      return matchesQuery && matchesStatus && matchesGroup && matchesAssistant;
    });
    const pageSize = Number(state.wechatAccountPageSize) || 5;
    const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
    state.wechatAccountPageSize = pageSize;
    state.wechatAccountPage = Math.min(Math.max(1, Number(state.wechatAccountPage) || 1), pageCount);
    const start = (state.wechatAccountPage - 1) * pageSize;
    return {
      items: rows.slice(start, start + pageSize),
      total: rows.length,
      page: state.wechatAccountPage,
      pageSize,
      pageCount,
    };
  }

  function accountStats() {
    ensureState();
    return {
      online: state.wecomAccounts.filter((account) => account.status === "在线").length,
      offline: state.wecomAccounts.filter((account) => account.status === "离线").length,
      starting: state.wecomAccounts.filter((account) => account.status === "初始化中").length,
      error: state.wecomAccounts.filter((account) => account.status === "异常").length,
      total: state.wecomAccounts.length,
    };
  }

  function saveAccount(payload, id) {
    ensureState();
    const target = id ? getAccount(id) : null;
    const account = target || {
      id: String(nextNumber(state.wecomAccounts, "", 8021)),
      avatar: "企",
      accountId: `WeCom-${Date.now().toString().slice(-5)}`,
      instanceId: `mock-${Date.now()}`,
      status: "在线",
      heartbeat: "刚刚",
      messageEnabled: true,
      aiEnabled: true,
      lastAction: "新建托管账号",
    };
    Object.assign(account, payload);
    if (!target) state.wecomAccounts.unshift(account);
    addLog({
      operation: target ? "编辑托管账号" : "新增托管账号",
      accountId: account.id,
      target: account.name,
      content: `${account.name} / ${account.group}`,
      reply: `绑定助手：${account.assistant}`,
      detail: "账号配置已保存",
    });
    return account;
  }

  function deleteAccount(id) {
    const account = getAccount(id);
    if (!account) return null;
    state.wecomAccounts = state.wecomAccounts.filter((item) => item.id !== id);
    state.wecomRules.forEach((rule) => {
      if (rule.accountId === id) rule.enabled = false;
    });
    addLog({
      operation: "删除托管账号",
      accountId: id,
      target: account.name,
      content: "删除账号",
      reply: "相关规则已停用",
      detail: "Mock 删除完成",
    });
    return account;
  }

  function updateAccountStatus(id, status) {
    const account = getAccount(id);
    if (!account) return null;
    account.status = status;
    account.heartbeat = status === "在线" ? "刚刚" : status === "暂停" ? "已暂停" : status === "待扫码" ? "-" : "处理中";
    account.lastAction = status === "在线" ? "托管实例在线" : `状态变更：${status}`;
    addLog({
      operation: "账号状态变更",
      accountId: id,
      target: account.name,
      content: `状态切换为 ${status}`,
      reply: "Mock 状态更新完成",
      detail: account.lastAction,
    });
    return account;
  }

  function toggleAccount(id, field) {
    const account = getAccount(id);
    if (!account) return null;
    account[field] = !account[field];
    account.lastAction = `${field === "messageEnabled" ? "消息接收" : "AI回复"}${account[field] ? "开启" : "关闭"}`;
    return account;
  }

  function listRules() {
    ensureState();
    return state.wecomRules;
  }

  function saveRule(payload, id) {
    ensureState();
    const target = id ? getRule(id) : null;
    const rule = target || {
      id: `rule-${nextNumber(state.wecomRules, "rule-", 0)}`,
      messageEnabled: true,
      aiEnabled: true,
      enabled: true,
    };
    Object.assign(rule, payload, { maxReplies: Number(payload.maxReplies) || 1 });
    if (!target) state.wecomRules.unshift(rule);
    addLog({
      operation: target ? "编辑聚合规则" : "新增聚合规则",
      accountId: rule.accountId,
      target: rule.name,
      type: rule.replyScope === "私聊" ? "私聊" : "群聊",
      content: rule.keywords,
      reply: `绑定 ${rule.assistant}`,
      detail: `最大回复 ${rule.maxReplies} 次`,
    });
    return rule;
  }

  function deleteRule(id) {
    const rule = getRule(id);
    if (!rule) return null;
    state.wecomRules = state.wecomRules.filter((item) => item.id !== id);
    addLog({
      operation: "删除聚合规则",
      accountId: rule.accountId,
      target: rule.name,
      content: "删除规则",
      reply: "Mock 删除完成",
      detail: "规则已移除",
    });
    return rule;
  }

  function toggleRule(id, field) {
    const rule = getRule(id);
    if (!rule) return null;
    rule[field] = !rule[field];
    return rule;
  }

  function updateAdvancedField(field, value) {
    ensureState();
    state.wecomAdvancedSettings[field] = value;
    return state.wecomAdvancedSettings;
  }

  function resetAdvanced() {
    const initial = window.wecomMock.cloneInitialState();
    state.wecomAdvancedSettings = initial.advancedSettings;
    addLog({
      operation: "恢复高级设置",
      content: "恢复默认设置",
      reply: "Mock 默认值已应用",
      detail: "高级设置",
    });
  }

  function saveAdvanced() {
    addLog({
      operation: "保存高级设置",
      content: state.wecomAdvancedSettings.keywords,
      reply: state.wecomAdvancedSettings.triggerMode,
      detail: "高级设置已保存",
    });
  }

  function listGroups() {
    ensureState();
    const query = String(state.wecomGroupQuery || "").trim().toLowerCase();
    return state.wecomGroups.filter((group) => !query || [group.name, group.id, group.owner, group.lastMessage].join(" ").toLowerCase().includes(query));
  }

  function toggleGroup(id, field) {
    const group = getGroup(id);
    if (!group) return null;
    group[field] = !group[field];
    return group;
  }

  function syncGroups() {
    ensureState();
    const exists = state.wecomGroups.some((group) => group.id === "R:107758403324124");
    if (!exists) {
      state.wecomGroups.push({
        id: "R:107758403324124",
        name: "新同步客户咨询群",
        accountId: "8018",
        owner: "Kelvin",
        members: 9,
        aiEnabled: false,
        messageEnabled: true,
        lockName: false,
        blockAddFriend: false,
        lastMessage: "刚同步到后台",
      });
    }
    addLog({
      operation: "同步群聊",
      accountId: "8018",
      target: "企业微信群",
      type: "群聊",
      content: "同步群列表",
      reply: exists ? "群列表已是最新" : "新增 1 个群聊",
      detail: "Mock 同步完成",
    });
    return exists ? 0 : 1;
  }

  function runConsole(payload) {
    const account = getAccount(payload.accountId) || state.wecomAccounts[0];
    const target = payload.targetName || payload.targetId || "未选择目标";
    const taskId = `MOCK-${Date.now().toString().slice(-8)}`;
    state.consoleStatus = [
      `${payload.action}：指令已提交`,
      `托管账号：${account?.name || "-"}`,
      `目标：${target}`,
      `文本内容：${payload.message || "模拟控制指令"}`,
      `执行结果：企业微信返回成功`,
    ];
    addLog({
      operator: "后台",
      operation: payload.action,
      accountId: account?.id || "",
      groupId: payload.targetType === "群聊" ? payload.targetId : "",
      target,
      type: payload.targetType,
      content: payload.message || payload.action,
      reply: `控制台任务 ${taskId} 执行成功`,
      status: "成功",
      detail: taskId,
    });
    return taskId;
  }

  function listLogs() {
    ensureState();
    return state.wecomLogs.filter((log) => {
      const account = getAccount(log.accountId);
      const contentQuery = String(state.wechatLogQuery || "").trim();
      const targetQuery = String(state.wechatLogTarget || "").trim();
      const matchesContent = !contentQuery || log.content.includes(contentQuery) || log.reply.includes(contentQuery) || log.detail.includes(contentQuery);
      const matchesTarget = !targetQuery || log.target.includes(targetQuery);
      const matchesType = state.wechatLogType === "全部类型" || log.type === state.wechatLogType;
      const matchesAccount = state.wechatLogAccount === "全部账号" || account?.name === state.wechatLogAccount;
      const matchesGroup = state.wechatLogGroup === "全部群聊" || log.groupId === state.wechatLogGroup;
      const afterStart = !state.wechatLogDateStart || log.date >= state.wechatLogDateStart;
      const beforeEnd = !state.wechatLogDateEnd || log.date <= state.wechatLogDateEnd;
      return matchesContent && matchesTarget && matchesType && matchesAccount && matchesGroup && afterStart && beforeEnd;
    });
  }

  function exportLogs() {
    const logs = listLogs();
    state.wecomLastExport = `${window.wecomMock.nowLabel()} 导出 ${logs.length} 条记录`;
    addLog({
      operation: "导出对话记录",
      content: "CSV 导出",
      reply: state.wecomLastExport,
      detail: "Mock 导出完成",
    });
    return logs.length;
  }

  window.wecomService = {
    ensureState,
    getAccount,
    getRule,
    getGroup,
    listAccounts,
    accountStats,
    saveAccount,
    deleteAccount,
    updateAccountStatus,
    toggleAccount,
    listRules,
    saveRule,
    deleteRule,
    toggleRule,
    updateAdvancedField,
    resetAdvanced,
    saveAdvanced,
    listGroups,
    toggleGroup,
    syncGroups,
    runConsole,
    listLogs,
    exportLogs,
    addLog,
    clone,
  };

  ensureState();
})();
