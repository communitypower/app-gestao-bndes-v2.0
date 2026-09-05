import { TransactionRollbackError, eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { activities, studySections } from "../drizzle/schema";
import {
  canonicalStudySectionRows,
  requireDb,
  syncStudySectionCatalog,
} from "./db";

describe("sincronização das descrições oficiais", () => {
  it("atualiza somente o catálogo de frentes e não inclui notas de atividade no payload", async () => {
    const insertedTables: unknown[] = [];
    const capturedRows: Array<Record<string, unknown>> = [];
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const fakeDb = {
      insert: vi.fn((table: unknown) => {
        insertedTables.push(table);
        return {
          values: (row: Record<string, unknown>) => {
            capturedRows.push(row);
            return { onConflictDoUpdate };
          },
        };
      }),
    };
    const personalizedActivity = {
      id: 21,
      description: "Nota personalizada que deve permanecer intacta.",
    };

    await syncStudySectionCatalog(fakeDb as never);

    expect(insertedTables).toEqual(Array(30).fill(studySections));
    expect(capturedRows).toHaveLength(30);
    expect(capturedRows).toEqual(canonicalStudySectionRows());
    expect(capturedRows).toContainEqual(
      expect.objectContaining({
        code: "IV.2",
        title: "Cenários para a indústria naval brasileira",
      })
    );
    expect(capturedRows).toContainEqual(
      expect.objectContaining({
        code: "IV.3",
        title: "Conclusões do Relatório 1",
      })
    );
    expect(
      capturedRows.every(
        row => !("description" in row) && !("activityId" in row)
      )
    ).toBe(true);
    expect(personalizedActivity.description).toBe(
      "Nota personalizada que deve permanecer intacta."
    );
    expect(onConflictDoUpdate).toHaveBeenCalledTimes(30);
  });

  it("preserva uma nota personalizada em persistência ao executar a sincronização real", async () => {
    const db = await requireDb();
    const original = await db
      .select({ id: activities.id, description: activities.description })
      .from(activities)
      .limit(1);
    expect(original[0]).toBeDefined();
    const activity = original[0]!;
    const personalizedNote =
      "VALIDAÇÃO TRANSACIONAL — nota personalizada não pode ser sobrescrita.";
    let rollbackConfirmed = false;

    try {
      await db.transaction(async transaction => {
        await transaction
          .update(activities)
          .set({ description: personalizedNote })
          .where(eq(activities.id, activity.id));

        await syncStudySectionCatalog(transaction as never);

        const afterSync = await transaction
          .select({ description: activities.description })
          .from(activities)
          .where(eq(activities.id, activity.id))
          .limit(1);
        expect(afterSync[0]?.description).toBe(personalizedNote);
        transaction.rollback();
      });
    } catch (error) {
      if (!(error instanceof TransactionRollbackError)) throw error;
      rollbackConfirmed = true;
    }

    expect(rollbackConfirmed).toBe(true);
    const afterRollback = await db
      .select({ description: activities.description })
      .from(activities)
      .where(eq(activities.id, activity.id))
      .limit(1);
    expect(afterRollback[0]?.description).toBe(activity.description);
  });
});
