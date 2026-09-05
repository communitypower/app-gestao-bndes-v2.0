import fs from "node:fs";
import mysql from "mysql2/promise";

const auditPath = new URL("../docs/source/auditoria-mapeamento-cronograma-26-agosto.json", import.meta.url);
const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
const months = [
  [1787281200000, 1792551599000], [1789959600000, 1795229999000],
  [1792551600000, 1797821999000], [1795230000000, 1800500399000],
  [1797822000000, 1803092399000], [1800500400000, 1805770799000],
  [1803092400000, 1808362799000], [1805770800000, 1811041199000],
];
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.beginTransaction();
  let created = 0;
  for (const item of audit.unmatchedSchedule) {
    const sectionCode = item.detail_code.split(".").slice(0, 2).join(".");
    const [parents] = await connection.query(
      `SELECT a.id, a.responsibleId, a.sectionId FROM activities a JOIN study_sections s ON s.id = a.sectionId WHERE s.code = ? AND a.parentActivityId IS NULL ORDER BY a.planSortOrder LIMIT 1`,
      [sectionCode],
    );
    if (!parents.length) throw new Error(`Atividade-mãe não localizada para ${item.detail_code}`);
    const parent = parents[0];
    const [startAt] = months[item.start_month - 1];
    const [, dueAt] = months[item.end_month - 1];
    await connection.query(
      `INSERT INTO activities (parentActivityId, detailCode, detailSortOrder, title, description, planningSummary, sourceBase, sectionId, responsibleId, startAt, dueAt, status, progress) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente', 0)`,
      [parent.id, item.detail_code, item.subitem, item.title.slice(0, 260), item.title, `Etapa prevista no cronograma de 26 de agosto de 2026, meses ${item.start_month} a ${item.end_month}.`, "Cronograma-R1-e-R2-26_agosto.xlsm", parent.sectionId, parent.responsibleId, startAt, dueAt],
    );
    created += 1;
  }
  await connection.commit();
  console.log(`Criadas ${created} etapas previstas no cronograma.`);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
