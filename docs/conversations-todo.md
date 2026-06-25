# Conversations Backend TODO

当前聚合对话模块仅使用前端 mock state 与 localStorage，不接真实后端。后续接入真实服务前，建议先确认以下 API 契约。

## API 清单

- `GET /api/conversations`
  - 查询会话列表。
  - Query: `view`, `q`, `searchMode`, `status`, `channel`, `sort`, `assignee`.
  - Response: 会话摘要、未读状态、最后一条消息、客户标签、来源渠道、托管状态。

- `GET /api/conversations/:id`
  - 查询单个会话详情。
  - Response: 会话基础信息、消息记录、客户信息、来源信息、标签、托管状态。

- `POST /api/conversations/:id/messages`
  - 发送人工消息。
  - Body: `{ "content": string, "type": "text" | "image" | "file" }`.
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

- `DELETE /api/conversations/quick-replies/:id`
  - 删除快捷回复。

- `POST /api/conversations/quick-reply-groups`
  - 新增快捷回复分组。
  - Body: `{ "name": string }`.

- `PATCH /api/conversations/settings/worktime`
  - 保存工作时间设置。
  - Body: `{ "enabled": boolean, "schedules": array, "afterHoursAction": string, "afterHoursText": string }`.

## 接入注意事项

- 列表接口应返回稳定分页字段，避免真实会话量较大时一次性加载。
- 消息发送应支持幂等客户端消息 ID，避免网络重试造成重复发送。
- 会话详情与列表摘要需要统一最后消息、未读数、状态和跟进人字段。
- 未来若接入 WebSocket/SSE，先保持当前 mock service 的事件边界，再替换数据来源。
