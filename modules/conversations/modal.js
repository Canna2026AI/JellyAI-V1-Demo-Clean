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

  if (state.modal === "conversationMembers") {
    return renderConversationMembersModal();
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
    <div class="modal-head">${escapeHtml(confirm.title || "确认操作")}<button class="button ghost" data-conversation-confirm-cancel>×</button></div>
    <div class="modal-body">${escapeHtml(confirm.body || "请确认是否继续。")}</div>
    <div class="modal-foot"><button class="button" data-conversation-confirm-cancel>取消</button><button class="button primary" data-modal-ok>${escapeHtml(confirm.okText || "确认")}</button></div>
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
          <button type="button" data-quick-format="strikeThrough">S</button><i></i>
          <button type="button" data-quick-format="insertUnorderedList">列表</button>
          <button type="button" data-quick-format="insertOrderedList">编号</button><i></i>
          <button type="button" data-quick-format="outdent">外移</button>
          <button type="button" data-quick-format="indent">缩进</button><i></i>
          <button type="button" data-quick-insert-token="link" title="插入链接">链接</button><button type="button" data-quick-insert-token="image" title="插入图片">图片</button><button type="button" data-quick-insert-token="table" title="插入表格">表格</button><button type="button" data-quick-insert-token="variable" title="插入变量">变量</button><i></i>
          <button type="button" class="muted" data-quick-format="undo">撤销</button><button type="button" class="muted" data-quick-format="redo">重做</button>
        </div>
        <div id="quickReplyContent" class="quick-reply-editor-content" contenteditable="true" data-quick-reply-required></div>
      </div>
    </div>
    <div class="quick-reply-foot"><button class="button" type="button" data-close-modal>取消</button><button class="button primary" type="button" data-modal-ok disabled>保存</button></div>
  </div></div>`;
}

function renderConversationMembersModal() {
  const conv = getSelectedConversation();
  const members = getFilteredConversationMembers(conv);
  const selectedMember = getSelectedConversationMember(conv);
  return `<div class="modal-backdrop group-members-backdrop">
    <div class="modal group-members-modal" role="dialog" aria-modal="true" aria-labelledby="conversationMembersTitle">
      <div class="group-members-head">
        <div><b id="conversationMembersTitle">群成员</b><span>${escapeHtml(conv?.name || "当前会话")} · ${getConversationMembers(conv).length} 人</span></div>
        <button type="button" data-close-modal aria-label="关闭">×</button>
      </div>
      <div class="group-members-body">
        <section class="group-member-list-pane">
          <label class="group-member-search"><span class="search-glyph"></span><input data-group-member-search value="${escapeHtml(state.conversationMemberSearch || "")}" placeholder="搜索群成员、公司、手机号"></label>
          <div class="group-member-grid">
            ${members.length ? members.map((member) => renderConversationMemberCard(member, selectedMember?.id === member.id)).join("") : `<div class="group-member-empty">未找到匹配成员</div>`}
          </div>
        </section>
        <section class="group-member-detail">
          ${selectedMember ? renderConversationMemberDetail(selectedMember) : `<div class="group-member-empty">请选择成员查看详情</div>`}
        </section>
      </div>
      <div class="group-members-foot">
        <button class="button" type="button" data-close-modal>关闭</button>
        <button class="button primary" type="button" data-insert-member-mention="${escapeHtml(selectedMember?.id || "")}" ${selectedMember ? "" : "disabled"}>插入 @ 成员</button>
      </div>
    </div>
  </div>`;
}

function renderConversationMemberCard(member, active) {
  return `<button class="group-member-card ${active ? "active" : ""}" type="button" data-member-select="${escapeHtml(member.id)}">
    <span class="group-member-avatar">${escapeHtml(member.avatar || member.name.slice(0, 1))}</span>
    <b>${escapeHtml(member.name)}</b>
    <small>${escapeHtml(member.role || "成员")}</small>
  </button>`;
}

function renderConversationMemberDetail(member) {
  const tags = Array.isArray(member.tags) ? member.tags : [];
  return `<div class="group-member-profile">
    <div class="group-member-profile-head">
      <span class="group-member-avatar large">${escapeHtml(member.avatar || member.name.slice(0, 1))}</span>
      <div><b>${escapeHtml(member.name)}</b><span>${escapeHtml(member.role || "成员")} · ${escapeHtml(member.lastActive || "-")}</span></div>
    </div>
    <div class="group-member-tags">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("") || "<span>暂无标签</span>"}</div>
    <table>
      <tr><td>备注</td><td>${escapeHtml(member.remark || "-")}</td></tr>
      <tr><td>公司</td><td>${escapeHtml(member.company || "-")}</td></tr>
      <tr><td>城市</td><td>${escapeHtml(member.city || "-")}</td></tr>
      <tr><td>手机号</td><td>${escapeHtml(member.phone || "-")}</td></tr>
    </table>
    <div class="group-member-actions">
      <button class="button" type="button" data-toggle-member-tag="${escapeHtml(member.id)}">标记重点成员</button>
      <button class="button" type="button" data-copy-member-phone="${escapeHtml(member.phone || "")}" ${member.phone && member.phone !== "-" ? "" : "disabled"}>复制手机号</button>
    </div>
  </div>`;
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
    <div class="modal-body custom-view-body">${body}<a class="learn-link" data-demo-action="自定义视图说明">了解更多</a></div>
    <div class="modal-foot">
      ${step > 1 ? `<button class="button" data-custom-view-prev>上一步</button>` : `<button class="button" data-close-modal>取消</button>`}
      <button class="button primary${step === 1 && !state.customViewName.trim() ? " disabled" : ""}" data-custom-view-next ${step === 1 && !state.customViewName.trim() ? "disabled" : ""}>${step === 3 ? "确认" : "下一步"}</button>
    </div>
  </div></div>`;
}
