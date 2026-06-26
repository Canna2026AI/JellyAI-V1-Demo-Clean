// Module modal renderers.

function renderAgentModal() {
  if (!state.modal) return "";
if (state.modal === "createAssistant") {
    return modal("创建助手", `
      <div class="form-row"><div class="label">助手名称 *</div><input class="input" style="width:100%" id="newAssistantName" placeholder="请输入" value="物流客服助手"></div>
      <div class="form-row"><div class="label">助手描述</div><textarea class="textarea" style="width:100%" placeholder="助手功能介绍">用于企业微信物流咨询、报价问答和转人工服务</textarea></div>
      <div class="form-row"><div class="label">助手图标</div>${iconBox("AI")}</div>
    `, "确认", () => {
      const name = document.getElementById("newAssistantName").value || "新建助手";
      state.modal = null;
      state.selectedAssistant = name;
      showToast("创建助手成功");
    });
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
    return modal("关联知识库", `
      <div class="knowledge-pick-list">
        ${knowledgeBases
          .map(
            (kb) => `<label class="knowledge-pick-row">
              <input type="checkbox" checked>
              <span class="knowledge-card-icon small">${kb.icon}</span>
              <span><b>${kb.name}</b><small>${kb.count} · ${kb.type}</small></span>
            </label>`
          )
          .join("")}
      </div>
    `, "确定", () => {
      state.modal = null;
      showToast("知识库已关联");
    });
  }

if (state.modal === "deleteSkill") {
    return modal("删除技能", `
      <div class="danger-modal-text">删除后，所有引用该技能的智能体配置将失效。当前为模拟数据，确认后会返回技能列表。</div>
    `, "确认删除", () => {
      state.modal = null;
      state.page = "ai";
      state.assistantSub = "skill";
      state.selectedSkillId = null;
      showToast("技能已删除");
    });
  }

if (state.modal === "deleteKnowledge") {
    return modal("删除知识库", `
      <div class="danger-modal-text">删除知识库后，关联该知识库的智能体将无法继续检索其中内容。当前为模拟数据，不会真的删除文件。</div>
    `, "确认删除", () => {
      state.modal = null;
      showToast("知识库已删除");
    });
  }

if (state.modal === "createCustomTool") {
    return modal("创建自定义工具", `
      <div class="form-row"><div class="label">工具名称 <span style="color:var(--red)">*</span></div><input class="input" style="width:100%" placeholder="请输入工具名称" value="内部订单查询"></div>
      <div class="form-row"><div class="label">工具描述</div><textarea class="textarea" style="width:100%" placeholder="描述工具用途">根据订单号查询物流轨迹、费用和签收状态。</textarea></div>
      <div class="grid-2">
        <div class="form-row"><div class="label">授权方式</div><select class="select" style="width:100%"><option>无需授权</option><option>API Key</option><option>OAuth2</option></select></div>
        <div class="form-row"><div class="label">请求方式</div><select class="select" style="width:100%"><option>GET</option><option>POST</option><option>PUT</option></select></div>
      </div>
      <div class="form-row"><div class="label">API 地址</div><input class="input" style="width:100%" value="https://api.example.com/orders/{order_no}"></div>
    `, "创建", () => {
      state.modal = null;
      showToast("自定义工具已创建");
    });
  }

if (state.modal === "assistantToolPicker") {
    window.__modalOk = () => {
      state.modal = null;
      showToast("工具已添加到智能体");
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
  const selected = new Set(state.importSkillSelected);
  const importable = skills
    .filter((skill) => skill.source === "mine")
    .slice(0, 6)
    .map((skill, index) => ({
      ...skill,
      importIcon: index < 3 ? "企" : "AI",
      iconClass: index < 3 ? "orange" : "brand",
    }));
  window.__modalOk = () => {
    if (!state.importSkillSelected.length) return;
    const count = state.importSkillSelected.length;
    state.modal = null;
    state.importSkillSelected = [];
    showToast(`已导入 ${count} 个技能`);
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
        <input class="input" placeholder="搜索技能名称或描述...">
      </div>
      <div class="skill-import-list">
        ${importable
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
          .join("")}
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
  const apps = ["AI搜索引擎", "集简云数据表", "语聚AI", "微软Bing搜索(内置)", "集简云OCR", "文档文字提取", "Webhook", "飞书即时消息"];
  return `<input class="input tool-picker-search" placeholder="搜索">
    <div class="tool-picker-group-title">精选应用 <span>⌃</span></div>
    <div class="tool-picker-list">
      ${apps
        .map((name, index) => `<button class="${index === 0 ? "active" : ""}" data-tool-picker-app="${name}">
          <span class="tool-mini-icon">${index === 0 ? "搜" : index === 1 ? "表" : index === 2 ? "AI" : index === 6 ? "WH" : "文"}</span>${name}
        </button>`)
        .join("")}
    </div>`;
}

function renderToolPickerAssistantInfo() {
  return `<div class="assistant-tool-info">
    <div class="assistant-tool-illus">
      <span class="assistant-icon">AI</span>
      <i></i><i></i><i></i>
    </div>
    <h3>将语聚GPTs作为工具</h3>
    <p>支持使用其它语聚GPTs作为工具使用，设置工具描述后AI模型将根据对话内容自主选择和使用此工具 <button class="link-button">了解更多</button></p>
  </div>`;
}

function renderToolPickerAppMain() {
  return `<div class="tool-picker-result-card">
    <span class="tool-mini-icon large">搜</span>
    <div>
      <b>AI搜索</b>
      <p>输入内容进行AI搜索</p>
    </div>
  </div>
  <div class="tool-provider-note">本功能由“集简云嵌入方案”提供</div>`;
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
          <div class="editor-toolbar skill-editor-toolbar"><b>B</b><b>H</b><span>▣</span><span>☷</span><span>☰</span><button class="link-button">〔x〕 插入变量</button></div>
          <div class="rich-editor skill-rich-editor" contenteditable="true"></div>
        </div>
      </div>
      <button class="link-button add-action-link">＋ 新增处理方式</button>
      <div class="label" style="margin-top:18px">意图未匹配后的处理方式</div>
      <button class="link-button add-action-link">＋ 新增处理方式</button>
    `);
  }

  return "";
}
