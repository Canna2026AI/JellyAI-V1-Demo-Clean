// Knowledge module helpers.

function ensureKnowledgeState() {
  const defaults = {
    knowledgeSearchQuery: "",
    knowledgeStatusFilter: "全部状态",
    knowledgeSort: "updatedDesc",
    knowledgePage: 1,
    knowledgePageSize: 4,
    knowledgeSelectedId: knowledgeBases[0]?.id || null,
    knowledgeLoading: false,
    knowledgeActionLoadingId: null,
    knowledgeUpload: null,
    knowledgeCreateDraft: {},
    knowledgeCreateName: "",
    knowledgeEditId: null,
  };
  Object.keys(defaults).forEach((key) => {
    if (typeof state[key] === "undefined") state[key] = defaults[key];
  });
}

function knowledgeSourceById(sourceId) {
  return knowledgeSupportedSources.find((source) => source.id === sourceId) || knowledgeSupportedSources[0];
}

function knowledgeStatusTag(status) {
  const cls = status === "启用" ? "green" : status === "索引中" ? "blue" : status === "失败" ? "red" : "";
  return `<span class="tag ${cls}">${escapeHtml(status)}</span>`;
}

function knowledgeEmbeddingTag(status) {
  const cls = status === "已完成" ? "green" : status === "处理中" ? "blue" : status.includes("失败") ? "red" : "";
  return `<span class="tag ${cls}">${escapeHtml(status)}</span>`;
}

function knowledgeTotalSize(items = knowledgeBases) {
  return items.reduce((sum, item) => sum + knowledgeSizeToKb(item.size), 0).toFixed(2) + "KB";
}

function knowledgeSizeToKb(size) {
  if (!size) return 0;
  const n = Number.parseFloat(size);
  if (!Number.isFinite(n)) return 0;
  return size.toUpperCase().includes("MB") ? n * 1024 : n;
}

function knowledgeFormatCount(kb) {
  return `${kb.documentCount} 个文档 · ${kb.chunkCount} 个 Chunk`;
}

function knowledgePaginate(items, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return {
    totalPages,
    page: safePage,
    items: items.slice((safePage - 1) * pageSize, safePage * pageSize),
  };
}

function knowledgeNow() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function knowledgeDefaultChunks(sourceType, name) {
  const base = [
    `来源 ${name || sourceType} 已完成内容清洗，保留业务关键词和上下文。`,
    "系统按当前分段规则生成可检索 Chunk，等待后端 Embedding 服务接入。",
    "Mock 流程已记录文档状态、Chunk 数量、更新时间和索引状态。",
  ];
  return base.map((text, index) => ({
    id: `ck-new-${Date.now()}-${index + 1}`,
    chars: text.length,
    embedding: "已完成",
    text,
  }));
}
