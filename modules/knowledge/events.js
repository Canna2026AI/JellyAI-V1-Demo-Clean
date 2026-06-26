// Knowledge base page events.

const bindKnowledgeOriginalAgentEvents = typeof bindAgentEvents === "function" ? bindAgentEvents : null;
let knowledgeSearchTimer = null;
let knowledgeLoadSeq = 0;

if (bindKnowledgeOriginalAgentEvents) {
  bindAgentEvents = function bindAgentEventsWithKnowledge() {
    bindKnowledgeOriginalAgentEvents();
    if (state.assistantSub === "knowledge") bindKnowledgeEvents();
  };
}

function bindKnowledgeEvents() {
  ensureKnowledgeState();
  if (!state.knowledgeBackendLoaded && !state.knowledgeBackendLoading) loadKnowledgeFromBackend();
  bindKnowledgeListEvents();
  bindKnowledgeCreateEvents();
}

function loadKnowledgeFromBackend() {
  const requestId = ++knowledgeLoadSeq;
  state.knowledgeBackendLoading = true;
  state.knowledgeLoadRequestId = requestId;
  state.knowledgeLoading = !knowledgeBases.length;
  knowledgeRuntime
    .load({
      requestId,
      q: state.knowledgeSearchQuery,
      status: state.knowledgeStatusFilter,
      sort: state.knowledgeSort,
    })
    .then(() => {
      if (state.knowledgeLoadRequestId !== requestId) return;
      const current = knowledgeRuntime.get(state.knowledgeSelectedId);
      setState({
        knowledgeBackendLoading: false,
        knowledgeLoading: false,
        knowledgeSelectedId: current?.id || knowledgeBases[0]?.id || null,
      });
    })
    .catch((error) => {
      if (state.knowledgeLoadRequestId !== requestId) return;
      state.knowledgeBackendLoaded = true;
      setState({ knowledgeBackendLoading: false, knowledgeLoading: false, knowledgeBackendError: error.message });
      showToast(`后端连接失败，已使用本地数据：${error.message}`);
    });
}

function bindKnowledgeListEvents() {
  const search = document.querySelector("[data-knowledge-search]");
  if (search) {
    search.addEventListener("input", () => {
      state.knowledgeSearchQuery = search.value;
      state.knowledgePage = 1;
      window.clearTimeout(knowledgeSearchTimer);
      knowledgeSearchTimer = window.setTimeout(() => loadKnowledgeFromBackend(), 220);
    });
  }

  const docs = document.querySelector("[data-knowledge-docs]");
  if (docs) docs.addEventListener("click", () => showToast("知识库后端接入清单已整理在 docs/knowledge-todo.md"));

  const status = document.querySelector("[data-knowledge-status]");
  if (status) {
    status.addEventListener("change", () => {
      state.knowledgeStatusFilter = status.value;
      state.knowledgePage = 1;
      loadKnowledgeFromBackend();
    });
  }

  const sort = document.querySelector("[data-knowledge-sort]");
  if (sort) {
    sort.addEventListener("change", () => {
      state.knowledgeSort = sort.value;
      state.knowledgePage = 1;
      loadKnowledgeFromBackend();
    });
  }

  document.querySelectorAll("[data-knowledge-select]").forEach((el) =>
    el.addEventListener("click", () => setState({ knowledgeSelectedId: el.dataset.knowledgeSelect }))
  );

  document.querySelectorAll("[data-knowledge-page]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      const page = Number(el.dataset.knowledgePage);
      if (!Number.isFinite(page) || page < 1) return;
      setState({ knowledgePage: page });
    })
  );

  document.querySelectorAll("[data-knowledge-toggle]").forEach((el) =>
    el.addEventListener("click", async (event) => {
      event.stopPropagation();
      try {
        const kb = await knowledgeRuntime.toggle(el.dataset.knowledgeToggle);
        if (!kb) return;
        showToast(kb.enabled ? "知识库已启用" : "知识库已停用");
        setState({ knowledgeSelectedId: kb.id });
      } catch (error) {
        showToast(`状态更新失败：${error.message}`);
      }
    })
  );

  document.querySelectorAll("[data-knowledge-edit]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      const kb = knowledgeRuntime.get(el.dataset.knowledgeEdit);
      if (!kb) return;
      setState({
        modal: "knowledgeEdit",
        knowledgeEditId: kb.id,
        knowledgeEditName: kb.name,
        knowledgeEditDescription: kb.description,
      });
    })
  );

  document.querySelectorAll("[data-knowledge-delete]").forEach((el) =>
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      const kb = knowledgeRuntime.get(el.dataset.knowledgeDelete);
      if (!kb) return;
      setState({ modal: "knowledgeDelete", knowledgeDeleteId: kb.id });
    })
  );

  document.querySelectorAll("[data-knowledge-reindex]").forEach((el) =>
    el.addEventListener("click", async (event) => {
      event.stopPropagation();
      const id = el.dataset.knowledgeReindex;
      const kb = knowledgeRuntime.reindexLocal(id);
      if (!kb) return;
      showToast("已开始重新索引");
      setState({ knowledgeSelectedId: id, knowledgeActionLoadingId: id });
      try {
        await knowledgeRuntime.reindex(id);
        showToast("重新索引完成");
        setState({ knowledgeActionLoadingId: null, knowledgeSelectedId: id });
      } catch (error) {
        showToast(`重新索引失败：${error.message}`);
        setState({ knowledgeActionLoadingId: null, knowledgeSelectedId: id });
      }
    })
  );
}

function bindKnowledgeCreateEvents() {
  document.querySelectorAll("[data-knowledge-type]").forEach((el) =>
    el.addEventListener("click", () =>
      setState({
        knowledgeCreateType: el.dataset.knowledgeType,
        knowledgeVectorMode: el.dataset.knowledgeType === "excel" || el.dataset.knowledgeType === "csv" ? "row" : "segment",
        knowledgeSegmentMode: "auto",
        knowledgePreview: false,
        knowledgeUpload: null,
        knowledgeCreateDraft: { sourceType: el.dataset.knowledgeType },
      })
    )
  );

  document.querySelectorAll("[data-knowledge-draft]").forEach((el) =>
    el.addEventListener("input", () => {
      state.knowledgeCreateDraft = {
        ...state.knowledgeCreateDraft,
        sourceType: state.knowledgeCreateType,
        [el.dataset.knowledgeDraft]: el.value,
      };
    })
  );

  const textEditor = document.querySelector("[data-knowledge-text]");
  if (textEditor) {
    textEditor.addEventListener("input", () => {
      state.knowledgeCreateDraft = {
        ...state.knowledgeCreateDraft,
        sourceType: "text",
        text: textEditor.textContent.trim(),
      };
    });
  }

  document.querySelectorAll("[data-segment-mode]").forEach((el) =>
    el.addEventListener("click", (event) => {
      if (event.target.closest("input, button, a")) return;
      const mode = el.dataset.segmentMode;
      setState({ knowledgeSegmentMode: mode, knowledgePreview: mode === "custom" });
    })
  );

  document.querySelectorAll("[data-vector-mode]").forEach((el) =>
    el.addEventListener("change", () => setState({ knowledgeVectorMode: el.dataset.vectorMode, knowledgeSegmentMode: "auto", knowledgePreview: true }))
  );

  const knowledgeFileUpload = document.querySelector("[data-knowledge-file-upload]");
  const knowledgeFileInput = document.querySelector("[data-knowledge-file-input]");
  if (knowledgeFileUpload) {
    knowledgeFileUpload.addEventListener("click", () => knowledgeFileInput?.click());
    if (knowledgeFileInput) {
      knowledgeFileInput.addEventListener("change", () => {
        const file = knowledgeFileInput.files?.[0];
        if (file) startKnowledgeFileUpload(file);
      });
    }
    knowledgeFileUpload.addEventListener("dragover", (event) => {
      event.preventDefault();
      knowledgeFileUpload.classList.add("dragging");
    });
    knowledgeFileUpload.addEventListener("dragleave", () => knowledgeFileUpload.classList.remove("dragging"));
    knowledgeFileUpload.addEventListener("drop", (event) => {
      event.preventDefault();
      knowledgeFileUpload.classList.remove("dragging");
      const file = event.dataTransfer?.files?.[0];
      if (file) startKnowledgeFileUpload(file);
      else startKnowledgeFallbackUpload(true, "未知文件");
    });
  }

  const templateDownload = document.querySelector("[data-template-download]");
  if (templateDownload) templateDownload.addEventListener("click", () => showToast("正在下载逐行向量示例文件"));

  const dynamicSwitch = document.querySelector("[data-knowledge-dynamic]");
  if (dynamicSwitch) {
    dynamicSwitch.addEventListener("click", () => {
      showToast(dynamicSwitch.classList.contains("on") ? "已开启动态页面采集" : "已关闭动态页面采集");
    });
  }

  const knowledgePrev = document.querySelector("[data-knowledge-prev]");
  if (knowledgePrev) {
    knowledgePrev.addEventListener("click", () => {
      if (state.knowledgeCreateStep === 1) {
        setState({ page: "knowledge", assistantSub: "knowledge" });
        return;
      }
      setState({ knowledgeCreateStep: state.knowledgeCreateStep - 1 });
    });
  }

  const knowledgeNext = document.querySelector("[data-knowledge-next]");
  if (knowledgeNext) {
    knowledgeNext.addEventListener("click", async () => {
      if (state.knowledgeCreateStep === 1 && !state.knowledgeCreateType) {
        showToast("请选择内容类型");
        return;
      }
      if (state.knowledgeCreateStep === 2 && !collectKnowledgeCreateDraft()) return;
      if (state.knowledgeCreateStep === 2 && !isKnowledgeUploadReady()) return;
      if (state.knowledgeCreateStep === 4) {
        const finalName = document.querySelector("[data-knowledge-final-name]")?.value?.trim();
        let kb;
        try {
          kb = await knowledgeRuntime.create({
          ...state.knowledgeCreateDraft,
          sourceType: state.knowledgeCreateType,
          name: finalName || state.knowledgeCreateDraft.name,
          uploadName: state.knowledgeUpload?.name,
          size: state.knowledgeUpload?.size,
          contentBase64: state.knowledgeUpload?.contentBase64,
          fileName: state.knowledgeUpload?.name,
          websiteUrl: state.knowledgeCreateType === "website" ? state.knowledgeCreateDraft.description : "",
        });
        } catch (error) {
          showToast(`知识库创建失败：${error.message}`);
          return;
        }
        showToast("知识库创建完成");
        setState({
          page: "knowledge",
          assistantSub: "knowledge",
          knowledgeSelectedId: kb.id,
          knowledgeCreateStep: 1,
          knowledgeCreateType: "",
          knowledgeVectorMode: "row",
          knowledgeSegmentMode: "auto",
          knowledgePreview: false,
          knowledgeUpload: null,
          knowledgeCreateDraft: {},
          knowledgePage: 1,
        });
        return;
      }
      setState({
        knowledgeCreateStep: state.knowledgeCreateStep + 1,
        knowledgePreview: state.knowledgeCreateStep + 1 === 3,
      });
    });
  }

  const generatePreview = document.querySelector("[data-generate-preview]");
  if (generatePreview) {
    generatePreview.addEventListener("click", (event) => {
      event.stopPropagation();
      showToast("Chunk 预览已生成");
      setState({ knowledgePreview: true });
    });
  }

  const resetSegment = document.querySelector("[data-reset-segment]");
  if (resetSegment) {
    resetSegment.addEventListener("click", (event) => {
      event.stopPropagation();
      showToast("分段设置已重置");
      setState({ knowledgeSegmentMode: "auto", knowledgePreview: false });
    });
  }
}

function collectKnowledgeCreateDraft() {
  const draft = { ...state.knowledgeCreateDraft, sourceType: state.knowledgeCreateType };
  document.querySelectorAll("[data-knowledge-draft]").forEach((el) => {
    draft[el.dataset.knowledgeDraft] = el.value.trim();
  });
  const textEditor = document.querySelector("[data-knowledge-text]");
  if (textEditor) draft.text = textEditor.textContent.trim();
  if (!draft.name && state.knowledgeCreateType !== "website") draft.name = `${knowledgeSourceById(state.knowledgeCreateType).label}知识库`;
  if (state.knowledgeCreateType === "text" && !draft.text) {
    showToast("请输入文本内容");
    return false;
  }
  if (state.knowledgeCreateType === "website" && !draft.description) {
    showToast("请输入网站链接");
    return false;
  }
  state.knowledgeCreateDraft = draft;
  return true;
}

function isKnowledgeUploadReady() {
  if (["text", "website"].includes(state.knowledgeCreateType)) return true;
  if (state.knowledgeUpload?.status === "已完成") return true;
  showToast("请先完成文件上传");
  return false;
}

function isKnowledgeSupportedFile(fileName = "") {
  if (!fileName) return true;
  return /\.(pdf|doc|docx|xls|xlsx|txt|csv|json|md|html?)$/i.test(fileName);
}

function startKnowledgeFallbackUpload(shouldFail, fileName) {
  const source = knowledgeSourceById(state.knowledgeCreateType);
  const ext = source.id === "word" ? "docx" : source.id === "excel" ? "xlsx" : source.id;
  const upload = {
    name: fileName || `${source.label}知识库示例.${ext}`,
    size: source.id === "pdf" ? "248KB" : "20KB",
    progress: 8,
    status: "上传中",
    error: "",
  };
  setState({ knowledgeUpload: upload });
  [35, 68, 100].forEach((progress, index) => {
    setTimeout(() => {
      if (shouldFail && progress > 68) return;
      if (shouldFail && progress === 68) {
        setState({
          knowledgeUpload: {
            ...upload,
            progress,
            status: "失败",
            error: "文件上传失败，请重新上传",
          },
        });
        showToast("上传失败，请重试");
        return;
      }
      const done = progress === 100;
      const next = { ...upload, progress, status: done ? "已完成" : "上传中", error: "" };
      state.knowledgeCreateDraft = {
        ...state.knowledgeCreateDraft,
        sourceType: state.knowledgeCreateType,
        documentName: upload.name,
        name: state.knowledgeCreateDraft.name || `${source.label}知识库`,
      };
      setState({ knowledgeUpload: next });
      if (done) showToast(`${upload.name} 上传成功`);
    }, 260 * (index + 1));
  });
}

async function startKnowledgeFileUpload(file) {
  if (!isKnowledgeSupportedFile(file.name)) {
    startKnowledgeFallbackUpload(true, file.name);
    return;
  }
  const upload = {
    name: file.name,
    size: `${Math.max(1, Math.round(file.size / 1024))}KB`,
    progress: 10,
    status: "读取中",
    error: "",
  };
  setState({ knowledgeUpload: upload });
  try {
    const payload = await KnowledgeService.uploadDocument(file, { sourceType: state.knowledgeCreateType });
    const next = {
      ...upload,
      ...payload,
      name: payload.fileName || payload.documentName || file.name,
      size: `${Math.max(1, Math.round(file.size / 1024))}KB`,
      progress: 100,
      status: "已完成",
      error: "",
    };
    state.knowledgeCreateDraft = {
      ...state.knowledgeCreateDraft,
      sourceType: state.knowledgeCreateType,
      documentName: next.name,
      name: state.knowledgeCreateDraft.name || `${knowledgeSourceById(state.knowledgeCreateType).label}知识库`,
      contentBase64: payload.contentBase64,
      fileName: next.name,
    };
    showToast(`${next.name} 上传成功`);
    setState({ knowledgeUpload: next });
  } catch (error) {
    showToast(`上传失败：${error.message}`);
    setState({ knowledgeUpload: { ...upload, progress: 68, status: "失败", error: error.message } });
  }
}

function bindKnowledgeModalEvents() {
  // Knowledge modal actions are handled by the shared data-modal-ok callback.
}
