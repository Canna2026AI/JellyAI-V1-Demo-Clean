# JellyAI Admin Integration Plan

## 1. 是否适合直接并入 JellyAI V1 Demo 主线

暂时不建议直接并入。

当前分支已经是 Next.js 全栈工程，包含认证、数据库、API、后台页面、客户前台、模型配置和 Token 用量统计。JellyAI V1 Demo 主线仍是静态 HTML/CSS/JS 演示项目。直接合并会改变主线的运行方式、部署方式和目录边界，风险较高。

建议先保持 `feature/fullstack-admin-auth` 独立验证，待数据库、登录、API、部署和前台接入方式稳定后，再决定是并入主线还是拆成独立服务。

## 2. 如果并入，需要怎么并

### 前台静态 Demo 如何迁移进 Next.js

1. 保留现有静态 Demo 作为参考版本。
2. 将 `index.html` 中的页面结构拆成 Next.js route/page 和组件。
3. 将 `modules/` 内模块逐步迁移为 React Server/Client Components。
4. 将本地 mock state 改为调用 `/api/app/bootstrap` 和 `/api/app/records`。
5. 每次迁移一个模块，避免一次性重写导致 UI 和交互回归。

### 当前 `index.html` / `modules` / `styles` 如何处理

- `index.html`：保留为 legacy reference，不直接作为生产入口。
- `modules/`：按业务域迁移为 `app/app/*` 或 `components/app/*`。
- `styles/`：先保留原 CSS，再逐步抽取为 Next.js 全局样式或组件样式。
- `public/legacy/`：只作为过渡访问路径，不作为新架构核心。

### 后台路由和前台路由如何区分

- 后台管理：`/admin/*`
- 客户前台：`/app/*`
- 登录：`/login`
- 客户 API：`/api/app/*`
- 平台 API：`/api/admin/*`
- 认证 API：`/api/auth/*`

### API 如何接入前台

前台不允许传入 `tenant_id` 决定权限。所有客户 API 必须通过 session 解析当前用户，并在数据库查询中强制使用当前 `tenant_id`。

首批接入顺序：

1. `/api/app/bootstrap` 获取租户、用户、模块统计、模型、Token 余额。
2. `/api/app/records?module=...` 获取当前模块数据。
3. `/api/app/records` 写入业务记录。
4. `/api/app/chat` 写入对话并消耗 Token。

## 3. 如果不直接并入，建议如何拆

### JellyAI-Web

面向客户使用的前台产品。包含客户工作台、会话、知识库、渠道、AI 智能体等产品界面。

### JellyAI-Admin

平台管理后台。包含客户管理、账号管理、模型管理、Token 用量、系统配置、审计日志。

### JellyAI-Backend

共享后端服务。包含认证、多租户权限、模型调用、Token 计量、数据 API、Webhook 和任务队列。

如果项目规模继续扩大，推荐拆成 monorepo：

```text
apps/web
apps/admin
apps/api
packages/db
packages/auth
packages/ui
```

## 4. Token / 用量 / 客户 / 模型 / 多租户数据如何给前台调用

前台只调用 tenant-scoped API：

- `GET /api/app/bootstrap`
- `POST /api/app/chat`
- `GET /api/app/records`
- `POST /api/app/records`
- `PATCH /api/app/records/:id`
- `DELETE /api/app/records/:id`

服务端根据 session 得到：

- `user.id`
- `user.tenantId`
- `user.role`
- `tenant.status`

数据库查询必须包含 `tenant_id = currentUser.tenantId`。前台不能提交任意 `tenant_id` 来读取或写入数据。

模型配置流程：

1. 管理员在 `/admin/models` 创建或启用模型。
2. 管理员在客户详情页选择客户默认模型，或客户在 `/app` 选择可用模型。
3. `/api/app/bootstrap` 返回当前租户可用模型和已选模型。
4. `/api/app/chat` 使用当前租户选择的模型写入用量记录。

Token 流程：

1. 管理员给客户分配 `tenant_token_balances.total_tokens`。
2. 客户调用对话接口时，服务端估算或读取模型返回的 Token。
3. 服务端写入 `token_usage_logs`。
4. 服务端累加 `tenant_token_balances.used_tokens`。
5. 前台从 `/api/app/bootstrap` 获取剩余额度。

## 5. 前台马上需要的 API

- `GET /api/app/bootstrap`
- `GET /api/app/records?module=conversation`
- `GET /api/app/records?module=assistant`
- `GET /api/app/records?module=knowledge_base`
- `GET /api/app/records?module=channel`
- `POST /api/app/chat`
- `POST /api/app/records`

这些 API 足够支撑静态 Demo 的核心模块从 mock state 迁移到真实租户数据。

## 6. 后续再做的 API

- 文件上传和知识库向量化 API
- 企业微信 OAuth / 托管账号绑定 API
- 真实模型调用 API streaming
- 模型供应商健康检查 API
- Token 账单和充值流水 API
- 客户套餐、订阅、支付 API
- Webhook 接收和任务队列 API
- 更细粒度 RBAC 权限 API
- 专用业务表 API，例如 conversations、assistants、knowledge documents、channels
