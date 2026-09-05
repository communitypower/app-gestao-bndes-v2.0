import fs from "node:fs";
import mysql from "mysql2/promise";

const catalogPath = new URL("../shared/detailedActivityPlan.ts", import.meta.url);
const outputPath = new URL("../docs/source/reconciliacao-itemizacao-analitica-v1.json", import.meta.url);
const source = fs.readFileSync(catalogPath, "utf8");
const canonical = [...source.matchAll(/\{ sectionCode: '([^']+)', detailCode: '([^']+)', detailSortOrder: (\d+), title: '([^']+)' \}/g)]
  .map(([, sectionCode, detailCode, detailSortOrder, title]) => ({ sectionCode, detailCode, detailSortOrder: Number(detailSortOrder), title }));

if (canonical.length !== 286) throw new Error(`Catálogo analítico inválido: esperados 286 subitens, encontrados ${canonical.length}.`);
if (canonical.some(item => item.title.length > 1000)) throw new Error("Há título canônico acima do limite do banco; a reconciliação foi interrompida.");

const migrationKey = "2026-08-27-reconciliacao-itemizacao-analitica-v1";
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.beginTransaction();
  const [sections] = await connection.query("SELECT id, code FROM study_sections");
  const sectionIdByCode = new Map(sections.map(section => [section.code, section.id]));
  const [registered] = await connection.query(
    "SELECT id, detailCode, detailSortOrder, title, sectionId, parentActivityId, description, responsibleId, startAt, dueAt, status, progress FROM activities WHERE parentActivityId IS NOT NULL"
  );
  const byCode = new Map(registered.map(row => [row.detailCode, row]));
  if (registered.length !== canonical.length) throw new Error(`Foram encontradas ${registered.length} etapas; esperadas ${canonical.length}.`);

  const changes = [];
  for (const item of canonical) {
    const current = byCode.get(item.detailCode);
    if (!current) throw new Error(`Subitem canônico ausente: ${item.detailCode}.`);
    const sectionId = sectionIdByCode.get(item.sectionCode);
    if (!sectionId) throw new Error(`Capítulo canônico não encontrado: ${item.sectionCode}.`);
    if (current.title !== item.title || Number(current.detailSortOrder) !== item.detailSortOrder || Number(current.sectionId) !== Number(sectionId)) {
      await connection.query(
        "INSERT IGNORE INTO scope_migration_history (migrationKey, entityType, entityId, action, snapshot) VALUES (?, 'activity', ?, 'reconciliada_indice_analitico', ?)",
        [migrationKey, current.id, JSON.stringify({ before: current, canonical: item })]
      );
      await connection.query(
        "UPDATE activities SET title = ?, sectionId = ?, detailSortOrder = ? WHERE id = ?",
        [item.title, sectionId, item.detailSortOrder, current.id]
      );
      changes.push({ id: current.id, detailCode: item.detailCode, before: { title: current.title, sectionId: current.sectionId, detailSortOrder: current.detailSortOrder }, after: { title: item.title, sectionId, detailSortOrder: item.detailSortOrder } });
    }
  }
  await connection.commit();
  fs.writeFileSync(outputPath, JSON.stringify({ migrationKey, canonicalCount: canonical.length, updatedCount: changes.length, changes }, null, 2), "utf8");
  console.log(`Reconciliação concluída: ${changes.length} subitens atualizados conforme o índice analítico V1.`);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
