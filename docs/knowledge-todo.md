# Knowledge Backend TODO

The knowledge module is still Mock-only. The frontend now has the workflows and service boundary needed for backend integration, but no real backend calls are made.

## API

- `GET /api/knowledge-bases`
  - Query: `q`, `status`, `sourceType`, `sort`, `page`, `pageSize`
  - Returns: id, name, description, status, enabled, source type, document count, chunk count, embedding status, size, created time, updated time.
- `POST /api/knowledge-bases`
  - Creates a knowledge base for text, website, PDF, Word, Excel, TXT, or CSV.
  - Body: name, description, source type, segmentation mode, cleaning rules, vector mode, tenant id.
- `GET /api/knowledge-bases/:id`
  - Returns detail, documents, chunks, embedding status, size, timestamps, job states, permissions.
- `PATCH /api/knowledge-bases/:id`
  - Edits name, description, enabled state, source metadata, segmentation settings.
- `DELETE /api/knowledge-bases/:id`
  - Deletes metadata and schedules cleanup for documents, object storage, chunks, embeddings, vector indexes.
- `POST /api/knowledge-bases/:id/reindex`
  - Starts an async parse/chunk/embed/index job.
- `GET /api/knowledge-bases/:id/jobs`
  - Lists active and historical parse, OCR, chunk, embedding, and reindex jobs.
- `POST /api/knowledge-bases/:id/documents`
  - Creates a document record from text, website URL, object-storage key, or uploaded file metadata.
- `GET /api/knowledge-bases/:id/documents`
  - Lists documents with parse status, chunk count, error state, updated time.
- `DELETE /api/knowledge-bases/:id/documents/:documentId`
  - Deletes one document and its chunks/embeddings.
- `GET /api/knowledge-bases/:id/chunks`
  - Query: `documentId`, `embeddingStatus`, `q`, `page`, `pageSize`
  - Returns chunk text, source document, token count, embedding status, vector id, updated time.
- `POST /api/chunks/preview`
  - Returns Chunk preview for automatic, custom separator, fixed length, overlap, and row-based modes.
- `POST /api/uploads/presign`
  - Returns object-storage upload URL, headers, upload id, max size, accepted MIME types.
- `GET /api/uploads/:uploadId`
  - Returns upload progress, antivirus status, parse status, errors, final document id.
- `POST /api/knowledge-search/debug`
  - Returns matched chunks, vector scores, rerank scores, final context, source documents, latency breakdown.

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

## Server Jobs

- Website crawl job: URL normalization, sitemap parsing, robots policy, deduplication, rate limiting.
- Document parse job: PDF/Word/Excel/TXT/CSV parsing, table extraction, metadata extraction.
- OCR job: scanned PDF/image detection, OCR queue, confidence score, fallback errors.
- Chunk job: automatic segmentation, custom separator, overlap, row mode, cleaning rules.
- Embedding job: batch embedding, retry, token usage, per-chunk status, vector upsert.
- Reindex job: rebuild chunks and vectors without losing the active searchable version.
- Cleanup job: remove deleted files, chunks, embeddings, vector rows, stale jobs.

## Webhook

- `knowledge.upload.completed`
- `knowledge.upload.failed`
- `knowledge.parse.completed`
- `knowledge.parse.failed`
- `knowledge.embedding.completed`
- `knowledge.embedding.failed`
- `knowledge.reindex.completed`
- `knowledge.reindex.failed`

Each webhook should include tenant id, knowledge base id, document id when relevant, job id, status, error code, and retry count.

## Third-Party SDK

- Embedding provider SDK for batch embeddings and token usage.
- Rerank provider SDK for retrieval reranking.
- OCR provider SDK for scanned PDFs and images.
- Website crawler/render SDK if dynamic pages require headless rendering.
- Object storage SDK such as S3-compatible storage, Cloudflare R2, or Aliyun OSS.
- Vector database SDK for Milvus or pgvector.

## Object Storage

- Store original files by tenant and knowledge base.
- Store parsed intermediate artifacts: extracted text, page images, tables, OCR output.
- Use pre-signed upload URLs with file type and size enforcement.
- Record checksum to avoid duplicate uploads.
- Run lifecycle cleanup for deleted knowledge bases and failed uploads.

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

## Login And Session

- Require authenticated user for all knowledge APIs.
- Session must carry tenant id, user id, roles, and allowed knowledge scopes.
- API should reject cross-tenant object keys and document ids.
- Upload presign must be bound to session and expire quickly.
- Long-running jobs should run under a service identity but preserve original actor id for audit.

## Retrieval

- Hybrid search: keyword + vector.
- Metadata filters: tenant, knowledge base, document type, enabled state.
- Rerank after initial retrieval.
- Return citations with document name, chunk id, page/row when available.
- Track latency and token usage per query.
