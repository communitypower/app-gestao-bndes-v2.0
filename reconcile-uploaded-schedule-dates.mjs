import { readFile, writeFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const migrationKey = "2026-08-30-reconciliacao-datas-cronograma-26-agosto";
const sourceDocument = "Cronograma-R1-e-R2-26_agosto.xlsm, encaminhado ao BNDES em 26/08/2026";
const schedulePath = "/home/ubuntu/estudo-bndes-gestao/docs/source/cronograma-r1-r2-26-agosto-upload-2026-08-30-estruturado.json";
const outputPath = "/home/ubuntu/estudo-bndes-gestao/docs/source/resultado-reconciliacao-datas-cronograma-26-agosto-2026.json";
const portalToScheduleDetailCode = new Map([
  ["II.2.1", "II.2.2"], ["II.2.2", "II.2.3"], ["II.2.3", "II.2.4"], ["II.2.4", "II.2.5"], ["II.2.5", "II.2.6"],
  ["II.2.6", "II.2.7"], ["II.2.7", "II.2.8"], ["II.2.8", "II.2.9"], ["II.2.9", "II.2.10"], ["II.2.10", "II.2.11"],
  ["II.4.1", "II.4.2"], ["II.4.2", "II.4.3"], ["II.4.3", "II.4.4"], ["II.4.4", "II.4.5"], ["II.4.5", "II.4.6"], ["II.4.6", "II.4.7"],
]);
const monthRanges = [
  ["2026-08-21", "2026-09-20"], ["2026-09-21", "2026-10-20"], ["2026-10-21", "2026-11-20"], ["2026-11-21", "2026-12-20"],
  ["2026-12-21", "2027-01-20"], ["2027-01-21", "2027-02-20"], ["2027-02-21", "2027-03-20"], ["2027-03-21", "2027-04-20"],
];

function timestampAtSaoPaulo(dateText, endOfDay) {
  return Date.parse(`${dateText}T${endOfDay ? "23:59:59" : "00:00:00"}-03:00`);
}

function businessDate(value) {
  if (value === null || value === undefined) return null;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Number(value)));
}

const schedule = JSON.parse(await readFile(schedulePath, "utf8"));
const expectedBySourceCode = new Map(schedule.map(item => [item.detail_code, {
  startDate: monthRanges[item.start_month - 1][0],
  dueDate: monthRanges[item.end_month - 1][1],
  startMonth: item.start_month,
  endMonth: item.end_month,
}]));

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const result = { migrationKey, sourceDocument, correctedStages: [], recalculatedParents: [] };

try {
  await connection.beginTransaction();
  const [stages] = await connection.execute(
    "SELECT id, parentActivityId, detailCode, title, startAt, dueAt FROM activities WHERE structureStatus = 'canonica' AND parentActivityId IS NOT NULL"
  );

  for (const stage of stages) {
    const sourceCode = portalToScheduleDetailCode.get(stage.detailCode) ?? stage.detailCode;
    const expected = expectedBySourceCode.get(sourceCode);
    if (!expected) throw new Error(`Etapa canônica sem correspondência no cronograma: ${stage.detailCode}`);
    const actualStartDate = businessDate(stage.startAt);
    const actualDueDate = businessDate(stage.dueAt);
    if (actualStartDate === expected.startDate && actualDueDate === expected.dueDate) continue;

    const before = { startAt: stage.startAt, dueAt: stage.dueAt, startDate: actualStartDate, dueDate: actualDueDate };
    const after = {
      startAt: timestampAtSaoPaulo(expected.startDate, false),
      dueAt: timestampAtSaoPaulo(expected.dueDate, true),
      startDate: expected.startDate,
      dueDate: expected.dueDate,
    };
    await connection.execute("UPDATE activities SET startAt = ?, dueAt = ? WHERE id = ?", [after.startAt, after.dueAt, stage.id]);
    await connection.execute(
      "INSERT INTO scope_migration_history (migrationKey, entityType, entityId, action, snapshot) VALUES (?, 'activity', ?, 'datas_reconciliadas_cronograma_26_agosto', ?)",
      [migrationKey, stage.id, JSON.stringify({ before, after, detailCode: stage.detailCode, sourceCode, sourceDocument })]
    );
    result.correctedStages.push({ id: stage.id, detailCode: stage.detailCode, sourceCode, before, after });
  }

  const [parentsBefore] = await connection.execute(
    "SELECT id, planCode, startAt, dueAt FROM activities WHERE structureStatus = 'canonica' AND parentActivityId IS NULL"
  );
  const [parentDates] = await connection.execute(
    "SELECT parentActivityId, MIN(startAt) AS startAt, MAX(dueAt) AS dueAt FROM activities WHERE structureStatus = 'canonica' AND parentActivityId IS NOT NULL GROUP BY parentActivityId"
  );
  const datesByParentId = new Map(parentDates.map(item => [item.parentActivityId, item]));
  for (const parent of parentsBefore) {
    const dates = datesByParentId.get(parent.id);
    if (!dates || (parent.startAt === dates.startAt && parent.dueAt === dates.dueAt)) continue;
    const before = { startAt: parent.startAt, dueAt: parent.dueAt, startDate: businessDate(parent.startAt), dueDate: businessDate(parent.dueAt) };
    const after = { startAt: dates.startAt, dueAt: dates.dueAt, startDate: businessDate(dates.startAt), dueDate: businessDate(dates.dueAt) };
    await connection.execute("UPDATE activities SET startAt = ?, dueAt = ? WHERE id = ?", [after.startAt, after.dueAt, parent.id]);
    await connection.execute(
      "INSERT INTO scope_migration_history (migrationKey, entityType, entityId, action, snapshot) VALUES (?, 'activity', ?, 'periodo_capitulo_recalculado_cronograma_26_agosto', ?)",
      [migrationKey, parent.id, JSON.stringify({ before, after, planCode: parent.planCode, sourceDocument })]
    );
    result.recalculatedParents.push({ id: parent.id, planCode: parent.planCode, before, after });
  }

  await connection.commit();
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ correctedStages: result.correctedStages.length, recalculatedParents: result.recalculatedParents.length }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}

process.exit(0);
