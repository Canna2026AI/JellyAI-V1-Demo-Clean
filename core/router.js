// Application shell, router, topbar, sidebar, and home renderers.

const app = document.getElementById("app");

function setState(patch) {
  Object.assign(state, patch);
  render();
}

function render() {
  if (state.page === "profile") {
    app.innerHTML = `
      ${renderProfilePage()}
      ${renderModal()}
      ${renderDrawer()}
    `;
    bindEvents();
    bindCurrentPageEvents();
    bindActiveModalEvents();
    return;
  }
  const compactSidebar = state.sidebarCollapsed || ["chat", "channels"].includes(state.page);
  app.innerHTML = `
    <div class="app-shell ${compactSidebar ? "nav-collapsed" : ""} ${state.page === "chat" ? "chat-app-shell" : ""}">
      ${renderSidebar(compactSidebar)}
      <main class="main">
        ${renderTopbar()}
        ${renderPage()}
      </main>
    </div>
    ${renderModal()}
    ${renderDrawer()}
  `;
  bindEvents();
  bindCurrentPageEvents();
  bindActiveModalEvents();
  keepActiveSidebarItemVisible();
}

function keepActiveSidebarItemVisible() {
  const nav = document.querySelector(".nav");
  const active = document.querySelector(".marketing-nav-child.active") || document.querySelector(".nav-item.active");
  if (!nav || !active) return;
  const navTop = nav.getBoundingClientRect().top;
  const navBottom = document.querySelector(".nav-bottom")?.getBoundingClientRect().top || nav.getBoundingClientRect().bottom;
  const activeRect = active.getBoundingClientRect();
  if (activeRect.bottom > navBottom - 10) nav.scrollTop += activeRect.bottom - navBottom + 14;
  if (activeRect.top < navTop + 10) nav.scrollTop -= navTop + 10 - activeRect.top;
}

function renderSidebar(forceCollapsed = false) {
  return `
    <aside class="sidebar ${forceCollapsed ? "collapsed" : ""}">
      <div class="brand"><span class="brand-mark"></span><span>Jelly AI</span></div>
      <div class="nav">
        ${menu
          .map(
            ([id, ico, label]) => {
              const active = state.page === id || (id === "ai" && ["knowledgeCreate", "skillEdit"].includes(state.page));
              if (id === "marketing") {
                return `
          <button class="nav-item marketing-main ${active ? "active" : ""}" type="button" data-marketing-toggle title="${label}">
            <span class="nav-icon">${ico}</span><span>${label}</span><span class="nav-caret">${state.marketingNavOpen ? "⌃" : "⌄"}</span>
          </button>
          ${
            state.marketingNavOpen
              ? `<div class="marketing-nav-children">
                ${marketingSubs
                  .map(
                    ([subId, subLabel]) => `<button class="marketing-nav-child ${state.page === "marketing" && state.marketingSub === subId ? "active" : ""}" type="button" data-marketing-sub="${subId}">${subLabel}</button>`
                  )
                  .join("")}
              </div>`
              : ""
          }`;
              }
              return `
          <button class="nav-item ${active ? "active" : ""}" type="button" data-page="${id}" title="${label}">
            <span class="nav-icon">${ico}</span><span>${label}</span>
          </button>`;
            }
          )
          .join("")}
      </div>
      <button class="nav-bottom" type="button" data-sidebar-collapse title="${state.sidebarCollapsed ? "展开导航" : "收起导航"}"><span class="nav-icon">☰</span><span>${state.sidebarCollapsed ? "展开导航" : "收起导航"}</span></button>
    </aside>
  `;
}

function renderTopbar() {
  return `
    <header class="topbar">
      <button class="top-pill top-pill-button" type="button" data-modal="recharge">￥ 余额：￥4.86 <span style="opacity:.45">|</span> 充值</button>
      <div class="topbar-menu-wrap">
        <button class="top-pill top-pill-button package-pill ${state.topPopover === "package" ? "active" : ""}" type="button" data-top-popover="package">我的套餐 <span>${state.topPopover === "package" ? "▴" : "▾"}</span></button>
        ${state.topPopover === "package" ? renderPackagePopover() : ""}
      </div>
      <button class="top-help" type="button" data-drawer="conversationIntro">？ 帮助中心</button>
      <div class="topbar-menu-wrap">
        <button class="avatar top-avatar" type="button" data-top-popover="profile">K</button>
        ${state.topPopover === "profile" ? renderProfilePopover() : ""}
      </div>
    </header>
  `;
}

function renderPackagePopover() {
  return `<div class="top-popover package-popover">
    <div class="package-card">
      <span>营销基础版</span>
      <button type="button" data-demo-action="套餐续费">续费</button>
    </div>
    <button class="button primary package-upgrade" type="button" data-demo-action="升级版本">升级版本</button>
  </div>`;
}

function renderProfilePopover() {
  return `<div class="top-popover profile-popover">
    <div class="profile-popover-user">
      <span class="avatar large">K</span>
      <div><b>Kelvin</b><p>欧诚国际物流</p></div>
    </div>
    <button class="profile-popover-row" type="button" data-page="profile">个人信息 <span>›</span></button>
    <button class="profile-popover-row" type="button" data-demo-action="退出登录">退出登录</button>
  </div>`;
}

function renderProfilePage() {
  return `<section class="profile-page">
    <header class="profile-topbar">
      <button class="profile-menu-button" type="button" data-page="chat">☰</button>
      <div class="profile-brand"><span class="brand-mark"></span><b>Jelly AI</b></div>
      <div class="profile-top-actions">
        <button class="top-help" type="button" data-drawer="conversationIntro">？ 帮助中心</button>
        <div class="profile-account-name"><b>Kelvin</b><span>欧诚国际物流</span><i>▾</i></div>
      </div>
    </header>
    <div class="profile-body">
      <aside class="profile-side">
        <button class="active" type="button">♙ 个人档案</button>
        <button type="button" data-demo-action="关联企业">▥ 关联企业</button>
      </aside>
      <main class="profile-main">
        <div class="profile-breadcrumb">首页 <span>›</span> 个人信息</div>
        <section class="profile-card profile-archive">
          <div class="profile-card-head">
            <h2>个人档案</h2>
            <button class="button primary" type="button" data-demo-action="修改档案">修改档案</button>
          </div>
          <div class="profile-info-grid">
            ${[
              ["姓名", "Kelvin"],
              ["性别", "未知"],
              ["职业", "未知"],
              ["国家", "未知"],
              ["语言", "未知"],
              ["时区", "未知"],
            ].map(([label, value]) => `<div><span>${label}</span><b>${value}</b></div>`).join("")}
          </div>
        </section>
        ${[
          ["🔒", "修改密码", "", "修改密码", ""],
          ["💬", "绑定微信账号", "", "绑定微信", ""],
          ["✉", "绑定邮箱地址", "", "绑定邮箱", ""],
          ["📞", "绑定手机号码", "13828821846", "修改手机", ""],
          ["▣", "删除账户", "", "删除账户", "danger"],
        ].map(([icon, title, desc, action, danger]) => `<section class="profile-card profile-setting-row">
          <div><span class="profile-setting-icon">${icon}</span><b>${title}</b>${desc ? `<p>${desc}</p>` : ""}</div>
          <button class="button ${danger ? "danger" : "outline"}" type="button" data-demo-action="${action}">${action}</button>
        </section>`).join("")}
      </main>
    </div>
  </section>`;
}

function renderPage() {
  if (state.selectedAssistant) return renderAssistantDetail();
  switch (state.page) {
    case "home":
      return renderHome();
    case "ai":
      return renderAiList();
    case "channels":
      return renderChannels();
    case "wechat":
      return renderWechat();
    case "chat":
      return renderChatWorkplace();
    case "flow":
      return renderFlowPage();
    case "knowledge":
      return renderStandaloneKnowledge();
    case "knowledgeCreate":
      return renderKnowledgeCreatePage();
    case "skillEdit":
      return renderSkillEditPage();
    case "marketing":
      return renderMarketing();
    case "contacts":
      return renderContacts();
    case "analytics":
      return renderAnalytics();
    case "teach":
      return renderTeach();
    case "settings":
      return renderSystemSettings();
    default:
      return renderPlaceholder();
  }
}

function renderHome() {
  const basic = [
    ["🍄", "创建AI助手", "快速创建拥有您自己私有知识内容的AI助手"],
    ["🍞", "上传私有知识", "将您的私有知识上传，并关联给AI助手使用"],
    ["🧁", "将AI助手发布到您的网站", "将AI助手放在您的网站上做客户服务"],
    ["🤖", "将AI与社交媒体平台对接", "快速将AI接入您的社交平台中"],
    ["🍄", "使用聚合对话界面查看/回复消息", "在聚合对话界面查看/回复的消息"],
    ["🍞", "邀请更多成员加入", "邀请更多同事加入并分配坐席权限"],
  ];
  const advanced = [
    ["创建AI流程", "AI流程可以让AI按照指定方式完整任务，调用第三方工具解决"],
    ["使用对话变量", "将联系人信息、工具、知识作为AI大模型提示词变量"],
    ["意图设置", "意图设置可以判断用户意图配置不同的处理方式"],
  ];
  return `
    <section class="content">
      <h1 class="page-title">🚀 快速开始</h1>
      <div class="strip">
        <span>您当前的产品版本为</span>
        <span class="tag">营销基础版</span>
        <button class="button primary">联系我们</button>
      </div>
      <div class="section-title">基础配置</div>
      <div class="grid-3">
        ${basic
          .map(
            ([ico, title, desc]) => `
          <div class="card quick-card">
            <div>
              <div class="card-title"><span>${ico}</span>${title}</div>
              <div class="subtle">${desc}</div>
            </div>
            <div class="card-actions">
              <button class="button">帮助文档</button>
              <button class="button primary" data-page="${title.includes("创建") ? "ai" : title.includes("聚合") ? "chat" : title.includes("社交") ? "channels" : "knowledge"}">使用 ›</button>
            </div>
          </div>`
          )
          .join("")}
      </div>
      <div class="section-title" style="margin-top:34px">进阶配置</div>
      <div class="grid-3">
        ${advanced
          .map(
            ([title, desc]) => `
          <div class="card" style="padding:0; overflow:hidden">
            <div class="hero-preview"><div class="fake-shot"><div class="fake-shot-line blue"></div><div class="fake-shot-line"></div><div class="fake-shot-line"></div><div class="fake-shot-line"></div></div></div>
            <div style="padding:18px 20px">
              <div class="card-title">${title}</div>
              <div class="subtle">${desc}</div>
              <div class="card-actions"><button class="button">帮助文档</button><button class="button primary" data-page="${title.includes("流程") ? "flow" : "ai"}">使用 ›</button></div>
            </div>
          </div>`
          )
          .join("")}
      </div>
      <div class="section-title" style="margin-top:34px">更多帮助</div>
      <div class="grid-2 help-grid">
        <div class="card help-card">
          <div class="help-icon help-icon-doc">¥</div>
          <div>
            <div class="card-title">产品教学文章</div>
            <div>查看更多帮助教学</div>
          </div>
        </div>
        <div class="card help-card">
          <div class="help-icon help-icon-contact">☎</div>
          <div>
            <div class="card-title">联系我们</div>
            <div>点击这里联系我们</div>
          </div>
        </div>
      </div>
    </section>`;
}
