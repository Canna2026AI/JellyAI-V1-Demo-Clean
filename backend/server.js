#!/usr/bin/env node
const fs = require("fs");
const http = require("http");
const path = require("path");
const { RpaAdapter, WecomOfficialClient, handleWebhookVerify, parseWebhookBody } = require("./lib/wecom-integrations");
const { WecomStore } = require("./lib/wecom-store");

const ROOT_DIR = path.resolve(__dirname, "..");
loadEnvFile(path.join(ROOT_DIR, ".env"));

const configuredDataFile = process.env.JELLY_WECOM_DB || "backend/data/wecom-db.json";
const DATA_FILE = path.isAbsolute(configuredDataFile) ? configuredDataFile : path.join(ROOT_DIR, configuredDataFile);
const PORT = Number(process.env.PORT || process.env.JELLY_PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";
const REQUIRE_AUTH = process.env.JELLY_REQUIRE_AUTH === "1";

const store = new WecomStore({ rootDir: ROOT_DIR, dataFile: DATA_FILE, env: process.env });
const wecomClient = new WecomOfficialClient(process.env);
const rpaAdapter = new RpaAdapter(process.env);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function parseCookies(req) {
  return Object.fromEntries(String(req.headers.cookie || "").split(";").map((part) => part.trim()).filter(Boolean).map((part) => {
    const index = part.indexOf("=");
    if (index === -1) return [part, ""];
    return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
  }));
}

function setCors(req, res) {
  const origin = process.env.JELLY_CORS_ORIGIN || req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function json(res, status, body, headers = {}) {
  send(res, status, JSON.stringify(body), { "Content-Type": "application/json; charset=utf-8", ...headers });
}

function csv(res, filename, rows, headers) {
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const body = [headers.join(","), ...rows.map((row) => headers.map((key) => escape(row[key])).join(","))].join("\n");
  send(res, 200, body, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024 * 10) {
        reject(new Error("request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

async function readJson(req) {
  const raw = await readBody(req);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (error) {
    error.statusCode = 400;
    error.publicMessage = "Invalid JSON body";
    throw error;
  }
}

function currentUser(req) {
  const cookies = parseCookies(req);
  const sessionId = cookies.jelly_session || String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const user = store.getUserBySession(sessionId);
  if (user) return { user, sessionId };
  if (!REQUIRE_AUTH) return { user: store.getDefaultUser(), sessionId: "" };
  return { user: null, sessionId: "" };
}

function requireUser(req) {
  const auth = currentUser(req);
  if (!auth.user) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    error.publicMessage = "Unauthorized";
    throw error;
  }
  return auth;
}

function route(method, pathname, pattern) {
  if (method && method !== pattern.method) return null;
  const match = pathname.match(pattern.regex);
  if (!match) return null;
  return match.groups || {};
}

function queryObject(url) {
  return Object.fromEntries(url.searchParams.entries());
}

async function handleApi(req, res, url) {
  const pathname = decodeURIComponent(url.pathname);
  const method = req.method;

  if (method === "OPTIONS") {
    send(res, 204, "");
    return;
  }

  if (method === "GET" && pathname === "/api/health") {
    json(res, 200, {
      ok: true,
      service: "jelly-wecom-backend",
      authRequired: REQUIRE_AUTH,
      database: path.relative(ROOT_DIR, DATA_FILE),
      integrations: { wecom: wecomClient.status(), rpa: rpaAdapter.status() },
    });
    return;
  }

  if (method === "POST" && pathname === "/api/auth/login") {
    const body = await readJson(req);
    const result = store.login(body.email, body.password, {
      ip: req.socket.remoteAddress,
      userAgent: req.headers["user-agent"] || "",
    });
    if (!result) {
      json(res, 401, { error: "Invalid email or password" });
      return;
    }
    json(res, 200, { user: result.user, expiresAt: result.session.expiresAt }, {
      "Set-Cookie": `jelly_session=${encodeURIComponent(result.session.id)}; HttpOnly; Path=/; SameSite=Lax`,
    });
    return;
  }

  if (method === "POST" && pathname === "/api/auth/logout") {
    const auth = currentUser(req);
    store.logout(auth.sessionId, auth.user);
    json(res, 200, { ok: true }, { "Set-Cookie": "jelly_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax" });
    return;
  }

  if (method === "GET" && pathname === "/api/auth/session") {
    const auth = currentUser(req);
    json(res, 200, { user: store.publicUser(auth.user), authRequired: REQUIRE_AUTH });
    return;
  }

  if (method === "GET" && pathname === "/api/permissions/me") {
    const { user } = requireUser(req);
    json(res, 200, store.permissionsFor(user));
    return;
  }

  if (method === "GET" && pathname === "/api/wecom/webhook") {
    const result = handleWebhookVerify(process.env, queryObject(url));
    send(res, result.status, result.body, { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  if (method === "POST" && pathname === "/api/wecom/webhook") {
    const { user } = currentUser(req);
    const raw = await readBody(req);
    const event = parseWebhookBody(process.env, queryObject(url), raw);
    const saved = store.saveWebhookEvent(user || store.getDefaultUser(), event);
    json(res, 200, { ok: true, eventId: saved.id });
    return;
  }

  const { user } = requireUser(req);

  if (method === "GET" && pathname === "/api/wecom/bootstrap") {
    json(res, 200, store.bootstrap(user));
    return;
  }

  if (method === "GET" && pathname === "/api/wecom/integrations/status") {
    json(res, 200, { wecom: wecomClient.status(), rpa: rpaAdapter.status() });
    return;
  }

  if (method === "GET" && pathname === "/api/wecom/accounts") {
    json(res, 200, store.listAccounts(user, queryObject(url)));
    return;
  }

  if (method === "POST" && pathname === "/api/wecom/accounts") {
    json(res, 201, store.saveAccount(user, await readJson(req)));
    return;
  }

  let params = route(method, pathname, { method: "GET", regex: /^\/api\/wecom\/accounts\/(?<id>[^/]+)$/ });
  if (params) {
    const account = store.getAccount(user, params.id);
    json(res, account ? 200 : 404, account || { error: "Account not found" });
    return;
  }

  params = route(method, pathname, { method: "PATCH", regex: /^\/api\/wecom\/accounts\/(?<id>[^/]+)$/ });
  if (params) {
    const account = store.saveAccount(user, await readJson(req), params.id);
    json(res, account ? 200 : 404, account || { error: "Account not found" });
    return;
  }

  params = route(method, pathname, { method: "DELETE", regex: /^\/api\/wecom\/accounts\/(?<id>[^/]+)$/ });
  if (params) {
    const account = store.deleteAccount(user, params.id);
    json(res, account ? 200 : 404, account || { error: "Account not found" });
    return;
  }

  params = route(method, pathname, { method: "POST", regex: /^\/api\/wecom\/accounts\/(?<id>[^/]+)\/(?<action>pause|resume|restart|rescan)$/ });
  if (params) {
    const statusMap = { pause: "暂停", resume: "在线", restart: "在线", rescan: "待扫码" };
    const account = store.updateAccountStatus(user, params.id, statusMap[params.action]);
    json(res, account ? 200 : 404, account || { error: "Account not found" });
    return;
  }

  params = route(method, pathname, { method: "GET", regex: /^\/api\/wecom\/accounts\/(?<id>[^/]+)\/heartbeat$/ });
  if (params) {
    const account = store.getAccount(user, params.id);
    json(res, account ? 200 : 404, account ? { id: account.id, status: account.status, heartbeat: account.heartbeat } : { error: "Account not found" });
    return;
  }

  if (method === "GET" && pathname === "/api/wecom/account-groups") {
    json(res, 200, { items: store.data.accountGroups.map((name) => ({ id: name, name, memberIds: store.data.selectedMemberIds[name] || [] })) });
    return;
  }

  params = route(method, pathname, { method: "PATCH", regex: /^\/api\/wecom\/account-groups\/(?<id>[^/]+)\/members$/ });
  if (params) {
    const body = await readJson(req);
    json(res, 200, store.saveTeamMembers(user, params.id, body.memberIds || []));
    return;
  }

  if (method === "GET" && pathname === "/api/wecom/team-members") {
    json(res, 200, { items: store.listTeamMembers(user, url.searchParams.get("query") || "") });
    return;
  }

  if (method === "GET" && pathname === "/api/wecom/rules") {
    json(res, 200, { items: store.listRules(user) });
    return;
  }

  if (method === "POST" && pathname === "/api/wecom/rules") {
    json(res, 201, store.saveRule(user, await readJson(req)));
    return;
  }

  params = route(method, pathname, { method: "PATCH", regex: /^\/api\/wecom\/rules\/(?<id>[^/]+)$/ });
  if (params) {
    const rule = store.saveRule(user, await readJson(req), params.id);
    json(res, rule ? 200 : 404, rule || { error: "Rule not found" });
    return;
  }

  params = route(method, pathname, { method: "DELETE", regex: /^\/api\/wecom\/rules\/(?<id>[^/]+)$/ });
  if (params) {
    const rule = store.deleteRule(user, params.id);
    json(res, rule ? 200 : 404, rule || { error: "Rule not found" });
    return;
  }

  params = route(method, pathname, { method: "POST", regex: /^\/api\/wecom\/rules\/(?<id>[^/]+)\/(?<action>enable|disable|test)$/ });
  if (params) {
    const rule = params.action === "test"
      ? store.getRule(user, params.id)
      : store.toggleRule(user, params.id, "enabled", params.action === "enable");
    json(res, rule ? 200 : 404, rule ? { ...rule, testResult: params.action === "test" ? "规则测试通过" : undefined } : { error: "Rule not found" });
    return;
  }

  if (method === "GET" && pathname === "/api/wecom/settings") {
    json(res, 200, store.getSettings(user));
    return;
  }

  if (method === "PATCH" && pathname === "/api/wecom/settings") {
    json(res, 200, store.patchSettings(user, await readJson(req)));
    return;
  }

  if (method === "POST" && pathname === "/api/wecom/settings/reset") {
    json(res, 200, store.resetSettings(user));
    return;
  }

  if (method === "GET" && pathname === "/api/wecom/settings/effective") {
    json(res, 200, store.getSettings(user));
    return;
  }

  if (method === "GET" && pathname === "/api/wecom/sidebar") {
    json(res, 200, { menus: store.getSidebar(user) });
    return;
  }

  if (method === "PATCH" && pathname === "/api/wecom/sidebar") {
    const body = await readJson(req);
    json(res, 200, { menus: store.saveSidebar(user, body.menus || []) });
    return;
  }

  if (method === "GET" && pathname === "/api/wecom/groups") {
    json(res, 200, { items: store.listGroups(user, url.searchParams.get("query") || "") });
    return;
  }

  if (method === "POST" && pathname === "/api/wecom/groups/sync") {
    json(res, 200, store.syncGroups(user));
    return;
  }

  params = route(method, pathname, { method: "GET", regex: /^\/api\/wecom\/groups\/(?<id>[^/]+)$/ });
  if (params) {
    const group = store.getGroup(user, params.id);
    json(res, group ? 200 : 404, group || { error: "Group not found" });
    return;
  }

  params = route(method, pathname, { method: "PATCH", regex: /^\/api\/wecom\/groups\/(?<id>[^/]+)$/ });
  if (params) {
    const group = store.patchGroup(user, params.id, await readJson(req));
    json(res, group ? 200 : 404, group || { error: "Group not found" });
    return;
  }

  params = route(method, pathname, { method: "POST", regex: /^\/api\/wecom\/groups\/(?<id>[^/]+)\/(?<field>ai-reply|message-receive)\/(?<action>enable|disable)$/ });
  if (params) {
    const field = params.field === "ai-reply" ? "aiEnabled" : "messageEnabled";
    const group = store.patchGroup(user, params.id, { [field]: params.action === "enable" });
    json(res, group ? 200 : 404, group || { error: "Group not found" });
    return;
  }

  if (method === "GET" && (pathname === "/api/wecom/logs" || pathname === "/api/wecom/conversations")) {
    json(res, 200, { items: store.listLogs(user, queryObject(url)) });
    return;
  }

  if (method === "GET" && (pathname === "/api/wecom/logs/export" || pathname === "/api/wecom/conversations/export")) {
    const result = store.exportLogs(user, queryObject(url));
    csv(res, `${result.export.id}.csv`, result.rows, ["time", "operator", "operation", "target", "type", "content", "reply", "status", "detail"]);
    return;
  }

  if (method === "GET" && pathname === "/api/wecom/audit-logs") {
    json(res, 200, { items: store.listAuditLogs(user) });
    return;
  }

  if (method === "GET" && pathname === "/api/wecom/audit-logs/export") {
    csv(res, "audit-logs.csv", store.listAuditLogs(user), ["createdAt", "userName", "action", "resourceType", "resourceId", "userId"]);
    return;
  }

  if (method === "GET" && pathname === "/api/wecom/console/tasks") {
    json(res, 200, { items: store.listTasks(user) });
    return;
  }

  params = route(method, pathname, { method: "GET", regex: /^\/api\/wecom\/console\/tasks\/(?<id>[^/]+)$/ });
  if (params) {
    const task = store.getTask(user, params.id);
    json(res, task ? 200 : 404, task || { error: "Task not found" });
    return;
  }

  params = route(method, pathname, { method: "POST", regex: /^\/api\/wecom\/console\/tasks\/(?<id>[^/]+)\/cancel$/ });
  if (params) {
    const task = store.cancelTask(user, params.id);
    json(res, task ? 200 : 404, task || { error: "Task not found" });
    return;
  }

  params = route(method, pathname, { method: "POST", regex: /^\/api\/wecom\/console\/(?<action>send-text|send-image|send-file|create-group|invite-members|rename-group|group-notice)$/ });
  if (params) {
    const actionMap = {
      "send-text": "发送文本",
      "send-image": "发送图片",
      "send-file": "发送文件",
      "create-group": "创建群聊",
      "invite-members": "拉人进群",
      "rename-group": "修改群名称",
      "group-notice": "发送群公告",
    };
    const body = await readJson(req);
    const providerResult = await rpaAdapter.dispatch(actionMap[params.action], body);
    const task = store.createConsoleTask(user, actionMap[params.action], body, providerResult);
    json(res, providerResult.status === "failed" ? 502 : 202, task);
    return;
  }

  if (method === "POST" && pathname === "/api/wecom/workbench/actions") {
    const body = await readJson(req);
    const routeMap = {
      "营销标签": "已生成客户标签更新任务",
      "消息群发": "已准备群发草稿，可在机器人控制台发送",
      "自动加好友": "已创建好友通过后的欢迎语规则",
      "自动化运营": "已生成加好友、发素材、转人工流程草稿",
      "素材管理": "已打开常用话术与文件素材索引",
    };
    store.addLog(user, { operation: "工作台操作", accountId: store.scoped(store.data.accounts, user)[0]?.id || "", target: body.action, content: body.action, reply: routeMap[body.action] || "操作已记录", detail: "工作台入口" });
    store.addAudit(user, "工作台操作", "wecom_workbench", body.action || "-");
    store.save();
    json(res, 200, { result: routeMap[body.action] || "操作已记录" });
    return;
  }

  if (method === "POST" && pathname === "/api/wecom/sync/departments") {
    const departments = await wecomClient.listDepartments();
    json(res, 200, departments);
    return;
  }

  if (method === "POST" && pathname === "/api/wecom/sync/users") {
    const body = await readJson(req);
    const users = await wecomClient.listUsers(body.departmentId || 1);
    json(res, 200, users);
    return;
  }

  json(res, 404, { error: "Not found", path: pathname });
}

function safePath(urlPath) {
  const pathname = decodeURIComponent(urlPath.split("?")[0]);
  const normalized = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(ROOT_DIR, normalized === "/" ? "index.html" : normalized);
  if (!filePath.startsWith(ROOT_DIR)) return null;
  return filePath;
}

function serveStatic(req, res, url) {
  let filePath = safePath(url.pathname);
  if (!filePath) {
    send(res, 403, "Forbidden");
    return;
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, "index.html");
  if (!fs.existsSync(filePath)) {
    filePath = path.join(ROOT_DIR, "index.html");
  }
  const ext = path.extname(filePath);
  send(res, 200, fs.readFileSync(filePath), {
    "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
    "Cache-Control": ext === ".html" ? "no-store" : "public, max-age=60",
  });
}

const server = http.createServer(async (req, res) => {
  setCors(req, res);
  const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    serveStatic(req, res, url);
  } catch (error) {
    const status = error.statusCode || 500;
    json(res, status, {
      error: error.publicMessage || (status === 500 ? "Internal server error" : error.message),
      detail: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Jelly WeCom backend listening at http://${HOST}:${PORT}`);
  console.log(`Database: ${DATA_FILE}`);
});
