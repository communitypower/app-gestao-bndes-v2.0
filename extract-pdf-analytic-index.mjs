import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "/home/ubuntu/estudo-bndes-gestao/docs/source/plano-trabalho-ufrj-26-agosto.txt";
const outputPath = "/home/ubuntu/estudo-bndes-gestao/docs/source/indice-analitico-plano-ufrj-26-agosto.json";
const modulePath = "/home/ubuntu/estudo-bndes-gestao/shared/pdfAnalyticIndex.ts";
const source = await readFile(sourcePath, "utf8");
const raw = source.slice(source.indexOf("Índice Analítico do Relatório 1"));
if (!raw) throw new Error("Índice Analítico do Relatório 1 não encontrado no texto extraído.");

const lines = raw.replace(/\f/g, "\n").split(/\r?\n/).map(line => line.replace(/\s+/g, " ").trim());
const tomes = [];
let currentTome = { code: "AP", title: "Apresentação", chapters: [] };
tomes.push(currentTome);
let currentChapter = null;
let currentItem = null;

function append(text) {
  if (!text) return;
  if (currentItem) currentItem.title = `${currentItem.title} ${text}`.replace(/\s+/g, " ").trim();
  else if (currentChapter) currentChapter.title = `${currentChapter.title} ${text}`.replace(/\s+/g, " ").trim();
}

for (const line of lines) {
  if (!line || /^(Índice Analítico|Indústria Naval:|Oportunidades da Descarbonização)/i.test(line)) continue;
  const tomeMatch = line.match(/^Tomo (I|II|III|IV)$/i);
  if (tomeMatch) {
    currentTome = { code: `Tomo ${tomeMatch[1].toUpperCase()}`, title: "", chapters: [] };
    tomes.push(currentTome);
    currentChapter = null;
    currentItem = null;
    continue;
  }
  if (line === "Apresentação" && currentTome.code === "AP") continue;
  const itemMatch = line.match(/^(\d+)\.(\d+)\.\s*(.*)$/);
  if (itemMatch && currentChapter) {
    currentItem = {
      code: `${currentTome.code === "AP" ? "AP" : currentTome.code.replace("Tomo ", "")}.${itemMatch[1]}.${itemMatch[2]}`,
      sourceNumber: `${itemMatch[1]}.${itemMatch[2]}`,
      title: itemMatch[3],
    };
    currentChapter.items.push(currentItem);
    continue;
  }
  const chapterMatch = line.match(/^(\d+)\.\s+(.+)$/);
  if (chapterMatch && !/^\d+\.\d+\./.test(line)) {
    currentChapter = {
      code: currentTome.code === "AP" ? "AP" : `${currentTome.code.replace("Tomo ", "")}.${chapterMatch[1]}`,
      sourceNumber: chapterMatch[1],
      title: chapterMatch[2],
      items: [],
    };
    currentTome.chapters.push(currentChapter);
    currentItem = null;
    continue;
  }
  if (currentTome.code !== "AP" && !currentTome.title && !currentChapter) {
    currentTome.title = line;
    continue;
  }
  append(line);
}

const result = {
  source: "Plano_de_Trabalho-UFRJ_26_agosto.pdf",
  sourceLabel: "Anexo B — Índice Analítico do Relatório 1",
  extractedAt: new Date().toISOString(),
  tomes,
  counts: {
    tomes: tomes.length,
    chapters: tomes.reduce((total, tome) => total + tome.chapters.length, 0),
    items: tomes.reduce((total, tome) => total + tome.chapters.reduce((chapterTotal, chapter) => chapterTotal + chapter.items.length, 0), 0),
  },
};

await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
const canonicalSections = [
  {
    code: "AP",
    tome: "Apresentação",
    tomeTitle: "Apresentação",
    title: "Apresentação",
    description: "Apresentação geral do Estudo. Descrição do objetivo, metodologia, equipe, estrutura do Portal e do Relatório, banco de dados, audiovisual, sumário executivo e conteúdo dos Relatórios 1 e 2.",
    sortOrder: 1,
  },
  ...tomes
    .filter(tome => tome.code !== "AP")
    .flatMap((tome, tomeIndex) => tome.chapters.map((chapter, chapterIndex) => ({
      code: chapter.code,
      tome: tome.code,
      tomeTitle: tome.title,
      title: chapter.title,
      description: chapter.title,
      sortOrder: 2 + tomes.slice(1, tomeIndex + 1).reduce((count, previous) => count + previous.chapters.length, 0) + chapterIndex,
    }))),
];
const canonicalItems = tomes
  .filter(tome => tome.code !== "AP")
  .flatMap(tome => tome.chapters.flatMap(chapter => chapter.items.map((item, index) => ({
    sectionCode: chapter.code,
    detailCode: item.code,
    detailSortOrder: index + 1,
    title: item.title,
  }))));
const moduleContents = `/**\n * Catálogo exclusivo de estrutura do estudo, extraído do Anexo B — Índice Analítico\n * do PDF Plano_de_Trabalho-UFRJ_26_agosto.pdf. Não combinar com cronogramas,\n * matrizes ou catálogos anteriores para criar capítulos ou etapas adicionais.\n */\nexport const PDF_ANALYTIC_SOURCE = "Plano_de_Trabalho-UFRJ_26_agosto.pdf" as const;\nexport const PDF_ANALYTIC_SOURCE_LABEL = "Anexo B — Índice Analítico do Relatório 1" as const;\n\nexport const PDF_ANALYTIC_SECTIONS = ${JSON.stringify(canonicalSections, null, 2)} as const;\n\nexport const PDF_ANALYTIC_ITEMS = ${JSON.stringify(canonicalItems, null, 2)} as const;\n\nexport const PDF_ANALYTIC_COUNTS = { sections: PDF_ANALYTIC_SECTIONS.length, items: PDF_ANALYTIC_ITEMS.length } as const;\n`;
await writeFile(modulePath, moduleContents);
console.log(JSON.stringify(result.counts));
