# JellyAI V1 Demo Clean

这是 JellyAI V1 Demo 的干净协作基线版本。

本项目用于产品演示、前端交互确认、后续正式开发前的协作基线。当前版本不使用 React，不使用 Next.js；知识库模块已接入本地 Node.js Demo 后端，其余模块仍使用本地 mock 数据和浏览器内状态。

## 如何运行

在本目录执行：

```bash
npm start
```

然后打开：

```text
http://localhost:3000
```

如果只需要静态前端预览，也可以使用任意静态服务器直接打开 `index.html`。静态预览时知识库模块会自动回退到本地 mock 数据。

## 项目结构

```text
JellyAI-V1-Demo-Clean/
├── index.html
├── app.js
├── vercel.json
├── assets/
├── core/
├── data/
├── docs/
├── modules/
├── server/
├── services/
├── storage/
└── styles/
```

## 目录说明

`index.html`：静态入口，按顺序加载拆分后的 CSS 和 JS。

`app.js`：应用启动入口，只负责调用 `render()`。

`assets/`：图片、模板文件等静态资源，例如 JellyAI logo 和知识库导入模板。

`core/`：全局能力，包括状态、路由、Toast、Modal、事件委托和通用工具边界。

`data/`：前端演示数据，按业务模块拆分。

`docs/`：模块后端 TODO、协作说明和后续集成清单。

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

`services/`：前端服务边界。知识库模块优先调用本地后端，不可用时回退到静态演示数据。

`server/`：本地 Node.js Demo 后端，目前承载知识库 CRUD、上传、解析、分段、重建索引和搜索调试 API。

`storage/`：本地运行时数据目录。上传文件和知识库 JSON 数据不会提交到仓库。

## 后续开发规范

1. 新功能优先在对应 `modules/<module>/` 下开发。
2. 演示数据优先放在 `data/`，不要散落在 render 函数里。
3. 公共能力放在 `core/`，不要让模块之间互相直接修改内部逻辑。
4. 当前 `core/events.js` 仍是集中事件委托，后续可逐步迁移到各模块的 `events.js`。
5. 样式新增时优先写入对应模块 CSS 文件，公共样式写入 `styles/components.css` 或 `styles/layout.css`。
6. 接后端 API 时必须先走 `services/` 服务层边界，避免模块直接散落 `fetch`。
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
