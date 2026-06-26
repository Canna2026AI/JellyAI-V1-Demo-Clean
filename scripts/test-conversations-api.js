const fs = require("fs");
const net = require("net");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

function assert(value, message) {
  if (!value) throw new Error(message);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findOpenPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

async function waitForServer(baseUrl, serverProcess) {
  for (let index = 0; index < 50; index += 1) {
    if (serverProcess.exitCode !== null) throw new Error(`server exited with code ${serverProcess.exitCode}`);
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      await wait(100);
    }
  }
  throw new Error("server did not become ready");
}

async function api(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(`${options.method || "GET"} ${path} ${response.status}: ${text}`);
  return body;
}

async function createClient(baseUrl, username = "kelvin", password = "demo123") {
  let cookie = "";
  const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const loginText = await loginResponse.text();
  if (!loginResponse.ok) throw new Error(`login failed: ${loginText}`);
  cookie = loginResponse.headers.get("set-cookie")?.split(";")[0] || "";
  return {
    cookie,
    user: JSON.parse(loginText).user,
    api: (path, options = {}) => api(baseUrl, path, {
      ...options,
      headers: {
        Cookie: cookie,
        ...(options.headers || {}),
      },
    }),
  };
}

async function expectApiError(request, expectedStatus, message) {
  try {
    await request();
  } catch (error) {
    assert(error.message.includes(` ${expectedStatus}:`), message);
    return;
  }
  throw new Error(message);
}

async function waitForSseEvent(baseUrl, cookie, trigger, predicate) {
  const controller = new AbortController();
  const response = await fetch(`${baseUrl}/api/conversations/events`, {
    headers: { Cookie: cookie },
    signal: controller.signal,
  });
  assert(response.ok, "SSE endpoint should open");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const eventPromise = (async () => {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";
        for (const chunk of chunks) {
          const dataLine = chunk.split("\n").find((line) => line.startsWith("data: "));
          if (!dataLine) continue;
          const event = JSON.parse(dataLine.slice(6));
          if (predicate(event)) return event;
        }
      }
      throw new Error("SSE stream closed before matching event");
    })();
    await trigger();
    return await eventPromise;
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }
}

async function run() {
  const port = await findOpenPort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const storeFile = path.join(os.tmpdir(), `jelly-conversations-api-${Date.now()}.json`);
  const serverProcess = spawn(process.execPath, ["server.js"], {
    cwd: path.join(__dirname, ".."),
    env: {
      ...process.env,
      PORT: String(port),
      HOST: "127.0.0.1",
      JELLY_CONVERSATIONS_STORE: storeFile,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const logs = [];
  serverProcess.stdout.on("data", (chunk) => logs.push(chunk.toString()));
  serverProcess.stderr.on("data", (chunk) => logs.push(chunk.toString()));

  try {
    await waitForServer(baseUrl, serverProcess);

    const health = await api(baseUrl, "/api/health");
    assert(health.ok, "health should be ok");

    await expectApiError(() => api(baseUrl, "/api/conversations/state"), 401, "unauthenticated conversations state should be rejected");

    const viewer = await createClient(baseUrl, "viewer", "demo123");
    await expectApiError(() => viewer.api("/api/conversations/group/messages", {
      method: "POST",
      body: JSON.stringify({ clientMessageId: "viewer-denied", content: "viewer should not send" }),
    }), 403, "viewer should not be allowed to send messages");

    const client = await createClient(baseUrl, "kelvin", "demo123");
    const me = await client.api("/api/auth/me");
    assert(me.user.username === "kelvin", "auth me should return logged in user");
    assert(me.permissions.includes("*"), "admin user should include wildcard permission");

    const state = await client.api("/api/conversations/state");
    assert(state.conversations.length >= 4, "state should include seeded conversations");
    assert(state.user.username === "kelvin", "state should include current user");

    const meta = await client.api("/api/conversations/meta");
    assert(meta.channels.includes("企业微信托管"), "meta should include channels");
    assert(meta.statuses.includes("解决中"), "meta should include statuses");
    assert(meta.user.username === "kelvin", "meta should include current user");

    const firstPage = await client.api("/api/conversations?limit=2");
    assert(firstPage.items.length === 2, "list should respect limit");
    assert(firstPage.page.hasMore === true, "list should expose next page");
    assert(firstPage.page.nextCursor, "list should return next cursor");

    const secondPage = await client.api(`/api/conversations?limit=2&cursor=${encodeURIComponent(firstPage.page.nextCursor)}`);
    assert(secondPage.items.length >= 1, "second page should return remaining conversations");

    const searched = await client.api("/api/conversations?view=%E5%85%A8%E9%83%A8%E5%AF%B9%E8%AF%9D&q=Canna");
    assert(searched.items.some((item) => item.id === "canna"), "search should find Canna conversation");

    const clientMessageId = `api-test-${Date.now()}`;
    const sent = await client.api("/api/conversations/group/messages", {
      method: "POST",
      body: JSON.stringify({ clientMessageId, content: "API 自动化测试人工消息" }),
    });
    assert(sent.message.id === clientMessageId, "message should use client id for idempotency");
    assert(sent.message.status === "sent", "manual message should have sent status");

    const duplicate = await client.api("/api/conversations/group/messages", {
      method: "POST",
      body: JSON.stringify({ clientMessageId, content: "API 自动化测试人工消息" }),
    });
    assert(duplicate.message.id === clientMessageId, "duplicate client id should return existing message");

    const messages = await client.api("/api/conversations/group/messages?limit=3");
    assert(messages.items.length === 3, "messages endpoint should paginate");
    assert(messages.total >= 3, "messages endpoint should include total");

    const customer = await client.api("/api/conversations/group/customer", {
      method: "PATCH",
      body: JSON.stringify({ remark: "API验收客户", city: "深圳" }),
    });
    assert(customer.conversation.customer.remark === "API验收客户", "customer profile should update");

    const status = await client.api("/api/conversations/group/status", {
      method: "PATCH",
      body: JSON.stringify({ status: "已解决" }),
    });
    assert(status.conversation.status === "已解决", "status should update");

    const tags = await client.api("/api/conversations/group/tags", {
      method: "PATCH",
      body: JSON.stringify({ tags: ["高意向", "API验证"] }),
    });
    assert(tags.conversation.tags.includes("API验证"), "tags should update");

    const hosting = await client.api("/api/conversations/group/hosting", {
      method: "PATCH",
      body: JSON.stringify({ enabled: false }),
    });
    assert(hosting.conversation.hosted === false, "hosting should update");

    const starred = await client.api("/api/conversations/group/star", {
      method: "PATCH",
      body: JSON.stringify({ starred: false }),
    });
    assert(starred.conversation.starred === false, "star should update");

    const auditLogs = await client.api("/api/conversations/audit-logs?conversationId=group&limit=10");
    assert(auditLogs.items.length >= 5, "audit logs should expose recent mutations");
    assert(auditLogs.items.some((item) => item.action === "conversation.status"), "audit logs should include status update");

    const views = await client.api("/api/conversations/custom-views", {
      method: "PUT",
      body: JSON.stringify({ customViews: [...state.customViews, "API验证视图"] }),
    });
    assert(views.customViews.includes("API验证视图"), "custom views should save");

    const quick = await client.api("/api/conversations/quick-replies", {
      method: "POST",
      body: JSON.stringify({ groupId: "group-logistics", title: "API快捷", content: "API 快捷回复内容" }),
    });
    assert(quick.reply.id, "quick reply should be created");
    await client.api(`/api/conversations/quick-replies/${encodeURIComponent(quick.reply.id)}`, { method: "DELETE" });

    const group = await client.api("/api/conversations/quick-reply-groups", {
      method: "POST",
      body: JSON.stringify({ name: `API分组${Date.now()}` }),
    });
    assert(group.group.id, "quick reply group should be created");

    const worktime = await client.api("/api/conversations/settings/worktime", {
      method: "PATCH",
      body: JSON.stringify({ enabled: true, schedules: [{ day: "每天", ranges: [{ start: "09:00", end: "21:00" }] }], afterHoursAction: "A: 回复文本内容", afterHoursText: "已保存到后端" }),
    });
    assert(worktime.workHours.enabled === true, "worktime should save");

    const webhookEventId = `webhook-${Date.now()}`;
    const sseEvent = await waitForSseEvent(baseUrl, client.cookie, () => api(baseUrl, "/api/conversations/webhooks/website/messages", {
      method: "POST",
      body: JSON.stringify({ eventId: webhookEventId, customerName: "Webhook访客", content: "来自 webhook 的真实入站消息", phone: "13500000000" }),
    }), (event) => event.type === "webhook.message" && event.message?.id === webhookEventId);
    assert(sseEvent.conversationId && sseEvent.message.role === "customer", "SSE should publish webhook incoming message");

    const detail = await client.api("/api/conversations/group");
    assert(detail.conversation.messages.some((message) => message.id === clientMessageId), "detail should include persisted message");
    assert(fs.existsSync(storeFile), "store file should be written to disk");

    console.log("conversations_api_test=ok");
  } finally {
    serverProcess.kill("SIGTERM");
    fs.rmSync(storeFile, { force: true });
  }
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
