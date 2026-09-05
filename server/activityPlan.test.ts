import { describe, expect, it } from "vitest";
import {
  ACTIVITY_PLAN_ITEMS,
  activityPlanItemsForSection,
  OPERATIONAL_ACTIVITY_ITEMS,
  primaryActivityPlanItem,
} from "./activityPlan";

describe("matriz de atividades do Portal Naval", () => {
  it("mantém os 37 itens únicos após o desdobramento do Tomo IV pela V1", () => {
    expect(ACTIVITY_PLAN_ITEMS).toHaveLength(37);
    expect(new Set(ACTIVITY_PLAN_ITEMS.map(item => item.code)).size).toBe(37);
    expect(ACTIVITY_PLAN_ITEMS.map(item => item.code)).toEqual([
      ...Array.from({ length: 15 }, (_, index) => `A${String(index).padStart(2, "0")}`),
      ...Array.from({ length: 10 }, (_, index) => `B${String(index + 1).padStart(2, "0")}`),
      ...Array.from({ length: 9 }, (_, index) => `C${String(index + 1).padStart(2, "0")}`),
      "D01",
      "D02",
      "D03",
    ]);
  });

  it("atribui metadados completos e desdobra somente as frentes previstas", () => {
    for (const item of ACTIVITY_PLAN_ITEMS) {
      expect(item.summary.length).toBeGreaterThan(40);
      expect(item.functionalResponsible).toMatch(/^M[123]$/);
      expect(item.portalDeliverable.length).toBeGreaterThan(10);
      expect(item.dependencies.length).toBeGreaterThan(10);
      expect(item.acceptanceCriteria.length).toBeGreaterThan(10);
    }

    expect(activityPlanItemsForSection("I.6").map(item => item.code)).toEqual([
      "A06",
      "A07",
      "A08",
      "A09",
    ]);
    expect(activityPlanItemsForSection("I.8").map(item => item.code)).toEqual([
      "A11",
      "A12",
      "A13",
      "A14",
    ]);
    expect(activityPlanItemsForSection("II.4").map(item => item.code)).toEqual([
      "B04",
      "B05",
    ]);
    expect(primaryActivityPlanItem("I.6")?.code).toBe("A06");
    expect(activityPlanItemsForSection("IV.1").map(item => item.code)).toEqual([
      "D01",
    ]);
    expect(activityPlanItemsForSection("IV.2").map(item => item.code)).toEqual([
      "D02",
    ]);
    expect(activityPlanItemsForSection("IV.3").map(item => item.code)).toEqual([
      "D03",
    ]);
  });

  it("inclui as dez atividades operacionais explicitamente previstas na Estrutura V1", () => {
    expect(OPERATIONAL_ACTIVITY_ITEMS).toHaveLength(10);
    expect(OPERATIONAL_ACTIVITY_ITEMS.map(item => item.code)).toEqual([
      "P01", "P02", "P03", "P04", "P05", "P06", "P07", "P08", "P09", "P10",
    ]);
    expect(OPERATIONAL_ACTIVITY_ITEMS).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "P06", sectionCode: "III.1", parentPlanCode: "C01" }),
        expect.objectContaining({ code: "P07", sectionCode: "II.8", parentPlanCode: "B09" }),
        expect.objectContaining({ code: "P08", sectionCode: "III.5", parentPlanCode: "C05" }),
        expect.objectContaining({ code: "P09", sectionCode: "II.2", parentPlanCode: "B02" }),
        expect.objectContaining({ code: "P10", sectionCode: "II.4", parentPlanCode: "B04" }),
      ])
    );
  });
});
