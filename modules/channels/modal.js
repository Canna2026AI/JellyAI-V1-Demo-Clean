// Channel detail and connection modal renderers.

function renderChannelModal() {
  const view = getChannelViewState();
  const channel = view.activeId ? findChannelById(view.activeId) : null;
  if (!channel) return "";

  const title = view.modalMode === "connect" ? `接入配置：${channel.name}` : channel.name;
  return `<div class="modal-backdrop channel-modal-backdrop">
    <div class="modal channel-modal">
      <div class="modal-head">
        ${escapeHtml(title)}
        <button class="button ghost" type="button" data-channel-close>×</button>
      </div>
      <div class="modal-body">
        ${view.modalMode === "connect" ? renderChannelConnectForm(channel) : renderChannelDetail(channel)}
      </div>
      <div class="modal-foot">
        <button class="button" type="button" data-channel-close>${view.modalMode === "connect" ? "取消" : "关闭"}</button>
        ${renderChannelModalPrimary(channel, view.modalMode)}
      </div>
    </div>
  </div>`;
}

function renderChannelDetail(channel) {
  const accountRows = getChannelAccountRows(channel);
  return `<div class="channel-detail">
    <div class="channel-detail-summary">
      ${iconBox(channel.icon, `channel-icon ${getChannelIconClass(channel.category, channel.status)}`)}
      <div>
        <div class="channel-detail-title">
          <b>${escapeHtml(channel.name)}</b>
          ${renderChannelStatus(channel.status)}
        </div>
        <p>${escapeHtml(channel.description)}</p>
      </div>
    </div>
    <div class="channel-detail-grid">
      <div><span>渠道分类</span><b>${escapeHtml(channel.category)}</b></div>
      <div><span>账号数量</span><b>${channel.accountCount}</b></div>
      <div><span>接入状态</span><b>${escapeHtml(channel.status)}</b></div>
    </div>
    <div class="channel-detail-section">
      <h3>接入说明</h3>
      <p>${escapeHtml(channel.guide)}</p>
    </div>
    <div class="channel-detail-section">
      <h3>需要配置的字段</h3>
      <div class="channel-field-list">
        ${channel.fields.map((field) => `<span>${escapeHtml(field)}</span>`).join("")}
      </div>
    </div>
    <div class="channel-detail-section">
      <h3>已连接账号</h3>
      ${accountRows.length ? `<ul class="channel-account-list">${accountRows.map((account) => `<li><span>${escapeHtml(account.label)}</span>${account.removable ? `<button class="link-button" type="button" data-channel-remove="${escapeHtml(channel.id)}" data-channel-account-id="${escapeHtml(account.id)}">移除</button>` : ""}</li>`).join("")}</ul>` : `<p class="subtle">当前暂无已连接账号。</p>`}
    </div>
  </div>`;
}

function renderChannelConnectForm(channel) {
  const values = getChannelFormValues(channel);
  return `<form class="channel-connect-form" data-channel-form="${escapeHtml(channel.id)}">
    <div class="channel-form-intro">
      <b>${escapeHtml(channel.name)}</b>
      <span>配置会保存到当前后端服务；真实第三方授权需在后端补充对应平台凭据。</span>
    </div>
    <label>
      <span>账号名称</span>
      <input class="input" name="accountName" value="${escapeHtml(values.accountName)}" placeholder="例如：欧诚国际物流公众号" />
    </label>
    <label>
      <span>负责人</span>
      <input class="input" name="owner" value="${escapeHtml(values.owner)}" placeholder="例如：Kelvin" />
    </label>
    <label>
      <span>绑定 AI 助手</span>
      <select class="select" name="assistant">
        ${renderSelectOptions(["物流客服助手", "canna测试", "未绑定"], values.assistant)}
      </select>
    </label>
    <label>
      <span>备注</span>
      <textarea class="input" name="remark" placeholder="记录接入用途或测试说明">${escapeHtml(values.remark)}</textarea>
    </label>
    <div class="channel-test-row">
      <button class="button small" type="button" data-channel-test="${escapeHtml(channel.id)}">测试连接</button>
      <span>通过后端校验账号名称、开放状态和配置完整度</span>
    </div>
    <div class="channel-required-fields">
      <span>后续真实接入字段</span>
      <div>${channel.fields.map((field) => `<em>${escapeHtml(field)}</em>`).join("")}</div>
    </div>
  </form>`;
}

function renderChannelModalPrimary(channel, mode) {
  if (channel.route === "wechat") return `<button class="button primary" type="button" data-page="wechat">进入企业微信托管</button>`;
  if (!channel.isOpen) return `<button class="button primary" type="button" data-channel-unavailable="${escapeHtml(channel.id)}">知道了</button>`;
  if (mode === "connect") return `<button class="button primary" type="button" data-channel-save="${escapeHtml(channel.id)}">保存配置</button>`;
  return `<button class="button primary" type="button" data-channel-connect="${escapeHtml(channel.id)}">${channel.status === "已接入" ? "新增账号" : "开始接入"}</button>`;
}
