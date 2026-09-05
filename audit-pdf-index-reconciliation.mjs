import { readFile, writeFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const indexPath = "/home/ubuntu/estudo-bndes-gestao/docs/source/indice-analitico-plano-ufrj-26-agosto.json";
const outputPath = "/home/ubuntu/estudo-bndes-gestao/docs/source/auditoria-reconciliacao-indice-pdf-26-agosto.json";
const index = JSON.parse(await readFile(indexPath, "utf8"));
const canonicalItems = index.tomes
  .filter(tome => tome.code !== "AP")
  .flatMap(tome => tome.chapters.flatMap(chapter => chapter.items.map(item => ({ sectionCode: chapter.code, detailCode: item.code, title: item.title }))));

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [parents] = await connection.query(`
  SELECT a.id, a.planCode, a.planSortOrder, a.sectionId, a.title, s.code AS sectionCode
  FROM activities a
  JOIN study_sections s ON s.id = a.sectionId
  WHERE a.parentActivityId IS NULL
  ORDER BY s.sortOrder, a.planSortOrder, a.id
`);
const [children] = await connection.query(`
  SELECT a.id, a.parentActivityId, a.detailCode, a.detailSortOrder, a.title, s.code AS sectionCode
  FROM activities a
  JOIN study_sections s ON s.id = a.sectionId
  WHERE a.parentActivityId IS NOT NULL
  ORDER BY s.sortOrder, a.detailSortOrder, a.id
`);
await connection.end();

const currentByCode = new Map(children.filter(item => item.detailCode).map(item => [item.detailCode, item]));
const indexByCode = new Map(canonicalItems.map(item => [item.detailCode, item]));
const canonicalParentBySection = Object.fromEntries(
  [...new Set(canonicalItems.map(item => item.sectionCode))].map(sectionCode => {
    const candidates = parents.filter(parent => parent.sectionCode === sectionCode);
    const chosen = candidates.sort((left, right) => (left.planSortOrder ?? 999999) - (right.planSortOrder ?? 999999) || left.id - right.id)[0] ?? null;
    return [sectionCode, chosen];
  })
);

const result = {
  source: "Plano_de_Trabalho-UFRJ_26_agosto.pdf — Anexo B, Índice Analítico do Relatório 1",
  generatedAt: new Date().toISOString(),
  counts: {
    currentParentActivities: parents.length,
    currentDetailedItems: children.length,
    canonicalChapters: index.counts.chapters,
    canonicalItems: canonicalItems.length,
    matchingDetailCodes: canonicalItems.filter(item => currentByCode.has(item.detailCode)).length,
    missingCanonicalCodes: canonicalItems.filter(item => !currentByCode.has(item.detailCode)).length,
    supersededDetailedCodes: children.filter(item => item.detailCode && !indexByCode.has(item.detailCode)).length,
    extraParentActivities: parents.length - index.counts.chapters - 1,
  },
  canonicalParentBySection,
  missingCanonicalItems: canonicalItems.filter(item => !currentByCode.has(item.detailCode)),
  supersededDetailedItems: children.filter(item => item.detailCode && !indexByCode.has(item.detailCode)),
  extraParents: parents.filter(parent => Object.values(canonicalParentBySection).every(chosen => chosen?.id !== parent.id)),
};

await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result.counts, null, 2));
