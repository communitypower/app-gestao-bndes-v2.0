import { describe, expect, it } from "vitest";
import { ensureSeedData, getActivity, listActivities, reconcileActivityParentSchedule, requireDb } from "./db";
import { activities } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Sincronização integrada de datas de cronograma entre capítulos pais e subatividades", () => {
  it("reconcilia automaticamente a data de início e término do capítulo pai a partir dos seus itens filhos", async () => {
    const db = await requireDb();
    await ensureSeedData(db);

    const allActivities = await listActivities();
    const chapterIII3 = allActivities.find(a => a.planCode === "III.3" && a.parentActivityId === null);
    expect(chapterIII3).toBeDefined();

    const childrenIII3 = allActivities.filter(a => a.parentActivityId === chapterIII3!.id);
    expect(childrenIII3.length).toBeGreaterThan(0);

    // Modificar a data de término de uma das subatividades para uma data futura
    const firstChild = childrenIII3[0];
    const newDueDate = Date.UTC(2027, 2, 28, 12); // 28/03/2027 (M7)
    const newStartDate = Date.UTC(2026, 8, 1, 12); // 01/09/2026

    await db
      .update(activities)
      .set({ startAt: newStartDate, dueAt: newDueDate })
      .where(eq(activities.id, firstChild.id));

    // Executa a reconciliação automática
    await reconcileActivityParentSchedule(firstChild.id);

    // O capítulo pai III.3 deve ter seu dueAt expandido para o máximo dos filhos e startAt para o mínimo
    const updatedParent = await getActivity(chapterIII3!.id);
    expect(updatedParent).toBeDefined();
    expect(updatedParent!.dueAt).toBeGreaterThanOrEqual(newDueDate);
    expect(updatedParent!.startAt).toBeLessThanOrEqual(newStartDate);
  });
});
