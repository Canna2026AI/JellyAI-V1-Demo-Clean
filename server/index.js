const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");
const { createChannelStore } = require("./channelStore");

const rootDir = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";
const apiToken = process.env.JELLY_DEMO_API_TOKEN || "jelly-demo-token";
const webhookSecret = process.env.JELLY_WEBHOOK_SECRET || "";
const store = createChannelStore({ rootDir });

store.ensureDatabase();

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host || `${host}:${port}`}`);
    if (requestUrl.pathname.startsWith("/api/")) {
      await routeApi(req, res, requestUrl);
      return;
    }
    await serveStatic(req, res, requestUrl);
  } catch (error) {
    sendError(res, error);
  }
});

server.listen(port, host, () => {
  console.log(`JellyAI demo server running at http://${host}:${port}`);
  console.log(`Channels database: ${store.dbPath}`);
});

async function routeApi(req, res, requestUrl) {
  const method = req.method || "GET";
  const pathname = requestUrl.pathname;
  if (method === "OPTIONS") return sendNoContent(res);
  if (method === "GET" && pathname === "/api/health") {
    return sendJson(res, { ok: true, service: "jellyai-demo", database: store.dbPath });
  }
  if (method === "GET" && pathname === "/api/channels") {
    return sendJson(res, {
      channels: store.listChannels({
        category: requestUrl.searchParams.get("category"),
        status: requestUrl.searchParams.get("status"),
        keyword: requestUrl.searchParams.get("keyword"),
      }),
    });
  }

  const channelMatch = pathname.match(/^\/api\/channels\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?$/);
  if (channelMatch) {
    const [, channelId, segment, itemId] = channelMatch.map((part) => part && decodeURIComponent(part));
    if (method === "GET" && !segment) {
      const channel = store.getChannel(channelId);
      if (!channel) throw httpError(404, "CHANNEL_NOT_FOUND", "渠道不存在");
      return sendJson(res, { channel });
    }
    if (method === "GET" && segment === "accounts") {
      const channel = store.getChannel(channelId);
      if (!channel) throw httpError(404, "CHANNEL_NOT_FOUND", "渠道不存在");
      return sendJson(res, { accounts: channel.accountRecords || [] });
    }
    if (method === "POST" && segment === "connect") {
      requireAuth(req);
      return sendJson(res, store.connectChannel(channelId, await readJson(req), actorFrom(req)), 201);
    }
    if (method === "POST" && segment === "test") {
      requireAuth(req);
      return sendJson(res, store.testChannel(channelId, await readJson(req)));
    }
    if (method === "PATCH" && segment === "status") {
      requireAuth(req);
      return sendJson(res, { channel: store.updateChannelStatus(channelId, await readJson(req), actorFrom(req)) });
    }
    if (segment === "accounts" && itemId) {
      requireAuth(req);
      if (method === "PATCH") return sendJson(res, store.updateAccount(channelId, itemId, await readJson(req), actorFrom(req)));
      if (method === "DELETE") return sendJson(res, store.deleteAccount(channelId, itemId, actorFrom(req)));
    }
  }

  const webhookVerifyMatch = pathname.match(/^\/api\/webhooks\/channels\/([^/]+)\/verify$/);
  if (method === "GET" && webhookVerifyMatch) {
    const challenge = requestUrl.searchParams.get("challenge") || requestUrl.searchParams.get("hub.challenge") || requestUrl.searchParams.get("echostr") || "ok";
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(challenge);
    return;
  }

  const webhookMatch = pathname.match(/^\/api\/webhooks\/channels\/([^/]+)$/);
  if (webhookMatch) {
    const provider = decodeURIComponent(webhookMatch[1]);
    if (method === "GET") return sendJson(res, { events: store.listWebhookEvents(provider) });
    if (method === "POST") {
      const rawBody = await readBody(req);
      verifyWebhookSignature(req, rawBody);
      const payload = parseJson(rawBody);
      return sendJson(res, store.recordWebhook(provider, payload, req.headers), 202);
    }
  }

  if (method === "GET" && pathname === "/api/audit-logs") {
    requireAuth(req);
    return sendJson(res, { auditLogs: store.getAuditLogs() });
  }

  if (method === "POST" && pathname === "/api/dev/reset") {
    requireAuth(req);
    return sendJson(res, { reset: true, database: store.reset() });
  }

  throw httpError(404, "NOT_FOUND", "接口不存在");
}

async function serveStatic(req, res, requestUrl) {
  if (req.method !== "GET" && req.method !== "HEAD") throw httpError(405, "METHOD_NOT_ALLOWED", "方法不允许");
  const safePath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, "") || "index.html";
  const filePath = path.normalize(path.join(rootDir, safePath));
  const insideRoot = filePath === rootDir || filePath.startsWith(`${rootDir}${path.sep}`);
  if (!insideRoot || filePath.includes(`${path.sep}.data${path.sep}`) || filePath.includes(`${path.sep}.git${path.sep}`)) {
    throw httpError(403, "FORBIDDEN", "禁止访问该文件");
  }
  const finalPath = fs.existsSync(filePath) && fs.statSync(filePath).isDirectory() ? path.join(filePath, "index.html") : filePath;
  if (!fs.existsSync(finalPath) || !fs.statSync(finalPath).isFile()) throw httpError(404, "NOT_FOUND", "文件不存在");
  res.writeHead(200, {
    "Content-Type": contentType(finalPath),
    "Cache-Control": "no-store",
  });
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(finalPath).pipe(res);
}

function requireAuth(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (token !== apiToken) throw httpError(401, "UNAUTHORIZED", "未授权或令牌无效");
}

function actorFrom(req) {
  return req.headers["x-jelly-actor"] || "demo-user";
}

function verifyWebhookSignature(req, rawBody) {
  if (!webhookSecret) return;
  const signature = req.headers["x-jelly-signature"] || "";
  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  const a = Buffer.from(String(signature));
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw httpError(401, "INVALID_WEBHOOK_SIGNATURE", "Webhook 签名无效");
  }
}

function readJson(req) {
  return readBody(req).then(parseJson);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) reject(httpError(413, "PAYLOAD_TOO_LARGE", "请求体过大"));
    });
    req.on("end", () => resolve(body || "{}"));
    req.on("error", reject);
  });
}

function parseJson(rawBody) {
  try {
    return JSON.parse(rawBody || "{}");
  } catch (_) {
    throw httpError(400, "INVALID_JSON", "JSON 格式不合法");
  }
}

function sendJson(res, payload, status = 200) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function sendNoContent(res) {
  res.writeHead(204);
  res.end();
}

function sendError(res, error) {
  const status = error.status || 500;
  sendJson(res, {
    error: {
      code: error.code || "INTERNAL_ERROR",
      message: error.message || "服务器错误",
    },
  }, status);
}

function httpError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
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
  return types[ext] || "application/octet-stream";
}
