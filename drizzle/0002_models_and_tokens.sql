CREATE TABLE IF NOT EXISTS "ai_models" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "provider" text NOT NULL,
  "display_name" text NOT NULL,
  "model_id" text NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "is_default" boolean DEFAULT false NOT NULL,
  "context_window" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ai_models_provider_model_idx" UNIQUE("provider", "model_id")
);

CREATE TABLE IF NOT EXISTS "tenant_model_settings" (
  "tenant_id" uuid PRIMARY KEY NOT NULL,
  "selected_model_id" uuid,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "tenant_token_balances" (
  "tenant_id" uuid PRIMARY KEY NOT NULL,
  "total_tokens" integer DEFAULT 10000 NOT NULL,
  "used_tokens" integer DEFAULT 0 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "token_usage_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "model_id" uuid,
  "prompt_tokens" integer NOT NULL,
  "completion_tokens" integer NOT NULL,
  "total_tokens" integer NOT NULL,
  "action" text NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "token_adjustments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "actor_user_id" uuid,
  "delta_tokens" integer NOT NULL,
  "reason" text DEFAULT 'manual_adjustment' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "tenant_model_settings" ADD CONSTRAINT "tenant_model_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "tenant_model_settings" ADD CONSTRAINT "tenant_model_settings_selected_model_id_ai_models_id_fk" FOREIGN KEY ("selected_model_id") REFERENCES "ai_models"("id") ON DELETE set null;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "tenant_token_balances" ADD CONSTRAINT "tenant_token_balances_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "token_usage_logs" ADD CONSTRAINT "token_usage_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "token_usage_logs" ADD CONSTRAINT "token_usage_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "token_usage_logs" ADD CONSTRAINT "token_usage_logs_model_id_ai_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "ai_models"("id") ON DELETE set null;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "token_adjustments" ADD CONSTRAINT "token_adjustments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "token_adjustments" ADD CONSTRAINT "token_adjustments_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE set null;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "ai_models_status_idx" ON "ai_models" ("status");
CREATE INDEX IF NOT EXISTS "ai_models_default_idx" ON "ai_models" ("is_default");
CREATE INDEX IF NOT EXISTS "tenant_model_settings_selected_model_idx" ON "tenant_model_settings" ("selected_model_id");
CREATE INDEX IF NOT EXISTS "token_usage_logs_tenant_idx" ON "token_usage_logs" ("tenant_id");
CREATE INDEX IF NOT EXISTS "token_usage_logs_user_idx" ON "token_usage_logs" ("user_id");
CREATE INDEX IF NOT EXISTS "token_usage_logs_model_idx" ON "token_usage_logs" ("model_id");
CREATE INDEX IF NOT EXISTS "token_adjustments_tenant_idx" ON "token_adjustments" ("tenant_id");
CREATE INDEX IF NOT EXISTS "token_adjustments_actor_idx" ON "token_adjustments" ("actor_user_id");

INSERT INTO "ai_models" ("provider", "display_name", "model_id", "status", "is_default", "context_window")
VALUES ('doubao', '豆包 Seed 1.6', 'doubao-seed-1-6', 'active', true, 256000)
ON CONFLICT ("provider", "model_id") DO UPDATE
SET "display_name" = EXCLUDED."display_name",
    "status" = EXCLUDED."status",
    "is_default" = EXCLUDED."is_default",
    "context_window" = EXCLUDED."context_window",
    "updated_at" = now();

INSERT INTO "tenant_token_balances" ("tenant_id", "total_tokens", "used_tokens")
SELECT "id", 10000, 0 FROM "tenants"
ON CONFLICT ("tenant_id") DO NOTHING;

INSERT INTO "tenant_model_settings" ("tenant_id", "selected_model_id")
SELECT t."id", m."id"
FROM "tenants" t
CROSS JOIN LATERAL (
  SELECT "id" FROM "ai_models"
  WHERE "status" = 'active'
  ORDER BY "is_default" DESC, "created_at" ASC
  LIMIT 1
) m
ON CONFLICT ("tenant_id") DO NOTHING;
