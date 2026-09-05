import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const inventoryPath = "/home/ubuntu/drive-library-inventory.json";
const outputDir = "/home/ubuntu/drive-library-import";
const planPath = `${outputDir}/plan.json`;
const ROOT_PREFIX = "Biblioteca Estudo BNDES/";
const UPLOADED_BY = 1;
const BATCH_SIZE = 50;

const SECTION_IDS = {
  "I.1": 30002,
  "I.2": 30003,
  "I.3": 3,
  "I.6": 4,
  "I.7": 11,
  "II.1": 5,
  "II.3": 10,
  "II.6": 14,
  "II.7": 30004,
  "II.8": 15,
  "II.9": 8,
  "III.1": 2,
  "III.2": 16,
  "III.3": 17,
  "III.4": 18,
  "III.5": 19,
};

const SECTION_BY_THEME = {
  "1 Politicas industriais": "III.1",
  "2 Legislacao - normas - acordos": "III.4",
  "3 Fluvial -Defesa -Pesca -etc": "I.7",
  "4 CN mundo – historico, conjuntura, analise": "II.1",
  "5 Econ Maritima - Shipping": "I.2",
  "6 Politicas marinha mercante": "III.2",
  "7 Offshore": "I.6",
  "8 P&D": "II.7",
  "9 Produtividade competitividade": "II.8",
  "10 financiamento": "III.5",
  "11 Descarbonizacao - transicao energ": "II.9",
  "12 UFRJ - trabalhos": null,
  "13 Brasil": "II.3",
  "14 Imprensa": null,
  "16 OCDE - UNCTAD - IMO - OIT - OMC": null,
  "17 Clusters": "II.6",
  Clarksons: "I.3",
};

const THEME_LABELS = {
  "1 Politicas industriais": "Políticas industriais",
  "2 Legislacao - normas - acordos": "Legislação, normas e acordos",
  "3 Fluvial -Defesa -Pesca -etc": "Defesa e segmentos especializados",
  "4 CN mundo – historico, conjuntura, analise": "Construção naval mundial",
  "5 Econ Maritima - Shipping": "Economia marítima e transporte marítimo",
  "6 Politicas marinha mercante": "Políticas de marinha mercante",
  "7 Offshore": "Offshore",
  "8 P&D": "Pesquisa, desenvolvimento e tecnologia",
  "9 Produtividade competitividade": "Produtividade e competitividade",
  "10 financiamento": "Financiamento e Fundo da Marinha Mercante",
  "11 Descarbonizacao - transicao energ": "Descarbonização e transição energética",
  "12 UFRJ - trabalhos": "Produção acadêmica da UFRJ",
  "13 Brasil": "Indústria naval no Brasil",
  "14 Imprensa": "Imprensa e conjuntura",
  "16 OCDE - UNCTAD - IMO - OIT - OMC": "Organismos internacionais",
  "17 Clusters": "Clusters e cadeia produtiva",
  Clarksons: "Clarksons e mercado marítimo",
};

function sectionCodeFor(file) {
  if (file.topLevelFolder === "1 Politicas industriais") {
    if (/\/(2 Politica CN|3 politicas nacionais)/i.test(file.parentPath)) {
      return "III.3";
    }
    return "III.1";
  }
  return SECTION_BY_THEME[file.topLevelFolder] ?? null;
}

function representativeScore(file) {
  const path = file.parentPath ?? "";
  const duplicateSuffixes = (path.match(/ \([12]\)/g) ?? []).length;
  const fileSuffixes = (file.name.match(/ \([0-9]+\)(?=\.[^.]+$)/g) ?? []).length;
  const depth = path.split("/").length;
  const unclassifiedPenalty = sectionCodeFor(file) ? 0 : 4;
  return duplicateSuffixes * 100 + fileSuffixes * 20 + unclassifiedPenalty + depth;
}

function selectUniqueFiles(files) {
  const groups = new Map();
  for (const file of files) {
    const key = file.md5Checksum ?? file.id;
    const candidates = groups.get(key) ?? [];
    candidates.push(file);
    groups.set(key, candidates);
  }
  return [...groups.entries()].map(([sourceHash, candidates]) => {
    const representative = [...candidates].sort(
      (a, b) =>
        representativeScore(a) - representativeScore(b) ||
        a.path.localeCompare(b.path, "pt-BR", { numeric: true })
    )[0];
    return { ...representative, sourceHash, duplicateCount: candidates.length - 1 };
  });
}

function titleFromName(name) {
  const title = name.replace(/\.[^.]+$/, "").replace(/\s+/g, " ").trim();
  return (title || name).slice(0, 320);
}

function safeFileSize(size) {
  if (!size) return null;
  const value = Number(size);
  return Number.isSafeInteger(value) && value <= 2_147_483_647 ? value : null;
}

function buildDescription(file) {
  const relativePath = file.parentPath.replace(ROOT_PREFIX, "");
  const duplicateNote = file.duplicateCount
    ? ` ${file.duplicateCount} cópia(s) idêntica(s) foram omitidas por hash.`
    : "";
  return `Fonte: pasta compartilhada do Google Drive. Caminho original: ${relativePath}. Identificador do Drive: ${file.id}.${duplicateNote}`;
}

function sqlText(value) {
  if (value === null || value === undefined) return "NULL";
  return `CONVERT(0x${Buffer.from(String(value), "utf8").toString("hex")} USING utf8mb4)`;
}

function sqlNumber(value) {
  return value === null || value === undefined ? "NULL" : String(value);
}

function rowSql(entry, first) {
  return `${first ? "SELECT" : "UNION ALL SELECT"}
    ${sqlText(entry.title)} AS title,
    ${sqlText(entry.description)} AS description,
    ${sqlText(entry.theme)} AS theme,
    ${sqlNumber(entry.sectionId)} AS sectionId,
    ${sqlText(entry.externalUrl)} AS externalUrl,
    ${sqlText(entry.fileName)} AS fileName,
    ${sqlText(entry.mimeType)} AS mimeType,
    ${sqlNumber(entry.fileSize)} AS fileSize`;
}

function batchSql(entries) {
  const rows = entries.map((entry, index) => rowSql(entry, index === 0)).join("\n");
  return `INSERT INTO library_items
  (title, description, theme, sectionId, itemType, externalUrl, fileName, mimeType, fileSize, uploadedBy)
SELECT
  source.title,
  source.description,
  source.theme,
  source.sectionId,
  'link',
  source.externalUrl,
  source.fileName,
  source.mimeType,
  source.fileSize,
  ${UPLOADED_BY}
FROM (
${rows}
) AS source
LEFT JOIN library_items existing ON existing.externalUrl = source.externalUrl
WHERE existing.id IS NULL;
`;
}

const inventory = JSON.parse(readFileSync(inventoryPath, "utf8"));
const uniqueFiles = selectUniqueFiles(inventory.files);
const entries = uniqueFiles
  .map(file => {
    const sectionCode = sectionCodeFor(file);
    return {
      title: titleFromName(file.name),
      description: buildDescription(file),
      theme: (THEME_LABELS[file.topLevelFolder] ?? file.topLevelFolder).slice(0, 180),
      sectionCode,
      sectionId: sectionCode ? SECTION_IDS[sectionCode] ?? null : null,
      externalUrl: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
      fileName: file.name.slice(0, 320),
      mimeType: file.mimeType.slice(0, 160),
      fileSize: safeFileSize(file.size),
      sourceHash: file.sourceHash,
      duplicateCount: file.duplicateCount,
      sourcePath: file.path,
    };
  })
  .sort(
    (a, b) =>
      a.theme.localeCompare(b.theme, "pt-BR", { numeric: true }) ||
      a.title.localeCompare(b.title, "pt-BR", { numeric: true })
  );

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });
const batches = [];
for (let start = 0; start < entries.length; start += BATCH_SIZE) {
  const batch = entries.slice(start, start + BATCH_SIZE);
  const batchNumber = batches.length + 1;
  const filePath = `${outputDir}/batch-${String(batchNumber).padStart(2, "0")}.sql`;
  writeFileSync(filePath, batchSql(batch));
  batches.push({ batchNumber, filePath, count: batch.length });
}

const summary = {
  sourceFileCount: inventory.files.length,
  uniqueFileCount: entries.length,
  duplicateCopiesOmitted: inventory.files.length - entries.length,
  classifiedCount: entries.filter(entry => entry.sectionId).length,
  generalCount: entries.filter(entry => !entry.sectionId).length,
  byTheme: Object.entries(
    entries.reduce((counts, entry) => {
      counts[entry.theme] = (counts[entry.theme] ?? 0) + 1;
      return counts;
    }, {})
  ).map(([theme, count]) => ({ theme, count })),
  batches,
};

writeFileSync(planPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), summary, entries }, null, 2)}\n`);
writeFileSync(`${outputDir}/all.sql`, batches.map(batch => readFileSync(batch.filePath, "utf8")).join("\n"));
console.log(JSON.stringify({ planPath, summary }, null, 2));
