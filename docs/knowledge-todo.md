# Knowledge Backend TODO

The knowledge module now has a local demo backend implemented with Node.js, JSON persistence, file upload storage, text extraction, chunking, reindexing, search debug, and CRUD APIs. This document tracks what is already available locally and what must still be implemented for a production backend.

## Local Demo Backend

- `GET /api/health`
  - Checks that the local backend is running.
- `GET /api/knowledge-bases`
  - Supports `q`, `status`, `sourceType`, `sort`, `page`, and `pageSize`.
- `POST /api/knowledge-bases`
  - Creates text, website, PDF, Word, Excel, TXT, CSV, JSON, Markdown, and HTML knowledge bases.
- `GET /api/knowledge-bases/:id`
  - Returns detail, documents, chunks, size, timestamps, enabled state, and embedding state.
- `PATCH /api/knowledge-bases/:id`
  - Updates name, description, and enabled state.
- `DELETE /api/knowledge-bases/:id`
  - Deletes metadata and local uploaded files.
- `POST /api/knowledge-bases/:id/reindex`
  - Rebuilds chunks and marks embeddings complete.
- `GET /api/knowledge-bases/:id/documents`
  - Lists local documents.
- `POST /api/knowledge-bases/:id/documents`
  - Adds a document to an existing knowledge base.
- `DELETE /api/knowledge-bases/:id/documents/:documentId`
  - Deletes one document and recalculates counters.
- `GET /api/knowledge-bases/:id/chunks`
  - Lists chunks with optional `documentId`, `q`, `page`, and `pageSize`.
- `POST /api/chunks/preview`
  - Returns chunk preview for current text and segmentation parameters.
- `GET /api/knowledge-search/debug`
  - Returns local keyword search matches with source citations.
- `POST /api/knowledge-search/debug`
  - Same as GET, useful for larger debug payloads.

## API

- Add tenant-aware auth middleware to every endpoint.
- Add `GET /api/knowledge-bases/:id/jobs` for parse, crawl, chunk, embedding, reindex, and cleanup jobs.
- Add `POST /api/uploads/presign` for direct object-storage upload.
- Add `GET /api/uploads/:uploadId` for upload progress, antivirus status, parse status, and errors.
- Add `POST /api/knowledge-search` for production retrieval with hybrid keyword/vector search.
- Add `GET /api/knowledge-bases/:id/audit-logs` for customer-visible operation history.
- Add pagination and filtering for documents, chunks, jobs, and audit logs.

## Database

- `knowledge_bases`
  - tenant_id, owner_id, name, description, source_type, status, enabled, document_count, chunk_count, embedding_status, size_bytes.
- `knowledge_documents`
  - knowledge_base_id, object_key, source_url, mime_type, parse_status, parse_error, size_bytes, checksum, page_count.
- `knowledge_chunks`
  - document_id, text, normalized_text, token_count, chunk_index, metadata_json, embedding_status, vector_id.
- `knowledge_jobs`
  - job_type, status, progress, input_json, output_json, error_code, error_message, started_at, finished_at.
- `knowledge_permissions`
  - knowledge_base_id, principal_type, principal_id, role, created_by.
- `knowledge_audit_logs`
  - action, actor_id, tenant_id, target_id, before_json, after_json, ip, user_agent.

## Server

- Move local JSON persistence to a real database with migrations.
- Split upload, parse, chunk, embedding, retrieval, audit, and permission services.
- Add request validation, typed error codes, rate limiting, and structured logs.
- Add job workers for website crawl, document parse, OCR, chunking, embedding, reindex, and cleanup.
- Add idempotency keys for create, upload, delete, and reindex operations.
- Add tenant isolation checks to every read and mutation.

## Webhook

- `knowledge.upload.completed`
- `knowledge.upload.failed`
- `knowledge.parse.completed`
- `knowledge.parse.failed`
- `knowledge.embedding.completed`
- `knowledge.embedding.failed`
- `knowledge.reindex.completed`
- `knowledge.reindex.failed`
- `knowledge.document.deleted`
- `knowledge.permission.changed`

Each webhook should include tenant id, knowledge base id, document id when relevant, job id, status, error code, retry count, and timestamp.

## Third-Party SDK

- Embedding provider SDK for batch embeddings and token usage.
- Rerank provider SDK for retrieval reranking.
- OCR provider SDK for scanned PDFs and images.
- Website crawler/render SDK for dynamic pages.
- Object storage SDK such as S3-compatible storage, Cloudflare R2, or Aliyun OSS.
- Vector database SDK such as pgvector, Milvus, Qdrant, or Pinecone.
- Antivirus or file safety scanning SDK for uploads.

## Object Storage

- Store original files by tenant and knowledge base.
- Store parsed artifacts: extracted text, page images, tables, OCR output, and parser metadata.
- Use pre-signed upload URLs with MIME type and size enforcement.
- Record checksum to avoid duplicate uploads.
- Add lifecycle cleanup for deleted knowledge bases, deleted documents, failed uploads, and stale parse artifacts.

## Redis

- Upload progress cache.
- Job queue and retry state.
- Crawl dedupe set.
- Rate limits for upload, preview, crawl, embedding, and debug search.
- Short-lived search debug traces.
- Distributed locks for reindex and cleanup jobs.

## Permissions

- Roles: owner, admin, editor, viewer.
- Tenant isolation required on every API.
- Editors can create, upload, edit, enable/disable, and reindex.
- Admins can delete and manage permissions.
- Viewers can read list/detail and use search, but cannot mutate.
- Audit every create, edit, delete, upload, enable/disable, reindex, and permission change.

## Login

- Require authenticated user for all production knowledge APIs.
- Session must carry tenant id, user id, roles, and allowed knowledge scopes.
- API should reject cross-tenant object keys and document ids.
- Upload presign must be bound to session and expire quickly.
- Long-running jobs should run under a service identity while preserving the original actor id for audit.

## Retrieval

- Hybrid search: keyword + vector.
- Metadata filters: tenant, knowledge base, document type, enabled state.
- Rerank after initial retrieval.
- Return citations with document name, chunk id, page/row when available.
- Track latency, token usage, matched chunk ids, and rerank decisions per query.
