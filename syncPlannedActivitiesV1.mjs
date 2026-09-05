import { eq, inArray } from "drizzle-orm";
import { activities, scopeMigrationHistory } from "../drizzle/schema.ts";
import { OPERATIONAL_ACTIVITY_ITEMS } from "../shared/activityPlan.ts";
import { requireDb, syncOperationalActivityCatalog } from "../server/db.ts";

const migrationKey = "2026-08-25-atividades-previstas-estrutura-v1";
const planCodes = OPERATIONAL_ACTIVITY_ITEMS.map(item => item.code);
const db = await requireDb();

await db.transaction(async transaction => {
  await syncOperationalActivityCatalog(transaction);
  const [operationalActivities, history] = await Promise.all([
    transaction
      .select()
      .from(activities)
      .where(inArray(activities.planCode, planCodes)),
    transaction
      .select({ entityType: scopeMigrationHistory.entityType, entityId: scopeMigrationHistory.entityId })
      .from(scopeMigrationHistory)
      .where(eq(scopeMigrationHistory.migrationKey, migrationKey)),
  ]);
  if (operationalActivities.length !== OPERATIONAL_ACTIVITY_ITEMS.length) {
    throw new Error("A sincronização não produziu todas as atividades previstas pela Estrutura V1.");
  }
  const recorded = new Set(history.map(item => `${item.entityType}:${item.entityId}`));
  for (const activity of operationalActivities) {
    const key = `activity:${activity.id}`;
    if (recorded.has(key)) continue;
    await transaction.insert(scopeMigrationHistory).values({
      migrationKey,
      entityType: "activity",
      entityId: activity.id,
      action: "adicionada_estrutura_v1",
      snapshot: JSON.stringify(activity),
    });
  }
});

console.log(`Migração ${migrationKey} aplicada com sucesso.`);
