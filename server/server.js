const fs = require("fs");
const http = require("http");
const path = require("path");
const url = require("url");
const knowledge = require("./knowledgeStore");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

const server = http.createServer(async (req, res) => {
  try {
    const parsed = url.parse(req.url, true);
    if (parsed.pathname.startsWith("/api/")) {
      await handleApi(req, res, parsed);
      return;
    }
    serveStatic(req, res, parsed);
  } catch (error) {
    sendJson(res, error.status || 500, { error: error.message || "Internal Server Error" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`JellyAI demo server running at http://${HOST}:${PORT}`);
});

async function handleApi(req, res, parsed) {
  const method = req.method || "GET";
  const pathname = parsed.pathname;

  if (method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, { ok: true, service: "jellyai-knowledge", time: new Date().toISOString() });
    return;
  }

  if (method === "GET" && pathname === "/api/knowledge-bases") {
    sendJson(res, 200, knowledge.listKnowledgeBases(parsed.query));
    return;
  }

  if (method === "POST" && pathname === "/api/knowledge-bases") {
    sendJson(res, 201, await knowledge.createKnowledgeBase(await readJson(req)));
    return;
  }

  if (method === "POST" && pathname === "/api/chunks/preview") {
    sendJson(res, 200, { items: knowledge.previewChunks(await readJson(req)) });
    return;
  }

  if (method === "GET" && pathname === "/api/knowledge-search/debug") {
    sendJson(res, 200, knowledge.searchKnowledge(parsed.query));
    return;
  }

  if (method === "POST" && pathname === "/api/knowledge-search/debug") {
    sendJson(res, 200, knowledge.searchKnowledge(await readJson(req)));
    return;
  }

  const kbMatch = pathname.match(/^\/api\/knowledge-bases\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?$/);
  if (kbMatch) {
    const [, kbId, child, childId] = kbMatch.map((part) => (part ? decodeURIComponent(part) : part));
    if (method === "GET" && !child) {
      const item = knowledge.getKnowledgeBase(kbId);
      if (!item) throw httpError(404, "知识库不存在");
      sendJson(res, 200, item);
      return;
    }
    if (method === "PATCH" && !child) {
      sendJson(res, 200, knowledge.updateKnowledgeBase(kbId, await readJson(req)));
      return;
    }
    if (method === "DELETE" && !child) {
      sendJson(res, 200, knowledge.deleteKnowledgeBase(kbId));
      return;
    }
    if (method === "POST" && child === "toggle") {
      sendJson(res, 200, knowledge.toggleKnowledgeBase(kbId));
      return;
    }
    if (method === "POST" && child === "reindex") {
      sendJson(res, 200, knowledge.reindexKnowledgeBase(kbId, await readJson(req)));
      return;
    }
    if (method === "POST" && child === "documents") {
      sendJson(res, 201, await knowledge.addDocument(kbId, await readJson(req)));
      return;
    }
    if (method === "GET" && child === "documents") {
      sendJson(res, 200, knowledge.listDocuments(kbId));
      return;
    }
    if (method === "DELETE" && child === "documents" && childId) {
      sendJson(res, 200, knowledge.deleteDocument(kbId, childId));
      return;
    }
    if (method === "GET" && child === "chunks") {
      sendJson(res, 200, knowledge.listChunks(kbId, parsed.query));
      return;
    }
  }

  throw httpError(404, "API 不存在");
}

function serveStatic(req, res, parsed) {
  let pathname = decodeURIComponent(parsed.pathname || "/");
  if (pathname === "/") pathname = "/index.html";
  const filePath = path.normalize(path.join(ROOT, pathname));
  if (!filePath.startsWith(ROOT)) {
    sendText(res, 403, "Forbidden");
    return;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    sendText(res, 404, "Not Found");
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(filePath).pipe(res);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => {
      chunks.push(chunk);
      if (Buffer.concat(chunks).length > 30 * 1024 * 1024) reject(httpError(413, "请求体过大"));
    });
    req.on("end", () => {
      const text = Buffer.concat(chunks).toString("utf8");
      if (!text) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(text));
      } catch (_) {
        reject(httpError(400, "JSON 格式错误"));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, text) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
