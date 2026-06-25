# 对话渠道后端 TODO

当前对话渠道模块已经具备本地可运行后端：

- `server/index.js`：Node HTTP 服务，托管静态页面并提供 `/api/channels`。
- `server/channelStore.js`：JSON 持久化数据库、账号 CRUD、连接测试、Webhook 收件箱、审计日志。
- `server/seed/channels-db.json`：首次启动 seed 数据。
- `services/channelsService.js`：前端对话渠道 API client。

本地后端能真实保存、读取、删除渠道账号，并能接收 webhook 事件。它不假接真实第三方平台；生产交付时仍需要补充第三方授权、真实消息 SDK、租户登录和正式数据库。

## API

### 渠道目录

- `GET /api/channels`
  - 返回渠道目录、接入状态、账号数量、分类、开放状态、接入字段说明。
  - Query：`category`、`status`、`keyword`、`tenantId`。
- `GET /api/channels/:id`
  - 返回单个渠道详情、已连接账号、接入说明、配置字段、最近同步状态。
- `GET /api/channels/:id/accounts`
  - 返回渠道下账号列表，支持分页、状态筛选、负责人筛选。

### 接入配置

- `POST /api/channels/:id/connect`
  - 创建渠道接入配置，保存授权信息、webhook 配置或托管实例配置。
- `PATCH /api/channels/:id/status`
  - 更新渠道接入状态，例如启用、暂停、断开、重新授权。
- `PATCH /api/channels/:id/accounts/:accountId`
  - 更新账号别名、负责人、绑定 AI 助手、默认接待组、消息同步范围。
- `DELETE /api/channels/:id/accounts/:accountId`
  - 删除渠道账号。删除前校验是否有关联聚合规则、会话和运行中任务。

### 连接测试

- `POST /api/channels/:id/test`
  - 校验配置字段完整度、第三方凭据有效性、webhook 可达性。
  - 返回 `passed`、`checks[]`、`warnings[]`、`nextAction`。

当前本地后端已实现基础连接测试；生产环境需要接入第三方 SDK 的凭据校验。

### Webhook

- `POST /api/webhooks/channels/:provider`
  - 接收第三方消息事件。
  - Provider：`wecom`、`wechat_mp`、`xiaohongshu`、`douyin`、`telegram`、`whatsapp`。
- `GET /api/webhooks/channels/:provider/verify`
  - 用于微信、Meta 等平台的 webhook 校验。
- `GET /api/webhooks/channels/:provider`
  - 查看本地已接收 webhook 事件。

当前本地后端已实现 webhook 收件箱和幂等事件 ID；生产环境需要补充每个平台的签名规则和消息归一化。

## 数据库

### `channels`

- `id`
- `provider`
- `name`
- `category`
- `status`
- `is_open`
- `description`
- `required_fields`
- `created_at`
- `updated_at`

当前本地版本以 `.data/channels-db.json` 保存上述概念数据；生产环境建议迁移到 PostgreSQL 或 MySQL。

### `channel_accounts`

- `id`
- `tenant_id`
- `channel_id`
- `provider_account_id`
- `display_name`
- `owner_user_id`
- `status`
- `assistant_id`
- `default_group_id`
- `sync_scope`
- `last_heartbeat_at`
- `created_at`
- `updated_at`

### `channel_credentials`

- `id`
- `tenant_id`
- `channel_account_id`
- `credential_type`
- `encrypted_payload`
- `expires_at`
- `rotated_at`
- `created_at`

### `channel_webhook_events`

- `id`
- `tenant_id`
- `provider`
- `channel_account_id`
- `external_event_id`
- `event_type`
- `payload_object_key`
- `status`
- `retry_count`
- `received_at`
- `processed_at`

### `channel_connection_checks`

- `id`
- `tenant_id`
- `channel_account_id`
- `check_type`
- `status`
- `message`
- `created_at`

## 服务器

- 建议新增 `channels-service`，负责渠道目录、账号配置、连接测试和 webhook 入口。
- 渠道消息进入后统一转换为聚合对话事件，交给现有对话服务处理。
- 所有第三方密钥必须后端加密保存，前端只展示脱敏状态。
- 连接测试不发送真实业务消息，只验证凭据、权限和 webhook 可达性。
- 删除账号前需要执行依赖检查：聚合规则、自动回复规则、会话归档、未完成任务。

## Webhook 处理

- 校验签名、时间戳和 nonce，拒绝重放请求。
- 幂等处理 `external_event_id`。
- 原始 payload 写入对象存储，数据库只保存对象 key 和摘要字段。
- 异步处理消息归一化、会话匹配、AI 回复触发和人工接管。
- 失败事件进入重试队列，超过重试次数后进入死信队列。

## 第三方 SDK

### 企业微信托管

- 托管账号名称
- 企业微信扫码授权状态
- 托管实例 ID
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

## 对象存储

- 存储 webhook 原始 payload。
- 存储第三方消息附件：图片、语音、视频、文件。
- 存储连接测试报告和错误样本。
- 文件 key 需要包含 `tenant_id`、`provider`、`date`，便于生命周期管理。
- 敏感 payload 设置短生命周期或加密存储。

## Redis

- 缓存渠道目录和租户渠道状态。
- 保存 webhook 幂等 key，避免重复消费。
- 保存短期 OAuth `state`、扫码登录状态、连接测试状态。
- 作为重试队列和死信队列的轻量入口；生产环境可迁移到专用消息队列。

## 权限

- `channels:view`：查看渠道目录和接入状态。
- `channels:connect`：新增渠道账号和授权配置。
- `channels:update`：更新账号状态、负责人、绑定助手。
- `channels:delete`：删除渠道账号。
- `channels:credential:rotate`：轮换或重置密钥。
- 所有操作写入审计日志，包含操作者、租户、IP、User-Agent、变更字段。

## 登录与授权

- OAuth 渠道使用后端生成授权 URL 和 `state`。
- 扫码授权渠道需要轮询授权状态，前端不可直接拿第三方密钥。
- 第三方 access token、refresh token 必须加密存储并支持自动续期。
- 用户退出登录或权限变化后，前端不能继续访问渠道配置 API。
- 多租户场景下所有 API 必须校验 `tenant_id` 和账号归属。

## 实现注意事项

- 不在前端保存真实密钥。
- 不在 Demo 中假接真实第三方平台。
- 第三方授权、webhook 校验、Token 加密存储应由后端完成。
- 每个平台的消息回调需要统一映射到聚合对话模型。
- 渠道账号删除前需要确认是否仍有关联的聚合规则。
- 开发中渠道前端只展示说明和 Toast，不应跳转到空页面。
