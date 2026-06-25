// Module modal renderers.

function renderAgentModal() {
  if (!state.modal) return "";
if (state.modal === "createAssistant") {
    return modal("创建助手", `
      <div class="form-row"><div class="label">助手名称 *</div><input class="input" style="width:100%" id="newAssistantName" placeholder="请输入" value="物流客服助手"></div>
      <div class="form-row"><div class="label">助手描述</div><textarea class="textarea" style="width:100%" id="newAssistantDesc" placeholder="助手功能介绍">用于企业微信物流咨询、报价问答和转人工服务</textarea></div>
      <div class="form-row"><div class="label">模型</div><select class="select" style="width:100%" id="newAssistantModel">${renderSelectOptions(aiAgentModels, aiAgentModels[0])}</select></div>
      <div class="form-row"><div class="label">开场白</div><textarea class="textarea" style="width:100%" id="newAssistantOpening">Hi~ 我是您的智能助手，想要我协助您完成什么任务？发送消息给我吧！</textarea></div>
      <div class="form-row"><div class="label">助手图标</div>${iconBox("AI")}</div>
    `, "确认", createAgentFromForm);
  }

if (state.modal === "deleteAssistant") {
    const agent = getSelectedAgent();
    return modal("删除智能体", `
      <div class="danger-modal-text">确认删除「${escapeHtml(agent?.name || "当前智能体")}」吗？删除后，它绑定的知识库、技能、工具和聊天预览记录会从当前数据中移除。</div>
    `, "确认删除", deleteSelectedAgent);
  }

if (state.modal === "importSkill") {
    return renderImportSkillModal();
  }

if (state.modal === "addSkillTool") {
    return modal("添加工具", `
      <div class="tool-select-grid">
        ${[
          ["企业微信(代运营)", "发送消息", "企"],
          ["企业微信(代运营)", "创建群聊", "群"],
          ["企业微信(代运营)", "自动加好友", "友"],
          ["Webhook", "调用第三方接口", "API"],
        ]
          .map(
            ([name, desc, ico], index) => `<label class="tool-select-card ${index === 0 ? "active" : ""}">
              <input type="radio" name="tool" ${index === 0 ? "checked" : ""}>
              <span class="skill-logo tiny">${ico}</span>
              <span><b>${name}</b><small>${desc}</small></span>
            </label>`
          )
          .join("")}
      </div>
    `, "确定", () => {
      state.modal = null;
      showToast("工具已添加");
    });
  }

if (state.modal === "associateKnowledge") {
    const agent = getSelectedAgent();
    if (state.agentModalAgentId !== agent?.id) {
      state.agentModalAgentId = agent?.id;
      state.agentModalSelection = [...(agent?.knowledgeBaseIds || [])];
    }
    const selected = new Set(state.agentModalSelection);
    window.__modalOk = async () => {
      if (!agent) return;
      const ids = Array.from(selected);
      state.modal = null;
      state.agentModalSelection = [];
      state.agentModalAgentId = null;
      state.agentKnowledgeSearchQuery = "";
      await setAgentRelation(agent, "knowledgeBaseIds", ids, "知识库绑定已保存");
    };
    return modal("关联知识库", `
      <div class="knowledge-pick-list">
        ${knowledgeBases
          .map(
            (kb) => `<label class="knowledge-pick-row">
              <input type="checkbox" data-agent-knowledge-select="${kb.id}" ${selected.has(kb.id) ? "checked" : ""}>
              <span class="knowledge-card-icon small">${kb.icon}</span>
              <span><b>${kb.name}</b><small>${kb.count} · ${kb.type}</small></span>
            </label>`
          )
          .join("")}
      </div>
    `, "确定", window.__modalOk);
  }

if (state.modal === "deleteSkill") {
    return modal("删除技能", `
      <div class="danger-modal-text">删除后，所有引用该技能的智能体配置将同步移除。</div>
    `, "确认删除", deleteSelectedSkill);
  }

if (state.modal === "deleteKnowledge") {
    const knowledgeBase = knowledgeBases.find((item) => item.id === state.selectedKnowledgeBaseId);
    return modal("删除知识库", `
      <div class="danger-modal-text">确认删除「${escapeHtml(knowledgeBase?.name || "当前知识库")}」吗？删除后，关联该知识库的智能体将无法继续检索其中内容。</div>
    `, "确认删除", deleteSelectedKnowledgeBase);
  }

if (state.modal === "createCustomTool") {
    return modal("创建自定义工具", `
      <div class="form-row"><div class="label">工具名称 <span style="color:var(--red)">*</span></div><input class="input" id="customToolName" style="width:100%" placeholder="请输入工具名称" value="内部订单查询"></div>
      <div class="form-row"><div class="label">工具描述</div><textarea class="textarea" id="customToolDesc" style="width:100%" placeholder="描述工具用途">根据订单号查询物流轨迹、费用和签收状态。</textarea></div>
      <div class="grid-2">
        <div class="form-row"><div class="label">授权方式</div><select class="select" style="width:100%"><option>无需授权</option><option>API Key</option><option>OAuth2</option></select></div>
        <div class="form-row"><div class="label">请求方式</div><select class="select" style="width:100%"><option>GET</option><option>POST</option><option>PUT</option></select></div>
      </div>
      <div class="form-row"><div class="label">API 地址</div><input class="input" style="width:100%" value="https://api.example.com/orders/{order_no}"></div>
    `, "创建", createCustomToolFromForm);
  }

if (state.modal === "assistantToolPicker") {
    const agent = getSelectedAgent();
    if (state.agentToolModalAgentId !== agent?.id) {
      state.agentToolModalAgentId = agent?.id;
      state.agentToolSelection = [...(agent?.toolIds || [])];
    }
    window.__modalOk = async () => {
      const ids = [...state.agentToolSelection];
      state.modal = null;
      state.agentToolSelection = [];
      state.agentToolModalAgentId = null;
      state.agentToolPickerSearchQuery = "";
      if (agent) await setAgentRelation(agent, "toolIds", ids, "工具选择已保存");
    };
    return `<div class="modal-backdrop"><div class="modal assistant-tool-modal">
      <div class="modal-head">添加工具<button class="button ghost" data-close-modal>×</button></div>
      <div class="assistant-tool-body">
        <aside class="tool-picker-left">
          <div class="tool-picker-tabs">
            ${[
              ["app", "应用"],
              ["assistant", "助手"],
            ]
              .map(([id, label]) => `<button class="${state.detailToolPickerTab === id ? "active" : ""}" data-tool-picker-tab="${id}">${label}</button>`)
              .join("")}
          </div>
          ${state.detailToolPickerTab === "app" ? renderToolPickerAppList() : renderToolPickerAssistantInfo()}
        </aside>
        <main class="tool-picker-main">
          ${state.detailToolPickerTab === "app" ? renderToolPickerAppMain() : renderToolPickerAssistantMain()}
        </main>
      </div>
      <div class="modal-foot"><button class="button" data-close-modal>取消</button><button class="button primary" data-modal-ok>确认</button></div>
    </div></div>`;
  }

  return "";
}

function renderImportSkillModal() {
  const agent = getSelectedAgent();
  if (state.agentSkillModalAgentId !== agent?.id) {
    state.agentSkillModalAgentId = agent?.id;
    state.importSkillSelected = [...(agent?.skillIds || [])];
  }
  const selected = new Set(state.importSkillSelected);
  const query = state.importSkillSearchQuery.trim().toLowerCase();
  const importable = skills
    .filter((skill) => skill.source === "mine")
    .filter((skill) => !query || `${skill.name} ${skill.desc}`.toLowerCase().includes(query))
    .slice(0, 6)
    .map((skill, index) => ({
      ...skill,
      importIcon: index < 3 ? "企" : "AI",
      iconClass: index < 3 ? "orange" : "brand",
    }));
  window.__modalOk = async () => {
    if (!state.importSkillSelected.length) return;
    const nextSkillIds = agent ? Array.from(new Set([...agent.skillIds, ...state.importSkillSelected])) : [];
    const count = state.importSkillSelected.length;
    state.modal = null;
    state.importSkillSelected = [];
    state.agentSkillModalAgentId = null;
    state.importSkillSearchQuery = "";
    if (agent) await setAgentRelation(agent, "skillIds", nextSkillIds, `已导入 ${count} 个技能`);
  };
  return `<div class="modal-backdrop skill-import-backdrop">
    <div class="modal skill-import-modal">
      <div class="modal-head skill-import-head">
        <div>
          <div>导入技能</div>
          <small>从我的技能中选择要导入到此助手的技能</small>
        </div>
        <button class="button ghost skill-import-close" data-close-modal>×</button>
      </div>
      <div class="skill-import-search">
        <input class="input" data-import-skill-search placeholder="搜索技能名称或描述..." value="${escapeHtml(state.importSkillSearchQuery)}">
      </div>
      <div class="skill-import-list">
        ${
          importable.length
            ? importable
                .map(
                  (skill) => `<label class="skill-import-row ${selected.has(skill.id) ? "selected" : ""}">
              <input type="checkbox" data-import-skill-select="${skill.id}" ${selected.has(skill.id) ? "checked" : ""}>
              <div class="skill-import-copy">
                <div><b>${skill.name}</b><span class="tag blue">通用</span></div>
                <p>${skill.desc}</p>
              </div>
              <span class="skill-import-app ${skill.iconClass}">${skill.importIcon}</span>
            </label>`
                )
                .join("")
            : `<div class="dashed-empty compact-empty"><span>暂无匹配技能</span></div>`
        }
      </div>
      <div class="skill-import-foot">
        <span>${state.importSkillSelected.length ? `已选择 ${state.importSkillSelected.length} 个技能` : "请勾选要导入的技能"}</span>
        <div>
          <button class="button" data-close-modal>取消</button>
          <button class="button primary ${state.importSkillSelected.length ? "" : "disabled"}" data-modal-ok ${state.importSkillSelected.length ? "" : "disabled"}>导入选中技能</button>
        </div>
      </div>
    </div>
  </div>`;
}

function renderToolPickerAppList() {
  const selected = new Set(state.agentToolSelection);
  const query = state.agentToolPickerSearchQuery.trim().toLowerCase();
  const tools = aiAgentToolOptions.filter((tool) => !query || `${tool.name} ${tool.action} ${tool.status}`.toLowerCase().includes(query));
  return `<input class="input tool-picker-search" data-tool-picker-search placeholder="搜索" value="${escapeHtml(state.agentToolPickerSearchQuery)}">
    <div class="tool-picker-group-title">精选应用 <span>⌃</span></div>
    <div class="tool-picker-list">
      ${
        tools.length
          ? tools
              .map((tool) => `<label class="${selected.has(tool.id) ? "active" : ""}">
          <input type="checkbox" data-agent-tool-select="${tool.id}" ${selected.has(tool.id) ? "checked" : ""}>
          <span class="tool-mini-icon">${escapeHtml(tool.icon)}</span>${escapeHtml(tool.name)} · ${escapeHtml(tool.action)}
        </label>`)
              .join("")
          : `<div class="dashed-empty compact-empty"><span>暂无匹配工具</span></div>`
      }
    </div>`;
}

function renderToolPickerAssistantInfo() {
  return `<div class="assistant-tool-info">
    <div class="assistant-tool-illus">
      <span class="assistant-icon">AI</span>
      <i></i><i></i><i></i>
    </div>
    <h3>将语聚GPTs作为工具</h3>
    <p>支持使用其它语聚GPTs作为工具使用，设置工具描述后AI模型将根据对话内容自主选择和使用此工具 <button class="link-button" data-demo-action="查看助手作为工具说明">了解更多</button></p>
  </div>`;
}

function renderToolPickerAppMain() {
  const selectedTools = aiAgentToolOptions.filter((tool) => state.agentToolSelection.includes(tool.id));
  return `${selectedTools.length ? selectedTools.map((tool) => `<div class="tool-picker-result-card"><span class="tool-mini-icon large">${escapeHtml(tool.icon)}</span><div><b>${escapeHtml(tool.name)}</b><p>${escapeHtml(tool.action)} · ${escapeHtml(tool.status)}</p></div></div>`).join("") : `<div class="tool-picker-result-card"><span class="tool-mini-icon large">搜</span><div><b>AI搜索</b><p>请选择左侧工具后保存到智能体</p></div></div>`}
  <div class="tool-provider-note">本功能由“集简云嵌入方案”提供，当前为 mock 选择流程</div>`;
}

function renderToolPickerAssistantMain() {
  return `<div class="tool-picker-result-card assistant-choice">
    ${iconBox("AI")}
    <b>canna测试</b>
  </div>`;
}

function renderAgentDrawer() {
  if (!state.drawer) return "";
if (state.drawer === "intentDrawer") {
    return drawer("新增意图", `
      <div class="form-row"><div class="label">意图名称</div><input class="input" style="width:100%" value="转人工"></div>
      <div class="form-row"><div class="label">用户可触发句子</div><textarea class="textarea" style="width:100%">找人工\n你们产品怎么收费\n我要合同\n帮我转客服</textarea></div>
      <div class="form-row"><div class="label">处理方式</div><select class="select" style="width:100%"><option>跳转到人工服务</option></select></div>
      <div class="form-row"><div class="label">人工服务维持提示语</div><div class="editor-toolbar">B I S 🔗 ≡</div><div class="rich-editor" style="height:90px">已为您转接人工客服，请稍等。</div></div>
    `);
  }

if (state.drawer === "intentBuilder") {
    return drawer("添加", `
      <div class="form-row"><div class="label">意图名称<span style="color:var(--red)">*</span></div><input class="input" style="width:100%" placeholder="请输入"></div>
      <div class="form-row"><div class="label">意图匹配方式<span style="color:var(--red)">*</span></div><select class="select" style="width:100%"><option>AI自动匹配</option><option>关键词匹配</option></select></div>
      <div class="form-row"><div class="label">用户可能提问句子<span style="color:var(--red)">*</span></div><textarea class="textarea" style="width:100%; min-height:92px" placeholder="填写用户可能提问的句子，比如：产品如何购买，是否可以介绍一个商务等，每行一个"></textarea></div>
      <div class="label">意图匹配后的处理方式<span style="color:var(--red)">*</span></div>
      <div class="intent-action-card">
        <div class="intent-action-head">A: 回复文本内容 <span>⌃</span></div>
        <div class="form-row"><div class="label">名称<span style="color:var(--red)">*</span></div><input class="input" style="width:100%" value="回复文本内容"></div>
        <div class="form-row"><div class="label">处理方式<span style="color:var(--red)">*</span></div><select class="select" style="width:100%"><option>A: 回复文本内容</option><option>转入人工</option><option>调用技能</option></select></div>
        <div class="skill-editor">
          <div class="editor-toolbar skill-editor-toolbar"><b>B</b><b>H</b><span>▣</span><span>☷</span><span>☰</span><button class="link-button" data-demo-action="插入意图变量">〔x〕 插入变量</button></div>
          <div class="rich-editor skill-rich-editor" contenteditable="true"></div>
        </div>
      </div>
      <button class="link-button add-action-link" data-demo-action="新增意图处理方式">＋ 新增处理方式</button>
      <div class="label" style="margin-top:18px">意图未匹配后的处理方式</div>
      <button class="link-button add-action-link" data-demo-action="新增未匹配处理方式">＋ 新增处理方式</button>
    `);
  }

  return "";
}
