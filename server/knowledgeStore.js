const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const DATA_DIR = path.resolve(__dirname, "..", "storage", "knowledge");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const DB_FILE = path.join(DATA_DIR, "knowledge-db.json");

const DEFAULT_SOURCES = {
  text: { label: "文本", icon: "文", type: "文本" },
  website: { label: "网站", icon: "网", type: "网站" },
  pdf: { label: "PDF", icon: "P", type: "文档" },
  word: { label: "Word", icon: "W", type: "文档" },
  excel: { label: "Excel", icon: "X", type: "表格" },
  txt: { label: "TXT", icon: "T", type: "文本" },
  csv: { label: "CSV", icon: "C", type: "表格" },
};

function ensureStore() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    writeDb({ knowledgeBases: seedKnowledgeBases(), uploads: [], auditLogs: [] });
  }
}

function readDb() {
  ensureStore();
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDb(db) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function now() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function id(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function listKnowledgeBases(params = {}) {
  const db = readDb();
  const query = String(params.q || params.query || "").trim().toLowerCase();
  const status = params.status || "全部状态";
  const sourceType = params.sourceType || "全部类型";
  const sort = params.sort || "updatedDesc";
  const page = Math.max(1, Number(params.page || 1));
  const pageSize = Math.max(1, Math.min(50, Number(params.pageSize || 20)));

  let rows = db.knowledgeBases.filter((kb) => {
    const text = `${kb.name} ${kb.description} ${kb.type} ${kb.sourceType}`.toLowerCase();
    return (!query || text.includes(query)) && (status === "全部状态" || kb.status === status) && (sourceType === "全部类型" || kb.sourceType === sourceType);
  });

  rows = rows.slice().sort((a, b) => {
    if (sort === "updatedAsc") return a.updatedAt.localeCompare(b.updatedAt);
    if (sort === "nameAsc") return a.name.localeCompare(b.name, "zh-Hans-CN");
    if (sort === "dataDesc") return b.chunkCount - a.chunkCount;
    return b.updatedAt.localeCompare(a.updatedAt);
  });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const items = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  return {
    items,
    total,
    page: safePage,
    pageSize,
    totalPages,
    summary: summarize(db.knowledgeBases),
  };
}

function getKnowledgeBase(kbId) {
  return readDb().knowledgeBases.find((kb) => kb.id === kbId) || null;
}

async function createKnowledgeBase(payload = {}) {
  const db = readDb();
  const source = sourceMeta(payload.sourceType || "text");
  const title = String(payload.name || `${source.label}知识库`).trim();
  if (!title) throw httpError(400, "知识库名称不能为空");

  const created = now();
  const document = await documentFromPayload(payload, source, title);
  const kb = {
    id: id("kb"),
    name: title,
    description: payload.description || `${source.label}来源知识库`,
    type: source.type,
    sourceType: source.label,
    sourceKey: source.key,
    status: "启用",
    enabled: true,
    documentCount: document ? 1 : 0,
    chunkCount: document ? document.chunks.length : 0,
    embeddingStatus: document ? "已完成" : "待处理",
    size: document ? formatSize(document.sizeBytes) : "0KB",
    sizeBytes: document ? document.sizeBytes : 0,
    updatedAt: created,
    createdAt: created,
    icon: source.icon,
    documents: document ? [document] : [],
  };
  db.knowledgeBases.unshift(kb);
  audit(db, "knowledge.create", kb.id, null, kb);
  writeDb(db);
  return kb;
}

function updateKnowledgeBase(kbId, payload = {}) {
  const db = readDb();
  const kb = db.knowledgeBases.find((item) => item.id === kbId);
  if (!kb) throw httpError(404, "知识库不存在");
  const before = structuredCloneCompat(kb);
  if (typeof payload.name === "string" && payload.name.trim()) kb.name = payload.name.trim();
  if (typeof payload.description === "string") kb.description = payload.description.trim();
  if (typeof payload.enabled === "boolean") {
    kb.enabled = payload.enabled;
    kb.status = payload.enabled ? "启用" : "停用";
  }
  kb.updatedAt = now();
  audit(db, "knowledge.update", kb.id, before, kb);
  writeDb(db);
  return kb;
}

function deleteKnowledgeBase(kbId) {
  const db = readDb();
  const index = db.knowledgeBases.findIndex((kb) => kb.id === kbId);
  if (index < 0) throw httpError(404, "知识库不存在");
  const [removed] = db.knowledgeBases.splice(index, 1);
  for (const doc of removed.documents || []) {
    if (doc.objectKey) safeUnlink(path.join(UPLOAD_DIR, doc.objectKey));
  }
  audit(db, "knowledge.delete", kbId, removed, null);
  writeDb(db);
  return { ok: true };
}

function toggleKnowledgeBase(kbId) {
  const kb = getKnowledgeBase(kbId);
  if (!kb) throw httpError(404, "知识库不存在");
  return updateKnowledgeBase(kbId, { enabled: !kb.enabled });
}

function reindexKnowledgeBase(kbId, options = {}) {
  const db = readDb();
  const kb = db.knowledgeBases.find((item) => item.id === kbId);
  if (!kb) throw httpError(404, "知识库不存在");
  const before = structuredCloneCompat(kb);
  for (const doc of kb.documents) {
    const text = doc.rawText || extractTextFromStoredDocument(doc) || doc.name;
    doc.chunks = buildChunks(text, options);
    doc.status = "已完成";
    doc.updatedAt = now();
    for (const chunk of doc.chunks) chunk.embedding = "已完成";
  }
  syncCounters(kb);
  kb.status = kb.enabled ? "启用" : "停用";
  kb.embeddingStatus = "已完成";
  kb.updatedAt = now();
  audit(db, "knowledge.reindex", kb.id, before, kb);
  writeDb(db);
  return kb;
}

async function addDocument(kbId, payload = {}) {
  const db = readDb();
  const kb = db.knowledgeBases.find((item) => item.id === kbId);
  if (!kb) throw httpError(404, "知识库不存在");
  const before = structuredCloneCompat(kb);
  const source = sourceMeta(payload.sourceType || kb.sourceKey || kb.sourceType || "text");
  const doc = await documentFromPayload(payload, source, payload.name || kb.name);
  kb.documents.unshift(doc);
  syncCounters(kb);
  kb.embeddingStatus = "已完成";
  kb.status = kb.enabled ? "启用" : "停用";
  kb.updatedAt = now();
  audit(db, "document.create", kb.id, before, kb);
  writeDb(db);
  return doc;
}

function listDocuments(kbId) {
  const kb = getKnowledgeBase(kbId);
  if (!kb) throw httpError(404, "知识库不存在");
  return {
    items: kb.documents || [],
    total: (kb.documents || []).length,
  };
}

function deleteDocument(kbId, documentId) {
  const db = readDb();
  const kb = db.knowledgeBases.find((item) => item.id === kbId);
  if (!kb) throw httpError(404, "知识库不存在");
  const index = kb.documents.findIndex((doc) => doc.id === documentId);
  if (index < 0) throw httpError(404, "文档不存在");
  const before = structuredCloneCompat(kb);
  const [removed] = kb.documents.splice(index, 1);
  if (removed.objectKey) safeUnlink(path.join(UPLOAD_DIR, removed.objectKey));
  syncCounters(kb);
  kb.embeddingStatus = kb.documentCount ? "已完成" : "待处理";
  kb.status = kb.enabled ? "启用" : "停用";
  kb.updatedAt = now();
  audit(db, "document.delete", kb.id, before, kb);
  writeDb(db);
  return { ok: true, knowledgeBase: kb };
}

function listChunks(kbId, params = {}) {
  const kb = getKnowledgeBase(kbId);
  if (!kb) throw httpError(404, "知识库不存在");
  const documentId = params.documentId;
  const query = cleanText(params.q || params.query || "").toLowerCase();
  const page = Math.max(1, Number(params.page || 1));
  const pageSize = Math.max(1, Math.min(100, Number(params.pageSize || 20)));
  let rows = [];
  for (const doc of kb.documents || []) {
    if (documentId && doc.id !== documentId) continue;
    for (const chunk of doc.chunks || []) {
      rows.push({
        ...chunk,
        knowledgeBaseId: kb.id,
        knowledgeBaseName: kb.name,
        documentId: doc.id,
        documentName: doc.name,
      });
    }
  }
  if (query) rows = rows.filter((chunk) => `${chunk.text} ${chunk.documentName}`.toLowerCase().includes(query));
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  return {
    items: rows.slice((safePage - 1) * pageSize, safePage * pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

function previewChunks(payload = {}) {
  const text = cleanText(payload.text || payload.content || payload.name || "请输入内容后生成预览");
  return buildChunks(text, payload).slice(0, 10);
}

function searchKnowledge(params = {}) {
  const db = readDb();
  const q = cleanText(params.q || params.query || "");
  if (!q) return { items: [], total: 0 };
  const tokens = tokenize(q);
  const kbFilter = params.knowledgeBaseId;
  const matches = [];
  for (const kb of db.knowledgeBases) {
    if (!kb.enabled || (kbFilter && kb.id !== kbFilter)) continue;
    for (const doc of kb.documents || []) {
      for (const chunk of doc.chunks || []) {
        const score = scoreText(tokens, chunk.text);
        if (score <= 0) continue;
        matches.push({
          knowledgeBaseId: kb.id,
          knowledgeBaseName: kb.name,
          documentId: doc.id,
          documentName: doc.name,
          chunkId: chunk.id,
          score,
          text: chunk.text,
          embedding: chunk.embedding,
        });
      }
    }
  }
  matches.sort((a, b) => b.score - a.score);
  return { items: matches.slice(0, Number(params.limit || 10)), total: matches.length };
}

async function documentFromPayload(payload, source, fallbackName) {
  const created = now();
  let name = payload.documentName || payload.fileName || payload.name || fallbackName || `${source.label}文档`;
  let rawText = "";
  let sizeBytes = 0;
  let objectKey = "";

  if (payload.websiteUrl || source.key === "website") {
    const url = payload.websiteUrl || payload.description || payload.url || "";
    rawText = await fetchWebsiteText(url);
    name = name || url || "网站页面";
    sizeBytes = Buffer.byteLength(rawText);
  } else if (payload.contentBase64) {
    const buffer = Buffer.from(payload.contentBase64, "base64");
    const ext = extensionFromName(name, source.key);
    objectKey = `${id("file")}${ext}`;
    const filePath = path.join(UPLOAD_DIR, objectKey);
    fs.writeFileSync(filePath, buffer);
    sizeBytes = buffer.length;
    rawText = extractText(buffer, name, filePath);
  } else {
    rawText = payload.text || payload.content || payload.description || `${name} 暂无正文`;
    sizeBytes = Buffer.byteLength(rawText);
  }

  rawText = cleanText(rawText);
  const chunks = buildChunks(rawText, payload);
  return {
    id: id("doc"),
    name,
    type: source.label,
    status: "已完成",
    size: formatSize(sizeBytes),
    sizeBytes,
    objectKey,
    rawText,
    updatedAt: created,
    createdAt: created,
    chunks,
  };
}

function sourceMeta(value) {
  const normalized = String(value || "text").toLowerCase();
  const fromKey = DEFAULT_SOURCES[normalized];
  if (fromKey) return { ...fromKey, key: normalized };
  const fromLabel = Object.entries(DEFAULT_SOURCES).find(([, meta]) => meta.label.toLowerCase() === normalized || meta.label === value);
  if (fromLabel) return { ...fromLabel[1], key: fromLabel[0] };
  return { ...DEFAULT_SOURCES.text, key: "text" };
}

async function fetchWebsiteText(url) {
  if (!/^https?:\/\//i.test(url)) throw httpError(400, "网站链接必须以 http 或 https 开头");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "JellyAI-Knowledge-Demo/1.0" } });
    if (!response.ok) throw httpError(422, `网站采集失败：HTTP ${response.status}`);
    const html = await response.text();
    return stripHtml(html).slice(0, 200000);
  } finally {
    clearTimeout(timeout);
  }
}

function extractText(buffer, fileName, filePath) {
  const ext = path.extname(fileName).toLowerCase();
  if ([".txt", ".csv", ".json", ".md", ".html", ".htm"].includes(ext)) return buffer.toString("utf8");
  if (ext === ".pdf") return extractPdfText(buffer);
  if (ext === ".docx") return unzipText(filePath, ["word/document.xml"]);
  if (ext === ".xlsx") return extractXlsxText(filePath);
  return buffer.toString("utf8").replace(/[^\x09\x0a\x0d\x20-\x7e\u4e00-\u9fff]+/g, " ");
}

function extractTextFromStoredDocument(doc) {
  if (doc.rawText) return doc.rawText;
  if (!doc.objectKey) return "";
  const filePath = path.join(UPLOAD_DIR, doc.objectKey);
  if (!fs.existsSync(filePath)) return "";
  return extractText(fs.readFileSync(filePath), doc.name, filePath);
}

function extractPdfText(buffer) {
  const source = buffer.toString("latin1");
  const matches = [];
  const re = /\(([^()]{2,})\)\s*Tj|\[([^\]]{2,})\]\s*TJ/g;
  let match;
  while ((match = re.exec(source))) {
    matches.push((match[1] || match[2] || "").replace(/\\([\\()])/g, "$1"));
  }
  return matches.join(" ");
}

function unzipText(filePath, names) {
  try {
    return names
      .map((name) => execFileSync("unzip", ["-p", filePath, name], { encoding: "utf8", maxBuffer: 1024 * 1024 * 20 }))
      .join("\n")
      .replace(/<[^>]+>/g, " ");
  } catch (_) {
    return "";
  }
}

function extractXlsxText(filePath) {
  const shared = unzipText(filePath, ["xl/sharedStrings.xml"]);
  const sheets = unzipText(filePath, ["xl/worksheets/sheet1.xml", "xl/worksheets/sheet2.xml", "xl/worksheets/sheet3.xml"]);
  return `${shared}\n${sheets}`;
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanText(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildChunks(text, options = {}) {
  const cleaned = cleanText(text);
  const mode = options.segmentMode || options.knowledgeSegmentMode || "auto";
  const vectorMode = options.vectorMode || options.knowledgeVectorMode || "segment";
  const maxLength = Math.max(120, Math.min(4000, Number(options.maxLength || 800)));
  let parts = [];
  if (vectorMode === "row") {
    parts = cleaned.split(/\n+/).filter(Boolean);
  } else if (mode === "custom" && options.separator) {
    parts = cleaned.split(options.separator).filter(Boolean);
  } else {
    const paragraphs = cleaned.split(/\n{2,}/).filter(Boolean);
    for (const paragraph of paragraphs.length ? paragraphs : [cleaned]) {
      for (let i = 0; i < paragraph.length; i += maxLength) parts.push(paragraph.slice(i, i + maxLength));
    }
  }
  if (!parts.length && cleaned) parts = [cleaned];
  return parts.slice(0, 500).map((part, index) => ({
    id: id("chunk"),
    index,
    chars: part.length,
    embedding: "已完成",
    text: part,
    vector: hashVector(part),
  }));
}

function hashVector(text) {
  const hash = crypto.createHash("sha256").update(text).digest();
  return Array.from(hash.slice(0, 8)).map((n) => Number((n / 255).toFixed(4)));
}

function tokenize(text) {
  return cleanText(text).toLowerCase().split(/[\s,.;:!?，。；：！？、]+/).filter(Boolean);
}

function scoreText(tokens, text) {
  const haystack = String(text || "").toLowerCase();
  return tokens.reduce((score, token) => score + (haystack.includes(token) ? token.length : 0), 0);
}

function syncCounters(kb) {
  kb.documentCount = kb.documents.length;
  kb.chunkCount = kb.documents.reduce((sum, doc) => sum + doc.chunks.length, 0);
  kb.sizeBytes = kb.documents.reduce((sum, doc) => sum + Number(doc.sizeBytes || 0), 0);
  kb.size = formatSize(kb.sizeBytes);
}

function summarize(items) {
  return {
    knowledgeBaseCount: items.length,
    documentCount: items.reduce((sum, kb) => sum + kb.documentCount, 0),
    chunkCount: items.reduce((sum, kb) => sum + kb.chunkCount, 0),
    embeddingDoneCount: items.filter((kb) => kb.embeddingStatus === "已完成").length,
    size: formatSize(items.reduce((sum, kb) => sum + Number(kb.sizeBytes || 0), 0)),
  };
}

function formatSize(bytes) {
  const n = Number(bytes || 0);
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)}MB`;
  return `${Math.max(0, n / 1024).toFixed(2)}KB`;
}

function extensionFromName(name, sourceKey) {
  const ext = path.extname(name || "");
  if (ext) return ext;
  if (sourceKey === "word") return ".docx";
  if (sourceKey === "excel") return ".xlsx";
  if (sourceKey === "pdf") return ".pdf";
  if (sourceKey === "csv") return ".csv";
  return ".txt";
}

function audit(db, action, targetId, before, after) {
  db.auditLogs.unshift({
    id: id("audit"),
    action,
    targetId,
    before,
    after,
    createdAt: now(),
  });
  db.auditLogs = db.auditLogs.slice(0, 500);
}

function safeUnlink(filePath) {
  try {
    fs.unlinkSync(filePath);
  } catch (_) {}
}

function structuredCloneCompat(value) {
  return JSON.parse(JSON.stringify(value));
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function seedKnowledgeBases() {
  const created = now();
  const chunks = buildChunks("欧洲海运包税线路：深圳装柜，盐田港出运，鹿特丹落港，荷兰或比利时清关，再通过快递或卡车派送至欧洲仓库或商业地址。\n单件计费重不足 12KG 按 12KG 计算。非亚马逊商业地址加收 100RMB/票。", { vectorMode: "row" });
  return [
    {
      id: "kb-logistics",
      name: "物流问答",
      description: "欧洲海运、包税线路、报价口径和售后问题。",
      type: "多模态",
      sourceType: "Excel",
      sourceKey: "excel",
      status: "启用",
      enabled: true,
      documentCount: 1,
      chunkCount: chunks.length,
      embeddingStatus: "已完成",
      size: "1.00KB",
      sizeBytes: 1024,
      updatedAt: created,
      createdAt: created,
      icon: "◎",
      documents: [
        {
          id: "doc-logistics-seed",
          name: "物流问答库.xlsx",
          type: "Excel",
          status: "已完成",
          size: "1.00KB",
          sizeBytes: 1024,
          objectKey: "",
          rawText: chunks.map((chunk) => chunk.text).join("\n"),
          updatedAt: created,
          createdAt: created,
          chunks,
        },
      ],
    },
  ];
}

module.exports = {
  addDocument,
  createKnowledgeBase,
  deleteKnowledgeBase,
  deleteDocument,
  getKnowledgeBase,
  listChunks,
  listDocuments,
  listKnowledgeBases,
  previewChunks,
  reindexKnowledgeBase,
  searchKnowledge,
  toggleKnowledgeBase,
  updateKnowledgeBase,
};
