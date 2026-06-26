# AI Agents Backend

AI 智能体模块当前已经接入本地 Node 后端，可用于真实 Demo 验收。

## 当前已实现

- 本地 Node HTTP 服务：`server/server.js`
- 静态页面服务：访问 `/` 直接打开现有 Demo
- JSON 持久化数据库：`server/data/agents-db.json`
- 数据库首次启动自动从 `data/agents.js`、`data/knowledge.js` 生成种子数据
- 前端服务层：`services/agentsService.js`
- 智能体列表、创建、详情、编辑、启用、停用、删除
- 知识库绑定和解除
- 知识库文件上传、文本识别、逐行向量/分段向量预览
- 知识库自定义分段规则保存和预览刷新
- 知识库确认创建并写入本地数据库
- 技能创建、编辑、删除、导入和解除
- 工具创建、选择和解除
- 模型配置保存
- 聊天预览 API，返回模拟 AI 回复、命中信息、token 和费用
- 审计日志：创建、更新、删除、绑定关系等操作都会写入 `auditLogs`
- 本地权限结构：默认 demo 用户 `Kelvin` 拥有 `admin` 角色

## 运行方式

```bash
npm start
```

默认地址：

```text
http://localhost:3000
```

指定端口：

```bash
PORT=3127 npm start
```

## API 清单

- `GET /api/health`：检查服务、数据库路径和当前 demo 用户。
- `GET /api/agents/bootstrap`：一次性获取智能体、知识库、技能、工具、模型、集成配置。
- `GET /api/agents`：获取智能体列表，支持 `keyword`、`status` 查询。
- `POST /api/agents`：创建智能体。
- `GET /api/agents/:id`：获取智能体详情。
- `PATCH /api/agents/:id`：更新智能体基础字段和状态。
- `DELETE /api/agents/:id`：软删除智能体。
- `POST /api/agents/:id/chat`：提交预览消息并返回模拟 AI 回复。
- `POST /api/agents/:id/knowledge-bases`：保存知识库绑定，支持 `ids`。
- `DELETE /api/agents/:id/knowledge-bases/:knowledgeBaseId`：解除知识库绑定。
- `POST /api/agents/:id/skills`：保存技能绑定，支持 `ids`。
- `DELETE /api/agents/:id/skills/:skillId`：解除技能绑定。
- `POST /api/agents/:id/tools`：保存工具绑定，支持 `ids`。
- `DELETE /api/agents/:id/tools/:toolId`：解除工具绑定。
- `PATCH /api/agents/:id/model-config`：保存模型、上下文条数、token 展示、提示词和开场白。
- `GET /api/knowledge-bases`：获取知识库列表。
- `POST /api/knowledge-bases`：根据上传文件和分段结果创建知识库。
- `POST /api/knowledge-bases/uploads`：上传知识库文件内容，写入 `knowledgeUploads` 并返回分段预览。
- `PATCH /api/knowledge-bases/uploads/:id/segmentation`：更新向量方式、分段方式和自定义清洗规则并重新生成预览。
- `DELETE /api/knowledge-bases/:id`：删除知识库并清理智能体绑定。
- `GET /api/skills`：获取技能列表。
- `POST /api/skills`：创建技能。
- `PATCH /api/skills/:id`：更新技能。
- `DELETE /api/skills/:id`：删除技能并清理智能体绑定。
- `GET /api/tools`：获取工具列表和智能体可选工具。
- `POST /api/tools`：创建自定义工具。

## 本地数据库结构

- `teams`：团队。
- `users`：demo 用户和角色。
- `models`：可选模型列表。
- `integrations`：可选渠道集成。
- `agents`：智能体主数据，包含模型配置、绑定关系、成员、意图和预览消息。
- `knowledgeBases`：知识库。
- `knowledgeUploads`：知识库上传文件、识别文本、分段配置和预览片段。
- `skills`：技能。
- `tools`：工具市场列表。
- `toolOptions`：智能体详情页可选择的工具。
- `chatRuns`：聊天预览运行记录。
- `auditLogs`：后台操作审计。

## 生产后端 TODO

### API

- 将本地 JSON API 迁移为正式 REST 或 RPC 服务。
- 增加分页、排序、批量操作、字段级校验和乐观锁版本号。
- 聊天预览返回流式结果，前端可展示检索、工具调用和模型生成阶段。
- 删除智能体前校验企业微信托管规则、渠道规则、流程节点是否引用。

### 数据库

- 使用 PostgreSQL 或 MySQL 替代 JSON 文件。
- 建议表：`agents`、`agent_knowledge_bases`、`agent_skills`、`agent_tools`、`agent_intents`、`agent_integrations`、`agent_members`、`agent_chat_runs`、`agent_audit_logs`。
- 智能体删除继续使用软删除，避免历史会话失去引用。
- 对团队、成员、渠道、授权账号建立外键或一致性校验。

### 服务器

- API 按 `team_id` 做数据隔离。
- 增加统一错误码、请求 ID、结构化日志和慢请求记录。
- 长耗时工具调用进入任务队列，前端用 run id 轮询或 SSE/WebSocket 订阅。
- 模型请求、知识检索、技能判断、工具调用需要独立执行管线。

### Webhook

- 出站 Webhook：工具调用、签名、超时、重试、失败告警。
- 入站 Webhook：企业微信、微信公众号、小红书、抖音私信等消息事件。
- Webhook 日志保存请求头、脱敏请求体、响应状态、耗时和错误原因。

### 第三方 SDK

- LLM SDK：豆包、通义千问、OpenAI 等统一模型适配、超时、重试和费用统计。
- 企业微信 SDK：加好友、群消息、私聊消息、群聊创建、成员同步。
- 搜索和工具 SDK：Bing 搜索、Webhook、OCR、文档解析。
- 文件解析 SDK：xlsx、pdf、docx、txt、html 知识库导入。
- 向量化 SDK：接入 embedding 模型，正式生成向量并写入向量数据库。

### 对象存储

- 知识库原始文件、聊天附件、导入模板和工具执行产物放入对象存储。
- 当前本地 Demo 只保存识别文本和片段预览，生产环境必须保存原始文件对象 key。
- 文件表保存对象 key、hash、大小、mime type、上传者、团队和生命周期策略。
- 私有文件使用短期签名 URL 下载。

### Redis

- 保存聊天短期上下文、工具执行锁、幂等 key、异步任务状态。
- 知识库大文件解析和向量化任务需要 Redis 队列状态与重试记录。
- 缓存模型列表、工具目录、团队权限摘要。
- Webhook 重试队列、限流计数和任务去重可使用 Redis。

### 权限

- 权限粒度：查看智能体、创建智能体、编辑智能体、删除智能体、管理知识库绑定、管理技能、管理工具、查看执行日志。
- 成员 Tab 需要映射到后端 RBAC 或团队角色。
- 删除、停用、修改集成渠道前，需要校验是否影响线上规则。

### 登录与安全

- 所有 API 需要登录态，建议使用 HttpOnly session cookie 或短期 access token。
- API Key、Webhook Secret、第三方授权 token 必须加密存储。
- 聊天日志、联系人信息、手机号、微信号需要脱敏展示和权限控制。
- 管理端操作需要审计操作者、IP、UA、操作前后差异。
