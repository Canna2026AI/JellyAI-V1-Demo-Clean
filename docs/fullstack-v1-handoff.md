# JellyAI Fullstack V1 Handoff

## Branch

- Working branch: `integration/fullstack-v1`
- Base: `main`
- Fullstack foundation: `feature/fullstack-admin-auth`
- Feature assets integrated selectively: `feature/conversations`, `feature/agents`, `feature/channels`, `feature/wecom`, `feature/knowledge`
- `feature/extra-modules` was kept as reference only.

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create local env:
   ```bash
   cp .env.example .env.local
   ```
3. Ensure `DATABASE_URL` points to a local Postgres database.
4. Initialize schema:
   ```bash
   npm run db:migrate
   ```
5. Seed users and demo data:
   ```bash
   npm run db:seed
   ```
6. Start dev server:
   ```bash
   npm run dev
   ```

## Demo Accounts

- Platform admin: `admin@jellyai.local` / `ChangeMe123!`
- Customer app user: `tenant@jellyai.local` / `ChangeMe123!`

## URLs

- Login: `http://localhost:3000/login`
- Admin: `http://localhost:3000/admin`
- Customer overview: `http://localhost:3000/app`
- Customer workspace: `http://localhost:3000/app/workspace?module=conversations`
- Static workspace asset: `http://localhost:3000/workspace/index.html?module=conversations`

## Integrated Capabilities

- Admin/auth/database/multi-tenant foundation from `feature/fullstack-admin-auth`.
- Aggregated conversations from `feature/conversations`: front-end module preserved, local conversations/messages API added, send writes to DB and token usage.
- AI agents from `feature/agents`: front-end list preserved, agents API/table added, seeded logistics assistant.
- Channels from `feature/channels`: channel catalog preserved, channels API/table added, front-end reads local API data.
- WeCom hosting from `feature/wecom`: WeCom management UI preserved, local `wecom_accounts` API/table added, status updates supported through API.
- Knowledge base from `feature/knowledge`: knowledge UI preserved, `knowledge_bases` API/table added, local create/list supported.

## Real Local Data

- Login/session is real and backed by `users` + `sessions`.
- Admin customer/model/token pages are real and backed by Postgres.
- Customer workspace is protected by tenant session.
- Five core modules call same-origin local APIs through `services/fullstackApi.js`.
- Conversation message sending writes `messages`, updates `conversations`, and records token usage.
- Seed creates one demo tenant, one tenant user, model config, token usage, channels, WeCom account, agent, knowledge base, conversation, and messages.

## Backend Tables

Implemented or retained:

- `organizations`
- `users`
- `customers`
- `model_configs`
- `token_usage`
- `channels`
- `wecom_accounts`
- `agents`
- `knowledge_bases`
- `conversations`
- `messages`
- `audit_logs`

Compatibility tables retained from the foundation:

- `tenants`
- `sessions`
- `tenant_records`
- `ai_models`
- `tenant_model_settings`
- `tenant_token_balances`
- `token_usage_logs`
- `token_adjustments`

## API Map

- Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `GET /api/auth/session`
- Bootstrap: `GET /api/app/bootstrap`
- Customers: `GET/POST /api/admin/customers`, `GET/PATCH /api/admin/customers/:id`
- Model configs: `GET/PATCH /api/admin/model-configs`, plus `GET/POST /api/admin/models`, `PATCH /api/admin/models/:id`
- Token usage: `GET /api/admin/token-usage`
- Channels: `GET/POST /api/app/channels`
- WeCom accounts: `GET/PATCH /api/app/wecom/accounts`
- Agents: `GET/POST /api/app/agents`, `GET/PATCH /api/app/agents/:id`
- Knowledge bases: `GET/POST /api/app/knowledge-bases`
- Conversations: `GET/POST /api/app/conversations`, `GET/POST /api/app/conversations/:id/messages`

## Verification Snapshot

- `npm install`: passed
- `npm run lint`: passed
- `npm run build`: passed
- `npm run db:migrate`: passed after adapting to legacy `knowledge_bases`
- `npm run db:seed`: passed
- Table count smoke test: all minimum tables exist and have seed coverage
- `npm run dev`: passed at `http://localhost:3000`
- Browser admin login: passed, `/admin` shows customers, models, token usage, and audit logs
- Browser tenant login: passed, `/app/workspace?module=conversations` opens the customer workspace
- Browser module check: passed for conversations, agents, channels, WeCom, and knowledge
- Browser conversation send: passed, message persisted through local API and displayed token usage
- App console check: no localhost-sourced fatal JS errors; one browser-environment `MutationObserver` error without localhost URL was observed and is not from repo code
- API smoke test: admin and tenant auth plus core V1 endpoints returned HTTP 200
