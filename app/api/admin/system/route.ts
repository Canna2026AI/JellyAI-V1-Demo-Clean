import { count } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireApiPlatformAdmin } from "@/lib/auth/api";
import { getDb } from "@/lib/db";
import { aiModels, tenants, tokenUsageLogs, users } from "@/lib/db/schema";

function envStatus(name: string, fallbackName?: string) {
  return {
    name,
    fallbackName: fallbackName ?? null,
    configured: Boolean(process.env[name] || (fallbackName ? process.env[fallbackName] : "")),
  };
}

export async function GET() {
  const auth = await requireApiPlatformAdmin();
  if (auth.error) return auth.error;

  const db = getDb();
  const [[tenantTotal], [userTotal], [modelTotal], [usageTotal], models] = await Promise.all([
    db.select({ value: count() }).from(tenants),
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(aiModels),
    db.select({ value: count() }).from(tokenUsageLogs),
    db.select().from(aiModels),
  ]);

  return NextResponse.json({
    database: {
      connected: true,
      tenants: Number(tenantTotal.value),
      users: Number(userTotal.value),
      models: Number(modelTotal.value),
      tokenUsageLogs: Number(usageTotal.value),
    },
    env: [
      envStatus("DATABASE_URL"),
      envStatus("SESSION_SECRET", "AUTH_SECRET"),
      envStatus("ADMIN_EMAIL", "SEED_ADMIN_ACCOUNT"),
      envStatus("ADMIN_PASSWORD", "SEED_ADMIN_PASSWORD"),
      envStatus("MODEL_API_KEY", "OPENAI_API_KEY"),
      envStatus("MODEL_BASE_URL"),
      envStatus("NODE_ENV"),
    ],
    modelRuntime: models.map((model) => ({
      id: model.id,
      provider: model.provider,
      displayName: model.displayName,
      modelId: model.modelId,
      baseUrl: model.baseUrl,
      apiKeyEnvName: model.apiKeyEnvName,
      apiKeyConfigured: Boolean(process.env[model.apiKeyEnvName]),
    })),
  });
}
