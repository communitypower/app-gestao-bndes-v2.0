import { describe, expect, it } from "vitest";
import { PDF_ANALYTIC_ITEMS, PDF_ANALYTIC_SECTIONS, PDF_ANALYTIC_SOURCE } from "./pdfAnalyticIndex";
import { STUDY_SECTION_DESCRIPTIONS as V1_SECTION_DESCRIPTIONS } from "./studyDescriptions";
import {
  ACTIVITY_STATUSES,
  APP_ROLES,
  NOTIFICATION_EVENTS,
  STUDY_SECTION_CODES,
  STUDY_SECTION_DESCRIPTIONS,
  STUDY_SECTIONS,
  STUDY_TOMES,
  TEAM_SEED,
  studySectionDescription,
  studyTomeFromCode,
} from "./domain";

describe("estrutura canônica do estudo", () => {
  it("deriva as 30 frentes e os cinco agrupamentos editoriais exclusivamente do PDF", () => {
    expect(STUDY_SECTIONS).toHaveLength(30);
    expect(STUDY_SECTION_CODES).toEqual(PDF_ANALYTIC_SECTIONS.map(section => section.code));
    expect(STUDY_TOMES).toEqual(["Apresentação", "Tomo I", "Tomo II", "Tomo III", "Tomo IV"]);
    expect(new Set(STUDY_SECTIONS.map(section => section.tome))).toEqual(new Set(STUDY_TOMES));
    expect(STUDY_SECTIONS[0]).toMatchObject({ code: "AP", title: "Apresentação" });
    expect(STUDY_SECTIONS.at(-1)).toMatchObject({ code: "IV.3", title: "Conclusões do Relatório 1" });
    expect(studyTomeFromCode("I.8")).toBe("Tomo I");
    expect(studyTomeFromCode("IV.3")).toBe("Tomo IV");
  });

  it("mantém 250 seções de trabalho e descrições derivadas da mesma fonte canônica", () => {
    expect(PDF_ANALYTIC_SOURCE).toBe("Plano_de_Trabalho-UFRJ_26_agosto.pdf");
    expect(PDF_ANALYTIC_ITEMS).toHaveLength(250);
    expect(Object.keys(STUDY_SECTION_DESCRIPTIONS)).toEqual(STUDY_SECTION_CODES);
    for (const section of STUDY_SECTIONS) {
      expect(studySectionDescription(section.code)).toBe(section.officialDescription);
    }
  });

  it("mantém textos descritivos V1 para todos os campos de descrição das atividades-mãe", () => {
    expect(Object.keys(V1_SECTION_DESCRIPTIONS)).toEqual(STUDY_SECTION_CODES);
    expect(Object.values(V1_SECTION_DESCRIPTIONS).every(description => description.length > 120)).toBe(true);
    expect(V1_SECTION_DESCRIPTIONS["I.2"]).toContain("economia do mar");
    expect(V1_SECTION_DESCRIPTIONS["II.2"]).toContain("Dimensões de análise das experiências nacionais");
    expect(V1_SECTION_DESCRIPTIONS["III.3"]).toContain("Dimensões de análise das experiências nacionais");
    expect(V1_SECTION_DESCRIPTIONS["IV.3"]).toContain("Relatório 2");
  });

  it("não atribui grupos ou pessoas como atributo da estrutura analítica", () => {
    expect(STUDY_SECTIONS.every(section => !("groupName" in section))).toBe(true);
  });

  it("mantém os vocabulários operacionais estabelecidos", () => {
    expect(ACTIVITY_STATUSES).toEqual(["pendente", "em andamento", "concluído", "atrasado"]);
    expect(APP_ROLES).toEqual(["administrador", "coordenador", "executor"]);
    expect(NOTIFICATION_EVENTS).toEqual(["atribuicao", "prazo_3_dias", "atraso"]);
  });

  it("calibra a base de integrantes e perfis de administrador", () => {
    const adminMembers = TEAM_SEED.filter(m => m.appRole === "administrador");
    expect(adminMembers.map(m => m.name)).toEqual([
      "Floriano Carlos Martins Pires Jr.",
      "Denise Cunha",
      "Cassiano Marins de Souza",
      "Luiz Felipe Assis",
      "Marcos Pedreira da Silva",
    ]);

    const marcosPedreira = TEAM_SEED.find(m => m.name === "Marcos Pedreira da Silva");
    expect(marcosPedreira).toMatchObject({
      name: "Marcos Pedreira da Silva",
      title: "Técnico de TI",
      institution: "UFRJ",
      appRole: "administrador",
    });

    const marcosPereira = TEAM_SEED.find(m => m.name === "Marcos Pereira");
    expect(marcosPereira).toMatchObject({
      name: "Marcos Pereira",
      title: "Professor",
      institution: "UFPE",
      appRole: "executor",
    });
  });
});
