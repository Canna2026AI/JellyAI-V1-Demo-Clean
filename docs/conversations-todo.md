# Conversations Backend

当前仓库已内置本地可运行后端：

- `server.js` 同时提供静态文件服务和 `/api/conversations/*`。
- `server/conversationsStore.js` 使用 `.jelly-data/conversations-store.json` 做 JSON 持久化。
- `services/conversationsService.js` 会在后端可用时读写真实 API；后端不可用时自动降级到 localStorage。

以下内容分为“当前已实现的本地 API”和“生产化后端 TODO”。本地 API 可用于真实演示、刷新后持久化、curl 验证和浏览器端到端测试；生产 TODO 用于未来替换为正式数据库、队列、鉴权和第三方 SDK。

## Local API Implemented

- `GET /api/health`
- `GET /api/conversations/state`
- `GET /api/conversations`
- `PUT /api/conversations`
- `GET /api/conversations/:id`
- `PATCH /api/conversations/:id`
- `POST /api/conversations/:id/messages`
- `PATCH /api/conversations/:id/status`
- `PATCH /api/conversations/:id/assignee`
- `PATCH /api/conversations/:id/tags`
- `PATCH /api/conversations/:id/hosting`
- `PATCH /api/conversations/:id/star`
- `PATCH /api/conversations/:id/read`
- `GET /api/conversations/custom-views`
- `PUT /api/conversations/custom-views`
- `POST /api/conversations/custom-views`
- `GET /api/conversations/quick-replies`
- `PUT /api/conversations/quick-replies`
- `POST /api/conversations/quick-replies`
- `PATCH /api/conversations/quick-replies/:id`
- `DELETE /api/conversations/quick-replies/:id`
- `POST /api/conversations/quick-reply-groups`
- `GET /api/conversations/settings`
- `PATCH /api/conversations/settings/worktime`
- `PATCH /api/conversations/settings/automation`
- `PATCH /api/conversations/settings/forwarding`
- `POST /api/conversations/webhooks/:provider/messages`

## Production TODO

后续接入生产服务前，建议继续确认以下后端契约、数据模型和基础设施边界。

## API

- `GET /api/conversations`
  - 查询会话列表。
  - Query: `view`, `q`, `searchMode`, `status`, `channel`, `sort`, `assignee`, `cursor`, `limit`.
  - Response: 会话摘要、未读状态、最后一条消息、客户标签、来源渠道、托管状态、分页 cursor。

- `GET /api/conversations/:id`
  - 查询单个会话详情。
  - Response: 会话基础信息、消息记录、客户信息、来源信息、标签、托管状态、跟进人。

- `POST /api/conversations/:id/messages`
  - 发送人工消息。
  - Body: `{ "clientMessageId": string, "content": string, "type": "text" | "image" | "file" }`.
  - Response: 新消息、更新后的会话摘要。

- `PATCH /api/conversations/:id/status`
  - 更新会话状态。
  - Body: `{ "status": "待跟进" | "解决中" | "AI接待" | "已解决" }`.

- `PATCH /api/conversations/:id/assignee`
  - 转人工或重新分配跟进人。
  - Body: `{ "assigneeId": string, "mode": "manual" | "ai" }`.

- `PATCH /api/conversations/:id/tags`
  - 更新客户标签。
  - Body: `{ "tags": string[] }`.

- `PATCH /api/conversations/:id/hosting`
  - 更新托管状态。
  - Body: `{ "enabled": boolean }`.

- `GET /api/conversations/quick-replies`
  - 查询快捷回复分组和回复列表。

- `POST /api/conversations/quick-replies`
  - 新增快捷回复。
  - Body: `{ "groupId": string, "title": string, "content": string }`.

- `PATCH /api/conversations/quick-replies/:id`
  - 编辑快捷回复。
  - Body: `{ "groupId": string, "title": string, "content": string }`.

- `DELETE /api/conversations/quick-replies/:id`
  - 删除快捷回复。

- `POST /api/conversations/quick-reply-groups`
  - 新增快捷回复分组。
  - Body: `{ "name": string }`.

- `PATCH /api/conversations/settings/worktime`
  - 保存工作时间设置。
  - Body: `{ "enabled": boolean, "schedules": array, "afterHoursAction": string, "afterHoursText": string }`.

- `PATCH /api/conversations/settings/automation`
  - 保存 AI 自动化设置。
  - Body: 自动跟进、结束时自动回复、多媒体发送、长回复拆分、总结规则配置。

- `PATCH /api/conversations/settings/forwarding`
  - 保存消息转发设置。
  - Body: `{ "enabled": boolean, "channel": string, "scope": string, "webhook": string }`.

## Database

- `conversations`
  - `id`, `tenant_id`, `customer_id`, `channel`, `external_id`, `status`, `mode`, `assignee_id`, `hosted`, `unread_count`, `last_message_id`, `last_message_at`, `created_at`, `updated_at`.

- `conversation_messages`
  - `id`, `conversation_id`, `client_message_id`, `role`, `type`, `content`, `metadata`, `sender_id`, `external_message_id`, `created_at`.
  - `client_message_id` 需要唯一索引，避免发送消息重试造成重复消息。

- `conversation_customers`
  - `id`, `tenant_id`, `name`, `phone`, `company`, `city`, `remark`, `external_profile`, `created_at`, `updated_at`.

- `conversation_tags`
  - `id`, `tenant_id`, `name`, `color`, `created_at`.

- `conversation_tag_links`
  - `conversation_id`, `tag_id`, `created_by`, `created_at`.

- `quick_reply_groups`
  - `id`, `tenant_id`, `name`, `sort_order`, `created_at`, `updated_at`.

- `quick_replies`
  - `id`, `tenant_id`, `group_id`, `title`, `content`, `content_type`, `sort_order`, `created_by`, `created_at`, `updated_at`.

- `conversation_settings`
  - `tenant_id`, `worktime_json`, `automation_json`, `forwarding_json`, `updated_by`, `updated_at`.

- `conversation_audit_logs`
  - `id`, `tenant_id`, `conversation_id`, `operator_id`, `action`, `before_json`, `after_json`, `created_at`.

## Server

- 建议将会话模块拆为 `ConversationService`、`MessageService`、`QuickReplyService`、`ConversationSettingsService`。
- 列表接口必须分页，默认 `limit=30`，最大不超过 `100`。
- 发送消息接口需要先写入本地消息记录，再异步投递到渠道 SDK，失败时更新消息状态并返回可重试信息。
- 会话状态、转人工、标签、托管状态都需要写审计日志。
- 真实时间排序应以服务端 `last_message_at` 为准，前端只展示相对时间。

## Webhook

- `POST /webhooks/conversations/:provider`
  - 接收企业微信、微信客服、小红书、抖音、网站客服等外部渠道消息。
  - 必须验证签名、时间戳和重放窗口。

- `POST /webhooks/conversations/message-status`
  - 接收渠道消息发送状态，如已发送、失败、撤回、被风控拦截。

- `POST /webhooks/conversations/ai-events`
  - 接收 AI 回复、AI 总结、转人工意图命中等异步事件。

- Webhook 消息需要进入队列后再处理，避免第三方请求超时造成重复投递。

## Third-Party SDK

- 企业微信/微信客服 SDK：消息收发、客户资料、群信息、托管账号状态。
- 小红书/抖音开放平台：私信、评论、账号授权、消息状态回调。
- AI 服务 SDK：自动回复、总结、意图识别、敏感内容检测。
- 通知 SDK：企业微信群机器人、邮件、Webhook 转发。
- 所有 SDK 调用必须封装为 provider adapter，避免业务层直接依赖第三方对象。

## Object Storage

- 图片、视频、文件、语音消息统一进入对象存储。
- 表结构只保存 `file_key`、`mime_type`、`size`、`original_name`、`checksum`。
- 下载或预览使用短期签名 URL。
- 上传需要做文件大小、扩展名、MIME、病毒扫描和租户隔离。

## Redis

- 会话列表热点缓存：按 `tenant_id + view + filter` 缓存短 TTL 数据。
- 未读数计数器：按坐席、视图、渠道维护。
- WebSocket/SSE 在线状态：维护坐席在线、离线、忙碌状态。
- 幂等键：`clientMessageId`、Webhook `eventId`。
- 队列：消息投递、AI 回复、转发通知、附件扫描。
- 分布式锁：同一会话的状态迁移和转人工操作。

## Permissions

- 权限点：
  - 查看全部会话
  - 查看指派给我的会话
  - 发送人工消息
  - 转人工/重新分配
  - 更新会话状态
  - 管理客户标签
  - 管理快捷回复
  - 管理工作时间和自动化设置
  - 查看审计日志

- 自定义视图需要保存可见范围：全员、角色、成员。
- 所有查询必须加 `tenant_id` 和权限过滤，不能只在前端隐藏。

## Login

- 需要统一登录态：`tenant_id`、`user_id`、`role_ids`、`agent_profile`。
- 坐席在线状态应绑定登录用户，不允许前端伪造他人在线状态。
- API 使用 HTTP-only session 或短期 access token，刷新逻辑由全局认证层处理。
- 敏感操作如转人工、删除快捷回复、关闭托管应记录操作者和 IP。

## 接入注意事项

- 列表接口应返回稳定分页字段，避免真实会话量较大时一次性加载。
- 消息发送应支持幂等客户端消息 ID，避免网络重试造成重复发送。
- 会话详情与列表摘要需要统一最后消息、未读数、状态和跟进人字段。
- 未来若接入 WebSocket/SSE，先保持当前 mock service 的事件边界，再替换数据来源。
