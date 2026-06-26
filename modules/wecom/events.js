// Enterprise WeChat hosting page and modal events.

function bindWecomEvents() {
  ensureWecomState();

  document.querySelectorAll("[data-wechat-tab]").forEach((el) =>
    el.addEventListener("click", () => setState({ wechatTab: el.dataset.wechatTab }))
  );

  document.querySelectorAll("[data-wecom-account-top-action]").forEach((el) =>
    el.addEventListener("click", () => {
      const action = el.dataset.wecomAccountTopAction;
      if (action === "group") {
        setState({ modal: "groupMembers" });
        return;
      }
      if (action === "sidebar") {
        setState({ modal: "wecomSidebarConfig" });
        return;
      }
      showToast("已显示托管账号列表");
    })
  );

  document.querySelectorAll("[data-wecom-member-view]").forEach((el) =>
    el.addEventListener("click", () => {
      if (el.dataset.wecomMemberView === "members") {
        setState({ modal: "groupMembers" });
        return;
      }
      showToast("已显示账号列表");
    })
  );

  document.querySelectorAll("[data-wecom-member-search-inline]").forEach((el) =>
    el.addEventListener("input", () => {
      state.wecomMemberSearch = el.value;
      render();
      const next = document.querySelector("[data-wecom-member-search-inline]");
      if (next) {
        next.focus();
        next.setSelectionRange(next.value.length, next.value.length);
      }
    })
  );

  document.querySelectorAll("[data-wechat-filter]").forEach((el) => {
    const updateWechatFilter = () => {
      state[el.dataset.wechatFilter] = el.value;
      if (["wechatAccountFilter", "wechatStatusFilter", "wechatGroupFilter", "wechatAssistantFilter"].includes(el.dataset.wechatFilter)) {
        state.wechatAccountPage = 1;
      }
      render();
      const next = document.querySelector(`[data-wechat-filter="${el.dataset.wechatFilter}"]`);
      if (next && next.tagName === "INPUT" && next.type !== "date") {
        next.focus();
        next.setSelectionRange(next.value.length, next.value.length);
      }
    };
    el.addEventListener(el.tagName === "INPUT" ? "input" : "change", updateWechatFilter);
  });

  document.querySelectorAll("[data-wechat-reset]").forEach((el) =>
    el.addEventListener("click", () => {
      if (el.dataset.wechatReset === "logs") {
        setState({
          wechatLogQuery: "",
          wechatLogTarget: "",
          wechatLogType: "全部类型",
          wechatLogAccount: "全部账号",
          wechatLogGroup: "全部群聊",
          wechatLogDateStart: "2026-06-13",
          wechatLogDateEnd: "2026-06-20",
        });
        showToast("记录筛选已重置");
        return;
      }
      if (el.dataset.wechatReset === "groups") {
        setState({ wecomGroupQuery: "" });
        showToast("群聊筛选已重置");
        return;
      }
      setState({ wechatAccountFilter: "", wechatStatusFilter: "全部状态", wechatGroupFilter: "全部小组", wechatAssistantFilter: "全部助手", wechatAccountPage: 1 });
      showToast("账号筛选已重置");
    })
  );

  document.querySelectorAll("[data-wecom-page]").forEach((el) =>
    el.addEventListener("click", () => {
      const pager = window.wecomService?.listAccounts();
      if (!pager) return;
      state.wechatAccountPage += el.dataset.wecomPage === "next" ? 1 : -1;
      state.wechatAccountPage = Math.min(Math.max(1, state.wechatAccountPage), pager.pageCount);
      render();
    })
  );

  document.querySelectorAll("[data-wechat-keywords]").forEach((el) =>
    el.addEventListener("input", () => {
      window.wecomService?.updateAdvancedField("keywords", el.value);
    })
  );

  document.querySelectorAll("[data-wecom-advanced-field]").forEach((el) =>
    el.addEventListener(el.tagName === "SELECT" ? "change" : "input", () => {
      const key = el.dataset.wecomAdvancedField;
      const value = key === "maxDailyReplies" ? Number(el.value) || 0 : el.value;
      window.wecomService?.updateAdvancedField(key, value);
    })
  );

  document.querySelectorAll("[data-wecom-advanced-action]").forEach((el) =>
    el.addEventListener("click", () => {
      if (el.dataset.wecomAdvancedAction === "reset") {
        window.wecomService?.resetAdvanced();
        showToast("高级设置已恢复默认");
        render();
        return;
      }
      window.wecomService?.saveAdvanced();
      showToast("高级设置已保存");
      render();
    })
  );

  document.querySelectorAll("[data-wecom-switch]").forEach((el) =>
    el.addEventListener("click", () => {
      const id = el.dataset.wecomId;
      const type = el.dataset.wecomSwitch;
      if (type === "account-message" || type === "account-ai") {
        window.wecomService?.toggleAccount(id, type === "account-message" ? "messageEnabled" : "aiEnabled");
      }
      if (type === "rule-message" || type === "rule-ai") {
        window.wecomService?.toggleRule(id, type === "rule-message" ? "messageEnabled" : "aiEnabled");
      }
      if (type === "group-message" || type === "group-ai" || type === "group-lock-name" || type === "group-block-friend") {
        const field = {
          "group-message": "messageEnabled",
          "group-ai": "aiEnabled",
          "group-lock-name": "lockName",
          "group-block-friend": "blockAddFriend",
        }[type];
        if (field) window.wecomService?.toggleGroup(id, field);
      }
      if (type === "advanced") {
        state.wecomAdvancedSettings[id] = !state.wecomAdvancedSettings[id];
      }
      render();
      showToast("设置已更新");
    })
  );

  document.querySelectorAll("[data-wecom-account-action]").forEach((el) =>
    el.addEventListener("click", () => {
      const account = getWechatAccount(el.dataset.wecomId);
      if (!account) return;
      const action = el.dataset.wecomAccountAction;
      if (action === "detail") {
        setState({ modal: "wecomAccountDetail", wecomActiveAccountId: account.id });
        return;
      }
      if (action === "edit") {
        setState({ modal: "wecomAccountEdit", wecomActiveAccountId: account.id });
        return;
      }
      if (action === "delete") {
        window.wecomService?.deleteAccount(account.id);
        showToast("托管账号已删除");
        render();
        return;
      }
      if (action === "restart") {
        state.wecomLoading.accounts = true;
        state.wecomLoading.accountActionId = account.id;
        window.wecomService?.updateAccountStatus(account.id, "初始化中");
        showToast("托管实例正在重启");
        render();
        window.setTimeout(() => {
          state.wecomLoading.accounts = false;
          state.wecomLoading.accountActionId = null;
          window.wecomService?.updateAccountStatus(account.id, "在线");
          render();
          showToast("托管实例已恢复在线");
        }, 900);
        return;
      }
      if (action === "pause") {
        window.wecomService?.updateAccountStatus(account.id, account.status === "暂停" ? "在线" : "暂停");
        showToast(account.status === "暂停" ? "托管账号已暂停" : "托管账号已恢复");
      }
      if (action === "rescan") {
        window.wecomService?.updateAccountStatus(account.id, "待扫码");
        account.messageEnabled = false;
        account.aiEnabled = false;
        state.modal = "authAccount";
        state.authStep = 2;
        state.authAccountTarget = account.id;
        showToast("已进入重新扫码流程");
      }
      render();
    })
  );

  document.querySelectorAll("[data-wecom-rule-action]").forEach((el) =>
    el.addEventListener("click", () => {
      const action = el.dataset.wecomRuleAction;
      if (action === "add") {
        setState({ modal: "ruleConfig", wecomActiveRuleId: null });
        return;
      }
      const rule = window.wecomService?.getRule(el.dataset.wecomId);
      if (!rule) return;
      if (action === "edit") {
        setState({ modal: "ruleConfig", wecomActiveRuleId: rule.id });
        return;
      }
      if (action === "delete") {
        window.wecomService?.deleteRule(rule.id);
        showToast("聚合规则已删除");
        render();
        return;
      }
      window.wecomService?.toggleRule(rule.id, "enabled");
      showToast(rule.enabled ? "聚合规则已启用" : "聚合规则已停用");
      render();
    })
  );

  document.querySelectorAll("[data-wecom-group-action]").forEach((el) =>
    el.addEventListener("click", () => {
      const action = el.dataset.wecomGroupAction;
      if (action === "detail") {
        setState({ modal: "wecomGroupDetail", wecomActiveGroupId: el.dataset.wecomId });
        return;
      }
      state.wecomLoading.groups = true;
      showToast("正在同步群聊");
      render();
      window.setTimeout(() => {
        state.wecomLoading.groups = false;
        const count = window.wecomService?.syncGroups() || 0;
        render();
        showToast(count ? `已同步 ${count} 个新群聊` : "群聊列表已是最新");
      }, 700);
    })
  );

  document.querySelectorAll("[data-wecom-log-action]").forEach((el) =>
    el.addEventListener("click", () => {
      if (el.dataset.wecomLogAction === "search") {
        showToast(`已查询到 ${(window.wecomService?.listLogs() || []).length} 条记录`);
        render();
        return;
      }
      state.wecomLoading.logs = true;
      showToast("正在导出对话记录");
      render();
      window.setTimeout(() => {
        state.wecomLoading.logs = false;
        const count = window.wecomService?.exportLogs() || 0;
        render();
        showToast(`已导出 ${count} 条记录`);
      }, 700);
    })
  );

  document.querySelectorAll("[data-wecom-workbench-action]").forEach((el) =>
    el.addEventListener("click", () => {
      const action = el.dataset.wecomWorkbenchAction;
      const result = window.wecomService?.runWorkbenchAction(action);
      if (action === "消息群发") {
        setState({ wechatTab: "console" });
        showToast(result || "已进入机器人控制台");
        return;
      }
      showToast(result || `${action}已记录`);
      render();
    })
  );

  ["consoleTargetType", "consoleContact", "consoleGroup"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", updateConsoleTargetField);
  });

  document.querySelectorAll("[data-console-action]").forEach((el) =>
    el.addEventListener("click", () => runConsoleAction(el.dataset.consoleAction))
  );
}

function bindWecomModalEvents() {
  document.querySelectorAll("[data-wecom-member-search]").forEach((el) =>
    el.addEventListener("input", () => {
      state.wecomMemberSearch = el.value;
      render();
      const next = document.querySelector("[data-wecom-member-search]");
      if (next) {
        next.focus();
        next.setSelectionRange(next.value.length, next.value.length);
      }
    })
  );
  document.querySelectorAll("[data-wecom-member-toggle]").forEach((el) =>
    el.addEventListener("change", () => {
      const id = el.dataset.wecomMemberToggle;
      if (el.checked && !state.wecomSelectedMemberIds.includes(id)) state.wecomSelectedMemberIds.push(id);
      if (!el.checked) state.wecomSelectedMemberIds = state.wecomSelectedMemberIds.filter((item) => item !== id);
      render();
      showToast("成员选择已更新");
    })
  );
  document.querySelectorAll("[data-wecom-member-remove]").forEach((el) =>
    el.addEventListener("click", () => {
      state.wecomSelectedMemberIds = state.wecomSelectedMemberIds.filter((item) => item !== el.dataset.wecomMemberRemove);
      render();
      showToast("成员已移除");
    })
  );
  document.querySelectorAll("[data-wecom-member-action='clear']").forEach((el) =>
    el.addEventListener("click", () => {
      state.wecomSelectedMemberIds = [];
      render();
      showToast("已清除所选成员");
    })
  );
}

function updateConsoleTargetField() {
  const targetType = document.getElementById("consoleTargetType")?.value || "群聊";
  const contactId = document.getElementById("consoleContact")?.value || "";
  const groupId = document.getElementById("consoleGroup")?.value || "";
  const target = document.getElementById("consoleTarget");
  state.wecomConsoleTargetType = targetType;
  state.wecomConsoleContactId = contactId;
  state.wecomConsoleGroupId = groupId;
  if (!target) return;
  if (targetType === "群聊") {
    const group = window.wecomService?.getGroup(groupId);
    target.value = group ? `${group.id} / ${group.name}` : "";
    return;
  }
  const contact = state.wecomContacts?.find((item) => item.id === contactId);
  target.value = contact ? `${contact.id} / ${contact.name}` : "";
}

function runConsoleAction(action) {
  const accountId = document.getElementById("consoleAccount")?.value || state.wecomAccounts[0]?.id || "";
  const targetType = document.getElementById("consoleTargetType")?.value || "群聊";
  const contactId = document.getElementById("consoleContact")?.value || "";
  const groupId = document.getElementById("consoleGroup")?.value || "";
  state.wecomConsoleTargetType = targetType;
  state.wecomConsoleContactId = contactId;
  state.wecomConsoleGroupId = groupId;
  const targetId = targetType === "群聊" ? groupId : contactId;
  const targetName = document.getElementById("consoleTarget")?.value.trim() || (targetType === "群聊" ? window.wecomService?.getGroup(groupId)?.name : state.wecomContacts?.find((contact) => contact.id === contactId)?.name) || "未选择目标";
  const message = document.getElementById("consoleMessage")?.value.trim() || "未填写消息内容";
  state.wecomLoading.console = true;
  state.consoleStatus = [`${action}：正在提交`, `目标：${targetName}`, "等待托管后端返回"];
  showToast(`${action}已提交`);
  render();
  window.setTimeout(() => {
    state.wecomLoading.console = false;
    window.wecomService?.runConsole({ action, accountId, targetType, targetId, targetName, message });
    render();
    showToast(`${action}执行成功`);
  }, 700);
}
