import { describe, expect, it } from "vitest";
import { and, eq, like } from "drizzle-orm";
import { activities, activityStructureReconciliations } from "../drizzle/schema";
import { PDF_ANALYTIC_ITEMS } from "../shared/pdfAnalyticIndex";
import { ensureSeedData, requireDb, syncPdfAnalyticCatalog } from "./db";

// Estrutura do capítulo III.4 antes da reorganização acordada com o G3 (12 itens).
const OLD_III4: Array<[string, string]> = [
  ["III.4.1", "Políticas marítimas no Brasil: marinha mercante, construção naval, navegação interior, óleo e gás offshore, energias oceânicas e defesa"],
  ["III.4.2", "Evolução das políticas brasileiras de marinha mercante"],
  ["III.4.3", "Evolução das políticas brasileiras de construção naval"],
  ["III.4.4", "Os Planos de Desenvolvimento e os Planos de Construção Naval: ciclos de 1970–1980 e 2000–2010"],
  ["III.4.5", "Instrumentos de proteção e incentivo à marinha mercante: reserva de mercado e de carga, preferência de bandeira, afretamento, tripulação e incentivos fiscais"],
  ["III.4.6", "Instrumentos de apoio à construção naval: barreiras tributárias e restrições ao afretamento, incentivos fiscais, conteúdo local e compras governamentais"],
  ["III.4.7", "Financiamento e outros instrumentos financeiros"],
  ["III.4.8", "Políticas de pesquisa, desenvolvimento, inovação e formação de recursos humanos"],
  ["III.4.9", "Clusters navais e políticas de desenvolvimento regional"],
  ["III.4.10", "Políticas para os setores de óleo e gás, defesa e energia e seus impactos sobre a indústria naval"],
  ["III.4.11", "Resultados das políticas brasileiras de marinha mercante e construção naval"],
  ["III.4.12", "Mudanças recentes e principais questões em debate no Brasil"],
];

// Para cada código novo, o código antigo cujo conteúdo ele passa a abrigar.
const NEW_FROM_OLD: Record<string, string> = {
  "III.4.1": "III.4.1",
  "III.4.2": "III.4.8",
  "III.4.3": "III.4.9",
  "III.4.4": "III.4.10",
  "III.4.5": "III.4.5",
  "III.4.6": "III.4.6",
  "III.4.7": "III.4.7",
  "III.4.8": "III.4.11",
  "III.4.9": "III.4.12",
};

async function rewindToOldStructure(db: any) {
  const current = await db.select().from(activities).where(like(activities.detailCode, "III.4.%"));
  const byCode = new Map<string, any>(current.map((row: any) => [row.detailCode, row]));
  // Devolve as linhas atuais aos códigos antigos (em duas etapas por causa do índice único).
  for (const [newCode] of Object.entries(NEW_FROM_OLD)) {
    await db.update(activities).set({ detailCode: `${newCode}~rw` }).where(eq(activities.id, byCode.get(newCode).id));
  }
  const oldTitle = new Map(OLD_III4);
  for (const [newCode, oldCode] of Object.entries(NEW_FROM_OLD)) {
    await db
      .update(activities)
      .set({ detailCode: oldCode, title: oldTitle.get(oldCode)! })
      .where(eq(activities.id, byCode.get(newCode).id));
  }
  // Recria os itens 4.2 a 4.4 que existiam antes da fusão.
  const template = byCode.get("III.4.1");
  const ids: Record<string, number> = {};
  for (const code of ["III.4.2", "III.4.3", "III.4.4"]) {
    const [inserted] = await db
      .insert(activities)
      .values({
        title: oldTitle.get(code)!,
        description: oldTitle.get(code)!,
        startAt: template.startAt,
        dueAt: template.dueAt,
        detailCode: code,
        parentActivityId: template.parentActivityId,
        sectionId: template.sectionId,
        responsibleId: template.responsibleId,
        structureStatus: "canonica",
        status: "pendente",
        progress: 0,
      })
      .returning({ id: activities.id });
    ids[code] = inserted.id;
  }
  return { originalIds: Object.fromEntries(current.map((row: any) => [row.detailCode, row.id])), recreatedIds: ids };
}

describe("reestruturação do capítulo III.4", () => {
  it("remaneja as seções existentes para a numeração nova sem apagar nada e é idempotente", async () => {
    const db = await requireDb();
    await ensureSeedData(db);
    const { originalIds, recreatedIds } = await rewindToOldStructure(db);

    await syncPdfAnalyticCatalog(db);

    const canonical = await db
      .select()
      .from(activities)
      .where(and(like(activities.detailCode, "III.4.%"), eq(activities.structureStatus, "canonica")));
    const expected = PDF_ANALYTIC_ITEMS.filter(item => item.sectionCode === "III.4");
    expect(expected).toHaveLength(9);
    expect(canonical).toHaveLength(9);

    for (const item of expected) {
      const row = canonical.find((r: any) => r.detailCode === item.detailCode);
      expect(row?.title).toBe(item.title);
      expect(row?.detailSortOrder).toBe(item.detailSortOrder);
      // O conteúdo acompanha a seção: a linha é a mesma que antes ocupava o código antigo correspondente.
      expect(row?.id).toBe(originalIds[item.detailCode]);
    }

    const archived = await db
      .select()
      .from(activities)
      .where(like(activities.detailCode, "III.4.%~arq"));
    expect(archived.map((row: any) => row.id).sort()).toEqual(Object.values(recreatedIds).sort());
    expect(archived.every((row: any) => row.structureStatus === "arquivada")).toBe(true);

    const target = canonical.find((r: any) => r.detailCode === "III.4.1");
    const reconciliations = await db.select().from(activityStructureReconciliations);
    const forArchived = reconciliations.filter((r: any) => Object.values(recreatedIds).includes(r.supersededActivityId));
    expect(forArchived).toHaveLength(3);
    expect(forArchived.every((r: any) => r.canonicalActivityId === target.id && r.action === "consolidada")).toBe(true);

    // Segunda execução não altera nada.
    await syncPdfAnalyticCatalog(db);
    const again = await db
      .select()
      .from(activities)
      .where(and(like(activities.detailCode, "III.4.%"), eq(activities.structureStatus, "canonica")));
    expect(again).toHaveLength(9);
    const reconciliationsAgain = await db.select().from(activityStructureReconciliations);
    expect(reconciliationsAgain).toHaveLength(reconciliations.length);
  });
});
