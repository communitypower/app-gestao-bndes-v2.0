import { describe, expect, it } from "vitest";
import { resetAndSeedPilotDatabase, requireDb } from "./db";
import {
  activities,
  coordinationInterfaces,
  libraryItems,
  productionMaterials,
  materialRevisions,
  materialComments,
  reviewSubmissions,
  reviewDecisions,
  reviewChecklistItems,
  participantNotifications,
  studySections,
  teamGroups,
  teamMembers,
  teamGroupMemberships,
  users,
} from "../drizzle/schema";
import { sql } from "drizzle-orm";

describe("Pacote P1 de Implementação — Integridade Estrutural & Limpeza", () => {
  it("preserva 100% da base canônica oficial enquanto zera documentos e fluxos em aberto", async () => {
    const db = await requireDb();

    // 1. Simula criação de documentos e fluxos de teste antes do reset P1
    const [sampleActivity] = await db.select().from(activities).limit(1);
    const [sampleSection] = await db.select().from(studySections).limit(1);
    const [sampleUser] = await db.select().from(users).limit(1);

    if (sampleActivity && sampleSection && sampleUser) {
      const [mat] = await db.insert(productionMaterials).values({
        title: "Minuta de Teste Pré-P1",
        activityId: sampleActivity.id,
        sectionId: sampleSection.id,
        reviewStatus: "em revisão",
        currentRevision: 1,
        createdBy: sampleUser.id,
      }).returning({ id: productionMaterials.id });

      if (mat) {
        const [rev] = await db.insert(materialRevisions).values({
          materialId: mat.id,
          revisionNumber: 1,
          notes: "Versão preliminar",
          fileName: "minuta_preliminar.docx",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          fileSize: 1024,
          storageKey: "test/minuta.docx",
          storageUrl: "/test/minuta.docx",
          uploadedBy: sampleUser.id,
        }).returning({ id: materialRevisions.id });

        if (rev) {
          await db.insert(reviewSubmissions).values({
            activityId: sampleActivity.id,
            materialId: mat.id,
            revisionId: rev.id,
            submittedBy: sampleUser.id,
            status: "em revisão",
            submittedAt: Date.now(),
          });
        }
      }

      await db.update(activities).set({
        documentStatus: "em revisão da seção",
        status: "em andamento",
        progress: 50,
      }).where(sql`id = ${sampleActivity.id}`);
    }

    // 2. Executa a preparação oficial do Pacote P1
    const result = await resetAndSeedPilotDatabase(db);

    expect(result.success).toBe(true);

    // 3. Validações da Base Canônica Preservada (100%)
    expect(result.stats.sections).toBe(30);
    expect(result.stats.parentChapters).toBe(30);
    expect(result.stats.totalActivities).toBe(280);
    expect(result.stats.groups).toBe(11);
    expect(result.stats.members).toBeGreaterThanOrEqual(33);
    expect(result.stats.memberships).toBeGreaterThanOrEqual(36);
    expect(result.stats.interfaces).toBeGreaterThanOrEqual(60);
    expect(result.stats.libraryItems).toBe(328);
    expect(result.stats.users).toBeGreaterThanOrEqual(33);

    // 4. Validações de Documentos Carregados e Fluxos Zerados
    expect(result.stats.materials).toBe(0);
    expect(result.stats.submissions).toBe(0);
    expect(result.stats.notifications).toBe(0);

    const [
      materialsInDb,
      revisionsInDb,
      commentsInDb,
      submissionsInDb,
      decisionsInDb,
      checklistInDb,
      notificationsInDb,
      openWorkflowActivities,
      allCanonicalActivities,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(productionMaterials),
      db.select({ count: sql<number>`count(*)` }).from(materialRevisions),
      db.select({ count: sql<number>`count(*)` }).from(materialComments),
      db.select({ count: sql<number>`count(*)` }).from(reviewSubmissions),
      db.select({ count: sql<number>`count(*)` }).from(reviewDecisions),
      db.select({ count: sql<number>`count(*)` }).from(reviewChecklistItems),
      db.select({ count: sql<number>`count(*)` }).from(participantNotifications),
      db.select({ count: sql<number>`count(*)` }).from(activities).where(sql`"documentStatus" != 'planejada' OR "status" != 'pendente' OR "progress" != 0`),
      db.select().from(activities),
    ]);

    expect(Number(materialsInDb[0]?.count ?? 0)).toBe(0);
    expect(Number(revisionsInDb[0]?.count ?? 0)).toBe(0);
    expect(Number(commentsInDb[0]?.count ?? 0)).toBe(0);
    expect(Number(submissionsInDb[0]?.count ?? 0)).toBe(0);
    expect(Number(decisionsInDb[0]?.count ?? 0)).toBe(0);
    expect(Number(checklistInDb[0]?.count ?? 0)).toBe(0);
    expect(Number(notificationsInDb[0]?.count ?? 0)).toBe(0);
    expect(Number(openWorkflowActivities[0]?.count ?? 0)).toBe(0);

    // Todas as 280 atividades canônicas devem estar limpas com status planejado/pendente
    expect(allCanonicalActivities.length).toBe(280);
    for (const act of allCanonicalActivities) {
      expect(act.documentStatus).toBe("planejada");
      expect(act.status).toBe("pendente");
      expect(act.progress).toBe(0);
      expect(act.actualStartAt).toBeNull();
      expect(act.actualEndAt).toBeNull();
    }
  });
});
