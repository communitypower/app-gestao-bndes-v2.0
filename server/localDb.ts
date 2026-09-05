import { createDB } from "mysql-memory-server";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import fs from "fs";
import path from "path";

let memServerInstance: any = null;
let localPool: any = null;
let localDrizzle: ReturnType<typeof drizzle> | null = null;
let initPromise: Promise<ReturnType<typeof drizzle>> | null = null;

export async function initLocalDatabase(): Promise<ReturnType<typeof drizzle>> {
  if (localDrizzle) return localDrizzle;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    console.log("[LocalDB] Initializing embedded in-memory MySQL server...");
    try {
      memServerInstance = await createDB({
        dbName: "estudo_bndes",
      });

      const uri = `mysql://${memServerInstance.username}:@127.0.0.1:${memServerInstance.port}/${memServerInstance.dbName}`;
      process.env.DATABASE_URL = uri;
      console.log(`[LocalDB] MySQL memory instance running on port ${memServerInstance.port}`);

      const connection = await mysql.createConnection({
        host: "127.0.0.1",
        user: memServerInstance.username,
        port: memServerInstance.port,
        database: memServerInstance.dbName,
        password: "",
        multipleStatements: true,
      });

      // 1. Create base users table
      await connection.query(`
        CREATE TABLE IF NOT EXISTS \`users\` (
          \`id\` int AUTO_INCREMENT NOT NULL,
          \`openId\` varchar(64) NOT NULL,
          \`name\` text,
          \`email\` varchar(320),
          \`loginMethod\` varchar(64),
          \`role\` enum('user','admin') NOT NULL DEFAULT 'user',
          \`appRole\` enum('administrador','coordenador','executor') NOT NULL DEFAULT 'executor',
          \`accessStatus\` enum('ativo','revogado') NOT NULL DEFAULT 'ativo',
          \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          \`lastSignedIn\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT \`users_id\` PRIMARY KEY(\`id\`),
          CONSTRAINT \`users_openId_unique\` UNIQUE(\`openId\`)
        );
      `);

      // 2. Pre-create local admin user
      await connection.query(`
        INSERT INTO \`users\` (\`id\`, \`openId\`, \`name\`, \`email\`, \`role\`, \`appRole\`, \`accessStatus\`, \`loginMethod\`)
        VALUES (1, 'local_admin', 'Administrador do Estudo', 'admin@estudo.ufrj.br', 'admin', 'administrador', 'ativo', 'local')
        ON DUPLICATE KEY UPDATE \`name\` = VALUES(\`name\`);
      `);

      // 3. Run migrations with foreign key checks temporarily disabled
      await connection.query("SET FOREIGN_KEY_CHECKS = 0;");

      const drizzleDir = path.resolve(process.cwd(), "drizzle");
      if (fs.existsSync(drizzleDir)) {
        const migrationFiles = fs
          .readdirSync(drizzleDir)
          .filter(
            f =>
              f.endsWith(".sql") &&
              !f.includes("batch") &&
              !f.includes("escopo") &&
              !f.includes("interfaces") &&
              !f.includes("cronograma")
          )
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
                await connection.query(stmt);
              } catch {
                // Ignore individual statement duplicate errors
              }
            }
          } catch (err: any) {
            console.warn(`[LocalDB] Migration ${file} notice:`, err?.message || err);
          }
        }

        // 4. Run auxiliary seed files if present
        const seedFiles = [
          "2026-08-18-interfaces-campo.sql",
          "2026-08-26-cronograma-r1-r2.sql",
        ];

        for (const file of seedFiles) {
          const filePath = path.join(drizzleDir, file);
          if (fs.existsSync(filePath)) {
            try {
              const sqlContent = fs.readFileSync(filePath, "utf-8");
              await connection.query(sqlContent);
            } catch {
              // Ignore auxiliary seed constraint notices
            }
          }
        }
      }

      try {
        await connection.query("ALTER TABLE `team_members` ADD COLUMN `email` varchar(320);");
      } catch {}
      try {
        await connection.query("ALTER TABLE `users` MODIFY COLUMN `appRole` enum('administrador','coordenador','executor') NOT NULL DEFAULT 'executor';");
      } catch {}
      try {
        await connection.query("ALTER TABLE `user_access_provisions` MODIFY COLUMN `appRole` enum('administrador','coordenador','executor') NOT NULL DEFAULT 'executor';");
      } catch {}
      try {
        await connection.query("ALTER TABLE `material_comments` ADD COLUMN `status` enum('aberto','implementado','resolvido') NOT NULL DEFAULT 'aberto';");
      } catch {}
      try {
        await connection.query("ALTER TABLE `material_comments` ADD COLUMN `implementationNote` text;");
      } catch {}
      try {
        await connection.query("ALTER TABLE `material_comments` ADD COLUMN `implementedAt` bigint;");
      } catch {}
      try {
        await connection.query(`
          CREATE TABLE IF NOT EXISTS \`participant_notifications\` (
            \`id\` int AUTO_INCREMENT NOT NULL,
            \`recipientUserId\` int NOT NULL,
            \`recipientMemberId\` int,
            \`actorUserId\` int,
            \`activityId\` int,
            \`materialId\` int,
            \`type\` varchar(64) NOT NULL,
            \`title\` varchar(255) NOT NULL,
            \`message\` text NOT NULL,
            \`actionUrl\` varchar(255),
            \`read\` boolean NOT NULL DEFAULT false,
            \`readAt\` bigint,
            \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT \`participant_notifications_id\` PRIMARY KEY(\`id\`),
            INDEX \`participant_notifications_recipientUser_idx\` (\`recipientUserId\`),
            INDEX \`participant_notifications_read_idx\` (\`read\`),
            INDEX \`participant_notifications_activity_idx\` (\`activityId\`)
          );
        `);
      } catch {}

      await connection.query("SET FOREIGN_KEY_CHECKS = 1;");
      await connection.end();

      localPool = mysql.createPool({
        host: "127.0.0.1",
        user: memServerInstance.username,
        port: memServerInstance.port,
        database: memServerInstance.dbName,
        password: "",
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      localDrizzle = drizzle(localPool);
      try {
        const { ensureSeedData, listSections } = await import("./db");
        await ensureSeedData(localDrizzle);

        // Load full 328 library items from drive-library-import-plan.json if available
        const planPath = path.resolve(process.cwd(), "drive-library-import-plan.json");
        if (fs.existsSync(planPath)) {
          const planData = JSON.parse(fs.readFileSync(planPath, "utf-8"));
          if (Array.isArray(planData.entries) && planData.entries.length > 0) {
            const sections = await listSections();
            const sectionMap = new Map(sections.map(s => [s.code, s.id]));

            const { libraryItems } = await import("../drizzle/schema");
            const { sql } = await import("drizzle-orm");

            const rows = planData.entries.map((entry: any) => ({
              title: entry.title,
              description: entry.description,
              theme: entry.theme,
              sectionId: entry.sectionCode ? (sectionMap.get(entry.sectionCode) ?? null) : null,
              itemType: "link" as const,
              externalUrl: entry.externalUrl,
              fileName: entry.fileName,
              mimeType: entry.mimeType,
              fileSize: entry.fileSize,
              uploadedBy: 1,
            }));

            // Insert in chunks of 50
            for (let i = 0; i < rows.length; i += 50) {
              const chunk = rows.slice(i, i + 50);
              await localDrizzle
                .insert(libraryItems)
                .values(chunk)
                .onDuplicateKeyUpdate({
                  set: {
                    title: sql`VALUES(${libraryItems.title})`,
                    description: sql`VALUES(${libraryItems.description})`,
                    theme: sql`VALUES(${libraryItems.theme})`,
                    sectionId: sql`VALUES(${libraryItems.sectionId})`,
                  },
                });
            }
            console.log(`[LocalDB] Loaded all ${rows.length} library reference items.`);
          }
        }
      } catch (seedErr) {
        console.warn("[LocalDB] Seed notice:", seedErr);
      }
      console.log("[LocalDB] Embedded MySQL database ready.");
      return localDrizzle;
    } catch (err) {
      initPromise = null;
      console.error("[LocalDB] Failed to initialize embedded database:", err);
      throw err;
    }
  })();

  return initPromise;
}

export async function stopLocalDatabase() {
  if (localPool) {
    await localPool.end();
    localPool = null;
  }
  if (memServerInstance) {
    try {
      await memServerInstance.stop();
    } catch {
      // Ignore cleanup error on Windows temp dir
    }
    memServerInstance = null;
  }
  localDrizzle = null;
  initPromise = null;
}
