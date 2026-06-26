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
6. Start both local sites:
   ```bash
   npm run dev
   ```
   This starts the admin/API site and the customer front site together. For single-site debugging:
   ```bash
   npm run dev:admin
   npm run dev:front
   ```

## Demo Accounts

- Platform admin: `admin@jellyai.local` / `ChangeMe123!`
- Customer app user: `tenant@jellyai.local` / `ChangeMe123!`

## URLs

- Admin/API login: `http://localhost:3000/login`
- Admin console: `http://localhost:3000/admin`
- Customer front login: `http://127.0.0.1:3001/login`
- Customer front workspace: `http://127.0.0.1:3001/?module=conversations`
- Compatibility redirects: `http://localhost:3000/app` and `http://localhost:3000/app/workspace?module=conversations` redirect to the customer front site.

## Integrated Capabilities

- Admin/auth/database/multi-tenant foundation from `feature/fullstack-admin-auth`.
- Aggregated conversations from `feature/conversations`: latest front-end module/service assets re-applied, local conversations/messages API connected, send writes to DB and token usage.
- AI agents from `feature/agents`: latest front-end module/service assets re-applied, agents API/table connected for list/detail/create/update, seeded logistics assistant.
- Channels from `feature/channels`: latest channel catalog/service/UI re-applied, channels API/table connected for list, local mock account saves for missing account CRUD.
- WeCom hosting from `feature/wecom`: latest management UI/service assets re-applied, local `wecom_accounts` API/table connected for account list/status/settings patch, richer RPA state remains mock.
- Knowledge base from `feature/knowledge`: latest knowledge UI/service assets re-applied, `knowledge_bases` API/table connected for list/create, upload/vector/index operations remain mock.

## Real Local Data

- Login/session is real and backed by `users` + `sessions`.
- Admin customer/model/token pages are real and backed by Postgres.
- Admin/API and customer front are separate local sites: `localhost:3000` for Next admin/API, `127.0.0.1:3001` for the customer front static site.
- Customer front is protected by the tenant session through the customer-web proxy.
- Five core modules call local APIs through dedicated feature service adapters; `services/fullstackApi.js` is now only a bootstrap/API health probe and no longer rewrites module data.
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
- `npm run lint`: passed with no warnings
- `npm run build`: passed
- `npm run db:migrate`: passed; existing-table PostgreSQL notices are expected on an already-initialized local DB
- `npm run db:seed`: passed
- Minimum table smoke test: all required tables exist; seeded/local counts include organizations 1, users 2, customers 2, model_configs 3, token_usage 5, channels 2, wecom_accounts 1, agents 1, knowledge_bases 1, conversations 1, messages 10, audit_logs 17
- `npm run dev`: passed; admin/API at `http://localhost:3000`, customer front at `http://127.0.0.1:3001`
- Browser admin login: passed; `/admin`, `/admin/customers`, `/admin/models`, and `/admin/system` opened and showed admin shell/content
- Browser tenant login: passed; `http://127.0.0.1:3001/login` redirected to `http://127.0.0.1:3001/?module=conversations`
- Browser module check: passed for conversations, agents, channels, WeCom, and knowledge on the customer front site
- Browser console check: no localhost/127.0.0.1 sourced error/warn entries
- API smoke test: passed for admin login, tenant login through customer-web proxy, bootstrap, channels, WeCom accounts, agents, knowledge bases, conversations, and conversation message send
