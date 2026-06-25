// Module modal renderers.

function renderConversationModal() {
  if (!state.modal) return "";
if (state.modal === "conversationConfirm") {
    return renderConversationConfirmModal();
  }
if (state.modal === "customView") {
    return renderCustomViewModal();
  }

if (state.modal === "quickGroup") {
    return renderQuickGroupModal();
  }

if (state.modal === "quickReply") {
    return renderQuickReplyModal();
  }

  return "";
}

function renderConversationConfirmModal() {
  const confirm = state.conversationConfirm || {};
  window.__modalOk = () => {
    window.__conversationConfirmAction?.();
    window.__conversationConfirmAction = null;
    state.conversationConfirm = null;
  };
  return `<div class="modal-backdrop"><div class="modal conversation-confirm-modal">
    <div class="modal-head">${escapeHtml(confirm.title || "确认操作")}<button class="button ghost" data-close-modal>×</button></div>
    <div class="modal-body">${escapeHtml(confirm.body || "请确认是否继续。")}</div>
    <div class="modal-foot"><button class="button" data-close-modal>取消</button><button class="button primary" data-modal-ok>${escapeHtml(confirm.okText || "确认")}</button></div>
  </div></div>`;
}

function renderQuickReplyModal() {
  window.__modalOk = () => {
    const content = document.getElementById("quickReplyContent")?.textContent.trim();
    const groupId = document.getElementById("quickReplyGroup")?.value || "";
    if (!groupId || !content) return showToast("请选择分组并填写回复内容");
    const title = content.length > 24 ? `${content.slice(0, 24)}…` : content;
    quickMessageData.replies.push({ id: `reply-${Date.now()}`, title, content, groupId });
    saveQuickMessageData();
    state.modal = null;
    showToast("快捷回复创建成功");
  };
  return `<div class="modal-backdrop quick-reply-backdrop"><div class="modal quick-reply-modal">
    <div class="quick-reply-head">新增快捷回复<button type="button" data-close-modal aria-label="关闭">×</button></div>
    <div class="quick-reply-body">
      <label class="quick-reply-label" for="quickReplyGroup">选择分组 <span>*</span></label>
      <select id="quickReplyGroup" class="quick-reply-group" data-quick-reply-required>
        <option value=""></option>
        ${quickMessageData.groups.map((group) => `<option value="${group.id}">${escapeHtml(group.name)}</option>`).join("")}
      </select>
      <div class="quick-reply-editor">
        <div class="quick-reply-editor-tools" aria-label="文本格式工具栏">
          <button type="button" data-quick-format="formatBlock" data-format-value="h3">H</button>
          <button type="button" data-quick-format="bold"><b>B</b></button>
          <button type="button" data-quick-format="italic"><i>I</i></button>
          <button type="button" data-quick-format="strikeThrough">S̶</button><i></i>
          <button type="button" data-quick-format="insertUnorderedList">☷</button>
          <button type="button" data-quick-format="insertOrderedList">1₂</button><i></i>
          <button type="button" data-quick-format="outdent">≡</button>
          <button type="button" data-quick-format="indent">≡</button><i></i>
          <button type="button" title="插入链接">↗</button><button type="button" title="插入图片">▣</button><button type="button" title="插入表格">▦⌄</button><button type="button" title="插入内容">▧⌄</button><i></i>
          <button type="button" class="muted" data-quick-format="undo">↶</button><button type="button" class="muted" data-quick-format="redo">↷</button>
        </div>
        <div id="quickReplyContent" class="quick-reply-editor-content" contenteditable="true" data-quick-reply-required></div>
      </div>
    </div>
    <div class="quick-reply-foot"><button class="button" type="button" data-close-modal>取消</button><button class="button primary" type="button" data-modal-ok disabled>保存</button></div>
  </div></div>`;
}

function renderQuickGroupModal() {
  window.__modalOk = () => {
    const name = document.getElementById("quickGroupName")?.value.trim();
    if (!name) return showToast("请输入分组名称");
    if (quickMessageData.groups.some((group) => group.name === name)) return showToast("该分组已存在");
    quickMessageData.groups.push({ id: `group-${Date.now()}`, name });
    saveQuickMessageData();
    state.modal = null;
    showToast("分组创建成功");
  };
  return `<div class="modal-backdrop quick-group-backdrop">
    <div class="modal quick-group-modal" role="dialog" aria-modal="true" aria-labelledby="quickGroupTitle">
      <div class="quick-group-modal-head">
        <span id="quickGroupTitle">新增分组</span>
        <button type="button" data-close-modal aria-label="关闭">×</button>
      </div>
      <div class="quick-group-modal-body">
        <label for="quickGroupName">分组名称 <span>*</span></label>
        <input id="quickGroupName" maxlength="30" placeholder="请输入分组名称" autocomplete="off" autofocus>
      </div>
      <div class="quick-group-modal-foot">
        <button class="button" type="button" data-close-modal>取消</button>
        <button class="button primary" type="button" data-modal-ok>保存</button>
      </div>
    </div>
  </div>`;
}

function renderCustomViewModal() {
  const step = state.customViewStep;
  const escapedViewName = state.customViewName
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
  const stepLabel = (n, text) => {
    const className = [step === n ? "active" : "", n > step ? "locked" : ""].filter(Boolean).join(" ");
    const navigation = n < step ? ` data-custom-view-step="${n}"` : "";
    return `<span class="${className}"${navigation}>${n}.${text}</span>`;
  };
  const body = {
    1: `
      <div class="form-row">
        <div class="label">视图名称</div>
        <div class="view-name-wrap">
          <input class="input" maxlength="100" data-custom-view-name value="${escapedViewName}">
          <span data-custom-view-name-count>${state.customViewName.length} / 100</span>
        </div>
      </div>
    `,
    2: `
      <div class="label">权限范围</div>
      <div class="radio-row">
        <label data-custom-view-access="all"><span class="radio ${state.customViewAccess === "all" ? "on" : ""}"></span>全员可访问</label>
        <label data-custom-view-access="custom"><span class="radio ${state.customViewAccess === "custom" ? "on" : ""}"></span>自定义访问权限</label>
      </div>
      ${state.customViewAccess === "custom" ? `
        <div class="permission-picker">
          <div>
            <div class="search-box">⌕ 搜索</div>
            <label class="member-option"><input type="checkbox"> <span class="avatar">Kelvin</span> Kelvin</label>
          </div>
          <div><b>已选：0 人</b></div>
        </div>
      ` : ""}
    `,
    3: `
      <div class="manual-view-note">
        <b>手动分组视图</b>
        <span>该视图不会根据筛选条件自动加入对话。创建后，可在对话页面右上角的分组入口，将当前对话手动添加到这个视图中。</span>
      </div>
    `,
  }[step];
  return `<div class="modal-backdrop"><div class="modal custom-view-modal">
    <div class="modal-head">新建视图<button class="button ghost" data-close-modal>×</button></div>
    <div class="view-steps">
      ${stepLabel(1, "基本信息")}<b>›</b>${stepLabel(2, "访问权限")}<b>›</b>${stepLabel(3, "筛选条件")}
    </div>
    <div class="modal-body custom-view-body">${body}<a class="learn-link">了解更多</a></div>
    <div class="modal-foot">
      ${step > 1 ? `<button class="button" data-custom-view-prev>上一步</button>` : `<button class="button" data-close-modal>取消</button>`}
      <button class="button primary${step === 1 && !state.customViewName.trim() ? " disabled" : ""}" data-custom-view-next ${step === 1 && !state.customViewName.trim() ? "disabled" : ""}>${step === 3 ? "确认" : "下一步"}</button>
    </div>
  </div></div>`;
}
