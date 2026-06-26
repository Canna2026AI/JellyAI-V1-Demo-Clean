# JellyAI V1 Demo Clean

这是 JellyAI V1 Demo 的干净源码版本。

本项目用于产品演示、前端交互确认、后续正式前端开发前的协作基线。当前前端不使用 React，不使用 Next.js。企业微信托管模块已提供可本地运行的真实后端 API，其他模块仍以静态 Demo 为主。

## 如何运行

纯静态前端仍可直接运行：

```bash
python3 -m http.server 3000
```

然后打开：

```text
http://localhost:3000
```

也可以使用任意静态服务器直接打开 `index.html`。这种方式会使用浏览器本地 mock。

## 企业微信托管后端

在本目录执行：

```bash
cp .env.example .env
npm start
```

然后打开：

```text
http://127.0.0.1:8787
```

后端会同时提供静态前端和 `/api/*`。企业微信托管页面会自动从 `/api/wecom/bootstrap` 加载数据，并将账号、规则、群聊、控制台、侧边栏、日志导出等操作持久化到 `backend/data/wecom-db.json`。

默认本地登录配置在 `.env.example` 中。`JELLY_REQUIRE_AUTH=0` 时前端演示可免登录；生产环境必须设置 `JELLY_REQUIRE_AUTH=1` 并修改 `JELLY_ADMIN_PASSWORD`。

真实企业微信联调需要补齐：

- `WECOM_CORP_ID`
- `WECOM_CORP_SECRET`
- `WECOM_CALLBACK_TOKEN`
- `WECOM_CALLBACK_AES_KEY`
- `WECOM_RPA_WEBHOOK_URL`，用于发送消息、拉群、改群名、群公告等 PC 企业微信托管动作

## 项目结构

```text
JellyAI-V1-Demo-Clean/
├── index.html
├── app.js
├── vercel.json
├── assets/
├── core/
├── data/
├── backend/
├── modules/
└── styles/
```

## 目录说明

`index.html`：静态入口，按顺序加载拆分后的 CSS 和 JS。

`app.js`：应用启动入口，只负责调用 `render()`。

`assets/`：图片、模板文件等静态资源，例如 JellyAI logo 和知识库导入模板。

`core/`：全局能力，包括状态、路由、Toast、Modal、事件委托和通用工具边界。

`data/`：mock 数据，按业务模块拆分。

`backend/`：企业微信托管后端，包含静态托管、REST API、JSON 持久化、登录会话、审计日志、企业微信官方 API 和 RPA Webhook 适配。

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
6. 企业微信托管已接入真实 API 服务层；其他模块需要接 API 时先设计服务层边界。
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
