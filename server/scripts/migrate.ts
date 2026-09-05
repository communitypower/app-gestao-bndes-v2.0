import "dotenv/config";
import path from "path";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as schema from "../../drizzle/schema";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[Migration] Error: DATABASE_URL environment variable is not set.");
    process.exit(1);
  }

  console.log(`[Migration] Connecting to PostgreSQL...`);
  const isLocal =
    databaseUrl.includes("localhost") ||
    databaseUrl.includes("127.0.0.1") ||
    databaseUrl.includes("host.docker.internal");

  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
  });

  try {
    const client = drizzle(pool, { schema });
    const drizzleDir = path.resolve(process.cwd(), "drizzle");

    console.log(`[Migration] Running migrations from ${drizzleDir}...`);
    await migrate(client, { migrationsFolder: drizzleDir });
    console.log("[Migration] All migrations applied successfully!");
  } catch (error) {
    console.error("[Migration] Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
