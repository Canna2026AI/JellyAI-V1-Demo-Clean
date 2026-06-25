# JellyAI V1 Demo Clean

这是 JellyAI V1 Demo 的干净源码版本。

本项目用于产品演示、前端交互确认、后续正式开发前的协作基线。当前版本不使用 React，不使用 Next.js；AI 智能体模块已经接入本地 Node 后端，支持 API、JSON 持久化、审计日志和聊天预览记录。

## 如何运行

推荐使用本地后端运行：

```bash
npm start
```

然后打开：

```text
http://localhost:3000
```

如需指定端口：

```bash
PORT=3127 npm start
```

纯静态预览仍可使用：

```bash
python3 -m http.server 3000
```

然后打开：

```text
http://localhost:3000
```

静态预览会回退到页面内演示数据；需要真实创建、保存、绑定、聊天和删除时，请使用 `npm start`。

## 项目结构

```text
JellyAI-V1-Demo-Clean/
├── index.html
├── app.js
├── vercel.json
├── assets/
├── server/
├── services/
├── core/
├── data/
├── modules/
└── styles/
```

## 目录说明

`index.html`：静态入口，按顺序加载拆分后的 CSS 和 JS。

`app.js`：应用启动入口，只负责调用 `render()`。

`assets/`：图片、模板文件等静态资源，例如 JellyAI logo 和知识库导入模板。

`server/`：本地 Node 后端，提供静态页面服务、AI 智能体 REST API、JSON 数据库、审计日志和聊天预览模拟执行。

`services/`：前端 API 客户端。当前 `services/agentsService.js` 负责 AI 智能体模块与本地后端通信。

`core/`：全局能力，包括状态、路由、Toast、Modal、事件委托和通用工具边界。

`data/`：mock 数据，按业务模块拆分。

`modules/`：业务模块，每个模块都有独立目录。当前核心模块包括：

- `conversations/`：聚合对话
- `agents/`：AI 智能体
- `channels/`：对话渠道
- `wecom/`：企业微信托管
- `knowledge/`：知识库
- `marketing/`：AI 微信营销
- `contacts/`：联系人
- `analytics/`：数据分析
- `settings/`：教学、系统设置等页面
- `flow/`：AI 流程

`styles/`：样式按原始顺序拆分，保持当前 V1 Demo 的视觉效果和 CSS 级联行为不变。

## 后续开发规范

1. 新功能优先在对应 `modules/<module>/` 下开发。
2. mock 数据优先放在 `data/`，不要散落在 render 函数里。
3. 公共能力放在 `core/`，不要让模块之间互相直接修改内部逻辑。
4. 当前 `core/events.js` 仍是集中事件委托，后续可逐步迁移到各模块的 `events.js`。
5. 样式新增时优先写入对应模块 CSS 文件，公共样式写入 `styles/components.css` 或 `styles/layout.css`。
6. 新增后端能力时先设计服务层边界；前端模块不要直接散落 `fetch`。
7. 每次只改一个功能模块，方便 review 和回归。

## AI 智能体后端

`npm start` 会自动创建运行时数据库：

```text
server/data/agents-db.json
```

该文件被 `.gitignore` 忽略，避免把本地演示数据提交到仓库。首次启动时，后端会从 `data/agents.js` 和 `data/knowledge.js` 生成初始数据。

主要 API：

- `GET /api/agents`
- `POST /api/agents`
- `GET /api/agents/:id`
- `PATCH /api/agents/:id`
- `DELETE /api/agents/:id`
- `POST /api/agents/:id/chat`
- `POST /api/agents/:id/knowledge-bases`
- `POST /api/agents/:id/skills`
- `POST /api/agents/:id/tools`
- `PATCH /api/agents/:id/model-config`

## 当前范围

已保留当前 V1 Demo 中的页面和交互：

- 首页快速开始
- 聚合对话
- AI 智能体
- 对话渠道
- 企业微信托管
- 知识库
- AI 流程
- AI 微信营销
- 联系人管理
- 数据分析
- 产品教学
- 系统设置

## 部署

项目是纯静态文件，可以直接部署到 Vercel。`vercel.json` 当前仅开启 clean URLs。
