import fs from "node:fs";
import mysql from "mysql2/promise";

const migrationPath = new URL("../docs/migrations/2026-08-26-cronograma-r1-r2.sql", import.meta.url);
const sql = fs.readFileSync(migrationPath, "utf8");
const executableSql = sql.replace(/--.*$/gm, "");
const connection = await mysql.createConnection({
  uri: process.env.DATABASE_URL,
  multipleStatements: true,
});
try {
  await connection.query(executableSql);
  console.log("Cronograma aplicado em lote transacional.");
} catch (error) {
  throw error;
} finally {
  await connection.end();
}
