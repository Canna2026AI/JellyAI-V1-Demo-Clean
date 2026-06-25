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
