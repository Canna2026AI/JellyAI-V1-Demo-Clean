const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const VALID_STATUSES = new Set(["已接入", "未接入", "开发中", "暂停"]);

function createChannelStore(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const dataDir = options.dataDir || path.join(rootDir, ".data");
  const dbPath = options.dbPath || path.join(dataDir, "channels-db.json");
  const seedPath = options.seedPath || path.join(rootDir, "server", "seed", "channels-db.json");

  function ensureDatabase() {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(dbPath)) fs.copyFileSync(seedPath, dbPath);
  }

  function readDb() {
    ensureDatabase();
    return JSON.parse(fs.readFileSync(dbPath, "utf8"));
  }

  function writeDb(db) {
    ensureDatabase();
    const payload = JSON.stringify(db, null, 2);
    const tmpPath = `${dbPath}.${process.pid}.tmp`;
    fs.writeFileSync(tmpPath, payload);
    fs.renameSync(tmpPath, dbPath);
  }

  function mutate(mutator) {
    const db = readDb();
    const result = mutator(db);
    writeDb(db);
    return result;
  }

  function now() {
    return new Date().toISOString();
  }

  function publicChannel(channel) {
    const accountRecords = Array.isArray(channel.accountRecords) ? channel.accountRecords : [];
    const accountCount = accountRecords.length;
    const normalizedStatus = channel.isOpen === false ? "开发中" : accountCount > 0 ? "已接入" : channel.status === "暂停" ? "暂停" : "未接入";
    const tags = new Set(channel.tags || []);
    tags.delete(accountCount > 0 ? "未绑定" : "已绑定");
    tags.add(accountCount > 0 ? "已绑定" : "未绑定");
    tags.add(channel.category);
    return {
      ...channel,
      status: normalizedStatus,
      accountCount,
      action: getActionLabel(channel, normalizedStatus),
      tags: [...tags],
      accountRecords: accountRecords.map(publicAccount),
      accounts: accountRecords.map(formatAccount),
    };
  }

  function publicAccount(account) {
    return {
      id: account.id,
      accountName: account.accountName,
      owner: account.owner || "",
      assistant: account.assistant || "未绑定",
      status: account.status || "在线",
      remark: account.remark || "",
      providerAccountId: account.providerAccountId || "",
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }

  function getActionLabel(channel, status) {
    if (channel.route === "wechat") return "管理";
    if (channel.isOpen === false) return "查看说明";
    if (status === "已接入") return "新增账号";
    return "添加账号";
  }

  function formatAccount(account) {
    const owner = account.owner ? ` / ${account.owner}` : "";
    return `${account.accountName}${owner}`;
  }

  function findChannel(db, channelId) {
    return db.channels.find((channel) => channel.id === channelId);
  }

  function listChannels(filters = {}) {
    const keyword = String(filters.keyword || "").trim().toLowerCase();
    const category = filters.category || "全部";
    const status = filters.status || "";
    let channels = readDb().channels.map(publicChannel);
    if (category && category !== "全部") {
      channels = channels.filter((channel) => {
        if (category === "已绑定") return channel.status === "已接入";
        if (category === "未绑定") return channel.status !== "已接入";
        return channel.category === category || channel.tags.includes(category);
      });
    }
    if (status) channels = channels.filter((channel) => channel.status === status);
    if (keyword) {
      channels = channels.filter((channel) =>
        [
          channel.name,
          channel.description,
          channel.status,
          channel.category,
          channel.guide,
          ...channel.tags,
          ...channel.accounts,
          ...channel.fields,
        ].join(" ").toLowerCase().includes(keyword)
      );
    }
    return channels;
  }

  function getChannel(channelId) {
    const channel = findChannel(readDb(), channelId);
    if (!channel) return null;
    return publicChannel(channel);
  }

  function connectChannel(channelId, payload, actor = "demo-user") {
    return mutate((db) => {
      const channel = findChannel(db, channelId);
      if (!channel) throw httpError(404, "CHANNEL_NOT_FOUND", "渠道不存在");
      if (channel.isOpen === false) throw httpError(409, "CHANNEL_NOT_OPEN", "该渠道暂未开放真实接入");
      const accountName = sanitize(payload.accountName);
      if (!accountName) throw httpError(400, "ACCOUNT_NAME_REQUIRED", "账号名称不能为空");
      const timestamp = now();
      const account = {
        id: createId("acct"),
        accountName,
        owner: sanitize(payload.owner),
        assistant: sanitize(payload.assistant) || "未绑定",
        remark: sanitize(payload.remark),
        providerAccountId: sanitize(payload.providerAccountId),
        status: "在线",
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      channel.accountRecords = Array.isArray(channel.accountRecords) ? channel.accountRecords : [];
      channel.accountRecords.push(account);
      channel.status = "已接入";
      channel.updatedAt = timestamp;
      audit(db, actor, "channel.connect", { channelId, accountId: account.id, accountName });
      return { channel: publicChannel(channel), account: publicAccount(account) };
    });
  }

  function testChannel(channelId, payload) {
    const channel = getChannel(channelId);
    if (!channel) throw httpError(404, "CHANNEL_NOT_FOUND", "渠道不存在");
    if (channel.isOpen === false) {
      return {
        passed: false,
        message: "该渠道仍在开发中，不能执行真实连接测试。",
        checks: [{ name: "开放状态", passed: false, message: "渠道未开放" }],
        warnings: [],
      };
    }
    const accountName = sanitize(payload.accountName);
    const checks = [
      { name: "账号名称", passed: Boolean(accountName), message: accountName ? "已填写" : "不能为空" },
      { name: "渠道开放状态", passed: true, message: "渠道已开放接入" },
      { name: "字段完整度", passed: true, message: `后端已记录 ${channel.fields.length} 个真实接入字段` },
    ];
    const passed = checks.every((check) => check.passed);
    return {
      passed,
      message: passed ? "连接测试通过。" : "连接测试未通过。",
      checks,
      warnings: ["当前测试不会连接真实第三方平台，真实授权需配置对应平台凭据。"],
    };
  }

  function updateChannelStatus(channelId, payload, actor = "demo-user") {
    return mutate((db) => {
      const channel = findChannel(db, channelId);
      if (!channel) throw httpError(404, "CHANNEL_NOT_FOUND", "渠道不存在");
      const status = sanitize(payload.status);
      if (!VALID_STATUSES.has(status)) throw httpError(400, "INVALID_STATUS", "状态不合法");
      channel.status = status;
      channel.updatedAt = now();
      audit(db, actor, "channel.status", { channelId, status });
      return publicChannel(channel);
    });
  }

  function updateAccount(channelId, accountId, payload, actor = "demo-user") {
    return mutate((db) => {
      const channel = findChannel(db, channelId);
      if (!channel) throw httpError(404, "CHANNEL_NOT_FOUND", "渠道不存在");
      const account = (channel.accountRecords || []).find((item) => item.id === accountId);
      if (!account) throw httpError(404, "ACCOUNT_NOT_FOUND", "账号不存在");
      for (const field of ["accountName", "owner", "assistant", "remark", "providerAccountId", "status"]) {
        if (Object.prototype.hasOwnProperty.call(payload, field)) account[field] = sanitize(payload[field]);
      }
      if (!account.accountName) throw httpError(400, "ACCOUNT_NAME_REQUIRED", "账号名称不能为空");
      account.updatedAt = now();
      audit(db, actor, "channel.account.update", { channelId, accountId });
      return { channel: publicChannel(channel), account: publicAccount(account) };
    });
  }

  function deleteAccount(channelId, accountId, actor = "demo-user") {
    return mutate((db) => {
      const channel = findChannel(db, channelId);
      if (!channel) throw httpError(404, "CHANNEL_NOT_FOUND", "渠道不存在");
      const records = Array.isArray(channel.accountRecords) ? channel.accountRecords : [];
      const index = records.findIndex((item) => item.id === accountId);
      if (index < 0) throw httpError(404, "ACCOUNT_NOT_FOUND", "账号不存在");
      const [account] = records.splice(index, 1);
      channel.accountRecords = records;
      channel.status = records.length ? "已接入" : channel.isOpen === false ? "开发中" : "未接入";
      channel.updatedAt = now();
      audit(db, actor, "channel.account.delete", { channelId, accountId });
      return { deleted: true, account: publicAccount(account), channel: publicChannel(channel) };
    });
  }

  function recordWebhook(provider, payload, headers = {}) {
    return mutate((db) => {
      const externalEventId = sanitize(payload.eventId || payload.id || payload.messageId || payload.msg_id) || hashPayload(payload);
      const duplicate = db.webhookEvents.find((event) => event.provider === provider && event.externalEventId === externalEventId);
      if (duplicate) return { accepted: true, duplicate: true, event: duplicate };
      const event = {
        id: createId("evt"),
        provider,
        externalEventId,
        eventType: sanitize(payload.type || payload.event || payload.message_type || "message"),
        payload,
        headerDigest: hashPayload(headers),
        status: "received",
        retryCount: 0,
        receivedAt: now(),
      };
      db.webhookEvents.push(event);
      audit(db, "webhook", "webhook.received", { provider, eventId: event.id, externalEventId });
      return { accepted: true, duplicate: false, event };
    });
  }

  function listWebhookEvents(provider) {
    const events = readDb().webhookEvents;
    return provider ? events.filter((event) => event.provider === provider) : events;
  }

  function getAuditLogs() {
    return readDb().auditLogs || [];
  }

  function reset() {
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    ensureDatabase();
    return readDb();
  }

  return {
    dbPath,
    ensureDatabase,
    listChannels,
    getChannel,
    connectChannel,
    testChannel,
    updateChannelStatus,
    updateAccount,
    deleteAccount,
    recordWebhook,
    listWebhookEvents,
    getAuditLogs,
    reset,
  };
}

function sanitize(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
}

function hashPayload(payload) {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function audit(db, actor, action, detail) {
  db.auditLogs = Array.isArray(db.auditLogs) ? db.auditLogs : [];
  db.auditLogs.push({
    id: createId("audit"),
    actor,
    action,
    detail,
    createdAt: new Date().toISOString(),
  });
}

function httpError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

module.exports = { createChannelStore, httpError };
