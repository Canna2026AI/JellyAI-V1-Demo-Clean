// Knowledge base page events.

function bindKnowledgeEvents() {
document.querySelectorAll("[data-knowledge-type]").forEach((el) =>
    el.addEventListener("click", () => setState({ knowledgeCreateType: el.dataset.knowledgeType, knowledgeVectorMode: "row", knowledgeSegmentMode: "auto", knowledgePreview: false }))
  );
  document.querySelectorAll("[data-segment-mode]").forEach((el) =>
    el.addEventListener("click", (event) => {
      if (event.target.closest("input, button, a")) return;
      const mode = el.dataset.segmentMode;
      setState({ knowledgeSegmentMode: mode, knowledgePreview: mode === "custom" });
    })
  );
  document.querySelectorAll("[data-vector-mode]").forEach((el) =>
    el.addEventListener("change", () => setState({ knowledgeVectorMode: el.dataset.vectorMode, knowledgeSegmentMode: "auto", knowledgePreview: false }))
  );
  const knowledgeFileUpload = document.querySelector("[data-knowledge-file-upload]");
  if (knowledgeFileUpload) knowledgeFileUpload.addEventListener("click", () => {
    showToast("物流问答库.xlsx 上传成功，已进入数据处理");
    setState({ knowledgeCreateStep: 3, knowledgeVectorMode: "row", knowledgeSegmentMode: "auto", knowledgePreview: false });
  });
  const templateDownload = document.querySelector("[data-template-download]");
  if (templateDownload) templateDownload.addEventListener("click", () => showToast("正在下载逐行向量示例文件"));
  const knowledgePrev = document.querySelector("[data-knowledge-prev]");
  if (knowledgePrev) {
    knowledgePrev.addEventListener("click", () => {
      if (state.knowledgeCreateStep === 1) {
        setState({ page: "ai", assistantSub: "knowledge" });
        return;
      }
      setState({ knowledgeCreateStep: state.knowledgeCreateStep - 1 });
    });
  }
  const knowledgeNext = document.querySelector("[data-knowledge-next]");
  if (knowledgeNext) {
    knowledgeNext.addEventListener("click", () => {
      if (state.knowledgeCreateStep === 1 && !state.knowledgeCreateType) {
        showToast("请选择内容类型");
        return;
      }
      if (state.knowledgeCreateStep === 4) {
        showToast("知识库创建完成");
        setState({ page: "ai", assistantSub: "knowledge", knowledgeCreateStep: 1, knowledgeCreateType: "", knowledgeVectorMode: "row", knowledgeSegmentMode: "auto", knowledgePreview: false });
        return;
      }
      setState({
        knowledgeCreateStep: state.knowledgeCreateStep + 1,
        knowledgeCreateType: state.knowledgeCreateType,
      });
    });
  }
  const generatePreview = document.querySelector("[data-generate-preview]");
  if (generatePreview) generatePreview.addEventListener("click", (event) => {
    event.stopPropagation();
    setState({ knowledgePreview: true });
  });
  const resetSegment = document.querySelector("[data-reset-segment]");
  if (resetSegment) resetSegment.addEventListener("click", (event) => {
    event.stopPropagation();
    setState({ knowledgePreview: false });
  });
}

function bindKnowledgeModalEvents() {
  // Knowledge modal actions are handled by the shared data-modal-ok callback.
}
