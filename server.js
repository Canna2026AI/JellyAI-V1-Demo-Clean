const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");

const {
  clone,
  currentAgentName,
  readStore,
  storeFile,
  withStore,
} = require("./server/conversationsStore");

const rootDir = __dirname;
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";
const maxBodyBytes = 1024 * 1024;
const sessionCookieName = "jelly_session";
const sessionTtlMs = 12 * 60 * 60 * 1000;
const webhookSecret = process.env.JELLY_WEBHOOK_SECRET || "";
const sseClients = new Set();

const mimeTypes = {
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

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host || `${host}:${port}`}`);
    if (req.method === "OPTIONS") {
      sendEmpty(res, 204);
      return;
    }
    if (requestUrl.pathname.startsWith("/api/")) {
      await handleApi(req, res, requestUrl);
      return;
    }
    await serveStatic(req, res, requestUrl);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) console.error(error);
    sendJson(res, status, { error: status >= 500 ? "internal_error" : "bad_request", message: error.message || "服务器处理失败" });
  }
});

server.listen(port, host, () => {
  console.log(`JellyAI demo server running at http://${host}:${port}`);
  console.log(`Conversations store: ${storeFile}`);
});

async function handleApi(req, res, requestUrl) {
  const pathname = requestUrl.pathname.replace(/\/+$/, "") || "/";

  if (pathname === "/api/health" && req.method === "GET") {
    sendJson(res, 200, { ok: true, storeFile });
    return;
  }

  if (pathname.startsWith("/api/auth")) {
    await handleAuth(req, res, pathname);
    return;
  }

  if (pathname.startsWith("/api/conversations/webhooks/")) {
    await handleConversationWebhook(req, res, pathname);
    return;
  }

  req.auth = authenticateRequest(req);

  if (pathname === "/api/conversations/events" && req.method === "GET") {
    requirePermission(req, "conversations:read");
    handleConversationEvents(req, res);
    return;
  }

  if (pathname === "/api/conversations/state" && req.method === "GET") {
    requirePermission(req, "conversations:read");
    sendJson(res, 200, toClientState(readStore(), req.auth));
    return;
  }

  if (pathname === "/api/conversations/meta" && req.method === "GET") {
    requirePermission(req, "conversations:read");
    const store = readStore();
    sendJson(res, 200, buildConversationMeta(store, req.auth));
    return;
  }

  if (pathname === "/api/conversations/audit-logs" && req.method === "GET") {
    requirePermission(req, "audit:read");
    handleAuditLogs(req, res, requestUrl);
    return;
  }

  if (pathname === "/api/conversations" && req.method === "GET") {
    requirePermission(req, "conversations:read");
    const store = readStore();
    const tenantConversations = conversationsForAuth(store.conversations, req.auth);
    const filteredItems = filterConversations(tenantConversations, requestUrl.searchParams);
    const page = paginate(filteredItems, requestUrl.searchParams);
    sendJson(res, 200, {
      items: page.items,
      total: tenantConversations.length,
      filteredTotal: filteredItems.length,
      page: page.meta,
      customViews: store.customViews,
      meta: buildConversationMeta(store, req.auth),
    });
    return;
  }

  if (pathname === "/api/conversations" && req.method === "PUT") {
    requirePermission(req, "conversations:admin");
    const body = await readJsonBody(req);
    const { result } = withStore((store) => {
      const conversations = Array.isArray(body) ? body : body.conversations;
      if (!Array.isArray(conversations)) throw createHttpError(400, "conversations 必须是数组");
      store.conversations = conversations.map((conversation) => ({ ...conversation, tenantId: req.auth.user.tenantId }));
      addAudit(store, null, "conversation.bulk_save", { count: conversations.length }, req.auth);
      return store.conversations;
    });
    publishConversationEvent({ type: "conversation.bulk_saved", actor: publicUser(req.auth.user) });
    sendJson(res, 200, { conversations: result });
    return;
  }

  if (pathname === "/api/conversations/custom-views") {
    await handleCustomViews(req, res);
    return;
  }

  if (pathname === "/api/conversations/quick-replies" || pathname.startsWith("/api/conversations/quick-replies/")) {
    await handleQuickReplies(req, res, pathname);
    return;
  }

  if (pathname === "/api/conversations/quick-reply-groups") {
    await handleQuickReplyGroups(req, res);
    return;
  }

  if (pathname === "/api/conversations/settings" || pathname.startsWith("/api/conversations/settings/")) {
    await handleSettings(req, res, pathname);
    return;
  }

  const match = pathname.match(/^\/api\/conversations\/([^/]+)(?:\/([^/]+))?$/);
  if (match) {
    await handleConversationResource(req, res, requestUrl, decodeURIComponent(match[1]), match[2]);
    return;
  }

  sendJson(res, 404, { error: "not_found", message: "接口不存在" });
}

async function handleAuth(req, res, pathname) {
  if (pathname === "/api/auth/login" && req.method === "POST") {
    const body = await readJsonBody(req);
    const username = String(body.username || "kelvin").trim();
    const password = String(body.password || "demo123");
    const { result } = withStore((store) => {
      const user = store.users.find((item) => item.username === username && item.password === password);
      if (!user) throw createHttpError(401, "账号或密码错误");
      const session = {
        id: createId("session"),
        userId: user.id,
        tenantId: user.tenantId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + sessionTtlMs).toISOString(),
      };
      store.sessions = [...(store.sessions || []).filter((item) => item.userId !== user.id), session];
      return { user: publicUser(user), session };
    });
    sendJson(res, 200, { user: result.user }, {
      "Set-Cookie": serializeCookie(sessionCookieName, result.session.id, { maxAge: Math.floor(sessionTtlMs / 1000) }),
    });
    return;
  }

  if (pathname === "/api/auth/me" && req.method === "GET") {
    const auth = authenticateRequest(req);
    sendJson(res, 200, { user: publicUser(auth.user), permissions: Array.from(auth.permissions) });
    return;
  }

  if (pathname === "/api/auth/logout" && req.method === "POST") {
    const sessionId = readSessionId(req);
    if (sessionId) {
      withStore((store) => {
        store.sessions = (store.sessions || []).filter((session) => session.id !== sessionId);
        return null;
      });
    }
    sendJson(res, 200, { ok: true }, {
      "Set-Cookie": serializeCookie(sessionCookieName, "", { maxAge: 0 }),
    });
    return;
  }

  sendJson(res, 404, { error: "not_found", message: "认证接口不存在" });
}

async function handleConversationResource(req, res, requestUrl, conversationId, action) {
  if (!action && req.method === "GET") {
    requirePermission(req, "conversations:read");
    const store = readStore();
    const conversation = findConversation(store, conversationId, req.auth);
    if (!conversation) return sendJson(res, 404, { error: "not_found", message: "会话不存在" });
    sendJson(res, 200, { conversation });
    return;
  }

  if (!action && req.method === "PATCH") {
    requirePermission(req, "conversations:update");
    const body = await readJsonBody(req);
    const { result } = withStore((store) => {
      const conversation = requireConversation(store, conversationId, req.auth);
      Object.assign(conversation, pickConversationPatch(body));
      touchConversation(conversation);
      addAudit(store, conversationId, "conversation.patch", body, req.auth);
      return conversation;
    });
    publishConversationEvent({ type: "conversation.updated", conversationId, actor: publicUser(req.auth.user), conversation: result });
    sendJson(res, 200, { conversation: result });
    return;
  }

  if (action === "read" && req.method === "PATCH") {
    requirePermission(req, "conversations:read");
    const body = await readJsonBody(req);
    const { result } = withStore((store) => {
      const conversation = requireConversation(store, conversationId, req.auth);
      conversation.unread = body.unread === undefined ? false : Boolean(body.unread);
      addAudit(store, conversationId, "conversation.read", { unread: conversation.unread }, req.auth);
      return conversation;
    });
    publishConversationEvent({ type: "conversation.updated", conversationId, actor: publicUser(req.auth.user), conversation: result });
    sendJson(res, 200, { conversation: result });
    return;
  }

  if (action === "messages" && req.method === "GET") {
    requirePermission(req, "conversations:read");
    const store = readStore();
    const conversation = findConversation(store, conversationId, req.auth);
    if (!conversation) return sendJson(res, 404, { error: "not_found", message: "会话不存在" });
    const page = paginate(conversation.messages || [], requestUrl.searchParams);
    sendJson(res, 200, { items: page.items, total: (conversation.messages || []).length, page: page.meta });
    return;
  }

  if (action === "messages" && req.method === "POST") {
    requirePermission(req, "conversations:message");
    const body = await readJsonBody(req);
    const { result } = withStore((store) => {
      const conversation = requireConversation(store, conversationId, req.auth);
      const message = appendMessage(conversation, {
        id: body.clientMessageId,
        role: body.role || "me",
        type: body.type || "text",
        text: body.content || body.text,
        meta: body.meta,
        material: body.material,
        externalMessageId: body.externalMessageId,
        auth: req.auth,
      });
      addAudit(store, conversationId, "message.create", { messageId: message.id, role: message.role }, req.auth);
      return { conversation, message };
    });
    publishConversationEvent({ type: "message.created", conversationId, actor: publicUser(req.auth.user), message: result.message, conversation: result.conversation });
    sendJson(res, 201, result);
    return;
  }

  if (action === "notes" && req.method === "GET") {
    requirePermission(req, "conversations:read");
    const store = readStore();
    const conversation = findConversation(store, conversationId, req.auth);
    if (!conversation) return sendJson(res, 404, { error: "not_found", message: "会话不存在" });
    sendJson(res, 200, { notes: conversation.notes || [] });
    return;
  }

  if (action === "notes" && req.method === "POST") {
    requirePermission(req, "conversations:update");
    const body = await readJsonBody(req);
    const { result } = withStore((store) => {
      const conversation = requireConversation(store, conversationId, req.auth);
      if (!Array.isArray(conversation.notes)) conversation.notes = [];
      const note = {
        id: body.id || createId("note"),
        text: validateText(body.text, "note"),
        author: body.author || req.auth.user.agentName || currentAgentName,
        createdAt: body.createdAt || timeLabel(),
        createdAtIso: body.createdAtIso || new Date().toISOString(),
      };
      conversation.notes.push(note);
      touchConversation(conversation);
      addAudit(store, conversationId, "conversation.note", { noteId: note.id }, req.auth);
      return { conversation, note };
    });
    publishConversationEvent({ type: "conversation.note", conversationId, actor: publicUser(req.auth.user), note: result.note, conversation: result.conversation });
    sendJson(res, 201, result);
    return;
  }

  if (action === "status" && req.method === "PATCH") {
    requirePermission(req, "conversations:update");
    const body = await readJsonBody(req);
    const { result } = withStore((store) => {
      const conversation = requireConversation(store, conversationId, req.auth);
      const status = validateText(body.status, "status");
      updateStatus(conversation, status);
      addAudit(store, conversationId, "conversation.status", { status }, req.auth);
      return conversation;
    });
    publishConversationEvent({ type: "conversation.updated", conversationId, actor: publicUser(req.auth.user), conversation: result });
    sendJson(res, 200, { conversation: result });
    return;
  }

  if (action === "assignee" && req.method === "PATCH") {
    requirePermission(req, "conversations:assign");
    const body = await readJsonBody(req);
    const { result } = withStore((store) => {
      const conversation = requireConversation(store, conversationId, req.auth);
      const assignee = validateText(body.assignee || req.auth.user.agentName || currentAgentName, "assignee");
      conversation.assignee = assignee;
      conversation.owner = assignee;
      conversation.type = body.mode === "ai" ? "ai" : "manual";
      conversation.assignedToMe = assignee === currentAgentName;
      conversation.status = conversation.type === "manual" ? "解决中" : "AI接待";
      conversation.statusColor = getStatusColor(conversation.status);
      conversation.viewTags = (conversation.viewTags || []).filter((tag) => tag !== "未人工回复");
      appendSystemMessage(conversation, `已转入人工对话，操作人：${assignee}`);
      addAudit(store, conversationId, "conversation.assignee", { assignee, mode: conversation.type }, req.auth);
      return conversation;
    });
    publishConversationEvent({ type: "conversation.updated", conversationId, actor: publicUser(req.auth.user), conversation: result });
    sendJson(res, 200, { conversation: result });
    return;
  }

  if (action === "tags" && req.method === "PATCH") {
    requirePermission(req, "conversations:update");
    const body = await readJsonBody(req);
    const { result } = withStore((store) => {
      const conversation = requireConversation(store, conversationId, req.auth);
      if (Array.isArray(body.tags)) {
        conversation.tags = uniqueStrings(body.tags).map((tag) => tag.slice(0, 12));
      } else if (body.tag) {
        const tag = String(body.tag).trim().slice(0, 12);
        const tags = new Set(conversation.tags || []);
        body.enabled === false || tags.has(tag) ? tags.delete(tag) : tags.add(tag);
        conversation.tags = Array.from(tags);
      }
      touchConversation(conversation);
      addAudit(store, conversationId, "conversation.tags", { tags: conversation.tags }, req.auth);
      return conversation;
    });
    publishConversationEvent({ type: "conversation.updated", conversationId, actor: publicUser(req.auth.user), conversation: result });
    sendJson(res, 200, { conversation: result });
    return;
  }

  if (action === "customer" && req.method === "PATCH") {
    requirePermission(req, "conversations:update");
    const body = await readJsonBody(req);
    const { result } = withStore((store) => {
      const conversation = requireConversation(store, conversationId, req.auth);
      conversation.customer = {
        ...(conversation.customer || {}),
        ...pickCustomerPatch(body),
      };
      touchConversation(conversation);
      addAudit(store, conversationId, "conversation.customer", pickCustomerPatch(body), req.auth);
      return conversation;
    });
    publishConversationEvent({ type: "conversation.updated", conversationId, actor: publicUser(req.auth.user), conversation: result });
    sendJson(res, 200, { conversation: result });
    return;
  }

  if (action === "hosting" && req.method === "PATCH") {
    requirePermission(req, "conversations:update");
    const body = await readJsonBody(req);
    const { result } = withStore((store) => {
      const conversation = requireConversation(store, conversationId, req.auth);
      conversation.hosted = Boolean(body.enabled);
      appendSystemMessage(conversation, `托管状态已${conversation.hosted ? "开启" : "暂停"}`);
      addAudit(store, conversationId, "conversation.hosting", { hosted: conversation.hosted }, req.auth);
      return conversation;
    });
    publishConversationEvent({ type: "conversation.updated", conversationId, actor: publicUser(req.auth.user), conversation: result });
    sendJson(res, 200, { conversation: result });
    return;
  }

  if (action === "star" && req.method === "PATCH") {
    requirePermission(req, "conversations:update");
    const body = await readJsonBody(req);
    const { result } = withStore((store) => {
      const conversation = requireConversation(store, conversationId, req.auth);
      conversation.starred = Boolean(body.starred);
      const viewTags = new Set(conversation.viewTags || []);
      conversation.starred ? viewTags.add("收藏") : viewTags.delete("收藏");
      conversation.viewTags = Array.from(viewTags);
      touchConversation(conversation);
      addAudit(store, conversationId, "conversation.star", { starred: conversation.starred }, req.auth);
      return conversation;
    });
    publishConversationEvent({ type: "conversation.updated", conversationId, actor: publicUser(req.auth.user), conversation: result });
    sendJson(res, 200, { conversation: result });
    return;
  }

  sendJson(res, 404, { error: "not_found", message: "会话接口不存在" });
}

async function handleCustomViews(req, res) {
  if (req.method === "GET") {
    requirePermission(req, "conversations:read");
    sendJson(res, 200, { customViews: readStore().customViews });
    return;
  }

  if (req.method === "PUT") {
    requirePermission(req, "customViews:manage");
    const body = await readJsonBody(req);
    const { result } = withStore((store) => {
      store.customViews = uniqueStrings(body.customViews || body.views || []);
      addAudit(store, null, "custom_views.save", { count: store.customViews.length }, req.auth);
      return store.customViews;
    });
    publishConversationEvent({ type: "customViews.updated", actor: publicUser(req.auth.user), customViews: result });
    sendJson(res, 200, { customViews: result });
    return;
  }

  if (req.method === "POST") {
    requirePermission(req, "customViews:manage");
    const body = await readJsonBody(req);
    const { result } = withStore((store) => {
      const name = validateText(body.name, "name").slice(0, 100);
      if (!store.customViews.includes(name)) store.customViews.push(name);
      addAudit(store, null, "custom_views.create", { name }, req.auth);
      return store.customViews;
    });
    publishConversationEvent({ type: "customViews.updated", actor: publicUser(req.auth.user), customViews: result });
    sendJson(res, 201, { customViews: result });
    return;
  }

  sendJson(res, 405, { error: "method_not_allowed" });
}

function handleAuditLogs(req, res, requestUrl) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "method_not_allowed" });
    return;
  }
  const store = readStore();
  const conversationId = requestUrl.searchParams.get("conversationId");
  const action = requestUrl.searchParams.get("action");
  const logs = [...store.auditLogs]
    .filter((item) => !item.tenantId || item.tenantId === req.auth.user.tenantId)
    .filter((item) => !conversationId || item.conversationId === conversationId)
    .filter((item) => !action || item.action === action)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const page = paginate(logs, requestUrl.searchParams);
  sendJson(res, 200, { items: page.items, total: logs.length, page: page.meta });
}

async function handleQuickReplies(req, res, pathname) {
  if (pathname === "/api/conversations/quick-replies" && req.method === "GET") {
    requirePermission(req, "conversations:read");
    sendJson(res, 200, readStore().quickMessages);
    return;
  }

  if (pathname === "/api/conversations/quick-replies" && req.method === "PUT") {
    requirePermission(req, "quickReplies:manage");
    const body = await readJsonBody(req);
    const { result } = withStore((store) => {
      store.quickMessages = {
        groups: Array.isArray(body.groups) ? body.groups : store.quickMessages.groups,
        replies: Array.isArray(body.replies) ? body.replies : store.quickMessages.replies,
      };
      addAudit(store, null, "quick_replies.bulk_save", { groups: store.quickMessages.groups.length, replies: store.quickMessages.replies.length }, req.auth);
      return store.quickMessages;
    });
    publishConversationEvent({ type: "quickReplies.updated", actor: publicUser(req.auth.user), quickMessages: result });
    sendJson(res, 200, result);
    return;
  }

  if (pathname === "/api/conversations/quick-replies" && req.method === "POST") {
    requirePermission(req, "quickReplies:manage");
    const body = await readJsonBody(req);
    const { result } = withStore((store) => {
      const content = validateText(body.content, "content");
      const reply = {
        id: body.id || createId("reply"),
        groupId: validateText(body.groupId, "groupId"),
        title: body.title ? String(body.title).slice(0, 40) : content.slice(0, 24),
        content,
      };
      store.quickMessages.replies.push(reply);
      addAudit(store, null, "quick_replies.create", { replyId: reply.id }, req.auth);
      return reply;
    });
    publishConversationEvent({ type: "quickReplies.updated", actor: publicUser(req.auth.user) });
    sendJson(res, 201, { reply: result });
    return;
  }

  const match = pathname.match(/^\/api\/conversations\/quick-replies\/([^/]+)$/);
  if (!match) return sendJson(res, 404, { error: "not_found" });
  const replyId = decodeURIComponent(match[1]);

  if (req.method === "PATCH") {
    requirePermission(req, "quickReplies:manage");
    const body = await readJsonBody(req);
    const { result } = withStore((store) => {
      const reply = store.quickMessages.replies.find((item) => item.id === replyId);
      if (!reply) throw createHttpError(404, "快捷回复不存在");
      if (body.groupId !== undefined) reply.groupId = String(body.groupId);
      if (body.title !== undefined) reply.title = String(body.title).slice(0, 40);
      if (body.content !== undefined) reply.content = validateText(body.content, "content");
      addAudit(store, null, "quick_replies.update", { replyId }, req.auth);
      return reply;
    });
    publishConversationEvent({ type: "quickReplies.updated", actor: publicUser(req.auth.user) });
    sendJson(res, 200, { reply: result });
    return;
  }

  if (req.method === "DELETE") {
    requirePermission(req, "quickReplies:manage");
    const { result } = withStore((store) => {
      const before = store.quickMessages.replies.length;
      store.quickMessages.replies = store.quickMessages.replies.filter((item) => item.id !== replyId);
      if (before !== store.quickMessages.replies.length) addAudit(store, null, "quick_replies.delete", { replyId }, req.auth);
      return before !== store.quickMessages.replies.length;
    });
    if (result) publishConversationEvent({ type: "quickReplies.updated", actor: publicUser(req.auth.user) });
    sendJson(res, result ? 200 : 404, result ? { ok: true } : { error: "not_found", message: "快捷回复不存在" });
    return;
  }

  sendJson(res, 405, { error: "method_not_allowed" });
}

async function handleQuickReplyGroups(req, res) {
  if (req.method === "POST") {
    requirePermission(req, "quickReplies:manage");
    const body = await readJsonBody(req);
    const { result } = withStore((store) => {
      const name = validateText(body.name, "name").slice(0, 30);
      if (store.quickMessages.groups.some((group) => group.name === name)) throw createHttpError(409, "分组已存在");
      const group = { id: body.id || createId("group"), name };
      store.quickMessages.groups.push(group);
      addAudit(store, null, "quick_reply_groups.create", { groupId: group.id }, req.auth);
      return group;
    });
    publishConversationEvent({ type: "quickReplies.updated", actor: publicUser(req.auth.user) });
    sendJson(res, 201, { group: result });
    return;
  }

  sendJson(res, 405, { error: "method_not_allowed" });
}

async function handleSettings(req, res, pathname) {
  if (pathname === "/api/conversations/settings" && req.method === "GET") {
    requirePermission(req, "settings:read");
    sendJson(res, 200, readStore().settings);
    return;
  }

  if (req.method !== "PATCH") {
    sendJson(res, 405, { error: "method_not_allowed" });
    return;
  }

  const key = {
    "/api/conversations/settings/worktime": "workHours",
    "/api/conversations/settings/automation": "automation",
    "/api/conversations/settings/forwarding": "forwarding",
  }[pathname];
  if (!key) {
    sendJson(res, 404, { error: "not_found", message: "设置接口不存在" });
    return;
  }

  requirePermission(req, "settings:manage");
  const body = await readJsonBody(req);
  const { result } = withStore((store) => {
    store.settings[key] = clone(body);
    addAudit(store, null, `settings.${key}`, { key }, req.auth);
    return store.settings[key];
  });
  publishConversationEvent({ type: "settings.updated", actor: publicUser(req.auth.user), key });
  sendJson(res, 200, { [key]: result });
}

async function handleConversationWebhook(req, res, pathname) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "method_not_allowed" });
    return;
  }

  if (!isValidWebhookRequest(req)) {
    sendJson(res, 401, { error: "unauthorized", message: "Webhook 签名无效" });
    return;
  }

  const match = pathname.match(/^\/api\/conversations\/webhooks\/([^/]+)\/messages$/);
  if (!match) {
    sendJson(res, 404, { error: "not_found", message: "Webhook 接口不存在" });
    return;
  }

  const provider = decodeURIComponent(match[1]);
  const body = await readJsonBody(req);
  const { result } = withStore((store) => {
    let conversation = findMappedConversation(store, provider, body);
    if (!conversation) {
      conversation = createConversationFromWebhook(provider, body);
      store.conversations.unshift(conversation);
    } else {
      mergeMappedConversation(conversation, provider, body);
    }
    const message = appendMessage(conversation, {
      id: body.eventId || body.messageId,
      role: "customer",
      type: body.type || "text",
      text: body.text || body.content,
      meta: body.meta || `${provider} webhook`,
      material: body.material,
      externalMessageId: body.messageId || body.externalMessageId,
      sender: body.sender || body.senderName,
    });
    conversation.unread = true;
    addAudit(store, conversation.id, "webhook.message", { provider, messageId: message.id }, null, "webhook");
    return { conversation, message };
  });
  publishConversationEvent({ type: "webhook.message", provider, conversationId: result.conversation.id, message: result.message, conversation: result.conversation });
  sendJson(res, 202, result);
}

function filterConversations(conversations, params) {
  const view = params.get("view") || "全部对话";
  const q = (params.get("q") || "").trim().toLowerCase();
  const searchMode = params.get("searchMode") || "fuzzy";
  const status = params.get("status") || "全部状态";
  const channel = params.get("channel") || "全部渠道";
  const sort = params.get("sort") || "newest";
  const items = conversations
    .filter((conversation) => matchesView(conversation, view))
    .filter((conversation) => status === "全部状态" || conversation.status === status)
    .filter((conversation) => channel === "全部渠道" || conversation.channel === channel)
    .filter((conversation) => matchesSearch(conversation, q, searchMode));

  return items.sort((a, b) => {
    if (sort === "unread" && Boolean(a.unread) !== Boolean(b.unread)) return a.unread ? -1 : 1;
    if (sort === "status" && a.status !== b.status) return a.status.localeCompare(b.status, "zh-CN");
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function paginate(items, params) {
  const limit = clampNumber(Number(params.get("limit") || 30), 1, 100);
  const offset = clampNumber(Number(params.get("cursor") || 0), 0, Number.MAX_SAFE_INTEGER);
  const safeOffset = Math.min(offset, items.length);
  const nextOffset = safeOffset + limit;
  return {
    items: items.slice(safeOffset, nextOffset),
    meta: {
      cursor: String(safeOffset),
      nextCursor: nextOffset < items.length ? String(nextOffset) : null,
      limit,
      hasMore: nextOffset < items.length,
    },
  };
}

function buildConversationMeta(store, auth) {
  const conversations = auth ? conversationsForAuth(store.conversations, auth) : store.conversations;
  return {
    currentAgent: auth?.user?.agentName || currentAgentName,
    user: auth ? publicUser(auth.user) : null,
    customViews: store.customViews,
    channels: Array.from(new Set(conversations.map((item) => item.channel))).sort((a, b) => a.localeCompare(b, "zh-CN")),
    statuses: Array.from(new Set(conversations.map((item) => item.status))),
    quickReplyGroups: store.quickMessages.groups.length,
    quickReplies: store.quickMessages.replies.length,
  };
}

function matchesView(conversation, view) {
  if (view === "全部对话") return true;
  if (view === "人工对话") return conversation.type === "manual";
  if (view === "AI对话") return conversation.type === "ai";
  if (view === "指给我的") return conversation.assignedToMe || conversation.assignee === currentAgentName;
  if (view === "收藏") return conversation.starred;
  return (conversation.viewTags || []).includes(view);
}

function matchesSearch(conversation, query, mode) {
  if (!query) return true;
  if (mode === "phone") return String(conversation.customer?.phone || "").includes(query.replace(/\D/g, ""));
  const fields = [
    conversation.name,
    conversation.owner,
    conversation.assignee,
    conversation.channel,
    conversation.status,
    conversation.customer?.phone,
    conversation.customer?.company,
    conversation.messages?.at(-1)?.text,
    ...(conversation.tags || []),
  ].map((value) => String(value || "").toLowerCase());
  return mode === "exact" ? fields.some((value) => value === query) : fields.some((value) => value.includes(query));
}

function toClientState(store, auth) {
  return {
    user: auth ? publicUser(auth.user) : null,
    conversations: auth ? conversationsForAuth(store.conversations, auth) : store.conversations,
    customViews: store.customViews,
    quickMessages: store.quickMessages,
    settings: store.settings,
  };
}

function pickConversationPatch(body) {
  const allowed = ["unread", "starred", "hosted", "status", "statusColor", "assignee", "owner", "type", "assignedToMe", "viewTags", "tags", "customer"];
  return Object.fromEntries(Object.entries(body || {}).filter(([key]) => allowed.includes(key)));
}

function pickCustomerPatch(body) {
  const allowed = ["name", "phone", "company", "city", "remark"];
  return Object.fromEntries(Object.entries(body || {}).filter(([key]) => allowed.includes(key)).map(([key, value]) => [key, String(value || "").trim()]));
}

function findConversation(store, id, auth) {
  return store.conversations.find((conversation) => conversation.id === id && (!auth || conversation.tenantId === auth.user.tenantId));
}

function requireConversation(store, id, auth) {
  const conversation = findConversation(store, id, auth);
  if (!conversation) throw createHttpError(404, "会话不存在");
  return conversation;
}

function appendMessage(conversation, input) {
  const text = validateText(input.text, "content");
  const existing = input.id ? conversation.messages.find((message) => message.id === input.id) : null;
  if (existing) return existing;
  const role = ["me", "ai", "customer", "other", "system"].includes(input.role) ? input.role : "me";
  const message = {
    id: input.id || createId("msg"),
    role,
    type: input.type || "text",
    text,
    createdAt: timeLabel(),
    createdAtIso: new Date().toISOString(),
    status: role === "me" ? "sent" : "received",
  };
  if (input.meta) message.meta = String(input.meta);
  if (input.material && typeof input.material === "object") message.material = input.material;
  if (input.externalMessageId) message.externalMessageId = String(input.externalMessageId);
  if (input.sender) message.sender = input.sender;
  conversation.messages.push(message);
  conversation.updatedAt = new Date().toISOString();
  if (role === "me") {
    conversation.status = "解决中";
    conversation.statusColor = "orange";
    conversation.type = "manual";
    conversation.assignee = input.auth?.user?.agentName || currentAgentName;
    conversation.owner = input.auth?.user?.agentName || currentAgentName;
    conversation.assignedToMe = true;
    conversation.unread = false;
    conversation.viewTags = (conversation.viewTags || []).filter((tag) => tag !== "未人工回复");
  }
  if (role === "customer") {
    conversation.unread = true;
    conversation.viewTags = conversation.viewTags || [];
    if (!conversation.viewTags.includes("未人工回复")) conversation.viewTags.push("未人工回复");
  }
  return message;
}

function updateStatus(conversation, status) {
  conversation.status = status;
  conversation.statusColor = getStatusColor(status);
  appendSystemMessage(conversation, `会话状态已更新为：${status}`);
}

function appendSystemMessage(conversation, text) {
  const message = {
    id: createId("sys"),
    role: "system",
    text,
    createdAt: "刚刚",
  };
  conversation.messages.push(message);
  touchConversation(conversation);
  return message;
}

function touchConversation(conversation) {
  conversation.updatedAt = new Date().toISOString();
  conversation.statusColor = getStatusColor(conversation.status);
}

function getStatusColor(status) {
  return status === "已解决" || status === "AI接待" ? "green" : "orange";
}

function findMappedConversation(store, provider, body) {
  if (body.conversationId) {
    const byId = store.conversations.find((item) => item.id === body.conversationId);
    if (byId) return byId;
  }
  const channelName = body.channel || providerChannel(provider);
  const externalId = body.externalId || body.openId || body.userId || body.groupId || "";
  const sourceId = body.sourceId || body.roomId || "";
  const hostedAccountId = body.hostedAccountId || body.accountId || "";
  return store.conversations.find((conversation) => {
    if (conversation.channel !== channelName) return false;
    if (externalId && conversation.externalId === externalId) return true;
    if (sourceId && conversation.sourceId === sourceId && (!hostedAccountId || conversation.hostedAccountId === hostedAccountId)) return true;
    return false;
  });
}

function mergeMappedConversation(conversation, provider, body) {
  const channelName = body.channel || providerChannel(provider);
  conversation.channel = conversation.channel || channelName;
  conversation.channelIcon = conversation.channelIcon || channelName.slice(0, 1);
  conversation.sourceName = body.sourceName || conversation.sourceName || `${provider} 接入`;
  conversation.sourceId = body.sourceId || body.roomId || conversation.sourceId;
  conversation.hostedAccountId = body.hostedAccountId || body.accountId || conversation.hostedAccountId;
  conversation.externalId = body.externalId || body.openId || body.userId || body.groupId || conversation.externalId;
  conversation.provider = provider;
  conversation.hosted = body.hosted === undefined ? conversation.hosted : Boolean(body.hosted);
  if (Array.isArray(body.members)) conversation.members = normalizeWebhookMembers(body.members, conversation);
  if (body.customerName || body.name || body.phone || body.company || body.city || body.remark) {
    conversation.customer = {
      ...(conversation.customer || {}),
      name: body.customerName || body.name || conversation.customer?.name || conversation.name,
      phone: body.phone || conversation.customer?.phone || "",
      company: body.company || conversation.customer?.company || "",
      city: body.city || conversation.customer?.city || "",
      remark: body.remark || conversation.customer?.remark || `${channelName} 来访`,
    };
    conversation.name = conversation.customer.name || conversation.name;
  }
  conversation.viewTags = Array.from(new Set([...(conversation.viewTags || []), channelName, "未人工回复"]));
  touchConversation(conversation);
}

function createConversationFromWebhook(provider, body) {
  const id = body.conversationId || createId(provider);
  const channelName = body.channel || providerChannel(provider);
  const externalId = body.externalId || body.openId || body.userId || body.groupId || createId("external");
  return {
    id,
    tenantId: body.tenantId || "tenant-demo",
    name: body.customerName || body.name || "新访客",
    avatar: String(body.customerName || provider || "客").slice(0, 1).toUpperCase(),
    owner: "AI",
    assignee: "AI",
    type: "ai",
    assignedToMe: false,
    channel: channelName,
    channelIcon: channelName.slice(0, 1),
    provider,
    sourceName: body.sourceName || `${provider} 接入`,
    sourceId: body.sourceId || body.roomId || createId("source"),
    hostedAccountId: body.hostedAccountId || body.accountId || "-",
    externalId,
    hosted: true,
    status: "AI接待",
    statusColor: "green",
    unread: true,
    updatedAt: new Date().toISOString(),
    starred: false,
    viewTags: [channelName, "未人工回复"],
    tags: [],
    customer: {
      name: body.customerName || body.name || "新访客",
      remark: body.remark || `${channelName} 来访`,
      phone: body.phone || "",
      company: body.company || "",
      city: body.city || "",
    },
    members: normalizeWebhookMembers(body.members, {
      id,
      name: body.customerName || body.name || "新访客",
      avatar: String(body.customerName || provider || "客").slice(0, 1).toUpperCase(),
      customer: { phone: body.phone || "", company: body.company || "", city: body.city || "", remark: body.remark || `${channelName} 来访` },
      tags: [],
    }),
    notes: [],
    messages: [],
  };
}

function normalizeWebhookMembers(members, conversation) {
  if (!Array.isArray(members) || !members.length) {
    return [
      {
        id: `${conversation.id || "external"}-customer`,
        name: conversation.customer?.name || conversation.name || "客户",
        avatar: conversation.avatar || "客",
        role: "客户",
        company: conversation.customer?.company || "",
        phone: conversation.customer?.phone || "",
        city: conversation.customer?.city || "",
        remark: conversation.customer?.remark || "",
        tags: conversation.tags || [],
        lastActive: "刚刚",
      },
    ];
  }
  return members.map((member, index) => ({
    id: String(member.id || member.externalId || member.userId || `member-${index}`),
    name: String(member.name || member.nickname || member.remark || `成员${index + 1}`),
    avatar: String(member.avatar || member.name || member.nickname || "成").slice(0, 2),
    role: String(member.role || "群成员"),
    company: String(member.company || ""),
    phone: String(member.phone || ""),
    city: String(member.city || ""),
    remark: String(member.remark || ""),
    tags: Array.isArray(member.tags) ? uniqueStrings(member.tags) : [],
    lastActive: String(member.lastActive || "刚刚"),
  }));
}

function providerChannel(provider) {
  return {
    wecom: "企业微信托管",
    website: "网站页面",
    redbook: "小红书",
    douyin: "抖音",
    wechat: "公众号",
  }[provider] || provider;
}

function addAudit(store, conversationId, action, payload, auth, operatorOverride) {
  store.auditLogs.push({
    id: createId("audit"),
    conversationId,
    action,
    payload,
    operator: operatorOverride || auth?.user?.name || currentAgentName,
    operatorId: auth?.user?.id || null,
    tenantId: auth?.user?.tenantId || "tenant-demo",
    createdAt: new Date().toISOString(),
  });
  if (store.auditLogs.length > 500) store.auditLogs = store.auditLogs.slice(-500);
}

function authenticateRequest(req) {
  const sessionId = readSessionId(req);
  if (!sessionId) throw createHttpError(401, "请先登录");
  const store = readStore();
  const session = (store.sessions || []).find((item) => item.id === sessionId && new Date(item.expiresAt).getTime() > Date.now());
  if (!session) throw createHttpError(401, "登录已过期");
  const user = store.users.find((item) => item.id === session.userId);
  if (!user) throw createHttpError(401, "用户不存在");
  return {
    session,
    user,
    permissions: resolvePermissions(user, store),
  };
}

function requirePermission(req, permission) {
  if (!req.auth) throw createHttpError(401, "请先登录");
  if (!hasPermission(req.auth.permissions, permission)) throw createHttpError(403, "没有操作权限");
}

function resolvePermissions(user, store) {
  const permissions = new Set();
  (user.roleIds || []).forEach((roleId) => {
    const role = store.roles.find((item) => item.id === roleId);
    (role?.permissions || []).forEach((permission) => permissions.add(permission));
  });
  return permissions;
}

function hasPermission(permissions, permission) {
  if (permissions.has("*")) return true;
  if (permissions.has(permission)) return true;
  const [area] = permission.split(":");
  return permissions.has(`${area}:*`);
}

function conversationsForAuth(conversations, auth) {
  return conversations.filter((conversation) => conversation.tenantId === auth.user.tenantId);
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    tenantId: user.tenantId,
    roleIds: user.roleIds,
    agentName: user.agentName,
  };
}

function readSessionId(req) {
  return req.headers["x-jelly-session"] || parseCookies(req.headers.cookie || "")[sessionCookieName] || "";
}

function parseCookies(cookieHeader) {
  return cookieHeader.split(";").reduce((acc, pair) => {
    const [rawKey, ...rawValue] = pair.trim().split("=");
    if (!rawKey) return acc;
    acc[rawKey] = decodeURIComponent(rawValue.join("=") || "");
    return acc;
  }, {});
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", "SameSite=Lax"];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  return parts.join("; ");
}

function handleConversationEvents(req, res) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  const client = {
    id: createId("sse"),
    tenantId: req.auth.user.tenantId,
    userId: req.auth.user.id,
    res,
  };
  sseClients.add(client);
  sendSse(client, { type: "connected", user: publicUser(req.auth.user) });
  req.on("close", () => sseClients.delete(client));
}

function publishConversationEvent(event) {
  const payload = {
    ...event,
    createdAt: new Date().toISOString(),
  };
  for (const client of sseClients) {
    if (event.tenantId && client.tenantId !== event.tenantId) continue;
    sendSse(client, payload);
  }
}

function sendSse(client, event) {
  client.res.write(`event: message\n`);
  client.res.write(`data: ${JSON.stringify(event)}\n\n`);
}

function isValidWebhookRequest(req) {
  if (!webhookSecret) return true;
  return req.headers["x-jelly-webhook-secret"] === webhookSecret;
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBodyBytes) throw createHttpError(413, "请求体过大");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw createHttpError(400, "JSON 格式错误");
  }
}

async function serveStatic(req, res, requestUrl) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    sendEmpty(res, 405);
    return;
  }
  const cleanPath = decodeURIComponent(requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname);
  const filePath = path.normalize(path.join(rootDir, cleanPath));
  const relativePath = path.relative(rootDir, filePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath) || relativePath.split(path.sep).includes(".jelly-data")) {
    sendEmpty(res, 403);
    return;
  }
  const stats = await fs.promises.stat(filePath).catch(() => null);
  if (!stats || !stats.isFile()) {
    sendEmpty(res, 404);
    return;
  }
  res.writeHead(200, {
    "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  fs.createReadStream(filePath).pipe(res);
}

function sendJson(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...extraHeaders,
  });
  res.end(body);
}

function sendEmpty(res, status) {
  res.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end();
}

function validateText(value, field) {
  const text = String(value || "").trim();
  if (!text) throw createHttpError(400, `${field} 不能为空`);
  return text;
}

function uniqueStrings(values) {
  return Array.from(new Set((values || []).map((value) => String(value || "").trim()).filter(Boolean)));
}

function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function timeLabel() {
  return new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

process.on("uncaughtException", (error) => {
  const status = error.status || 500;
  console.error(error);
  if (status >= 500) process.exitCode = 1;
});
