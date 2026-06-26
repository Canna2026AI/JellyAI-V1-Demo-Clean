const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const DEFAULT_TENANT_ID = "tenant-demo";
const DEFAULT_USER_ID = "user-admin";

function clone(value) {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value));
}

function nowDate() {
  return new Date().toISOString().slice(0, 10);
}

function nowLabel() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, expected] = String(stored || "").split(":");
  if (!salt || !expected) return false;
  const actual = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

function loadBrowserMockSeed(rootDir) {
  const mockPath = path.join(rootDir, "services/mock/wecomMock.js");
  const code = fs.readFileSync(mockPath, "utf8");
  const context = { window: {}, console };
  vm.runInNewContext(code, context, { filename: mockPath });
  if (!context.window.wecomMock) throw new Error("Failed to load WeCom browser mock seed");
  return context.window.wecomMock.cloneInitialState();
}

function createInitialDatabase(rootDir, env = process.env) {
  const seed = loadBrowserMockSeed(rootDir);
  const adminEmail = env.JELLY_ADMIN_EMAIL || "admin@jelly.local";
  const adminPassword = env.JELLY_ADMIN_PASSWORD || "jelly-demo-2026";
  return {
    version: 1,
    tenants: [{ id: DEFAULT_TENANT_ID, name: "欧诚国际物流", createdAt: new Date().toISOString() }],
    users: [
      {
        id: DEFAULT_USER_ID,
        tenantId: DEFAULT_TENANT_ID,
        email: adminEmail,
        name: "Kelvin",
        role: "admin",
        passwordHash: hashPassword(adminPassword),
        createdAt: new Date().toISOString(),
      },
    ],
    sessions: [],
    assistants: seed.assistants,
    accountGroups: seed.accountGroups,
    contacts: seed.contacts.map((item) => ({ ...item, tenantId: DEFAULT_TENANT_ID })),
    teamMembers: seed.teamMembers.map((item) => ({ ...item, tenantId: DEFAULT_TENANT_ID })),
    accounts: seed.accounts.map((item) => ({ ...item, tenantId: DEFAULT_TENANT_ID })),
    rules: seed.rules.map((item) => ({ ...item, tenantId: DEFAULT_TENANT_ID })),
    advancedSettings: { [DEFAULT_TENANT_ID]: seed.advancedSettings },
    sidebarMenus: { [DEFAULT_TENANT_ID]: ["客户资料", "订单查询", "物流报价", "售后工单"] },
    selectedMemberIds: { gs4758: ["member-owner"] },
    groups: seed.groups.map((item) => ({ ...item, tenantId: DEFAULT_TENANT_ID })),
    logs: seed.logs.map((item) => ({ ...item, tenantId: DEFAULT_TENANT_ID })),
    consoleTasks: [],
    auditLogs: [],
    webhookEvents: [],
    exports: [],
  };
}

class WecomStore {
  constructor({ rootDir, dataFile, env = process.env }) {
    this.rootDir = rootDir;
    this.dataFile = dataFile;
    this.env = env;
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    this.data = this.load();
  }

  load() {
    if (!fs.existsSync(this.dataFile)) {
      const initial = createInitialDatabase(this.rootDir, this.env);
      this.write(initial);
      return initial;
    }
    const raw = fs.readFileSync(this.dataFile, "utf8");
    const data = JSON.parse(raw);
    this.normalize(data);
    return data;
  }

  normalize(data) {
    data.sessions ||= [];
    data.consoleTasks ||= [];
    data.auditLogs ||= [];
    data.webhookEvents ||= [];
    data.exports ||= [];
    data.sidebarMenus ||= { [DEFAULT_TENANT_ID]: ["客户资料", "订单查询", "物流报价", "售后工单"] };
    data.selectedMemberIds ||= { gs4758: ["member-owner"] };
  }

  write(data = this.data) {
    const tmp = `${this.dataFile}.tmp`;
    fs.writeFileSync(tmp, `${JSON.stringify(data, null, 2)}\n`);
    fs.renameSync(tmp, this.dataFile);
  }

  save() {
    this.write();
  }

  tenantId(user) {
    return user?.tenantId || DEFAULT_TENANT_ID;
  }

  publicUser(user) {
    if (!user) return null;
    const { passwordHash, ...safe } = user;
    return safe;
  }

  login(email, password, meta = {}) {
    const user = this.data.users.find((item) => item.email === email);
    if (!user || !verifyPassword(password, user.passwordHash)) return null;
    const session = {
      id: crypto.randomBytes(24).toString("hex"),
      userId: user.id,
      tenantId: user.tenantId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      ...meta,
    };
    this.data.sessions.push(session);
    this.addAudit(user, "登录", "auth", email);
    this.save();
    return { session, user: this.publicUser(user) };
  }

  getUserBySession(sessionId) {
    if (!sessionId) return null;
    const session = this.data.sessions.find((item) => item.id === sessionId && item.expiresAt > new Date().toISOString());
    if (!session) return null;
    return this.data.users.find((item) => item.id === session.userId) || null;
  }

  getDefaultUser() {
    return this.data.users[0] || null;
  }

  logout(sessionId, user) {
    this.data.sessions = this.data.sessions.filter((item) => item.id !== sessionId);
    if (user) this.addAudit(user, "退出登录", "auth", user.email);
    this.save();
  }

  permissionsFor(user) {
    const role = user?.role || "viewer";
    const all = ["wecom:read", "wecom:write", "wecom:send", "wecom:export", "wecom:admin", "audit:read"];
    const readonly = ["wecom:read"];
    return {
      role,
      permissions: role === "admin" ? all : readonly,
      tenantId: this.tenantId(user),
    };
  }

  scoped(items, user) {
    const tenantId = this.tenantId(user);
    return items.filter((item) => !item.tenantId || item.tenantId === tenantId);
  }

  bootstrap(user) {
    const tenantId = this.tenantId(user);
    return {
      assistants: clone(this.data.assistants),
      accountGroups: clone(this.data.accountGroups),
      contacts: clone(this.scoped(this.data.contacts, user)),
      teamMembers: clone(this.scoped(this.data.teamMembers, user)),
      accounts: clone(this.scoped(this.data.accounts, user)),
      rules: clone(this.scoped(this.data.rules, user)),
      advancedSettings: clone(this.data.advancedSettings[tenantId]),
      sidebarMenus: clone(this.data.sidebarMenus[tenantId] || []),
      selectedMemberIds: clone(this.data.selectedMemberIds.gs4758 || []),
      groups: clone(this.scoped(this.data.groups, user)),
      logs: clone(this.scoped(this.data.logs, user)),
      consoleTasks: clone(this.scoped(this.data.consoleTasks, user)),
    };
  }

  accountStats(user) {
    const rows = this.scoped(this.data.accounts, user);
    return {
      online: rows.filter((item) => item.status === "在线").length,
      offline: rows.filter((item) => item.status === "离线").length,
      starting: rows.filter((item) => item.status === "初始化中").length,
      error: rows.filter((item) => item.status === "异常").length,
      total: rows.length,
    };
  }

  listAccounts(user, filters = {}) {
    const query = String(filters.query || "").trim().toLowerCase();
    let rows = this.scoped(this.data.accounts, user).filter((account) => {
      const text = [account.name, account.alias, account.id, account.accountId, account.instanceId, account.subject, account.owner].join(" ").toLowerCase();
      const matchesQuery = !query || text.includes(query);
      const matchesStatus = !filters.status || filters.status === "全部状态" || account.status === filters.status;
      const matchesGroup = !filters.group || filters.group === "全部小组" || account.group === filters.group;
      const matchesAssistant = !filters.assistant || filters.assistant === "全部助手" || account.assistant === filters.assistant;
      return matchesQuery && matchesStatus && matchesGroup && matchesAssistant;
    });
    const pageSize = Number(filters.pageSize) || 50;
    const page = Math.max(1, Number(filters.page) || 1);
    const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
    const total = rows.length;
    rows = rows.slice((page - 1) * pageSize, page * pageSize);
    return { items: clone(rows), total, page, pageSize, pageCount };
  }

  getAccount(user, id) {
    return clone(this.scoped(this.data.accounts, user).find((item) => item.id === id));
  }

  saveAccount(user, payload, id = null) {
    const tenantId = this.tenantId(user);
    let account = id ? this.data.accounts.find((item) => item.id === id && item.tenantId === tenantId) : null;
    if (id && !account) return null;
    if (!account) {
      account = {
        id: String(8020 + this.scoped(this.data.accounts, user).length + 1),
        tenantId,
        avatar: "企",
        accountId: `WeCom-${Date.now().toString().slice(-5)}`,
        instanceId: `managed-${Date.now()}`,
        status: "待扫码",
        heartbeat: "-",
        messageEnabled: false,
        aiEnabled: false,
        lastAction: "新建托管账号",
      };
      this.data.accounts.unshift(account);
    }
    Object.assign(account, payload, { tenantId });
    this.addLog(user, {
      operation: id ? "编辑托管账号" : "新增托管账号",
      accountId: account.id,
      target: account.name,
      content: `${account.name || "-"} / ${account.group || "-"}`,
      reply: `绑定助手：${account.assistant || "-"}`,
      detail: "账号配置已保存",
    });
    this.addAudit(user, id ? "编辑托管账号" : "新增托管账号", "wecom_account", account.id);
    this.save();
    return clone(account);
  }

  deleteAccount(user, id) {
    const tenantId = this.tenantId(user);
    const account = this.data.accounts.find((item) => item.id === id && item.tenantId === tenantId);
    if (!account) return null;
    this.data.accounts = this.data.accounts.filter((item) => item !== account);
    this.data.rules.forEach((rule) => {
      if (rule.accountId === id && rule.tenantId === tenantId) rule.enabled = false;
    });
    this.addLog(user, {
      operation: "删除托管账号",
      accountId: id,
      target: account.name,
      content: "删除账号",
      reply: "相关规则已停用",
      detail: "删除完成",
    });
    this.addAudit(user, "删除托管账号", "wecom_account", id);
    this.save();
    return clone(account);
  }

  updateAccountStatus(user, id, status) {
    const account = this.data.accounts.find((item) => item.id === id && item.tenantId === this.tenantId(user));
    if (!account) return null;
    account.status = status;
    account.heartbeat = status === "在线" ? "刚刚" : status === "暂停" ? "已暂停" : status === "待扫码" ? "-" : "处理中";
    account.lastAction = status === "在线" ? "托管实例在线" : `状态变更：${status}`;
    this.addLog(user, {
      operation: "账号状态变更",
      accountId: id,
      target: account.name,
      content: `状态切换为 ${status}`,
      reply: "状态更新完成",
      detail: account.lastAction,
    });
    this.addAudit(user, `账号${status}`, "wecom_account", id);
    this.save();
    return clone(account);
  }

  patchAccount(user, id, patch) {
    const account = this.data.accounts.find((item) => item.id === id && item.tenantId === this.tenantId(user));
    if (!account) return null;
    Object.assign(account, patch);
    this.addAudit(user, "更新托管账号字段", "wecom_account", id);
    this.save();
    return clone(account);
  }

  listRules(user) {
    return clone(this.scoped(this.data.rules, user));
  }

  getRule(user, id) {
    return clone(this.scoped(this.data.rules, user).find((item) => item.id === id));
  }

  saveRule(user, payload, id = null) {
    const tenantId = this.tenantId(user);
    let rule = id ? this.data.rules.find((item) => item.id === id && item.tenantId === tenantId) : null;
    if (id && !rule) return null;
    if (!rule) {
      rule = { id: makeId("rule"), tenantId, messageEnabled: true, aiEnabled: true, enabled: true };
      this.data.rules.unshift(rule);
    }
    Object.assign(rule, payload, { tenantId, maxReplies: Number(payload.maxReplies) || 1 });
    this.addLog(user, {
      operation: id ? "编辑聚合规则" : "新增聚合规则",
      accountId: rule.accountId,
      target: rule.name,
      type: rule.replyScope === "私聊" ? "私聊" : "群聊",
      content: rule.keywords,
      reply: `绑定 ${rule.assistant}`,
      detail: `最大回复 ${rule.maxReplies} 次`,
    });
    this.addAudit(user, id ? "编辑聚合规则" : "新增聚合规则", "wecom_rule", rule.id);
    this.save();
    return clone(rule);
  }

  deleteRule(user, id) {
    const tenantId = this.tenantId(user);
    const rule = this.data.rules.find((item) => item.id === id && item.tenantId === tenantId);
    if (!rule) return null;
    this.data.rules = this.data.rules.filter((item) => item !== rule);
    this.addLog(user, { operation: "删除聚合规则", accountId: rule.accountId, target: rule.name, content: "删除规则", reply: "删除完成", detail: "规则已移除" });
    this.addAudit(user, "删除聚合规则", "wecom_rule", id);
    this.save();
    return clone(rule);
  }

  toggleRule(user, id, field, value = undefined) {
    const rule = this.data.rules.find((item) => item.id === id && item.tenantId === this.tenantId(user));
    if (!rule) return null;
    rule[field] = typeof value === "boolean" ? value : !rule[field];
    this.addAudit(user, "切换聚合规则", "wecom_rule", id);
    this.save();
    return clone(rule);
  }

  getSettings(user) {
    return clone(this.data.advancedSettings[this.tenantId(user)]);
  }

  patchSettings(user, patch) {
    const tenantId = this.tenantId(user);
    this.data.advancedSettings[tenantId] = { ...this.data.advancedSettings[tenantId], ...patch };
    this.addLog(user, { operation: "保存高级设置", content: this.data.advancedSettings[tenantId].keywords, reply: this.data.advancedSettings[tenantId].triggerMode, detail: "高级设置已保存" });
    this.addAudit(user, "保存高级设置", "wecom_settings", tenantId);
    this.save();
    return this.getSettings(user);
  }

  resetSettings(user) {
    const seed = loadBrowserMockSeed(this.rootDir);
    this.data.advancedSettings[this.tenantId(user)] = seed.advancedSettings;
    this.addLog(user, { operation: "恢复高级设置", content: "恢复默认设置", reply: "默认值已应用", detail: "高级设置" });
    this.addAudit(user, "恢复高级设置", "wecom_settings", this.tenantId(user));
    this.save();
    return this.getSettings(user);
  }

  getSidebar(user) {
    return clone(this.data.sidebarMenus[this.tenantId(user)] || []);
  }

  saveSidebar(user, menus) {
    this.data.sidebarMenus[this.tenantId(user)] = menus;
    this.addLog(user, { operation: "保存自定义侧边栏", target: "企业微信侧边栏", content: menus.join(", "), reply: "侧边栏配置已保存", detail: "侧边栏" });
    this.addAudit(user, "保存自定义侧边栏", "wecom_sidebar", this.tenantId(user));
    this.save();
    return this.getSidebar(user);
  }

  listGroups(user, query = "") {
    const normalized = String(query || "").trim().toLowerCase();
    return clone(this.scoped(this.data.groups, user).filter((group) => !normalized || [group.name, group.id, group.owner, group.lastMessage].join(" ").toLowerCase().includes(normalized)));
  }

  getGroup(user, id) {
    return clone(this.scoped(this.data.groups, user).find((item) => item.id === id));
  }

  patchGroup(user, id, patch) {
    const group = this.data.groups.find((item) => item.id === id && item.tenantId === this.tenantId(user));
    if (!group) return null;
    Object.assign(group, patch);
    this.addAudit(user, "更新群聊", "wecom_group", id);
    this.save();
    return clone(group);
  }

  syncGroups(user, remoteGroups = null) {
    const tenantId = this.tenantId(user);
    let added = 0;
    if (Array.isArray(remoteGroups) && remoteGroups.length) {
      for (const remote of remoteGroups) {
        if (!this.data.groups.some((group) => group.id === remote.id && group.tenantId === tenantId)) {
          this.data.groups.push({ ...remote, tenantId });
          added += 1;
        }
      }
    } else if (!this.data.groups.some((group) => group.id === "R:107758403324124" && group.tenantId === tenantId)) {
      this.data.groups.push({
        id: "R:107758403324124",
        tenantId,
        name: "新同步客户咨询群",
        accountId: "8018",
        owner: "Kelvin",
        members: 9,
        aiEnabled: false,
        messageEnabled: true,
        lockName: false,
        blockAddFriend: false,
        lastMessage: "刚同步到后台",
      });
      added = 1;
    }
    this.addLog(user, { operation: "同步群聊", accountId: "8018", target: "企业微信群", type: "群聊", content: "同步群列表", reply: added ? `新增 ${added} 个群聊` : "群列表已是最新", detail: "同步完成" });
    this.addAudit(user, "同步群聊", "wecom_group", "sync");
    this.save();
    return { added, groups: this.listGroups(user) };
  }

  listTeamMembers(user, query = "") {
    const normalized = String(query || "").trim().toLowerCase();
    return clone(this.scoped(this.data.teamMembers, user).filter((member) => !normalized || [member.name, member.role, member.status].join(" ").toLowerCase().includes(normalized)));
  }

  saveTeamMembers(user, groupId, memberIds) {
    this.data.selectedMemberIds[groupId] = Array.isArray(memberIds) ? memberIds : [];
    const selected = this.data.teamMembers.filter((member) => this.data.selectedMemberIds[groupId].includes(member.id));
    this.addLog(user, { operation: "更新小组成员", target: groupId, type: "群聊", content: selected.map((member) => member.name).join(", ") || "未选择成员", reply: `已保存 ${selected.length} 个成员`, detail: "小组成员配置" });
    this.addAudit(user, "更新小组成员", "wecom_account_group", groupId);
    this.save();
    return { groupId, memberIds: clone(this.data.selectedMemberIds[groupId]), count: selected.length };
  }

  listLogs(user, filters = {}) {
    const rows = this.scoped(this.data.logs, user).filter((log) => {
      const account = this.data.accounts.find((item) => item.id === log.accountId);
      const contentQuery = String(filters.query || "").trim();
      const targetQuery = String(filters.target || "").trim();
      const matchesContent = !contentQuery || [log.content, log.reply, log.detail].join(" ").includes(contentQuery);
      const matchesTarget = !targetQuery || String(log.target || "").includes(targetQuery);
      const matchesType = !filters.type || filters.type === "全部类型" || log.type === filters.type;
      const matchesAccount = !filters.account || filters.account === "全部账号" || account?.name === filters.account;
      const matchesGroup = !filters.group || filters.group === "全部群聊" || log.groupId === filters.group;
      const afterStart = !filters.dateStart || log.date >= filters.dateStart;
      const beforeEnd = !filters.dateEnd || log.date <= filters.dateEnd;
      return matchesContent && matchesTarget && matchesType && matchesAccount && matchesGroup && afterStart && beforeEnd;
    });
    return clone(rows);
  }

  exportLogs(user, filters = {}) {
    const rows = this.listLogs(user, filters);
    const exportId = makeId("export");
    const record = { id: exportId, tenantId: this.tenantId(user), createdAt: new Date().toISOString(), count: rows.length, filters };
    this.data.exports.unshift(record);
    this.addLog(user, { operation: "导出对话记录", content: "CSV 导出", reply: `${nowLabel()} 导出 ${rows.length} 条记录`, detail: exportId });
    this.addAudit(user, "导出对话记录", "wecom_export", exportId);
    this.save();
    return { export: record, rows };
  }

  addLog(user, partial) {
    const tenantId = this.tenantId(user);
    const log = {
      id: makeId("log"),
      tenantId,
      date: nowDate(),
      time: nowLabel(),
      operator: user?.name || "系统",
      operation: "后台操作",
      accountId: this.scoped(this.data.accounts, user)[0]?.id || "",
      groupId: "",
      target: "-",
      type: "私聊",
      content: "-",
      reply: "-",
      status: "成功",
      detail: "操作记录",
      ...partial,
    };
    this.data.logs.unshift(log);
    return log;
  }

  addAudit(user, action, resourceType, resourceId, extra = {}) {
    const audit = {
      id: makeId("audit"),
      tenantId: this.tenantId(user),
      userId: user?.id || "system",
      userName: user?.name || "系统",
      action,
      resourceType,
      resourceId,
      createdAt: new Date().toISOString(),
      ...extra,
    };
    this.data.auditLogs.unshift(audit);
    return audit;
  }

  listAuditLogs(user) {
    return clone(this.scoped(this.data.auditLogs, user));
  }

  createConsoleTask(user, action, payload, providerResult = {}) {
    const account = this.scoped(this.data.accounts, user).find((item) => item.id === payload.accountId) || this.scoped(this.data.accounts, user)[0];
    const task = {
      id: makeId("task"),
      tenantId: this.tenantId(user),
      action,
      status: providerResult.status || "succeeded",
      accountId: account?.id || "",
      targetType: payload.targetType || "群聊",
      targetId: payload.targetId || "",
      targetName: payload.targetName || payload.targetId || "-",
      message: payload.message || "",
      provider: providerResult.provider || "local",
      providerRequestId: providerResult.requestId || "",
      error: providerResult.error || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.applyConsoleMutation(user, task);
    this.data.consoleTasks.unshift(task);
    this.addLog(user, {
      operator: user?.name || "后台",
      operation: action,
      accountId: account?.id || "",
      groupId: task.targetType === "群聊" ? task.targetId : "",
      target: task.targetName,
      type: task.targetType,
      content: task.message || action,
      reply: `控制台任务 ${task.id} ${task.status === "succeeded" ? "执行成功" : "已提交"}`,
      status: task.status === "failed" ? "失败" : "成功",
      detail: task.error || task.id,
    });
    this.addAudit(user, action, "wecom_console_task", task.id);
    this.save();
    return clone(task);
  }

  applyConsoleMutation(user, task) {
    const tenantId = this.tenantId(user);
    const group = this.data.groups.find((item) => item.id === task.targetId && item.tenantId === tenantId);
    const account = this.data.accounts.find((item) => item.id === task.accountId && item.tenantId === tenantId);
    if (task.action === "创建群聊") {
      this.data.groups.unshift({
        id: `R:${Date.now().toString().slice(-12)}`,
        tenantId,
        name: task.message || "新建客户服务群",
        accountId: account?.id || "",
        owner: account?.owner || user?.name || "Kelvin",
        members: 1,
        aiEnabled: false,
        messageEnabled: true,
        lockName: false,
        blockAddFriend: false,
        lastMessage: "控制台创建群聊",
      });
    }
    if (group && task.action === "拉人进群") group.members += 1;
    if (group && task.action === "修改群名称" && task.message) group.name = task.message.slice(0, 32);
    if (group) group.lastMessage = task.message || task.action;
  }

  getTask(user, id) {
    return clone(this.scoped(this.data.consoleTasks, user).find((item) => item.id === id));
  }

  listTasks(user) {
    return clone(this.scoped(this.data.consoleTasks, user));
  }

  cancelTask(user, id) {
    const task = this.data.consoleTasks.find((item) => item.id === id && item.tenantId === this.tenantId(user));
    if (!task) return null;
    if (task.status === "queued" || task.status === "running") {
      task.status = "cancelled";
      task.updatedAt = new Date().toISOString();
    }
    this.addAudit(user, "取消控制台任务", "wecom_console_task", id);
    this.save();
    return clone(task);
  }

  saveWebhookEvent(user, payload) {
    const event = {
      id: makeId("webhook"),
      tenantId: this.tenantId(user),
      receivedAt: new Date().toISOString(),
      payload,
    };
    this.data.webhookEvents.unshift(event);
    this.addAudit(user, "接收企业微信回调", "wecom_webhook", event.id);
    this.save();
    return clone(event);
  }
}

module.exports = {
  DEFAULT_TENANT_ID,
  DEFAULT_USER_ID,
  WecomStore,
  clone,
  createInitialDatabase,
  hashPassword,
  nowLabel,
};
