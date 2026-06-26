// Knowledge upload and segmentation helpers.

function ensureKnowledgeCreateState() {
  if (!state.knowledgeUploadedFile) state.knowledgeUploadedFile = null;
  if (!state.knowledgeUploadPreview) state.knowledgeUploadPreview = [];
  if (!state.knowledgeUploadId) state.knowledgeUploadId = "";
  if (typeof state.knowledgeUploading !== "boolean") state.knowledgeUploading = false;
  if (!state.knowledgeCustomSegment) {
    state.knowledgeCustomSegment = {
      delimiter: "\\n",
      maxLength: 2000,
      rules: {
        trimSpaces: true,
        removeUrls: false,
        removeEmails: false,
        removePhones: false,
        removeIds: false,
        removeCards: false,
      },
    };
  }
}

function resetKnowledgeCreateState(patch = {}) {
  setState({
    knowledgeCreateStep: 1,
    knowledgeCreateType: "",
    knowledgeVectorMode: "row",
    knowledgeSegmentMode: "auto",
    knowledgePreview: false,
    knowledgeUploadedFile: null,
    knowledgeUploadPreview: [],
    knowledgeUploadId: "",
    knowledgeUploading: false,
    knowledgeCustomSegment: {
      delimiter: "\\n",
      maxLength: 2000,
      rules: {
        trimSpaces: true,
        removeUrls: false,
        removeEmails: false,
        removePhones: false,
        removeIds: false,
        removeCards: false,
      },
    },
    ...patch,
  });
}

function getKnowledgeApi() {
  return window.agentsService || null;
}

function formatKnowledgeFileSize(size = 0) {
  if (!size) return "0KB";
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)}KB`;
  return `${(size / 1024 / 1024).toFixed(2)}M`;
}

function knowledgeFileIcon(fileName = "") {
  if (/\.(csv|xls|xlsx|xlsm)$/i.test(fileName)) return "X";
  if (/\.(pdf)$/i.test(fileName)) return "P";
  if (/\.(doc|docx)$/i.test(fileName)) return "W";
  if (/\.(ppt|pptx)$/i.test(fileName)) return "PPT";
  return "文";
}

function isLikelyBinaryText(text) {
  return /[\u0000-\u0008\u000E-\u001F]/.test(text.slice(0, 2000));
}

async function readKnowledgeFileText(file) {
  const text = await file.text();
  if (isLikelyBinaryText(text)) return "";
  return text.slice(0, 400000);
}

function applyKnowledgeUpload(upload) {
  state.knowledgeUploadId = upload.id;
  state.knowledgeUploadedFile = {
    id: upload.id,
    name: upload.fileName,
    size: upload.size,
    type: upload.fileType,
    icon: knowledgeFileIcon(upload.fileName),
  };
  state.knowledgeVectorMode = upload.vectorMode || state.knowledgeVectorMode || "row";
  state.knowledgeSegmentMode = upload.segmentMode || state.knowledgeSegmentMode || "auto";
  state.knowledgeCustomSegment = upload.customConfig || state.knowledgeCustomSegment;
  state.knowledgeUploadPreview = upload.segments || [];
  state.knowledgePreview = true;
}

function buildLocalKnowledgeSegments(fileName, text, customConfig = state.knowledgeCustomSegment) {
  const fallback = [
    "问题: 欧洲海运包税运行线路　答案: 深圳装柜 → 盐田港 → 鹿特丹港落港 → 荷兰/比利时清关 → 快递或卡车派送",
    "问题: 单件计费重规则　答案: 单件计费重不足 12KG 按 12KG 计算",
    "问题: 转人工场景　答案: 合同、投诉、报价异常或用户明确要求人工时转入人工客服",
  ];
  const delimiter = (customConfig?.delimiter || "\\n").replace(/\\n/g, "\n").replace(/\\t/g, "\t");
  const pieces = (text ? text.split(delimiter) : fallback).map((item) => item.trim()).filter(Boolean).slice(0, 8);
  return pieces.map((textItem, index) => ({
    id: `#${String(index + 1).padStart(3, "0")}`,
    count: `${textItem.length}字符`,
    text: textItem,
    vectorType: state.knowledgeVectorMode === "segment" ? "分段向量" : "逐行向量",
    segmentMode: state.knowledgeSegmentMode === "custom" ? "自定义" : "自动分段与清洗",
    relation: `${state.knowledgeSegmentMode === "custom" ? "自定义分段" : "自动分段"}：${fileName} → 片段 ${index + 1} → 向量`,
  }));
}

async function uploadKnowledgeFile(file) {
  if (!file) return;
  ensureKnowledgeCreateState();
  state.knowledgeUploading = true;
  render();
  let text = "";
  try {
    text = await readKnowledgeFileText(file);
  } catch (_error) {
    text = "";
  }
  const payload = {
    fileName: file.name,
    fileType: file.type || "application/octet-stream",
    size: file.size,
    content: text,
    encoding: "text",
    vectorMode: state.knowledgeVectorMode || "row",
    segmentMode: state.knowledgeSegmentMode || "auto",
    customConfig: state.knowledgeCustomSegment,
  };
  const api = getKnowledgeApi();
  try {
    const upload = api ? await api.uploadKnowledgeFile(payload) : null;
    if (upload) applyKnowledgeUpload(upload);
    else {
      state.knowledgeUploadedFile = { id: `local-${Date.now()}`, name: file.name, size: file.size, type: file.type, icon: knowledgeFileIcon(file.name) };
      state.knowledgeUploadPreview = buildLocalKnowledgeSegments(file.name, text);
      state.knowledgePreview = true;
    }
    state.knowledgeCreateStep = 3;
    showToast(`${file.name} 上传成功，已生成分段预览`);
  } catch (error) {
    state.knowledgeUploadedFile = { id: `local-${Date.now()}`, name: file.name, size: file.size, type: file.type, icon: knowledgeFileIcon(file.name) };
    state.knowledgeUploadPreview = buildLocalKnowledgeSegments(file.name, text);
    state.knowledgePreview = true;
    state.knowledgeCreateStep = 3;
    showToast(error?.message || "后端未连接，已在当前页面生成预览");
  } finally {
    state.knowledgeUploading = false;
    render();
  }
}

function captureKnowledgeCustomSegment() {
  ensureKnowledgeCreateState();
  const rules = { ...state.knowledgeCustomSegment.rules };
  document.querySelectorAll("[data-segment-rule]").forEach((input) => {
    rules[input.dataset.segmentRule] = input.checked;
  });
  const delimiter = document.querySelector("[data-segment-delimiter]")?.value || "\\n";
  const maxLength = Number(document.querySelector("[data-segment-max-length]")?.value || 2000);
  state.knowledgeCustomSegment = {
    delimiter,
    maxLength: Math.min(Math.max(maxLength, 200), 4000),
    rules,
  };
  return state.knowledgeCustomSegment;
}

async function updateKnowledgeSegmentation(patch = {}) {
  ensureKnowledgeCreateState();
  if (state.knowledgeSegmentMode === "custom" || patch.segmentMode === "custom") captureKnowledgeCustomSegment();
  const next = {
    vectorMode: patch.vectorMode || state.knowledgeVectorMode || "row",
    segmentMode: patch.segmentMode || state.knowledgeSegmentMode || "auto",
    customConfig: state.knowledgeCustomSegment,
  };
  state.knowledgeVectorMode = next.vectorMode;
  state.knowledgeSegmentMode = next.segmentMode;
  state.knowledgePreview = true;
  const api = getKnowledgeApi();
  if (api && state.knowledgeUploadId) {
    try {
      const upload = await api.updateKnowledgeUpload(state.knowledgeUploadId, next);
      applyKnowledgeUpload(upload);
      showToast("分段预览已更新");
      render();
      return;
    } catch (error) {
      showToast(error?.message || "分段预览更新失败，已使用页面预览");
    }
  }
  state.knowledgeUploadPreview = buildLocalKnowledgeSegments(state.knowledgeUploadedFile?.name || "上传文件", "", state.knowledgeCustomSegment);
  render();
}

async function finishKnowledgeCreate() {
  ensureKnowledgeCreateState();
  const input = document.getElementById("knowledgeBaseNameInput");
  const name = input?.value.trim() || state.knowledgeUploadedFile?.name?.replace(/\.[^.]+$/, "") || "新建知识库";
  const api = getKnowledgeApi();
  try {
    const saved = api
      ? await api.createKnowledgeBase({ name, uploadId: state.knowledgeUploadId })
      : {
          id: `kb-${Date.now()}`,
          name,
          count: `${state.knowledgeUploadPreview.length || 1}条数据`,
          type: state.knowledgeVectorMode === "segment" ? "分段向量" : "逐行向量",
          icon: state.knowledgeUploadedFile?.icon || "文",
          size: formatKnowledgeFileSize(state.knowledgeUploadedFile?.size || 0),
          segments: state.knowledgeUploadPreview,
        };
    knowledgeBases.unshift(saved);
    showToast("知识库创建完成");
    resetKnowledgeCreateState({ page: "ai", assistantSub: "knowledge" });
  } catch (error) {
    showToast(error?.message || "知识库创建失败");
  }
}
