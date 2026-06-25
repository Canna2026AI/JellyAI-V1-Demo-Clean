// Module modal renderers.

function renderKnowledgeModal() {
  if (!state.modal) return "";
if (state.modal === "importKnowledge") {
    return modal("导入知识库", `
      <div class="grid-2">
        ${["物流问答", "报价规则", "售后 FAQ", "海关税率", "数据知识库", "测试文档"].map((x) => `<div class="mini-card">📒 ${x}<br><span class="subtle">自有知识库 · 文本</span></div>`).join("")}
      </div>
    `, "确定", () => {
      state.modal = null;
      showToast("知识库已导入");
    });
  }

if (state.modal === "knowledgeWizard") {
    return modal("新增知识库", renderKnowledgeWizard(), state.knowledgeStep === 4 ? "完成" : "下一步", () => {
      if (state.knowledgeStep < 4) state.knowledgeStep += 1;
      else {
        state.knowledgeStep = 1;
        state.modal = null;
        showToast("知识库创建完成");
      }
    });
  }

  return "";
}

function renderKnowledgeWizard() {
  const step = state.knowledgeStep;
  const names = ["知识库类型", "添加数据", "数据处理", "完成"];
  return `<div class="stepper">${names.map((n, i) => `<div class="step ${step === i + 1 ? "active" : step > i + 1 ? "done" : ""}">${i + 1}. ${n}</div>`).join("")}</div>
  ${step === 1 ? `<div class="grid-2">${["文本", "整个网站", "文档文件", "自定义知识库"].map((x, i) => `<div class="mini-card" style="${i === 2 ? "border-color:var(--blue)" : ""}"><b>${x}</b><br><span class="subtle">用于问答检索与智能回复</span></div>`).join("")}</div>` : ""}
  ${step === 2 ? `<div class="empty" style="border:1px dashed var(--line-dark); border-radius:8px">＋ 将文件拖拽至此区域或选择文件上传<br><span class="subtle">支持 xlsx、docx、pdf、txt、csv 等文件</span></div>` : ""}
  ${step === 3 ? `<div class="mini-card"><div class="mini-card-head">数据处理中 <span class="tag blue">86%</span></div><div class="subtle">正在切分文档、生成索引、抽取问答对。</div></div>` : ""}
  ${step === 4 ? `<div class="empty">✅ 知识库已创建完成，可绑定给 Jelly AI 助手使用。</div>` : ""}`;
}
