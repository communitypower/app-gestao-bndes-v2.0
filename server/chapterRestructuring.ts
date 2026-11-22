import { inArray, eq } from "drizzle-orm";
import {
  activities,
  activityStructureReconciliations,
  productionMaterials,
  reviewSubmissions,
} from "../drizzle/schema";
import {
  CHAPTER_RESTRUCTURINGS,
  type ChapterRestructuring,
} from "../shared/chapterRestructurings";

// Mesmo tipo usado pelas funções de sincronização em db.ts (drizzle node-postgres ou PGlite).
type Db = any;

export type RestructuringOutcome =
  | { key: string; status: "applied"; archived: number; moved: number }
  | { key: string; status: "already_applied" }
  | { key: string; status: "skipped"; reason: string };

const normalize = (value: string | null | undefined) =>
  (value ?? "").replace(/\s+/g, " ").trim().toLowerCase();

const archivedCode = (code: string) => `${code}~arq`;
const temporaryCode = (code: string) => `${code}~tmp`;

async function applyOne(db: Db, plan: ChapterRestructuring): Promise<RestructuringOutcome> {
  const codes = [
    ...plan.retire.map(r => r.code),
    ...plan.moves.map(m => m.from),
    plan.mergeInto,
  ];
  const rows: Array<{ id: number; detailCode: string | null; title: string; structureStatus: string }> =
    await db
      .select({
        id: activities.id,
        detailCode: activities.detailCode,
        title: activities.title,
        structureStatus: activities.structureStatus,
      })
      .from(activities)
      .where(inArray(activities.detailCode, codes));
  const byCode = new Map(rows.map(row => [row.detailCode!, row]));

  const sourcesMatch = [
    ...plan.retire.map(r => ({ code: r.code, oldTitle: r.oldTitle })),
    ...plan.moves.map(m => ({ code: m.from, oldTitle: m.oldTitle })),
  ].map(source => {
    const row = byCode.get(source.code);
    return Boolean(row && normalize(row.title) === normalize(source.oldTitle));
  });

  if (sourcesMatch.every(match => !match)) {
    // Nenhuma linha está na forma antiga: a migração já foi aplicada (ou o banco foi criado já na forma nova).
    return { key: plan.key, status: "already_applied" };
  }
  if (!sourcesMatch.every(Boolean)) {
    return {
      key: plan.key,
      status: "skipped",
      reason: "Estado intermediário: apenas parte das seções de origem está na forma antiga.",
    };
  }

  const target = byCode.get(plan.mergeInto);
  if (!target) {
    return { key: plan.key, status: "skipped", reason: `Seção de destino ${plan.mergeInto} não encontrada.` };
  }

  const retireIds = plan.retire.map(r => byCode.get(r.code)!.id);
  const [materials, submissions] = await Promise.all([
    db.select({ id: productionMaterials.id }).from(productionMaterials).where(inArray(productionMaterials.activityId, retireIds)),
    db.select({ id: reviewSubmissions.id }).from(reviewSubmissions).where(inArray(reviewSubmissions.activityId, retireIds)),
  ]);
  if (materials.length > 0 || submissions.length > 0) {
    return {
      key: plan.key,
      status: "skipped",
      reason: "Há minutas ou submissões vinculadas a seções que seriam arquivadas; a migração exige decisão manual.",
    };
  }

  const now = Date.now();
  await db.transaction(async (tx: Db) => {
    // 1. Arquiva as seções fundidas, liberando o código para a nova numeração.
    for (const retired of plan.retire) {
      const row = byCode.get(retired.code)!;
      await tx
        .update(activities)
        .set({ structureStatus: "arquivada", detailCode: archivedCode(retired.code) })
        .where(eq(activities.id, row.id));
      await tx.insert(activityStructureReconciliations).values({
        supersededActivityId: row.id,
        canonicalActivityId: target.id,
        action: "consolidada",
        sourceReference: plan.sourceReference.slice(0, 320),
        snapshot: JSON.stringify({ restructuring: plan.key, detailCode: retired.code, title: row.title }),
        reason: plan.reason,
        performedAt: now,
      });
    }

    // 2. Renumera as seções que mudam de posição em duas etapas, para não violar o índice único de detailCode.
    for (const move of plan.moves) {
      const row = byCode.get(move.from)!;
      await tx
        .update(activities)
        .set({ detailCode: temporaryCode(move.to) })
        .where(eq(activities.id, row.id));
    }
    for (const move of plan.moves) {
      const row = byCode.get(move.from)!;
      await tx
        .update(activities)
        .set({ detailCode: move.to })
        .where(eq(activities.id, row.id));
    }
  });

  return { key: plan.key, status: "applied", archived: plan.retire.length, moved: plan.moves.length };
}

/**
 * Aplica as reestruturações pendentes. Deve rodar antes de `syncPdfAnalyticCatalog`,
 * que em seguida ajusta títulos, ordem e prazos a partir do catálogo canônico.
 * Nunca lança erro: falhas são registradas no log e o restante da carga segue.
 */
export async function applyChapterRestructurings(db: Db): Promise<RestructuringOutcome[]> {
  const outcomes: RestructuringOutcome[] = [];
  for (const plan of CHAPTER_RESTRUCTURINGS) {
    try {
      const outcome = await applyOne(db, plan);
      outcomes.push(outcome);
      if (outcome.status === "applied") {
        console.log(`[Reestruturação] ${plan.key}: ${outcome.archived} seções arquivadas, ${outcome.moved} renumeradas.`);
      } else if (outcome.status === "skipped") {
        console.warn(`[Reestruturação] ${plan.key} não aplicada: ${outcome.reason}`);
      }
    } catch (error) {
      console.error(`[Reestruturação] ${plan.key} falhou e foi revertida:`, error);
      outcomes.push({ key: plan.key, status: "skipped", reason: String(error) });
    }
  }
  return outcomes;
}
