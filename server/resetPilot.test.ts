import { describe, expect, it } from "vitest";
import { resetAndSeedPilotDatabase, requireDb } from "./db";
import {
  activities,
  coordinationInterfaces,
  libraryItems,
  productionMaterials,
  reviewSubmissions,
  studySections,
  teamGroups,
  teamMembers,
  users,
} from "../drizzle/schema";
import { sql } from "drizzle-orm";

describe("reset do ambiente piloto e carga estrutural canônica", () => {
  it("zera dados transientes de testes e recarrega 100% da base canônica de atividades, grupos, membros e acervo", async () => {
    const db = await requireDb();

    // Executa a operação de reset piloto
    const result = await resetAndSeedPilotDatabase(db);

    expect(result.success).toBe(true);
    expect(result.stats.sections).toBeGreaterThanOrEqual(29);
    expect(result.stats.parentChapters).toBeGreaterThanOrEqual(29);
    expect(result.stats.totalActivities).toBeGreaterThanOrEqual(250);
    expect(result.stats.groups).toBeGreaterThanOrEqual(9);
    expect(result.stats.members).toBeGreaterThanOrEqual(30);
    expect(result.stats.interfaces).toBeGreaterThanOrEqual(50);
    expect(result.stats.libraryItems).toBeGreaterThanOrEqual(320);

    // Verifica que tabelas transientes de testes foram zeradas
    expect(result.stats.materials).toBe(0);
    expect(result.stats.submissions).toBe(0);
    expect(result.stats.notifications).toBe(0);

    // Consulta direta ao banco para validar integridade
    const [materialsInDb, submissionsInDb, sectionsInDb] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(productionMaterials),
      db.select({ count: sql<number>`count(*)` }).from(reviewSubmissions),
      db.select({ count: sql<number>`count(*)` }).from(studySections),
    ]);

    expect(Number(materialsInDb[0]?.count ?? 0)).toBe(0);
    expect(Number(submissionsInDb[0]?.count ?? 0)).toBe(0);
    expect(Number(sectionsInDb[0]?.count ?? 0)).toBeGreaterThanOrEqual(29);
  });
});
