import { and, eq, inArray } from "drizzle-orm";
import {
  activities,
  projectSettings,
  scopeMigrationHistory,
  studySections,
} from "../drizzle/schema.ts";
import {
  requireDb,
  syncActivityPlanCatalog,
  syncStudySectionCatalog,
} from "../server/db.ts";

const migrationKey = "2026-08-25-relatorio-1-estrutura-v1";
const sectionCodes = ["I.6", "I.7", "III.1", "III.7", "III.8", "III.9", "IV.1", "IV.2"];
const planCodes = ["A10", "C01", "C07", "C08", "C09", "D01", "D02"];
const revisedActivities = {
  A10: {
    title: "Construção naval militar: programas, capacitação tecnológica e demanda",
    previousSummary: "Examinar os programas navais brasileiros e experiências internacionais, com foco em offset, clusters, conteúdo local, inovação, soberania tecnológica e cenários de demanda para a construção militar.",
    summary: "Examinar os programas de construção naval militar brasileiros e experiências internacionais, com foco em offset, conteúdo local, clusters produtivos, capacitação tecnológica, inovação e cenários de demanda por navios e embarcações militares.",
  },
  C01: {
    title: "Fundamentos e tendências: política industrial e política marítima",
    previousSummary: "Revisar conceitos e literatura de política industrial, transformações ambientais e geopolíticas, políticas brasileiras e justificativas econômicas, estratégicas e geopolíticas para políticas marítimas e navais.",
    summary: "Revisar literatura, conceitos e justificativas econômicas da política industrial, políticas horizontais e setoriais, transformações ambientais e geopolíticas, políticas brasileiras, políticas marítimas e navais, instrumentos da NIB e fomento à descarbonização marítima.",
  },
  C07: {
    title: "Ciclos de expansão e queda da indústria naval brasileira: diagnóstico de sucessos e falhas",
    previousSummary: "Comparar os ciclos brasileiros de 1970–1980 e 2000–2010 com Coreia do Sul e China, identificando causas endógenas e exógenas, problemas sistêmicos, sucessos, falhas e lições.",
    summary: "Comparar os ciclos brasileiros de 1970–1980 e 2000–2010 com Coreia do Sul e China, identificando objetivos, instrumentos, resultados, causas endógenas e exógenas, continuidade institucional, demanda, financiamento, produtividade, sucessos, falhas e lições.",
  },
  C08: {
    title: "Fatores geopolíticos e ambientais críticos para a reestruturação da indústria naval brasileira",
    previousSummary: "Examinar mudanças tecnológicas, ambientais e geopolíticas nos mercados de energia, navegação e defesa e suas implicações para a retomada da indústria naval brasileira.",
    summary: "Examinar mudanças tecnológicas, ambientais e geopolíticas nos mercados de energia, navegação e defesa, a reorganização de cadeias produtivas, segurança econômica, transição energética, acesso a mercados e tecnologias e suas implicações para a reestruturação da indústria naval brasileira.",
  },
  C09: {
    title: "Ambiente econômico e institucional da indústria marítima brasileira",
    previousSummary: "Avaliar a organização institucional do Estado, a estabilidade programática, a capacitação das agências, os riscos políticos e regulatórios e as condições para reorientar políticas industriais e modelos setoriais.",
    summary: "Avaliar volume e estabilidade da demanda, condições macroeconômicas, custo de capital, restrições fiscais, câmbio e ambiente de investimento, além da organização, coordenação, capacitação, autonomia e continuidade dos órgãos e agências e dos riscos políticos, econômicos e regulatórios.",
  },
  D01: {
    title: "Diagnóstico integrado da competitividade da indústria naval brasileira",
    previousSummary: "Consolidar projeções de transporte marítimo, navegação interior, offshore, energias oceânicas e defesa, simulando condições de custo, prazo, qualidade, confiabilidade, barreiras e incentivos para gerar demanda efetiva à indústria brasileira.",
    summary: "Consolidar os resultados dos Tomos I, II e III, articulando mercados e demanda, capacidade produtiva, tecnologia, produtividade, competitividade, cadeia de suprimentos, políticas públicas, ambiente institucional, financiamento, transição energética e variáveis críticas para os cenários.",
  },
};

const db = await requireDb();

await db.transaction(async transaction => {
  const [sectionsBefore, activitiesBefore, existingHistory] = await Promise.all([
    transaction.select().from(studySections).where(inArray(studySections.code, sectionCodes)),
    transaction.select().from(activities).where(inArray(activities.planCode, planCodes)),
    transaction
      .select({ entityType: scopeMigrationHistory.entityType, entityId: scopeMigrationHistory.entityId })
      .from(scopeMigrationHistory)
      .where(eq(scopeMigrationHistory.migrationKey, migrationKey)),
  ]);

  const recorded = new Set(existingHistory.map(row => `${row.entityType}:${row.entityId}`));
  for (const section of sectionsBefore.filter(
    section => section.code !== "IV.2" || section.title === "Conclusões do Relatório 1"
  )) {
    const key = `study_section:${section.id}`;
    if (!recorded.has(key)) {
      await transaction.insert(scopeMigrationHistory).values({
        migrationKey,
        entityType: "study_section",
        entityId: section.id,
        action: "revisada_v1",
        snapshot: JSON.stringify(section),
      });
    }
  }
  for (const activity of activitiesBefore.filter(
    activity => activity.planCode !== "D02" || activity.title.includes("Conclusões")
  )) {
    const key = `activity:${activity.id}`;
    if (!recorded.has(key)) {
      await transaction.insert(scopeMigrationHistory).values({
        migrationKey,
        entityType: "activity",
        entityId: activity.id,
        action: "revisada_v1",
        snapshot: JSON.stringify(activity),
      });
    }
  }

  const [legacyConclusion] = await transaction
    .select({ id: activities.id, title: activities.title, sectionId: activities.sectionId })
    .from(activities)
    .where(eq(activities.planCode, "D02"))
    .limit(1);
  const [iv2] = await transaction
    .select({ id: studySections.id, title: studySections.title })
    .from(studySections)
    .where(eq(studySections.code, "IV.2"))
    .limit(1);
  const [iv3] = await transaction
    .select({ id: studySections.id, title: studySections.title })
    .from(studySections)
    .where(eq(studySections.code, "IV.3"))
    .limit(1);
  const [generatedConclusion] = await transaction
    .select({ id: activities.id, title: activities.title })
    .from(activities)
    .where(eq(activities.planCode, "D03"))
    .limit(1);

  const hasLegacyConclusion = legacyConclusion?.title.includes("Conclusões") ?? false;
  const canReplaceGeneratedConclusion =
    hasLegacyConclusion &&
    iv2?.id === legacyConclusion?.sectionId &&
    iv3?.title === "Conclusões do Relatório 1" &&
    generatedConclusion?.title === "Conclusões do Relatório 1 e agenda do Relatório 2";

  if (canReplaceGeneratedConclusion && iv3 && generatedConclusion) {
    for (const [entityType, entity] of [
      ["study_section", iv3],
      ["activity", generatedConclusion],
    ]) {
      const key = `${entityType}:${entity.id}`;
      if (!recorded.has(key)) {
        await transaction.insert(scopeMigrationHistory).values({
          migrationKey,
          entityType,
          entityId: entity.id,
          action: "duplicado_automatico_v1_removido",
          snapshot: JSON.stringify(entity),
        });
      }
    }
    await transaction.delete(activities).where(eq(activities.id, generatedConclusion.id));
    await transaction.delete(studySections).where(eq(studySections.id, iv3.id));
  }

  if (!iv3 || canReplaceGeneratedConclusion) {
    await transaction
      .update(studySections)
      .set({ code: "IV.3", title: "Conclusões do Relatório 1", sortOrder: 30 })
      .where(eq(studySections.code, "IV.2"));
  }

  const [finalIv3] = await transaction
    .select({ id: studySections.id })
    .from(studySections)
    .where(eq(studySections.code, "IV.3"))
    .limit(1);
  if (!finalIv3) throw new Error("A frente IV.3 não foi preparada para a migração V1.");

  if (hasLegacyConclusion && legacyConclusion) {
    await transaction
      .update(activities)
      .set({
        planCode: "D03",
        planSortOrder: 37,
        sectionId: finalIv3.id,
        title: "Conclusões do Relatório 1 e agenda do Relatório 2",
      })
      .where(eq(activities.id, legacyConclusion.id));
  }

  for (const [planCode, revised] of Object.entries(revisedActivities)) {
    await transaction
      .update(activities)
      .set({ title: revised.title })
      .where(eq(activities.planCode, planCode));
    await transaction
      .update(activities)
      .set({ description: revised.summary })
      .where(
        and(
          eq(activities.planCode, planCode),
          eq(activities.description, revised.previousSummary)
        )
      );
  }

  await transaction
    .update(projectSettings)
    .set({ name: "Relatório 1 — Indústria Naval: Diagnóstico e Perspectivas" });

  await syncStudySectionCatalog(transaction);
  await syncActivityPlanCatalog(transaction);

  const duplicatePlanCodes = await transaction
    .select({ planCode: activities.planCode })
    .from(activities)
    .where(and(inArray(activities.planCode, ["D01", "D02", "D03"])));
  if (duplicatePlanCodes.length !== 3) {
    throw new Error("A reconciliação V1 do Tomo IV não produziu os três itens esperados.");
  }
});

console.log(`Migração ${migrationKey} aplicada com sucesso.`);
