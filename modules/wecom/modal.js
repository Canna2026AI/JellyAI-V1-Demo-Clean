// Module modal renderers.

function renderWecomModal() {
  if (!state.modal) return "";
if (state.modal === "authAccount") {
    return modal("添加托管账号", renderAuthWizard(), state.authStep === 5 ? "完成" : "下一步", () => {
      if (state.authStep < 5) state.authStep += 1;
      else {
        const targetAccount = state.authAccountTarget ? getWechatAccount(state.authAccountTarget) : null;
        if (targetAccount) {
          window.wecomService?.updateAccountStatus(targetAccount.id, "在线");
          targetAccount.messageEnabled = true;
          targetAccount.aiEnabled = true;
        } else {
          window.wecomService?.saveAccount({
            name: `新托管账号${Date.now().toString().slice(-4)}`,
            alias: "扫码新增账号",
            avatar: "企",
            subject: "欧诚国际物流",
            group: "gs4758",
            assistant: "canna测试",
            owner: "Kelvin",
            remark: "通过扫码授权新增",
          });
        }
        state.authStep = 1;
        state.authAccountTarget = null;
        state.modal = null;
        showToast("托管账号添加成功");
      }
    });
  }

if (state.modal === "wecomAccountDetail") {
    const account = getWechatAccount(state.wecomActiveAccountId);
    if (!account) return "";
    return modal("托管账号详情", `
      <div class="wecom-detail-grid">
        <div><span>账号名称</span><b>${escapeHtml(account.name)}</b></div>
        <div><span>账号 ID</span><b>${escapeHtml(account.accountId)}</b></div>
        <div><span>内部 ID</span><b>${escapeHtml(account.id)}</b></div>
        <div><span>实例 ID</span><b>${escapeHtml(account.instanceId)}</b></div>
        <div><span>状态</span><b>${renderWechatStatusTag(account.status)}</b></div>
        <div><span>所属小组</span><b>${escapeHtml(account.group)}</b></div>
        <div><span>绑定 AI 助手</span><b>${escapeHtml(account.assistant)}</b></div>
        <div><span>消息接收</span><b>${account.messageEnabled ? "开启" : "关闭"}</b></div>
        <div><span>AI 回复</span><b>${account.aiEnabled ? "开启" : "关闭"}</b></div>
        <div><span>最近心跳</span><b>${escapeHtml(account.heartbeat)}</b></div>
        <div><span>主体名称</span><b>${escapeHtml(account.subject || "-")}</b></div>
        <div><span>负责人</span><b>${escapeHtml(account.owner || "-")}</b></div>
      </div>
      <div class="mini-card"><div class="mini-card-head">最近动作</div><div class="subtle">${escapeHtml(account.lastAction || "-")}</div></div>
      <div class="mini-card"><div class="mini-card-head">备注</div><div class="subtle">${escapeHtml(account.remark || "-")}</div></div>
    `, "确定", () => {
      state.modal = null;
      state.wecomActiveAccountId = null;
      showToast("账号详情已查看");
    });
  }

if (state.modal === "wecomAccountEdit") {
    const account = getWechatAccount(state.wecomActiveAccountId);
    if (!account) return "";
    return modal("编辑托管账号", `
      <div class="grid-2">
        <div class="form-row"><div class="label">账号名称</div><input class="input" data-wecom-account-field="name" style="width:100%" value="${escapeHtml(account.name)}"></div>
        <div class="form-row"><div class="label">别名</div><input class="input" data-wecom-account-field="alias" style="width:100%" value="${escapeHtml(account.alias || "")}"></div>
        <div class="form-row"><div class="label">所属小组</div><select class="select" data-wecom-account-field="group" style="width:100%">${renderWechatGroupOptions(account.group)}</select></div>
        <div class="form-row"><div class="label">绑定 AI 助手</div><select class="select" data-wecom-account-field="assistant" style="width:100%">${renderWechatAssistantOptions(account.assistant)}</select></div>
        <div class="form-row"><div class="label">主体名称</div><input class="input" data-wecom-account-field="subject" style="width:100%" value="${escapeHtml(account.subject || "")}"></div>
        <div class="form-row"><div class="label">负责人</div><input class="input" data-wecom-account-field="owner" style="width:100%" value="${escapeHtml(account.owner || "")}"></div>
      </div>
      <div class="form-row"><div class="label">备注</div><textarea class="textarea" data-wecom-account-field="remark" style="width:100%">${escapeHtml(account.remark || "")}</textarea></div>
    `, "保存", () => {
      const payload = {};
      document.querySelectorAll("[data-wecom-account-field]").forEach((field) => {
        payload[field.dataset.wecomAccountField] = field.value;
      });
      window.wecomService?.saveAccount(payload, account.id);
      state.modal = null;
      state.wecomActiveAccountId = null;
      showToast("托管账号已保存");
    });
  }

if (state.modal === "groupMembers") {
    const members = window.wecomService?.listTeamMembers() || [];
    const selectedMembers = (state.wecomTeamMembers || []).filter((member) => state.wecomSelectedMemberIds.includes(member.id));
    return modal("编辑组内成员", `
      <div class="member-modal-body">
        <div class="member-picker">
          <h3>非成员组成员</h3>
          <input class="input" data-wecom-member-search style="width:100%" placeholder="请输入搜索内容" value="${escapeHtml(state.wecomMemberSearch)}" />
          <p class="subtle">指定成员加入小组；想要实现小组成员随部门自动变更，可创建动态成员组并绑定小组。</p>
          <div class="member-tree">
            <div class="tree-row">⌄ <input type="checkbox" checked disabled> 📁 gs4758</div>
            ${members.length ? members.map((member) => `<label class="tree-row child">
              <input type="checkbox" data-wecom-member-toggle="${escapeHtml(member.id)}" ${state.wecomSelectedMemberIds.includes(member.id) ? "checked" : ""}>
              <span class="member-dot">${escapeHtml(member.name.slice(0, 1))}</span>
              ${escapeHtml(member.name)} · ${escapeHtml(member.role)}
            </label>`).join("") : `<div class="empty">暂无匹配成员</div>`}
          </div>
        </div>
        <div class="member-picked">
          <h3>已选成员</h3>
          <p class="subtle">已选择${selectedMembers.length}个成员 <button class="link-button" data-wecom-member-action="clear">清除所选成员</button></p>
          ${selectedMembers.length ? selectedMembers.map((member) => `<div class="selected-member"><span class="member-dot">${escapeHtml(member.name.slice(0, 1))}</span><b>${escapeHtml(member.name)}</b><button class="button ghost small" data-wecom-member-remove="${escapeHtml(member.id)}">×</button></div>`).join("") : `<div class="empty">暂无已选成员</div>`}
        </div>
      </div>
    `, "确定", () => {
      const count = window.wecomService?.saveTeamMembers() || 0;
      state.modal = null;
      showToast(`小组成员已更新：${count} 人`);
    });
  }

if (state.modal === "wecomSidebarConfig") {
    return modal("自定义侧边栏", `
      <div class="wecom-compact-form">
        <div class="form-row"><div class="label">侧边栏菜单</div><input class="input" data-wecom-sidebar-field="menus" style="width:100%" value="${escapeHtml(state.wecomSidebarMenus.join(", "))}"></div>
        <div class="mini-card"><div class="mini-card-head">预览</div><div class="subtle">${state.wecomSidebarMenus.map((item) => escapeHtml(item)).join(" · ")}</div></div>
        <p class="subtle">当前后端会保存菜单配置；接入企业微信侧边栏 SDK 后可同步到真实客户会话侧边栏。</p>
      </div>
    `, "保存", () => {
      const value = document.querySelector("[data-wecom-sidebar-field='menus']")?.value || "";
      window.wecomService?.saveSidebarMenus(value.split(",").map((item) => item.trim()).filter(Boolean));
      state.modal = null;
      showToast("自定义侧边栏已保存");
    });
  }

if (state.modal === "ruleConfig") {
    const rule = state.wecomActiveRuleId ? window.wecomService?.getRule(state.wecomActiveRuleId) : null;
    const current = rule || {
      name: "新聚合规则",
      accountId: state.wecomAccounts[0]?.id || "",
      replyScope: "全部",
      keywords: "报价, 运费",
      groupTrigger: "关键词",
      maxReplies: 3,
      enabled: true,
      messageEnabled: true,
      aiEnabled: true,
      assistant: state.wecomAssistants?.[0] || "canna测试",
    };
    return modal("配置聚合规则", `<div class="wecom-compact-form">
      <div class="form-row"><div class="label">规则名称</div><input class="input" data-wecom-rule-field="name" style="width:100%" value="${escapeHtml(current.name)}"></div>
      <div class="form-row"><div class="label">托管账号</div><select class="select" data-wecom-rule-field="accountId" style="width:100%">${renderWechatAccountOptions(current.accountId)}</select></div>
      <div class="grid-2">
        <div class="form-row"><div class="label">回复范围</div><select class="select" data-wecom-rule-field="replyScope" style="width:100%">${renderSelectOptions(["全部", "私聊", "群聊"], current.replyScope)}</select></div>
        <div class="form-row"><div class="label">群聊触发方式</div><select class="select" data-wecom-rule-field="groupTrigger" style="width:100%">${renderSelectOptions(["关键词", "仅@", "全部消息"], current.groupTrigger)}</select></div>
        <div class="form-row"><div class="label">最大 AI 回复次数</div><input class="input" data-wecom-rule-field="maxReplies" style="width:100%" value="${escapeHtml(current.maxReplies)}"></div>
        <div class="form-row"><div class="label">规则状态</div><select class="select" data-wecom-rule-field="enabled" style="width:100%">${renderWechatOption("true", "启用", String(current.enabled))}${renderWechatOption("false", "停用", String(current.enabled))}</select></div>
      </div>
      <div class="form-row"><div class="label">关键词</div><input class="input" data-wecom-rule-field="keywords" style="width:100%" value="${escapeHtml(current.keywords || "")}"></div>
      <div class="form-row"><div class="label">消息接收</div><select class="select" data-wecom-rule-field="messageEnabled" style="width:100%">${renderWechatOption("true", "开启", String(current.messageEnabled))}${renderWechatOption("false", "关闭", String(current.messageEnabled))}</select></div>
      <div class="form-row"><div class="label">AI 回复</div><select class="select" data-wecom-rule-field="aiEnabled" style="width:100%">${renderWechatOption("true", "开启", String(current.aiEnabled))}${renderWechatOption("false", "关闭", String(current.aiEnabled))}</select></div>
      <div class="form-row"><div class="label">绑定AI助手</div><select class="select" data-wecom-rule-field="assistant" style="width:100%">${renderWechatAssistantOptions(current.assistant)}</select></div>
    </div>`, "确定", () => {
      const payload = {};
      document.querySelectorAll("[data-wecom-rule-field]").forEach((field) => {
        const key = field.dataset.wecomRuleField;
        payload[key] = ["enabled", "messageEnabled", "aiEnabled"].includes(key) ? field.value === "true" : field.value;
      });
      window.wecomService?.saveRule(payload, rule?.id);
      state.modal = null;
      state.wecomActiveRuleId = null;
      if (state.page === "marketing" && state.marketingSub === "accounts") state.marketingAccountTab = "rules";
      showToast("聚合规则已保存");
    });
  }

if (state.modal === "wecomGroupDetail") {
    const group = window.wecomService?.getGroup(state.wecomActiveGroupId);
    if (!group) return "";
    const account = getWechatAccount(group.accountId);
    return modal("群聊详情", `
      <div class="wecom-detail-grid">
        <div><span>群名称</span><b>${escapeHtml(group.name)}</b></div>
        <div><span>群 ID</span><b>${escapeHtml(group.id)}</b></div>
        <div><span>托管账号</span><b>${escapeHtml(account?.name || "-")}</b></div>
        <div><span>群主/负责人</span><b>${escapeHtml(group.owner || "-")}</b></div>
        <div><span>成员数量</span><b>${group.members}</b></div>
        <div><span>AI 回复</span><b>${group.aiEnabled ? "开启" : "关闭"}</b></div>
        <div><span>消息接收</span><b>${group.messageEnabled ? "开启" : "关闭"}</b></div>
        <div><span>禁止改群名</span><b>${group.lockName ? "开启" : "关闭"}</b></div>
      </div>
      <div class="mini-card"><div class="mini-card-head">最近消息</div><div class="subtle">${escapeHtml(group.lastMessage || "-")}</div></div>
    `, "确定", () => {
      state.modal = null;
      state.wecomActiveGroupId = null;
      showToast("群聊详情已查看");
    });
  }

  return "";
}

function renderAuthWizard() {
  const step = state.authStep;
  const names = ["选择授权方式", "扫码登录", "初始化实例", "连接检测", "托管成功"];
  return `<div class="stepper">${names.map((n, i) => `<div class="step ${step === i + 1 ? "active" : step > i + 1 ? "done" : ""}">${i + 1}. ${n}</div>`).join("")}</div>
  ${step === 1 ? `<div class="grid-2"><div class="mini-card" style="border-color:var(--blue)"><b>扫码登录</b><br><span class="subtle">企业微信扫码授权远程托管</span></div><div class="mini-card"><b>账号授权</b><br><span class="subtle">仅 Demo 展示，不提交真实账号</span></div></div>` : ""}
  ${step === 2 ? `<div style="text-align:center"><div class="qr"></div><div class="subtle">请使用企业微信扫码授权</div></div>` : ""}
  ${step === 3 ? `<div class="mini-card"><div class="mini-card-head">正在启动远程实例 <span class="tag blue">执行中</span></div><div class="subtle">创建浏览器容器、初始化企业微信客户端、加载机器人控制服务。</div></div>` : ""}
  ${step === 4 ? `<div class="mini-card"><div class="mini-card-head">连接检测 <span class="tag green">通过</span></div><div class="subtle">WebSocket 已连接，消息队列正常，机器人心跳正常。</div></div>` : ""}
  ${step === 5 ? `<div class="empty">✅ 企业微信账号已托管成功，消息接收与 AI 回复已开启。</div>` : ""}`;
}
