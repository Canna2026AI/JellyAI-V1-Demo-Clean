# JellyAI Admin Fullstack Foundation

This branch contains the Next.js fullstack management foundation for JellyAI. It is not the static V1 Demo mainline. It adds platform admin, tenant login, API routes, Drizzle/Postgres schema, model configuration, token quota, and usage accounting.

## Project Positioning

- Platform admins create customers, tenant users, model configs, and token quotas.
- Tenant users log in to `/app` and can only access data from their own tenant.
- Token usage is persisted per tenant/user/model.
- The original static Demo files remain in the repo and should not be deleted or force-migrated in this branch.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Drizzle ORM
- PostgreSQL
- bcryptjs password hashing
- Database-backed session + `httpOnly` cookie

## Directory Structure

```text
app/                      Next.js pages, layouts, Server Actions, API routes
app/admin/                Platform admin pages
app/app/                  Tenant user workspace
app/api/auth/             Login/logout/me APIs
app/api/app/              Tenant-scoped APIs
app/api/admin/            Platform admin APIs
components/               Shared client components
lib/auth/                 Auth/session/API guard helpers
lib/db/                   Drizzle client and schema
lib/tokens.ts             Token estimation, balance, usage helpers
lib/validators.ts         Zod validators
drizzle/                  SQL migrations
scripts/migrate.ts        Local migration runner
scripts/seed-admin.ts     Platform admin seed script
```

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Required:

```bash
DATABASE_URL="postgres://postgres:postgres@localhost:5432/jellyai"
SESSION_SECRET="replace-with-a-long-random-session-secret"
ADMIN_EMAIL="admin@jellyai.local"
ADMIN_PASSWORD="ChangeMe123!"
MODEL_API_KEY=""
MODEL_BASE_URL="https://api.openai.com/v1"
NODE_ENV="development"
```

Compatibility aliases are still accepted:

```bash
AUTH_SECRET=""
SEED_ADMIN_ACCOUNT=""
SEED_ADMIN_PASSWORD=""
OPENAI_API_KEY=""
```

## Install

```bash
npm install
```

## Initialize Database

The current implementation requires PostgreSQL. SQLite is not implemented in this branch.

Run all SQL migrations:

```bash
npm run db:migrate
```

Create or update the platform admin:

```bash
npm run db:seed
```

## Start

```bash
npm run dev
```

Open:

```text
http://localhost:3000/login
```

If port 3000 is already used, Next.js will ask or select another port.

## Login

Use the account from `.env.local`:

```text
ADMIN_EMAIL
ADMIN_PASSWORD
```

Tenant accounts are created by the platform admin from `/admin/customers` or through the admin API.

## Pages

- `/login` - account/password login
- `/admin` - dashboard
- `/admin/customers` - customer list and customer creation
- `/admin/customers/[id]` - customer detail, users, model selection, token adjustment
- `/admin/models` - model configuration and model-level usage
- `/admin/system` - environment/database/model runtime status
- `/app` - tenant workspace

## API List

Auth:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Tenant:

- `GET /api/app/bootstrap`
- `POST /api/app/chat`
- `GET /api/app/records`
- `POST /api/app/records`
- `PATCH /api/app/records/:id`
- `DELETE /api/app/records/:id`

Admin:

- `GET /api/admin/customers`
- `POST /api/admin/customers`
- `GET /api/admin/customers/:id`
- `PATCH /api/admin/customers/:id`
- `POST /api/admin/customers/:id/users`
- `POST /api/admin/customers/:id/tokens`
- `GET /api/admin/models`
- `POST /api/admin/models`
- `PATCH /api/admin/models/:id`
- `GET /api/admin/token-usage`
- `GET /api/admin/system`

## Current Data Model

- `tenants` - customers/organizations
- `users` - platform admins and tenant users
- `sessions` - database sessions
- `tenant_records` - first-version tenant business data
- `ai_models` - platform model configs
- `tenant_model_settings` - selected model per tenant
- `tenant_token_balances` - tenant token quota and used tokens
- `token_usage_logs` - token usage events
- `token_adjustments` - admin token quota changes
- `audit_logs` - important admin/auth actions

## Verification

```bash
npm run lint
npm run build
```

For local API flow verification:

1. Start dev server.
2. Log in as platform admin.
3. Create a customer.
4. Create a tenant user.
5. Log in as tenant user.
6. Send a message from `/app`.
7. Confirm `tenant_token_balances.used_tokens` and `token_usage_logs` changed.

## Known TODO

- Real model provider calls are not wired yet; `/api/app/chat` persists a message and estimates token usage.
- Token usage currently uses a deterministic local estimator until provider `usage` fields are connected.
- `tenant_records.payload` is intentionally generic for V1; high-frequency modules should later get dedicated tables.
- SQLite local mode is not implemented; this branch currently requires PostgreSQL.
- API key values are not stored in DB. Model rows store `apiKeyEnvName`, and secrets must live in `.env.local` or deployment secrets.
- Static V1 Demo is still separate. A planned migration should move static modules into Next.js routes/components deliberately.
