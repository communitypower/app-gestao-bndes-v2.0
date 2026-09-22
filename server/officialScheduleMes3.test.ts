import { describe, expect, it } from "vitest";
import {
  OFFICIAL_SCHEDULE_MES3_SECTIONS,
  OFFICIAL_SCHEDULE_MES3_CHAPTERS,
  getScheduleForDetailCode,
  getScheduleForChapterCode,
} from "../shared/officialScheduleMes3";
import { PDF_ANALYTIC_ITEMS, PDF_ANALYTIC_SECTIONS } from "../shared/pdfAnalyticIndex";
import { requireDb, syncPdfAnalyticCatalog } from "./db";
import { activities } from "../drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";

describe("Cronograma Oficial Mês 3 (Cronograma-Mes-3.xlsm)", () => {
  it("contém todos os 250 itens canônicos de seção com códigos únicos e limites mensais válidos (M1 a M7)", () => {
    expect(OFFICIAL_SCHEDULE_MES3_SECTIONS).toHaveLength(250);
    const codes = new Set(OFFICIAL_SCHEDULE_MES3_SECTIONS.map(s => s.detailCode));
    expect(codes.size).toBe(250);

    for (const section of OFFICIAL_SCHEDULE_MES3_SECTIONS) {
      expect(section.startMonth).toBeGreaterThanOrEqual(1);
      expect(section.endMonth).toBeLessThanOrEqual(7);
      expect(section.startMonth).toBeLessThanOrEqual(section.endMonth);
      expect(section.startAt).toBeLessThanOrEqual(section.dueAt);
      expect(section.activeMonths.length).toBeGreaterThanOrEqual(1);
      expect(section.activeMonths[0]).toBe(section.startMonth);
      expect(section.activeMonths[section.activeMonths.length - 1]).toBe(section.endMonth);
    }
  });

  it("mapeia os 30 capítulos do Estudo (incluindo Apresentação) com janelas temporais válidas", () => {
    const chapterKeys = Object.keys(OFFICIAL_SCHEDULE_MES3_CHAPTERS);
    expect(chapterKeys).toHaveLength(30);

    for (const code of chapterKeys) {
      const chapter = OFFICIAL_SCHEDULE_MES3_CHAPTERS[code];
      expect(chapter.startMonth).toBeGreaterThanOrEqual(1);
      expect(chapter.endMonth).toBeLessThanOrEqual(7);
      expect(chapter.startMonth).toBeLessThanOrEqual(chapter.endMonth);
      expect(chapter.startAt).toBeLessThanOrEqual(chapter.dueAt);
    }
  });

  it("fornece correspondência exata para todos os 250 itens canônicos do PDF", () => {
    for (const item of PDF_ANALYTIC_ITEMS) {
      const sched = getScheduleForDetailCode(item.detailCode);
      expect(sched).toBeDefined();
      expect(sched?.startAt).toBeGreaterThan(0);
      expect(sched?.dueAt).toBeGreaterThan(0);
      expect(sched?.dueAt).toBeGreaterThanOrEqual(sched!.startAt);
    }
  });

  it("reflete as entregas focais do Mês 2 e Mês 3 (Revisão Master)", () => {
    // Capítulo I.1 (Introdução): M1 a M4 conforme cronograma_R1
    const capI1 = getScheduleForChapterCode("I.1");
    expect(capI1).toMatchObject({ startMonth: 1, endMonth: 4 });

    // Item I.1.1 (Objetivos): M1 a M4
    const itemI11 = getScheduleForDetailCode("I.1.1");
    expect(itemI11).toMatchObject({ startMonth: 1, endMonth: 4 });

    // Item I.7.1 (Construção militar no mundo): M1 a M2
    const itemI71 = getScheduleForDetailCode("I.7.1");
    expect(itemI71).toMatchObject({ startMonth: 1, endMonth: 2 });

    // Item I.8.1 (Direcionadores de descarbonização): M1 a M1
    const itemI81 = getScheduleForDetailCode("I.8.1");
    expect(itemI81).toMatchObject({ startMonth: 1, endMonth: 1 });

    // Conclusões do Relatório 1 (IV.3): Início M6 e Término em M6
    const capIV3 = getScheduleForChapterCode("IV.3");
    expect(capIV3).toMatchObject({ startMonth: 6, endMonth: 6 });

    // Apresentação (AP): Início M5 e Término em M6
    const capAP = getScheduleForChapterCode("AP");
    expect(capAP).toMatchObject({ startMonth: 5, endMonth: 6 });

    // Políticas de marinha mercante (III.2): Término em M6
    const capIII2 = getScheduleForChapterCode("III.2");
    expect(capIII2).toMatchObject({ endMonth: 6 });

    // Ciclos de expansão e queda (III.7): Término em M6
    const capIII7 = getScheduleForChapterCode("III.7");
    expect(capIII7).toMatchObject({ endMonth: 6 });
  });

  it("popula o banco de dados com os timestamps de início e fim corretos e agrega capítulos pais", async () => {
    const db = await requireDb();
    await syncPdfAnalyticCatalog(db);

    const dbSections = await db
      .select()
      .from(activities)
      .where(and(eq(activities.structureStatus, "canonica"), isNull(activities.planCode)));

    expect(dbSections).toHaveLength(250);

    // Verificar se todos os itens têm startAt e dueAt preenchidos
    for (const section of dbSections) {
      expect(section.startAt).not.toBeNull();
      expect(section.dueAt).not.toBeNull();
      expect(section.dueAt).toBeGreaterThanOrEqual(section.startAt!);
    }

    // Verificar se capítulos pais têm datas agregadas que cobrem seus filhos
    const dbChapters = await db
      .select()
      .from(activities)
      .where(and(eq(activities.structureStatus, "canonica"), isNull(activities.parentActivityId)));

    for (const chapter of dbChapters) {
      if (chapter.planCode === "AP") continue;
      const children = dbSections.filter(s => s.parentActivityId === chapter.id);
      if (children.length > 0) {
        const minChildStart = Math.min(...children.map(c => c.startAt!));
        const maxChildDue = Math.max(...children.map(c => c.dueAt));
        expect(chapter.startAt).toBeLessThanOrEqual(minChildStart);
        expect(chapter.dueAt).toBeGreaterThanOrEqual(maxChildDue);
      }
    }
  });
});
