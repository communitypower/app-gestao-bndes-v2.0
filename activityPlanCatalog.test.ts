import { and, eq, isNull } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { activities } from "../drizzle/schema";
import { PDF_ANALYTIC_ITEMS, PDF_ANALYTIC_SECTIONS, PDF_ANALYTIC_SOURCE } from "../shared/pdfAnalyticIndex";
import { requireDb } from "./db";

describe("catálogo exclusivo do índice analítico do PDF", () => {
  it("mantém 30 capítulos e 251 seções de trabalho após mover as dimensões de análise para os Capítulos II.2 e II.4", () => {
    expect(PDF_ANALYTIC_SECTIONS).toHaveLength(30);
    expect(PDF_ANALYTIC_ITEMS).toHaveLength(251);
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

  it("mantém no banco apenas os capítulos e itens canônicos na estrutura ativa", async () => {
    const db = await requireDb();
    const activeParents = await db.select({ id: activities.id }).from(activities).where(and(eq(activities.structureStatus, "canonica"), isNull(activities.parentActivityId)));
    const activeItems = await db.select({ id: activities.id }).from(activities).where(and(eq(activities.structureStatus, "canonica"), isNull(activities.planCode)));
    expect(activeParents).toHaveLength(30);
    expect(activeItems).toHaveLength(251);
  });
});
