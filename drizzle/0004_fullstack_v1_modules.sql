CREATE TABLE IF NOT EXISTS "organizations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "plan" text DEFAULT 'local_demo' NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "customers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "organization_id" uuid,
  "name" text NOT NULL,
  "contact_name" text DEFAULT '' NOT NULL,
  "contact_email" text DEFAULT '' NOT NULL,
  "contact_phone" text DEFAULT '' NOT NULL,
  "source" text DEFAULT 'local_demo' NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "model_configs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid,
  "ai_model_id" uuid,
  "provider" text NOT NULL,
  "display_name" text NOT NULL,
  "model_id" text NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "is_default" boolean DEFAULT false NOT NULL,
  "base_url" text DEFAULT '' NOT NULL,
  "api_key_env_name" text DEFAULT 'MODEL_API_KEY' NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "token_usage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "user_id" uuid,
  "model_config_id" uuid,
  "model_name" text DEFAULT 'local-mock-model' NOT NULL,
  "prompt_tokens" integer DEFAULT 0 NOT NULL,
  "completion_tokens" integer DEFAULT 0 NOT NULL,
  "total_tokens" integer DEFAULT 0 NOT NULL,
  "action" text NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "channels" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "name" text NOT NULL,
  "provider" text NOT NULL,
  "category" text DEFAULT '社交媒体' NOT NULL,
  "status" text DEFAULT '未接入' NOT NULL,
  "account_count" integer DEFAULT 0 NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "config" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "last_sync_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "wecom_accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "channel_id" uuid,
  "name" text NOT NULL,
  "account_id" text NOT NULL,
  "instance_id" text DEFAULT 'local-instance' NOT NULL,
  "status" text DEFAULT '待扫码' NOT NULL,
  "group_name" text DEFAULT '默认小组' NOT NULL,
  "assistant_name" text DEFAULT '未绑定' NOT NULL,
  "message_enabled" boolean DEFAULT false NOT NULL,
  "ai_enabled" boolean DEFAULT false NOT NULL,
  "heartbeat" text DEFAULT '-' NOT NULL,
  "settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "agents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "name" text NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "model" text DEFAULT 'local-mock-model' NOT NULL,
  "prompt" text DEFAULT '' NOT NULL,
  "channel" text DEFAULT '通用' NOT NULL,
  "tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "knowledge_base_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "knowledge_bases" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "name" text NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "kind" text DEFAULT 'multimodal' NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "document_count" integer DEFAULT 0 NOT NULL,
  "vector_count" integer DEFAULT 0 NOT NULL,
  "storage_path" text DEFAULT '' NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "conversations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "customer_name" text NOT NULL,
  "channel" text DEFAULT '企业微信' NOT NULL,
  "status" text DEFAULT 'AI对话' NOT NULL,
  "assigned_to" text DEFAULT 'AI' NOT NULL,
  "agent_id" uuid,
  "last_message" text DEFAULT '' NOT NULL,
  "priority" text DEFAULT 'normal' NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "conversation_id" uuid NOT NULL,
  "sender_type" text NOT NULL,
  "sender_name" text DEFAULT '' NOT NULL,
  "body" text NOT NULL,
  "token_usage_id" uuid,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "knowledge_bases" ADD COLUMN IF NOT EXISTS "tenant_id" uuid;
ALTER TABLE "knowledge_bases" ADD COLUMN IF NOT EXISTS "kind" text DEFAULT 'multimodal' NOT NULL;
ALTER TABLE "knowledge_bases" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'active' NOT NULL;
ALTER TABLE "knowledge_bases" ADD COLUMN IF NOT EXISTS "document_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "knowledge_bases" ADD COLUMN IF NOT EXISTS "vector_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "knowledge_bases" ADD COLUMN IF NOT EXISTS "storage_path" text DEFAULT '' NOT NULL;
ALTER TABLE "knowledge_bases" ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'knowledge_bases'
      AND column_name = 'account_id'
  ) THEN
    ALTER TABLE "knowledge_bases" ALTER COLUMN "account_id" DROP NOT NULL;
  END IF;
END $$;

DO $$ BEGIN
  ALTER TABLE "organizations" ADD CONSTRAINT "organizations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "model_configs" ADD CONSTRAINT "model_configs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "model_configs" ADD CONSTRAINT "model_configs_ai_model_id_ai_models_id_fk" FOREIGN KEY ("ai_model_id") REFERENCES "ai_models"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "token_usage" ADD CONSTRAINT "token_usage_model_config_id_model_configs_id_fk" FOREIGN KEY ("model_config_id") REFERENCES "model_configs"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "channels" ADD CONSTRAINT "channels_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "wecom_accounts" ADD CONSTRAINT "wecom_accounts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "wecom_accounts" ADD CONSTRAINT "wecom_accounts_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "agents" ADD CONSTRAINT "agents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "knowledge_bases" ADD CONSTRAINT "knowledge_bases_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "conversations" ADD CONSTRAINT "conversations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "conversations" ADD CONSTRAINT "conversations_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "messages" ADD CONSTRAINT "messages_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "messages" ADD CONSTRAINT "messages_token_usage_id_token_usage_id_fk" FOREIGN KEY ("token_usage_id") REFERENCES "token_usage"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "organizations_tenant_idx" ON "organizations" ("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "organizations_tenant_slug_idx" ON "organizations" ("tenant_id", "slug");
CREATE INDEX IF NOT EXISTS "organizations_status_idx" ON "organizations" ("status");
CREATE INDEX IF NOT EXISTS "customers_tenant_idx" ON "customers" ("tenant_id");
CREATE INDEX IF NOT EXISTS "customers_organization_idx" ON "customers" ("organization_id");
CREATE INDEX IF NOT EXISTS "customers_status_idx" ON "customers" ("status");
CREATE INDEX IF NOT EXISTS "model_configs_tenant_idx" ON "model_configs" ("tenant_id");
CREATE INDEX IF NOT EXISTS "model_configs_ai_model_idx" ON "model_configs" ("ai_model_id");
CREATE INDEX IF NOT EXISTS "model_configs_provider_model_idx" ON "model_configs" ("provider", "model_id");
CREATE INDEX IF NOT EXISTS "model_configs_status_idx" ON "model_configs" ("status");
CREATE INDEX IF NOT EXISTS "token_usage_tenant_idx" ON "token_usage" ("tenant_id");
CREATE INDEX IF NOT EXISTS "token_usage_user_idx" ON "token_usage" ("user_id");
CREATE INDEX IF NOT EXISTS "token_usage_model_config_idx" ON "token_usage" ("model_config_id");
CREATE INDEX IF NOT EXISTS "token_usage_action_idx" ON "token_usage" ("action");
CREATE INDEX IF NOT EXISTS "channels_tenant_idx" ON "channels" ("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "channels_tenant_provider_idx" ON "channels" ("tenant_id", "provider");
CREATE INDEX IF NOT EXISTS "channels_status_idx" ON "channels" ("status");
CREATE INDEX IF NOT EXISTS "channels_category_idx" ON "channels" ("category");
CREATE INDEX IF NOT EXISTS "wecom_accounts_tenant_idx" ON "wecom_accounts" ("tenant_id");
CREATE INDEX IF NOT EXISTS "wecom_accounts_channel_idx" ON "wecom_accounts" ("channel_id");
CREATE UNIQUE INDEX IF NOT EXISTS "wecom_accounts_tenant_account_idx" ON "wecom_accounts" ("tenant_id", "account_id");
CREATE INDEX IF NOT EXISTS "wecom_accounts_status_idx" ON "wecom_accounts" ("status");
CREATE INDEX IF NOT EXISTS "agents_tenant_idx" ON "agents" ("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "agents_tenant_name_idx" ON "agents" ("tenant_id", "name");
CREATE INDEX IF NOT EXISTS "agents_status_idx" ON "agents" ("status");
CREATE INDEX IF NOT EXISTS "knowledge_bases_tenant_idx" ON "knowledge_bases" ("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "knowledge_bases_tenant_name_idx" ON "knowledge_bases" ("tenant_id", "name");
CREATE INDEX IF NOT EXISTS "knowledge_bases_status_idx" ON "knowledge_bases" ("status");
CREATE INDEX IF NOT EXISTS "conversations_tenant_idx" ON "conversations" ("tenant_id");
CREATE INDEX IF NOT EXISTS "conversations_agent_idx" ON "conversations" ("agent_id");
CREATE INDEX IF NOT EXISTS "conversations_status_idx" ON "conversations" ("status");
CREATE INDEX IF NOT EXISTS "conversations_channel_idx" ON "conversations" ("channel");
CREATE INDEX IF NOT EXISTS "messages_tenant_idx" ON "messages" ("tenant_id");
CREATE INDEX IF NOT EXISTS "messages_conversation_idx" ON "messages" ("conversation_id");
CREATE INDEX IF NOT EXISTS "messages_sender_type_idx" ON "messages" ("sender_type");

INSERT INTO "model_configs" ("ai_model_id", "provider", "display_name", "model_id", "status", "is_default", "base_url", "api_key_env_name", "metadata")
SELECT "id", "provider", "display_name", "model_id", "status", "is_default", "base_url", "api_key_env_name", '{"source":"ai_models_seed"}'::jsonb
FROM "ai_models"
ON CONFLICT DO NOTHING;
