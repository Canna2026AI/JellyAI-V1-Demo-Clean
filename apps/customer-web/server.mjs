import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const port = Number(process.env.CUSTOMER_WEB_PORT || 3001);
const host = process.env.CUSTOMER_WEB_HOST || "127.0.0.1";
const apiOrigin = process.env.ADMIN_API_ORIGIN || process.env.ADMIN_WEB_URL || "http://localhost:3000";
const sessionCookieName = "jellyai_session";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function hasSessionCookie(req) {
  return (req.headers.cookie || "").split(";").some((entry) => entry.trim().startsWith(`${sessionCookieName}=`));
}

function send(res, statusCode, body, headers = {}) {
  res.writeHead(statusCode, headers);
  res.end(body);
}

async function serveFile(res, filePath) {
  const body = await readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  send(res, 200, body, {
    "Content-Type": mimeTypes[ext] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
}

async function proxyApi(req, res, url) {
  const target = new URL(`${url.pathname}${url.search}`, apiOrigin);
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const upstream = await fetch(target, {
    method: req.method,
    headers: {
      cookie: req.headers.cookie || "",
      "content-type": req.headers["content-type"] || "application/json",
      accept: req.headers.accept || "application/json",
      "user-agent": req.headers["user-agent"] || "jellyai-customer-web",
    },
    body,
    redirect: "manual",
  });

  const responseHeaders = {};
  upstream.headers.forEach((value, key) => {
    if (["content-encoding", "content-length", "connection", "keep-alive", "transfer-encoding", "set-cookie"].includes(key)) return;
    responseHeaders[key] = value;
  });
  const setCookies = upstream.headers.getSetCookie?.() || (upstream.headers.get("set-cookie") ? [upstream.headers.get("set-cookie")] : []);
  if (setCookies.length) responseHeaders["set-cookie"] = setCookies;
  const responseBody = Buffer.from(await upstream.arrayBuffer());
  send(res, upstream.status, responseBody, responseHeaders);
}

async function handleStatic(req, res, url) {
  if (url.pathname === "/login") {
    await serveFile(res, path.join(__dirname, "login.html"));
    return;
  }
  if (url.pathname === "/" && !hasSessionCookie(req)) {
    await serveFile(res, path.join(__dirname, "login.html"));
    return;
  }

  const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.resolve(rootDir, `.${pathname}`);
  if (!filePath.startsWith(rootDir)) {
    send(res, 403, "Forbidden", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }
  const fileStat = await stat(filePath).catch(() => null);
  if (!fileStat?.isFile()) {
    send(res, 404, "Not found", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }
  await serveFile(res, filePath);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || `${host}:${port}`}`);
    if (url.pathname.startsWith("/api/")) {
      await proxyApi(req, res, url);
      return;
    }
    await handleStatic(req, res, url);
  } catch (error) {
    console.error("[customer-web]", error);
    send(res, 500, "Customer web server error", { "Content-Type": "text/plain; charset=utf-8" });
  }
});

server.listen(port, host, () => {
  console.log(`Customer web ready at http://${host}:${port}`);
  console.log(`Proxying /api/* to ${apiOrigin}`);
});
