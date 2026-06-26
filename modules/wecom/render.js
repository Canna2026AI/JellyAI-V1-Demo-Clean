// Enterprise WeCom hosting module renderers.

function renderWechat() {
  ensureWecomState();
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
  const pager = getWechatAccountPageResult();
  const accounts = pager.items;
  const groups = ["全部小组", ...new Set(state.wecomAccounts.map((account) => account.group))];
  const assistants = ["全部助手", ...new Set(state.wecomAccounts.map((account) => account.assistant))];
  const statusOptions = ["全部状态", "待扫码", "初始化中", "在线", "离线", "异常", "暂停"];
  const accountStats = window.wecomService?.accountStats() || {};
  const stats = [
    ["在线账号", accountStats.online ?? state.wecomAccounts.filter((account) => account.status === "在线").length, "green"],
    ["离线账号", accountStats.offline ?? state.wecomAccounts.filter((account) => account.status === "离线").length, "orange"],
    ["初始化中", accountStats.starting ?? state.wecomAccounts.filter((account) => account.status === "初始化中").length, "blue"],
    ["异常账号", accountStats.error ?? state.wecomAccounts.filter((account) => account.status === "异常").length, "red"],
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
      <button class="active-blue" data-wecom-account-top-action="accounts">托管账号</button>
      <button data-wecom-account-top-action="group">小组详情</button>
      <button data-wecom-account-top-action="sidebar">自定义侧边栏</button>
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
        <button class="button small active" data-wecom-member-view="accounts">账号列表</button>
        <button class="button small primary" data-wecom-member-view="members">成员列表</button>
      </div>
      <input class="input" data-wecom-member-search-inline placeholder="请输入成员名称" value="${escapeHtml(state.wecomMemberSearch)}" />
    </div>
    <div class="table-card">
      <table class="compact-table">
        <thead><tr><th>成员名称(${state.wecomSelectedMemberIds.length})</th><th>托管账号</th><th>在线状态</th><th>角色</th><th>操作</th></tr></thead>
        <tbody>
          ${state.wecomTeamMembers
            .filter((member) => state.wecomSelectedMemberIds.includes(member.id))
            .map((member) => `<tr>
              <td><span class="member-dot">${escapeHtml(member.name.slice(0, 1))}</span> ${escapeHtml(member.name)}</td>
              <td>${escapeHtml(state.wecomAccounts[0]?.group || "gs4758")} / ${member.accountCount}</td>
              <td>${renderWechatStatusTag(member.status)}</td>
              <td>${escapeHtml(member.role)}</td>
              <td><button class="button small" data-modal="groupMembers" title="编辑小组成员">编辑成员</button></td>
            </tr>`)
            .join("") || `<tr><td colspan="5"><div class="empty">暂无组内成员</div></td></tr>`}
        </tbody>
      </table>
    </div>
    <div class="status-grid wechat-status-grid">
      ${stats.map(([label, value, cls]) => `<div class="metric"><div class="subtle">${label}</div><div class="metric-value">${value}</div><span class="tag ${cls}">后端同步</span></div>`).join("")}
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
            <td><div class="wechat-account-cell">${iconBox(account.avatar, "channel-icon")}<div><b>${escapeHtml(account.name)}</b><br><span class="subtle">别名：${escapeHtml(account.alias || "-")} · 实例：${escapeHtml(account.instanceId)}</span></div></div></td>
            <td>${escapeHtml(account.accountId)}<br><span class="subtle">内部 ID：${escapeHtml(account.id)}</span></td>
            <td>${renderWechatStatusTag(account.status)}</td>
            <td>${escapeHtml(account.group)}</td>
            <td>${renderWechatSwitch(account.messageEnabled, "account-message", account.id)}</td>
            <td>${renderWechatSwitch(account.aiEnabled, "account-ai", account.id)}</td>
            <td>${account.assistant === "未绑定" ? `<span class="subtle">未绑定</span>` : `<span class="tag blue">${escapeHtml(account.assistant)}</span>`}</td>
            <td>${escapeHtml(account.heartbeat)}</td>
            <td class="action-cell">
              <button class="button small" data-wecom-account-action="detail" data-wecom-id="${account.id}" title="查看账号详情">详情</button>
              <button class="button small" data-wecom-account-action="edit" data-wecom-id="${account.id}" title="编辑账号配置">编辑</button>
              <button class="button small" data-wechat-tab="console" title="进入机器人控制台">控制台</button>
              <button class="button small" data-wechat-tab="advanced" title="进入高级设置">高级设置</button>
              <button class="button small" data-wecom-account-action="restart" data-wecom-id="${account.id}" ${state.wecomLoading.accountActionId === account.id ? "disabled" : ""}>${renderWecomLoadingText(state.wecomLoading.accountActionId === account.id, "重启", "重启中")}</button>
              <button class="button small" data-wecom-account-action="pause" data-wecom-id="${account.id}" title="${account.status === "暂停" ? "恢复托管" : "暂停托管"}">${account.status === "暂停" ? "恢复" : "暂停"}</button>
              <button class="button small" data-wecom-account-action="rescan" data-wecom-id="${account.id}" title="重新进入扫码授权流程">重新扫码</button>
              <button class="button small danger" data-wecom-account-action="delete" data-wecom-id="${account.id}" title="删除托管账号">删除</button>
            </td>
          </tr>`).join("") : `<tr><td colspan="9"><div class="empty">暂无匹配账号</div></td></tr>`}
        </tbody>
      </table>
      ${renderWecomPagination(pager)}
    </div>`;
}

function renderChannelRules() {
  const rules = window.wecomService?.listRules() || state.wecomRules;
  const rows = rules.map((rule) => {
    const account = getWechatAccount(rule.accountId);
    return `<tr>
      <td><b>${escapeHtml(rule.name)}</b><br><span class="subtle">规则 ID：${escapeHtml(rule.id)}</span></td>
      <td>${account ? `${escapeHtml(account.name)}<br><span class="subtle">${escapeHtml(account.accountId)}</span>` : "未选择"}</td>
      <td>${renderWechatSwitch(rule.messageEnabled, "rule-message", rule.id)}</td>
      <td>${renderWechatSwitch(rule.aiEnabled, "rule-ai", rule.id)}</td>
      <td>${escapeHtml(rule.replyScope)}</td>
      <td>${escapeHtml(rule.keywords || "-")}</td>
      <td>${escapeHtml(rule.groupTrigger)}</td>
      <td><span class="tag blue">${escapeHtml(rule.assistant)}</span></td>
      <td>${rule.maxReplies} 次</td>
      <td>${renderWechatStatusTag(rule.enabled ? "在线" : "暂停")}</td>
      <td><button class="link-button" data-wecom-rule-action="edit" data-wecom-id="${rule.id}">配置</button> <button class="link-button" data-wecom-rule-action="toggle" data-wecom-id="${rule.id}">${rule.enabled ? "停用" : "启用"}</button> <button class="link-button" data-wecom-rule-action="delete" data-wecom-id="${rule.id}">删除</button></td>
    </tr>`;
  }).join("");
  return `
    <div class="channel-section-head">
      <div>
        <h1 class="page-title">聚合规则</h1>
        <div class="subtle">接入到聚合对话并设置AI回复规则</div>
      </div>
      <button class="button primary" data-wecom-rule-action="add">＋ 添加规则</button>
    </div>
    <div class="table-card">
      <table>
        <thead><tr><th>规则名称</th><th>托管账号</th><th>消息接收</th><th>AI 回复</th><th>回复范围</th><th>关键词</th><th>群聊触发方式</th><th>绑定 AI 助手</th><th>最大 AI 回复次数</th><th>状态</th><th>操作</th></tr></thead>
        <tbody>${rows || `<tr><td colspan="11"><div class="empty">暂无聚合规则</div></td></tr>`}</tbody>
      </table>
    </div>`;
}

function renderChannelAdvanced() {
  const groupRows = [
    ["mentionExternal", "AI 群聊回复时是否 @ 外部联系人"],
    ["onlyExternalQuestions", "AI 群聊回复是否仅回复非企业员工问题"],
    ["syncAllGroupMessages", "是否同步群聊全部内容"],
  ];
  const replyRows = [
    ["groupAutoReply", "群聊是否允许 AI 自动回复"],
    ["privateAutoReply", "私聊是否允许 AI 自动回复"],
    ["manualReplyToHuman", "终端设备手动回复后是否切换人工"],
  ];
  const triggerRows = [
    ["newFriendCreatesConversation", "新好友通过消息是否触发会话"],
  ];
  return `
    <div class="channel-section-head">
      <div>
        <h1 class="page-title">高级设置</h1>
        <div class="subtle">管理 企业微信代运营(私聊/群聊) 的高级功能选项。</div>
      </div>
      <div class="button-row">
        <button class="button" data-wecom-advanced-action="reset">恢复默认</button>
        <button class="button primary" data-wecom-advanced-action="save">保存设置</button>
      </div>
    </div>
    <div class="settings-list">
      <div class="wecom-setting-group"><b>群聊设置</b><span class="subtle">控制群消息同步、@ 外部联系人和员工问题过滤。</span></div>
      ${groupRows.map(([key, label]) => `<div class="setting-row"><b>${label}</b>${renderWechatSwitch(state.wecomAdvancedSettings[key], "advanced", key)}</div>`).join("")}
      <div class="wecom-setting-group"><b>回复设置</b><span class="subtle">控制私聊、群聊和人工接管策略。</span></div>
      ${replyRows.map(([key, label]) => `<div class="setting-row"><b>${label}</b>${renderWechatSwitch(state.wecomAdvancedSettings[key], "advanced", key)}</div>`).join("")}
      <div class="setting-row vertical">
        <b>每日最大 AI 回复次数</b>
        <input class="input" data-wecom-advanced-field="maxDailyReplies" value="${escapeHtml(state.wecomAdvancedSettings.maxDailyReplies)}" />
      </div>
      <div class="setting-row vertical">
        <b>静默时段</b>
        <input class="input" data-wecom-advanced-field="quietHours" value="${escapeHtml(state.wecomAdvancedSettings.quietHours)}" />
      </div>
      <div class="wecom-setting-group"><b>触发设置</b><span class="subtle">控制好友消息、触发模式和关键词。</span></div>
      ${triggerRows.map(([key, label]) => `<div class="setting-row"><b>${label}</b>${renderWechatSwitch(state.wecomAdvancedSettings[key], "advanced", key)}</div>`).join("")}
      <div class="setting-row vertical">
        <b>触发模式</b>
        <select class="select" data-wecom-advanced-field="triggerMode">
          ${renderSelectOptions(["关键词或@触发", "仅关键词触发", "仅@触发", "全部消息触发"], state.wecomAdvancedSettings.triggerMode)}
        </select>
      </div>
      <div class="setting-row vertical">
        <b>群聊触发关键词</b>
        <input class="input" data-wechat-keywords data-wecom-advanced-field="keywords" value="${escapeHtml(state.wecomAdvancedSettings.keywords)}" />
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
      ${cards.map(([title, desc, icon]) => `<div class="workbench-card" ${icon === "chat" ? `data-page="chat"` : `data-wecom-workbench-action="${title}"`}>
        <span>${icon}</span>
        <b>${title}</b>
        <p>${desc}</p>
      </div>`).join("")}
    </div>`;
}

function renderRobotConsole() {
  const logs = state.consoleStatus.length ? state.consoleStatus : ["等待提交远程控制指令"];
  const selectedAccount = state.wecomAccounts[0]?.id || "";
  const selectedTargetType = state.wecomConsoleTargetType || "群聊";
  const selectedContact = state.wecomConsoleContactId || state.wecomContacts?.[0]?.id || "";
  const selectedGroup = state.wecomConsoleGroupId || state.wecomGroups?.[0]?.id || "";
  const selectedTarget = selectedTargetType === "群聊"
    ? window.wecomService?.getGroup(selectedGroup)
    : state.wecomContacts?.find((contact) => contact.id === selectedContact);
  const targetValue = selectedTargetType === "群聊"
    ? selectedTarget ? `${selectedTarget.id} / ${selectedTarget.name}` : ""
    : selectedTarget ? `${selectedTarget.id} / ${selectedTarget.name}` : "";
  return `
    <div class="console-grid">
      <div class="card">
        <h3>机器人控制台</h3>
        <div class="form-row"><div class="label">选择托管账号</div><select class="select" id="consoleAccount" style="width:100%">${renderWechatAccountOptions(selectedAccount)}</select></div>
        <div class="grid-2">
          <div class="form-row"><div class="label">目标类型</div><select class="select" id="consoleTargetType" style="width:100%">${renderWechatOption("群聊", "群聊", selectedTargetType)}${renderWechatOption("联系人", "联系人", selectedTargetType)}</select></div>
          <div class="form-row"><div class="label">联系人</div><select class="select" id="consoleContact" style="width:100%">${(state.wecomContacts || []).map((contact) => renderWechatOption(contact.id, `${contact.name} / ${contact.type}`, selectedContact)).join("")}</select></div>
        </div>
        <div class="form-row"><div class="label">群聊</div><select class="select" id="consoleGroup" style="width:100%">${state.wecomGroups.map((group) => renderWechatOption(group.id, `${group.name} / ${group.members}人`, selectedGroup)).join("")}</select></div>
        <div class="form-row"><div class="label">目标 ID / 名称</div><input class="input" id="consoleTarget" style="width:100%" value="${escapeHtml(targetValue)}"></div>
        <div class="form-row"><div class="label">消息内容</div><textarea class="textarea" id="consoleMessage" style="width:100%">您好，Jelly AI 已接管企业微信客服，后续物流问题可直接在群里咨询。</textarea></div>
        <div class="action-grid">${["发送文本", "发送图片", "发送文件", "创建群聊", "拉人进群", "修改群名称", "发送群公告"].map((x) => `<button class="button" data-console-action="${x}" ${state.wecomLoading.console ? "disabled" : ""}>${state.wecomLoading.console ? "执行中" : x}</button>`).join("")}</div>
      </div>
      <div class="card">
        <h3>执行结果</h3>
        ${logs.map((l, i) => `<div class="log-line"><span class="dot" style="${i === 0 && logs.length === 1 ? "background:#cbd5e1" : ""}"></span><div>${escapeHtml(l)}<div class="subtle">${logs.length > 1 ? `taskId: ${escapeHtml(state.consoleTaskId || "TASK-PENDING")}` : ""}</div></div></div>`).join("")}
      </div>
    </div>`;
}

function renderGroupManagement() {
  const groups = window.wecomService?.listGroups() || state.wecomGroups;
  return `<div class="channel-section-head">
    <div><h1 class="page-title">群聊管理</h1><div class="subtle">管理托管账号可接收和可自动回复的企业微信群。</div></div>
    <button class="button primary" data-wecom-group-action="sync" ${state.wecomLoading.groups ? "disabled" : ""}>${state.wecomLoading.groups ? "同步中" : "同步群聊"}</button>
  </div>
  <div class="member-toolbar wechat-filter-bar">
    <input class="input" data-wechat-filter="wecomGroupQuery" placeholder="搜索群名称 / 群 ID / 最近消息" value="${escapeHtml(state.wecomGroupQuery)}" />
    <button class="button" data-wechat-reset="groups">重置</button>
  </div>
  <div class="table-card"><table><thead><tr><th>群名称</th><th>群 ID</th><th>成员数</th><th>AI 回复</th><th>消息接收</th><th>禁止改群名</th><th>禁止互加好友</th><th>操作</th></tr></thead><tbody>
    ${groups.length ? groups.map((group) => {
      const account = getWechatAccount(group.accountId);
      return `<tr>
      <td>👥 ${escapeHtml(group.name)}<br><span class="subtle">托管账号：${escapeHtml(account?.name || "-")} · 最近：${escapeHtml(group.lastMessage || "-")}</span></td>
      <td>${escapeHtml(group.id)}</td>
      <td>${group.members}</td>
      <td>${renderWechatSwitch(group.aiEnabled, "group-ai", group.id)}</td>
      <td>${renderWechatSwitch(group.messageEnabled, "group-message", group.id)}</td>
      <td>${renderWechatSwitch(group.lockName, "group-lock-name", group.id)}</td>
      <td>${renderWechatSwitch(group.blockAddFriend, "group-block-friend", group.id)}</td>
      <td><button class="button small" data-wecom-group-action="detail" data-wecom-id="${group.id}">群详情</button> <button class="button small" data-wechat-tab="console">发消息</button> <button class="button small" data-wechat-tab="rules">设置规则</button></td>
    </tr>`;
    }).join("") : `<tr><td colspan="8"><div class="empty">暂无匹配群聊</div></td></tr>`}
  </tbody></table></div>`;
}

function renderLogs() {
  const accountOptions = ["全部账号", ...state.wecomAccounts.map((account) => account.name)];
  const groupOptions = ["全部群聊", ...state.wecomGroups.map((group) => group.id)];
  const filteredLogs = window.wecomService?.listLogs() || state.wecomLogs;
  return `<div class="channel-section-head">
    <div><h1 class="page-title">对话记录查询</h1><div class="subtle">查询企业微信托管产生的私聊、群聊和 AI 回复记录。</div></div>
  </div>
  <div class="member-toolbar wechat-filter-bar">
    <input class="input" data-wechat-filter="wechatLogQuery" placeholder="搜索聊天内容" value="${escapeHtml(state.wechatLogQuery)}" />
    <input class="input" data-wechat-filter="wechatLogTarget" placeholder="搜索好友或群" value="${escapeHtml(state.wechatLogTarget)}" />
    <input class="input" type="date" data-wechat-filter="wechatLogDateStart" value="${escapeHtml(state.wechatLogDateStart)}" />
    <input class="input" type="date" data-wechat-filter="wechatLogDateEnd" value="${escapeHtml(state.wechatLogDateEnd)}" />
    <select class="select" data-wechat-filter="wechatLogType">${renderSelectOptions(["全部类型", "私聊", "群聊"], state.wechatLogType)}</select>
    <select class="select" data-wechat-filter="wechatLogAccount">${renderSelectOptions(accountOptions, state.wechatLogAccount)}</select>
    <select class="select" data-wechat-filter="wechatLogGroup">${groupOptions.map((groupId) => {
      const group = state.wecomGroups.find((item) => item.id === groupId);
      return renderWechatOption(groupId, group ? group.name : groupId, state.wechatLogGroup);
    }).join("")}</select>
    <button class="button" data-wechat-reset="logs">重置</button>
    <button class="button primary" data-wecom-log-action="search">搜索</button>
    <button class="button" data-wecom-log-action="export" ${state.wecomLoading.logs ? "disabled" : ""}>${state.wecomLoading.logs ? "导出中" : "导出"}</button>
  </div>
  ${state.wecomLastExport ? `<div class="wecom-inline-note">${escapeHtml(state.wecomLastExport)}</div>` : ""}
  <div class="table-card channel-table-gap"><table><thead><tr><th>时间</th><th>操作人</th><th>操作类型</th><th>所属托管账号</th><th>目标</th><th>聊天类型</th><th>聊天内容 / AI 回复</th><th>状态</th><th>详情</th></tr></thead><tbody>
    ${filteredLogs.length ? filteredLogs.map((log) => {
      const account = getWechatAccount(log.accountId);
      return `<tr><td>${escapeHtml(log.time)}</td><td>${escapeHtml(log.operator)}</td><td>${escapeHtml(log.operation)}</td><td>${escapeHtml(account?.name || "-")}</td><td>${escapeHtml(log.target)}</td><td>${escapeHtml(log.type)}</td><td><b>${escapeHtml(log.content)}</b><br><span class="subtle">${escapeHtml(log.reply)}</span></td><td>${renderWechatStatusTag(log.status)}</td><td>${escapeHtml(log.detail)}</td></tr>`;
    }).join("") : `<tr><td colspan="9"><div class="empty">暂无匹配记录</div></td></tr>`}
  </tbody></table></div>`;
}
