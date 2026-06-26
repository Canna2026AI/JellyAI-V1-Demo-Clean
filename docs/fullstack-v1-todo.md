# JellyAI Fullstack V1 TODO

## Temporary Local Mocks

- Real model inference is not connected yet. Conversation send uses local token estimation and a mock assistant reply until `MODEL_API_KEY` and provider runtime are wired.
- WeCom real hosting is not connected yet. Current API stores account status/settings locally; RPA heartbeat, QR login, webhook ingest, and message sync workers still need implementation.
- Vector search is not connected yet. `knowledge_bases` records document/vector counts locally; real embedding pipeline and vector database remain TODO.
- Object storage is not connected yet. Knowledge upload paths are local placeholders until bucket credentials and upload pipeline are added.

## Backend Follow-Ups

- Unify `ai_models` and `model_configs` after demo validation. V1 keeps both so existing admin pages continue to run.
- Replace legacy `tenant_records` module statistics with direct table counts once module pages are fully React/API based.
- Add stricter zod validation to every V1 module API.
- Add migrations for production-grade job/task tables for WeCom sync, webhook replay, vector indexing, and object upload status.
- Add API pagination, search, and audit coverage for all module list endpoints.

## Frontend Follow-Ups

- Convert the static workspace iframe into native Next/React routes once today’s demo surface is stable.
- Add loading/error indicators inside each module rather than relying only on the global fullstack API adapter.
- Persist WeCom UI toggle actions directly through `PATCH /api/app/wecom/accounts`.
- Wire knowledge upload/create wizard to `POST /api/app/knowledge-bases`.
- Expand agent detail editing to call `PATCH /api/app/agents/:id`.

## Testing Follow-Ups

- Add unit tests for seed idempotency and API tenant isolation.
- Add Playwright tests for admin login, tenant login, five workspace modules, and message send.
- Add migration regression test for legacy `knowledge_bases` table compatibility.
