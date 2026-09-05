import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "/home/ubuntu/estudo-bndes-gestao/docs/source/plano-trabalho-ufrj-26-agosto.txt";
const indexPath = "/home/ubuntu/estudo-bndes-gestao/docs/source/indice-analitico-plano-ufrj-26-agosto.json";
const outputPath = "/home/ubuntu/estudo-bndes-gestao/docs/source/descricoes-anexo-a-plano-bndes-26-agosto.json";

const [source, indexSource] = await Promise.all([readFile(sourcePath, "utf8"), readFile(indexPath, "utf8")]);
const index = JSON.parse(indexSource);
const annexBStart = source.lastIndexOf("Anexo B");
const annexAStart = source.lastIndexOf("Estrutura do Relatório 1", annexBStart);
if (annexAStart < 0 || annexBStart < 0 || annexBStart <= annexAStart) {
  throw new Error("Não foi possível localizar integralmente os Anexos A e B no texto extraído do Plano de Trabalho.");
}

const annexA = source
  .slice(annexAStart, annexBStart)
  .replaceAll("\f", "\n")
  .replace(/\r/g, "")
  .replace(/[ \t]+\n/g, "\n");

const normalizeDescription = value => value
  .replace(/\n+/g, " ")
  .replace(/\s{2,}/g, " ")
  .replace(/\s+([,.;:])/g, "$1")
  .trim();

const tomeCodes = ["Tomo I", "Tomo II", "Tomo III", "Tomo IV"];
const tomeStarts = tomeCodes.map(code => {
  const match = new RegExp(`(?:^|\\n)[ \\t]*${code}[ \\t]*(?=\\n)`, "m").exec(annexA);
  if (!match || match.index === undefined) throw new Error(`Não foi possível localizar o cabeçalho isolado de ${code} no Anexo A.`);
  return match.index;
});
const tomeBlocks = new Map(
  tomeCodes.map((code, index) => [code, annexA.slice(tomeStarts[index], tomeStarts[index + 1] ?? annexA.length)])
);

const descriptions = {};
const presentationStart = annexA.indexOf("Apresentação", annexA.indexOf("Indústria Naval: Diagnóstico e Perspectivas"));
const presentationEnd = annexA.indexOf("Tomo I", presentationStart);
if (presentationStart < 0 || presentationEnd < presentationStart) {
  throw new Error("Não foi possível extrair a descrição da Apresentação no Anexo A.");
}
const presentationLines = annexA.slice(presentationStart, presentationEnd).split("\n").map(line => line.trim()).filter(Boolean);
descriptions.AP = normalizeDescription(presentationLines.slice(1).join(" "));

for (const tome of index.tomes.filter(tome => tome.code !== "AP")) {
  const block = tomeBlocks.get(tome.code);
  const headings = [...block.matchAll(/^[ \t]*(\d+)\.[ \t]+([^\n]+?)[ \t]*$/gm)];
  if (headings.length < tome.chapters.length) {
    throw new Error(`O Anexo A contém apenas ${headings.length} cabeçalhos identificáveis para ${tome.code}; esperados ${tome.chapters.length}.`);
  }

  tome.chapters.forEach((chapter, chapterIndex) => {
    const heading = headings[chapterIndex];
    const start = heading.index + heading[0].length;
    const end = headings[chapterIndex + 1]?.index ?? block.length;
    const description = normalizeDescription(block.slice(start, end));
    if (description.length < 30) throw new Error(`Descrição insuficiente para ${chapter.code} no Anexo A.`);
    descriptions[chapter.code] = description;
  });
}

const expectedCodes = ["AP", ...index.tomes.filter(tome => tome.code !== "AP").flatMap(tome => tome.chapters.map(chapter => chapter.code))];
const extractedCodes = Object.keys(descriptions);
if (expectedCodes.length !== 30 || extractedCodes.length !== expectedCodes.length || expectedCodes.some(code => !descriptions[code])) {
  throw new Error("A extração do Anexo A não produziu as descrições esperadas para os 30 capítulos.");
}

await writeFile(outputPath, `${JSON.stringify({
  source: "Plano_de_Trabalho-UFRJ_26_agosto.pdf — Anexo A, Estrutura do Relatório 1",
  extractedAt: new Date().toISOString(),
  descriptions,
}, null, 2)}\n`);

console.log(`Descrições do Anexo A extraídas: ${extractedCodes.length} capítulos.`);
