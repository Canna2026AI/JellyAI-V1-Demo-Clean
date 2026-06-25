# 对话渠道后端 TODO

当前对话渠道模块只使用前端 mock 数据和本地 Demo 状态，不连接真实第三方平台。

## API 清单

- `GET /api/channels`
  - 返回渠道目录、接入状态、账号数量、分类、是否开放、接入字段说明。
- `GET /api/channels/:id`
  - 返回单个渠道详情、已连接账号、接入说明和配置字段。
- `POST /api/channels/:id/connect`
  - 创建渠道接入配置，保存授权信息或 webhook 配置。
- `PATCH /api/channels/:id/status`
  - 更新渠道接入状态，例如启用、暂停、开发中、断开。
- `DELETE /api/channels/:id/accounts/:accountId`
  - 删除某个渠道下的已连接账号。

## 渠道接入字段

### 企业微信托管

- 托管账号名称
- 企业微信扫码授权状态
- 实例 ID
- 绑定 AI 助手
- 默认接待小组
- 私聊自动回复开关
- 群聊自动回复开关
- 消息同步范围

### 微信客服 / 公众号

- 企业 ID 或公众号 AppID
- AppSecret / Secret
- Token
- EncodingAESKey
- Webhook URL
- 绑定 AI 助手
- 消息接待规则

### 小红书

- 专业号名称
- App Key
- App Secret
- 授权回调地址
- 私信同步范围
- 评论同步范围
- 回复风控关键词

### 抖音

- 企业号名称
- Client Key
- Client Secret
- 授权回调地址
- 私信事件订阅
- 直播间线索同步范围

### Telegram

- Bot Name
- Bot Token
- Webhook Secret
- Allowed Chat IDs
- 绑定 AI 助手

### WhatsApp Business

- Meta Business Account ID
- Phone Number ID
- Access Token
- Webhook Verify Token
- 消息模板审核状态
- 绑定 AI 助手

## 实现注意事项

- 不在前端保存真实密钥。
- 第三方授权、webhook 校验、Token 加密存储应由后端完成。
- 每个平台的消息回调需要统一映射到聚合对话模型。
- 渠道账号删除前需要确认是否仍有关联的聚合规则。
- 开发中渠道前端只展示说明和 Toast，不应跳转到空页面。
