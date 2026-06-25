// Mock marketing data.

const marketingRules = [
  { id: "123", name: "123", enabled: false },
  { id: "test", name: "测试", enabled: true },
];

const tagGroupRows = {
  customer: [
    ["客户意向(4)", "可见小组: 全部小组", "<span class=\"mkt-tag-chip\">报价咨询</span><span class=\"mkt-tag-chip\">待跟进</span><span class=\"mkt-tag-chip\">重点客户</span><span class=\"mkt-tag-chip\">已成交</span>", "<button class=\"link-button\" data-modal=\"tagGroupTask\">编辑</button>"],
    ["物流阶段(3)", "可见小组: 销售一组", "<span class=\"mkt-tag-chip\">已询价</span><span class=\"mkt-tag-chip\">已发货</span><span class=\"mkt-tag-chip\">售后中</span>", "<button class=\"link-button\" data-modal=\"tagGroupTask\">编辑</button>"],
  ],
  group: [
    ["群聊类型(3)", "可见小组: 全部小组", "<span class=\"mkt-tag-chip\">报价群</span><span class=\"mkt-tag-chip\">售后群</span><span class=\"mkt-tag-chip\">渠道群</span>", "<button class=\"link-button\" data-modal=\"tagGroupTask\">编辑</button>"],
  ],
};

const keywordTagRows = {
  rules: [
    ["报价关键词打标", "模糊匹配", "报价 / 运费 / 价格", "私聊+群聊", "<span class=\"mkt-tag-chip\">报价咨询</span>", "<span class=\"mkt-tag-chip\">待跟进</span>", "<button class=\"link-button\" data-modal=\"keywordTagTask\">编辑</button>"],
    ["售后关键词打标", "精准匹配", "丢件 / 破损 / 延误", "私聊", "<span class=\"mkt-tag-chip\">售后中</span>", "<span class=\"mkt-tag-chip\">高优先级</span>", "<button class=\"link-button\" data-modal=\"keywordTagTask\">编辑</button>"],
  ],
  records: [
    ["报价关键词打标", "私聊", "2026-06-20 17:40", "Canna郑", "<span class=\"mkt-tag-chip\">报价咨询</span>", "<span class=\"mkt-tag-chip\">待跟进</span>", "<button class=\"link-button\" data-demo-action=\"查看关键词标签记录\">详情</button>"],
    ["售后关键词打标", "群聊", "2026-06-20 15:12", "欧诚国际物流群", "<span class=\"mkt-tag-chip\">售后中</span>", "<span class=\"mkt-tag-chip\">高优先级</span>", "<button class=\"link-button\" data-demo-action=\"查看关键词标签记录\">详情</button>"],
  ],
};

const blastTaskRows = {
  tasks: [
    ["欧洲物流报价唤醒", "文本+图片", "<span class=\"tag green\">Canna 在线</span>", "<span class=\"tag blue\">进行中</span>", "<button class=\"link-button\" data-modal=\"blastTask\">编辑</button>"],
    ["618客户复购提醒", "文本话术", "<span class=\"tag green\">Canna 在线</span>", "<span class=\"tag orange\">待执行</span>", "<button class=\"link-button\" data-modal=\"blastTask\">编辑</button>"],
  ],
  cycle: [
    ["每周报价更新", "文本+素材", "<span class=\"tag green\">Canna 在线</span>", "<span class=\"tag green\">已开启</span>", "3", "<button class=\"link-button\" data-modal=\"blastTask\">编辑</button>"],
  ],
  moments: [
    ["欧洲海运限时促销", "图片+文案", "<span class=\"tag green\">Canna 在线</span>", "<span class=\"tag orange\">待发送</span>", "<button class=\"link-button\" data-modal=\"blastTask\">编辑</button>"],
  ],
};

const autoFriendRows = {
  excel: [
    ["6月展会客户导入", "<span class=\"tag blue\">进行中</span>", "Canna", "8018", "<span class=\"mkt-tag-chip\">展会客户</span>", "您好，我是Jelly AI客服，方便加您沟通物流报价吗？", "<button class=\"link-button\" data-modal=\"autoFriendTask\">编辑</button>"],
    ["跨境卖家名单", "<span class=\"tag orange\">待执行</span>", "Canna", "8018", "<span class=\"mkt-tag-chip\">报价咨询</span>", "您好，看到您关注欧洲物流，方便交流吗？", "<button class=\"link-button\" data-modal=\"autoFriendTask\">编辑</button>"],
  ],
  group: [
    ["报价群成员添加", "<span class=\"tag blue\">进行中</span>", "欧诚国际物流群", "18", "Canna", "<button class=\"link-button\" data-modal=\"autoFriendTask\">编辑</button>"],
    ["渠道交流群转化", "<span class=\"tag orange\">待执行</span>", "欧洲海运交流群", "42", "Canna", "<button class=\"link-button\" data-modal=\"autoFriendTask\">编辑</button>"],
  ],
  card: [
    ["销售名片二次触达", "<span class=\"tag orange\">待执行</span>", "Kelvin分享名片", "Canna", "您好，收到您的名片，想了解物流报价可以直接发我。", "<button class=\"link-button\" data-modal=\"autoFriendTask\">编辑</button>"],
  ],
  api: [
    ["官网表单线索", "<span class=\"tag green\">已开启</span>", "Webhook", "Canna", "<span class=\"tag green\">正常</span>", "<button class=\"link-button\" data-modal=\"autoFriendTask\">编辑</button>"],
    ["CRM新线索同步", "<span class=\"tag orange\">暂停中</span>", "CRM API", "Canna", "<span class=\"tag orange\">待配置</span>", "<button class=\"link-button\" data-modal=\"autoFriendTask\">编辑</button>"],
  ],
  lost: [
    ["Canna郑", "单删客户", "Canna", "2026-06-19 22:45", "<span class=\"tag orange\">待处理</span>", "<button class=\"link-button\" data-demo-action=\"查看流失客户\">详情</button>"],
    ["欧诚物流-王总", "长时未互动", "Canna", "2026-06-11 09:18", "<span class=\"tag blue\">已生成任务</span>", "<button class=\"link-button\" data-demo-action=\"查看流失客户\">详情</button>"],
  ],
  blacklist: [
    ["测试黑名单客户", "138****9001", "手动加入", "2026-06-20 11:20", "频繁骚扰", "<button class=\"link-button\" data-modal=\"blacklistTask\">编辑</button>"],
  ],
};

const operationRows = {
  keywordReply: [
    ["物流报价回复", "报价 / 运费", "模糊匹配", "包含任一关键词", "私聊+群聊", "报价说明话术", "<span class=\"switch on\" data-switch></span>", "<button class=\"link-button\" data-modal=\"keywordReplyTask\">编辑</button>"],
    ["转人工提醒", "人工 / 客服", "精准匹配", "命中全部", "私聊", "转人工话术", "<span class=\"switch on\" data-switch></span>", "<button class=\"link-button\" data-modal=\"keywordReplyTask\">编辑</button>"],
  ],
  keywordReplyRecords: [
    ["物流报价回复", "Canna郑", "报价", "2026-06-20 17:40", "<span class=\"tag green\">已回复</span>", "<button class=\"link-button\" data-demo-action=\"查看触发记录\">详情</button>"],
  ],
  keywordGroup: [
    ["欧洲物流关键词拉群", "欧洲 / 报价", "包含任一关键词", "私聊", "欧洲报价交流群", "<span class=\"switch on\" data-switch></span>", "<button class=\"link-button\" data-modal=\"keywordGroupTask\">编辑</button>"],
  ],
  keywordGroupRecords: [
    ["欧洲物流关键词拉群", "私聊", "Canna郑", "报价", "2026-06-20 17:40", "<button class=\"link-button\" data-demo-action=\"查看拉群记录\">详情</button>"],
  ],
  newCustomer: [
    ["新客户3天转化", "欢迎语+报价引导", "Canna", "新添加好友", "<span class=\"tag green\">已开启</span>", "<button class=\"link-button\" data-modal=\"sopTask\">编辑</button>"],
  ],
  welcome: [
    ["默认欢迎语", "您好，我是Jelly AI客服，可以帮您查询物流方案。", "Canna", "<span class=\"tag green\">已开启</span>", "<button class=\"link-button\" data-modal=\"sopTask\">编辑</button>"],
  ],
  records: [
    ["2026-06-20 17:40", "Canna郑", "通过好友", "Canna", "<span class=\"tag green\">执行成功</span>", "<button class=\"link-button\" data-demo-action=\"查看SOP日志\">详情</button>"],
  ],
  privateSop: [
    ["沉默客户唤醒", "报价后24小时未回复自动跟进", "<span class=\"tag green\">Canna 在线</span>", "<span class=\"tag green\">已开启</span>", "报价咨询客户", "<button class=\"link-button\" data-modal=\"sopTask\">编辑</button>"],
  ],
  groupSop: [
    ["群内问题未答提醒", "群内3分钟无人回复时AI补充说明", "<span class=\"tag green\">Canna 在线</span>", "<span class=\"tag blue\">进行中</span>", "欧洲报价交流群", "<button class=\"link-button\" data-modal=\"sopTask\">编辑</button>"],
  ],
  momentsSop: [
    ["朋友圈点赞跟进", "客户点赞促销内容后私聊提醒", "<span class=\"tag green\">Canna 在线</span>", "<span class=\"tag orange\">待执行</span>", "近期互动客户", "<button class=\"link-button\" data-modal=\"sopTask\">编辑</button>"],
  ],
  tagSop: [
    ["重点客户复购SOP", "打上重点客户标签后7天跟进", "<span class=\"tag green\">Canna 在线</span>", "<span class=\"tag green\">已开启</span>", "重点客户", "<button class=\"link-button\" data-modal=\"sopTask\">编辑</button>"],
  ],
  batchGroup: [
    ["报价客户批量入群", "报价咨询客户", "欧洲报价交流群", "Canna", "<span class=\"tag orange\">待执行</span>", "<button class=\"link-button\" data-modal=\"keywordGroupTask\">编辑</button>"],
  ],
  tagGroup: [
    ["重点客户标签拉群", "重点客户", "核心客户服务群", "Canna", "<span class=\"tag green\">已开启</span>", "<button class=\"link-button\" data-modal=\"keywordGroupTask\">编辑</button>"],
  ],
};

const groupManageRows = {
  welcome: [
    ["默认入群欢迎语", "欢迎加入群聊，请发送目的国+重量获取报价。", "发送", "欧洲报价交流群", "<span class=\"tag green\">已开启</span>", "<button class=\"link-button\" data-modal=\"groupManageTask\">编辑</button>"],
  ],
  robot: [
    ["广告关键词踢人", "命中广告、刷屏、无关链接", "欧洲报价交流群", "<span class=\"tag green\">已开启</span>", "<button class=\"link-button\" data-modal=\"groupManageTask\">编辑</button>"],
  ],
  invite: [
    ["客户邀请自动通过", "客户邀请托管账号入群时自动接受", "全部客户群", "<span class=\"tag orange\">待配置</span>", "<button class=\"link-button\" data-modal=\"groupManageTask\">编辑</button>"],
  ],
  transfer: [
    ["报价群同步通知", "将报价群重要消息同步到运营群", "欧洲报价交流群", "<span class=\"tag green\">已开启</span>", "<button class=\"link-button\" data-modal=\"groupManageTask\">编辑</button>"],
  ],
};

const materialRows = [
  ["欧洲海运报价说明", "按重量、体积、国家、地址类型计算报价", "文本话术", "2026-06-20 18:22", "<button class=\"link-button\" data-modal=\"materialTask\">编辑</button>"],
  ["物流时效示意图", "普船、快船、卡派时效对比图", "图片", "2026-06-19 16:10", "<button class=\"link-button\" data-modal=\"materialTask\">编辑</button>"],
  ["售后处理FAQ", "丢件、破损、延误场景处理话术", "文件", "2026-06-18 09:30", "<button class=\"link-button\" data-modal=\"materialTask\">编辑</button>"],
];
