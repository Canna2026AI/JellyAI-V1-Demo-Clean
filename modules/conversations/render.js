// Aggregated conversation module renderers.

function renderChatWorkplace() {
  const visibleConversations = getFilteredConversations();
  const hasSelected = !!state.selectedConversation;
  const settingsMode = state.chatSettingsOpen;
  return `
    <section class="conversation-shell ${state.chatSidebarCollapsed ? "sidebar-collapsed" : ""} ${settingsMode ? "settings-inline" : ""}">
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
      <div class="conv-list ${settingsMode ? "chat-settings-panel" : ""}">
        ${settingsMode ? renderInlineChatSettingsPanel() : renderConversationListPanel(visibleConversations)}
      </div>
      <div class="conv-main ${hasSelected ? "" : "help-mode"}">
        ${state.chatLoading ? renderConversationLoading() : hasSelected ? renderConversationDetail() : renderConversationGuide()}
      </div>
      ${hasSelected ? renderConversationInfo() : ""}
    </section>`;
}

function renderConversationListPanel(visibleConversations) {
  return `
    <div class="conv-list-head">
      <div class="conv-list-title">
        <button class="chat-sidebar-toggle" type="button" data-chat-sidebar-toggle aria-label="${state.chatSidebarCollapsed ? "展开对话分类" : "收起对话分类"}" title="${state.chatSidebarCollapsed ? "展开对话分类" : "收起对话分类"}">
          <span>≡</span><i>${state.chatSidebarCollapsed ? "›" : "‹"}</i>
        </button>
        <b>${state.chatFilter}</b>
      </div>
      <div class="conv-list-tools">
        <button class="icon-button conv-sort-button ${state.chatSortOpen ? "active" : ""}" data-chat-sort-toggle title="对话排序">⇅</button>
        <button class="icon-button conv-search-button ${state.chatSearchOpen ? "active" : ""}" data-chat-search-toggle title="搜索对话" aria-label="搜索对话"><span class="search-glyph"></span></button>
        ${state.chatSortOpen ? `
          <div class="conv-sort-menu">
            <button class="${state.chatSort === "newest" ? "active" : ""}" data-chat-sort="newest"><span>新消息优先</span><b>✓</b></button>
            <button class="${state.chatSort === "unread" ? "active" : ""}" data-chat-sort="unread"><span>未读消息优先</span><b>✓</b></button>
            <button class="${state.chatSort === "status" ? "active" : ""}" data-chat-sort="status"><span>状态排序</span><b>✓</b></button>
          </div>
        ` : ""}
      </div>
    </div>
    ${state.chatSearchOpen ? renderConversationSearch() : ""}
    ${renderConversationRefineBar()}
    ${
      visibleConversations.length
        ? visibleConversations.map((item) => renderConversationItem(item)).join("")
        : `<div class="empty" style="min-height:240px">${state.chatSearchQuery.trim() ? "未找到匹配的对话" : `暂无${state.chatFilter}消息`}</div>`
    }
    ${renderChannelPromo()}
  `;
}

function renderInlineChatSettingsPanel() {
  const tabs = [["automation", "AI自动化"], ["hours", "工作时间"], ["quick", "快捷消息"], ["forward", "消息转发"]];
  return `
    <div class="chat-settings-inline-head">
      <b>聚合对话设置</b>
      <button class="icon-button small-icon" data-chat-settings title="返回对话">×</button>
    </div>
    <nav class="chat-settings-tabs inline">${tabs.map(([id, label]) => `<button class="${state.chatSettingsTab === id ? "active" : ""}" data-chat-settings-tab="${id}">${label}</button>`).join("")}</nav>
    <div class="chat-settings-content inline">${renderChatSettingsContent()}</div>
  `;
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
  if (state.chatSettingsTab === "forward") return `<section class="chat-config-card" data-forward-settings>
    <div class="chat-config-title"><div><b>消息转发</b><p>将人工客服及 AI 助手消息转发到外部渠道</p></div><span class="switch ${forwardSettings.enabled ? "on" : ""}" data-forward-enabled></span></div>
    <div class="settings-form-grid"><label>转发渠道<select class="select" data-forward-channel>${renderSelectOptions(["企业微信群机器人", "邮件", "Webhook"], forwardSettings.channel)}</select></label><label>消息范围<select class="select" data-forward-scope>${renderSelectOptions(["全部消息", "仅人工消息", "仅 AI 消息"], forwardSettings.scope)}</select></label></div>
    <label class="settings-full-field">Webhook 地址<input class="input" data-forward-webhook value="${escapeHtml(forwardSettings.webhook)}" placeholder="https://example.com/webhook"></label>
    <button class="button primary" data-forward-save>保存设置</button>
  </section>`;

  return `<div class="chat-automation-list">
    ${renderAutomationCard("followUp", "AI 自动跟进", "在用户长时间未回复时，由 AI 自动发送跟进消息", automationSettings.followUp.enabled, `
      <label>用户未回复时间（分钟）<input class="input" type="number" min="1" data-auto-field="followUp.minutes" value="${automationSettings.followUp.minutes}"></label>
      <label>选择指定对话分组<select class="select" data-auto-field="followUp.group">${renderSelectOptions(["全部对话", "人工对话", "AI对话", ...customConversationViews], automationSettings.followUp.group)}</select></label>
      <label class="settings-full-field">回复内容<textarea class="textarea" data-auto-field="followUp.content" placeholder="请输入自动跟进内容">${escapeHtml(automationSettings.followUp.content)}</textarea></label>`)}
    ${renderAutomationCard("closingReply", "结束时 AI 自动回复", "当人工结束对话后，由 AI 补充回复或进行满意度询问", automationSettings.closingReply.enabled, `
      <label>工作时间延时（分钟）<input class="input" type="number" min="0" data-auto-field="closingReply.workDelay" value="${automationSettings.closingReply.workDelay}"></label>
      <label>非工作时间延时（分钟）<input class="input" type="number" min="0" data-auto-field="closingReply.offHoursDelay" value="${automationSettings.closingReply.offHoursDelay}"></label>
      <label>超时会话标识<select class="select" data-auto-field="closingReply.timeoutFlag">${renderSelectOptions(["显示“超时”标识", "不显示"], automationSettings.closingReply.timeoutFlag)}</select></label>`)}
    ${renderAutomationCard("media", "AI 多媒体内容发送", "允许 AI 回复图片、视频、文件和音频素材", automationSettings.media.enabled, `
      <label><input type="checkbox" data-auto-check="media.image" ${automationSettings.media.image ? "checked" : ""}> 图片格式</label><label><input type="checkbox" data-auto-check="media.video" ${automationSettings.media.video ? "checked" : ""}> 视频格式</label><label><input type="checkbox" data-auto-check="media.file" ${automationSettings.media.file ? "checked" : ""}> 文件格式</label><label><input type="checkbox" data-auto-check="media.audio" ${automationSettings.media.audio ? "checked" : ""}> 音频格式</label>`)}
    ${renderAutomationCard("split", "AI 长回复内容拆分", "将较长回复拆分为多条消息，提升阅读体验", automationSettings.split.enabled, `
      <label>最大回复内容字数<input class="input" type="number" min="50" data-auto-field="split.maxChars" value="${automationSettings.split.maxChars}"></label><label>最大拆分回复条数<input class="input" type="number" min="1" data-auto-field="split.maxMessages" value="${automationSettings.split.maxMessages}"></label>`)}
    ${renderAutomationCard("summary", "自定义 AI 内容提取/总结", "配置对话总结提示词及触发条件", automationSettings.summary.enabled, `
      <label>对话分组选择<select class="select" data-auto-field="summary.group">${renderSelectOptions(["请选择", ...customConversationViews], automationSettings.summary.group)}</select></label>
      <label>至少包含对话条数<input class="input" type="number" min="1" data-auto-field="summary.minMessages" value="${automationSettings.summary.minMessages}"></label>
      <label class="settings-full-field">总结提示词<textarea class="textarea" data-auto-field="summary.prompt" placeholder="请输入 AI 总结对话时的提示词">${escapeHtml(automationSettings.summary.prompt)}</textarea></label>`)}
    <div class="chat-settings-tip"><b>小技巧</b><span>可通过 AI 流程或连接器，将对话总结内容同步到表格、数据库或消息渠道中。</span></div>
  </div>`;
}

function renderWorkHoursSettings() {
  const disabled = workHoursSettings.enabled ? "" : "disabled";
  const schedules = workHoursSettings.schedules.map((schedule, scheduleIndex) => `<div class="work-hours-schedule" data-work-schedule-row>
    <label class="work-hours-field-title">工作时间<span>*</span></label>
    <select class="work-hours-select" aria-label="选择工作日" data-work-day ${disabled}>
      ${["周一至周五", "每天", "自定义"].map((item) => `<option ${schedule.day === item ? "selected" : ""}>${item}</option>`).join("")}
    </select>
    <div class="work-hours-ranges">
      ${schedule.ranges.map((range, rangeIndex) => `<div class="work-hours-time-row" data-work-range-row>
        <label class="work-hours-time"><span>◷</span><input type="time" aria-label="开始时间" data-work-start value="${escapeHtml(range.start)}" ${disabled}></label>
        <span class="work-hours-to">至</span>
        <label class="work-hours-time"><span>◷</span><input type="time" aria-label="结束时间" data-work-end value="${escapeHtml(range.end)}" ${disabled}></label>
        ${rangeIndex === 0 ? `<button class="work-hours-circle-add" type="button" data-add-work-time="${scheduleIndex}" title="新增时间段" ${disabled}>＋</button>` : `<button class="work-hours-circle-remove" type="button" data-remove-work-time="${scheduleIndex}:${rangeIndex}" title="删除时间段">−</button>`}
      </div>`).join("")}
    </div>
    ${scheduleIndex > 0 ? `<button class="work-hours-delete-schedule" type="button" data-remove-work-schedule="${scheduleIndex}">删除此工作时间</button>` : ""}
  </div>`).join("");

  return `<section class="work-hours-page">
    <header class="work-hours-heading">
      <h2>工作时间设置</h2>
      <p>开启后，可设置人工服务工作时间，当访客在非工作时间咨询时，按照设置的处理方式对访客进行回复 <button class="link-button" type="button" data-demo-action="工作时间说明">了解更多</button></p>
    </header>

    <div class="work-hours-toggle-row">
      <span>是否开启工作时间</span>
      <button class="work-hours-switch ${workHoursSettings.enabled ? "on" : ""}" type="button" role="switch" aria-checked="${workHoursSettings.enabled}" data-work-hours-switch><i></i></button>
    </div>

    <div class="work-hours-schedules">${schedules}</div>
    <button class="work-hours-add-schedule" type="button" data-add-work-schedule ${disabled}>＋ 新增工作时间</button>

    <div class="work-hours-divider"></div>
    <section class="after-hours-section">
      <h3>非工作时间处理方式</h3>
      <p>如果不在上述工作时间如何处理</p>
      <select class="work-hours-select after-hours-select" aria-label="非工作时间处理方式" data-after-hours-action>
        ${["A: 回复文本内容", "B: 转接 AI 助手", "C: 留言并等待人工回复"].map((item) => `<option ${workHoursSettings.afterHoursAction === item ? "selected" : ""}>${item}</option>`).join("")}
      </select>
      <div class="after-hours-editor">
        <div class="after-hours-toolbar" aria-label="文本格式工具栏">
          <button type="button" data-after-hours-format="formatBlock" data-format-value="h3">H</button><button type="button" data-after-hours-format="bold"><b>B</b></button><button type="button" data-after-hours-format="italic"><i>I</i></button><button type="button" data-after-hours-format="strikeThrough">S</button><span></span><button type="button" data-after-hours-format="insertUnorderedList">列表</button><button type="button" data-after-hours-format="insertOrderedList">编号</button><span></span><button type="button" data-after-hours-format="outdent">外移</button><button type="button" data-after-hours-format="indent">缩进</button><span></span><button type="button" data-after-hours-insert="link">链接</button><button type="button" data-after-hours-insert="image">图片</button><button type="button" data-after-hours-insert="table">表格</button><button type="button" data-after-hours-insert="variable">变量</button><span></span><button type="button" class="muted" data-after-hours-format="undo">撤销</button><button type="button" class="muted" data-after-hours-format="redo">重做</button>
        </div>
        <div class="after-hours-content" contenteditable="true" data-after-hours-text>${escapeHtml(workHoursSettings.afterHoursText)}</div>
      </div>
    </section>

    <footer class="work-hours-footer">
      <button class="button" type="button" data-chat-settings-back>返回</button>
      <button class="button primary" type="button" data-work-hours-save>确认</button>
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
      <label class="quick-message-search"><span class="search-glyph"></span><input data-quick-message-search value="${escapeHtml(state.quickMessageSearch)}" placeholder="搜索"></label>
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

function renderAutomationCard(id, title, description, enabled, fields) {
  const settings = automationSettings[id];
  return `<section class="chat-config-card" data-automation-card="${id}">
    <div class="chat-config-title"><div><b>${title}</b><p>${description}　<a data-demo-action="${title}说明">了解更多</a></p></div><span class="switch ${enabled ? "on" : ""}" data-automation-enabled="${id}"></span></div>
    <div class="settings-form-grid">${fields}</div>
    <div class="automation-controls"><label>停止回复条件 <span class="switch ${settings.stopOnReply ? "on" : ""}" data-automation-stop="${id}"></span></label><label>对话记录条数 <input type="range" min="1" max="10" value="${settings.historyCount}" data-auto-field="${id}.historyCount"> <span>${settings.historyCount} 条</span></label></div>
    <button class="button primary" data-automation-save="${id}">保存设置</button>
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

function renderConversationRefineBar() {
  return `<div class="conv-refine-bar">
    <select data-chat-status-filter aria-label="筛选会话状态">${getConversationStatuses().map((item) => `<option ${item === (state.chatStatusFilter || "全部状态") ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}</select>
    <select data-chat-channel-filter aria-label="筛选来源渠道">${getConversationChannels().map((item) => `<option ${item === (state.chatChannelFilter || "全部渠道") ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}</select>
  </div>`;
}

function renderConversationItem(conversation) {
  const active = state.selectedConversation === conversation.id ? "active" : "";
  const preview = getConversationPreview(conversation);
  return `<div class="conv-item ${active}" data-conversation="${conversation.id}">
    ${iconBox(conversation.avatar, "channel-icon")}
    <div style="min-width:0; flex:1">
      <div style="display:flex; justify-content:space-between; gap:8px">
        <b style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis">${escapeHtml(conversation.name)}</b>
        <span class="subtle" style="white-space:nowrap">${conversation.unread ? `<i class="unread-dot"></i>` : ""}${getConversationTimeLabel(conversation)}</span>
      </div>
      <div class="subtle" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis"> ${escapeHtml(conversation.owner)} ${escapeHtml(preview)}</div>
      <div class="conv-item-tags"><span>${escapeHtml(conversation.channel)}</span><span>${conversation.type === "manual" ? "人工" : "AI"}</span></div>
    </div>
    <span class="conv-status ${conversation.statusColor}"></span>
  </div>`;
}

function renderChannelPromo() {
  return `<div class="join-card">
    <button class="join-close" data-hide-channel-promo>×</button>
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

function renderConversationLoading() {
  return `<div class="conv-loading"><span></span><b>正在加载会话</b></div>`;
}

function renderConversationDetail() {
  const conv = getSelectedConversation();
  if (!conv) return renderConversationGuide();
  const aiReplyActive = shouldShowAiReplyBanner(conv);
  return `
        <div class="conv-head">
          <div><b>${escapeHtml(conv.name)} › ${escapeHtml(conv.assignee)}</b><span class="conv-head-sub">${escapeHtml(conv.channel)} · ${conv.hosted ? "托管中" : "未托管"}</span></div>
          <button class="button primary small" data-conversation-status-button title="${conv.status === "已解决" ? "重新打开会话" : "标记为已解决"}">${escapeHtml(conv.status)}</button>
        </div>
        <div class="conv-messages">
          ${getConversationMessages(conv).length ? getConversationMessages(conv).map((m) => renderConvBubble(m)).join("") : `<div class="empty" style="min-height:220px">暂无消息记录</div>`}
        </div>
        ${aiReplyActive ? renderAiReplyBar(conv) : ""}
        <div class="conv-quick-strip">
          ${quickMessageData.replies.slice(0, 4).map((reply) => `<button type="button" data-quick-insert="${reply.id}">${escapeHtml(reply.title)}</button>`).join("")}
          <button type="button" data-modal="quickReply">＋ 新增</button>
        </div>
        <div class="conv-compose">
          <div style="display:flex; gap:16px; color:var(--blue); margin-bottom:8px"><b>回复</b><span>备注</span><span>📎发送素材</span></div>
          <textarea id="convInput" placeholder="请输入对话内容" style="width:100%; height:56px; border:0; outline:0; resize:none"></textarea>
          <div style="display:flex; justify-content:space-between"><span class="subtle">□ Enter 发送模拟人工消息</span><button class="button primary small" id="convSend">➤</button></div>
        </div>
  `;
}

function renderAiReplyBar(conv) {
  const last = getConversationLastMessage(conv);
  const preview = String(last?.text || "新消息").slice(0, 28);
  return `<div class="ai-reply-bar">
    <span class="ai-reply-dot"></span>
    <div><b>AI 正在替你回复</b><span>将根据客户最后一句“${escapeHtml(preview)}”自动继续接待</span></div>
    <button type="button" data-cancel-ai-reply="${conv.id}" title="取消 AI 代答">×</button>
  </div>`;
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
    全部对话: "选择左侧会话查看消息、客户信息和托管状态",
    人工对话: "选择左侧人工会话，继续处理客户消息",
    AI对话: "选择左侧 AI 对话，查看自动回复记录或转人工",
    指给我的: "选择左侧指派给你的会话进行跟进",
  }[state.chatFilter] || "该自定义视图下暂无选中的会话";
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
  if (title === "转人工对话设置") return `data-chat-settings-open="automation"`;
  if (title === "数据统计") return `data-page="analytics"`;
  if (title === "联系人列表") return `data-page="contacts"`;
  if (title === "联系人字段设置") return `data-page="contacts"`;
  return `data-demo-action="${title}"`;
}

function renderConversationInfo() {
  const conv = getSelectedConversation();
  if (!conv) return "";
  const possibleTags = Array.from(new Set(["高意向", "待报价", "海运询价", "演示预约", "售后问题", ...conv.tags]));
  return `<div class="conv-info">
    <h3>联系人</h3>
    <div class="mini-card"><b>${escapeHtml(conv.customer.name)}</b><br><span class="subtle">${escapeHtml(conv.customer.remark)}</span><br><br><button class="button primary" style="width:100%" data-modal="conversationMembers">查看/添加群成员</button></div>
    <div class="mini-card"><div class="mini-card-head">当前跟进人</div><span class="avatar">${escapeHtml(conv.assignee.slice(0, 1))}</span> ${escapeHtml(conv.assignee)} <button class="button ghost small" data-transfer-human>转人工</button></div>
    <div class="mini-card">
      <div class="mini-card-head">会话状态</div>
      <select class="conv-info-select" data-conversation-status>
        ${["待跟进", "解决中", "AI接待", "已解决"].map((item) => `<option ${conv.status === item ? "selected" : ""}>${item}</option>`).join("")}
      </select>
    </div>
    <div class="mini-card">
      <div class="mini-card-head">客户标签</div>
      <div class="conv-tag-list">
        ${possibleTags.map((tag) => `<button class="${conv.tags.includes(tag) ? "active" : ""}" type="button" data-customer-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join("")}
      </div>
      <div class="conv-tag-add"><input data-new-customer-tag placeholder="新增标签"><button class="button small" data-add-customer-tag>添加</button></div>
    </div>
    <div class="mini-card"><div class="mini-card-head">群操作</div><div class="label">托管状态 <span class="switch ${conv.hosted ? "on" : ""}" data-hosted-toggle></span></div><div class="label">收藏会话 <span class="switch ${conv.starred ? "on" : ""}" data-star-conversation></span></div></div>
    <div class="mini-card"><div class="mini-card-head">对话来源信息</div><table><tr><td>来源名称</td><td>${escapeHtml(conv.sourceName)}</td></tr><tr><td>会话ID</td><td>${escapeHtml(conv.sourceId)}</td></tr><tr><td>托管账户ID</td><td>${escapeHtml(conv.hostedAccountId)}</td></tr><tr><td>外部ID</td><td>${escapeHtml(conv.externalId)}</td></tr><tr><td>手机号</td><td>${escapeHtml(conv.customer.phone)}</td></tr></table></div>
  </div>`;
}

function renderConvBubble(m) {
  if (m.role === "system") return `<div class="message-system"><span>${escapeHtml(m.text)}</span></div>`;
  const align = m.role === "me" || m.role === "ai" ? "user" : "";
  const roleLabel = { me: "人工", ai: "AI", customer: "客户", other: "客户" }[m.role] || "客户";
  const icon = m.role === "customer" || m.role === "other" ? "客" : m.role === "me" ? "K" : "AI";
  return `<div class="message ${align}">
    ${iconBox(icon)}
    <div>
      <div class="message-role ${m.role}">${roleLabel}${m.createdAt ? `<span>${escapeHtml(m.createdAt)}</span>` : ""}</div>
      <div class="bubble">${escapeHtml(m.text)}${m.meta ? `<div class="bubble-meta">${escapeHtml(m.meta)}</div>` : ""}</div>
    </div>
  </div>`;
}
