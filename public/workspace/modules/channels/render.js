// Conversation channel module renderers.

function renderChannels() {
  const channelQuery = state.channelSearchQuery.trim().toLowerCase();
  const filteredChannels = channels.filter(([name, desc, status, , , , category]) => {
    if (state.channelCategory === "全部") return true;
    if (state.channelCategory === "已绑定") return status === "已接入";
    return category === state.channelCategory || channelCategoryMap[name] === state.channelCategory;
  }).filter(([name, desc, status, count, , , category]) => {
    if (!channelQuery) return true;
    return `${name} ${desc} ${status} ${count} ${category}`.toLowerCase().includes(channelQuery);
  });
  const groupedChannels = [
    ["已绑定", filteredChannels.filter((item) => item[2] === "已接入")],
    ["社交媒体", filteredChannels.filter((item) => item[6] === "社交媒体" && item[2] !== "已接入")],
    ["电商平台", filteredChannels.filter((item) => item[6] === "电商平台")],
    ["办公OA", filteredChannels.filter((item) => item[6] === "办公OA")],
    ["网站/小程序", filteredChannels.filter((item) => item[6] === "网站/小程序")],
    ["海外平台", filteredChannels.filter((item) => item[6] === "海外平台")],
  ].filter(([, list]) => list.length);
  return `
    <section class="channel-library-page">
      <div class="channel-library-head">
        <div>
          <h1 class="page-title">对话渠道</h1>
          <div class="subtle">管理您的对话渠道并发现新对话渠道以帮助您获得更多客户。</div>
        </div>
      </div>
      <div class="channel-library-body">
        <div class="channel-category-strip">
          ${channelCategories.map((name) => `<button class="${state.channelCategory === name ? "active" : ""}" data-channel-category="${name}">${name}</button>`).join("")}
        </div>
        <input class="input channel-library-search" placeholder="搜索 对话渠道" value="${escapeHtml(state.channelSearchQuery)}" data-channel-search />
        ${groupedChannels.length ? groupedChannels.map(([title, list]) => `
          <section class="channel-group-section">
            <h2>${title}</h2>
            <div class="channel-grid">
              ${list.map(renderChannelCard).join("")}
            </div>
          </section>`).join("") : `<div class="empty channel-empty">
          <div>
            <div class="empty-icon">▣</div>
            <div>暂无匹配渠道</div>
            <div class="subtle" style="margin-top:8px">请切换分类或调整搜索关键词</div>
            ${state.channelSearchQuery ? `<button class="button small" style="margin-top:14px" data-channel-reset>清空搜索</button>` : ""}
          </div>
        </div>`}
        </div>
    </section>`;
}

function renderChannelCard([name, desc, status, count, action, ico, category, key]) {
  const isManaged = key === "wechat" || key === "wecom-service";
  const actionAttr = isManaged ? `data-page="wechat"` : `data-channel-action="${escapeHtml(name)}"`;
  return `<article class="channel-card">
    <div class="channel-card-copy">
      <h3>${name}</h3>
      <p>${desc}</p>
      <div class="channel-card-meta">
        <span>${status === "已接入" ? `已连接账号：${count}` : "尚未连接任何账号"}</span>
        <button class="button small" type="button" ${actionAttr}>${action}</button>
      </div>
    </div>
    ${iconBox(ico, `channel-icon ${getChannelIconClass(category, status)}`)}
  </article>`;
}

function getChannelIconClass(category, status) {
  if (status === "已接入") return "connected";
  if (category === "电商平台") return "orange";
  if (category === "办公OA") return "blue";
  if (category === "网站/小程序") return "purple";
  if (category === "海外平台") return "dark";
  return "social";
}
