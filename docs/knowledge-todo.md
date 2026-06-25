# Knowledge Backend TODO

This frontend is Mock-only. The UI is ready for a backend boundary, but no real backend is called yet.

## Required APIs

- `GET /api/knowledge-bases`
  - Query: `q`, `status`, `sort`, `page`, `pageSize`
  - Returns list items with status, document count, chunk count, embedding status, size, and updated time.
- `POST /api/knowledge-bases`
  - Creates a knowledge base from text, website, PDF, Word, Excel, TXT, or CSV.
- `GET /api/knowledge-bases/:id`
  - Returns detail, documents, chunks, embedding status, size, and timestamps.
- `PATCH /api/knowledge-bases/:id`
  - Edits name, description, enabled state, metadata, and processing settings.
- `DELETE /api/knowledge-bases/:id`
  - Deletes the knowledge base and associated documents/chunks.
- `POST /api/knowledge-bases/:id/reindex`
  - Starts async reindexing.
- `POST /api/knowledge-bases/:id/documents`
  - Uploads documents or registers website/text sources.
- `GET /api/uploads/:uploadId`
  - Returns upload progress, parse status, errors, and final document id.
- `POST /api/chunks/preview`
  - Returns Chunk preview for automatic, custom, and row-based segmentation.

## Backend Capabilities

- Embedding
  - Model selection, batch embedding, retry policy, token accounting, and embedding status per chunk.
- Rerank
  - Rerank model endpoint, score threshold, top-k configuration, and debug traces.
- Object storage
  - Pre-signed upload URLs, file metadata, antivirus scan state, retention policy, and deletion cleanup.
- Milvus
  - Collection schema, vector dimension, metadata filters, index strategy, and reindex migration plan.
- pgvector
  - Table schema, tenant isolation, hybrid search support, and migration strategy.
- OCR
  - Image/PDF OCR pipeline, language detection, confidence score, and manual correction workflow.
- PDF parsing
  - Text/table extraction, page references, layout retention, scanned PDF fallback, and parse errors.
- Chunk
  - Automatic segmentation, custom separators, max length, overlap, row mode, cleaning rules, and preview.

## Operational Requirements

- Async jobs for website crawl, document parse, chunking, embedding, and reindexing.
- Per-tenant quota for storage, documents, chunks, and embedding tokens.
- Audit log for create, edit, delete, enable/disable, upload, and reindex actions.
- Error contract for upload failure, parse failure, OCR failure, embedding failure, and vector DB failure.
- Search debug endpoint that returns matched chunks, scores, rerank scores, and source documents.
