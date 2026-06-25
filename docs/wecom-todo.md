# 企业微信托管 Backend TODO

当前 V1 Demo 的企业微信托管模块全部使用本地 Mock，不连接真实企业微信、服务器或数据库。未来落地需要补齐以下后端能力。

## 基础服务

- 托管控制服务器：负责账号实例生命周期、扫码状态、心跳、重启、暂停、恢复。
- Webhook 服务：接收企业微信消息、群事件、好友事件、账号掉线事件、规则命中事件。
- RPA 执行器：在企业微信客户端或远程容器中执行发消息、拉群、改群名、群公告、文件发送等动作。
- 企业微信 SDK：对接企业微信通讯录、客户联系、群聊、会话内容存档等能力。
- 扫码授权服务：生成二维码、轮询扫码状态、绑定托管账号、处理过期和重新扫码。

## 存储与基础设施

- 数据库：存储托管账号、聚合规则、高级设置、群聊、联系人、对话记录、操作日志。
- Redis：缓存扫码状态、账号心跳、消息去重、规则热配置、任务锁、短期执行日志。
- 对象存储：保存二维码截图、会话附件、图片、文件、导出报表、RPA 运行截图。
- 消息队列：削峰处理 Webhook 消息、AI 回复任务、群发任务、RPA 指令。
- 审计日志：记录账号操作、规则变更、后台控制台指令、导出行为。

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

### 机器人控制台

- `POST /api/wecom/console/send-text`
- `POST /api/wecom/console/send-image`
- `POST /api/wecom/console/send-file`
- `POST /api/wecom/console/create-group`
- `POST /api/wecom/console/invite-members`
- `POST /api/wecom/console/rename-group`
- `POST /api/wecom/console/group-notice`
- `GET /api/wecom/console/tasks/:taskId`

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

## 上线前关键问题

- 企业微信能力边界需要确认：普通企业微信、企微客服、客户联系、会话存档的权限不同。
- RPA 方案需要隔离租户环境，避免账号串号和消息误发。
- AI 回复必须有频控、敏感词、黑名单、人工接管和异常回滚。
- 所有发送类动作必须可审计、可追踪、可撤销或可补偿。
- 导出对话记录需要权限控制和脱敏策略。
