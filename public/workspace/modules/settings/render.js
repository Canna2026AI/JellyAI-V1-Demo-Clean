// Teaching and system settings renderers.

function renderTeach() {
  const docs = [
    ["快速开始", "从创建 AI 助手、上传知识库到接入企业微信托管的完整路径。"],
    ["聚合对话", "自定义视图、排序搜索、工作时间、快捷消息与消息转发。"],
    ["AI微信营销", "营销标签、消息群发、自动加好友、自动化运营和群聊管理。"],
    ["企业微信托管", "托管账号、聚合规则、高级设置、机器人控制台与操作日志。"],
    ["数据分析", "AI对话、人工对话、用户数据和流程执行统计。"],
    ["团队权限", "成员邀请、角色权限、操作日志和系统设置。"],
  ];
  return `<section class="module-layout">
    <aside class="subnav">
      <div class="subnav-title">教学文档</div>
      ${[["guide", "全部文档"], ["quick", "快速开始"], ["faq", "常见问题"]].map(([id, label]) => `<div class="subnav-item ${state.teachSub === id ? "active" : ""}" data-teach-sub="${id}"><span class="subnav-icon">◇</span><span>${label}</span></div>`).join("")}
    </aside>
    <main class="module-content admin-main">
      <div class="admin-head"><div><h1 class="page-title">产品教学</h1><p class="subtle">帮助团队快速理解 Demo 中的业务配置路径。</p></div><input class="input search-input" placeholder="搜索文档"></div>
      <div class="doc-card-grid">${docs.map(([title, desc]) => `<div class="mini-card doc-card"><b>${title}</b><p class="subtle">${desc}</p><button class="link-button" data-demo-action="打开${title}文档">查看文档</button></div>`).join("")}</div>
    </main>
  </section>`;
}

function renderSystemSettings() {
  const side = [["team", "团队管理"], ["roles", "角色权限"], ["logs", "操作日志"], ["profile", "系统设置"]];
  const body = {
    team: renderTeamManagement,
    roles: renderRoleManagement,
    logs: renderSystemLogs,
    profile: renderSystemProfile,
  }[state.settingsSub]();
  return `<section class="module-layout">
    <aside class="subnav">
      <div class="subnav-title">系统设置</div>
      ${side.map(([id, label]) => `<div class="subnav-item ${state.settingsSub === id ? "active" : ""}" data-settings-sub="${id}"><span class="subnav-icon">${id === "team" ? "♙" : id === "roles" ? "⚙" : "▤"}</span><span>${label}</span></div>`).join("")}
    </aside>
    <main class="module-content admin-main">${body}</main>
  </section>`;
}

function renderTeamManagement() {
  const rows = [
    ["<span class=\"member-dot\">我</span> Canna", "canna@example.com", "小组管理员", "<span class=\"tag green\">已加入</span>", "2026-06-18", "<button class=\"link-button\" data-demo-action=\"编辑成员\">编辑</button>"],
    ["<span class=\"member-dot\">K</span> Kelvin", "kelvin@example.com", "客服坐席", "<span class=\"tag orange\">待确认</span>", "2026-06-20", "<button class=\"link-button\" data-demo-action=\"重新邀请\">重新邀请</button>"],
  ];
  return `<div class="admin-page">
    <div class="admin-head"><div><h1 class="page-title">团队管理</h1><p class="subtle">邀请成员加入团队，并分配可访问的角色和小组。</p></div><button class="button primary" data-modal="inviteMember">邀请成员</button></div>
    <div class="admin-stat-row"><div><b>2</b><span>团队成员</span></div><div><b>1</b><span>小组</span></div><div><b>3</b><span>角色</span></div><div><b>0</b><span>待处理申请</span></div></div>
    ${renderMktSearchRow(["请输入成员名称", "select:成员角色", "select:成员状态", "reset"])}
    ${renderMktTable(["成员", "邮箱", "角色", "状态", "加入时间", "操作"], rows)}
  </div>`;
}

function renderRoleManagement() {
  const rows = [
    ["超级管理员", "拥有全部系统权限", "1", "<button class=\"link-button\" data-demo-action=\"查看角色\">查看</button>"],
    ["小组管理员", "管理托管账号、成员与对话分配", "1", "<button class=\"link-button\" data-demo-action=\"编辑角色\">编辑</button>"],
    ["客服坐席", "处理聚合对话与客户信息", "1", "<button class=\"link-button\" data-demo-action=\"编辑角色\">编辑</button>"],
  ];
  return `<div class="admin-page">
    <div class="admin-head"><div><h1 class="page-title">角色权限</h1><p class="subtle">按岗位配置页面访问、数据范围和操作权限。</p></div><button class="button primary" data-modal="createRole">新建角色</button></div>
    ${renderMktTable(["角色名称", "权限说明", "成员数", "操作"], rows)}
    <div class="permission-matrix">
      ${["AI智能体", "聚合对话", "AI微信营销", "联系人管理", "数据分析", "系统设置"].map((name) => `<div><b>${name}</b><label><input type="checkbox" checked> 查看</label><label><input type="checkbox" ${name !== "系统设置" ? "checked" : ""}> 编辑</label></div>`).join("")}
    </div>
  </div>`;
}

function renderSystemLogs() {
  const rows = [
    ["2026-06-25 12:10", "Canna", "创建快捷回复", "聚合对话", "<span class=\"tag green\">成功</span>"],
    ["2026-06-25 12:06", "系统", "同步企微标签", "AI微信营销", "<span class=\"tag green\">成功</span>"],
    ["2026-06-25 11:58", "Kelvin", "导出聊天记录", "对话记录查询", "<span class=\"tag green\">成功</span>"],
  ];
  return `<div class="admin-page">
    <div class="admin-head"><div><h1 class="page-title">操作日志</h1><p class="subtle">查看团队成员在系统中的关键操作记录。</p></div><button class="button" data-demo-action="导出操作日志">导出</button></div>
    ${renderMktSearchRow(["请输入操作人", "select:操作模块", "date:开始日期 至 结束日期", "reset"])}
    ${renderMktTable(["时间", "操作人", "操作内容", "模块", "状态"], rows)}
  </div>`;
}

function renderSystemProfile() {
  return `<div class="admin-page">
    <div class="admin-head"><div><h1 class="page-title">系统设置</h1><p class="subtle">配置企业基础信息、数据安全与通知偏好。</p></div><button class="button primary" data-demo-action="保存系统设置">保存</button></div>
    <div class="settings-list">
      <div class="setting-row vertical"><b>企业名称</b><input class="input" value="Jelly AI Demo 团队"></div>
      <div class="setting-row"><b>新成员加入需要管理员审核</b><span class="switch on" data-switch></span></div>
      <div class="setting-row"><b>导出数据时添加水印</b><span class="switch on" data-switch></span></div>
      <div class="setting-row"><b>异常任务自动通知管理员</b><span class="switch on" data-switch></span></div>
    </div>
  </div>`;
}
