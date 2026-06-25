// Shared placeholder, modal shell, and public drawer renderers.

function renderPlaceholder() {
  return `<section class="content"><h1 class="page-title">${menu.find((m) => m[0] === state.page)?.[2] || "页面"}</h1><div class="card empty">Demo 中该模块作为导航占位，核心流程请查看企业微信托管、AI智能体、AI流程和聚合对话。</div></section>`;
}

function renderModal() {
  if (!state.modal) {
    window.__modalOk = null;
    return "";
  }
  if (state.modal === "recharge") return renderRechargeModal();
  const moduleRenderers = [
    renderAgentModal,
    renderConversationModal,
    renderKnowledgeModal,
    renderWecomModal,
    renderMarketingModal,
    renderFlowModal,
    renderContactModal,
    renderSettingsModal,
  ];
  for (const renderer of moduleRenderers) {
    const html = renderer?.();
    if (html) return html;
  }
  return "";
}

function renderRechargeModal() {
  window.__modalOk = () => {
    state.modal = null;
    showToast(`已模拟支付 ¥${state.rechargeAmount.toFixed(2)}`);
  };
  return `<div class="modal-backdrop recharge-backdrop">
    <div class="modal recharge-modal">
      <div class="recharge-modal-head">
        <div>
          <h2>余额充值</h2>
          <p>您将充值余额到集简云账户，余额可以在所有插件中使用；</p>
        </div>
        <button type="button" data-close-modal>×</button>
      </div>
      <div class="recharge-modal-body">
        <label>充值金额</label>
        <div class="recharge-stepper">
          <button type="button" data-recharge-step="-100">−</button>
          <input value="${state.rechargeAmount.toFixed(2)}" data-recharge-amount>
          <button type="button" data-recharge-step="100">＋</button>
        </div>
        <p>注：最低充值金额为100元</p>
      </div>
      <div class="recharge-modal-foot">
        <button class="button" type="button" data-close-modal>取消</button>
        <button class="button primary" type="button" data-modal-ok>支付</button>
      </div>
    </div>
  </div>`;
}

function modal(title, body, okText, onOk) {
  window.__modalOk = onOk;
  return `<div class="modal-backdrop"><div class="modal"><div class="modal-head">${title}<button class="button ghost" data-close-modal>×</button></div><div class="modal-body">${body}</div><div class="modal-foot"><button class="button" data-close-modal>取消</button><button class="button primary" data-modal-ok>${okText}</button></div></div></div>`;
}

function renderDrawer() {
  if (!state.drawer) return "";
if (state.drawer === "conversationIntro") {
    return `<div class="drawer-backdrop help-drawer-backdrop">
      <aside class="conversation-help-drawer">
        <header>
          <span>帮助</span>
          <button type="button" data-close-drawer>×</button>
        </header>
        <div class="conversation-help-body">
          <h2>如何在各大社交媒体中使用您的AI助手</h2>
          <p>您可以将AI助手与多个社交平台对接，当用户在社交平台私信，或者评论时，AI自动进行回复，AI转人工回复，完全人工回复，或者仅非工作时间进行AI回复等多种配置方式。</p>
          <h3>1 通过创建"聚合规则"将AI助手与您的社交平台账户连接</h3>
          <p>聚合规则可以理解为 AI助手与您社交账户的连接规则，通过聚合规则将您的AI助手与社交账户连接，并且设置何时AI接入对话，使用哪个AI智能体平台，什么情况进行AI转人工等规则设置。</p>
          <p>点击导航栏的"AI社交营销"，找到您要使用的社交营销平台，点击其下面的"聚合对话设置"，创建聚合对话规则。</p>
          <div class="help-shot">
            <div class="help-shot-side">
              ${["网站页面", "抖音企业号(私信)", "抖音企业号(群聊)", "抖音评论", "微信公众号", "微信小店", "微信客服(原生)", "微信客服(企业微信)", "小红书专业号(私信)", "QQ机器人"].map((item, index) => `<div class="${index === 8 ? "active" : ""}">${item}</div>`).join("")}
            </div>
            <div class="help-shot-main">
              <b>聚合对话规则设置</b>
              <span>您可以在此页面添加和管理对话规则</span>
              <button class="button primary">＋ 添加规则</button>
              <div class="help-rule-card">
                <span class="guide-icon" style="background:#eef4ff;color:var(--blue)">✣</span>
                <b>小红书企业号聚合规则</b>
                <span class="switch on"></span>
              </div>
            </div>
          </div>
          <h3>2 设置聚合对话规则</h3>
          <p>聚合对话规则决定了在社交平台中的对话，如何与AI智能体、人工进行对话。</p>
          <ul>
            <li>授权账户选择：选择你的社交平台账户，如果首次添加，可以点击后根据引导完成授权后使用。</li>
            <li>使用范围选择：部分社交平台有企业号和员工号，在这里可以选择规则生效的范围。</li>
            <li>AI对话设置：选择何时开启AI对话，可以设置全部使用AI、非工作时间使用AI，或者全部使用人工。</li>
            <li>选择AI智能体服务平台：选择不同AI智能体服务平台提供的AI智能体。</li>
            <li>选择AI对话助手：选择平台下的指定智能体。</li>
            <li>转人工意图设置：满足指定转人工意图时，转入人工服务。</li>
            <li>每用户最大AI回复次数：限制AI回复次数，防止被滥用。</li>
          </ul>
          <h3>3 保存并开启聚合对话规则</h3>
          <p>设置完聚合对话规则后，点击保存，然后在聚合对话规则列表中，开启此规则即可生效：</p>
          <div class="help-shot compact">
            <div class="help-shot-side">
              <div>网站页面</div><div>抖音企业号(私信)</div><div>微信公众号</div><div class="active">小红书专业号(私信)</div>
            </div>
            <div class="help-shot-main">
              <b>聚合对话规则设置</b>
              <button class="button primary">＋ 添加规则</button>
              <div class="help-rule-card large">
                <span class="guide-icon" style="background:#eef4ff;color:var(--blue)">✣</span>
                <b>小红书企业号聚合规则</b>
                <span class="switch on"></span>
                <button class="button small">配置</button>
              </div>
            </div>
          </div>
        </div>
        <footer>
          <button class="button outline" type="button" data-demo-action="在新窗口打开帮助">▣ 在新窗口打开</button>
          <button class="button primary" type="button" data-demo-action="在线客服">☏ 在线客服</button>
        </footer>
      </aside>
    </div>`;
  }

  const moduleDrawers = [renderAgentDrawer, renderFlowDrawer];
  for (const renderer of moduleDrawers) {
    const html = renderer?.();
    if (html) return html;
  }
  return "";
}

function drawer(title, body) {
  return `<div class="drawer-backdrop"><div class="drawer"><div class="modal-head">${title}<button class="button ghost" data-close-drawer>×</button></div><div class="modal-body">${body}</div><div class="modal-foot"><button class="button" data-close-drawer>返回</button><button class="button primary" data-close-drawer>确定</button></div></div></div>`;
}
