import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pages = [
  ["Production.tsx", "Controle de Documentos & Minhas Ações"],
  ["Calendar.tsx", "Cronograma integrado do estudo"],
  ["Homologacao.tsx", "Homologação dos Capítulos"],
  ["Administration.tsx", "Administração da plataforma"],
] as const;

const removedPhrases = [
  "Ritmo, rigor e entrega.",
  "Atividades em pauta.",
  "O tempo do estudo.",
  "Grupos temáticos em coordenação.",
  "Referências que sustentam.",
  "Texto vivo, revisão responsável.",
  "Interfaces à vista.",
  "Acesso, alertas e rastreabilidade.",
  "Gestão colaborativa do estudo",
];

describe("nomenclatura institucional das páginas", () => {
  it.each(pages)("usa o título formal em %s", (file, expectedTitle) => {
    const source = readFileSync(new URL(`./pages/${file}`, import.meta.url), "utf8");
    expect(source).toContain(`title="${expectedTitle}"`);
  });

  it("remove as chamadas promocionais e metafóricas anteriores", () => {
    const pageSource = pages
      .map(([file]) =>
        readFileSync(new URL(`./pages/${file}`, import.meta.url), "utf8")
      )
      .join("\n");
    const layoutSource = readFileSync(
      new URL("./components/DashboardLayout.tsx", import.meta.url),
      "utf8"
    );
    const source = `${pageSource}\n${layoutSource}`;
    for (const phrase of removedPhrases) expect(source).not.toContain(phrase);
  });

  it("alinha os rótulos da navegação aos nomes funcionais", () => {
    const source = readFileSync(
      new URL("./components/DashboardLayout.tsx", import.meta.url),
      "utf8"
    );
    for (const label of [
      "Documentos & Ações",
      "Cronograma de Entregas",
      "Homologação dos Capítulos",
      "Administração",
    ]) {
      expect(source).toContain(`label: "${label}"`);
    }
  });
});
