// Conversation helper data plus module-local mock persistence.

const conversationFilters = [
  "全部对话",
  "人工对话",
  "AI对话",
  "指给我的",
];

const defaultCustomConversationViews = [
  "未人工回复",
  "收藏",
  "小红书",
  "抖音",
  "公众号",
  "视频号/微信小店",
  "企业微信托管",
  "网站页面",
];

const customViewStorageKey = "jelly-ai-custom-conversation-views";
const quickMessageStorageKey = "jelly-ai-quick-messages";
const conversationStorageKey = "jelly-ai-conversations";
const workHoursStorageKey = "jelly-ai-conversation-work-hours";
const automationSettingsStorageKey = "jelly-ai-conversation-automation-settings";
const forwardSettingsStorageKey = "jelly-ai-conversation-forward-settings";
const aiReplyCancelStorageKey = "jelly-ai-conversation-ai-reply-cancelled";

const currentAgentName = "Kelvin";
const aiReplyTimers = {};
const aiReplyCancelled = new Set(readJsonStorage(aiReplyCancelStorageKey, []));

const defaultQuickMessageData = {
  groups: [
    { id: "group-logistics", name: "物流报价" },
    { id: "group-service", name: "售后服务" },
  ],
  replies: [
    { id: "reply-price-info", groupId: "group-logistics", title: "报价信息收集", content: "请补充目的国家、城市、件数、重量和是否商业地址，我这边帮您核算报价。" },
    { id: "reply-sailing-time", groupId: "group-logistics", title: "海运时效说明", content: "欧洲海运普船正常开船后约 45 天左右派送，旺季或查验会有波动。" },
    { id: "reply-human-follow", groupId: "group-service", title: "人工跟进", content: "我已经为您转入人工客服，会继续跟进这个问题。" },
  ],
};

const defaultConversationData = [
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
    members: [
      { id: "gm-kelvin", name: "Kelvin", avatar: "K", role: "群主", company: "JellyAI", phone: "13828821846", city: "深圳", remark: "当前跟进人", tags: ["内部坐席"], lastActive: "刚刚" },
      { id: "gm-canna", name: "Canna郑", avatar: "C", role: "客户", company: "欧诚国际物流", phone: "13900139002", city: "广州", remark: "海运报价需求", tags: ["高意向", "海运询价"], lastActive: "3分钟前" },
      { id: "gm-wang", name: "王丽", avatar: "王", role: "客户", company: "集简云", phone: "13700137003", city: "杭州", remark: "对接负责人", tags: ["系统对接"], lastActive: "12分钟前" },
      { id: "gm-liu", name: "刘浩", avatar: "刘", role: "客户", company: "欧诚国际物流", phone: "13600136004", city: "义乌", remark: "价格确认", tags: ["待报价"], lastActive: "1小时前" },
      { id: "gm-ai", name: "物流客服助手", avatar: "AI", role: "AI助手", company: "JellyAI", phone: "-", city: "云端", remark: "自动回复物流问题", tags: ["AI接待"], lastActive: "在线" },
    ],
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
    members: [
      { id: "canna-visitor", name: "Canna郑", avatar: "C", role: "访客", company: "个人客户", phone: "13900139002", city: "广州", remark: "官网报价咨询", tags: ["报价咨询"], lastActive: "刚刚" },
      { id: "canna-ai", name: "物流客服助手", avatar: "AI", role: "AI助手", company: "JellyAI", phone: "-", city: "云端", remark: "正在接待该访客", tags: ["AI接待"], lastActive: "在线" },
    ],
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
    members: [
      { id: "demo-contact", name: "演示联系人", avatar: "演", role: "客户", company: "跨境卖家", phone: "13700137003", city: "杭州", remark: "预约演示", tags: ["演示预约"], lastActive: "昨天" },
      { id: "demo-ai", name: "演示助手", avatar: "AI", role: "AI助手", company: "JellyAI", phone: "-", city: "云端", remark: "已完成自动接待", tags: ["已解决"], lastActive: "昨天" },
    ],
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
    members: [
      { id: "dy-8821", name: "抖音用户 8821", avatar: "抖", role: "客户", company: "直播电商", phone: "13600136004", city: "义乌", remark: "法国发货询价", tags: ["待报价"], lastActive: "1分钟前" },
      { id: "dy-kelvin", name: "Kelvin", avatar: "K", role: "坐席", company: "JellyAI", phone: "13828821846", city: "深圳", remark: "当前人工跟进", tags: ["内部坐席"], lastActive: "在线" },
    ],
    messages: [
      { id: "m-13", role: "customer", text: "我有一批货要发法国，能报个价吗", createdAt: "10:36" },
      { id: "m-14", role: "system", text: "命中转人工意图：询价", createdAt: "10:37" },
    ],
  },
];

const defaultWorkHours = {
  enabled: false,
  schedules: [{ day: "周一至周五", ranges: [{ start: "09:00", end: "18:00" }] }],
  afterHoursAction: "A: 回复文本内容",
  afterHoursText: "抱歉，现在为非工作时间，请您在我们的工作时间再次联系，谢谢",
};

const defaultAutomationSettings = {
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
};

const defaultForwardSettings = {
  enabled: false,
  channel: "企业微信群机器人",
  scope: "全部消息",
  webhook: "",
};

function loadCustomConversationViews() {
  const savedViews = readJsonStorage(customViewStorageKey, []);
  return Array.isArray(savedViews)
    ? [...defaultCustomConversationViews, ...savedViews.filter((name) => typeof name === "string" && !defaultCustomConversationViews.includes(name))]
    : [...defaultCustomConversationViews];
}

function saveCustomConversationViews(views) {
  const createdViews = views.filter((name) => !defaultCustomConversationViews.includes(name));
  writeJsonStorage(customViewStorageKey, createdViews);
  syncConversationBackend(window.conversationService?.saveCustomViews(views));
}

function loadQuickMessageData() {
  const saved = readJsonStorage(quickMessageStorageKey, null);
  if (!saved || (!Array.isArray(saved.groups) && !Array.isArray(saved.replies))) {
    return structuredClone(defaultQuickMessageData);
  }
  if (Array.isArray(saved.groups) && Array.isArray(saved.replies) && !saved.groups.length && !saved.replies.length) {
    return structuredClone(defaultQuickMessageData);
  }
  return {
    groups: Array.isArray(saved.groups) ? saved.groups : structuredClone(defaultQuickMessageData.groups),
    replies: Array.isArray(saved.replies) ? saved.replies : structuredClone(defaultQuickMessageData.replies),
  };
}

function saveQuickMessageData() {
  writeJsonStorage(quickMessageStorageKey, quickMessageData);
  syncConversationBackend(window.conversationService?.saveQuickMessages(quickMessageData));
}

function loadConversationData() {
  const saved = readJsonStorage(conversationStorageKey, null);
  return Array.isArray(saved) && saved.length ? saved : structuredClone(defaultConversationData);
}

function saveConversationData(options = {}) {
  writeJsonStorage(conversationStorageKey, conversationData);
  if (!options.skipBackendBulk) syncConversationBackend(window.conversationService?.saveConversations(conversationData));
}

function loadWorkHoursSettings() {
  const saved = readJsonStorage(workHoursStorageKey, null);
  if (!saved) return structuredClone(defaultWorkHours);
  return {
    enabled: Boolean(saved.enabled),
    schedules: Array.isArray(saved.schedules) && saved.schedules.length ? saved.schedules : structuredClone(defaultWorkHours.schedules),
    afterHoursAction: saved.afterHoursAction || defaultWorkHours.afterHoursAction,
    afterHoursText: saved.afterHoursText || defaultWorkHours.afterHoursText,
  };
}

function saveWorkHoursSettings() {
  writeJsonStorage(workHoursStorageKey, workHoursSettings);
  syncConversationBackend(window.conversationService?.saveWorkHours(workHoursSettings));
}

function loadAutomationSettings() {
  const saved = readJsonStorage(automationSettingsStorageKey, null);
  return mergePlainObject(defaultAutomationSettings, saved || {});
}

function saveAutomationSettings() {
  writeJsonStorage(automationSettingsStorageKey, automationSettings);
  syncConversationBackend(window.conversationService?.saveAutomation(automationSettings));
}

function loadForwardSettings() {
  const saved = readJsonStorage(forwardSettingsStorageKey, null);
  return mergePlainObject(defaultForwardSettings, saved || {});
}

function saveForwardSettings() {
  writeJsonStorage(forwardSettingsStorageKey, forwardSettings);
  syncConversationBackend(window.conversationService?.saveForwarding(forwardSettings));
}

function mergePlainObject(base, patch) {
  if (!patch || typeof patch !== "object") return structuredClone(base);
  const next = Array.isArray(base) ? [...base] : { ...base };
  Object.entries(patch).forEach(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value) && base[key] && typeof base[key] === "object" && !Array.isArray(base[key])) {
      next[key] = mergePlainObject(base[key], value);
      return;
    }
    next[key] = value;
  });
  return next;
}

const customConversationViews = loadCustomConversationViews();
const quickMessageData = loadQuickMessageData();
const conversationData = loadConversationData();
const workHoursSettings = loadWorkHoursSettings();
const automationSettings = loadAutomationSettings();
const forwardSettings = loadForwardSettings();
let conversationBackendRefreshTimer = null;
let conversationBackendSubscribed = false;

async function initConversationBackendState() {
  if (!window.conversationService) return false;
  const backendState = await window.conversationService.loadState();
  if (!backendState) return false;
  applyConversationBackendState(backendState);
  subscribeConversationBackendEvents();
  return true;
}

function applyConversationBackendState(backendState) {
  replaceArray(customConversationViews, Array.isArray(backendState.customViews) ? backendState.customViews : customConversationViews);
  replaceObject(quickMessageData, backendState.quickMessages || quickMessageData);
  replaceArray(conversationData, Array.isArray(backendState.conversations) ? backendState.conversations : conversationData);
  replaceObject(workHoursSettings, backendState.settings?.workHours || workHoursSettings);
  replaceObject(automationSettings, backendState.settings?.automation || automationSettings);
  replaceObject(forwardSettings, backendState.settings?.forwarding || forwardSettings);
  writeJsonStorage(customViewStorageKey, customConversationViews.filter((name) => !defaultCustomConversationViews.includes(name)));
  writeJsonStorage(quickMessageStorageKey, quickMessageData);
  writeJsonStorage(conversationStorageKey, conversationData);
  writeJsonStorage(workHoursStorageKey, workHoursSettings);
  writeJsonStorage(automationSettingsStorageKey, automationSettings);
  writeJsonStorage(forwardSettingsStorageKey, forwardSettings);
}

function replaceArray(target, source) {
  target.splice(0, target.length, ...structuredClone(source || []));
}

function replaceObject(target, source) {
  Object.keys(target).forEach((key) => delete target[key]);
  Object.assign(target, structuredClone(source || {}));
}

function syncConversationBackend(syncPromise) {
  if (!syncPromise || typeof syncPromise.catch !== "function") return;
  syncPromise.catch((error) => {
    console.warn("Conversation backend sync failed:", error.message);
  });
}

function subscribeConversationBackendEvents() {
  if (conversationBackendSubscribed || !window.conversationService?.subscribe) return;
  conversationBackendSubscribed = true;
  window.conversationService.subscribe((event) => {
    if (!event || event.type === "connected") return;
    scheduleConversationBackendRefresh();
  });
}

function scheduleConversationBackendRefresh() {
  window.clearTimeout(conversationBackendRefreshTimer);
  conversationBackendRefreshTimer = window.setTimeout(async () => {
    const selectedConversation = state.selectedConversation;
    const backendState = await window.conversationService?.loadState();
    if (!backendState) return;
    applyConversationBackendState(backendState);
    if (selectedConversation && conversationData.some((conversation) => conversation.id === selectedConversation)) {
      state.selectedConversation = selectedConversation;
    }
    if (typeof render === "function") render();
  }, 250);
}

function getAllConversations() {
  return conversationData;
}

function getSelectedConversation() {
  return conversationData.find((item) => item.id === state.selectedConversation) || null;
}

function getConversationMembers(conversation) {
  if (!conversation) return [];
  if (Array.isArray(conversation.members) && conversation.members.length) return conversation.members;
  return [
    {
      id: `${conversation.id}-customer`,
      name: conversation.customer?.name || conversation.name,
      avatar: conversation.avatar || "客",
      role: conversation.channel?.includes("群") ? "群成员" : "客户",
      company: conversation.customer?.company || "-",
      phone: conversation.customer?.phone || "-",
      city: conversation.customer?.city || "-",
      remark: conversation.customer?.remark || conversation.channel,
      tags: conversation.tags || [],
      lastActive: getConversationTimeLabel(conversation),
    },
    {
      id: `${conversation.id}-assignee`,
      name: conversation.assignee || currentAgentName,
      avatar: (conversation.assignee || currentAgentName).slice(0, 2),
      role: conversation.type === "ai" ? "AI助手" : "坐席",
      company: "JellyAI",
      phone: "-",
      city: "云端",
      remark: conversation.type === "ai" ? "自动接待中" : "人工跟进中",
      tags: [conversation.status],
      lastActive: conversation.assignee === "AI" ? "在线" : "刚刚",
    },
  ];
}

function getFilteredConversationMembers(conversation) {
  const query = String(state.conversationMemberSearch || "").trim().toLowerCase();
  const members = getConversationMembers(conversation);
  if (!query) return members;
  return members.filter((member) =>
    [member.name, member.role, member.company, member.phone, member.city, member.remark, ...(member.tags || [])]
      .map((value) => String(value || "").toLowerCase())
      .some((value) => value.includes(query))
  );
}

function getSelectedConversationMember(conversation) {
  const members = getConversationMembers(conversation);
  return members.find((member) => member.id === state.selectedConversationMember) || members[0] || null;
}

function updateConversationMemberTag(conversationId, memberId, tag) {
  const conversation = conversationData.find((item) => item.id === conversationId);
  if (!conversation) return false;
  if (!Array.isArray(conversation.members) || !conversation.members.length) {
    conversation.members = getConversationMembers(conversation);
  }
  const member = conversation.members.find((item) => item.id === memberId);
  if (!member) return false;
  if (!Array.isArray(member.tags)) member.tags = [];
  if (member.tags.includes(tag)) {
    member.tags = member.tags.filter((item) => item !== tag);
  } else {
    member.tags.push(tag);
  }
  saveConversationData();
  return true;
}

function shouldShowAiReplyBanner(conversation) {
  if (!conversation) return false;
  const last = getConversationLastMessage(conversation);
  return (conversation.type === "ai" || conversation.status === "AI接待") && last?.role === "customer" && !aiReplyCancelled.has(conversation.id);
}

function saveAiReplyCancelled() {
  writeJsonStorage(aiReplyCancelStorageKey, Array.from(aiReplyCancelled));
}

function cancelAiReply(conversationId) {
  const conversation = conversationData.find((item) => item.id === conversationId);
  if (!conversation) return;
  window.clearTimeout(aiReplyTimers[conversationId]);
  delete aiReplyTimers[conversationId];
  aiReplyCancelled.add(conversationId);
  saveAiReplyCancelled();
  conversation.type = "manual";
  conversation.assignee = currentAgentName;
  conversation.assignedToMe = true;
  conversation.status = "待跟进";
  conversation.statusColor = "orange";
  if (!conversation.viewTags.includes("未人工回复")) conversation.viewTags.push("未人工回复");
  conversation.messages.push({ id: `sys-${Date.now()}`, role: "system", text: "已取消 AI 自动代答，等待人工处理", createdAt: "刚刚" });
  conversation.updatedAt = new Date().toISOString();
  saveConversationData();
}

function queueAiAutoReply(conversationId) {
  const conversation = conversationData.find((item) => item.id === conversationId);
  if (!shouldShowAiReplyBanner(conversation) || aiReplyTimers[conversationId]) return;
  aiReplyTimers[conversationId] = window.setTimeout(() => {
    delete aiReplyTimers[conversationId];
    const activeConversation = conversationData.find((item) => item.id === conversationId);
    if (!shouldShowAiReplyBanner(activeConversation)) return;
    const last = getConversationLastMessage(activeConversation);
    const text = buildAiAutoReplyText(activeConversation, last?.text || "");
    addConversationMessage(conversationId, text, "ai", "AI 自动接待 · 可点击取消后转人工");
    if (state.selectedConversation === conversationId) {
      showToast("AI 已自动回复客户");
      setState({});
      requestAnimationFrame(() => {
        const box = document.querySelector(".conv-messages");
        if (box) box.scrollTop = box.scrollHeight;
      });
    }
  }, 4200);
}

function buildAiAutoReplyText(conversation, lastText) {
  const text = String(lastText || "");
  if (/100kg|报价|价格|运费|多少钱/.test(text)) {
    return "可以的。请再补充目的城市、件数、体积和地址类型，我会先按 100kg 为您整理参考价，并标注海运时效与派送注意事项。";
  }
  if (/成员|群|联系人/.test(text)) {
    return "我已经记录您的群成员诉求，可以在右侧联系人区域查看成员资料，并继续补充需要跟进的人。";
  }
  return `收到，我会继续围绕“${conversation.name}”跟进。请补充目的地、货物重量/体积和期望时效，我会整理下一步回复。`;
}

function getConversationMessages(conversation) {
  return conversation?.messages || [];
}

function getConversationLastMessage(conversation) {
  return [...getConversationMessages(conversation)].reverse().find((message) => message.role !== "system") || null;
}

function getConversationPreview(conversation) {
  const last = getConversationLastMessage(conversation);
  return last ? last.text : "暂无消息";
}

function getConversationTimeLabel(conversation) {
  const updated = new Date(conversation.updatedAt);
  const diff = Math.max(0, Date.now() - updated.getTime());
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时${minutes % 60 ? `${minutes % 60}分钟` : ""}`;
  return `${Math.floor(hours / 24)}天`;
}

function getConversationAgeMinutes(conversation) {
  const updated = new Date(conversation.updatedAt);
  if (Number.isNaN(updated.getTime())) return Number.MAX_SAFE_INTEGER;
  return Math.max(0, Math.floor((Date.now() - updated.getTime()) / 60000));
}

function getFilteredConversations() {
  return sortConversations(conversationData.filter(matchesConversationFilter).filter(matchesConversationSearch).filter(matchesConversationRefine));
}

function matchesConversationFilter(conversation) {
  if (state.chatFilter === "全部对话") return true;
  if (state.chatFilter === "人工对话") return conversation.type === "manual";
  if (state.chatFilter === "AI对话") return conversation.type === "ai";
  if (state.chatFilter === "指给我的") return conversation.assignedToMe || conversation.assignee === currentAgentName;
  if (state.chatFilter === "收藏") return conversation.starred;
  return conversation.viewTags.includes(state.chatFilter);
}

function matchesConversationSearch(conversation) {
  const query = state.chatSearchQuery.trim().toLowerCase();
  if (!query) return true;
  if (state.chatSearchMode === "phone") {
    const digits = query.replace(/\D/g, "");
    return Boolean(digits) && String(conversation.customer?.phone || "").includes(digits);
  }
  const fields = [
    conversation.name,
    conversation.owner,
    conversation.assignee,
    conversation.channel,
    conversation.status,
    conversation.customer?.phone,
    conversation.customer?.company,
    getConversationPreview(conversation),
    ...conversation.tags,
  ].map((value) => String(value || "").toLowerCase());
  return state.chatSearchMode === "exact" ? fields.some((value) => value === query) : fields.some((value) => value.includes(query));
}

function matchesConversationRefine(conversation) {
  const status = state.chatStatusFilter || "全部状态";
  const channel = state.chatChannelFilter || "全部渠道";
  return (status === "全部状态" || conversation.status === status) && (channel === "全部渠道" || conversation.channel === channel);
}

function sortConversations(conversations) {
  return [...conversations].sort((a, b) => {
    if (state.chatSort === "unread" && Boolean(a.unread) !== Boolean(b.unread)) return a.unread ? -1 : 1;
    if (state.chatSort === "status" && a.status !== b.status) return a.status.localeCompare(b.status, "zh-CN");
    return getConversationAgeMinutes(a) - getConversationAgeMinutes(b);
  });
}

function getConversationChannels() {
  return ["全部渠道", ...Array.from(new Set(conversationData.map((item) => item.channel)))];
}

function getConversationStatuses() {
  return ["全部状态", ...Array.from(new Set(conversationData.map((item) => item.status)))];
}

function getConversationStatusColor(status) {
  return status === "已解决" || status === "AI接待" ? "green" : "orange";
}

function markConversationRead(conversationId) {
  const conversation = conversationData.find((item) => item.id === conversationId);
  if (!conversation) return;
  conversation.unread = false;
  saveConversationData({ skipBackendBulk: true });
  syncConversationBackend(window.conversationService?.markRead(conversationId, false));
}

function addConversationMessage(conversationId, text, role = "me", meta = "") {
  const conversation = conversationData.find((item) => item.id === conversationId);
  if (!conversation) return null;
  const now = new Date();
  const message = {
    id: `msg-${Date.now()}`,
    role,
    text,
    createdAt: now.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
  };
  if (meta) message.meta = meta;
  conversation.messages.push(message);
  conversation.updatedAt = now.toISOString();
  conversation.status = role === "me" ? "解决中" : conversation.status;
  conversation.statusColor = getConversationStatusColor(conversation.status);
  conversation.type = role === "me" ? "manual" : conversation.type;
  conversation.assignee = role === "me" ? currentAgentName : conversation.assignee;
  conversation.assignedToMe = role === "me" ? true : conversation.assignedToMe;
  conversation.viewTags = conversation.viewTags.filter((tag) => tag !== "未人工回复");
  saveConversationData({ skipBackendBulk: true });
  syncConversationBackend(window.conversationService?.sendMessage(conversationId, {
    clientMessageId: message.id,
    content: text,
    role,
    type: "text",
  }));
  return message;
}

function updateConversationStatus(conversationId, status) {
  const conversation = conversationData.find((item) => item.id === conversationId);
  if (!conversation) return;
  conversation.status = status;
  conversation.statusColor = getConversationStatusColor(status);
  conversation.messages.push({ id: `sys-${Date.now()}`, role: "system", text: `会话状态已更新为：${status}`, createdAt: "刚刚" });
  conversation.updatedAt = new Date().toISOString();
  saveConversationData({ skipBackendBulk: true });
  syncConversationBackend(window.conversationService?.updateStatus(conversationId, status));
}

function toggleConversationResolved(conversationId) {
  const conversation = conversationData.find((item) => item.id === conversationId);
  if (!conversation) return null;
  const nextStatus = conversation.status === "已解决" ? "解决中" : "已解决";
  updateConversationStatus(conversationId, nextStatus);
  return nextStatus;
}

function transferConversationToHuman(conversationId) {
  const conversation = conversationData.find((item) => item.id === conversationId);
  if (!conversation) return;
  conversation.type = "manual";
  conversation.assignee = currentAgentName;
  conversation.assignedToMe = true;
  conversation.status = "解决中";
  conversation.statusColor = "orange";
  conversation.viewTags = conversation.viewTags.filter((tag) => tag !== "未人工回复");
  conversation.messages.push({ id: `sys-${Date.now()}`, role: "system", text: `已转入人工对话，操作人：${currentAgentName}`, createdAt: "刚刚" });
  conversation.updatedAt = new Date().toISOString();
  saveConversationData({ skipBackendBulk: true });
  syncConversationBackend(window.conversationService?.transferToHuman(conversationId, currentAgentName));
}

function toggleConversationTag(conversationId, tag) {
  const conversation = conversationData.find((item) => item.id === conversationId);
  if (!conversation) return;
  if (conversation.tags.includes(tag)) {
    conversation.tags = conversation.tags.filter((item) => item !== tag);
  } else {
    conversation.tags.push(tag);
  }
  saveConversationData({ skipBackendBulk: true });
  syncConversationBackend(window.conversationService?.updateTags(conversationId, conversation.tags));
}

function addConversationTag(conversationId, tag) {
  const conversation = conversationData.find((item) => item.id === conversationId);
  if (!conversation || !tag.trim()) return false;
  const clean = tag.trim().slice(0, 12);
  if (!conversation.tags.includes(clean)) conversation.tags.push(clean);
  saveConversationData({ skipBackendBulk: true });
  syncConversationBackend(window.conversationService?.updateTags(conversationId, conversation.tags));
  return true;
}

function toggleConversationHosted(conversationId) {
  const conversation = conversationData.find((item) => item.id === conversationId);
  if (!conversation) return null;
  conversation.hosted = !conversation.hosted;
  conversation.messages.push({ id: `sys-${Date.now()}`, role: "system", text: `托管状态已${conversation.hosted ? "开启" : "暂停"}`, createdAt: "刚刚" });
  saveConversationData({ skipBackendBulk: true });
  syncConversationBackend(window.conversationService?.updateHosting(conversationId, conversation.hosted));
  return conversation.hosted;
}

function openConversationConfirm(title, body, okText, action) {
  window.__conversationConfirmAction = action;
  state.conversationConfirm = { title, body, okText };
  setState({ modal: "conversationConfirm" });
}

function closeConversationConfirm() {
  window.__conversationConfirmAction = null;
  state.conversationConfirm = null;
  setState({ modal: null });
}
