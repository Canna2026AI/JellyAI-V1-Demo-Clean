import { readFile } from "fs/promises";
import path from "path";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });
config();

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run migrations.");
  }

  const migrationFiles = [
    "0001_initial_multitenant.sql",
    "0002_models_and_tokens.sql",
    "0003_model_runtime_config.sql",
    "0004_fullstack_v1_modules.sql",
  ];
  const sql = postgres(databaseUrl, { max: 1, prepare: false });

  try {
    for (const file of migrationFiles) {
      const filePath = path.join(process.cwd(), "drizzle", file);
      const migrationSql = await readFile(filePath, "utf8");
      await sql.unsafe(migrationSql);
      console.log(`Applied migration: ${file}`);
    }
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
