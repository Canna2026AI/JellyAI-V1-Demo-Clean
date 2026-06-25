// AI agent module renderers.

function renderAiList() {
  const content = {
    assistant: renderAssistantManager,
    knowledge: renderKnowledgeManager,
    skill: renderSkillManager,
    tool: renderToolManager,
    auto: renderAutomationManager,
    intent: renderIntentManager,
    summary: renderAiSummaryManager,
  }[state.assistantSub];
  return `
    <section class="module-layout">
      ${renderAiSubnav()}
      ${content ? content() : renderAiPlaceholder()}
    </section>`;
}

function renderAiSubnav(active = state.assistantSub) {
  return `<aside class="subnav">
    <div class="subnav-title">AI智能体</div>
    ${assistantSubs
      .map(
        ([id, label, icon]) => `<div class="subnav-item ${active === id ? "active" : ""}" data-assistant-sub="${id}"><span class="subnav-icon">${icon}</span><span>${label}</span></div>`
      )
      .join("")}
  </aside>`;
}

function renderAssistantManager() {
  ensureAgentState();
  const agents = getAgents();
  return `<div class="module-content">
    <div class="toolbar compact-toolbar">
      <div>
        <h1 class="page-title">对话智能体</h1>
      </div>
      <input class="input search-input" data-agent-search placeholder="搜索名称或描述" value="${escapeHtml(state.agentSearchQuery)}" />
    </div>
    <div class="assistant-actions">
      <button class="button primary" data-modal="createAssistant">＋ 创建AI助手</button>
      <div class="skill-filter-tabs">
        ${[
          ["all", "全部"],
          ["enabled", "已启用"],
          ["disabled", "已停用"],
        ]
          .map(([id, label]) => `<button class="${state.agentStatusFilter === id ? "active" : ""}" data-agent-filter="${id}">${label}</button>`)
          .join("")}
      </div>
      <button class="link-button" data-demo-action="打开 AI 智能体帮助文档">帮助文档</button>
    </div>
    <div class="assistant-card-row">
      ${
        agents.length
          ? agents
              .map(
                (agent) => `
        <div class="card assistant-card" data-open-assistant="${agent.id}">
          <div style="display:flex; gap:12px; align-items:center">
            ${iconBox("AI")}
            <div>
              <div style="font-weight:700">${escapeHtml(agent.name)}</div>
              <div class="subtle assistant-card-desc">${escapeHtml(agent.description)}</div>
              <span class="tag ${agent.status === "enabled" ? "green" : "red"}">${agent.status === "enabled" ? "已启用" : "已停用"}</span>
            </div>
          </div>
          <button class="button ghost small" data-agent-status-toggle="${agent.id}">${agent.status === "enabled" ? "停用" : "启用"}</button>
        </div>`
              )
              .join("")
          : `<div class="card empty agent-empty-state"><b>暂无智能体</b><span>请创建智能体，或调整搜索和筛选条件。</span><button class="button primary" data-modal="createAssistant">＋ 创建AI助手</button></div>`
      }
    </div>
  </div>`;
}

function renderKnowledgeManager() {
  const filteredKnowledgeBases = getAgentKnowledgeBases();
  return `<div class="module-content ai-manager-page">
    <div class="knowledge-list-head">
      <div>
        <h1 class="page-title">知识库列表</h1>
        <div class="subtle">您可以通过上传文档，数据库，网站页面等方式创建知识内容，AI应用可以基于此知识进行对话 <button class="link-button" data-demo-action="查看知识库说明">了解更多</button></div>
      </div>
      <div class="capacity">空间容量： 12.96KB / 1024M</div>
    </div>
    <div class="knowledge-tools">
      <button class="button primary" data-page="knowledgeCreate">＋ 新增知识库</button>
      <input class="input search-input" data-agent-knowledge-search placeholder="搜索名称" value="${escapeHtml(state.agentKnowledgeSearchQuery)}" />
    </div>
    <div class="knowledge-card-grid">
      ${filteredKnowledgeBases.length ? filteredKnowledgeBases.map(renderKnowledgeCard).join("") : `<div class="card empty agent-empty-state"><b>暂无知识库</b><span>请调整搜索条件或新增知识库。</span><button class="button primary" data-page="knowledgeCreate">＋ 新增知识库</button></div>`}
    </div>
  </div>`;
}

function renderKnowledgeCard(kb) {
  return `<div class="knowledge-card">
    <div class="knowledge-card-icon">${kb.icon}</div>
    <div class="knowledge-card-name">${kb.name}</div>
    <div class="knowledge-card-count">▧ ${kb.count}</div>
    <div class="knowledge-card-footer">
      <span class="tag green">${kb.type}</span>
      <div>
        <button class="button ghost small" data-modal="deleteKnowledge">删除</button>
        <button class="button small" data-page="knowledgeCreate">配置</button>
      </div>
    </div>
  </div>`;
}

function renderSkillManager() {
  const filtered = getFilteredSkills();
  return `<div class="module-content skill-manager-page">
    <div class="skill-page-head">
      <h1 class="page-title">AI技能</h1>
      <div class="subtle">统一管理智能体技能与技能模板，让自动化能力快速落地。</div>
    </div>
    ${state.skillGuideVisible ? renderSkillGuide() : ""}
    <div class="skill-toolbar">
      <button class="button dark" data-skill-create>＋ 创建技能</button>
      <input class="input skill-search" data-skill-search placeholder="搜索技能名称或描述" value="${escapeHtml(state.skillSearchQuery)}" />
      <div class="skill-filter-tabs">
        ${[
          ["all", "全部技能"],
          ["mine", "我的技能"],
          ["template", "技能模板"],
        ]
          .map(([id, label]) => `<button class="${state.skillFilter === id ? "active" : ""}" data-skill-filter="${id}">${label}</button>`)
          .join("")}
      </div>
      <button class="select-like skill-channel" data-skill-channel><span>全部渠道</span><span>⌄</span></button>
    </div>
    <div class="skill-grid">
      ${filtered.length ? filtered.map(renderSkillCard).join("") : `<div class="card empty agent-empty-state"><b>暂无技能</b><span>请调整筛选条件，或创建一个新技能。</span><button class="button dark" data-skill-create>＋ 创建技能</button></div>`}
    </div>
  </div>`;
}

function renderSkillGuide() {
  const cards = [
    ["book", "什么是 AI 技能?", "AI 技能是可以执行真实动作的智能模块，通过调用 API 完成查询、写入、更新等操作，而不仅仅是回答问题。", "查看介绍"],
    ["bolt", "如何创建第一个技能?", "选择模板或自定义创建，配置触发条件与 API 连接，即可让 AI 自动完成复杂任务，无需编写代码。", "开始创建"],
    ["gear", "技能配置与调试指南", "了解如何设置权限范围、调试技能响应，以及在不同渠道中灵活启用或暂停技能的执行。", "阅读指南"],
  ];
  return `<div class="skill-guide">
    <button class="skill-guide-close" data-skill-guide-close>×</button>
    <h2>像团队成员一样工作的 AI 技能</h2>
    <div class="skill-guide-grid">
      ${cards
        .map(
          ([tone, title, desc, action]) => `<div class="skill-guide-card ${tone}">
            <div class="skill-guide-art">${tone === "book" ? "□" : tone === "bolt" ? "ϟ" : "⚙"}</div>
            <div>
              <h3>${title}</h3>
              <p>${desc}</p>
              <button class="link-button" data-demo-action="${title}">${action} ↗</button>
            </div>
          </div>`
        )
        .join("")}
    </div>
  </div>`;
}

function renderSkillCard(skill) {
  return `<div class="skill-card" data-skill-open="${skill.id}">
    <div class="skill-card-menu">•••</div>
    <div class="skill-logo ${skill.icon === "AI" ? "bird" : ""}">${skill.icon}</div>
    <h3>${skill.name}</h3>
    <p>${skill.desc}</p>
    <span class="tag">${skill.channel}</span>
    <div class="skill-card-footer">
      <span class="${skill.source === "mine" ? "source-mine" : "source-template"}">${skill.source === "mine" ? "✣ 我的技能" : "▦ 技能模板"}</span>
    </div>
  </div>`;
}

function renderAiPlaceholder() {
  const label = assistantSubs.find(([id]) => id === state.assistantSub)?.[1] || "模块";
  return `<div class="module-content"><h1 class="page-title">${label}</h1><div class="card empty">该模块的主流程正在 Demo 中，您可以切换到知识管理或 AI技能查看完整交互。</div></div>`;
}

function renderToolManager() {
  const filtered = getFilteredAiTools();
  return `<div class="module-content tool-manager-page">
    <div class="skill-page-head">
      <h1 class="page-title">AI工具</h1>
      <div class="subtle">为智能体接入应用能力，快速调用外部服务与数据。</div>
    </div>
    ${state.aiToolGuideVisible ? renderToolGuide() : ""}
    <div class="tool-toolbar">
      <button class="button dark" data-modal="createCustomTool">＋ 创建自定义工具</button>
      <input class="input tool-search" data-ai-tool-search placeholder="搜索应用或动作" value="${escapeHtml(state.aiToolSearchQuery)}" />
      <div class="skill-filter-tabs">
        ${[
          ["all", "全部"],
          ["connected", "已连接"],
        ]
          .map(([id, label]) => `<button class="${state.aiToolFilter === id ? "active" : ""}" data-ai-tool-filter="${id}">${label}</button>`)
          .join("")}
      </div>
      <button class="select-like tool-category" data-ai-tool-category><span>全部类别</span><span>⌄</span></button>
    </div>
    <div class="tool-grid">
      ${filtered.length ? filtered.map(renderToolCard).join("") : `<div class="card empty agent-empty-state"><b>暂无工具</b><span>请调整搜索条件，或创建自定义工具。</span><button class="button dark" data-modal="createCustomTool">＋ 创建自定义工具</button></div>`}
    </div>
  </div>`;
}

function renderToolGuide() {
  const cards = [
    ["sliders", "如何使用与配置AI工具", "了解如何在 AI 智能体中集成和使用 AI 工具，包括工具的基本配置、授权流程和常见设置项。", "查看"],
    ["plus", "如何添加自定义工具", "创建自定义工具来连接企业内部系统或第三方服务，支持通过 API、Webhook 等方式快速集成。", "查看"],
    ["question", "AI工具常见问题", "查看有关工具集成、授权、调试和常见错误的常见问题解答，快速解决使用中遇到的问题。", "查看"],
  ];
  return `<div class="skill-guide tool-guide">
    <button class="skill-guide-close" data-ai-tool-guide-close>×</button>
    <h2>为 AI 智能体扩展无限能力的工具库</h2>
    <div class="skill-guide-grid">
      ${cards
        .map(
          ([tone, title, desc, action]) => `<div class="skill-guide-card ${tone}">
            <div class="skill-guide-art">${tone === "sliders" ? "☷" : tone === "plus" ? "+" : "?"}</div>
            <div>
              <h3>${title}</h3>
              <p>${desc}</p>
              <button class="link-button" data-demo-action="${title}">${action} ↗</button>
            </div>
          </div>`
        )
        .join("")}
    </div>
  </div>`;
}

function renderToolCard(tool) {
  return `<div class="tool-card" data-demo-action="查看工具：${escapeHtml(tool.name)}">
    <div class="tool-card-main">
      <div class="tool-app-icon">${tool.icon}</div>
      <h3>${tool.name}</h3>
    </div>
    <div class="tool-card-footer">
      <span>↔ ${tool.status}</span>
    </div>
  </div>`;
}

function renderAutomationManager() {
  return `<div class="module-content automation-page">
    <div class="skill-page-head">
      <h1 class="page-title">AI 自动化</h1>
      <div class="subtle">管理和配置各项 AI 自动化功能，提升服务效率与响应质量。</div>
    </div>
    <div class="automation-list">
      ${automationItems
        .map(
          ([title, desc], index) => `<button class="automation-row" type="button" data-automation-toggle="${title}">
            <div>
              <div class="automation-title">${title} <span class="switch ${index === 5 ? "on" : ""}" data-switch></span> <span class="collapse-mark">⌃</span></div>
              <div class="hint">${desc} <span class="link-blue">了解更多</span></div>
            </div>
          </button>`
        )
        .join("")}
    </div>
  </div>`;
}

function renderIntentManager() {
  ensureAgentState();
  return `<div class="module-content intent-page">
    <div class="intent-top-title">意图中心</div>
    <h1 class="page-title">意图列表</h1>
    <div class="subtle intent-desc">您可以通过创建意图的方式来控制回答内容与对话流程，当用户的对话内容满足指定意图后，将优先按照意图设置执行。 <button class="link-button" data-demo-action="查看意图中心说明">了解更多</button></div>
    <div class="intent-toolbar">
      <button class="button primary" data-drawer="intentBuilder">＋ 添加意图</button>
      <input class="input search-input" data-agent-intent-search placeholder="搜索名称" value="${escapeHtml(state.agentIntentSearchQuery)}" />
    </div>
    <div class="intent-empty">
      <div class="intent-illus">▰</div>
      <div class="subtle">暂无可用意图，请添加意图</div>
      <button class="button primary" data-drawer="intentBuilder">＋ 添加意图</button>
    </div>
  </div>`;
}

function renderAiSummaryManager() {
  ensureAgentState();
  return `<div class="module-content summary-page">
    <div class="summary-layout">
      <aside class="summary-subnav">
        <div class="summary-side-title">总结类型</div>
        <button class="summary-side-item active" data-demo-action="切换总结类型">AI智能总结</button>
      </aside>
      <main class="summary-main">
        <h1 class="page-title">AI智能总结 · AI智能总结</h1>
        <div class="summary-table-card">
          <div class="summary-toolbar">
            <input class="input summary-search" data-agent-summary-search placeholder="搜索关键词" value="${escapeHtml(state.agentSummarySearchQuery)}" />
          </div>
          <table class="summary-table">
            <thead>
              <tr><th><input type="checkbox"></th><th>用户问题</th><th>建议回复</th><th>关联知识库</th><th>状态</th><th>操作</th></tr>
            </thead>
          </table>
          <div class="summary-empty">
            <div class="empty-icon">▤</div>
            <b>暂无数据</b>
            <span>请前往 聚合对话设置-AI自动化设置 中开启"AI知识补充"功能</span>
            <button class="button primary" data-summary-enable>去开启 →</button>
          </div>
          <div class="summary-pagination">
            <span>共 0 条</span>
            <button class="button small" disabled>‹</button>
            <button class="button small active" data-demo-action="当前页码">1</button>
            <button class="button small" disabled>›</button>
            <button class="select-like small-select" data-demo-action="切换分页条数">10条/页 ⌄</button>
            <span>前往</span><input class="input page-input" value="1"><span>页</span>
          </div>
        </div>
      </main>
    </div>
  </div>`;
}

function renderSkillEditPage() {
  const skill = skills.find((item) => item.id === state.selectedSkillId);
  const isEdit = Boolean(skill);
  return `<section class="skill-edit-page">
    <div class="skill-edit-top">
      <div class="breadcrumb"><button class="link-button" data-back-skills>AI技能</button> › ${isEdit ? skill.name : "技能配置"}</div>
      <div class="skill-edit-actions">
        ${isEdit ? `<button class="button" data-demo-action="查看技能历史版本">历史版本</button>` : `<button class="button" data-back-skills>取消</button>`}
        <button class="button dark" data-skill-save>${isEdit ? "保存" : "创建并启用"}</button>
      </div>
    </div>
    <div class="skill-edit-body">
      <div class="skill-edit-card">
        <div class="form-row">
          <div class="label">技能名称 <span style="color:var(--red)">*</span></div>
          <input class="input" id="skillNameInput" style="width:100%" value="${escapeHtml(skill?.name || "")}" placeholder="请输入技能名称，例如：智能催单跟进">
          <div class="hint">清晰的名称帮助团队快速识别此技能的用途</div>
        </div>
        <div class="form-row">
          <div class="label">技能描述</div>
          <textarea class="textarea" id="skillDescInput" style="width:100%" placeholder="例如：当用户询问订单状态或物流信息时，自动调用订单查询工具获取信息并回复">${escapeHtml(skill?.desc || "")}</textarea>
          <div class="hint">告知 AI 大模型这个技能的用途以及何时触发，帮助模型准确理解和执行</div>
        </div>
        <div class="skill-edit-divider"></div>
        <div class="form-row">
          <div class="label">模型选择</div>
          <div class="model-select-row"><span class="model-dot">山</span><span>自动选择 doubao-seed-2.0-mini-260215</span><span class="tag orange">内置</span><button class="button ghost small" data-demo-action="选择技能模型">☷</button></div>
        </div>
        <div class="form-row">
          <div class="label">触发对话渠道</div>
          <button class="select-like full-select" data-demo-action="选择技能渠道"><span>通用</span><span>⌄</span></button>
        </div>
        <div class="skill-edit-divider"></div>
        <div class="form-row">
          <div class="label">使用指导提示词 <span style="color:var(--red)">*</span></div>
          ${renderSkillEditor(skill)}
        </div>
        <div class="skill-section-head">
          <div><b>工具列表</b><div class="hint">此技能可调用的外部工具与 API</div></div>
          <button class="button dashed small" data-modal="addSkillTool">＋ 添加工具</button>
        </div>
        ${skill?.tool ? renderSkillToolItem() : `<div class="dashed-empty"><div class="empty-icon">⌘</div><span>暂未添加工具</span><button class="button dashed small" data-modal="addSkillTool">＋ 添加第一个工具</button></div>`}
        <div class="skill-section-head">
          <div><b>知识列表</b><div class="hint">此技能可检索的知识库，用于增强 AI 回答能力</div></div>
          <button class="button dashed small" data-modal="associateKnowledge">＋ 关联知识库</button>
        </div>
        <div class="dashed-empty"><div class="empty-icon">▤</div><span>暂未关联知识库</span><button class="button dashed small" data-modal="associateKnowledge">＋ 添加知识</button></div>
        ${isEdit ? `<div class="danger-zone"><div><b>删除技能</b><div>此操作不可恢复。删除后，所有引用该技能的智能体配置将失效。</div></div><button class="button danger" data-modal="deleteSkill">删除此技能</button></div>` : ""}
      </div>
    </div>
  </section>`;
}

function renderSkillEditor(skill) {
  const prompt = skill?.prompt || "";
  return `<div class="skill-editor">
    <div class="editor-toolbar skill-editor-toolbar"><b>B</b><b>H</b><span>▣</span><span>☷</span><span>☰</span><button class="link-button" data-demo-action="插入技能变量">〔x〕 插入变量</button><span style="margin-left:auto">↗</span></div>
    <div class="rich-editor skill-rich-editor" id="skillPromptInput" contenteditable="true">${escapeHtml(prompt || "")}</div>
  </div>`;
}

function renderSkillToolItem() {
  return `<div class="skill-tool-item">
    <div class="skill-logo tiny">企</div>
    <div><b>企业微信(代运营)</b><div class="hint">发送消息</div></div>
    <span class="tag green">已配置</span>
    <button class="button ghost small" data-demo-action="移除技能工具">×</button>
  </div>`;
}

function renderAssistantDetail() {
  const agent = getSelectedAgent();
  if (!agent) {
    state.selectedAssistant = null;
    return renderAssistantManager();
  }
  const active = state.detailTab;
  return `
    <section class="assistant-detail">
      <div class="detail-head">
        <div class="detail-name">
          ${iconBox("AI")}
          <span>${escapeHtml(agent.name)}</span>
          <span class="tag ${agent.status === "enabled" ? "green" : "red"}">${agent.status === "enabled" ? "已启用" : "已停用"}</span>
        </div>
        <div class="assistant-detail-actions">
          <button class="button" data-agent-status-toggle="${agent.id}">${agent.status === "enabled" ? "停用" : "启用"}</button>
          <button class="button primary" data-demo-action="分享智能体">↗ 已分享</button>
        </div>
      </div>
      <div class="tabs">
        ${detailTabs
          .map((label) => `<div class="tab ${active === tabMap[label] ? "active" : ""}" data-detail-tab="${tabMap[label]}">${label}</div>`)
          .join("")}
      </div>
      <div class="detail-body">
        <div class="config-panel">${renderDetailConfig()}</div>
        <div class="preview-panel">${renderChatPreview()}</div>
      </div>
    </section>`;
}

function renderDetailConfig() {
  switch (state.detailTab) {
    case "setting":
      return renderSettingConfig();
    case "knowledge":
      return renderKnowledgeConfig();
    case "skill":
      return renderSkillConfig();
    case "flow":
      return renderFlowConfig();
    case "intent":
      return renderIntentConfig();
    case "integration":
      return renderIntegrationConfig();
    case "members":
      return renderMembersConfig();
    case "tool":
      return renderToolConfig();
    default:
      return `<h3>对话测试</h3><p class="subtle">在右侧直接验证助手回答、知识库命中和工具执行状态。</p><button class="button primary" data-detail-tab="setting">配置助手</button>`;
  }
}

function renderSettingConfig() {
  const agent = getSelectedAgent();
  const draft = getAgentSettingsDraft(agent);
  return `
    <h3 class="detail-section-title">智能助手设置 <span class="subtle">ⓘ</span></h3>
    <div class="grid-2">
      <div class="form-row">
        <div class="label">助手名称</div>
        <input class="input" id="agentNameInput" style="width:100%" value="${escapeHtml(draft.name)}">
      </div>
      <div class="form-row">
        <div class="label">助手描述</div>
        <input class="input" id="agentDescInput" style="width:100%" value="${escapeHtml(draft.description)}">
      </div>
    </div>
    <div class="form-row">
      <div class="label">选择模型</div>
      <button class="model-select-row detail-model-select" data-toggle-model-panel><span class="model-dot">山</span><span>${escapeHtml(draft.model)}</span><span class="tag orange">内置</span><span style="margin-left:auto">☷</span></button>
      <input type="hidden" id="agentModelInput" value="${escapeHtml(draft.model)}">
      ${state.detailModelOpen ? renderDetailModelPanel() : ""}
    </div>
    <div class="form-row">
      <div class="label">功能与步骤设置 <span class="subtle">ⓘ</span><button class="link-button detail-expand" data-detail-action="展开步骤设置">展开</button></div>
      <div class="editor-toolbar detail-toolbar"><b>B</b><b>H</b><span>▣</span><span>☰</span><span>1₂</span><button class="link-button" data-detail-action="智能优化">◎ 智能优化</button><button class="link-button" data-detail-action="插入变量">〔x〕 插入变量</button></div>
      <div class="rich-editor detail-prompt" id="agentPromptInput" contenteditable="true">${escapeHtml(draft.prompt)}</div>
      <div class="detail-examples">示例： <b>广告文案大师</b> <b>解梦大师</b></div>
    </div>
    <div class="form-row detail-range-row"><div class="label">支持使用上下文记录 <span class="subtle">ⓘ</span></div><input class="slider" id="agentContextInput" type="range" min="0" max="40" value="${draft.contextLimit}"><div class="range-labels"><span>0</span><span>40</span></div></div>
    <div class="form-row switch-row"><div class="label">展示token消耗 <span class="subtle">ⓘ</span></div><span class="switch ${draft.showToken ? "on" : ""}" id="agentShowTokenInput" data-switch></span></div>
    <div class="form-row"><div class="label">开场白对话 <span class="subtle">ⓘ</span></div><div class="editor-toolbar">☷ 1₂ ▣ ▦⌄</div><div class="rich-editor opening-editor" id="agentOpeningInput" contenteditable="true">${escapeHtml(draft.opening)}</div></div>
    <div class="form-row quick-question-row"><div class="label">快捷提问 <span class="subtle">ⓘ</span></div><div class="quick-input-line"><input class="input" placeholder="提问内容，例如：帮我写一篇文章，关于春游，字数500字左右"><button class="circle-add" data-detail-action="新增快捷提问">＋</button></div></div>
    <button class="button primary full-width-detail" data-agent-save-settings>保存设置</button>
    <button class="button danger full-width-detail" data-modal="deleteAssistant">删除助手</button>`;
}

function renderDetailModelPanel() {
  const agent = getSelectedAgent();
  const draft = getAgentSettingsDraft(agent);
  const query = state.agentModelSearchQuery.trim().toLowerCase();
  const models = aiAgentModels.filter((name) => !query || name.toLowerCase().includes(query));
  return `<div class="detail-model-panel">
    <div class="model-panel-select"><span class="model-dot">山</span>${escapeHtml(draft.model)} <span>⌃</span></div>
    <div class="model-panel-tabs"><button class="active" data-demo-action="切换内置模型">内置</button><button data-demo-action="切换原生模型">原生</button><button data-demo-action="切换智能体模型">智能体</button></div>
    <input class="input" data-agent-model-search placeholder="搜索模型" value="${escapeHtml(state.agentModelSearchQuery)}">
    <div class="model-list-title">推荐模型</div>
    ${models.length ? models.map((name) => `<button class="model-option ${draft.model === name ? "active" : ""}" data-detail-model="${escapeHtml(name)}"><span class="model-dot">山</span>${escapeHtml(name)}<span>${draft.model === name ? "✓" : ""}</span></button>`).join("") : `<div class="dashed-empty compact-empty"><span>暂无匹配模型</span></div>`}
  </div>`;
}

function renderKnowledgeConfig() {
  const agent = getSelectedAgent();
  const bound = knowledgeBases.filter((kb) => agent.knowledgeBaseIds.includes(kb.id));
  return `
    <div class="toolbar" style="margin-bottom:12px"><h3>知识设置 ⓘ</h3><button class="button ghost" data-demo-action="配置知识检索规则">⚙ 配置</button></div>
    <div style="display:flex; gap:8px; margin-bottom:14px"><button class="button primary" data-modal="associateKnowledge">⇩ 绑定知识库</button><button class="button" data-page="knowledgeCreate">＋ 新增知识库</button></div>
    ${
      bound.length
        ? bound
            .map(
              (kb) => `<div class="mini-card"><div class="mini-card-head"><span>🟢 ${escapeHtml(kb.name)}</span><button class="button ghost small" data-agent-remove-knowledge="${kb.id}">移除</button></div><div class="subtle">${escapeHtml(kb.count)} · ${escapeHtml(kb.type)} · 可用于企业微信自动回复</div></div>`
            )
            .join("")
        : `<div class="detail-tool-empty"><div class="empty-icon">▤</div><div>暂未绑定知识库</div><button class="button dashed small" data-modal="associateKnowledge">＋ 绑定知识库</button></div>`
    }`;
}

function renderSkillConfig() {
  const agent = getSelectedAgent();
  const bound = skills.filter((skill) => agent.skillIds.includes(skill.id));
  return `
    <div class="toolbar" style="margin-bottom:12px"><h3>技能设置 ⓘ</h3></div>
    <div style="display:flex; gap:8px; margin-bottom:14px"><button class="button dark" data-modal="importSkill">⇩ 导入技能</button><button class="button" data-demo-action="打开技能模板">▦ 技能模板</button></div>
    ${
      bound.length
        ? bound
            .map(
              (skill) => `<div class="mini-card"><div class="mini-card-head"><span>🪁 ${escapeHtml(skill.name)}</span><button class="button ghost small" data-agent-remove-skill="${skill.id}">移除</button></div><div class="subtle">${escapeHtml(skill.desc)}</div><div style="margin-top:10px"><span class="tag">${escapeHtml(skill.channel)}</span></div></div>`
            )
            .join("")
        : `<div class="detail-tool-empty"><div class="empty-icon">✣</div><div>暂未导入技能</div><button class="button dashed small" data-modal="importSkill">＋ 导入技能</button></div>`
    }`;
}

function renderFlowConfig() {
  return `
    <h3>流程设置 ⓘ</h3>
    <div class="empty">
      <div>
        <div style="font-size:48px">🧩</div>
        <div style="margin:10px 0">暂未添加流程</div>
        <button class="button primary" data-page="flow">＋ 创建流程</button>
        <button class="button" data-demo-action="导入流程">⇩ 导入流程</button>
      </div>
    </div>`;
}

function renderIntentConfig() {
  const agent = getSelectedAgent();
  return `
    <h3>意图列表 ⓘ</h3>
    ${
      agent.intents.length
        ? agent.intents.map((intent) => `<div class="mini-card"><div class="mini-card-head"><span>♧ ${escapeHtml(intent.name)}</span><span class="switch ${intent.enabled ? "on" : ""}" data-switch></span></div><div class="subtle">${escapeHtml(intent.action)}</div></div>`).join("")
        : `<div class="empty"><div><div style="font-size:48px">🤖</div><div style="margin:10px 0">暂无可用意图，请添加意图</div><button class="button primary" data-demo-action="导入意图">⇩ 导入意图</button><button class="button" data-drawer="intentDrawer">＋ 新增意图</button></div></div>`
    }`;
}

function renderIntegrationConfig() {
  const agent = getSelectedAgent();
  return `
    <h3>集成设置 ⓘ</h3>
    <div class="grid-2">
      ${aiAgentIntegrations
        .map(
          (name) => `<div class="mini-card" ${name.includes("企业微信") ? `data-page="wechat"` : `data-demo-action="配置集成：${escapeHtml(name)}"`}><div class="mini-card-head"><span>${escapeHtml(name)}</span><span class="tag ${agent.integrations.includes(name) ? "green" : ""}">${agent.integrations.includes(name) ? "已接入" : "未接入"}</span></div><div class="subtle">快速集成智能助手到${escapeHtml(name)}</div></div>`
        )
        .join("")}
    </div>`;
}

function renderMembersConfig() {
  const agent = getSelectedAgent();
  return `
    <h3>成员列表 ⓘ</h3>
    <div class="form-row"><div class="label">可见范围：</div><label><input type="radio" checked> 全部成员</label> &nbsp; <label><input type="radio"> 自定义</label></div>
    ${agent.members.map((member) => `<div class="mini-card"><div class="mini-card-head"><span>♙ ${escapeHtml(member)}</span><span class="tag green">可见</span></div><div class="subtle">可查看并使用此智能体</div></div>`).join("")}`;
}

function renderToolConfig() {
  const agent = getSelectedAgent();
  const bound = aiAgentToolOptions.filter((tool) => agent.toolIds.includes(tool.id));
  return `<div class="detail-config-head"><h3>工具设置 <span class="subtle">ⓘ</span></h3><button class="button dashed small" data-modal="assistantToolPicker">＋ 添加工具</button></div>
    ${
      bound.length
        ? bound.map((tool) => `<div class="mini-card"><div class="mini-card-head"><span class="agent-tool-title"><span class="skill-logo tiny">${escapeHtml(tool.icon)}</span>${escapeHtml(tool.name)}</span><button class="button ghost small" data-agent-remove-tool="${tool.id}">移除</button></div><div class="subtle">${escapeHtml(tool.action)} · ${escapeHtml(tool.status)}</div></div>`).join("")
        : `<div class="detail-tool-empty"><div class="empty-icon">⌘</div><div>暂未添加工具</div><button class="button dashed small" data-modal="assistantToolPicker">＋ 添加工具</button></div>`
    }`;
}

function renderChatPreview() {
  const agent = getSelectedAgent();
  const messages = agent?.messages || state.messages;
  return `
    <div class="chat">
      ${messages
        .map(
          (m) => `<div class="message ${m.role === "user" ? "user" : ""}">${iconBox(m.role === "user" ? "K" : "AI")}<div class="bubble">${escapeHtml(m.text)}${m.meta ? `<div class="bubble-meta">${escapeHtml(m.meta)}</div>` : ""}</div></div>`
        )
        .join("")}
      ${state.agentChatLoading ? `<div class="message">${iconBox("AI")}<div class="bubble">正在检索知识库、技能和工具配置...</div></div>` : ""}
    </div>
    <div class="chat-input">
      <textarea id="assistantInput" placeholder="请输入对话内容"></textarea>
      <div style="display:flex; justify-content:space-between; align-items:center">
        <span class="subtle">□ ＠ ❖</span>
        <button class="button primary" id="assistantSend">➤</button>
      </div>
    </div>`;
}
