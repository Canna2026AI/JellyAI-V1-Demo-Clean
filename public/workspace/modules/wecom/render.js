// Enterprise WeCom hosting module renderers.

function renderWechat() {
  const tabs = [
    ["accounts", "账号列表"],
    ["rules", "聚合规则"],
    ["advanced", "高级设置"],
    ["workbench", "对话工作台"],
    ["console", "机器人控制台"],
    ["groups", "群聊管理"],
    ["logs", "对话记录查询"],
  ];
  return `
    <section class="channel-manage-page">
      <aside class="channel-profile-panel">
        <div class="channel-profile">
          <div class="channel-mini-icon orange">企</div>
          <div>
            <h3>企业微信代运营(私聊/群聊)</h3>
            <p>管理已绑定账号与高级设置。</p>
          </div>
        </div>
        <nav class="channel-tabs">
          ${tabs
          .map(([id, label]) => `<button class="channel-tab ${state.wechatTab === id ? "active" : ""}" data-wechat-tab="${id}">${label}</button>`)
          .join("")}
        </nav>
        <div class="channel-help">
          <b>帮助文档</b>
          <a>• 如何授权企业微信代运营</a>
        </div>
      </aside>
      <main class="channel-manage-main">
        <button class="back-link" data-page="channels">‹ 返回对话渠道列表</button>
        ${renderWechatTab()}
      </main>
    </section>`;
}

function renderWechatTab() {
  switch (state.wechatTab) {
    case "rules":
      return renderChannelRules();
    case "advanced":
      return renderChannelAdvanced();
    case "workbench":
      return renderChannelWorkbench();
    case "console":
      return renderRobotConsole();
    case "groups":
      return renderGroupManagement();
    case "logs":
      return renderLogs();
    default:
      return renderChannelAccounts();
  }
}

function renderChannelAccounts() {
  const accounts = getWechatFilteredAccounts();
  const groups = ["全部小组", ...new Set(state.wecomAccounts.map((account) => account.group))];
  const assistants = ["全部助手", ...new Set(state.wecomAccounts.map((account) => account.assistant))];
  const statusOptions = ["全部状态", "待扫码", "初始化中", "在线", "离线", "异常", "暂停"];
  const stats = [
    ["在线账号", state.wecomAccounts.filter((account) => account.status === "在线").length, "green"],
    ["离线账号", state.wecomAccounts.filter((account) => account.status === "离线").length, "orange"],
    ["初始化中", state.wecomAccounts.filter((account) => account.status === "初始化中").length, "blue"],
    ["异常账号", state.wecomAccounts.filter((account) => account.status === "异常").length, "red"],
  ];
  return `
    <div class="channel-section-head">
      <div>
        <h1 class="page-title">账号列表</h1>
        <div class="subtle">管理托管账号、小组成员与企业微信远程实例。</div>
      </div>
      <button class="button primary" data-modal="authAccount">＋ 添加账号</button>
    </div>
    <div class="channel-top-tabs">
      <button class="active-blue" data-demo-action="已切换到托管账号">托管账号</button>
      <button data-demo-action="小组详情为 Demo 展示">小组详情</button>
      <button data-demo-action="自定义侧边栏为 Demo 展示">自定义侧边栏</button>
    </div>
    <div class="group-hero">
      <div class="group-hero-main">
        <span class="group-avatar">群</span>
        <div>
          <h2>gs4758</h2>
          <p>默认创建</p>
        </div>
      </div>
      <div class="group-stat"><b>${state.wecomAccounts.filter((account) => account.status === "在线").length}</b><span>在线</span></div>
      <div class="group-stat"><b>${state.wecomAccounts.length}</b><span>已托管账号数量</span></div>
      <button class="button primary" data-modal="groupMembers">编辑组内成员</button>
    </div>
    <div class="member-toolbar">
      <div>
        <button class="button small active" data-demo-action="已切换到账号列表">账号列表</button>
        <button class="button small primary" data-demo-action="成员列表为 Demo 展示">成员列表</button>
      </div>
      <input class="input" placeholder="请输入成员名称" />
    </div>
    <div class="table-card">
      <table class="compact-table">
        <thead><tr><th>成员名称(1)</th><th>托管账号</th><th>在线状态</th><th>角色</th><th>操作</th></tr></thead>
        <tbody>
          <tr>
            <td><span class="member-dot">我</span> 我</td>
            <td>gs4758 / 6</td>
            <td><span class="tag green">在线</span></td>
            <td>小组管理员</td>
            <td><button class="button small" data-modal="groupMembers">编辑成员</button></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="status-grid wechat-status-grid">
      ${stats.map(([label, value, cls]) => `<div class="metric"><div class="subtle">${label}</div><div class="metric-value">${value}</div><span class="tag ${cls}">本地模拟</span></div>`).join("")}
    </div>
    <div class="member-toolbar wechat-filter-bar">
      <input class="input" data-wechat-filter="wechatAccountFilter" placeholder="请输入账号名称 / ID" value="${escapeHtml(state.wechatAccountFilter)}" />
      <select class="select" data-wechat-filter="wechatStatusFilter">${renderSelectOptions(statusOptions, state.wechatStatusFilter)}</select>
      <select class="select" data-wechat-filter="wechatGroupFilter">${renderSelectOptions(groups, state.wechatGroupFilter)}</select>
      <select class="select" data-wechat-filter="wechatAssistantFilter">${renderSelectOptions(assistants, state.wechatAssistantFilter)}</select>
      <button class="button" data-wechat-reset="accounts">重置</button>
    </div>
    <div class="table-card channel-table-gap">
      <table>
        <thead><tr><th>账号信息</th><th>托管账号 ID</th><th>状态</th><th>所属小组</th><th>消息接收</th><th>AI 回复</th><th>绑定助手</th><th>最近心跳</th><th>操作</th></tr></thead>
        <tbody>
          ${accounts.length ? accounts.map((account) => `<tr>
            <td><div class="wechat-account-cell">${iconBox(account.avatar, "channel-icon")}<div><b>${account.name}</b><br><span class="subtle">实例：${account.instanceId}</span></div></div></td>
            <td>${account.accountId}<br><span class="subtle">内部 ID：${account.id}</span></td>
            <td>${renderWechatStatusTag(account.status)}</td>
            <td>${account.group}</td>
            <td>${renderWechatSwitch(account.messageEnabled, "account-message", account.id)}</td>
            <td>${renderWechatSwitch(account.aiEnabled, "account-ai", account.id)}</td>
            <td>${account.assistant === "未绑定" ? `<span class="subtle">未绑定</span>` : `<span class="tag blue">${account.assistant}</span>`}</td>
            <td>${account.heartbeat}</td>
            <td class="action-cell">
              <button class="button small" data-wechat-tab="console">控制台</button>
              <button class="button small" data-wechat-tab="advanced">高级设置</button>
              <button class="button small" data-wecom-account-action="restart" data-wecom-id="${account.id}">重启</button>
              <button class="button small" data-wecom-account-action="pause" data-wecom-id="${account.id}">${account.status === "暂停" ? "恢复" : "暂停"}</button>
              <button class="button small" data-wecom-account-action="rescan" data-wecom-id="${account.id}">重新扫码</button>
              <button class="button small" data-wecom-account-action="delete" data-wecom-id="${account.id}">删除</button>
            </td>
          </tr>`).join("") : `<tr><td colspan="9"><div class="empty">暂无匹配账号</div></td></tr>`}
        </tbody>
      </table>
    </div>`;
}

function renderChannelRules() {
  const rows = state.wecomRules.map((rule) => {
    const account = getWechatAccount(rule.accountId);
    return `<tr>
      <td><b>${rule.name}</b><br><span class="subtle">规则 ID：${rule.id}</span></td>
      <td>${account ? `${account.name}<br><span class="subtle">${account.accountId}</span>` : "未选择"}</td>
      <td>${renderWechatSwitch(rule.messageEnabled, "rule-message", rule.id)}</td>
      <td>${renderWechatSwitch(rule.aiEnabled, "rule-ai", rule.id)}</td>
      <td>${rule.replyScope}</td>
      <td>${rule.groupTrigger}</td>
      <td><span class="tag blue">${rule.assistant}</span></td>
      <td>${rule.maxReplies} 次</td>
      <td>${renderWechatStatusTag(rule.enabled ? "在线" : "暂停")}</td>
      <td><button class="link-button" data-modal="ruleConfig">配置</button> <button class="link-button" data-wecom-rule-action="toggle" data-wecom-id="${rule.id}">${rule.enabled ? "停用" : "启用"}</button></td>
    </tr>`;
  }).join("");
  return `
    <div class="channel-section-head">
      <div>
        <h1 class="page-title">聚合规则</h1>
        <div class="subtle">接入到聚合对话并设置AI回复规则</div>
      </div>
      <button class="button primary" data-modal="ruleConfig">＋ 添加规则</button>
    </div>
    <div class="table-card">
      <table>
        <thead><tr><th>规则名称</th><th>托管账号</th><th>消息接收</th><th>AI 回复</th><th>回复范围</th><th>群聊触发方式</th><th>绑定 AI 助手</th><th>最大 AI 回复次数</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderChannelAdvanced() {
  const rows = [
    ["mentionExternal", "AI 群聊回复时是否 @ 外部联系人"],
    ["onlyExternalQuestions", "AI 群聊回复是否仅回复非企业员工问题"],
    ["newFriendCreatesConversation", "新好友通过消息是否触发会话"],
    ["syncAllGroupMessages", "是否同步群聊全部内容"],
    ["manualReplyToHuman", "终端设备手动回复后是否切换人工"],
  ];
  return `
    <div class="channel-section-head">
      <div>
        <h1 class="page-title">高级设置</h1>
        <div class="subtle">管理 企业微信代运营(私聊/群聊) 的高级功能选项。</div>
      </div>
    </div>
    <div class="settings-list">
      ${rows.map(([key, label]) => `<div class="setting-row"><b>${label}</b><span class="switch ${state.wecomAdvancedSettings[key] ? "on" : ""}" data-wecom-switch="advanced" data-wecom-id="${key}"></span></div>`).join("")}
      <div class="setting-row vertical">
        <b>群聊触发关键词</b>
        <input class="input" data-wechat-keywords value="${escapeHtml(state.wecomAdvancedSettings.keywords)}" />
      </div>
    </div>`;
}

function renderChannelWorkbench() {
  const cards = [
    ["对话工作台", "统一查看企业微信私聊、群聊、AI对话与人工接待。", "chat"],
    ["营销标签", "按来源、意图、阶段给客户自动打标签。", "tag"],
    ["消息群发", "选择托管账号、联系人或群聊后批量发送消息。", "send"],
    ["自动加好友", "配置欢迎语、关键词和通过好友后的触发动作。", "friend"],
    ["自动化运营", "将加好友、发素材、拉群、转人工串成自动流程。", "auto"],
    ["素材管理", "管理文本、图片、文件、链接和常用话术。", "file"],
  ];
  return `
    <div class="channel-section-head">
      <div>
        <h1 class="page-title">对话工作台</h1>
        <div class="subtle">企业微信营销和客服的日常操作入口。</div>
      </div>
      <button class="button primary" data-page="chat">进入聚合对话</button>
    </div>
    <div class="workbench-grid">
      ${cards.map(([title, desc, icon]) => `<div class="workbench-card" ${icon === "chat" ? `data-page="chat"` : `data-demo-action="${title}入口为 Demo 展示"`}>
        <span>${icon}</span>
        <b>${title}</b>
        <p>${desc}</p>
      </div>`).join("")}
    </div>`;
}

function renderAccounts() {
  return `
    <div class="toolbar">
      <div style="display:flex; gap:8px"><input class="input" placeholder="请输入托管账号名称"><select class="select"><option>请选择托管账号状态</option></select><button class="button">批量打标签</button></div>
      <button class="button primary">托管账号标签管理</button>
    </div>
    <div class="table-card">
      <table>
        <thead><tr><th>账号信息/别名</th><th>状态</th><th>托管账号</th><th>账号ID</th><th>主体名称</th><th>消息接收</th><th>AI回复</th><th>绑定助手</th><th>操作</th></tr></thead>
        <tbody>
          <tr><td>👩 王丽<br><span class="subtle">别名：王丽</span></td><td><span class="tag green">在线</span> <span class="tag green">重启</span></td><td>ZhuLi01(1688854711425567)</td><td>65efc4ad2cb38280fa3f12a5</td><td>集简普通</td><td><span class="switch on" data-switch></span></td><td><span class="switch on" data-switch></span></td><td><span class="tag blue">物流客服助手</span></td><td><button class="button small" data-wechat-tab="console">控制台</button> <button class="button small">更多</button></td></tr>
          <tr><td>👤 待托管<br><span class="subtle">别名：-</span></td><td><span class="tag orange">待托管</span> <span class="tag red">启动</span></td><td>待托管</td><td>66ebee1c05f51dab6acf4564</td><td>-</td><td><span class="switch" data-switch></span></td><td><span class="switch" data-switch></span></td><td>-</td><td><button class="button small" data-modal="authAccount">启动</button> <button class="button small">删除</button></td></tr>
        </tbody>
      </table>
    </div>`;
}

function renderWechatStatus() {
  const metrics = [
    ["远程服务器节点", "华南节点", "在线"],
    ["企业微信客户端", "在线", "刚刚心跳"],
    ["WebSocket", "已连接", "延迟 24ms"],
    ["消息队列", "正常", "0 条堆积"],
    ["今日接收消息", "128", "较昨日 +12%"],
    ["今日AI回复", "96", "命中知识库 74次"],
    ["今日主动发送", "24", "成功率 100%"],
    ["今日拉群任务", "3", "成功 3 次"],
  ];
  return `<div class="status-grid">${metrics.map(([a,b,c]) => `<div class="metric"><div class="subtle">${a}</div><div class="metric-value">${b}</div><span class="tag green">${c}</span></div>`).join("")}</div>
  <div style="margin-top:18px; display:flex; gap:10px"><button class="button primary">重启托管实例</button><button class="button">暂停托管</button><button class="button">重新扫码</button><button class="button">查看远程日志</button></div>`;
}

function renderRobotConsole() {
  const logs = state.consoleStatus.length ? state.consoleStatus : ["等待提交远程控制指令"];
  const accountOptions = state.wecomAccounts.map((account) => `<option>${account.name} / ${account.accountId}</option>`).join("");
  return `
    <div class="console-grid">
      <div class="card">
        <h3>机器人控制台</h3>
        <div class="form-row"><div class="label">选择托管账号</div><select class="select" style="width:100%">${accountOptions}</select></div>
        <div class="form-row"><div class="label">目标类型</div><select class="select" style="width:100%"><option>群聊</option><option>联系人</option></select></div>
        <div class="form-row"><div class="label">目标 ID / 名称</div><input class="input" id="consoleTarget" style="width:100%" value="R:107758403324120 / 欧诚国际物流&集简云对接群"></div>
        <div class="form-row"><div class="label">消息内容</div><textarea class="textarea" id="consoleMessage" style="width:100%">您好，Jelly AI 已接管企业微信客服，后续物流问题可直接在群里咨询。</textarea></div>
        <div class="action-grid">${["发送文本", "发送图片", "发送文件", "创建群聊", "拉人进群", "修改群名称", "发送群公告"].map((x) => `<button class="button" data-console-action="${x}">${x}</button>`).join("")}</div>
      </div>
      <div class="card">
        <h3>执行结果</h3>
        ${logs.map((l, i) => `<div class="log-line"><span class="dot" style="${i === 0 && logs.length === 1 ? "background:#cbd5e1" : ""}"></span><div>${l}<div class="subtle">${logs.length > 1 ? "taskId: MOCK-20260618-001" : ""}</div></div></div>`).join("")}
      </div>
    </div>`;
}

function renderGroupManagement() {
  return `<div class="channel-section-head">
    <div><h1 class="page-title">群聊管理</h1><div class="subtle">管理托管账号可接收和可自动回复的企业微信群。</div></div>
    <button class="button primary" data-demo-action="同步群聊">同步群聊</button>
  </div>
  <div class="table-card"><table><thead><tr><th>群名称</th><th>群 ID</th><th>成员数</th><th>AI 回复</th><th>消息接收</th><th>禁止改群名</th><th>禁止互加好友</th><th>操作</th></tr></thead><tbody>
    ${state.wecomGroups.map((group) => `<tr>
      <td>👥 ${group.name}</td>
      <td>${group.id}</td>
      <td>${group.members}</td>
      <td>${renderWechatSwitch(group.aiEnabled, "group-ai", group.id)}</td>
      <td>${renderWechatSwitch(group.messageEnabled, "group-message", group.id)}</td>
      <td>${renderWechatSwitch(group.lockName, "group-lock-name", group.id)}</td>
      <td>${renderWechatSwitch(group.blockAddFriend, "group-block-friend", group.id)}</td>
      <td><button class="button small" data-demo-action="查看群成员">查看成员</button> <button class="button small" data-wechat-tab="console">发消息</button> <button class="button small" data-wechat-tab="rules">设置规则</button></td>
    </tr>`).join("")}
  </tbody></table></div>`;
}

function renderAlerts() {
  return `<div class="card"><div class="toolbar"><h3>报警通知</h3><button class="button primary" data-modal="alertBot">添加报警机器人</button></div>
  <div class="mini-card"><div class="mini-card-head">企业微信群报警机器人 <span class="tag green">已启用</span></div><div class="subtle">通知类型：托管账号掉线、群发任务异常、账号风控提醒、每日数据提醒</div></div>
  <div class="mini-card"><div class="mini-card-head">报警规则设置</div><div class="subtle">掉线超过 5 分钟通知 · 连续失败 3 次通知 · 每日 09:00 发送日报</div></div></div>`;
}

function renderLogs() {
  const accountOptions = ["全部账号", ...state.wecomAccounts.map((account) => account.name)];
  const filteredLogs = state.wecomLogs.filter((log) => {
    const account = getWechatAccount(log.accountId);
    const contentQuery = state.wechatLogQuery.trim();
    const targetQuery = state.wechatLogTarget.trim();
    const matchesContent = !contentQuery || log.content.includes(contentQuery) || log.reply.includes(contentQuery);
    const matchesTarget = !targetQuery || log.target.includes(targetQuery);
    const matchesType = state.wechatLogType === "全部类型" || log.type === state.wechatLogType;
    const matchesAccount = state.wechatLogAccount === "全部账号" || account?.name === state.wechatLogAccount;
    return matchesContent && matchesTarget && matchesType && matchesAccount;
  });
  return `<div class="channel-section-head">
    <div><h1 class="page-title">对话记录查询</h1><div class="subtle">查询企业微信托管产生的私聊、群聊和 AI 回复记录。</div></div>
  </div>
  <div class="member-toolbar wechat-filter-bar">
    <input class="input" data-wechat-filter="wechatLogQuery" placeholder="搜索聊天内容" value="${escapeHtml(state.wechatLogQuery)}" />
    <input class="input" data-wechat-filter="wechatLogTarget" placeholder="搜索好友或群" value="${escapeHtml(state.wechatLogTarget)}" />
    <button class="button" data-demo-action="日期范围选择器已打开">2026-06-13　至　2026-06-20</button>
    <select class="select" data-wechat-filter="wechatLogType">${renderSelectOptions(["全部类型", "私聊", "群聊"], state.wechatLogType)}</select>
    <select class="select" data-wechat-filter="wechatLogAccount">${renderSelectOptions(accountOptions, state.wechatLogAccount)}</select>
    <button class="button" data-wechat-reset="logs">重置</button>
    <button class="button primary" data-demo-action="查询对话记录">搜索</button>
  </div>
  <div class="table-card channel-table-gap"><table><thead><tr><th>时间</th><th>操作人</th><th>操作类型</th><th>所属托管账号</th><th>目标</th><th>聊天类型</th><th>聊天内容 / AI 回复</th><th>状态</th><th>详情</th></tr></thead><tbody>
    ${filteredLogs.length ? filteredLogs.map((log) => {
      const account = getWechatAccount(log.accountId);
      return `<tr><td>${log.time}</td><td>${log.operator}</td><td>${log.operation}</td><td>${account?.name || "-"}</td><td>${log.target}</td><td>${log.type}</td><td><b>${log.content}</b><br><span class="subtle">${log.reply}</span></td><td>${renderWechatStatusTag(log.status)}</td><td>${log.detail}</td></tr>`;
    }).join("") : `<tr><td colspan="9"><div class="empty">暂无匹配记录</div></td></tr>`}
  </tbody></table></div>`;
}
