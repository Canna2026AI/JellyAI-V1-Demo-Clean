// Module modal renderers.

function renderFlowModal() {
  if (!state.modal) return "";
if (state.modal === "createFlow") {
    return modal("创建流程", `
      <div class="flow-create-form">
        <div class="form-row"><div class="label">流程名称 <span style="color:var(--red)">*</span></div><input class="input" style="width:100%" id="flowName" placeholder="请输入"></div>
        <div class="form-row"><div class="label">选择助手 <span style="color:var(--red)">*</span></div><select class="select" style="width:100%"><option>请选择助手</option><option>canna测试</option><option>演示AI助手</option></select></div>
        <div class="form-row"><div class="label">流程描述</div><textarea class="textarea" style="width:100%; min-height:96px" placeholder="请描述当前应用触发流程的使用场景。"></textarea></div>
      </div>
    `, "下一步", () => {
      state.modal = null;
      state.flowEditing = true;
      state.flowSub = "mine";
      showToast("已进入流程设置");
    });
  }

if (state.modal === "addFlowTrigger") {
    window.__modalOk = () => {
      state.modal = null;
      showToast("触发事件已添加");
    };
    return renderFlowPickerModal("添加触发事件", flowTriggerGroups, state.flowTriggerCategory, "flow-trigger", "flowTriggerCategory");
  }

if (state.modal === "addFlowAction") {
    window.__modalOk = () => {
      state.modal = null;
      showToast("执行动作已添加");
    };
    return renderFlowPickerModal("添加执行动作", flowActionGroups, state.flowActionCategory, "flow-action", "flowActionCategory");
  }

  return "";
}

function renderFlowPickerModal(title, groups, active, dataName, stateKey) {
  const current = groups[active] || Object.values(groups)[0];
  const groupEntries = Object.entries(groups);
  return `<div class="modal-backdrop"><div class="modal flow-picker-modal">
    <div class="modal-head">${title}<button class="button ghost" data-close-modal>×</button></div>
    <div class="flow-picker-body">
      <aside class="flow-picker-left">
        <input class="input" placeholder="搜索">
        ${groupEntries
          .map(
            ([id, group]) => `<div class="flow-picker-section">
              <h4>${group.title}</h4>
              ${group.items
                .map(
                  ([itemId, label, ico]) => `<button class="${active === id ? "active" : ""}" data-flow-picker-tab="${id}" data-flow-picker-key="${stateKey}">
                    <span class="flow-app-icon small ${ico === "◷" ? "orange" : ico === "红" ? "red" : "blue"}">${ico}</span>${label}
                  </button>`
                )
                .join("")}
            </div>`
          )
          .join("")}
      </aside>
      <main class="flow-picker-main">
        ${current.cards
          .map(
            ([name, desc, ico]) => `<button class="flow-picker-card" data-${dataName}-option="${name}">
              <span class="flow-app-icon small ${ico === "◷" ? "orange" : ico === "红" ? "red" : "blue"}">${ico}</span>
              <span><b>${name}</b><small>${desc}</small></span>
            </button>`
          )
          .join("")}
        ${active === "timer" || active === "app" ? `<div class="flow-picker-provider">⌁ 本功能由“集简云嵌入方案”提供</div>` : ""}
      </main>
    </div>
    <div class="modal-foot"><button class="button" data-close-modal>取消</button><button class="button primary" data-modal-ok>确认</button></div>
  </div></div>`;
}

function renderFlowDrawer() {
  if (!state.drawer) return "";
if (state.drawer === "flowTemplateDetail") {
    const item = flowTemplates.find((template) => template.id === state.selectedFlowTemplateId) || flowTemplates[0];
    return `<div class="drawer-backdrop flow-drawer-backdrop">
      <aside class="flow-template-drawer">
        <div class="flow-drawer-head">${item.title}<button class="button ghost" data-close-drawer>×</button></div>
        <div class="flow-drawer-body">
          <section class="flow-drawer-section">
            <h3>流程指导说明 <span>*</span></h3>
            <p>指导AI如何执行此流程。示例：当抖音私信收到消息时，回复用户的问题，并使用抖音:发送私信给用户，将回复内容发给用户</p>
            <div class="flow-drawer-editor">${item.guide}<button class="link-button">展开</button></div>
          </section>
          <section class="flow-drawer-section">
            <h3>选择模型</h3>
            <p>请选择流程执行时所依赖的模型类型</p>
          </section>
          <section class="flow-drawer-section">
            <h3>触发事件 <span>*</span></h3>
            <div class="flow-drawer-card"><span class="flow-app-icon small ${item.iconClass}">${item.icon}</span><b>${item.trigger}</b></div>
          </section>
          <section class="flow-drawer-section">
            <h3>执行动作 <span>*</span></h3>
            <div class="flow-drawer-card"><span class="flow-app-icon small ${item.iconClass}">${item.icon}</span><b>${item.action}</b></div>
          </section>
        </div>
        <div class="flow-drawer-foot"><button class="button" data-close-drawer>关闭</button><button class="button primary" data-flow-template-add>添加到助手</button></div>
      </aside>
    </div>`;
  }

if (state.drawer === "flowDrawer") {
    return drawer("节点配置", `
      <div class="form-row"><div class="label">字段匹配</div><div class="mini-card">消息内容：1.文本内容 “你好”</div><div class="mini-card">外部用户ID：外部用户ID变量</div><div class="mini-card">客服账号ID：开放平台客服ID变量</div></div>
      <div class="form-row"><button class="button primary">智能匹配</button> <button class="button">插入变量</button></div>
      <div class="form-row"><div class="label">测试结果</div><div class="mini-card"><span class="tag green">成功</span> 获取样本数据成功，AI 回复生成成功，企业微信消息发送成功。</div></div>
    `);
  }

  return "";
}
