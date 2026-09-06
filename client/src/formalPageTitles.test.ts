import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pages = [
  ["Home.tsx", "Visão geral do projeto"],
  ["Activities.tsx", "Gestão de atividades"],
  ["Calendar.tsx", "Execução por item"],
  ["Team.tsx", "Estrutura de grupos e responsabilidades"],
  ["Library.tsx", "Biblioteca de referências"],
  ["Production.tsx", "Produção e revisão de materiais"],
  ["Interfaces.tsx", "Gestão de interfaces entre seções"],
  ["Fieldwork.tsx", "Atividades de campo e divulgação"],
  ["Assistant.tsx", "Assistente técnico de inteligência artificial"],
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
      "Gestão de atividades",
      "Cronograma",
      "Equipe e grupos",
      "Biblioteca de referências",
      "Produção e revisão",
      "Interfaces entre seções",
      "Campo e divulgação",
      "Administração",
    ]) {
      expect(source).toContain(`label: "${label}"`);
    }
  });
});
