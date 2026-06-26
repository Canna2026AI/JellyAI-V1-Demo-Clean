ALTER TABLE "ai_models" ADD COLUMN IF NOT EXISTS "base_url" text DEFAULT '' NOT NULL;
ALTER TABLE "ai_models" ADD COLUMN IF NOT EXISTS "api_key_env_name" text DEFAULT 'MODEL_API_KEY' NOT NULL;

UPDATE "ai_models"
SET "base_url" = COALESCE(NULLIF("base_url", ''), 'https://ark.cn-beijing.volces.com/api/v3'),
    "api_key_env_name" = COALESCE(NULLIF("api_key_env_name", ''), 'MODEL_API_KEY'),
    "updated_at" = now()
WHERE "provider" = 'doubao';
