import { protectedProcedure, router } from "../_core/trpc";
import { ensureSeedData, getDashboardData, getDocumentWorkflowKpis, listSections } from "../db";

export const dashboardRouter = router({
  overview: protectedProcedure.query(async () => {
    await ensureSeedData();
    return getDashboardData();
  }),
  documentKpis: protectedProcedure.query(async () => {
    await ensureSeedData();
    return getDocumentWorkflowKpis();
  }),
  sections: protectedProcedure.query(async () => {
    await ensureSeedData();
    return listSections();
  }),
});
