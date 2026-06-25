// Module modal renderers.

function renderWecomModal() {
  if (!state.modal) return "";
if (state.modal === "authAccount") {
    return modal("添加托管账号", renderAuthWizard(), state.authStep === 5 ? "完成" : "下一步", () => {
      if (state.authStep < 5) state.authStep += 1;
      else {
        const targetAccount = state.authAccountTarget ? getWechatAccount(state.authAccountTarget) : null;
        if (targetAccount) {
          targetAccount.status = "在线";
          targetAccount.messageEnabled = true;
          targetAccount.aiEnabled = true;
          targetAccount.heartbeat = "刚刚";
        } else {
          const nextId = String(8021 + state.wecomAccounts.filter((account) => account.id.startsWith("802")).length);
          state.wecomAccounts.unshift({
            id: nextId,
            name: `新托管账号${nextId}`,
            avatar: "企",
            accountId: `WeCom-${nextId}`,
            instanceId: `mock-${Date.now()}`,
            status: "在线",
            group: "gs4758",
            assistant: "canna测试",
            messageEnabled: true,
            aiEnabled: true,
            heartbeat: "刚刚",
          });
        }
        state.authStep = 1;
        state.authAccountTarget = null;
        state.modal = null;
        showToast("托管账号添加成功");
      }
    });
  }

if (state.modal === "groupMembers") {
    return modal("编辑组内成员", `
      <div class="member-modal-body">
        <div class="member-picker">
          <h3>非成员组成员</h3>
          <input class="input" style="width:100%" placeholder="请输入搜索内容" />
          <p class="subtle">指定成员加入小组；想要实现小组成员随部门自动变更，可创建动态成员组并绑定小组。</p>
          <div class="member-tree">
            <div class="tree-row">⌄ <input type="checkbox"> 📁 gs4758</div>
            <div class="tree-row child"><input type="checkbox" checked> <span class="member-dot">6</span> 6</div>
          </div>
        </div>
        <div class="member-picked">
          <h3>已选成员</h3>
          <p class="subtle">已选择1个成员 <button class="link-button">清除所选成员</button></p>
          <div class="selected-member"><span class="member-dot">我</span><b>我</b><button class="button ghost small">×</button></div>
        </div>
      </div>
    `, "确定", () => {
      state.modal = null;
      showToast("小组成员已更新");
    });
  }

if (state.modal === "ruleConfig") {
    return modal("配置聚合规则", `
      <div class="form-row"><div class="label">规则名称</div><input class="input" style="width:100%" value="测试"></div>
      <div class="form-row"><div class="label">托管账号</div><select class="select" style="width:100%"><option>测试 / ID:8018</option><option>123 / ID:8019</option></select></div>
      <div class="grid-2">
        <div class="form-row"><div class="label">回复范围</div><select class="select" style="width:100%"><option>全部</option><option>私聊</option><option>群聊</option></select></div>
        <div class="form-row"><div class="label">群聊触发方式</div><select class="select" style="width:100%"><option>关键词</option><option>仅@</option><option>全部消息</option></select></div>
        <div class="form-row"><div class="label">最大 AI 回复次数</div><input class="input" style="width:100%" value="3"></div>
        <div class="form-row"><div class="label">规则状态</div><select class="select" style="width:100%"><option>启用</option><option>停用</option></select></div>
      </div>
      <div class="form-row"><div class="label">消息接收</div><span class="switch on" data-switch></span></div>
      <div class="form-row"><div class="label">AI 回复</div><span class="switch on" data-switch></span></div>
      <div class="form-row"><div class="label">绑定AI助手</div><select class="select" style="width:100%"><option>canna测试</option><option>物流客服助手</option></select></div>
    `, "确定", () => {
      state.modal = null;
      if (state.page === "marketing" && state.marketingSub === "accounts") state.marketingAccountTab = "rules";
      showToast("聚合规则已保存");
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
