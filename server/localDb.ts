import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import fs from "fs";
import path from "path";
import * as schema from "../drizzle/schema";

let pgliteClient: PGlite | null = null;
let localDrizzle: any = null;
let initPromise: Promise<any> | null = null;

export async function initLocalDatabase(): Promise<any> {
  if (localDrizzle) return localDrizzle;
  if (initPromise) return initPromise;

  if (process.env.NODE_ENV === "production") {
    throw new Error("[Database] DATABASE_URL is required in production environment. Embedded database fallback is disabled.");
  }

  initPromise = (async () => {
    console.log("[LocalDB] Initializing embedded in-memory PostgreSQL (PGlite)...");
    try {
      pgliteClient = new PGlite();
      localDrizzle = drizzle(pgliteClient, { schema });

      // 1. Run migrations from drizzle folder
      const drizzleDir = path.resolve(process.cwd(), "drizzle");
      if (fs.existsSync(drizzleDir)) {
        const migrationFiles = fs
          .readdirSync(drizzleDir)
          .filter(f => f.endsWith(".sql"))
          .sort();

        for (const file of migrationFiles) {
          try {
            const content = fs.readFileSync(path.join(drizzleDir, file), "utf-8");
            const statements = content
              .split("--> statement-breakpoint")
              .map(s => s.trim())
              .filter(Boolean);

            for (const stmt of statements) {
              try {
                await pgliteClient.exec(stmt);
              } catch (err: any) {
                // Ignore type/table already exists error if re-running
                if (!err?.message?.includes("already exists")) {
                  console.warn(`[LocalDB] Migration ${file} notice:`, err?.message || err);
                }
              }
            }
          } catch (err: any) {
            console.warn(`[LocalDB] Migration ${file} execution error:`, err?.message || err);
          }
        }
      }

      // 2. Pre-create local admin user safely
      try {
        const adminCheck: any = await pgliteClient.query(`SELECT id FROM users WHERE "openId" = 'local_admin' LIMIT 1;`);
        if (!adminCheck.rows || adminCheck.rows.length === 0) {
          await pgliteClient.exec(`
            INSERT INTO users ("openId", "name", "email", "role", "appRole", "accessStatus", "loginMethod")
            VALUES ('local_admin', 'Administrador do Estudo', 'admin@estudo.ufrj.br', 'admin', 'administrador', 'ativo', 'local');
          `);
        }
      } catch (adminErr: any) {
        console.warn("[LocalDB] Notice pre-creating admin user:", adminErr?.message || adminErr);
      }

      // 3. Ensure seed data (sections, groups, members, activities, interfaces, library items)
      try {
        const { ensureSeedData } = await import("./db");
        await ensureSeedData(localDrizzle);
      } catch (seedErr) {
        console.warn("[LocalDB] Seed notice:", seedErr);
      }

      console.log("[LocalDB] Embedded PostgreSQL database ready.");
      return localDrizzle;
    } catch (err) {
      initPromise = null;
      console.error("[LocalDB] Failed to initialize embedded PostgreSQL database:", err);
      throw err;
    }
  })();

  return initPromise;
}

export async function stopLocalDatabase() {
  if (pgliteClient) {
    await pgliteClient.close();
    pgliteClient = null;
  }
  localDrizzle = null;
  initPromise = null;
}
