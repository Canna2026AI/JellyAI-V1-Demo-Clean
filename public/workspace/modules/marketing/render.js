// AI WeChat marketing module renderers.

function renderMarketing() {
  switch (state.marketingSub) {
    case "tags":
      return renderMarketingTags();
    case "blast":
      return renderMessageBlast();
    case "friend":
      return renderAutoFriend();
    case "operation":
      return renderMarketingOperation();
    case "groups":
      return renderMarketingGroups();
    case "accounts":
      return renderMarketingAccounts();
    case "materials":
      return renderMaterials();
    case "antiSeal":
      return renderAntiSeal();
    case "records":
      return renderMarketingRecords();
    case "docs":
      return renderMarketingDocs();
    default:
      return renderMarketingWorkbench();
  }
}

function renderMarketingRulesList() {
  return `<section class="marketing-page">
    <div class="marketing-crumb">AI微信营销 › 聚合对话设置</div>
    <div class="marketing-head">
      <div>
        <h1 class="page-title">聚合对话设置</h1>
        <div class="subtle">您可以在此页面添加和管理对话规则 <button class="link-button">了解更多</button></div>
      </div>
    </div>
    <div class="marketing-toolbar">
      <button class="button primary" data-marketing-rule-new>＋ 添加规则</button>
      <input class="input search-input" placeholder="搜索" />
    </div>
    <div class="marketing-rule-grid">
      ${marketingRules
        .map(
          (rule) => `<div class="marketing-rule-card">
            <span class="switch ${rule.enabled ? "on" : ""}" data-switch></span>
            <div class="rule-icon">✣</div>
            <h3>${rule.name}</h3>
            <div class="rule-actions">
              <button class="button small" data-marketing-rule-edit="${rule.id}">配置</button>
              <button class="button ghost small">⋮</button>
            </div>
          </div>`
        )
        .join("")}
    </div>
  </section>`;
}

function renderMarketingRuleForm() {
  const rule = marketingRules.find((item) => item.id === state.marketingRuleId);
  return `<section class="marketing-form-page">
    <div class="marketing-crumb">AI微信营销 › 聚合对话设置</div>
    <div class="marketing-form-shell">
      <div class="marketing-form-panel">
        ${renderMarketingSelect("选择托管账户 *", ["任意托管账户", "指定托管账户"], "任意托管账户")}
        <div class="hint">支持接入内部与外部个人微信用户群聊与私聊： <button class="link-button">如何添加托管账户</button></div>
        <button class="button primary small">添加账号</button>
        ${renderMarketingSelect("是否仅回复指定会话(私聊/群聊) *", ["全部对话", "仅私聊", "仅群聊", "指定会话"], "全部对话")}
        <div class="hint">仅群聊时生效此配置，私聊时不会参考此配置</div>
        ${renderMarketingSelect("群聊对话时的触发方式", ["仅@托管账户时触发", "任意对话触发"], "仅@托管账户时触发")}
        <div class="hint">建议选择 仅@托管账户时触发，否则群聊时任意对话都会触发。如果选择“任意对话触发”建议配合意图使用，或者全部转入人工服务。</div>
        ${renderMarketingSelect("AI对话设置 *", ["全部使用AI助手进行对话", "仅非工作时间开启AI助手对话", "全部使用人工对话"], "请选择", [
          "将默认先与AI助手进行对话，可以人工对话打断",
          "工作时间使用人工对话，非工作时间使用AI助手对话，设置工作时间",
          "全部对话使用人工回复",
        ])}
        ${renderMarketingSelect("选择AI智能体服务平台 *", ["语聚AI"], "语聚AI")}
        <div class="hint">语聚AI本身是智能体平台，我们也支持主流智能体平台接入</div>
        ${renderMarketingSelect("选择AI对话助手 *", ["演示AI助手", "canna测试"], "请选择")}
        <div class="hint">您可以在语聚AI平台，<button class="link-button" data-assistant-sub="assistant">创建或者修改您的智能体</button></div>
        ${renderMarketingSelect("转入人工意图设置", ["转人工", "报价咨询", "售后投诉"], "请选择")}
        <div class="hint">满足指定意图设置后，自动转入到人工对话中，<button class="link-button">了解更多</button> <button class="link-button" data-assistant-sub="intent">创建或修改意图</button></div>
        <div class="form-row">
          <div class="label">每用户最大AI回复次数</div>
          <input class="input" value="300" type="number">
          <div class="hint">每次对话时AI最大对话轮次，避免被滥用。如果设置为0则表示不限制，默认为0。如果到上限后，默认切换至人工对话。</div>
        </div>
        <div class="form-row">
          <div class="label">规则名称 <span style="color:var(--red)">*</span></div>
          <input class="input" placeholder="设置一个规则名称方便查询" value="${rule?.name || ""}">
        </div>
        <div class="marketing-form-actions">
          <button class="button" data-marketing-back>返回</button>
          <button class="button primary" data-marketing-save>保存</button>
        </div>
      </div>
    </div>
  </section>`;
}

function renderMarketingSelect(label, options, value, descriptions = []) {
  return `<div class="form-row">
    <div class="label">${label.includes("*") ? label.replace("*", '<span style="color:var(--red)">*</span>') : label}</div>
    <details class="fake-select">
      <summary>${value}<span>⌄</span></summary>
      <div class="fake-select-menu">
        ${options.map((option, index) => `<button type="button" data-marketing-option="${option}"><b>${option}</b>${descriptions[index] ? `<span>${descriptions[index]}</span>` : ""}</button>`).join("")}
      </div>
    </details>
  </div>`;
}

function renderMarketingLayout(title, sideItems, active, dataAttr, body) {
  return `<section class="mkt-shell">
    <aside class="mkt-subpanel">
      <div class="mkt-subpanel-title">${title}</div>
      <div class="mkt-subitems">
        ${sideItems.map(([id, label]) => `<button class="${active === id ? "active" : ""}" data-${dataAttr}="${id}">${label}</button>`).join("")}
      </div>
    </aside>
    <main class="mkt-main">${body}</main>
  </section>`;
}

function renderMktTabs(tabs, active, dataAttr, extraClass = "") {
  return `<div class="mkt-tabs ${extraClass}">
    ${tabs.map(([id, label]) => `<button class="${active === id ? "active" : ""}" data-${dataAttr}="${id}">${label}</button>`).join("")}
  </div>`;
}

function renderMktTip(text, icon = "●") {
  return `<div class="mkt-tip"><span>${icon}</span><b>${text}</b></div>`;
}

function renderMktSearchRow(items, right = "") {
  return `<div class="mkt-filter-row">
    <div class="mkt-filter-left">
      ${items
        .map((item) => {
          if (item === "reset") return `<button class="button mkt-reset" data-demo-action="筛选已重置">重 置</button>`;
          if (item.startsWith("select:")) return `<button class="mkt-select" data-demo-action="${item.slice(7)}筛选已展开">${item.slice(7)} <span>⌄</span></button>`;
          if (item.startsWith("date:")) return `<button class="mkt-date" data-demo-action="日期范围已展开">${item.slice(5)} <span>▣</span></button>`;
          return `<input class="input mkt-input" placeholder="${item}">`;
        })
        .join("")}
    </div>
    <div class="mkt-filter-right">${right}</div>
  </div>`;
}

function renderMktEmpty() {
  return `<div class="mkt-empty"><div class="mkt-empty-icon">▱</div><div>暂无数据</div></div>`;
}

function renderMktTable(headers, rows = [], checkbox = false) {
  return `<div class="mkt-table-wrap">
    <table class="mkt-table">
      <thead><tr>${checkbox ? "<th><input type=\"checkbox\"></th>" : ""}${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>
        ${
          rows.length
            ? rows.map((row) => `<tr>${checkbox ? "<td><input type=\"checkbox\"></td>" : ""}${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")
            : `<tr><td colspan="${headers.length + (checkbox ? 1 : 0)}">${renderMktEmpty()}</td></tr>`
        }
      </tbody>
    </table>
  </div>`;
}

function renderMarketingWorkbench() {
  const side = [
    ["mine", "我的"],
    ["queue", "排队"],
    ["all", "全部"],
  ];
  const body = `<div class="mkt-chat-shell">
    <aside class="mkt-work-queue">
      <div class="mkt-work-filter active"><b>● 我的</b><span>0/0</span></div>
      <div class="mkt-work-filter"><b>⟲ 排队</b><span>2</span></div>
      <div class="mkt-work-filter"><b>♙ 全部</b></div>
      <div class="mkt-account-title">账号视图⇄ <span>•••</span></div>
      <div class="mkt-account-row"><span class="mkt-avatar tiny">图</span>Canna <span class="mkt-status-dot"></span></div>
      <div class="mkt-work-bottom">
        <div>⚙ 设置</div>
        <div class="mkt-auto-card"><span class="mkt-avatar tiny">图</span><b>自动分配</b><small>未开启</small><span>⌧</span></div>
      </div>
    </aside>
    <section class="mkt-work-list">
      <div class="mkt-work-head"><b>‹ 我的</b><div class="mkt-tool-icons">⚗ 🔍 ＋ ⇅ ⋯</div></div>
      <div class="mkt-under-tab">全部</div>
      <div class="mkt-list-empty">●<br>暂无消息</div>
    </section>
    <section class="mkt-work-main">
      <div class="mkt-illus-card"><div></div><span>⌕</span><b>●</b></div>
      <h3>当前没有已分配给你的对话</h3>
      <p>请检查现在是否开启自动分配,如果没有需要处理的对话，就休息一下吧!</p>
    </section>
    <button class="mkt-float-btn" data-demo-action="快捷工具已打开">▤</button>
  </div>`;
  return renderMarketingLayout("对话工作台", side, "mine", "workbench-filter", body);
}

function renderMarketingTags() {
  const side = [
    ["custom", "自定义标签"],
    ["wechat", "企微标签"],
    ["keyword", "关键词标签"],
  ];
  const bodyMap = {
    custom: renderCustomTags,
    wechat: renderWechatTags,
    keyword: renderKeywordTags,
  };
  return renderMarketingLayout("营销标签", side, state.marketingTagSub, "marketing-tag-sub", bodyMap[state.marketingTagSub]());
}

function renderTagPageHead(title, tip) {
  return `<div class="mkt-page-title">${title}</div>${renderMktTip(tip, "●")}`;
}

function renderCustomTags() {
  const rows = tagGroupRows[state.marketingTagTab] || tagGroupRows.customer;
  const label = state.marketingTagTab === "group" ? "自定义群聊标签" : "自定义客户标签";
  const tagCount = rows.reduce((total, row) => total + (row[2].match(/mkt-tag-chip/g) || []).length, 0);
  return `${renderTagPageHead("自定义标签", "仅可应用于系统内部，对当前小组生效的标签，可在侧边栏、客户分组、关键词打标签中快捷使用")}
    ${renderMktTabs([["customer", "自定义客户标签"], ["group", "自定义群聊标签"]], state.marketingTagTab, "marketing-tag-tab")}
    ${renderMktSearchRow([`请输入${label}`, `请输入${label}组`, "reset"])}
    <div class="mkt-section-card">
      <div class="mkt-section-head"><b>共 ${rows.length} 个标签组，${tagCount} 个标签</b><button class="button primary" data-modal="tagGroupTask">新建自定义标签组</button></div>
      ${renderMktTable(["标签组", "可见范围", "标签", "操作"], rows)}
    </div>`;
}

function renderWechatTags() {
  const rows = state.marketingTagTab === "personal"
    ? [["<b>Canna-gs47<br>58(0)</b>", "-", "", "", "", "", "<button class=\"link-button\" data-demo-action=\"编辑企微个人标签\">编辑</button>"]]
    : [["<b>客户等级(3)</b>", "可见小组:全部小组", "<span class=\"mkt-tag-chip\">一般</span> <span class=\"mkt-tag-chip\">重要</span> <span class=\"mkt-tag-chip\">核心</span>", "", "", "", ""]];
  return `${renderTagPageHead("企微标签", "企业微信企业标签: 同一主体下所有托管账号共享的标签体系，可以给主体下所有的客户打标签<br>企业微信个人标签: 某一托管账号专属的标签体系，仅支持给该账号下的客户打标签")}
    ${renderMktTabs([["enterprise", "企微企业标签"], ["personal", "企微个人标签"]], state.marketingTagTab, "marketing-tag-tab", "boxed")}
    ${renderMktSearchRow(["请输入标签", "请输入标签组", "reset"])}
    <div class="mkt-section-card">
      <div class="mkt-section-head"><b>共 1 个标签组，${state.marketingTagTab === "personal" ? "0" : "3"} 个标签</b><button class="button primary" data-demo-action="同步企微标签">${state.marketingTagTab === "personal" ? "同步企微个人标签" : "同步企微标签"}</button></div>
      ${state.marketingTagTab === "enterprise" ? `<div class="mkt-soft-note">🔔 新创建的标签默认全部小组可见，可见范围将影响标签数据统计，若仅对个别小组开放，请点击编辑修改可见小组</div>` : ""}
      <div class="mkt-tag-row">${rows[0].join("")}</div>
    </div>`;
}

function renderKeywordTags() {
  const rule = state.keywordTagTab === "rules";
  return `${renderTagPageHead("关键词标签", "需要设置关键词，关键词可设置多个，客户在发送的消息中命中一个关键词即可打上设置的标签，可选择此规则是否同步在群聊和私聊中生效，仅支持在互为好友时自动打标签")}
    ${renderMktTabs([["rules", "关键词标签规则"], ["records", "关键词标签记录"]], state.keywordTagTab, "keyword-tag-tab")}
    ${
      rule
        ? `${renderMktSearchRow(["请输入规则名称", "请输入关键词", "select:请选择关键词类型", "select:请选择生效主体", "select:请选择企微标签", "select:请选择自定义标签", "reset"], `<button class="button primary" data-modal="keywordTagTask">添加关键词标签</button>`)}
          ${renderMktTable(["关键词标签规则名称", "关键词类型", "关键词", "生效主体", "企微标签", "自定义标签", "操作"], keywordTagRows.rules)}`
        : `${renderMktSearchRow(["select:请选择规则名称", "select:请选择生效主体", "请输入客户名称", "date:触发时间 起始日期 至 结束日期", "reset"], `<button class="button primary" data-demo-action="导出关键词标签记录">导 出</button>`)}
          ${renderMktTable(["关键词标签规则名称", "生效主体", "时间", "客户名称/备注名", "企微标签", "自定义标签", "操作"], keywordTagRows.records)}`
    }`;
}

function renderMessageBlast() {
  const side = [
    ["private", "私聊群发"],
    ["group", "群聊群发"],
    ["moments", "朋友圈发送"],
  ];
  return renderMarketingLayout("消息群发", side, state.messageBlastSub, "message-blast-sub", renderBlastMain());
}

function renderBlastMain() {
  const isPrivate = state.messageBlastSub === "private";
  const isMoments = state.messageBlastSub === "moments";
  const title = isMoments ? "朋友圈发送" : `${isPrivate ? "私聊群发" : "群聊群发"}-高级版`;
  const tabs = isMoments ? [["tasks", "任务列表"], ["settings", "发送设置"]] : [["tasks", "任务列表"], ["cycle", "循环任务"], ["settings", "群发设置"]];
  const columns = state.messageBlastTab === "cycle"
    ? ["任务名称", "发送内容", "托管账号状态", "任务状态", "已循环次数", "操作"]
    : ["任务名称", "发送内容", "托管账号状态", "状态", "操作"];
  if (state.messageBlastTab === "settings") return renderBlastSettings(title);
  return `<div class="mkt-page-title with-tabs"><span>${title}</span>${renderMktTabs(tabs, state.messageBlastTab, "message-blast-tab")}</div>
    ${renderMktTip("高级群发是通过RPA模拟人工点击无需成员手动发送消息，不限制群发次数，全部自动化执行动作。若需要1分钟内完成全部群发任务请使用“极速版”发送。 查看版本区别", "●")}
    <div class="mkt-action-strip">
      ${state.messageBlastTab === "cycle" ? "<b>▣ 循环任务列表</b>" : ""}
      <span></span>
      <button class="button" data-demo-action="批量操作">▦</button>
      ${state.messageBlastTab === "tasks" ? `<button class="button" data-demo-action="批量取消">批量取消</button>` : ""}
      <button class="button primary" data-modal="blastTask">新建任务</button>
    </div>
    ${renderMktSearchRow(["请输入任务名称", "请输入任务id", "select:请选择创建者", "select:请选择托管账号", "reset"], `<button class="link-button" data-demo-action="展开更多筛选">展开⌄</button>`)}
    <div class="mkt-refresh">↻刷新${state.messageBlastTab === "cycle" ? "列表" : "进度"}</div>
    ${renderMktTable(columns, isMoments ? blastTaskRows.moments : blastTaskRows[state.messageBlastTab], state.messageBlastTab === "tasks")}`;
}

function renderBlastSettings(title) {
  return `<div class="mkt-page-title with-tabs"><span>${title}</span>${renderMktTabs([["tasks", "任务列表"], ["cycle", "循环任务"], ["settings", "群发设置"]], state.messageBlastTab, "message-blast-tab")}</div>
    ${renderMktTip("高级群发是通过RPA模拟人工点击无需成员手动发送消息，不限制群发次数，全部自动化执行动作。若需要1分钟内完成全部群发任务请使用“极速版”发送。 查看版本区别", "●")}
    <div class="mkt-settings-card">
      <div class="mkt-settings-head"><b>◈ 群发设置</b><span>注意：此配置生效于私聊SOP和私聊群发</span><button class="button primary" data-demo-action="编辑群发设置">编 辑</button></div>
      <div class="mkt-soft-note purple">● 群发设置功能主要用于控制托管账号发送频率，系统最低可设置“消息间隔与对象间隔”时间为3秒，最高为600秒（即十分钟），但3秒频率过高不建议使用，建议使用默认值</div>
      <div class="mkt-config-block"><h3>群发间隔</h3><p><b>* 每条消息发送间隔 ⓘ：</b><input class="input tiny-num" value="5" disabled> - <input class="input tiny-num" value="10" disabled> 秒</p><p><b>* 每个发送对象间隔 ⓘ：</b><input class="input tiny-num" value="30" disabled> - <input class="input tiny-num" value="60" disabled> 秒</p></div>
      <div class="mkt-config-block"><h3>可发送时间</h3><p><b>* 发送时间：</b> 全天发送</p></div>
      <div class="mkt-config-block"><h3>批次设置</h3><p><b>* 发送批次：</b> 不设置发送批次</p></div>
    </div>`;
}

function renderAutoFriend() {
  const side = [
    ["excel", "EXCEL加好友"],
    ["group", "群聊加好友"],
    ["card", "名片加好友"],
    ["api", "API加好友"],
    ["lost", "客户流失"],
    ["blacklist", "系统黑名单"],
  ];
  return renderMarketingLayout("自动加好友", side, state.autoFriendSub, "auto-friend-sub", renderAutoFriendMain());
}

function renderAutoFriendMain() {
  const titleMap = { excel: "Excel加好友", group: "群聊加好友", card: "名片加好友", api: "API加好友", lost: "客户流失", blacklist: "系统黑名单" };
  if (state.autoFriendSub !== "excel") {
    const config = {
      group: {
        tip: "从群聊成员中筛选目标客户并逐个发送好友申请，支持设置通过后标签和打招呼内容。",
        filters: ["请输入任务名称", "请输入群聊名称", "select:请选择任务状态", "reset"],
        headers: ["任务名称", "任务状态", "群聊名称", "待加人数", "加好友账号", "操作"],
        action: "添加群聊加好友任务",
      },
      card: {
        tip: "通过客户名片识别目标客户并执行加好友任务，适合销售名片流转场景。",
        filters: ["请输入任务名称", "请输入客户名称", "select:请选择任务状态", "reset"],
        headers: ["任务名称", "任务状态", "名片来源", "加好友账号", "打招呼", "操作"],
        action: "添加名片加好友任务",
      },
      api: {
        tip: "通过 API 写入客户手机号或微信号，由系统按频率自动发送好友申请。",
        filters: ["请输入任务名称", "select:请选择任务状态", "select:请选择API来源", "reset"],
        headers: ["任务名称", "任务状态", "API来源", "加好友账号", "接口状态", "操作"],
        action: "添加API加好友任务",
      },
      lost: {
        tip: "识别已删除或长时间未互动客户，按规则生成二次触达任务。",
        filters: ["请输入客户名称", "select:流失类型", "select:所属托管账号", "reset"],
        headers: ["客户名称", "流失类型", "所属账号", "最近互动", "处理状态", "操作"],
        action: "导出客户流失",
      },
      blacklist: {
        tip: "被加入系统黑名单的客户不会被自动加好友、拉群或群发触达。",
        filters: ["请输入客户名称", "select:黑名单来源", "reset"],
        headers: ["客户名称", "联系方式", "来源", "加入时间", "原因", "操作"],
        action: "添加黑名单",
      },
    }[state.autoFriendSub];
    const actionButton = state.autoFriendSub === "lost"
      ? `<button class="button primary" data-demo-action="${config.action}">导出</button>`
      : `<button class="button primary" data-modal="${state.autoFriendSub === "blacklist" ? "blacklistTask" : "autoFriendTask"}">${state.autoFriendSub === "blacklist" ? "添加黑名单" : "添加任务"}</button>`;
    return `<div class="mkt-page-title">${titleMap[state.autoFriendSub]}</div>
      ${renderMktTip(config.tip, "●")}
      <div class="mkt-section-line"><b>▣ ${titleMap[state.autoFriendSub]}列表</b><div><button class="button" data-demo-action="批量开始任务">批量开始任务</button><button class="button" data-demo-action="导出">导出</button>${actionButton}</div></div>
      ${renderMktSearchRow(config.filters)}
      ${renderMktTable(config.headers, autoFriendRows[state.autoFriendSub], state.autoFriendSub !== "lost")}`;
  }
  const metrics = [["导入数据", "2"], ["待发送总数", "60"], ["待通过总数", "18"], ["已添加总数", "31"], ["失败总数", "11"], ["总添加成功率", "52%"], ["首次加好友成功率", "43%"]];
  return `<div class="mkt-page-title">Excel加好友</div>
    ${renderMktTip("系统将按加好友时间间隔逐个发送请求。手动任务仅在每日09:00-21:00发送好友申请，每个托管账号发送好友申请的间隔为600-900秒，可在加好友设置中修改 修改加好友设置", "●")}
    <div class="mkt-stat-row">${metrics.map(([label, value]) => `<div><span>${label}</span><b>${value}</b></div>`).join("")}</div>
    <div class="mkt-section-line"><b>▣ 任务列表</b><div><button class="button" data-demo-action="批量开始任务">批量开始任务 ⌄</button><button class="button" data-demo-action="导出任务">导出</button><button class="button primary" data-modal="autoFriendTask">添加任务</button></div></div>
    ${renderMktSearchRow(["select:请选择任务状态", "reset"])}
    ${renderMktTable(["任务名称", "任务状态", "加好友账号", "加好友账号ID", "加好友后打标签", "打招呼", "操作"], autoFriendRows.excel, true)}`;
}

function renderMarketingOperation() {
  const side = [
    ["keywordReply", "关键词回复"],
    ["keywordGroup", "关键词拉群"],
    ["newCustomer", "新客户SOP"],
    ["privateSop", "私聊SOP"],
    ["groupSop", "群聊SOP"],
    ["momentsSop", "朋友圈SOP"],
    ["tagSop", "标签SOP"],
    ["template", "SOP模板"],
    ["batchGroup", "批量拉群"],
    ["tagGroup", "标签拉群"],
  ];
  return renderMarketingLayout("自动化运营", side, state.operationSub, "operation-sub", renderOperationMain());
}

function renderOperationMain() {
  if (state.operationSub === "keywordGroup") return renderKeywordGroupPage();
  if (state.operationSub === "newCustomer") return renderNewCustomerSopPage();
  if (state.operationSub === "template") return renderSopTemplatePage();
  if (["privateSop", "groupSop", "momentsSop", "tagSop"].includes(state.operationSub)) return renderSopTaskPage();
  if (["batchGroup", "tagGroup"].includes(state.operationSub)) return renderBatchGroupPage();
  const tab = state.operationTab;
  return `<div class="mkt-page-title with-tabs"><span>关键词回复</span>${renderMktTabs([["content", "关键词回复"], ["advanced", "高级设置"]], tab === "advanced" ? "advanced" : "content", "operation-top-tab")}</div>
    ${tab === "advanced" ? renderOperationAdvanced() : renderKeywordReplyList()}`;
}

function renderKeywordGroupPage() {
  const record = state.operationTab === "records";
  return `<div class="mkt-page-title with-tabs"><span>关键词拉群</span>${renderMktTabs([["content", "关键词拉群"], ["records", "触发记录"]], state.operationTab === "records" ? "records" : "content", "operation-tab")}</div>
    ${record
      ? `${renderMktSearchRow(["select:请选择规则名称", "select:请选择生效主体", "请输入客户名称", "date:触发时间 起始日期 至 结束日期", "reset"], `<button class="button primary" data-demo-action="导出关键词拉群记录">导出</button>`)}${renderMktTable(["规则名称", "生效主体", "客户名称", "触发关键词", "触发时间", "操作"], operationRows.keywordGroupRecords)}`
      : `${renderMktSearchRow(["请输入规则名称", "请输入关键词", "select:请选择生效主体", "select:请选择群聊", "reset"], `<button class="button primary" data-modal="keywordGroupTask">添加关键词拉群</button>`)}${renderMktTable(["任务名称", "触发关键词", "匹配规则", "生效范围", "目标群聊", "自动拉群开关", "操作"], operationRows.keywordGroup, true)}`}`;
}

function renderNewCustomerSopPage() {
  const tabs = [["content", "新客户SOP"], ["settings", "拉群设置"], ["welcome", "欢迎语设置"], ["records", "操作日志"]];
  if (state.operationTab === "settings") {
    return `<div class="mkt-page-title with-tabs"><span>新客户SOP</span>${renderMktTabs(tabs, "settings", "operation-tab")}</div>
      <div class="mkt-settings-card"><div class="mkt-settings-head"><b>拉群设置</b><button class="button primary" data-demo-action="保存拉群设置">保存</button></div>
      <div class="mkt-config-block"><h3>自动拉群</h3><p><label><input type="checkbox" checked> 客户通过好友验证后自动邀请入群</label></p><p><b>默认目标群：</b><button class="mkt-select">请选择群聊 <span>⌄</span></button></p></div></div>`;
  }
  if (state.operationTab === "welcome") {
    return `<div class="mkt-page-title with-tabs"><span>新客户SOP</span>${renderMktTabs(tabs, "welcome", "operation-tab")}</div>
      <div class="mkt-section-line"><b>欢迎语设置</b><button class="button primary" data-modal="sopTask">新建欢迎语</button></div>
      ${renderMktTable(["欢迎语名称", "发送内容", "生效账号", "状态", "操作"], operationRows.welcome)}`;
  }
  if (state.operationTab === "records") {
    return `<div class="mkt-page-title with-tabs"><span>新客户SOP</span>${renderMktTabs(tabs, "records", "operation-tab")}</div>
      ${renderMktSearchRow(["请输入客户名称", "select:请选择托管账号", "date:开始日期 至 结束日期", "reset"])}
      ${renderMktTable(["时间", "客户名称", "触发动作", "托管账号", "执行状态", "操作"], operationRows.records)}`;
  }
  return `<div class="mkt-page-title with-tabs"><span>新客户SOP</span>${renderMktTabs(tabs, "content", "operation-tab")}</div>
    <div class="mkt-action-strip"><span></span><button class="button" data-demo-action="批量开始SOP">批量开始</button><button class="button primary" data-modal="sopTask">新建应答SOP</button></div>
    ${renderMktSearchRow(["请输入任务名称", "select:请选择状态", "select:请选择托管账号", "reset"])}
    ${renderMktTable(["任务名称", "发送内容", "托管账号", "生效客户", "状态", "操作"], operationRows.newCustomer, true)}`;
}

function renderSopTaskPage() {
  const titleMap = { privateSop: "私聊SOP", groupSop: "群聊SOP", momentsSop: "朋友圈SOP", tagSop: "标签SOP" };
  const title = titleMap[state.operationSub];
  const settingLabel = state.operationSub === "privateSop" ? "群发设置" : "高级设置";
  if (state.operationTab === "advanced") {
    return `<div class="mkt-page-title with-tabs"><span>${title}</span>${renderMktTabs([["content", title], ["advanced", settingLabel]], "advanced", "operation-tab")}</div>
      <div class="mkt-settings-card"><div class="mkt-settings-head"><b>${settingLabel}</b><button class="button primary" data-demo-action="编辑${settingLabel}">编辑</button></div>
      <div class="mkt-config-block"><h3>发送间隔</h3><p><b>* 每条消息发送间隔：</b><input class="input tiny-num" value="5" disabled> - <input class="input tiny-num" value="10" disabled> 秒</p></div>
      <div class="mkt-config-block"><h3>可发送时间</h3><p><b>* 发送时间：</b> 全天发送</p></div></div>`;
  }
  return `<div class="mkt-page-title with-tabs"><span>${title}</span>${renderMktTabs([["content", title], ["advanced", settingLabel]], "content", "operation-tab")}</div>
    <div class="mkt-section-line"><b>▣ ${title}列表</b><button class="button primary" data-modal="sopTask">新建SOP</button></div>
    ${renderMktSearchRow(["请输入任务名称", "select:请选择托管账号", "select:请选择状态", "reset"])}
    ${renderMktTable(["任务名称", "发送内容", "托管账号状态", "任务状态", "发送对象", "操作"], operationRows[state.operationSub], true)}`;
}

function renderSopTemplatePage() {
  const cards = ["加好友后3天转化SOP", "物流报价跟进SOP", "沉默客户唤醒SOP", "入群后欢迎SOP"];
  return `<div class="mkt-page-title">SOP模板</div>
    <div class="mkt-doc-grid">${cards.map((title) => `<div class="mini-card"><b>${title}</b><p class="subtle">可复制为私聊、群聊或标签SOP任务。</p><button class="button primary small" data-demo-action="使用${title}">使用模板</button></div>`).join("")}</div>`;
}

function renderBatchGroupPage() {
  const isTag = state.operationSub === "tagGroup";
  return `<div class="mkt-page-title">${isTag ? "标签拉群" : "批量拉群"}</div>
    <div class="mkt-section-line"><b>${isTag ? "标签拉群任务" : "批量拉群任务"}</b><button class="button primary" data-modal="keywordGroupTask">${isTag ? "新建标签拉群" : "新建任务"}</button></div>
    ${renderMktSearchRow(["请输入任务名称", isTag ? "select:请选择客户标签" : "select:请选择客户", "select:请选择群聊", "reset"])}
    ${renderMktTable(["任务名称", isTag ? "客户标签" : "选择客户", "目标群聊", "托管账号", "任务状态", "操作"], operationRows[state.operationSub], true)}`;
}

function renderKeywordReplyList() {
  return `${renderMktTabs([["content", "关键词回复内容"], ["records", "触发记录"]], state.operationTab, "operation-tab", "boxed")}
    <div class="mkt-action-strip">
      <span></span>
      <button class="button" data-demo-action="批量打运营标签">批量打运营标签 ⌄</button>
      <button class="button" data-demo-action="批量开始任务">批量开始任务 ⌄</button>
      <button class="button" data-demo-action="批量删除">批量删除</button>
      <button class="button" data-modal="keywordReplyTask">批量添加</button>
      <button class="button primary" data-modal="keywordReplyTask">添加关键词回复</button>
    </div>
    ${renderMktSearchRow(["请输入任务名...", "请输入关键词", "select:请选择关键词类型", "select:请选择匹配规则", "select:请选择生效范围", "select:请选择运营标签", "reset"])}
    ${state.operationTab === "records"
      ? renderMktTable(["规则名称", "客户名称", "触发关键词", "触发时间", "状态", "操作"], operationRows.keywordReplyRecords)
      : renderMktTable(["任务名称", "触发关键字", "关键词类型", "匹配规则", "生效范围", "回复素材", "自动回复开", "操作"], operationRows.keywordReply, true)}`;
}

function renderOperationAdvanced() {
  return `<div class="mkt-settings-card">
    <div class="mkt-settings-head"><b>高级设置</b><button class="button primary" data-demo-action="保存高级设置">保存设置</button></div>
    <div class="mkt-config-block"><h3>回复限制</h3><p><label><input type="checkbox" checked> 同一客户命中同一规则后 24 小时内只回复一次</label></p><p><label><input type="checkbox"> 仅在工作时间内触发关键词回复</label></p></div>
    <div class="mkt-config-block"><h3>生效对象</h3><p><label><input type="radio" checked> 私聊和群聊均生效</label> &nbsp; <label><input type="radio"> 仅私聊</label> &nbsp; <label><input type="radio"> 仅群聊</label></p></div>
  </div>`;
}

function renderMarketingGroups() {
  const side = [
    ["welcome", "入群欢迎语"],
    ["robot", "自动踢人"],
    ["invite", "接受群邀请"],
    ["transfer", "多群转播"],
  ];
  return renderMarketingLayout("群聊管理", side, state.groupManageSub, "group-manage-sub", renderGroupManageMain());
}

function renderGroupManageMain() {
  const title = { welcome: "入群欢迎语", robot: "自动踢人", invite: "接受群邀请", transfer: "多群转播" }[state.groupManageSub];
  const headers = state.groupManageSub === "welcome" ? ["任务名称", "入群欢迎语", "发送外部客户名片", "生效群聊", "状态", "操作"] : ["任务名称", "规则内容", "生效群聊", "状态", "操作"];
  if (state.groupManageTab === "advanced") {
    const tips = {
      welcome: "欢迎语发送频率、成员入群识别和外部客户名片发送配置。",
      robot: "自动踢人用于按关键词、群成员身份和黑名单规则清理群成员。",
      invite: "接受群邀请用于控制托管账号是否自动同意客户邀请入群。",
      transfer: "多群转播用于把一个群的消息同步转发到多个目标群。",
    };
    return `<div class="mkt-page-title with-tabs"><span>${title}</span>${renderMktTabs([["welcome", title], ["advanced", "高级配置"]], "advanced", "group-manage-tab")}</div>
      <div class="mkt-settings-card">
        <div class="mkt-settings-head"><b>高级配置</b><button class="button primary" data-demo-action="保存${title}高级配置">保存</button></div>
        <div class="mkt-soft-note purple">● ${tips[state.groupManageSub]}</div>
        <div class="mkt-config-block"><h3>生效群聊</h3><p><button class="mkt-select">请选择群聊 <span>⌄</span></button></p></div>
        <div class="mkt-config-block"><h3>执行限制</h3><p><label><input type="checkbox" checked> 仅对外部客户生效</label></p><p><label><input type="checkbox"> 命中黑名单时暂停执行</label></p></div>
      </div>`;
  }
  return `<div class="mkt-page-title with-tabs"><span>${title}</span>${renderMktTabs([["welcome", title], ["advanced", "高级配置"]], state.groupManageTab, "group-manage-tab")}</div>
    <div class="mkt-section-line"><b>▣ ${title}</b><button class="button primary" data-modal="groupManageTask">添加${title}</button></div>
    ${renderMktSearchRow(["请输入任务名称", "请输入群聊名称", "reset"])}
    ${renderMktTable(headers, groupManageRows[state.groupManageSub])}`;
}

function renderMarketingAccounts() {
  if (state.marketingAccountTab === "rules") {
    return `<section class="mkt-full-page">
      <div class="mkt-context-line">AI微信营销 · 托管账号</div>
      <div class="mkt-page-title with-tabs"><span>托管账号</span>${renderMktTabs([["accounts", "托管账号"], ["rules", "聚合规则"], ["advanced", "高级设置"]], "rules", "marketing-account-tab")}</div>
      <div class="mkt-section-line"><b>聚合规则</b><button class="button primary" data-modal="ruleConfig">添加规则</button></div>
      ${renderMktSearchRow(["请输入规则名称", "select:请选择托管账号", "select:请选择AI助手", "reset"])}
      ${renderMktTable(["规则名称", "托管账号", "消息接收", "AI回复", "绑定助手", "操作"], [["测试", "Canna", "<span class=\"switch on\" data-switch></span>", "<span class=\"switch on\" data-switch></span>", "canna测试", "<button class=\"link-button\" data-modal=\"ruleConfig\">配置</button>"]])}
    </section>`;
  }
  if (state.marketingAccountTab === "advanced") {
    return `<section class="mkt-full-page">
      <div class="mkt-context-line">AI微信营销 · 托管账号</div>
      <div class="mkt-page-title with-tabs"><span>托管账号</span>${renderMktTabs([["accounts", "托管账号"], ["rules", "聚合规则"], ["advanced", "高级设置"]], "advanced", "marketing-account-tab")}</div>
      <div class="settings-list">
        <div class="setting-row"><b>同步群聊中全部对话内容</b><span class="switch on" data-switch></span></div>
        <div class="setting-row"><b>AI群聊回复仅回复非企业员工的问题</b><span class="switch" data-switch></span></div>
        <div class="setting-row"><b>终端设备手动回复后切换至人工服务</b><span class="switch on" data-switch></span></div>
        <div class="setting-row vertical"><b>群聊触发关键词</b><input class="input" value="@Canna, 报价, 物流"></div>
      </div>
    </section>`;
  }
  const rows = [["<span class=\"mkt-avatar tiny\">图</span> Canna", "<span class=\"tag green\">在线</span>", "Canna", "8018", "<span class=\"switch on\" data-switch></span>", "<button class=\"button small\" data-demo-action=\"账号控制台\">控制台</button>"]];
  return `<section class="mkt-full-page">
    <div class="mkt-context-line">AI微信营销 · 托管账号</div>
    <div class="mkt-page-title with-tabs"><span>托管账号</span>${renderMktTabs([["accounts", "托管账号"], ["rules", "聚合规则"], ["advanced", "高级设置"]], state.marketingAccountTab, "marketing-account-tab")}</div>
    <div class="mkt-section-line"><b>托管账号列表</b><button class="button primary" data-modal="authAccount">添加账号</button></div>
    ${renderMktSearchRow(["请输入托管账号名称", "select:请选择托管账号状态", "reset"])}
    ${renderMktTable(["账号信息", "状态", "托管账号", "账号ID", "消息接收", "操作"], rows)}
  </section>`;
}

function renderMaterials() {
  const topTabs = [["personal", "个人素材"], ["group", "小组素材"], ["enterprise", "企业素材"]];
  const types = [["all", "全部"], ["text", "文本话术"], ["image", "图片"], ["web", "网页"], ["video", "视频"], ["voice", "语音"], ["file", "文件"], ["mini", "小程序"], ["emoji", "表情包"], ["card", "名片"], ["channel", "视频号"]];
  return `<section class="mkt-material-page">
    <div class="mkt-page-title with-tabs"><span>基础素材</span>${renderMktTabs(topTabs, state.materialScope, "material-scope")}</div>
    <div class="mkt-material-body">
      <aside class="mkt-material-side">
        <h3>▰ 基础素材分组</h3>
        <input class="input" placeholder="请输入分组名称">
        <button class="mkt-material-group active">⋮ 默认分组 <span>•••</span></button>
        <button class="link-button mkt-add-group" data-modal="materialGroupTask">＋ 新增分组</button>
      </aside>
      <main>
        <div class="mkt-section-line"><b>默认分组</b><div><button class="button" data-modal="materialTask">批量添加</button><button class="button primary" data-modal="materialTask">添加素材</button></div></div>
        ${renderMktTabs(types, state.materialType, "material-type", "boxed dense")}
        ${renderMktSearchRow(["请输入素材标题", "reset"])}
        <div class="mkt-section-card">
          <div class="mkt-section-head"><b>共 ${materialRows.length} 条素材</b><div><button class="button" data-demo-action="批量移动分组">批量移动分组</button><button class="button" data-demo-action="批量删除素材">批量删除</button></div></div>
          ${renderMktTable(["素材标题", "素材摘要", "类型", "更新时间", "操作"], materialRows, true)}
        </div>
      </main>
    </div>
  </section>`;
}

function renderAntiSeal() {
  if (state.antiSealTab === "settings") {
    return `<section class="mkt-full-page">
      <div class="mkt-page-title with-tabs"><span>加好友设置</span>${renderMktTabs([["accounts", "加好友托管账号"], ["settings", "加好友设置"]], state.antiSealTab, "anti-seal-tab")}</div>
      <div class="mkt-settings-card">
        <div class="mkt-settings-head"><b>加好友设置</b><button class="button primary" data-demo-action="保存加好友设置">保存</button></div>
        <div class="mkt-config-block"><h3>发送时间</h3><p><b>* 手动任务发送时间：</b> 每日 09:00 - 21:00</p></div>
        <div class="mkt-config-block"><h3>发送间隔</h3><p><b>* 每个托管账号发送间隔：</b><input class="input tiny-num" value="600"> - <input class="input tiny-num" value="900"> 秒</p><p><b>* 同一客户重复添加间隔：</b><input class="input tiny-num" value="30"> 天</p></div>
        <div class="mkt-config-block"><h3>通过验证设置</h3><p><label><input type="checkbox" checked> 通过好友后自动发送欢迎语</label></p><p><label><input type="checkbox" checked> 通过后自动打标签</label></p></div>
      </div>
    </section>`;
  }
  const rows = [["<span class=\"mkt-avatar tiny\">图</span> Canna", "<span class=\"tag green\">空闲中</span>", "-", "-", "-", "<span class=\"switch on\" data-switch></span>", "<button class=\"link-button\" data-demo-action=\"开始养号\">开始养号</button>"]];
  const metrics = [["在线中的账号数", 1], ["已掉线的账号数", 0], ["同步数据中的账号数", 0], ["被限制养号中的账号数", 0], ["手动养号中的账号数", 0], ["涨粉中的账号数", 0], ["空闲中的账号数", 0]];
  return `<section class="mkt-full-page">
    <div class="mkt-page-title with-tabs"><span>加好友设置</span>${renderMktTabs([["accounts", "加好友托管账号"], ["settings", "加好友设置"]], state.antiSealTab, "anti-seal-tab")}</div>
    <div class="mkt-section-title">▥ 执行加好友任务账号数据</div>
    <div class="mkt-stat-row compact">${metrics.map(([label, value]) => `<div><span>${label}</span><b>${value}</b></div>`).join("")}</div>
    <div class="mkt-section-title">▣ 加好友账号列表</div>
    ${renderMktSearchRow(["select:请选择所属托管账号", "reset"])}
    ${renderMktTable(["加好友账号", "加好友状态", "养号剩余时长", "昨日加好友率", "当前执行的加好友任务", "执行API加好友任务 ⓘ", "操作"], rows)}
    <div class="mkt-pagination">共 1 条  ‹ <button class="button small active">1</button> › <button class="button small">10 条/页⌄</button></div>
  </section>`;
}

function renderMarketingRecords() {
  return `<section class="mkt-record-page">
    <div class="mkt-record-filters">
      ${renderMktSearchRow(["搜索聊天内容", "搜索好友或群", "select:搜索小组成员名称", "date:2026-06-13　至　2026-06-20", "select:聊天类型", "select:所属托管账号", "reset"], `<button class="button" data-demo-action="下载聊天记录">⇩</button><button class="button primary" data-demo-action="搜索聊天记录">搜 索</button>`)}
    </div>
    <div class="mkt-record-body">
      <aside class="mkt-record-list">
        <h3>全部聊天</h3>
        <div class="mkt-record-item active"><span class="mkt-photo"></span><div><b>Canna郑</b><p>您好，我可以为您解答物流相关的...</p></div><span>星期五<br>💬</span></div>
        <div class="mkt-record-item"><span class="mkt-photo grid"></span><div><b>欧诚国际物流&集简...</b><p>Canna郑：@郑楚佳 给我一个总价 我...</p></div><span>星期五</span></div>
      </aside>
      <main class="mkt-record-chat">
        <div class="mkt-record-chat-head"><span class="mkt-photo"></span><b>Canna郑</b><small>所属账号： Canna 💬</small></div>
        <div class="mkt-record-more">查看更多消息⌃</div>
        <div class="mkt-record-message left"><span class="mkt-photo"></span><div><b>Canna郑 <em>@微信</em></b><p>你好，你能物流报价吗</p><time>06/18 17:40</time></div></div>
        <div class="mkt-record-message right"><div><label>AI-API</label><p>您好，我可以为您解答物流相关的问题，不过暂时无法直接提供物流报价哦。您可以告知我发货地、收货地、货物类型（比如大件/小件、是否易碎品等）、重量体积以及运输时效要求这些信息，我可以帮您查询大致的物流计费规则或者帮您了解常见的物流报价影响因素。</p><time>06/18 17:40</time></div><span class="mkt-avatar tiny">图</span></div>
        <div class="mkt-record-message left"><span class="mkt-photo"></span><div><b>Canna郑 <em>@微信</em></b><p>你好，你能物流报价吗</p><time>06/19 22:45</time></div></div>
        <div class="mkt-record-message right"><div><label>AI-API</label><p>您好，我可以为您解答物流相关的计费规则、报价影响因素等问题，暂时无法直接提供精准的物流报价哦。如果您需要了解大致的报价参考，可以告诉我：发货地、收货地、货物的重量/体积、货物类型以及期望的运输方式，我可以帮您整理相关的报价参考信息。</p><time>06/19 22:46</time></div><span class="mkt-avatar tiny">图</span></div>
      </main>
    </div>
  </section>`;
}

function renderMarketingDocs() {
  return renderMarketingLayout("教学文档", [["intro", "功能介绍"], ["quick", "快速开始"], ["faq", "常见问题"]], "intro", "marketing-doc-sub", `<div class="mkt-page-title">教学文档</div><div class="mkt-doc-grid">${["AI微信营销功能介绍", "如何配置自动加好友", "如何创建群发任务", "如何管理素材库"].map((title) => `<div class="mini-card"><b>${title}</b><p class="subtle">查看配置说明与演示步骤。</p><button class="link-button" data-demo-action="打开${title}">查看文档</button></div>`).join("")}</div>`);
}
