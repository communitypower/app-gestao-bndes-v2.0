import fs from "node:fs";
import mysql from "mysql2/promise";

const catalogPath = new URL("../shared/detailedActivityPlan.ts", import.meta.url);
const outputPath = new URL("../docs/source/auditoria-etapas-suplementares-v1.json", import.meta.url);
const catalogSource = fs.readFileSync(catalogPath, "utf8");
const canonicalCodes = new Set(
  [...catalogSource.matchAll(/detailCode:\s*'([^']+)'/g)].map(match => match[1])
);

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [stages] = await connection.query(
    "SELECT id, detailCode, title, parentActivityId, sectionId, responsibleId, startAt, dueAt, status, progress FROM activities WHERE parentActivityId IS NOT NULL ORDER BY sectionId, parentActivityId, detailSortOrder"
  );
  const supplementalStages = stages.filter(stage => !canonicalCodes.has(stage.detailCode));
  const ids = supplementalStages.map(stage => stage.id);
  const summary = {};
  if (ids.length > 0) {
    const [counts] = await connection.query(
      `SELECT
        (SELECT COUNT(*) FROM activity_allocations WHERE activityId IN (?)) AS allocations,
        (SELECT COUNT(*) FROM activity_reviewers WHERE activityId IN (?)) AS reviewers,
        (SELECT COUNT(*) FROM activity_milestones WHERE activityId IN (?)) AS milestones,
        (SELECT COUNT(*) FROM activity_evidence_links WHERE activityId IN (?)) AS evidenceLinks,
        (SELECT COUNT(*) FROM interface_activities WHERE activityId IN (?)) AS interfaceLinks,
        (SELECT COUNT(*) FROM interface_evidence_files WHERE activityId IN (?)) AS interfaceEvidenceFiles,
        (SELECT COUNT(*) FROM production_materials WHERE activityId IN (?)) AS productionMaterials,
        (SELECT COUNT(*) FROM review_submissions WHERE activityId IN (SELECT id FROM production_materials WHERE activityId IN (?))) AS reviewSubmissions`,
      [ids, ids, ids, ids, ids, ids, ids, ids]
    );
    Object.assign(summary, counts[0]);
  }
  const report = {
    migrationKey: "2026-08-27-remocao-etapas-suplementares-autorizada",
    canonicalStageCount: canonicalCodes.size,
    registeredChildStageCount: stages.length,
    supplementalStageCount: supplementalStages.length,
    supplementalStages,
    dependentRecordCounts: summary,
  };
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`Etapas analíticas canônicas: ${canonicalCodes.size}; etapas suplementares identificadas: ${supplementalStages.length}.`);
} finally {
  await connection.end();
}
