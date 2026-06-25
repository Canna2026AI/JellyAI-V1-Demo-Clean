# AI Agents Backend TODO

当前 AI 智能体模块只使用前端 mock 数据与本地 mock service 辅助函数，不连接真实后端。

## API 清单

- `GET /api/agents`：获取智能体列表，支持 `keyword`、`status` 查询。
- `POST /api/agents`：创建智能体，提交名称、描述、模型、开场白、基础提示词。
- `GET /api/agents/:id`：获取智能体详情，包括知识库、技能、工具、意图、集成、成员和模型配置。
- `PATCH /api/agents/:id`：更新智能体名称、描述、状态、提示词、开场白等基础配置。
- `DELETE /api/agents/:id`：删除智能体。
- `POST /api/agents/:id/chat`：提交预览消息并返回模拟或真实 AI 回复。
- `POST /api/agents/:id/knowledge-bases`：绑定一个或多个知识库。
- `DELETE /api/agents/:id/knowledge-bases/:knowledgeBaseId`：解除知识库绑定。
- `POST /api/agents/:id/skills`：导入或绑定一个或多个技能。
- `DELETE /api/agents/:id/skills/:skillId`：解除技能绑定。
- `POST /api/agents/:id/tools`：选择或绑定一个或多个工具。
- `DELETE /api/agents/:id/tools/:toolId`：解除工具绑定。
- `PATCH /api/agents/:id/model-config`：保存模型、上下文条数、token 展示、提示词和开场白。

## 后续接入点

- 增加服务层文件，将当前 mock helper 替换为真实请求封装。
- 为列表、详情、创建、保存和删除增加真实 loading、错误重试和权限错误提示。
- 聊天预览需要返回命中的知识库、技能执行、工具调用、token 消耗和费用明细。
- 知识库、技能、工具选择需要校验当前团队权限和授权状态。
- 删除智能体前需要后端校验是否被渠道规则或企业微信托管规则引用。

## 数据库设计建议

- `agents`：智能体主表，字段包括 `id`、`team_id`、`name`、`description`、`status`、`model`、`prompt`、`opening_message`、`context_limit`、`show_token_usage`、`created_by`、`created_at`、`updated_at`、`deleted_at`。
- `agent_knowledge_bases`：智能体与知识库绑定关系，字段包括 `agent_id`、`knowledge_base_id`、`enabled`、`priority`、`created_at`。
- `agent_skills`：智能体与技能绑定关系，字段包括 `agent_id`、`skill_id`、`enabled`、`config_json`、`created_at`。
- `agent_tools`：智能体与工具绑定关系，字段包括 `agent_id`、`tool_id`、`enabled`、`auth_account_id`、`config_json`、`created_at`。
- `agent_intents`：智能体意图配置，字段包括 `id`、`agent_id`、`name`、`match_type`、`examples_json`、`action_type`、`action_config_json`、`enabled`。
- `agent_integrations`：渠道集成配置，字段包括 `agent_id`、`channel_type`、`external_rule_id`、`enabled`、`config_json`。
- `agent_members`：成员可见和协作权限，字段包括 `agent_id`、`member_id`、`role`、`created_at`。
- `agent_chat_runs`：预览和真实会话执行记录，字段包括 `id`、`agent_id`、`conversation_id`、`input`、`output`、`knowledge_hits_json`、`tool_calls_json`、`token_usage_json`、`cost`、`status`、`created_at`。

## 服务器与任务

- API 服务需要按 `team_id` 做数据隔离，并统一校验当前登录用户是否属于团队。
- 保存模型配置、知识库绑定、技能绑定和工具绑定时需要写审计日志。
- 删除智能体建议采用软删除，避免历史会话和渠道规则失去引用。
- 聊天预览应走异步执行管线：模型请求、知识检索、技能判断、工具调用、结果汇总。
- 长耗时工具调用需要任务队列，前端通过 run id 轮询或 SSE/WebSocket 获取状态。

## Webhook

- 工具执行需要支持出站 Webhook，包含签名、重试、超时、失败告警。
- 渠道集成需要支持入站 Webhook，例如企业微信、微信公众号、小红书、抖音私信等消息事件。
- Webhook 日志需要记录请求头、脱敏后的请求体、响应状态、耗时和错误原因。

## 第三方 SDK

- LLM SDK：接入豆包、通义千问、OpenAI 或其他模型供应商，统一封装模型选择、超时、重试和费用统计。
- 企业微信 SDK：用于加好友、群消息、私聊消息、群聊创建、成员同步。
- 搜索/工具 SDK：用于 Bing 搜索、Webhook、OCR、文档解析等工具能力。
- 文件解析 SDK：用于知识库导入时解析 xlsx、pdf、docx、txt、html。

## 对象存储

- 知识库原始文件、导入模板、聊天附件和工具执行产物需要放入对象存储。
- 文件表需要保存对象 key、文件 hash、大小、mime type、上传者、团队和生命周期策略。
- 下载链接使用短期签名 URL，避免公开暴露私有知识文件。

## Redis 与缓存

- Redis 保存聊天预览短期上下文、工具执行锁、幂等 key、异步任务状态。
- 模型列表、工具目录、团队权限摘要可做短期缓存。
- Webhook 重试队列和限流计数可使用 Redis 实现。

## 权限

- 权限粒度建议包括：查看智能体、创建智能体、编辑智能体、删除智能体、管理知识库绑定、管理技能、管理工具、查看执行日志。
- 成员 Tab 中的成员范围需要映射到后端 RBAC 或团队角色。
- 删除、停用、修改集成渠道前需要校验是否影响线上规则。

## 登录与安全

- 所有 API 需要登录态，建议使用 HttpOnly session cookie 或短期 access token。
- 敏感配置如 API Key、Webhook Secret、第三方授权 token 必须加密存储。
- 聊天日志、联系人信息、手机号、微信号等需要脱敏展示和权限控制。
- 管理端操作需要审计，包括操作者、IP、UA、操作前后差异。
