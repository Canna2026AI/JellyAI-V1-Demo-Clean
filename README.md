# JellyAI V1 Demo Clean

这是 JellyAI V1 Demo 的干净静态前端源码版本。

本项目用于产品演示、前端交互确认、后续正式前端开发前的协作基线。当前版本不使用 React，不使用 Next.js。对话渠道模块已接入本地 Node 后端，支持真实 API、持久化 JSON 数据库、鉴权、Webhook 收件箱和静态页面托管；其他模块仍为前端 Demo 数据。

## 如何运行

推荐在本目录执行：

```bash
npm start
```

然后打开：

```text
http://localhost:3000
```

对话渠道后端默认使用：

```text
http://127.0.0.1:3000/api/channels
```

写入类接口默认需要 Bearer Token：

```text
jelly-demo-token
```

可通过环境变量覆盖：

```bash
PORT=3000 JELLY_DEMO_API_TOKEN=your-token npm start
```

仍可使用任意静态服务器直接打开 `index.html`，但对话渠道会降级为静态演示数据，无法持久化保存。

## 项目结构

```text
JellyAI-V1-Demo-Clean/
├── index.html
├── app.js
├── package.json
├── vercel.json
├── assets/
├── core/
├── data/
├── docs/
├── modules/
├── server/
├── services/
└── styles/
```

## 目录说明

`index.html`：静态入口，按顺序加载拆分后的 CSS 和 JS。

`app.js`：应用启动入口，只负责调用 `render()`。

`assets/`：图片、模板文件等静态资源，例如 JellyAI logo 和知识库导入模板。

`core/`：全局能力，包括状态、路由、Toast、Modal、事件委托和通用工具边界。

`data/`：mock 数据，按业务模块拆分。

`server/`：本地 Node 后端。当前实现对话渠道 API、JSON 持久化、鉴权、Webhook 收件箱和静态资源托管。

`services/`：前端 API client。当前包含对话渠道后端 client。

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
6. 不要在 Demo 阶段接真实后端 API；需要接 API 时先设计服务层边界。
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

项目是纯静态文件，可以直接部署到 Vercel。`vercel.json` 当前仅开启 clean URLs。
