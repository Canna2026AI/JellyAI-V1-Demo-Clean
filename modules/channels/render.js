// Conversation channel module renderers.

function renderChannels() {
  const view = getChannelViewState();
  const filteredChannels = getFilteredChannels(view);
  const groupedChannels = getGroupedChannels(filteredChannels, view.category);

  return `
    <section class="channel-library-page">
      <div class="channel-library-head">
        <div>
          <h1 class="page-title">对话渠道</h1>
          <div class="subtle">管理您的对话渠道并发现新对话渠道以帮助您获得更多客户。</div>
        </div>
        <button class="button small" type="button" data-channel-refresh title="重新读取后端渠道数据" ${view.loading ? "disabled" : ""}>${view.loading ? "刷新中..." : "刷新"}</button>
      </div>
      <div class="channel-library-body">
        <div class="channel-category-strip">
          ${channelCategories.map((name) => `<button class="${view.category === name ? "active" : ""}" data-channel-category="${escapeHtml(name)}" title="筛选：${escapeHtml(name)}">${escapeHtml(name)}</button>`).join("")}
        </div>
        <input class="input channel-library-search" placeholder="搜索 对话渠道" value="${escapeHtml(view.query)}" data-channel-search title="按渠道名称、状态、分类、账号或接入字段搜索" />
        ${view.loading ? renderChannelLoading() : renderChannelGroups(groupedChannels, view)}
      </div>
      ${renderChannelModal()}
    </section>`;
}

function renderChannelGroups(groupedChannels, view) {
  if (!groupedChannels.length) {
    return `<div class="empty channel-empty">
      <div>
        <div class="empty-icon">▣</div>
        <div>暂无匹配渠道</div>
        <div class="subtle" style="margin-top:8px">请切换分类或调整搜索关键词</div>
        ${view.query ? `<button class="button small" style="margin-top:14px" data-channel-reset>清空搜索</button>` : ""}
      </div>
    </div>`;
  }

  return groupedChannels.map(([title, list]) => `
    <section class="channel-group-section">
      <h2>${escapeHtml(title)}</h2>
      <div class="channel-grid">
        ${list.map(renderChannelCard).join("")}
      </div>
    </section>`).join("");
}

function renderChannelLoading() {
  return `<div class="empty channel-empty channel-loading">
    <div>
      <div class="empty-icon">◌</div>
      <div>正在加载渠道</div>
      <div class="subtle" style="margin-top:8px">正在读取后端渠道配置</div>
    </div>
  </div>`;
}

function renderChannelCard(channel) {
  const actionLabel = getChannelActionLabel(channel);
  const actionAttr = channel.route === "wechat"
    ? `data-page="wechat" data-channel-route="${escapeHtml(channel.id)}"`
    : `data-channel-primary="${escapeHtml(channel.id)}"`;
  const accountLabel = channel.accountCount > 0 ? `已连接账号：${channel.accountCount}` : "尚未连接任何账号";
  return `<article class="channel-card" data-channel-detail="${escapeHtml(channel.id)}" tabindex="0" title="查看${escapeHtml(channel.name)}接入说明">
    <div class="channel-card-copy">
      <div class="channel-card-title-row">
        <h3>${escapeHtml(channel.name)}</h3>
        ${renderChannelStatus(channel.status)}
      </div>
      <p>${escapeHtml(channel.description)}</p>
      <div class="channel-card-meta">
        <span>${escapeHtml(accountLabel)}</span>
        <button class="button small" type="button" ${actionAttr} title="${escapeHtml(actionLabel)}">${escapeHtml(actionLabel)}</button>
      </div>
    </div>
    ${iconBox(channel.icon, `channel-icon ${getChannelIconClass(channel.category, channel.status)}`)}
  </article>`;
}

function renderChannelStatus(status) {
  const cls = status === "已接入" ? "connected" : status === "开发中" ? "developing" : "pending";
  return `<span class="channel-status ${cls}" title="${escapeHtml(getChannelStatusTitle(status))}">${escapeHtml(status)}</span>`;
}

function getChannelIconClass(category, status) {
  if (status === "已接入") return "connected";
  if (status === "开发中") return "dark";
  if (category === "企业微信") return "blue";
  if (category === "网站") return "purple";
  return "social";
}
