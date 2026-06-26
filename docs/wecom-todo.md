# 企业微信托管 Backend 状态

当前分支已新增本地可运行后端：`backend/server.js`。它提供静态托管、REST API、文件持久化、登录会话、权限占位、审计日志、Webhook 验签入口、企业微信官方 API client 和 RPA Webhook 适配层。

真实可用定义：

- 不配置外部企业微信/RPA 时：账号、规则、设置、群聊、控制台任务、日志、侧边栏等全部持久化到本地 JSON，可用于真实后台联调和演示。
- 配置企业微信官方凭证后：可验证官方 API token，并可扩展同步通讯录、部门等开放 API。
- 配置 `WECOM_RPA_WEBHOOK_URL` 后：发送文本、图片、文件、创建群、拉人、改群名、群公告会转发到真实 RPA/托管客户端执行器。

仍需外部环境提供的能力如下。

## 基础服务

- 托管控制服务器：负责账号实例生命周期、扫码状态、心跳、重启、暂停、恢复。
- Webhook 服务：接收企业微信消息、群事件、好友事件、账号掉线事件、规则命中事件。
- RPA 执行器：在企业微信客户端或远程容器中执行发消息、拉群、改群名、群公告、文件发送等动作。
- 企业微信 SDK：对接企业微信通讯录、客户联系、群聊、会话内容存档等能力。
- 扫码授权服务：生成二维码、轮询扫码状态、绑定托管账号、处理过期和重新扫码。

## 存储与基础设施

- 数据库：存储托管账号、聚合规则、高级设置、群聊、联系人、对话记录、操作日志、权限、登录会话。
- Redis：缓存扫码状态、账号心跳、消息去重、规则热配置、任务锁、短期执行日志、登录验证码、导出进度。
- 对象存储：保存二维码截图、会话附件、图片、文件、导出报表、RPA 运行截图、异常现场包。
- 消息队列：削峰处理 Webhook 消息、AI 回复任务、群发任务、RPA 指令。
- 审计日志：记录账号操作、规则变更、后台控制台指令、导出行为。

## 登录与权限

- 登录体系：支持账号密码、短信验证码、企业微信扫码登录、SSO。
- 租户隔离：所有托管账号、规则、群聊、日志按 `tenant_id` 隔离。
- RBAC 权限：区分管理员、运营主管、客服成员、只读审计员。
- 操作授权：删除账号、导出记录、控制台发消息、群发任务需要二次确认或高级权限。
- 数据权限：成员只能查看自己小组、账号或授权客户范围内的数据。
- 审计追踪：登录、导出、发消息、修改规则、暂停/恢复账号必须记录操作者、IP、User-Agent。

## 数据库表建议

- `wecom_accounts`：托管账号、实例 ID、状态、心跳、绑定助手、小组、负责人。
- `wecom_account_sessions`：扫码会话、二维码、过期时间、登录状态、设备信息。
- `wecom_rules`：聚合规则、回复范围、关键词、群聊触发、最大回复次数、绑定 AI。
- `wecom_settings`：租户级高级设置、群聊设置、回复设置、触发设置。
- `wecom_groups`：群 ID、群名、成员数、消息接收、AI 回复、风控设置。
- `wecom_group_members`：群成员、企业微信成员 ID、角色、入群时间。
- `wecom_contacts`：外部联系人、标签、来源、最近会话、归属账号。
- `wecom_messages`：私聊/群聊消息、方向、内容类型、附件地址、消息状态。
- `wecom_ai_replies`：AI 回复、命中知识库、规则 ID、token、置信度、人工接管结果。
- `wecom_console_tasks`：控制台指令、任务状态、RPA 执行日志、失败原因。
- `wecom_exports`：导出任务、筛选条件、文件地址、过期时间、下载审计。
- `audit_logs`：后台审计日志。

## 第三方 SDK 与企业微信能力

- 企业微信通讯录 SDK：同步成员、部门、权限范围。
- 企业微信客户联系 SDK：客户、客户群、标签、跟进人。
- 企业微信会话内容存档：私聊/群聊消息合规入库。
- 企业微信侧边栏 SDK：在企微客户端内展示客户资料、订单、报价、工单。
- 企业微信客服 API：如果接入原生客服，需要独立处理客服账号与会话。
- RPA/远程浏览器 SDK：处理企业微信 PC 客户端无法通过开放 API 覆盖的动作。

## 需要的 API

### 托管账号

- `GET /api/wecom/accounts`
- `POST /api/wecom/accounts`
- `GET /api/wecom/accounts/:id`
- `PATCH /api/wecom/accounts/:id`
- `DELETE /api/wecom/accounts/:id`
- `POST /api/wecom/accounts/:id/pause`
- `POST /api/wecom/accounts/:id/resume`
- `POST /api/wecom/accounts/:id/restart`
- `POST /api/wecom/accounts/:id/rescan`
- `GET /api/wecom/accounts/:id/qrcode`
- `GET /api/wecom/accounts/:id/heartbeat`
- `GET /api/wecom/accounts/:id/events`
- `GET /api/wecom/account-groups`
- `PATCH /api/wecom/account-groups/:id/members`

### 聚合规则

- `GET /api/wecom/rules`
- `POST /api/wecom/rules`
- `PATCH /api/wecom/rules/:id`
- `DELETE /api/wecom/rules/:id`
- `POST /api/wecom/rules/:id/enable`
- `POST /api/wecom/rules/:id/disable`
- `POST /api/wecom/rules/:id/test`

### 高级设置

- `GET /api/wecom/settings`
- `PATCH /api/wecom/settings`
- `POST /api/wecom/settings/reset`
- `GET /api/wecom/settings/effective`
- `GET /api/wecom/sidebar`
- `PATCH /api/wecom/sidebar`

### 机器人控制台

- `POST /api/wecom/console/send-text`
- `POST /api/wecom/console/send-image`
- `POST /api/wecom/console/send-file`
- `POST /api/wecom/console/create-group`
- `POST /api/wecom/console/invite-members`
- `POST /api/wecom/console/rename-group`
- `POST /api/wecom/console/group-notice`
- `GET /api/wecom/console/tasks/:taskId`
- `GET /api/wecom/console/tasks`
- `POST /api/wecom/console/tasks/:taskId/cancel`

### 群聊管理

- `GET /api/wecom/groups`
- `POST /api/wecom/groups/sync`
- `GET /api/wecom/groups/:id`
- `PATCH /api/wecom/groups/:id`
- `GET /api/wecom/groups/:id/members`
- `POST /api/wecom/groups/:id/ai-reply/enable`
- `POST /api/wecom/groups/:id/ai-reply/disable`
- `POST /api/wecom/groups/:id/message-receive/enable`
- `POST /api/wecom/groups/:id/message-receive/disable`

### 对话记录

- `GET /api/wecom/conversations`
- `GET /api/wecom/conversations/:id`
- `GET /api/wecom/conversations/export`
- `GET /api/wecom/logs`
- `GET /api/wecom/logs/export`

### 登录、权限与审计

- `POST /api/auth/login`
- `POST /api/auth/wecom-qrcode`
- `GET /api/auth/session`
- `POST /api/auth/logout`
- `GET /api/permissions/me`
- `GET /api/wecom/audit-logs`
- `GET /api/wecom/audit-logs/export`

## 上线前关键问题

- 企业微信能力边界需要确认：普通企业微信、企微客服、客户联系、会话存档的权限不同。
- RPA 方案需要隔离租户环境，避免账号串号和消息误发。
- AI 回复必须有频控、敏感词、黑名单、人工接管和异常回滚。
- 所有发送类动作必须可审计、可追踪、可撤销或可补偿。
- 导出对话记录需要权限控制和脱敏策略。
