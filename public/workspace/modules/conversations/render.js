// Aggregated conversation module renderers.

function renderChatWorkplace() {
  if (state.chatSettingsOpen) return renderChatSettings();
  const conversations = sortConversations(conversationMap[state.chatFilter] || []);
  const visibleConversations = conversations.filter(matchesConversationSearch);
  const hasSelected = !!state.selectedConversation;
  return `
    <section class="conversation-shell ${state.chatSidebarCollapsed ? "sidebar-collapsed" : ""}">
      <div class="conv-sidebar">
        ${renderAgentStatusBar()}
        ${conversationFilters
          .map((x) => `<div class="subnav-item conv-filter-item ${state.chatFilter === x ? "active" : ""}" data-chat-filter="${x}"><span>${getConversationFilterIcon(x)}</span><b>${x}</b></div>`)
          .join("")}
        <div class="custom-view-head">
          <span>自定义视图</span>
          <button class="icon-button small-icon" data-modal="customView" title="新建视图">＋</button>
        </div>
        ${customConversationViews
          .map((x) => `<div class="subnav-item custom-view-item ${state.chatFilter === x ? "active" : ""}" data-chat-filter="${escapeHtml(x)}"><span></span><b>${escapeHtml(x)}</b></div>`)
          .join("")}
      </div>
      <div class="conv-list">
        <div class="conv-list-head">
          <div class="conv-list-title">
            <button class="chat-sidebar-toggle" type="button" data-chat-sidebar-toggle aria-label="${state.chatSidebarCollapsed ? "展开对话分类" : "收起对话分类"}" title="${state.chatSidebarCollapsed ? "展开对话分类" : "收起对话分类"}">
              <span>≡</span><i>${state.chatSidebarCollapsed ? "›" : "‹"}</i>
            </button>
            <b>${state.chatFilter}</b>
          </div>
          <div class="conv-list-tools">
            <button class="icon-button conv-sort-button ${state.chatSortOpen ? "active" : ""}" data-chat-sort-toggle title="对话排序">⇅</button>
            <button class="icon-button ${state.chatSearchOpen ? "active" : ""}" data-chat-search-toggle title="搜索对话">⌕</button>
            ${state.chatSortOpen ? `
              <div class="conv-sort-menu">
                <button class="${state.chatSort === "newest" ? "active" : ""}" data-chat-sort="newest"><span>新消息优先</span><b>✓</b></button>
                <button class="${state.chatSort === "unread" ? "active" : ""}" data-chat-sort="unread"><span>未读消息优先</span><b>✓</b></button>
              </div>
            ` : ""}
          </div>
        </div>
        ${state.chatSearchOpen ? renderConversationSearch() : ""}
        ${
          visibleConversations.length
            ? visibleConversations.map((item) => renderConversationItem(item)).join("")
            : `<div class="empty" style="min-height:240px">${state.chatSearchQuery.trim() ? "未找到匹配的对话" : `暂无${state.chatFilter}消息`}</div>`
        }
        ${renderChannelPromo()}
      </div>
      <div class="conv-main ${hasSelected ? "" : "help-mode"}">
        ${hasSelected ? renderConversationDetail() : renderConversationGuide()}
      </div>
      ${hasSelected ? renderConversationInfo() : ""}
    </section>`;
}

function renderChatSettings() {
  const tabs = [["automation", "AI自动化"], ["hours", "工作时间"], ["quick", "快捷消息"], ["forward", "消息转发"]];
  return `<section class="conversation-shell chat-settings-shell">
    <div class="conv-sidebar">
      ${renderAgentStatusBar(true)}
      ${conversationFilters.map((x) => `<div class="subnav-item conv-filter-item" data-chat-filter="${x}"><span>${getConversationFilterIcon(x)}</span><b>${x}</b></div>`).join("")}
      <div class="custom-view-head"><span>自定义视图</span><button class="icon-button small-icon" data-modal="customView">＋</button></div>
      ${customConversationViews.map((x) => `<div class="subnav-item custom-view-item" data-chat-filter="${escapeHtml(x)}"><span></span><b>${escapeHtml(x)}</b></div>`).join("")}
    </div>
    <main class="chat-settings-main">
      <nav class="chat-settings-tabs">${tabs.map(([id, label]) => `<button class="${state.chatSettingsTab === id ? "active" : ""}" data-chat-settings-tab="${id}">${label}</button>`).join("")}</nav>
      <div class="chat-settings-content">${renderChatSettingsContent()}</div>
    </main>
  </section>`;
}

function getConversationFilterIcon(name) {
  return {
    全部对话: "☵",
    人工对话: "◔",
    AI对话: "▣",
    指给我的: "♙",
  }[name] || "";
}

function renderAgentStatusBar(activeSettings = false) {
  return `<div class="agent-status">
    <button class="agent-presence" type="button" data-agent-status-toggle>
      <span class="avatar">K</span>
      <i class="${state.agentStatus === "在线" ? "online" : "offline"}"></i>
      <b>${state.agentStatus}</b>
      <em>${state.agentStatusOpen ? "▴" : "▾"}</em>
    </button>
    ${state.agentStatusOpen ? `<div class="agent-status-menu">
      <button class="${state.agentStatus === "在线" ? "active" : ""}" type="button" data-agent-status="在线"><span class="status-dot online"></span>在线 <b>✓</b></button>
      <button class="${state.agentStatus === "离线" ? "active" : ""}" type="button" data-agent-status="离线"><span class="status-dot offline"></span>离线 <b>✓</b></button>
    </div>` : ""}
    <button class="icon-button ${activeSettings ? "active" : ""}" style="margin-left:auto" data-chat-settings title="${activeSettings ? "返回对话" : "聚合对话设置"}">⚙</button>
  </div>`;
}

function renderChatSettingsContent() {
  if (state.chatSettingsTab === "hours") return renderWorkHoursSettings();

  if (state.chatSettingsTab === "quick") return renderQuickMessageSettings();

  if (state.chatSettingsTab === "forward") return `<section class="chat-config-card">
    <div class="chat-config-title"><div><b>消息转发</b><p>将人工客服及 AI 助手消息转发到外部渠道</p></div><span class="switch" data-switch></span></div>
    <div class="settings-form-grid"><label>转发渠道<select class="select"><option>企业微信群机器人</option><option>邮件</option><option>Webhook</option></select></label><label>消息范围<select class="select"><option>全部消息</option><option>仅人工消息</option><option>仅 AI 消息</option></select></label></div>
    <label class="settings-full-field">Webhook 地址<input class="input" placeholder="https://example.com/webhook"></label>
    <button class="button primary" data-demo-action="消息转发设置已保存">保存设置</button>
  </section>`;

  return `<div class="chat-automation-list">
    ${renderAutomationCard("AI 自动跟进", "在用户长时间未回复时，由 AI 自动发送跟进消息", true, `
      <label>用户未回复时间（分钟）<input class="input" type="number" value="10"></label>
      <label>选择指定对话分组<select class="select"><option>全部对话</option><option>人工对话</option><option>AI对话</option></select></label>
      <label class="settings-full-field">回复内容<textarea class="textarea" placeholder="请输入自动跟进内容"></textarea></label>`)}
    ${renderAutomationCard("结束时 AI 自动回复", "当人工结束对话后，由 AI 补充回复或进行满意度询问", false, `
      <label>工作时间延时（分钟）<input class="input" type="number" value="10"></label>
      <label>非工作时间延时（分钟）<input class="input" type="number" value="0"></label>
      <label>超时会话标识<select class="select"><option>显示“超时”标识</option><option>不显示</option></select></label>`)}
    ${renderAutomationCard("AI 多媒体内容发送", "允许 AI 回复图片、视频、文件和音频素材", true, `
      <label><input type="checkbox" checked> 图片格式</label><label><input type="checkbox" checked> 视频格式</label><label><input type="checkbox" checked> 文件格式</label><label><input type="checkbox" checked> 音频格式</label>`)}
    ${renderAutomationCard("AI 长回复内容拆分", "将较长回复拆分为多条消息，提升阅读体验", false, `
      <label>最大回复内容字数<input class="input" type="number" value="300"></label><label>最大拆分回复条数<input class="input" type="number" value="3"></label>`)}
    ${renderAutomationCard("自定义 AI 内容提取/总结", "配置对话总结提示词及触发条件", false, `
      <label>对话分组选择<select class="select"><option>请选择</option>${customConversationViews.map((x) => `<option>${escapeHtml(x)}</option>`).join("")}</select></label>
      <label>至少包含对话条数<input class="input" type="number" value="4"></label>
      <label class="settings-full-field">总结提示词<textarea class="textarea" placeholder="请输入 AI 总结对话时的提示词"></textarea></label>`)}
    <div class="chat-settings-tip"><b>小技巧</b><span>可通过 AI 流程或连接器，将对话总结内容同步到表格、数据库或消息渠道中。</span></div>
  </div>`;
}

function renderWorkHoursSettings() {
  const disabled = state.workHoursEnabled ? "" : "disabled";
  const rangeRows = Array.from({ length: state.workTimeRangeCount }, (_, index) => `<div class="work-hours-time-row">
    <label class="work-hours-time"><span>◷</span><input type="time" aria-label="开始时间" ${disabled}></label>
    <span class="work-hours-to">至</span>
    <label class="work-hours-time"><span>◷</span><input type="time" aria-label="结束时间" ${disabled}></label>
    ${index === 0 ? `<button class="work-hours-circle-add" type="button" data-add-work-time title="新增时间段" ${disabled}>＋</button>` : `<button class="work-hours-circle-remove" type="button" data-remove-work-time title="删除时间段">−</button>`}
  </div>`).join("");
  const schedules = Array.from({ length: state.workScheduleCount }, (_, index) => `<div class="work-hours-schedule">
    <label class="work-hours-field-title">工作时间<span>*</span></label>
    <select class="work-hours-select" aria-label="选择工作日" ${disabled}>
      <option value="">请选择工作日</option>
      <option>周一至周五</option><option>每天</option><option>自定义</option>
    </select>
    <div class="work-hours-ranges">${rangeRows}</div>
    ${index > 0 ? `<button class="work-hours-delete-schedule" type="button" data-remove-work-schedule>删除此工作时间</button>` : ""}
  </div>`).join("");

  return `<section class="work-hours-page">
    <header class="work-hours-heading">
      <h2>工作时间设置</h2>
      <p>开启后，可设置人工服务工作时间，当访客在非工作时间咨询时，按照设置的处理方式对访客进行回复 <button class="link-button" type="button">了解更多</button></p>
    </header>

    <div class="work-hours-toggle-row">
      <span>是否开启工作时间</span>
      <button class="work-hours-switch ${state.workHoursEnabled ? "on" : ""}" type="button" role="switch" aria-checked="${state.workHoursEnabled}" data-work-hours-switch><i></i></button>
    </div>

    <div class="work-hours-schedules">${schedules}</div>
    <button class="work-hours-add-schedule" type="button" data-add-work-schedule ${disabled}>＋ 新增工作时间</button>

    <div class="work-hours-divider"></div>
    <section class="after-hours-section">
      <h3>非工作时间处理方式</h3>
      <p>如果不在上述工作时间如何处理</p>
      <select class="work-hours-select after-hours-select" aria-label="非工作时间处理方式">
        <option>A: 回复文本内容</option>
        <option>B: 转接 AI 助手</option>
        <option>C: 留言并等待人工回复</option>
      </select>
      <div class="after-hours-editor">
        <div class="after-hours-toolbar" aria-label="文本格式工具栏">
          <button>H</button><button><b>B</b></button><button><i>I</i></button><button>S̶</button><span></span><button>☷</button><button>1₂</button><span></span><button>≡</button><button>☰</button><span></span><button>↗</button><button>▣</button><button>▦⌄</button><button>▧⌄</button><span></span><button class="muted">↶</button><button class="muted">↷</button>
        </div>
        <div class="after-hours-content" contenteditable="true">抱歉，现在为非工作时间，请您在我们的工作时间再次联系，谢谢</div>
      </div>
    </section>

    <footer class="work-hours-footer">
      <button class="button" type="button" data-chat-settings-back>返回</button>
      <button class="button primary" type="button" data-demo-action="工作时间设置已保存">确认</button>
    </footer>
  </section>`;
}

function renderQuickMessageSettings() {
  const query = state.quickMessageSearch.trim().toLowerCase();
  const visibleGroups = quickMessageData.groups.filter((group) => {
    const replies = quickMessageData.replies.filter((reply) => reply.groupId === group.id);
    return !query || group.name.toLowerCase().includes(query) || replies.some((reply) => `${reply.title} ${reply.content}`.toLowerCase().includes(query));
  });
  const ungroupedReplies = quickMessageData.replies.filter((reply) => !reply.groupId && (!query || `${reply.title} ${reply.content}`.toLowerCase().includes(query)));
  const hasData = quickMessageData.groups.length || quickMessageData.replies.length;
  return `<section class="quick-message-page">
    <div class="quick-message-heading"><b>快捷信息管理</b><p>创建一个新的快捷信息，可以在对话中使用他来进行快捷回复</p></div>
    <div class="quick-message-toolbar">
      <button class="button primary" data-modal="quickReply">＋ 新增快捷回复</button>
      <button class="button" data-modal="quickGroup">＋ 新增分组</button>
      <label class="quick-message-search"><span>⌕</span><input data-quick-message-search value="${escapeHtml(state.quickMessageSearch)}" placeholder="搜索"></label>
    </div>
    ${!hasData ? `<div class="quick-message-empty"><div class="quick-empty-art">▤</div><span>暂无分组</span></div>` : `
      <div class="quick-group-list">
        ${visibleGroups.map((group) => renderQuickMessageGroup(group, query)).join("")}
        ${ungroupedReplies.length ? `<article class="quick-group-card"><header><b>未分组</b><span>${ungroupedReplies.length} 条快捷回复</span></header>${ungroupedReplies.map(renderQuickReplyRow).join("")}</article>` : ""}
        ${!visibleGroups.length && !ungroupedReplies.length ? `<div class="quick-message-empty compact"><span>未找到匹配内容</span></div>` : ""}
      </div>`}
  </section>`;
}

function renderQuickMessageGroup(group, query) {
  const replies = quickMessageData.replies.filter((reply) => reply.groupId === group.id && (!query || `${reply.title} ${reply.content}`.toLowerCase().includes(query) || group.name.toLowerCase().includes(query)));
  return `<article class="quick-group-card">
    <header><b>${escapeHtml(group.name)}</b><span>${replies.length} 条快捷回复</span></header>
    ${replies.length ? replies.map(renderQuickReplyRow).join("") : `<div class="quick-group-empty">该分组暂无快捷回复</div>`}
  </article>`;
}

function renderQuickReplyRow(reply) {
  return `<div class="quick-message-row"><b>${escapeHtml(reply.title)}</b><span>${escapeHtml(reply.content)}</span><button class="icon-button" data-quick-reply-delete="${reply.id}" title="删除">×</button></div>`;
}

function renderAutomationCard(title, description, enabled, fields) {
  return `<section class="chat-config-card">
    <div class="chat-config-title"><div><b>${title}</b><p>${description}　<a>了解更多</a></p></div><span class="switch ${enabled ? "on" : ""}" data-switch></span></div>
    <div class="settings-form-grid">${fields}</div>
    <div class="automation-controls"><label>停止回复条件 <span class="switch" data-switch></span></label><label>对话记录条数 <input type="range" min="1" max="10" value="2"> 2 条</label></div>
    <button class="button primary" data-demo-action="${title}设置已保存">保存设置</button>
  </section>`;
}

function renderConversationSearch() {
  const modeLabels = { fuzzy: "模糊匹配", exact: "精确匹配", phone: "手机号" };
  return `<div class="conv-search-panel">
    <div class="conv-search-mode">
      <button data-chat-search-mode-toggle>${modeLabels[state.chatSearchMode]} <span>⌄</span></button>
      ${state.chatSearchModeOpen ? `<div class="conv-search-mode-menu">
        ${Object.entries(modeLabels).map(([value, label]) => `<button class="${state.chatSearchMode === value ? "active" : ""}" data-chat-search-mode="${value}"><span>${label}</span><b>✓</b></button>`).join("")}
      </div>` : ""}
    </div>
    <input data-chat-search-input value="${escapeHtml(state.chatSearchQuery)}" placeholder="搜索..." autocomplete="off">
    <button class="conv-search-close" data-chat-search-close title="关闭搜索">×</button>
  </div>`;
}

function matchesConversationSearch(item) {
  const query = state.chatSearchQuery.trim().toLowerCase();
  if (!query) return true;
  const [, name, owner, , last, , , phone = ""] = item;
  if (state.chatSearchMode === "phone") {
    const digits = query.replace(/\D/g, "");
    return Boolean(digits) && String(phone).includes(digits);
  }
  const fields = [name, owner, last].map((value) => String(value).toLowerCase());
  return state.chatSearchMode === "exact" ? fields.some((value) => value === query) : fields.some((value) => value.includes(query));
}

function getConversationAgeMinutes(time) {
  const hours = Number(time.match(/(\d+)小时/)?.[1] || 0);
  const minutes = Number(time.match(/(\d+)分钟/)?.[1] || 0);
  return hours * 60 + minutes;
}

function sortConversations(conversations) {
  return [...conversations].sort((a, b) => {
    if (state.chatSort === "unread" && Boolean(a[6]) !== Boolean(b[6])) return a[6] ? -1 : 1;
    return getConversationAgeMinutes(a[3]) - getConversationAgeMinutes(b[3]);
  });
}

function renderConversationItem([id, name, owner, time, last, status, unread]) {
  const active = state.selectedConversation === id ? "active" : "";
  return `<div class="conv-item ${active}" data-conversation="${id}">
    ${iconBox(id === "group" ? "群" : id === "demo" ? "演" : "K", "channel-icon")}
    <div style="min-width:0; flex:1">
      <div style="display:flex; justify-content:space-between; gap:8px">
        <b style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${name}</b>
        <span class="subtle" style="white-space:nowrap">${unread ? `<i class="unread-dot"></i>` : ""}${time}</span>
      </div>
      <div class="subtle" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis"> ${owner} ${last}</div>
    </div>
    <span class="conv-status ${status}"></span>
  </div>`;
}

function renderChannelPromo() {
  return `<div class="join-card">
    <button class="join-close">×</button>
    <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px">
      <span class="mini-platform green">微</span>
      <span class="mini-platform red">小</span>
      <span class="mini-platform red">抖</span>
      <span class="tag blue">+5</span>
    </div>
    <b>接入更多社交渠道</b>
    <div class="subtle" style="margin:8px 0 12px">集中管理微信、抖音、小红书等所有对话，提升服务效率。</div>
    <button class="button primary" style="width:100%" data-page="channels">立即接入</button>
  </div>`;
}

function renderConversationDetail() {
  const conv = getSelectedConversation();
  const title = conv?.[1] || "欧诚国际物流&集简云对接群";
  const owner = conv?.[2] || "Kelvin";
  return `
        <div class="conv-head"><b>${title} › ${owner}</b><button class="button primary small">解决中</button></div>
        <div class="conv-messages">
          ${state.convMessages.map((m) => renderConvBubble(m)).join("")}
        </div>
        <div class="conv-compose">
          <div style="display:flex; gap:16px; color:var(--blue); margin-bottom:8px"><b>回复</b><span>备注</span><span>📎发送素材</span></div>
          <textarea id="convInput" placeholder="请输入对话内容" style="width:100%; height:56px; border:0; outline:0; resize:none"></textarea>
          <div style="display:flex; justify-content:space-between"><span class="subtle">□</span><button class="button primary small" id="convSend">➤</button></div>
        </div>
  `;
}

function getSelectedConversation() {
  const all = Object.values(conversationMap).flat();
  return all.find((item) => item[0] === state.selectedConversation);
}

function renderConversationGuide() {
  const cards = [
    ["聚合对话介绍", "如何使用聚合对话功能", "✣", "#6d8cff"],
    ["接入对话渠道", "接入对话渠道", "▣", "#5fd2bd"],
    ["坐席管理", "管理与分配人工客服权限", "☊", "#f45b5b"],
    ["工作时间设置", "设置人工服务的工作时间和非工作时间处理方式", "◷", "#ff944d"],
    ["快捷消息", "设置常用的回复消息/图片，一键调用", "ϟ", "#58d0bd"],
    ["消息转发", "将人工客服以及AI助手转发达不同渠道中", "▱", "#ffc947"],
    ["转人工对话设置", "设置人工对话时的处理方式", "⌘", "#5c6df2"],
    ["数据统计", "查看各项对话数据统计指标", "⌁", "#437cf7"],
    ["联系人列表", "您可以在联系人列表中对联系人进行增删改查操作", "♙", "#5ec7f3"],
    ["联系人字段设置", "对联系人字段属性进行自定义配置", "T", "#7a5cff"],
  ];
  const titleHint = {
    全部对话: "您还没有任何人工服务对话消息，了解如何设置人工服务",
    人工对话: "您还没有任何人工服务对话消息，了解如何设置人工服务",
    AI对话: "您还没有选择 AI 对话，选择左侧会话可查看 AI 自动回复记录",
    指给我的: "您还没有待处理的指派对话，了解如何设置人工服务",
  }[state.chatFilter] || "选择左侧会话查看消息，或先了解聚合对话配置";
  return `<div class="chat-guide">
    <div class="guide-logo"><span class="brand-mark"></span><b>Jelly AI</b></div>
    <div class="subtle">${titleHint} <span style="color:var(--blue)">了解更多</span></div>
    <div class="guide-card-grid">
      ${cards
        .map(
          ([title, desc, ico, color]) => `<button class="guide-card" type="button" ${getGuideCardAction(title)}>
            <span class="guide-icon" style="background:${color}">${ico}</span>
            <div><b>${title}</b><div class="subtle">${desc}</div></div>
          </button>`
        )
        .join("")}
    </div>
  </div>`;
}

function getGuideCardAction(title) {
  if (title === "聚合对话介绍") return `data-open-conversation-intro`;
  if (title === "接入对话渠道") return `data-page="channels"`;
  if (title === "坐席管理") return `data-page="settings"`;
  if (title === "工作时间设置") return `data-chat-settings-open="hours"`;
  if (title === "快捷消息") return `data-chat-settings-open="quick"`;
  if (title === "消息转发") return `data-chat-settings-open="forward"`;
  if (title === "数据统计") return `data-page="analytics"`;
  if (title === "联系人列表") return `data-page="contacts"`;
  return `data-demo-action="${title}"`;
}

function renderConversationInfo() {
  return `<div class="conv-info">
    <h3>联系人</h3>
    <div class="mini-card"><b>欧诚国际物流&集简云对接群</b><br><span class="subtle">添加群备注</span><br><br><button class="button primary" style="width:100%">查看/添加群成员</button></div>
    <div class="mini-card"><div class="mini-card-head">当前跟进人</div><span class="avatar">K</span> Kelvin <button class="button ghost small">重新分配</button></div>
    <div class="mini-card"><div class="mini-card-head">群操作</div><div class="label">禁止修改群名称 <span class="switch" data-switch></span></div><div class="label">禁止群成员互加好友 <span class="switch" data-switch></span></div></div>
    <div class="mini-card"><div class="mini-card-head">对话来源信息</div><table><tr><td>来源名称</td><td>企业微信代运营</td></tr><tr><td>会话ID</td><td>2aea37ed...</td></tr><tr><td>托管账户ID</td><td>1688855417782936</td></tr><tr><td>群ID</td><td>R:10775840332412006</td></tr></table></div>
  </div>`;
}

function renderConvBubble(m) {
  if (m.role === "system") return `<div style="text-align:center; color:#8a96a8; margin:16px">${m.text}</div>`;
  const align = m.role === "me" || m.role === "ai" ? "user" : "";
  return `<div class="message ${align}">${iconBox(m.role === "other" ? "客" : m.role === "me" ? "K" : "AI")}<div class="bubble">${m.text}${m.meta ? `<div class="bubble-meta">${m.meta}</div>` : ""}</div></div>`;
}
