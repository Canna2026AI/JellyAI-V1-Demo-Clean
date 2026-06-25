// Contact module renderers.

function renderContacts() {
  const side = [["list", "联系人列表"], ["fields", "字段设置"]];
  const body = state.contactsSub === "fields" ? renderContactFields() : renderContactList();
  return `<section class="module-layout">
    <aside class="subnav">
      <div class="subnav-title">联系人管理</div>
      ${side.map(([id, label]) => `<div class="subnav-item ${state.contactsSub === id ? "active" : ""}" data-contacts-sub="${id}"><span class="subnav-icon">${id === "list" ? "♙" : "T"}</span><span>${label}</span></div>`).join("")}
    </aside>
    <main class="module-content admin-main">${body}</main>
  </section>`;
}

function renderContactList() {
  const rows = [
    ["<b>Canna郑</b><br><span class=\"subtle\">微信 · 外部联系人</span>", "139****9002", "企业微信托管", "<span class=\"mkt-tag-chip\">物流咨询</span> <span class=\"mkt-tag-chip\">报价</span>", "2026-06-19 22:46", "<button class=\"link-button\" data-demo-action=\"查看联系人详情\">详情</button>"],
    ["<b>欧诚国际物流&集简云对接群</b><br><span class=\"subtle\">群聊 · 18人</span>", "-", "企业微信群聊", "<span class=\"mkt-tag-chip\">重点客户</span>", "2026-06-18 17:40", "<button class=\"link-button\" data-demo-action=\"查看群详情\">详情</button>"],
  ];
  return `<div class="admin-page">
    <div class="admin-head">
      <div><h1 class="page-title">联系人列表</h1><p class="subtle">统一管理来自企业微信托管、网站页面及其它渠道的客户资料。</p></div>
      <div><button class="button" data-demo-action="导出联系人">导出</button><button class="button primary" data-demo-action="添加联系人">添加联系人</button></div>
    </div>
    ${renderMktSearchRow(["搜索联系人名称", "select:所属渠道", "select:客户标签", "select:跟进人", "reset"])}
    ${renderMktTable(["客户名称", "联系方式", "来源渠道", "标签", "最近会话", "操作"], rows)}
  </div>`;
}

function renderContactFields() {
  const rows = [
    ["客户名称", "文本", "系统字段", "列表展示", "<button class=\"link-button\" data-demo-action=\"编辑字段\">编辑</button>"],
    ["手机号", "手机号", "系统字段", "检索字段", "<button class=\"link-button\" data-demo-action=\"编辑字段\">编辑</button>"],
    ["物流需求", "多行文本", "自定义字段", "聚合对话侧栏", "<button class=\"link-button\" data-demo-action=\"编辑字段\">编辑</button>"],
  ];
  return `<div class="admin-page">
    <div class="admin-head">
      <div><h1 class="page-title">字段设置</h1><p class="subtle">对联系人字段属性进行自定义配置，可在聚合对话、客户详情和自动化流程中使用。</p></div>
      <button class="button primary" data-modal="createField">创建字段</button>
    </div>
    ${renderMktSearchRow(["请输入字段名称", "select:字段类型", "reset"])}
    ${renderMktTable(["字段名称", "字段类型", "字段来源", "使用场景", "操作"], rows)}
  </div>`;
}
