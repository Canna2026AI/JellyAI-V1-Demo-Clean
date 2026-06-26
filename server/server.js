#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const vm = require("node:vm");

const ROOT_DIR = path.resolve(__dirname, "..");
const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = process.env.AGENTS_DB_PATH || path.join(DATA_DIR, "agents-db.json");
const PORT = Number(process.env.PORT || getArgValue("--port") || 3000);
const MAX_BODY_BYTES = 25 * 1024 * 1024;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const PERMISSIONS = {
  "agents:read": ["admin", "editor", "viewer"],
  "agents:create": ["admin", "editor"],
  "agents:update": ["admin", "editor"],
  "agents:delete": ["admin"],
  "skills:manage": ["admin", "editor"],
  "tools:manage": ["admin", "editor"],
};

function getArgValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return "";
  return process.argv[index + 1] || "";
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function jsonResponse(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Demo-User-Id",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  });
  res.end(JSON.stringify(payload, null, 2));
}

function ok(res, data, statusCode = 200) {
  jsonResponse(res, statusCode, { ok: true, data });
}

function fail(res, statusCode, code, message, details) {
  jsonResponse(res, statusCode, { ok: false, error: { code, message, details } });
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (Buffer.byteLength(raw) > MAX_BODY_BYTES) {
        reject(Object.assign(new Error("请求体过大"), { statusCode: 413, code: "PAYLOAD_TOO_LARGE" }));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(Object.assign(error, { statusCode: 400, code: "INVALID_JSON" }));
      }
    });
    req.on("error", reject);
  });
}

function readDb() {
  ensureDbFile();
  return normalizeDb(JSON.parse(fs.readFileSync(DB_PATH, "utf8")));
}

function writeDb(db) {
  db.meta.updatedAt = new Date().toISOString();
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmpPath = `${DB_PATH}.${process.pid}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2));
  fs.renameSync(tmpPath, DB_PATH);
}

function ensureDbFile() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_PATH)) return;
  const seed = loadSeedData();
  const now = new Date().toISOString();
  const db = {
    meta: { version: 1, createdAt: now, updatedAt: now },
    teams: [{ id: "team-ouchen", name: "欧诚国际物流" }],
    users: [{ id: "user-kelvin", name: "Kelvin", teamId: "team-ouchen", roles: ["admin"] }],
    models: seed.aiAgentModels,
    integrations: seed.aiAgentIntegrations,
    knowledgeBases: seed.knowledgeBases.map((item) => ({ ...item, teamId: "team-ouchen", createdAt: now, updatedAt: now })),
    skills: seed.skills.map((item) => ({ ...item, teamId: "team-ouchen", createdAt: now, updatedAt: now })),
    tools: normalizeTools(seed.aiTools, now),
    toolOptions: seed.aiAgentToolOptions.map((item) => ({ ...item, teamId: "team-ouchen", createdAt: now, updatedAt: now })),
    agents: seed.aiAgents.map((item) => ({ ...item, teamId: "team-ouchen", createdBy: "user-kelvin", createdAt: now, updatedAt: now, deletedAt: null })),
    knowledgeUploads: [],
    chatRuns: [],
    auditLogs: [],
  };
  writeDb(db);
}

function normalizeDb(db) {
  if (!db.meta) db.meta = { version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  if (!Array.isArray(db.knowledgeUploads)) db.knowledgeUploads = [];
  if (!Array.isArray(db.auditLogs)) db.auditLogs = [];
  if (!Array.isArray(db.chatRuns)) db.chatRuns = [];
  return db;
}

function loadSeedData() {
  const code = [
    fs.readFileSync(path.join(ROOT_DIR, "data", "knowledge.js"), "utf8"),
    fs.readFileSync(path.join(ROOT_DIR, "data", "agents.js"), "utf8"),
    "({ knowledgeBases, aiAgentModels, aiAgentToolOptions, aiAgentIntegrations, aiAgents, skills, aiTools })",
  ].join("\n");
  return vm.runInNewContext(code, {}, { timeout: 1000 });
}

function normalizeTools(tools, now) {
  return tools.map((tool, index) => ({
    id: tool.id || slugId("tool", `${tool.name}-${index}`),
    teamId: "team-ouchen",
    name: tool.name,
    status: tool.status,
    icon: tool.icon,
    connected: Boolean(tool.connected),
    desc: tool.desc || `${tool.name} 工具能力，可在 AI 智能体中授权后调用。`,
    action: tool.action || inferToolAction(tool.name),
    createdAt: now,
    updatedAt: now,
  }));
}

function inferToolAction(name) {
  if (name.includes("搜索")) return "搜索公开网页";
  if (name.includes("视频")) return "生成视频";
  if (name.includes("银行") || name.includes("财资")) return "查询资金状态";
  if (name.includes("Bot")) return "发送机器人消息";
  return "调用第三方接口";
}

function slugId(prefix, value) {
  const hash = crypto.createHash("sha1").update(value).digest("hex").slice(0, 10);
  return `${prefix}-${hash}`;
}

function createId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(3).toString("hex")}`;
}

function getCurrentUser(req, db) {
  const requestedUserId = req.headers["x-demo-user-id"];
  return db.users.find((user) => user.id === requestedUserId) || db.users[0];
}

function requirePermission(user, permission) {
  const allowed = PERMISSIONS[permission] || [];
  if (!user || !user.roles.some((role) => allowed.includes(role))) {
    const error = new Error("当前账号没有权限执行此操作");
    error.statusCode = 403;
    error.code = "FORBIDDEN";
    throw error;
  }
}

function activeAgents(db, user) {
  return db.agents.filter((agent) => agent.teamId === user.teamId && !agent.deletedAt);
}

function findAgent(db, user, agentId) {
  return activeAgents(db, user).find((agent) => agent.id === agentId);
}

function listAgents(db, user, searchParams) {
  const keyword = (searchParams.get("keyword") || "").trim().toLowerCase();
  const status = searchParams.get("status") || "all";
  return activeAgents(db, user).filter((agent) => {
    const matchesKeyword = !keyword || `${agent.name} ${agent.description}`.toLowerCase().includes(keyword);
    const matchesStatus = status === "all" || !status || agent.status === status;
    return matchesKeyword && matchesStatus;
  });
}

function getIds(body) {
  const input = body.ids || body.agentIds || body.knowledgeBaseIds || body.skillIds || body.toolIds || body.id;
  if (Array.isArray(input)) return input.filter(Boolean).map(String);
  if (typeof input === "string" && input.trim()) return [input.trim()];
  return [];
}

function unique(items) {
  return Array.from(new Set(items.filter(Boolean)));
}

function patchAllowed(target, patch, fields) {
  fields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(patch, field)) target[field] = patch[field];
  });
}

function createAgent(db, user, body) {
  const now = new Date().toISOString();
  const name = normalizeText(body.name, "新建助手");
  const opening = normalizeText(body.opening, "您好，我是您的智能助手，请问需要什么帮助？");
  return {
    id: createId("agent"),
    teamId: user.teamId,
    name,
    description: normalizeText(body.description, "用于新的客户服务场景"),
    status: body.status === "disabled" ? "disabled" : "enabled",
    model: body.model || db.models[0],
    opening,
    prompt: normalizeText(body.prompt, "请在此补充助手的功能与步骤设置。"),
    contextLimit: Number.isFinite(Number(body.contextLimit)) ? Number(body.contextLimit) : 4,
    showToken: body.showToken !== false,
    knowledgeBaseIds: [],
    skillIds: [],
    toolIds: [],
    intents: [],
    integrations: [],
    members: [user.name],
    messages: [{ role: "assistant", text: opening }],
    createdBy: user.id,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

function normalizeText(value, fallback) {
  if (typeof value !== "string") return fallback;
  const text = value.trim();
  return text || fallback;
}

function touch(record) {
  record.updatedAt = new Date().toISOString();
}

function audit(db, user, action, entityType, entityId, before, after) {
  db.auditLogs.unshift({
    id: createId("audit"),
    teamId: user.teamId,
    userId: user.id,
    action,
    entityType,
    entityId,
    before,
    after,
    createdAt: new Date().toISOString(),
  });
  db.auditLogs = db.auditLogs.slice(0, 300);
}

function buildReply(db, agent, text) {
  const lower = text.toLowerCase();
  const knowledgeHits = db.knowledgeBases.filter((kb) => agent.knowledgeBaseIds.includes(kb.id)).slice(0, 3);
  const skillHits = db.skills.filter((skill) => agent.skillIds.includes(skill.id)).slice(0, 3);
  const toolHits = db.toolOptions.filter((tool) => agent.toolIds.includes(tool.id)).slice(0, 3);
  const hasKnowledge = knowledgeHits.length > 0;
  const hasTools = toolHits.length > 0;
  const hasSkills = skillHits.length > 0;
  let replyText;
  let intent = "general";

  if (text.includes("报价") || text.includes("价格") || lower.includes("price")) {
    intent = "price";
    replyText = "可以，我需要重量、目的国家/城市、件数和地址类型。收到这些信息后，我会按已绑定的报价规则整理参考报价。";
  } else if (text.includes("人工") || text.includes("客服")) {
    intent = "handoff";
    replyText = "已识别到转人工意图。我会先整理当前问题摘要，并提示人工客服接入处理。";
  } else if (text.includes("知识库") || text.includes("资料")) {
    intent = "knowledge";
    replyText = hasKnowledge
      ? `已检索 ${knowledgeHits.map((item) => item.name).join("、")}，我会优先根据这些资料回答。`
      : "当前助手还没有绑定知识库，请先在知识库 Tab 中绑定后再测试检索效果。";
  } else {
    replyText = `已收到：“${text}”。我会基于当前助手的模型、知识库、技能和工具配置生成回复。`;
  }

  const tokenUsage = {
    promptTokens: 220 + text.length * 2,
    completionTokens: 110 + replyText.length,
    totalTokens: 330 + text.length * 2 + replyText.length,
  };
  const cost = Number((tokenUsage.totalTokens * 0.000002).toFixed(6));
  const metaParts = [
    agent.model,
    hasKnowledge ? `知识库：${knowledgeHits.map((item) => item.name).join("、")}` : "未绑定知识库",
    hasSkills ? `技能：${skillHits.map((item) => item.name).join("、")}` : "未导入技能",
    hasTools ? `工具：${toolHits.map((item) => `${item.name}/${item.action}`).join("、")}` : "未添加工具",
    `意图：${intent}`,
    `消耗 token：${tokenUsage.totalTokens}`,
    `预估费用：${cost}元`,
  ];

  return {
    message: { role: "assistant", text: replyText, meta: metaParts.join(" · ") },
    run: {
      id: createId("run"),
      agentId: agent.id,
      input: text,
      output: replyText,
      status: "succeeded",
      intent,
      knowledgeHits,
      skillCalls: skillHits,
      toolCalls: toolHits,
      tokenUsage,
      cost,
      createdAt: new Date().toISOString(),
    },
  };
}

function isSpreadsheetFile(fileName) {
  return /\.(csv|xls|xlsx|xlsm|xlt|xltm|et|ett)$/i.test(fileName || "");
}

function decodeUploadText(body) {
  const raw = typeof body.content === "string" ? body.content : "";
  if (!raw) return "";
  if (body.encoding === "base64") {
    try {
      return Buffer.from(raw, "base64").toString("utf8");
    } catch (_error) {
      return "";
    }
  }
  return raw;
}

function cleanSegmentText(text, rules = {}) {
  let next = String(text || "");
  if (rules.trimSpaces !== false) next = next.replace(/[ \t\r\n]+/g, " ");
  if (rules.removeUrls) next = next.replace(/https?:\/\/\S+/gi, "");
  if (rules.removeEmails) next = next.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "");
  if (rules.removePhones) next = next.replace(/(?:\+?86[- ]?)?1[3-9]\d{9}/g, "");
  if (rules.removeIds) next = next.replace(/\b\d{17}[\dXx]\b/g, "");
  if (rules.removeCards) next = next.replace(/\b\d{16,19}\b/g, "");
  return next.trim();
}

function splitDelimitedRows(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/\t|,|;|\s{2,}/).map((cell) => cell.trim()).filter(Boolean));
}

function fallbackLogisticsRows(fileName) {
  return [
    ["问题", "答案", "来源"],
    ["欧洲海运包税运行线路", "深圳装柜 → 盐田港 → 鹿特丹港落港 → 荷兰/比利时清关 → 快递或卡车派送至欧洲仓库或收件地址", fileName || "上传文件"],
    ["单件计费重规则", "单件计费重不足 12KG 按 12KG 计算，重货按体积重与实重取大值", fileName || "上传文件"],
    ["转人工场景", "合同、投诉、报价异常或用户明确要求人工时，转入人工客服处理", fileName || "上传文件"],
    ["收货限制", "仅接收普货，拒收皮革、纺织品、包包、服装、鞋子、纯玻璃、纯塑料等限制品", fileName || "上传文件"],
  ];
}

function buildKnowledgeSegments(upload) {
  const vectorMode = upload.vectorMode === "segment" ? "segment" : "row";
  const segmentMode = upload.segmentMode === "custom" ? "custom" : "auto";
  const custom = upload.customConfig || {};
  const text = upload.text || "";
  const rows = splitDelimitedRows(text);
  let sourceRows = rows.length >= 2 ? rows : fallbackLogisticsRows(upload.fileName);
  let items;

  if (vectorMode === "row" && isSpreadsheetFile(upload.fileName)) {
    items = sourceRows.slice(1, 9).map((row, index) => {
      const question = row[0] || `第 ${index + 1} 行`;
      const answer = row.slice(1).join("　") || question;
      return {
        text: `问题: ${question}　答案: ${answer}`,
        relation: `逐行向量：第 ${index + 1} 行 → 1 个知识片段 → 1 条向量`,
      };
    });
  } else {
    const delimiter = segmentMode === "custom" ? custom.delimiter || "\\n" : "\\n";
    const actualDelimiter = delimiter.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
    const maxLength = Math.min(Math.max(Number(custom.maxLength) || 1200, 200), 4000);
    const sourceText = text && !text.includes("\u0000") ? text : fallbackLogisticsRows(upload.fileName).map((row) => row.join(" ")).join("\n");
    const rawParts = sourceText.split(actualDelimiter).flatMap((part) => {
      const trimmed = part.trim();
      if (!trimmed) return [];
      if (trimmed.length <= maxLength) return [trimmed];
      const chunks = [];
      for (let start = 0; start < trimmed.length; start += maxLength) chunks.push(trimmed.slice(start, start + maxLength));
      return chunks;
    });
    items = rawParts.slice(0, 9).map((part, index) => ({
      text: cleanSegmentText(part, custom.rules),
      relation: `${segmentMode === "custom" ? "自定义分段" : "自动分段"}：片段 ${index + 1} → 语义清洗 → 1 条向量`,
    }));
  }

  return items
    .filter((item) => item.text)
    .map((item, index) => ({
      id: `#${String(index + 1).padStart(3, "0")}`,
      count: `${item.text.length}字符`,
      text: item.text,
      vectorType: vectorMode === "row" ? "逐行向量" : "分段向量",
      segmentMode: segmentMode === "custom" ? "自定义" : "自动分段与清洗",
      relation: item.relation,
    }));
}

function createKnowledgeUpload(db, user, body) {
  const now = new Date().toISOString();
  const upload = {
    id: createId("kb-upload"),
    teamId: user.teamId,
    fileName: normalizeText(body.fileName, "未命名文件.txt"),
    fileType: normalizeText(body.fileType || body.type, "application/octet-stream"),
    size: Number(body.size) || 0,
    text: decodeUploadText(body).slice(0, 400000),
    vectorMode: body.vectorMode === "segment" ? "segment" : "row",
    segmentMode: body.segmentMode === "custom" ? "custom" : "auto",
    customConfig: body.customConfig || {
      delimiter: "\\n",
      maxLength: 2000,
      rules: { trimSpaces: true },
    },
    status: "processed",
    createdAt: now,
    updatedAt: now,
  };
  upload.segments = buildKnowledgeSegments(upload);
  db.knowledgeUploads.unshift(upload);
  db.knowledgeUploads = db.knowledgeUploads.slice(0, 100);
  audit(db, user, "upload", "knowledge_upload", upload.id, null, clone(upload));
  return upload;
}

function updateKnowledgeUpload(upload, body) {
  if (body.vectorMode) upload.vectorMode = body.vectorMode === "segment" ? "segment" : "row";
  if (body.segmentMode) upload.segmentMode = body.segmentMode === "custom" ? "custom" : "auto";
  if (body.customConfig) upload.customConfig = body.customConfig;
  touch(upload);
  upload.segments = buildKnowledgeSegments(upload);
  return upload;
}

function createKnowledgeBaseFromUpload(db, user, body) {
  const now = new Date().toISOString();
  const upload = db.knowledgeUploads.find((item) => item.teamId === user.teamId && item.id === body.uploadId);
  const name = normalizeText(body.name, upload?.fileName ? upload.fileName.replace(/\.[^.]+$/, "") : "新建知识库");
  const segments = upload?.segments || [];
  const knowledgeBase = {
    id: createId("kb"),
    teamId: user.teamId,
    name,
    count: `${segments.length || 1}条数据`,
    type: upload?.vectorMode === "segment" ? "分段向量" : "逐行向量",
    icon: isSpreadsheetFile(upload?.fileName) ? "X" : "文",
    size: upload?.size ? `${(upload.size / 1024).toFixed(2)}KB` : "0KB",
    uploadId: upload?.id || null,
    fileName: upload?.fileName || "",
    segments,
    createdAt: now,
    updatedAt: now,
  };
  db.knowledgeBases.unshift(knowledgeBase);
  audit(db, user, "create", "knowledge_base", knowledgeBase.id, null, clone(knowledgeBase));
  return knowledgeBase;
}

async function handleApi(req, res, url) {
  if (req.method === "OPTIONS") {
    jsonResponse(res, 204, {});
    return;
  }
  const db = readDb();
  const user = getCurrentUser(req, db);
  const parts = url.pathname.split("/").filter(Boolean).slice(1);
  const body = ["POST", "PATCH", "PUT"].includes(req.method) ? await parseJsonBody(req) : {};

  if (req.method === "GET" && parts[0] === "health") {
    ok(res, { status: "ok", dbPath: DB_PATH, user: { id: user.id, name: user.name, roles: user.roles } });
    return;
  }

  if (req.method === "GET" && parts[0] === "agents" && parts[1] === "bootstrap") {
    requirePermission(user, "agents:read");
    ok(res, {
      agents: listAgents(db, user, url.searchParams),
      knowledgeBases: db.knowledgeBases.filter((item) => item.teamId === user.teamId),
      skills: db.skills.filter((item) => item.teamId === user.teamId),
      tools: db.tools.filter((item) => item.teamId === user.teamId),
      toolOptions: db.toolOptions.filter((item) => item.teamId === user.teamId),
      models: db.models,
      integrations: db.integrations,
      user: { id: user.id, name: user.name, roles: user.roles },
    });
    return;
  }

  if (parts[0] === "agents") {
    await handleAgentsApi(req, res, url, db, user, parts, body);
    return;
  }

  if (parts[0] === "knowledge-bases") {
    if (req.method === "GET" && parts.length === 1) {
      requirePermission(user, "agents:read");
      ok(res, db.knowledgeBases.filter((item) => item.teamId === user.teamId));
      return;
    }
    if (req.method === "POST" && parts.length === 1) {
      requirePermission(user, "agents:update");
      const knowledgeBase = createKnowledgeBaseFromUpload(db, user, body);
      writeDb(db);
      ok(res, knowledgeBase, 201);
      return;
    }
    if (req.method === "POST" && parts[1] === "uploads") {
      requirePermission(user, "agents:update");
      const upload = createKnowledgeUpload(db, user, body);
      writeDb(db);
      ok(res, upload, 201);
      return;
    }
    if (req.method === "PATCH" && parts[1] === "uploads" && (parts.length === 3 || (parts.length === 4 && parts[3] === "segmentation"))) {
      requirePermission(user, "agents:update");
      const upload = db.knowledgeUploads.find((item) => item.teamId === user.teamId && item.id === parts[2]);
      if (!upload) {
        fail(res, 404, "KNOWLEDGE_UPLOAD_NOT_FOUND", "上传文件不存在");
        return;
      }
      const before = clone(upload);
      updateKnowledgeUpload(upload, body);
      audit(db, user, "update_segmentation", "knowledge_upload", upload.id, before, clone(upload));
      writeDb(db);
      ok(res, upload);
      return;
    }
    if (req.method === "DELETE" && parts.length === 2) {
      requirePermission(user, "agents:update");
      const knowledgeBase = db.knowledgeBases.find((item) => item.teamId === user.teamId && item.id === parts[1]);
      if (!knowledgeBase) {
        fail(res, 404, "KNOWLEDGE_BASE_NOT_FOUND", "知识库不存在");
        return;
      }
      db.knowledgeBases = db.knowledgeBases.filter((item) => item.id !== knowledgeBase.id);
      db.agents.forEach((agent) => {
        agent.knowledgeBaseIds = (agent.knowledgeBaseIds || []).filter((id) => id !== knowledgeBase.id);
      });
      audit(db, user, "delete", "knowledge_base", knowledgeBase.id, clone(knowledgeBase), null);
      writeDb(db);
      ok(res, { id: knowledgeBase.id, deleted: true });
      return;
    }
    fail(res, 404, "NOT_FOUND", "知识库 API 不存在");
    return;
  }

  if (parts[0] === "skills") {
    await handleSkillsApi(req, res, url, db, user, parts, body);
    return;
  }

  if (parts[0] === "tools") {
    await handleToolsApi(req, res, db, user, body);
    return;
  }

  fail(res, 404, "NOT_FOUND", "API 不存在");
}

async function handleAgentsApi(req, res, url, db, user, parts, body) {
  const agentId = parts[1];
  if (req.method === "GET" && parts.length === 1) {
    requirePermission(user, "agents:read");
    ok(res, listAgents(db, user, url.searchParams));
    return;
  }

  if (req.method === "POST" && parts.length === 1) {
    requirePermission(user, "agents:create");
    const agent = createAgent(db, user, body);
    db.agents.unshift(agent);
    audit(db, user, "create", "agent", agent.id, null, clone(agent));
    writeDb(db);
    ok(res, agent, 201);
    return;
  }

  const agent = findAgent(db, user, agentId);
  if (!agent) {
    fail(res, 404, "AGENT_NOT_FOUND", "智能体不存在或已删除");
    return;
  }

  if (req.method === "GET" && parts.length === 2) {
    requirePermission(user, "agents:read");
    ok(res, agent);
    return;
  }

  if (req.method === "PATCH" && parts.length === 2) {
    requirePermission(user, "agents:update");
    const before = clone(agent);
    patchAllowed(agent, body, ["name", "description", "status", "model", "prompt", "opening", "contextLimit", "showToken", "intents", "integrations", "members"]);
    if (!["enabled", "disabled"].includes(agent.status)) agent.status = before.status;
    if (agent.messages?.[0]?.role === "assistant" && before.opening !== agent.opening) agent.messages[0].text = agent.opening;
    touch(agent);
    audit(db, user, "update", "agent", agent.id, before, clone(agent));
    writeDb(db);
    ok(res, agent);
    return;
  }

  if (req.method === "DELETE" && parts.length === 2) {
    requirePermission(user, "agents:delete");
    const before = clone(agent);
    agent.deletedAt = new Date().toISOString();
    touch(agent);
    audit(db, user, "delete", "agent", agent.id, before, clone(agent));
    writeDb(db);
    ok(res, { id: agent.id, deleted: true });
    return;
  }

  if (req.method === "PATCH" && parts[2] === "model-config") {
    requirePermission(user, "agents:update");
    const before = clone(agent);
    patchAllowed(agent, body, ["name", "description", "model", "prompt", "opening", "contextLimit", "showToken"]);
    if (agent.messages?.[0]?.role === "assistant") agent.messages[0].text = agent.opening;
    touch(agent);
    audit(db, user, "save_model_config", "agent", agent.id, before, clone(agent));
    writeDb(db);
    ok(res, agent);
    return;
  }

  if (req.method === "POST" && parts[2] === "chat") {
    requirePermission(user, "agents:read");
    const text = normalizeText(body.message, "");
    if (!text) {
      fail(res, 400, "MESSAGE_REQUIRED", "请输入聊天内容");
      return;
    }
    const userMessage = { role: "user", text, createdAt: new Date().toISOString() };
    const reply = buildReply(db, agent, text);
    agent.messages.push(userMessage, reply.message);
    agent.messages = agent.messages.slice(-30);
    db.chatRuns.unshift(reply.run);
    db.chatRuns = db.chatRuns.slice(0, 500);
    touch(agent);
    writeDb(db);
    ok(res, { userMessage, assistantMessage: reply.message, run: reply.run, messages: agent.messages });
    return;
  }

  if (["knowledge-bases", "skills", "tools"].includes(parts[2])) {
    await handleRelationApi(req, res, db, user, agent, parts, body);
    return;
  }

  fail(res, 404, "NOT_FOUND", "智能体 API 不存在");
}

async function handleRelationApi(req, res, db, user, agent, parts, body) {
  requirePermission(user, "agents:update");
  const relation = parts[2];
  const relationId = parts[3];
  const config = {
    "knowledge-bases": { key: "knowledgeBaseIds", collection: "knowledgeBases", action: "bind_knowledge_bases" },
    skills: { key: "skillIds", collection: "skills", action: "bind_skills" },
    tools: { key: "toolIds", collection: "toolOptions", action: "bind_tools" },
  }[relation];

  const before = clone(agent);
  if (req.method === "POST" && parts.length === 3) {
    const available = new Set(db[config.collection].filter((item) => item.teamId === user.teamId).map((item) => item.id));
    const nextIds = unique(getIds(body)).filter((id) => available.has(id));
    agent[config.key] = body.mode === "merge" ? unique([...(agent[config.key] || []), ...nextIds]) : nextIds;
    touch(agent);
    audit(db, user, config.action, "agent", agent.id, before, clone(agent));
    writeDb(db);
    ok(res, agent);
    return;
  }

  if (req.method === "DELETE" && parts.length === 4) {
    agent[config.key] = (agent[config.key] || []).filter((id) => id !== relationId);
    touch(agent);
    audit(db, user, `remove_${relation}`, "agent", agent.id, before, clone(agent));
    writeDb(db);
    ok(res, agent);
    return;
  }

  fail(res, 404, "NOT_FOUND", "关系 API 不存在");
}

async function handleSkillsApi(req, res, url, db, user, parts, body) {
  if (req.method === "GET" && parts.length === 1) {
    requirePermission(user, "agents:read");
    const source = url.searchParams.get("source");
    const keyword = (url.searchParams.get("keyword") || "").trim().toLowerCase();
    const items = db.skills.filter((skill) => {
      const matchesTeam = skill.teamId === user.teamId;
      const matchesSource = !source || source === "all" || skill.source === source;
      const matchesKeyword = !keyword || `${skill.name} ${skill.desc} ${skill.channel}`.toLowerCase().includes(keyword);
      return matchesTeam && matchesSource && matchesKeyword;
    });
    ok(res, items);
    return;
  }

  if (req.method === "POST" && parts.length === 1) {
    requirePermission(user, "skills:manage");
    const now = new Date().toISOString();
    const skill = {
      id: createId("skill"),
      teamId: user.teamId,
      name: normalizeText(body.name, "未命名技能"),
      desc: normalizeText(body.desc || body.description, "用于补充智能体执行能力"),
      channel: normalizeText(body.channel, "通用"),
      source: body.source === "template" ? "template" : "mine",
      icon: normalizeText(body.icon, "AI"),
      tool: Boolean(body.tool),
      prompt: normalizeText(body.prompt, "请描述技能触发条件与执行步骤。"),
      createdAt: now,
      updatedAt: now,
    };
    db.skills.unshift(skill);
    audit(db, user, "create", "skill", skill.id, null, clone(skill));
    writeDb(db);
    ok(res, skill, 201);
    return;
  }

  const skill = db.skills.find((item) => item.teamId === user.teamId && item.id === parts[1]);
  if (!skill) {
    fail(res, 404, "SKILL_NOT_FOUND", "技能不存在");
    return;
  }

  if (req.method === "PATCH" && parts.length === 2) {
    requirePermission(user, "skills:manage");
    const before = clone(skill);
    patchAllowed(skill, body, ["name", "desc", "channel", "source", "icon", "tool", "prompt"]);
    touch(skill);
    audit(db, user, "update", "skill", skill.id, before, clone(skill));
    writeDb(db);
    ok(res, skill);
    return;
  }

  if (req.method === "DELETE" && parts.length === 2) {
    requirePermission(user, "skills:manage");
    const before = clone(skill);
    db.skills = db.skills.filter((item) => item.id !== skill.id);
    db.agents.forEach((agent) => {
      agent.skillIds = (agent.skillIds || []).filter((id) => id !== skill.id);
    });
    audit(db, user, "delete", "skill", skill.id, before, null);
    writeDb(db);
    ok(res, { id: skill.id, deleted: true });
    return;
  }

  fail(res, 404, "NOT_FOUND", "技能 API 不存在");
}

async function handleToolsApi(req, res, db, user, body) {
  if (req.method === "GET") {
    requirePermission(user, "agents:read");
    ok(res, {
      tools: db.tools.filter((item) => item.teamId === user.teamId),
      toolOptions: db.toolOptions.filter((item) => item.teamId === user.teamId),
    });
    return;
  }

  if (req.method === "POST") {
    requirePermission(user, "tools:manage");
    const now = new Date().toISOString();
    const name = normalizeText(body.name, "内部订单查询");
    const tool = {
      id: createId("tool"),
      teamId: user.teamId,
      name,
      status: normalizeText(body.status, "已创建 · 待授权"),
      icon: normalizeText(body.icon, name.slice(0, 2).toUpperCase()),
      connected: Boolean(body.connected),
      desc: normalizeText(body.desc || body.description, "根据订单号查询物流轨迹、费用和签收状态。"),
      action: normalizeText(body.action, "调用第三方接口"),
      authType: body.authType || "none",
      method: body.method || "GET",
      endpoint: body.endpoint || "https://api.example.com/orders/{order_no}",
      createdAt: now,
      updatedAt: now,
    };
    const toolOption = {
      id: tool.id,
      teamId: user.teamId,
      name: tool.name,
      action: tool.action,
      icon: tool.icon,
      status: tool.status,
      createdAt: now,
      updatedAt: now,
    };
    db.tools.unshift(tool);
    db.toolOptions.unshift(toolOption);
    audit(db, user, "create", "tool", tool.id, null, clone(tool));
    writeDb(db);
    ok(res, { tool, toolOption }, 201);
    return;
  }

  fail(res, 405, "METHOD_NOT_ALLOWED", "工具 API 不支持该方法");
}

function serveStatic(req, res, url) {
  const pathname = decodeURIComponent(url.pathname);
  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = path.resolve(ROOT_DIR, relativePath);
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.stat(filePath, (statError, stat) => {
    if (statError || !stat.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const noStore = [".html", ".js", ".css"].includes(ext);
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Cache-Control": noStore ? "no-store" : "public, max-age=60",
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    serveStatic(req, res, url);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    fail(res, statusCode, error.code || "SERVER_ERROR", error.message || "服务器错误");
  }
});

server.listen(PORT, () => {
  console.log(`JellyAI demo server running at http://localhost:${PORT}`);
  console.log(`Agents database: ${DB_PATH}`);
});
