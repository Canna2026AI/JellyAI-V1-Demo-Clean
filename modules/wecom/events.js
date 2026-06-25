// Enterprise WeChat hosting page and modal events.

function bindWecomEvents() {
document.querySelectorAll("[data-wechat-tab]").forEach((el) => el.addEventListener("click", () => setState({ wechatTab: el.dataset.wechatTab })));
  document.querySelectorAll("[data-wechat-filter]").forEach((el) => {
    const updateWechatFilter = () => {
      state[el.dataset.wechatFilter] = el.value;
      render();
      const next = document.querySelector(`[data-wechat-filter="${el.dataset.wechatFilter}"]`);
      if (next && next.tagName === "INPUT") {
        next.focus();
        next.setSelectionRange(next.value.length, next.value.length);
      }
    };
    el.addEventListener(el.tagName === "INPUT" ? "input" : "change", updateWechatFilter);
  });
  document.querySelectorAll("[data-wechat-reset]").forEach((el) =>
    el.addEventListener("click", () => {
      if (el.dataset.wechatReset === "logs") {
        setState({ wechatLogQuery: "", wechatLogTarget: "", wechatLogType: "全部类型", wechatLogAccount: "全部账号" });
        return;
      }
      setState({ wechatAccountFilter: "", wechatStatusFilter: "全部状态", wechatGroupFilter: "全部小组", wechatAssistantFilter: "全部助手" });
    })
  );
  document.querySelectorAll("[data-wechat-keywords]").forEach((el) =>
    el.addEventListener("input", () => {
      state.wecomAdvancedSettings.keywords = el.value;
    })
  );
  document.querySelectorAll("[data-wecom-switch]").forEach((el) =>
    el.addEventListener("click", () => {
      const id = el.dataset.wecomId;
      const type = el.dataset.wecomSwitch;
      if (type === "account-message" || type === "account-ai") {
        const account = getWechatAccount(id);
        if (account) account[type === "account-message" ? "messageEnabled" : "aiEnabled"] = !account[type === "account-message" ? "messageEnabled" : "aiEnabled"];
      }
      if (type === "rule-message" || type === "rule-ai") {
        const rule = state.wecomRules.find((item) => item.id === id);
        if (rule) rule[type === "rule-message" ? "messageEnabled" : "aiEnabled"] = !rule[type === "rule-message" ? "messageEnabled" : "aiEnabled"];
      }
      if (type === "group-message" || type === "group-ai" || type === "group-lock-name" || type === "group-block-friend") {
        const group = state.wecomGroups.find((item) => item.id === id);
        const field = {
          "group-message": "messageEnabled",
          "group-ai": "aiEnabled",
          "group-lock-name": "lockName",
          "group-block-friend": "blockAddFriend",
        }[type];
        if (group && field) group[field] = !group[field];
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
      if (action === "delete") {
        state.wecomAccounts = state.wecomAccounts.filter((item) => item.id !== account.id);
        showToast("托管账号已删除");
        render();
        return;
      }
      if (action === "restart") {
        account.status = "初始化中";
        account.heartbeat = "重启中";
        showToast("托管实例正在重启");
        render();
        window.setTimeout(() => {
          account.status = "在线";
          account.heartbeat = "刚刚";
          render();
          showToast("托管实例已恢复在线");
        }, 900);
        return;
      }
      if (action === "pause") {
        account.status = account.status === "暂停" ? "在线" : "暂停";
        account.heartbeat = account.status === "暂停" ? "已暂停" : "刚刚";
        showToast(account.status === "暂停" ? "托管账号已暂停" : "托管账号已恢复");
      }
      if (action === "rescan") {
        account.status = "待扫码";
        account.messageEnabled = false;
        account.aiEnabled = false;
        account.heartbeat = "-";
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
      const rule = state.wecomRules.find((item) => item.id === el.dataset.wecomId);
      if (!rule) return;
      rule.enabled = !rule.enabled;
      showToast(rule.enabled ? "聚合规则已启用" : "聚合规则已停用");
      render();
    })
  );

document.querySelectorAll("[data-console-action]").forEach((el) =>
    el.addEventListener("click", () => runConsoleAction(el.dataset.consoleAction))
  );
}

function bindWecomModalEvents() {
  // WeCom modal actions are handled by shared data-modal-ok callbacks.
}

function runConsoleAction(action) {
  const target = document.getElementById("consoleTarget")?.value.trim() || "未选择目标";
  const message = document.getElementById("consoleMessage")?.value.trim() || "未填写消息内容";
  state.consoleStatus = [
    `${action}：指令已提交`,
    `目标：${target}`,
    action === "发送文本" ? `文本内容：${message}` : "远程实例执行中",
    "企业微信返回成功",
  ];
  render();
  showToast(`${action}执行成功`);
}
