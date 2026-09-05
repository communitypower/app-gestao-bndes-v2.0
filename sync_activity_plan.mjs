import {
  ensureSeedData,
  listActivities,
  requireDb,
  syncActivityPlanCatalog,
} from "/home/ubuntu/estudo-bndes-gestao/server/db.ts";

const db = await requireDb();
await ensureSeedData();
await syncActivityPlanCatalog(db);

const activities = await listActivities();
const payload = {
  total: activities.length,
  planCodes: activities.map(item => item.planCode),
  missingPlanningFields: activities
    .filter(
      item =>
        !item.planCode ||
        !item.planningSummary ||
        !item.portalDeliverable ||
        !item.dependencies
    )
    .map(item => item.id),
  sectionsWithMultipleActivities: Object.entries(
    activities.reduce((accumulator, item) => {
      accumulator[item.sectionCode] = (accumulator[item.sectionCode] ?? 0) + 1;
      return accumulator;
    }, {})
  ).filter(([, count]) => count > 1),
};

console.log(JSON.stringify(payload, null, 2));
