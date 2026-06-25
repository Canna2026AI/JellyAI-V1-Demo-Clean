// Mock data for Enterprise WeCom hosting. No real backend calls.
(function initWecomMock() {
  const assistants = ["canna测试", "物流客服助手", "售前接待助手", "售后工单助手", "未绑定"];
  const groups = ["gs4758", "默认小组", "销售一组", "售后支持组"];
  const contacts = [
    { id: "C:1001", name: "Canna郑", type: "外部联系人", accountId: "8018" },
    { id: "C:1002", name: "Kevin德国仓", type: "客户", accountId: "8018" },
    { id: "C:1003", name: "Mia海运咨询", type: "客户", accountId: "8020" },
    { id: "C:1004", name: "售后-李", type: "内部员工", accountId: "8022" },
  ];

  const accounts = [
    {
      id: "8018",
      name: "测试",
      alias: "主客服号",
      avatar: "企",
      accountId: "ZhuLi01",
      instanceId: "65efc4ad2cb38280fa3f12a5",
      subject: "集简普通",
      status: "在线",
      group: "gs4758",
      assistant: "canna测试",
      messageEnabled: true,
      aiEnabled: true,
      heartbeat: "刚刚",
      owner: "Kelvin",
      lastAction: "AI自动回复 12 条",
      remark: "物流报价、群聊问答主账号",
    },
    {
      id: "8019",
      name: "123",
      alias: "待扫码测试号",
      avatar: "企",
      accountId: "待扫码",
      instanceId: "66ebee1c05f51dab6acf4564",
      subject: "-",
      status: "待扫码",
      group: "默认小组",
      assistant: "未绑定",
      messageEnabled: false,
      aiEnabled: false,
      heartbeat: "-",
      owner: "Kelvin",
      lastAction: "等待扫码",
      remark: "用于演示重新扫码授权",
    },
    {
      id: "8020",
      name: "Canna",
      alias: "欧洲海运",
      avatar: "C",
      accountId: "Canna-gs47",
      instanceId: "a29f1c9d4020fa8e8d7f0a11",
      subject: "欧诚国际物流",
      status: "暂停",
      group: "销售一组",
      assistant: "物流客服助手",
      messageEnabled: true,
      aiEnabled: false,
      heartbeat: "12分钟前",
      owner: "Canna",
      lastAction: "人工暂停接管",
      remark: "暂停期间只接收消息，不触发 AI 回复",
    },
    {
      id: "8021",
      name: "售后值班号",
      alias: "售后服务",
      avatar: "售",
      accountId: "AfterSale-01",
      instanceId: "b19c7d8a4051aa98cc1913f8",
      subject: "欧诚国际物流",
      status: "离线",
      group: "售后支持组",
      assistant: "售后工单助手",
      messageEnabled: true,
      aiEnabled: true,
      heartbeat: "36分钟前",
      owner: "Mia",
      lastAction: "客户端离线",
      remark: "离线后需要重启远程实例",
    },
  ];

  const rules = [
    {
      id: "rule-1",
      name: "物流报价群规则",
      accountId: "8018",
      messageEnabled: true,
      aiEnabled: true,
      replyScope: "全部",
      keywords: "报价, 运费, 时效",
      groupTrigger: "关键词",
      assistant: "canna测试",
      maxReplies: 3,
      enabled: true,
    },
    {
      id: "rule-2",
      name: "私聊咨询接待",
      accountId: "8020",
      messageEnabled: true,
      aiEnabled: false,
      replyScope: "私聊",
      keywords: "海运, 包税, 派送",
      groupTrigger: "仅@",
      assistant: "物流客服助手",
      maxReplies: 1,
      enabled: false,
    },
    {
      id: "rule-3",
      name: "售后工单识别",
      accountId: "8021",
      messageEnabled: true,
      aiEnabled: true,
      replyScope: "群聊",
      keywords: "丢件, 破损, 查件",
      groupTrigger: "关键词",
      assistant: "售后工单助手",
      maxReplies: 2,
      enabled: true,
    },
  ];

  const advancedSettings = {
    mentionExternal: true,
    onlyExternalQuestions: false,
    newFriendCreatesConversation: true,
    syncAllGroupMessages: true,
    manualReplyToHuman: true,
    groupAutoReply: true,
    privateAutoReply: true,
    quietHours: "22:00-08:00",
    triggerMode: "关键词或@触发",
    maxDailyReplies: 200,
    keywords: "报价, 物流, 运费, 客服",
  };

  const wecomGroups = [
    {
      id: "R:107758403324120",
      name: "欧诚国际物流&集简云对接群",
      accountId: "8018",
      owner: "Kelvin",
      members: 18,
      aiEnabled: true,
      messageEnabled: true,
      lockName: true,
      blockAddFriend: true,
      lastMessage: "50kg 到德国怎么报价",
    },
    {
      id: "R:107758403324121",
      name: "欧洲海运咨询群",
      accountId: "8020",
      owner: "Canna",
      members: 24,
      aiEnabled: true,
      messageEnabled: false,
      lockName: false,
      blockAddFriend: true,
      lastMessage: "普船时效多久",
    },
    {
      id: "R:107758403324122",
      name: "物流报价测试群",
      accountId: "8018",
      owner: "Kelvin",
      members: 30,
      aiEnabled: false,
      messageEnabled: true,
      lockName: false,
      blockAddFriend: false,
      lastMessage: "请测试关键词触发",
    },
    {
      id: "R:107758403324123",
      name: "售后问题处理群",
      accountId: "8021",
      owner: "Mia",
      members: 11,
      aiEnabled: true,
      messageEnabled: true,
      lockName: true,
      blockAddFriend: false,
      lastMessage: "客户反馈包裹破损",
    },
  ];

  const logs = [
    {
      id: "log-1",
      date: "2026-06-20",
      time: "06/20 10:18",
      operator: "AI",
      operation: "AI自动回复",
      accountId: "8018",
      groupId: "",
      target: "Canna郑",
      type: "私聊",
      content: "你好，你能物流报价吗",
      reply: "已根据物流问答知识库回复报价所需信息。",
      status: "成功",
      detail: "命中物流问答知识库",
    },
    {
      id: "log-2",
      date: "2026-06-20",
      time: "06/20 09:42",
      operator: "AI",
      operation: "群聊自动回复",
      accountId: "8018",
      groupId: "R:107758403324120",
      target: "欧诚国际物流&集简云对接群",
      type: "群聊",
      content: "@Canna 50kg 到德国怎么报价",
      reply: "请补充目的城市、件数和地址类型后可整理报价参考。",
      status: "成功",
      detail: "触发方式：关键词",
    },
    {
      id: "log-3",
      date: "2026-06-19",
      time: "06/19 22:46",
      operator: "系统",
      operation: "规则检测",
      accountId: "8020",
      groupId: "R:107758403324121",
      target: "欧洲海运咨询群",
      type: "群聊",
      content: "普船时效多久",
      reply: "账号暂停中，未触发 AI 回复。",
      status: "跳过",
      detail: "托管账号暂停",
    },
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  window.wecomMock = {
    cloneInitialState() {
      return {
        assistants: clone(assistants),
        accountGroups: clone(groups),
        contacts: clone(contacts),
        accounts: clone(accounts),
        rules: clone(rules),
        advancedSettings: clone(advancedSettings),
        groups: clone(wecomGroups),
        logs: clone(logs),
      };
    },
    nowLabel() {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hour = String(now.getHours()).padStart(2, "0");
      const minute = String(now.getMinutes()).padStart(2, "0");
      return `${month}/${day} ${hour}:${minute}`;
    },
    today() {
      return new Date().toISOString().slice(0, 10);
    },
  };
})();
