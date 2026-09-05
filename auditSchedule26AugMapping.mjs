import fs from "node:fs";
import mysql from "mysql2/promise";

const schedulePath = new URL("../docs/source/cronograma-r1-r2-26-agosto-estruturado.json", import.meta.url);
const outputPath = new URL("../docs/source/auditoria-mapeamento-cronograma-26-agosto.json", import.meta.url);
const scheduleItems = JSON.parse(fs.readFileSync(schedulePath, "utf8"));
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.query("SELECT id, detailCode, title, parentActivityId FROM activities WHERE parentActivityId IS NOT NULL");
  const existingByCode = new Map(rows.map((row) => [row.detailCode, row]));
  const scheduleByCode = new Map(scheduleItems.map((item) => [item.detail_code, item]));
  const unmatchedSchedule = scheduleItems.filter((item) => !existingByCode.has(item.detail_code));
  const unmatchedExisting = rows.filter((row) => !scheduleByCode.has(row.detailCode));
  fs.writeFileSync(outputPath, JSON.stringify({
    scheduleCount: scheduleItems.length,
    existingCount: rows.length,
    matchedCount: scheduleItems.length - unmatchedSchedule.length,
    unmatchedSchedule,
    unmatchedExisting,
  }, null, 2), "utf8");
  console.log(`Mapeados ${scheduleItems.length - unmatchedSchedule.length}/${scheduleItems.length}; ausentes no portal: ${unmatchedSchedule.length}; etapas sem período oficial: ${unmatchedExisting.length}.`);
} finally {
  await connection.end();
}
