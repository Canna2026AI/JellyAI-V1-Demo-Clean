# JellyAI V1 Demo Clean

这是 JellyAI V1 Demo 的干净源码版本。

本项目用于产品演示、前后端交互确认、后续正式开发前的协作基线。当前版本不使用 React，不使用 Next.js；聚合对话模块已内置一个零依赖 Node.js 后端，支持本地真实 API 和 JSON 持久化。

## 如何运行

推荐用内置后端启动：

```bash
npm start
```

然后打开：

```text
http://localhost:3000
```

聚合对话数据会持久化到：

```text
.jelly-data/conversations-store.json
```

如果只需要查看静态页面，也可以使用任意静态服务器直接打开 `index.html`。此时聚合对话会自动降级为浏览器 localStorage 数据。

## 项目结构

```text
JellyAI-V1-Demo-Clean/
├── index.html
├── app.js
├── server.js
├── vercel.json
├── assets/
├── core/
├── data/
├── services/
├── server/
├── modules/
└── styles/
```

## 目录说明

`index.html`：静态入口，按顺序加载拆分后的 CSS 和 JS。

`app.js`：应用启动入口，先尝试加载聚合对话后端 state，再调用 `render()`。

`server.js`：本地 Node.js 后端和静态文件服务，提供 `/api/conversations/*`。

`assets/`：图片、模板文件等静态资源，例如 JellyAI logo 和知识库导入模板。

`core/`：全局能力，包括状态、路由、Toast、Modal、事件委托和通用工具边界。

`data/`：mock 数据，按业务模块拆分。

`services/`：浏览器端服务层。`services/conversationsService.js` 负责聚合对话 API 接入和静态降级。

`server/`：后端数据层。`server/conversationsStore.js` 负责默认数据、JSON store、读写归一化。

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
6. 聚合对话已接入本地后端 API；其他模块接后端前先设计服务层边界。
7. 每次只改一个功能模块，方便 review 和回归。

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

项目的前端仍可纯静态部署到 Vercel。内置 Node 后端用于本地真实演示；生产部署时建议将 `/api/conversations/*` 替换为正式服务。

## 聚合对话 API 快速验证

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/conversations
curl -X POST http://localhost:3000/api/conversations/group/messages \
  -H 'Content-Type: application/json' \
  -d '{"clientMessageId":"demo-1","content":"这是一条真实写入后端的人工消息"}'
```
