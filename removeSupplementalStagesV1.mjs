import fs from "node:fs";
import mysql from "mysql2/promise";

const auditPath = new URL("../docs/source/auditoria-etapas-suplementares-v1.json", import.meta.url);
const outputPath = new URL("../docs/source/remocao-etapas-suplementares-v1.json", import.meta.url);
const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
const stages = audit.supplementalStages;
const ids = stages.map(stage => stage.id);
const migrationKey = audit.migrationKey;

if (ids.length !== 44) {
  throw new Error(`A remoção exige exatamente 44 etapas suplementares; auditoria encontrou ${ids.length}.`);
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.beginTransaction();
  const [current] = await connection.query(
    "SELECT id, detailCode, title, parentActivityId, sectionId, responsibleId, startAt, dueAt, status, progress FROM activities WHERE id IN (?) ORDER BY id",
    [ids]
  );
  if (current.length !== 44) {
    throw new Error(`A remoção foi interrompida: somente ${current.length} das 44 etapas auditadas ainda estão disponíveis.`);
  }

  const [dependencies] = await connection.query(
    `SELECT
      (SELECT COUNT(*) FROM activity_allocations WHERE activityId IN (?)) AS allocations,
      (SELECT COUNT(*) FROM activity_reviewers WHERE activityId IN (?)) AS reviewers,
      (SELECT COUNT(*) FROM activity_milestones WHERE activityId IN (?)) AS milestones,
      (SELECT COUNT(*) FROM activity_evidence_links WHERE activityId IN (?)) AS evidenceLinks,
      (SELECT COUNT(*) FROM activity_leadership_events WHERE activityId IN (?)) AS leadershipEvents,
      (SELECT COUNT(*) FROM interface_activities WHERE activityId IN (?)) AS interfaceLinks,
      (SELECT COUNT(*) FROM interface_evidence_files WHERE activityId IN (?)) AS interfaceEvidenceFiles,
      (SELECT COUNT(*) FROM production_materials WHERE activityId IN (?)) AS productionMaterials,
      (SELECT COUNT(*) FROM notification_logs WHERE activityId IN (?)) AS notifications`,
    [ids, ids, ids, ids, ids, ids, ids, ids, ids]
  );
  const dependentRecords = Object.values(dependencies[0]).reduce((sum, value) => sum + Number(value), 0);
  if (dependentRecords !== 0) {
    throw new Error(`A remoção foi interrompida: foram encontrados ${dependentRecords} registros dependentes que exigem reconciliação específica.`);
  }

  for (const stage of current) {
    await connection.query(
      "INSERT INTO scope_migration_history (migrationKey, entityType, entityId, action, snapshot) VALUES (?, 'activity', ?, 'removida_por_autorizacao', ?)",
      [migrationKey, stage.id, JSON.stringify({ reason: "Remoção autorizada pelo usuário para manter somente a itemização analítica V1", stage })]
    );
  }
  const [result] = await connection.query("DELETE FROM activities WHERE id IN (?)", [ids]);
  await connection.commit();
  fs.writeFileSync(outputPath, JSON.stringify({ migrationKey, removedCount: result.affectedRows, removedStages: current, dependencies: dependencies[0] }, null, 2), "utf8");
  console.log(`Remoção concluída: ${result.affectedRows} etapas suplementares removidas com ${current.length} snapshots auditáveis.`);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
