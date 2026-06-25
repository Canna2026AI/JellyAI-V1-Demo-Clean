// Conversation helper data plus legacy shared helpers preserved for exact behavior.

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

function loadCustomConversationViews() {
  const savedViews = readJsonStorage(customViewStorageKey, []);
  return Array.isArray(savedViews)
    ? [...defaultCustomConversationViews, ...savedViews.filter((name) => typeof name === "string" && !defaultCustomConversationViews.includes(name))]
    : [...defaultCustomConversationViews];
}

function saveCustomConversationViews(views) {
  const createdViews = views.filter((name) => !defaultCustomConversationViews.includes(name));
  writeJsonStorage(customViewStorageKey, createdViews);
}

const customConversationViews = loadCustomConversationViews();

const quickMessageStorageKey = "jelly-ai-quick-messages";

function loadQuickMessageData() {
  const saved = readJsonStorage(quickMessageStorageKey, {});
  return {
    groups: Array.isArray(saved.groups) ? saved.groups : [],
    replies: Array.isArray(saved.replies) ? saved.replies : [],
  };
}

function saveQuickMessageData() {
  writeJsonStorage(quickMessageStorageKey, quickMessageData);
}

const quickMessageData = loadQuickMessageData();

const conversationMap = {
  全部对话: [
    ["group", "欧诚国际物流&集简云对接群", "Kelvin", "2小时14分钟", "你好", "orange", false, "13800138001"],
    ["canna", "Canna郑", "canna测试", "7小时51分钟", "您好，我可以为您解答物流相关的问题...", "green", true, "13900139002"],
    ["demo", "演示联系人", "AI", "12小时44分钟", "好的，您可以点击链接预约演示，咨询报价", "green", true, "13700137003"],
  ],
  人工对话: [["group", "欧诚国际物流&集简云对接群", "Kelvin", "2小时14分钟", "你好", "orange", false, "13800138001"]],
  AI对话: [
    ["canna", "Canna郑", "canna测试", "7小时51分钟", "您好，我可以为您解答物流相关的问题...", "green", true, "13900139002"],
    ["demo", "演示联系人", "AI", "12小时44分钟", "好的，您可以点击链接预约演示，咨询报价", "green", true, "13700137003"],
  ],
  指给我的: [["group", "欧诚国际物流&集简云对接群", "Kelvin", "2小时14分钟", "你好", "orange", false, "13800138001"]],
  企业微信托管: [["group", "欧诚国际物流&集简云对接群", "Kelvin", "2小时14分钟", "你好", "orange", false, "13800138001"]],
};
