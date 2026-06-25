// Module modal renderers.

function renderContactModal() {
  if (!state.modal) return "";
if (state.modal === "createField") {
    return modal("创建字段", `
      <div class="form-row"><div class="label">字段名称 <span style="color:var(--red)">*</span></div><input class="input" style="width:100%" value="物流需求"></div>
      <div class="form-row"><div class="label">字段类型</div><select class="select" style="width:100%"><option>文本</option><option>多行文本</option><option>数字</option><option>日期</option><option>单选</option></select></div>
      <div class="form-row"><div class="label">使用场景</div><label><input type="checkbox" checked> 联系人详情</label> <label><input type="checkbox" checked> 聚合对话侧栏</label> <label><input type="checkbox"> 自动化流程变量</label></div>
    `, "创建", () => {
      state.modal = null;
      showToast("联系人字段已创建");
    });
  }

  return "";
}
