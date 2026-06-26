const fs = require("fs");
const path = require("path");

const currentAgentName = "Kelvin";
const defaultDataDir = path.join(__dirname, "..", ".jelly-data");
const storeFile = process.env.JELLY_CONVERSATIONS_STORE || path.join(defaultDataDir, "conversations-store.json");

const defaultCustomViews = [
  "未人工回复",
  "收藏",
  "小红书",
  "抖音",
  "公众号",
  "视频号/微信小店",
  "企业微信托管",
  "网站页面",
];

const defaultStore = {
  version: 1,
  tenants: [
    { id: "tenant-demo", name: "欧诚国际物流" },
  ],
  roles: [
    {
      id: "role-admin",
      name: "管理员",
      permissions: ["*"],
    },
    {
      id: "role-agent",
      name: "客服坐席",
      permissions: [
        "conversations:read",
        "conversations:message",
        "conversations:update",
        "conversations:assign",
        "quickReplies:manage",
      ],
    },
    {
      id: "role-viewer",
      name: "只读成员",
      permissions: ["conversations:read"],
    },
  ],
  users: [
    {
      id: "user-kelvin",
      username: "kelvin",
      password: "demo123",
      name: "Kelvin",
      tenantId: "tenant-demo",
      roleIds: ["role-admin"],
      agentName: "Kelvin",
    },
    {
      id: "user-canna",
      username: "canna",
      password: "demo123",
      name: "Canna",
      tenantId: "tenant-demo",
      roleIds: ["role-agent"],
      agentName: "Canna",
    },
    {
      id: "user-viewer",
      username: "viewer",
      password: "demo123",
      name: "Viewer",
      tenantId: "tenant-demo",
      roleIds: ["role-viewer"],
      agentName: "Viewer",
    },
  ],
  sessions: [],
  customViews: defaultCustomViews,
  quickMessages: {
    groups: [
      { id: "group-logistics", name: "物流报价" },
      { id: "group-service", name: "售后服务" },
    ],
    replies: [
      { id: "reply-price-info", groupId: "group-logistics", title: "报价信息收集", content: "请补充目的国家、城市、件数、重量和是否商业地址，我这边帮您核算报价。" },
      { id: "reply-sailing-time", groupId: "group-logistics", title: "海运时效说明", content: "欧洲海运普船正常开船后约 45 天左右派送，旺季或查验会有波动。" },
      { id: "reply-human-follow", groupId: "group-service", title: "人工跟进", content: "我已经为您转入人工客服，会继续跟进这个问题。" },
    ],
  },
  settings: {
    workHours: {
      enabled: false,
      schedules: [{ day: "周一至周五", ranges: [{ start: "09:00", end: "18:00" }] }],
      afterHoursAction: "A: 回复文本内容",
      afterHoursText: "抱歉，现在为非工作时间，请您在我们的工作时间再次联系，谢谢",
    },
    automation: {
      followUp: {
        enabled: true,
        minutes: 10,
        group: "全部对话",
        content: "您好，刚才的问题我还在这里，您可以继续补充信息。",
        stopOnReply: false,
        historyCount: 2,
      },
      closingReply: {
        enabled: false,
        workDelay: 10,
        offHoursDelay: 0,
        timeoutFlag: "显示“超时”标识",
        stopOnReply: false,
        historyCount: 2,
      },
      media: {
        enabled: true,
        image: true,
        video: true,
        file: true,
        audio: true,
        stopOnReply: false,
        historyCount: 2,
      },
      split: {
        enabled: false,
        maxChars: 300,
        maxMessages: 3,
        stopOnReply: false,
        historyCount: 2,
      },
      summary: {
        enabled: false,
        group: "请选择",
        minMessages: 4,
        prompt: "请总结客户诉求、报价信息、待跟进事项和下一步建议。",
        stopOnReply: false,
        historyCount: 2,
      },
    },
    forwarding: {
      enabled: false,
      channel: "企业微信群机器人",
      scope: "全部消息",
      webhook: "",
    },
  },
  conversations: [
    {
      id: "group",
      name: "欧诚国际物流&集简云对接群",
      avatar: "群",
      owner: "Kelvin",
      assignee: "Kelvin",
      type: "manual",
      assignedToMe: true,
      channel: "企业微信托管",
      channelIcon: "微",
      sourceName: "企业微信代运营",
      sourceId: "2aea37ed-7fb2",
      hostedAccountId: "1688855417782936",
      externalId: "R:10775840332412006",
      hosted: true,
      status: "解决中",
      statusColor: "orange",
      unread: true,
      updatedAt: "2026-06-26T09:46:00+08:00",
      starred: true,
      viewTags: ["企业微信托管", "收藏"],
      tags: ["高意向", "海运询价"],
      customer: {
        name: "欧诚国际物流&集简云对接群",
        remark: "欧洲海运报价群",
        phone: "13800138001",
        company: "欧诚国际物流",
        city: "深圳",
      },
      messages: [
        { id: "m-1", role: "customer", text: "@郑楚佳 促销-欧洲海运普船(卡派)时效", createdAt: "09:18" },
        {
          id: "m-2",
          role: "ai",
          text: "促销-欧洲海运普船(卡派)的派送时效为开船后45天左右。另外补充该渠道相关信息供你参考：可服务德国、法国、波兰等多个海外仓；仅接收普货；非亚马逊商业地址加收100RMB/票。",
          meta: "工具执行：1 次",
          createdAt: "09:19",
        },
        { id: "m-3", role: "customer", text: "给我一个总价 我的重量是 50kg", createdAt: "09:21" },
        {
          id: "m-4",
          role: "ai",
          text: "目前该渠道 50kg 普货可按实际重量计算，商业地址会有额外派送费用。若要核算最终报价，请补充派送国家、城市和件数。",
          meta: "工具执行：1 次",
          createdAt: "09:21",
        },
        { id: "m-5", role: "system", text: "已转入人工对话，操作人：Kelvin", createdAt: "09:22" },
        { id: "m-6", role: "me", text: "你好", createdAt: "09:24" },
      ],
    },
    {
      id: "canna",
      name: "Canna郑",
      avatar: "C",
      owner: "canna测试",
      assignee: "AI",
      type: "ai",
      assignedToMe: false,
      channel: "网站页面",
      channelIcon: "站",
      sourceName: "官网在线客服",
      sourceId: "web-7782",
      hostedAccountId: "-",
      externalId: "visitor-3902",
      hosted: false,
      status: "AI接待",
      statusColor: "green",
      unread: true,
      updatedAt: "2026-06-26T04:09:00+08:00",
      starred: false,
      viewTags: ["网站页面"],
      tags: ["报价咨询"],
      customer: {
        name: "Canna郑",
        remark: "官网访客",
        phone: "13900139002",
        company: "个人客户",
        city: "广州",
      },
      messages: [
        { id: "m-7", role: "customer", text: "你好，你们可以做德国海运吗？", createdAt: "03:58" },
        { id: "m-8", role: "ai", text: "您好，我可以为您解答物流相关的问题。德国海运可以做，请问货物重量、体积和目的城市是哪里？", meta: "命中：物流问答知识库", createdAt: "03:59" },
        { id: "m-9", role: "customer", text: "先给我一个 100kg 的参考价", createdAt: "04:09" },
      ],
    },
    {
      id: "demo",
      name: "演示联系人",
      avatar: "演",
      owner: "AI",
      assignee: "AI",
      type: "ai",
      assignedToMe: false,
      channel: "小红书",
      channelIcon: "小",
      sourceName: "小红书专业号私信",
      sourceId: "red-37003",
      hostedAccountId: "red-book-demo-01",
      externalId: "note-user-7003",
      hosted: true,
      status: "已解决",
      statusColor: "green",
      unread: false,
      updatedAt: "2026-06-25T21:02:00+08:00",
      starred: false,
      viewTags: ["小红书"],
      tags: ["演示预约"],
      customer: {
        name: "演示联系人",
        remark: "小红书潜客",
        phone: "13700137003",
        company: "跨境卖家",
        city: "杭州",
      },
      messages: [
        { id: "m-10", role: "customer", text: "想看一下你们的客服系统演示", createdAt: "20:48" },
        { id: "m-11", role: "ai", text: "好的，您可以点击链接预约演示，咨询报价也可以直接在这里留言。", meta: "AI 自动回复", createdAt: "20:49" },
        { id: "m-12", role: "system", text: "会话已由 AI 标记为已解决", createdAt: "21:02" },
      ],
    },
    {
      id: "douyin",
      name: "抖音用户 8821",
      avatar: "抖",
      owner: "Kelvin",
      assignee: "Kelvin",
      type: "manual",
      assignedToMe: true,
      channel: "抖音",
      channelIcon: "抖",
      sourceName: "抖音企业号私信",
      sourceId: "dy-8821",
      hostedAccountId: "douyin-demo-01",
      externalId: "dy-user-8821",
      hosted: true,
      status: "待跟进",
      statusColor: "orange",
      unread: true,
      updatedAt: "2026-06-26T10:38:00+08:00",
      starred: false,
      viewTags: ["抖音", "未人工回复"],
      tags: ["待报价"],
      customer: {
        name: "抖音用户 8821",
        remark: "短视频私信",
        phone: "13600136004",
        company: "直播电商",
        city: "义乌",
      },
      messages: [
        { id: "m-13", role: "customer", text: "我有一批货要发法国，能报个价吗", createdAt: "10:36" },
        { id: "m-14", role: "system", text: "命中转人工意图：询价", createdAt: "10:37" },
      ],
    },
  ],
  auditLogs: [],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureStoreFile() {
  fs.mkdirSync(path.dirname(storeFile), { recursive: true });
  if (!fs.existsSync(storeFile)) {
    fs.writeFileSync(storeFile, JSON.stringify(defaultStore, null, 2));
  }
}

function normalizeStore(store) {
  const next = store && typeof store === "object" ? store : {};
  next.version = 1;
  next.tenants = Array.isArray(next.tenants) && next.tenants.length ? next.tenants : clone(defaultStore.tenants);
  next.roles = Array.isArray(next.roles) && next.roles.length ? next.roles : clone(defaultStore.roles);
  next.users = Array.isArray(next.users) && next.users.length ? next.users : clone(defaultStore.users);
  next.sessions = Array.isArray(next.sessions) ? next.sessions.filter((session) => new Date(session.expiresAt).getTime() > Date.now()) : [];
  next.customViews = Array.isArray(next.customViews) && next.customViews.length ? next.customViews : clone(defaultStore.customViews);
  next.quickMessages = next.quickMessages && typeof next.quickMessages === "object" ? next.quickMessages : clone(defaultStore.quickMessages);
  next.quickMessages.groups = Array.isArray(next.quickMessages.groups) ? next.quickMessages.groups : [];
  next.quickMessages.replies = Array.isArray(next.quickMessages.replies) ? next.quickMessages.replies : [];
  next.settings = next.settings && typeof next.settings === "object" ? next.settings : {};
  next.settings.workHours = merge(defaultStore.settings.workHours, next.settings.workHours || {});
  next.settings.automation = merge(defaultStore.settings.automation, next.settings.automation || {});
  next.settings.forwarding = merge(defaultStore.settings.forwarding, next.settings.forwarding || {});
  next.conversations = Array.isArray(next.conversations) && next.conversations.length ? next.conversations : clone(defaultStore.conversations);
  next.conversations.forEach((conversation) => {
    conversation.tenantId = conversation.tenantId || "tenant-demo";
    conversation.messages = Array.isArray(conversation.messages) ? conversation.messages : [];
    conversation.notes = Array.isArray(conversation.notes) ? conversation.notes : [];
    conversation.members = Array.isArray(conversation.members) ? conversation.members : [];
    conversation.viewTags = Array.isArray(conversation.viewTags) ? conversation.viewTags : [];
    conversation.tags = Array.isArray(conversation.tags) ? conversation.tags : [];
  });
  next.auditLogs = Array.isArray(next.auditLogs) ? next.auditLogs : [];
  return next;
}

function merge(base, patch) {
  if (!patch || typeof patch !== "object") return clone(base);
  const next = Array.isArray(base) ? [...base] : { ...base };
  Object.entries(patch).forEach(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value) && base[key] && typeof base[key] === "object" && !Array.isArray(base[key])) {
      next[key] = merge(base[key], value);
      return;
    }
    next[key] = value;
  });
  return next;
}

function readStore() {
  ensureStoreFile();
  const raw = fs.readFileSync(storeFile, "utf8");
  return normalizeStore(JSON.parse(raw));
}

function writeStore(store) {
  const normalized = normalizeStore(store);
  const tempFile = `${storeFile}.${process.pid}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(normalized, null, 2));
  fs.renameSync(tempFile, storeFile);
  return normalized;
}

function withStore(mutator) {
  const store = readStore();
  const result = mutator(store);
  const saved = writeStore(store);
  return { store: saved, result };
}

module.exports = {
  currentAgentName,
  defaultCustomViews,
  readStore,
  writeStore,
  withStore,
  clone,
  storeFile,
};
