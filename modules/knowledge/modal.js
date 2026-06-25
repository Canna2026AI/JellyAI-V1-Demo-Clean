// Knowledge module modal renderers.

function renderKnowledgeModal() {
  if (!state.modal) return "";

  if (state.modal === "importKnowledge") {
    return modal(
      "导入知识库",
      `<div class="knowledge-modal-grid">
        ${knowledgeBases
          .slice(0, 6)
          .map(
            (kb, index) => `<label class="mini-card knowledge-import-card ${index === 0 ? "active" : ""}">
              <input type="radio" name="knowledge-import" value="${escapeHtml(kb.id)}" ${index === 0 ? "checked" : ""}>
              <b>${escapeHtml(kb.name)}</b>
              <span class="subtle">${escapeHtml(kb.sourceType)} · ${knowledgeFormatCount(kb)}</span>
            </label>`
          )
          .join("")}
      </div>`,
      "导入",
      () => {
        const selectedId = document.querySelector("input[name='knowledge-import']:checked")?.value;
        const kb = knowledgeRuntime.get(selectedId);
        state.modal = null;
        showToast(kb ? `已导入知识库：${kb.name}` : "知识库已导入");
      }
    );
  }

  if (state.modal === "knowledgeEdit") {
    const kb = knowledgeRuntime.get(state.knowledgeEditId);
    if (!kb) return "";
    return modal(
      "编辑知识库",
      `<div class="knowledge-modal-form">
        <label>
          <span>知识库名称</span>
          <input class="input" data-knowledge-edit-name value="${escapeHtml(state.knowledgeEditName || kb.name)}" placeholder="请输入知识库名称">
        </label>
        <label>
          <span>描述</span>
          <textarea class="textarea" data-knowledge-edit-description placeholder="请输入知识库描述">${escapeHtml(state.knowledgeEditDescription || kb.description)}</textarea>
        </label>
        <div class="hint">仅保存 Mock 数据，真实后端接入后会调用 PATCH /api/knowledge-bases/:id。</div>
      </div>`,
      "保存",
      () => {
        const name = document.querySelector("[data-knowledge-edit-name]")?.value.trim();
        const description = document.querySelector("[data-knowledge-edit-description]")?.value.trim();
        if (!name) {
          showToast("请输入知识库名称");
          return;
        }
        const updated = knowledgeRuntime.update(kb.id, { name, description: description || kb.description });
        state.modal = null;
        state.knowledgeEditId = null;
        showToast("知识库已保存");
        setState({ knowledgeSelectedId: updated.id });
      }
    );
  }

  if (state.modal === "knowledgeDelete") {
    const kb = knowledgeRuntime.get(state.knowledgeDeleteId);
    if (!kb) return "";
    return modal(
      "删除知识库",
      `<div class="knowledge-delete-confirm">
        <b>确认删除“${escapeHtml(kb.name)}”？</b>
        <p>删除后 Mock 列表、文档和 Chunk 会同步移除。真实后端接入后需要同时清理对象存储、向量索引和审计日志。</p>
      </div>`,
      "删除",
      () => {
        knowledgeRuntime.remove(kb.id);
        state.modal = null;
        state.knowledgeDeleteId = null;
        showToast("知识库已删除");
        setState({ knowledgeSelectedId: knowledgeBases[0]?.id || null, knowledgePage: 1 });
      }
    );
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
  ${step === 1 ? `<div class="grid-2">${knowledgeSupportedSources.slice(0, 4).map((source) => `<div class="mini-card"><b>${escapeHtml(source.label)}</b><br><span class="subtle">${escapeHtml(source.description)}</span></div>`).join("")}</div>` : ""}
  ${step === 2 ? `<div class="empty" style="border:1px dashed var(--line-dark); border-radius:8px">＋ 将文件拖拽至此区域或选择文件上传<br><span class="subtle">支持 PDF、Word、Excel、TXT、CSV 等文件</span></div>` : ""}
  ${step === 3 ? `<div class="mini-card"><div class="mini-card-head">数据处理中 <span class="tag blue">86%</span></div><div class="subtle">正在切分文档、生成索引、抽取问答对。</div></div>` : ""}
  ${step === 4 ? `<div class="empty">知识库已创建完成，可绑定给 Jelly AI 助手使用。</div>` : ""}`;
}
