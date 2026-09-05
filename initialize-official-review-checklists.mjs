import fs from "node:fs";
import mysql from "mysql2/promise";

const DAY_MS = 24 * 60 * 60 * 1000;
const migrationKey = "2026-08-28-checklists-cronograma-oficial";
const resultPath = new URL("../docs/source/resultado-checklists-cronograma-oficial.json", import.meta.url);
const template = [
  ["seção", "secao_texto_fontes", "Texto, fontes e referências da seção verificados", 21],
  ["seção", "secao_banco_evidencias", "Banco de dados e evidências da seção conferidos", 14],
  ["seção", "secao_interfaces", "Interfaces e escopos sobrepostos da seção tratados", 10],
  ["capítulo", "capitulo_coerencia", "Coerência, integração e aderência ao escopo do capítulo verificadas", 7],
  ["capítulo", "capitulo_encaminhamento", "Encaminhamento ao coordenador do tomo preparado", 2],
];

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.beginTransaction();
  const [administrators] = await connection.query("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1");
  const administratorId = administrators[0]?.id;
  if (!administratorId) throw new Error("Administrador não localizado para registrar a criação dos checklists.");

  const [activities] = await connection.query(
    "SELECT id, planCode, responsibleId, startAt, dueAt FROM activities WHERE parentActivityId IS NULL AND structureStatus = 'canonica' ORDER BY planSortOrder, id"
  );
  if (activities.length !== 30) throw new Error(`Foram encontradas ${activities.length} atividades-mãe canônicas; esperadas 30.`);

  let createdCount = 0;
  const summary = [];
  for (const activity of activities) {
    const deadlines = [];
    for (const [scope, itemKey, title, daysBeforeDue] of template) {
      const calculated = Number(activity.dueAt) - daysBeforeDue * DAY_MS;
      const dueAt = activity.startAt === null ? calculated : Math.max(Number(activity.startAt), calculated);
      const [result] = await connection.query(
        "INSERT IGNORE INTO review_checklist_items (activityId, scope, itemKey, title, responsibleId, dueAt, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [activity.id, scope, itemKey, title, activity.responsibleId, dueAt, administratorId]
      );
      createdCount += Number(result.affectedRows ?? 0);
      deadlines.push({ itemKey, dueAt });
    }
    summary.push({ activityId: activity.id, planCode: activity.planCode, deadlines });
  }
  await connection.commit();
  fs.writeFileSync(resultPath, JSON.stringify({ migrationKey, activityCount: activities.length, createdCount, summary }, null, 2));
  console.log(`Checklists oficiais inicializados: ${createdCount} itens em ${activities.length} capítulos.`);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
