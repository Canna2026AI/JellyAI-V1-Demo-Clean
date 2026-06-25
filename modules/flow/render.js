// AI flow module renderers.

function renderFlowPage() {
  if (state.flowEditing) return renderFlowEditor();
  return `
    <section class="flow-shell">
      ${renderFlowSubnav()}
      <main class="flow-main">
        ${state.flowSub === "template" ? renderFlowTemplateList() : renderMyFlowList()}
      </main>
    </section>`;
}

function renderFlowSubnav() {
  return `<aside class="flow-subnav">
    <div class="flow-subnav-title">AI流程</div>
    <button class="${state.flowSub === "template" ? "active" : ""}" data-flow-sub="template">流程模板</button>
    <button class="${state.flowSub === "mine" ? "active" : ""}" data-flow-sub="mine">我的流程</button>
  </aside>`;
}

function renderFlowTemplateList() {
  const tabs = [
    ["all", "全部"],
    ["app", "应用事件触发"],
    ["dialog", "对话内容触发"],
    ["timer", "定时启动触发"],
  ];
  const list = flowTemplates.filter((item) => state.flowTemplateFilter === "all" || item.category === state.flowTemplateFilter);
  return `
    <div class="flow-page-head">
      <h1>模板列表</h1>
      <p>AI流程利用AI大模型能力配合意图与软件应用接口能力构建智能化业务流程</p>
      <input class="input flow-search" placeholder="搜索名称或描述">
      <div class="flow-tabs">
        ${tabs.map(([id, label]) => `<button class="${state.flowTemplateFilter === id ? "active" : ""}" data-flow-template-filter="${id}">${label}</button>`).join("")}
      </div>
    </div>
    ${list.length ? `<div class="flow-template-grid">${list.map(renderFlowTemplateCard).join("")}</div>` : renderFlowEmpty("暂无数据")}
  `;
}

function renderFlowTemplateCard(item) {
  return `<article class="flow-template-card">
    <div class="flow-template-top">
      <span class="flow-app-icon ${item.iconClass}">${item.icon}</span>
      <div>
        <h3>${item.title}</h3>
        <p>${item.desc}</p>
      </div>
    </div>
    <div class="flow-template-foot">
      <div>
        <p>状态: 已发布</p>
        <p>模板ID: ${item.templateId}</p>
      </div>
      <button class="button" data-flow-template-view="${item.id}">查看</button>
    </div>
  </article>`;
}

function renderMyFlowList() {
  const tabs = [
    ["all", "全部"],
    ["content", "内容触发"],
    ["timer", "定时触发"],
    ["event", "事件触发"],
  ];
  return `
    <div class="flow-page-head">
      <h1>流程列表</h1>
      <p>AI流程利用AI大模型能力配合意图与软件应用接口能力构建智能化业务流程</p>
      <div class="flow-actions-row">
        <button class="button primary" data-modal="createFlow">＋ 创建流程</button>
        <input class="input flow-search" placeholder="搜索名称或描述">
      </div>
      <div class="flow-tabs">
        ${tabs.map(([id, label]) => `<button class="${state.flowMyFilter === id ? "active" : ""}" data-flow-my-filter="${id}">${label}</button>`).join("")}
      </div>
    </div>
    ${renderFlowEmpty("暂未创建流程")}
  `;
}

function renderFlowEmpty(text) {
  return `<div class="flow-empty">
    <div class="flow-empty-figure"></div>
    <div>${text}</div>
  </div>`;
}

function renderFlowEditor() {
  return `<section class="flow-editor-page">
    <div class="flow-editor-crumb">123 <span>›</span> 创建流程</div>
    <div class="flow-editor-body">
      <aside class="flow-editor-side">
        <div class="flow-editor-group">基础设置</div>
        <button class="active">◎ 流程设置</button>
        <button class="disabled">⌘ 流程测试</button>
        <button class="disabled">▤ 流程日志 ⟳</button>
      </aside>
      <main class="flow-editor-main">
        <section class="flow-form-block">
          <h3>流程指导说明 <span>*</span></h3>
          <p>指导AI如何执行此流程。示例：当抖音私信收到消息时，回复用户的问题，并使用抖音:发送私信给用户，将回复内容发给用户</p>
          <div class="flow-rich-editor">
            <div class="editor-toolbar"><b>B</b><b>H</b><span>▣</span><span>☷</span><span>☰</span><button class="link-button">〔x〕 插入变量</button></div>
            <div class="rich-editor" contenteditable="true"></div>
            <button class="link-button">展开</button>
          </div>
        </section>
        <section class="flow-form-block">
          <h3>选择模型</h3>
          <p>请选择流程执行时所依赖的模型类型</p>
          <button class="flow-model-row" data-flow-model-picker>
            <span class="flow-app-icon blue">山</span>
            <span>自动选择 doubao-seed-2.0-mini-260215</span>
            <em>内置</em>
            <b>⌘</b>
          </button>
        </section>
        <section class="flow-form-block">
          <h3>触发事件 <span>*</span></h3>
          <p>当指定条件满足时触发流程，支持对话内容，定时启动，第三方应用事件触发等多种方式</p>
          <button class="flow-dashed-button" data-modal="addFlowTrigger">＋ 添加触发事件</button>
        </section>
        <section class="flow-form-block">
          <h3>执行动作 <span>*</span></h3>
          <p>选择触发应用动作，当此应用动作事件产生时将自动触发流程</p>
          <button class="flow-dashed-button" data-modal="addFlowAction">＋ 添加执行动作</button>
        </section>
        <div class="flow-editor-footer">
          <button class="button" data-flow-back>返回</button>
          <button class="button disabled">⌘ 测试</button>
          <button class="button disabled">完成并退出</button>
        </div>
      </main>
    </div>
  </section>`;
}
