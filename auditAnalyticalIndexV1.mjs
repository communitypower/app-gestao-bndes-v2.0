import fs from "node:fs";
import mysql from "mysql2/promise";

const catalogPath = new URL("../shared/detailedActivityPlan.ts", import.meta.url);
const outputPath = new URL("../docs/source/auditoria-itemizacao-analitica-v1.json", import.meta.url);
const source = fs.readFileSync(catalogPath, "utf8");
const canonical = [...source.matchAll(/\{ sectionCode: '([^']+)', detailCode: '([^']+)', detailSortOrder: (\d+), title: '([^']+)' \}/g)]
  .map(([, sectionCode, detailCode, detailSortOrder, title]) => ({ sectionCode, detailCode, detailSortOrder: Number(detailSortOrder), title }));

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [registered] = await connection.query(
    "SELECT a.detailCode, a.detailSortOrder, a.title, s.code AS sectionCode FROM activities a INNER JOIN study_sections s ON s.id = a.sectionId WHERE a.parentActivityId IS NOT NULL ORDER BY s.sortOrder, a.detailSortOrder"
  );
  const registeredByCode = new Map(registered.map(row => [row.detailCode, row]));
  const canonicalByCode = new Map(canonical.map(item => [item.detailCode, item]));
  const missing = canonical.filter(item => !registeredByCode.has(item.detailCode));
  const extra = registered.filter(item => !canonicalByCode.has(item.detailCode));
  const mismatched = canonical.flatMap(item => {
    const current = registeredByCode.get(item.detailCode);
    if (!current) return [];
    return current.sectionCode === item.sectionCode && Number(current.detailSortOrder) === item.detailSortOrder && current.title === item.title
      ? []
      : [{ expected: item, current }];
  });
  const report = {
    canonicalCount: canonical.length,
    registeredCount: registered.length,
    missing,
    extra,
    mismatched,
    exactMatch: missing.length === 0 && extra.length === 0 && mismatched.length === 0,
  };
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf8");
  console.log(`Auditoria V1: ${canonical.length} canônicos, ${registered.length} cadastrados, faltantes ${missing.length}, extras ${extra.length}, divergentes ${mismatched.length}.`);
} finally {
  await connection.end();
}
