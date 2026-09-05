import { readFile, writeFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const schedulePath = "/home/ubuntu/estudo-bndes-gestao/docs/source/cronograma-r1-r2-26-agosto-upload-2026-08-30-estruturado.json";
const outputPath = "/home/ubuntu/estudo-bndes-gestao/docs/source/auditoria-datas-cronograma-26-agosto-2026.json";
const sourceDocument = "Cronograma-R1-e-R2-26_agosto.xlsm, encaminhado ao BNDES em 26/08/2026";
const intentionallyAbsorbedDetailCodes = new Set(["II.2.1", "II.4.1"]);
/** II.2 e II.4 preservam 251 seções: o primeiro subitem da matriz foi absorvido na descrição do capítulo e os demais foram reindexados. */
const portalToScheduleDetailCode = new Map([
  ["II.2.1", "II.2.2"], ["II.2.2", "II.2.3"], ["II.2.3", "II.2.4"], ["II.2.4", "II.2.5"], ["II.2.5", "II.2.6"],
  ["II.2.6", "II.2.7"], ["II.2.7", "II.2.8"], ["II.2.8", "II.2.9"], ["II.2.9", "II.2.10"], ["II.2.10", "II.2.11"],
  ["II.4.1", "II.4.2"], ["II.4.2", "II.4.3"], ["II.4.3", "II.4.4"], ["II.4.4", "II.4.5"], ["II.4.5", "II.4.6"], ["II.4.6", "II.4.7"],
]);
const monthRanges = [
  ["2026-08-21", "2026-09-20"],
  ["2026-09-21", "2026-10-20"],
  ["2026-10-21", "2026-11-20"],
  ["2026-11-21", "2026-12-20"],
  ["2026-12-21", "2027-01-20"],
  ["2027-01-21", "2027-02-20"],
  ["2027-02-21", "2027-03-20"],
  ["2027-03-21", "2027-04-20"],
];

function businessDate(value) {
  if (value === null || value === undefined) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Number(value)));
}

const schedule = JSON.parse(await readFile(schedulePath, "utf8"));
const expectedByCode = new Map(
  schedule.map(item => [item.detail_code, {
    startDate: monthRanges[item.start_month - 1][0],
    dueDate: monthRanges[item.end_month - 1][1],
    startMonth: item.start_month,
    endMonth: item.end_month,
    title: item.title,
  }])
);

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [activities] = await connection.execute(
    "SELECT id, parentActivityId, planCode, detailCode, title, startAt, dueAt, structureStatus FROM activities WHERE structureStatus = 'canonica' AND parentActivityId IS NOT NULL"
  );
  const mismatches = [];
  const unexpectedPortalStages = [];
  const matchedCodes = new Set();

  for (const activity of activities) {
    const scheduleDetailCode = activity.detailCode ? (portalToScheduleDetailCode.get(activity.detailCode) ?? activity.detailCode) : null;
    const expected = scheduleDetailCode ? expectedByCode.get(scheduleDetailCode) : null;
    if (!expected) {
      unexpectedPortalStages.push({
        id: activity.id,
        detailCode: activity.detailCode,
        title: activity.title,
        note: "Etapa canônica sem código correspondente na matriz XLSM.",
      });
      continue;
    }
    matchedCodes.add(scheduleDetailCode);
    const actualStartDate = businessDate(activity.startAt);
    const actualDueDate = businessDate(activity.dueAt);
    if (actualStartDate !== expected.startDate || actualDueDate !== expected.dueDate) {
      mismatches.push({
        id: activity.id,
        detailCode: activity.detailCode,
        scheduleDetailCode,
        title: activity.title,
        expected,
        actual: { startDate: actualStartDate, dueDate: actualDueDate, startAt: activity.startAt, dueAt: activity.dueAt },
      });
    }
  }

  const missingSourceStages = schedule
    .filter(item => !matchedCodes.has(item.detail_code))
    .map(item => ({
      detailCode: item.detail_code,
      title: item.title,
      intentionallyAbsorbed: intentionallyAbsorbedDetailCodes.has(item.detail_code),
    }));

  const output = {
    sourceDocument,
    sourceScheduleItems: schedule.length,
    canonicalPortalStages: activities.length,
    matchedStages: matchedCodes.size,
    dateMismatches: mismatches,
    missingSourceStages,
    unexpectedPortalStages,
    summary: {
      dateMismatchCount: mismatches.length,
      intentionallyAbsorbedCount: missingSourceStages.filter(item => item.intentionallyAbsorbed).length,
      unmatchedSourceCount: missingSourceStages.filter(item => !item.intentionallyAbsorbed).length,
      unexpectedPortalStageCount: unexpectedPortalStages.length,
    },
  };
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(output.summary, null, 2));
} finally {
  await connection.end();
}

process.exit(0);
