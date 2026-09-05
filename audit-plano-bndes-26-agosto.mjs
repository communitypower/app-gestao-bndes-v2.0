import { readFile, writeFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const indexPath = "/home/ubuntu/estudo-bndes-gestao/docs/source/indice-analitico-plano-ufrj-26-agosto.json";
const descriptionsPath = "/home/ubuntu/estudo-bndes-gestao/docs/source/descricoes-anexo-a-plano-bndes-26-agosto.json";
const outputPath = "/home/ubuntu/estudo-bndes-gestao/docs/source/auditoria-compatibilidade-plano-bndes-26-agosto.json";

const normalize = value => String(value ?? "").replace(/\s+/g, " ").trim();
const [indexSource, descriptionsSource] = await Promise.all([readFile(indexPath, "utf8"), readFile(descriptionsPath, "utf8")]);
const index = JSON.parse(indexSource);
const annexA = JSON.parse(descriptionsSource).descriptions;

const expectedParents = [
  { code: "AP", title: "Apresentação" },
  ...index.tomes.filter(tome => tome.code !== "AP").flatMap(tome => tome.chapters.map(chapter => ({ code: chapter.code, title: chapter.title }))),
];
const expectedItems = index.tomes
  .filter(tome => tome.code !== "AP")
  .flatMap(tome => tome.chapters.flatMap(chapter => chapter.items.map(item => ({ sectionCode: chapter.code, detailCode: item.code, title: item.title }))));

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [parents] = await connection.query(
    "SELECT id, planCode, title, description, structureStatus FROM activities WHERE parentActivityId IS NULL AND structureStatus = 'canonica' ORDER BY planSortOrder, id"
  );
  const [items] = await connection.query(
    "SELECT id, detailCode, title, parentActivityId, structureStatus FROM activities WHERE parentActivityId IS NOT NULL AND structureStatus = 'canonica' ORDER BY detailCode, id"
  );
  const parentByCode = new Map(parents.map(row => [row.planCode, row]));
  const itemByCode = new Map(items.map(row => [row.detailCode, row]));
  const expectedParentCodes = new Set(expectedParents.map(row => row.code));
  const expectedItemCodes = new Set(expectedItems.map(row => row.detailCode));

  const result = {
    source: {
      structure: "Plano_de_Trabalho-UFRJ_26_agosto.pdf — Anexo B, Índice Analítico do Relatório 1",
      descriptions: "Plano_de_Trabalho-UFRJ_26_agosto.pdf — Anexo A, Estrutura do Relatório 1",
    },
    generatedAt: new Date().toISOString(),
    counts: {
      expectedChapters: expectedParents.length,
      activeChapters: parents.length,
      expectedSections: expectedItems.length,
      activeSections: items.length,
    },
    missingChapters: expectedParents.filter(expected => !parentByCode.has(expected.code)),
    extraChapters: parents.filter(current => !expectedParentCodes.has(current.planCode)),
    titleMismatches: expectedParents.flatMap(expected => {
      const current = parentByCode.get(expected.code);
      return current && normalize(current.title) !== normalize(expected.title)
        ? [{ code: expected.code, expected: expected.title, current: current.title }]
        : [];
    }),
    descriptionMismatches: expectedParents.flatMap(expected => {
      const current = parentByCode.get(expected.code);
      return current && normalize(current.description) !== normalize(annexA[expected.code])
        ? [{ code: expected.code, expectedLength: annexA[expected.code]?.length ?? 0, currentLength: current.description?.length ?? 0 }]
        : [];
    }),
    missingSections: expectedItems.filter(expected => !itemByCode.has(expected.detailCode)),
    extraSections: items.filter(current => !expectedItemCodes.has(current.detailCode)),
    sectionTitleMismatches: expectedItems.flatMap(expected => {
      const current = itemByCode.get(expected.detailCode);
      return current && normalize(current.title) !== normalize(expected.title)
        ? [{ code: expected.detailCode, expected: expected.title, current: current.title }]
        : [];
    }),
  };
  result.compatible = Object.entries(result)
    .filter(([key]) => key.endsWith("Mismatches") || key.startsWith("missing") || key.startsWith("extra"))
    .every(([, entries]) => entries.length === 0);
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ compatible: result.compatible, counts: result.counts, missingSections: result.missingSections.length, titleMismatches: result.titleMismatches.length, descriptionMismatches: result.descriptionMismatches.length }, null, 2));
} finally {
  await connection.end();
}
