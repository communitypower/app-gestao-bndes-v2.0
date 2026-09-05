import { and, eq, isNull } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { activities } from "../drizzle/schema";
import { PDF_ANALYTIC_ITEMS, PDF_ANALYTIC_SECTIONS, PDF_ANALYTIC_SOURCE } from "../shared/pdfAnalyticIndex";
import { requireDb } from "./db";

describe("catálogo exclusivo do índice analítico do PDF", () => {
  it("mantém 30 capítulos e 250 seções de trabalho após mover as dimensões de análise para os Capítulos II.2, II.4 e III.3", () => {
    expect(PDF_ANALYTIC_SECTIONS).toHaveLength(30);
    expect(PDF_ANALYTIC_ITEMS).toHaveLength(250);
    expect(PDF_ANALYTIC_SOURCE).toBe("Plano_de_Trabalho-UFRJ_26_agosto.pdf");
  });

  it("mantém II.4 focado nas unidades de análise dos estaleiros", () => {
    const items = PDF_ANALYTIC_ITEMS.filter(item => item.sectionCode === "II.4");
    expect(items.map(item => item.title)).toEqual([
      "Estaleiros de construção de navios e embarcações",
      "Estaleiros de construção de embarcações fluviais",
      "Estaleiros e instalações para construção de unidades offshore, fabricação e integração de módulos",
      "Estaleiros de construção naval militar",
      "Cadeia produtiva, por tipo de produto e região",
      "Economias e deseconomias de localização e os polos navais",
    ]);
  });

  it("mantém III.3 focado nos países, com Japão em III.3.5", () => {
    const items = PDF_ANALYTIC_ITEMS.filter(item => item.sectionCode === "III.3");
    expect(items).toHaveLength(15);
    expect(items[4]).toMatchObject({
      detailCode: "III.3.5",
      title: "Japão",
    });
    expect(items[5]).toMatchObject({
      detailCode: "III.3.6",
      title: "Coreia do Sul",
    });
    expect(items.at(-1)).toMatchObject({
      detailCode: "III.3.15",
      title: "Outros casos relevantes",
    });
  });

  it("mantém no banco apenas os capítulos e itens canônicos na estrutura ativa", async () => {
    const db = await requireDb();
    const activeParents = await db.select({ id: activities.id }).from(activities).where(and(eq(activities.structureStatus, "canonica"), isNull(activities.parentActivityId)));
    const activeItems = await db.select({ id: activities.id }).from(activities).where(and(eq(activities.structureStatus, "canonica"), isNull(activities.planCode)));
    expect(activeParents).toHaveLength(30);
    expect(activeItems).toHaveLength(250);
  });
});
