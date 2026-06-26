// Knowledge base page events.

function bindKnowledgeEvents() {
  ensureKnowledgeCreateState();
  document.querySelectorAll("[data-assistant-sub]").forEach((el) =>
    el.addEventListener("click", () => setState({ page: "ai", selectedAssistant: null, assistantSub: el.dataset.assistantSub }))
  );
  document.querySelectorAll("[data-knowledge-breadcrumb]").forEach((el) =>
    el.addEventListener("click", () => {
      if (el.dataset.knowledgeBreadcrumb === "list") {
        setState({ page: "ai", assistantSub: "knowledge" });
      }
    })
  );
document.querySelectorAll("[data-knowledge-type]").forEach((el) =>
    el.addEventListener("click", () => setState({
      knowledgeCreateType: el.dataset.knowledgeType,
      knowledgeVectorMode: "row",
      knowledgeSegmentMode: "auto",
      knowledgePreview: false,
      knowledgeUploadedFile: null,
      knowledgeUploadPreview: [],
      knowledgeUploadId: "",
    }))
  );
  document.querySelectorAll("[data-segment-mode]").forEach((el) =>
    el.addEventListener("click", (event) => {
      if (event.target.closest("input, button, a")) return;
      const mode = el.dataset.segmentMode;
      void updateKnowledgeSegmentation({ segmentMode: mode });
    })
  );
  document.querySelectorAll("[data-vector-mode]").forEach((el) =>
    el.addEventListener("change", () => void updateKnowledgeSegmentation({ vectorMode: el.dataset.vectorMode }))
  );
  const knowledgeFileUpload = document.querySelector("[data-knowledge-file-upload]");
  const knowledgeFileInput = document.querySelector("[data-knowledge-file-input]");
  if (knowledgeFileUpload && knowledgeFileInput) {
    knowledgeFileUpload.addEventListener("click", (event) => {
      if (event.target.closest("[data-knowledge-reupload]") || event.target === knowledgeFileInput) return;
      knowledgeFileInput.click();
    });
    knowledgeFileUpload.addEventListener("dragover", (event) => {
      event.preventDefault();
      knowledgeFileUpload.classList.add("dragover");
    });
    knowledgeFileUpload.addEventListener("dragleave", () => knowledgeFileUpload.classList.remove("dragover"));
    knowledgeFileUpload.addEventListener("drop", (event) => {
      event.preventDefault();
      knowledgeFileUpload.classList.remove("dragover");
      void uploadKnowledgeFile(event.dataTransfer.files?.[0]);
    });
    knowledgeFileInput.addEventListener("change", () => void uploadKnowledgeFile(knowledgeFileInput.files?.[0]));
  }
  document.querySelector("[data-knowledge-reupload]")?.addEventListener("click", (event) => {
    event.stopPropagation();
    document.querySelector("[data-knowledge-file-input]")?.click();
  });
  const templateDownload = document.querySelector("[data-template-download]");
  if (templateDownload) templateDownload.addEventListener("click", () => showToast("正在下载逐行向量示例文件"));
  document.querySelectorAll("[data-knowledge-step-jump]").forEach((el) =>
    el.addEventListener("click", () => {
      const step = Number(el.dataset.knowledgeStepJump);
      if (step > state.knowledgeCreateStep) return;
      setState({ knowledgeCreateStep: step });
    })
  );
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
      if (state.knowledgeCreateStep === 2 && state.knowledgeCreateType === "文档文件" && !state.knowledgeUploadedFile) {
        showToast("请先上传文件");
        return;
      }
      if (state.knowledgeCreateStep === 4) {
        void finishKnowledgeCreate();
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
    captureKnowledgeCustomSegment();
    void updateKnowledgeSegmentation({ segmentMode: "custom" });
  });
  const resetSegment = document.querySelector("[data-reset-segment]");
  if (resetSegment) resetSegment.addEventListener("click", (event) => {
    event.stopPropagation();
    setState({
      knowledgeCustomSegment: {
        delimiter: "\\n",
        maxLength: 2000,
        rules: { trimSpaces: true, removeUrls: false, removeEmails: false, removePhones: false, removeIds: false, removeCards: false },
      },
      knowledgePreview: true,
    });
  });
}

function bindKnowledgeModalEvents() {
  // Knowledge modal actions are handled by the shared data-modal-ok callback.
}
