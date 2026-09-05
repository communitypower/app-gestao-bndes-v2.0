import { activities, scopeMigrationHistory } from "../drizzle/schema.ts";
import { eq } from "drizzle-orm";
import { DETAILED_ACTIVITY_ITEMS } from "../shared/detailedActivityPlan.ts";
import { requireDb, syncDetailedActivityCatalog } from "../server/db.ts";

const migrationKey = "2026-08-25-detalhamento-capitulos-estrutura-v1";
const db = await requireDb();

await db.transaction(async transaction => {
  await syncDetailedActivityCatalog(transaction);
  const detailed = await transaction.select().from(activities);
  const inserted = detailed.filter(item => item.detailCode);
  if (inserted.length !== DETAILED_ACTIVITY_ITEMS.length) {
    throw new Error(`A sincronização produziu ${inserted.length} de ${DETAILED_ACTIVITY_ITEMS.length} atividades detalhadas.`);
  }
  const history = await transaction
    .select({ entityId: scopeMigrationHistory.entityId })
    .from(scopeMigrationHistory)
    .where(eq(scopeMigrationHistory.migrationKey, migrationKey));
  const recorded = new Set(history.map(item => item.entityId));
  for (const activity of inserted) {
    if (recorded.has(activity.id)) continue;
    await transaction.insert(scopeMigrationHistory).values({
      migrationKey,
      entityType: "atividade_detalhada",
      entityId: activity.id,
      action: "adicionada_estrutura_v1",
      snapshot: JSON.stringify(activity),
    });
  }
});

console.log(`Migração ${migrationKey} aplicada com sucesso.`);
