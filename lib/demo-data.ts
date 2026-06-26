export const demoTenantRecords = [
  {
    module: "wecom",
    recordType: "account",
    payload: {
      name: "企业微信托管账号",
      status: "在线",
      group: "销售一组",
      assistant: "物流客服助手",
      heartbeat: "刚刚",
    },
  },
  {
    module: "knowledge",
    recordType: "knowledge_base",
    payload: {
      name: "物流问答知识库",
      files: 3,
      vectors: 1280,
      status: "已启用",
    },
  },
  {
    module: "conversations",
    recordType: "conversation",
    payload: {
      customer: "Canna郑",
      channel: "企业微信",
      status: "AI 接待中",
      lastMessage: "50kg 到德国怎么报价",
    },
  },
  {
    module: "agents",
    recordType: "assistant",
    payload: {
      name: "物流客服助手",
      model: "通用客服",
      status: "在线",
      tools: 4,
    },
  },
  {
    module: "channels",
    recordType: "channel",
    payload: {
      name: "企业微信",
      status: "已接入",
      accounts: 1,
    },
  },
  {
    module: "analytics",
    recordType: "metric",
    payload: {
      conversations: 126,
      aiResolutionRate: "72%",
      handoffRate: "18%",
      period: "7d",
    },
  },
];

export const moduleLabels: Record<string, string> = {
  wecom: "企业微信托管",
  knowledge: "知识库",
  conversations: "聚合对话",
  agents: "AI 智能体",
  channels: "对话渠道",
  analytics: "数据分析",
  marketing: "AI 微信营销",
  contacts: "联系人",
  flow: "AI 流程",
};
