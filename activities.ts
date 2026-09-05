import { TRPCError } from "@trpc/server";
import { and, eq, inArray, ne, or } from "drizzle-orm";
import { z } from "zod";
import {
  activityAllocations,
  activityDocumentWorkflowEvents,
  activityEvidenceLinks,
  activityLeadershipEvents,
  activityMilestones,
  activityReviewers,
  activities,
  coordinationInterfaces,
  interfaceActivities,
  interfaceSections,
  projectEditorialGovernance,
  reviewChecklistEvents,
  reviewChecklistItems,
  scopeMigrationHistory,
  teamMembers,
  tomeGovernanceAssignments,
} from "../../drizzle/schema";
import { PDF_ANALYTIC_SECTIONS } from "../../shared/pdfAnalyticIndex";
import {
  validateActivityTeamSelection,
  type ActivityAllocationInput,
} from "../../shared/teamStructure";
import {
  assertActivityAccess,
  assertAdministrator,
  assertCanViewActivity,
  assertCanManageActivityAllocations,
  assertCanManageActivityReview,
  canManageActivityAllocations,
  isAdministrator,
} from "../access";
import { protectedProcedure, router } from "../_core/trpc";
import {
  ensureSeedData,
  applyOfficialReviewChecklistSchedule,
  ensureActivityReviewChecklist,
  getActivity,
  getTeamMemberByUserId,
  listActivityReviewChecklist,
  listActivityStatusReport,
  listActivities,
  listCoordinationInterfaces,
  listTeamMembers,
  listProductionMaterials,
  requireDb,
} from "../db";
import { createParticipantNotification } from "../notificationService";
import { sendActivityNotification } from "../notificationEngine";
import {
  activityAllocationInputSchema,
  activityInputSchema,
  activityMilestoneSetSchema,
  activityReviewerIdsSchema,
  activityScheduleSchema,
} from "./schemas";
import {
  REFERENCE_ASSIGNMENT_GROUP_LABELS,
  referenceCodesForGroup,
  type ReferenceAssignmentGroupCode,
} from "../../shared/referenceAssignmentMatrix";

async function getEligibleParticipants(responsibleId: number) {
  const [members, activityRows] = await Promise.all([listTeamMembers(), listActivities()]);
  return members
    .filter(member => member.active)
    .map(member => {
      const currentAllocations = activityRows.flatMap(activity => activity.allocations).filter(allocation => allocation.teamMemberId === member.id);
      return {
        ...member,
        currentAllocatedHours: currentAllocations.reduce((sum, allocation) => sum + allocation.allocatedHours, 0),
        currentActivityCount: new Set(currentAllocations.map(allocation => allocation.activityId)).size,
      };
    });
}

async function getEligibleReviewers(responsibleId: number, activityId?: number) {
  const [members, activityRows] = await Promise.all([listTeamMembers(), listActivities()]);
  const executorIds = new Set(
    activityRows
      .find(activity => activity.id === activityId)
      ?.allocations?.map(allocation => allocation.teamMemberId) ?? []
  );
  return members.filter(
    member =>
      member.active &&
      member.id !== responsibleId &&
      !executorIds.has(member.id)
  ).map(member => {
    const currentReviewCount = activityRows.flatMap(activity => activity.reviewers ?? []).filter(reviewer => reviewer.teamMemberId === member.id && reviewer.status !== "aprovado").length;
    return { ...member, currentReviewCount };
  });
}

async function validateReviewers(
  responsibleId: number,
  reviewerIds: number[],
  activityId: number
) {
  const eligible = await getEligibleReviewers(responsibleId, activityId);
  const eligibleIds = new Set(eligible.map(member => member.id));
  if (reviewerIds.some(id => !eligibleIds.has(id))) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Selecione apenas integrantes ativos e independentes da execução: o executor e o coordenador responsável não podem revisar o próprio trabalho.",
    });
  }
}

async function replaceActivityReviewers(
  activityOrId: { id: number; title: string; sectionCode?: string | null; detailCode?: string | null; planCode?: string | null } | number,
  reviewerIds: number[],
  assignedBy: number
) {
  const db = await requireDb();
  const activityId = typeof activityOrId === "number" ? activityOrId : activityOrId.id;
  const existing = await db
    .select({
      id: activityReviewers.id,
      teamMemberId: activityReviewers.teamMemberId,
    })
    .from(activityReviewers)
    .where(eq(activityReviewers.activityId, activityId));
  const requested = new Set(reviewerIds);
  const removed = existing
    .filter(item => !requested.has(item.teamMemberId))
    .map(item => item.id);
  if (removed.length) {
    await db.delete(activityReviewers).where(inArray(activityReviewers.id, removed));
  }
  const existingIds = new Set(existing.map(item => item.teamMemberId));
  const added = reviewerIds.filter(id => !existingIds.has(id));
  if (added.length) {
    await db.insert(activityReviewers).values(
      added.map(teamMemberId => ({ activityId, teamMemberId, assignedBy }))
    );

    // Notify newly assigned reviewers
    const activityObj = typeof activityOrId === "number" ? await getActivity(activityId) : activityOrId;
    if (activityObj) {
      const code = activityObj.detailCode ?? activityObj.planCode ?? activityObj.sectionCode ?? "";
      for (const reviewerMemberId of added) {
        await createParticipantNotification({
          recipientMemberId: reviewerMemberId,
          actorUserId: assignedBy,
          activityId,
          type: "revisao_atribuida",
          title: "Nova revisão técnica atribuída",
          message: `Você foi designado como revisor técnico da atividade "${code ? `${code} — ` : ""}${activityObj.title}". Acesse a atividade para conferir o escopo e o cronograma de entrega.`,
          actionUrl: `/atividades?ficha=${activityId}`,
        });
      }
    }
  }
}

async function validateResponsibleAndAllocations(
  responsibleId: number,
  allocations: ActivityAllocationInput[]
) {
  const db = await requireDb();
  const members = await db
    .select({
      id: teamMembers.id,
      groupId: teamMembers.groupId,
      groupRole: teamMembers.groupRole,
      active: teamMembers.active,
    })
    .from(teamMembers);
  const responsible = members.find(member => member.id === responsibleId);
  const errors = validateActivityTeamSelection(
    responsible,
    members,
    allocations
  );
  if (errors.length) {
    throw new TRPCError({ code: "BAD_REQUEST", message: errors[0] });
  }
}

async function replaceActivityAllocations(
  activityId: number,
  allocations: ActivityAllocationInput[],
  assignedBy: number,
  leadershipNote?: string
) {
  const db = await requireDb();
  await db
    .delete(activityAllocations)
    .where(
      and(
        eq(activityAllocations.activityId, activityId),
        eq(activityAllocations.allocationType, "vigente")
      )
    );
  if (allocations.length) {
    await db.insert(activityAllocations).values(
      allocations.map(allocation => ({
        activityId,
        teamMemberId: allocation.teamMemberId,
        allocatedHours: allocation.allocatedHours,
        responsibility: allocation.responsibility.trim(),
        isExecutionLead: allocation.isExecutionLead,
        assignedBy,
        note: allocation.isExecutionLead ? leadershipNote ?? null : null,
        allocationType: "vigente" as const,
      }))
    );
  }
}

async function replaceActivityMilestones(
  activity: { id: number; startAt: number | null; dueAt: number },
  milestones: Array<{
    title: string;
    description: string | null;
    dueAt: number;
    status: "planejado" | "concluído";
    sortOrder: number;
  }>,
  createdBy: number
) {
  const invalid = milestones.find(
    item =>
      item.dueAt > activity.dueAt ||
      (activity.startAt !== null && item.dueAt < activity.startAt)
  );
  if (invalid) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Cada marco deve estar entre o início definido e a data de término da atividade.",
    });
  }
  const db = await requireDb();
  await db
    .delete(activityMilestones)
    .where(eq(activityMilestones.activityId, activity.id));
  if (milestones.length) {
    await db.insert(activityMilestones).values(
      milestones.map((milestone, index) => ({
        activityId: activity.id,
        title: milestone.title,
        description: milestone.description,
        dueAt: milestone.dueAt,
        status: milestone.status,
        sortOrder: milestone.sortOrder ?? index,
        createdBy,
      }))
    );
  }
}

const DOCUMENT_STATUSES = [
  "planejada",
  "em elaboração",
  "submetida à revisão da seção",
  "em revisão da seção",
  "ajustes solicitados",
  "revisada pela seção",
  "consolidada no capítulo",
  "em revisão do tomo",
  "aprovada no tomo",
  "em revisão do projeto",
  "aprovada para documentação final",
] as const;

const DOCUMENT_TRANSITIONS: Record<(typeof DOCUMENT_STATUSES)[number], readonly (typeof DOCUMENT_STATUSES)[number][]> = {
  "planejada": ["em elaboração"],
  "em elaboração": ["submetida à revisão da seção"],
  "submetida à revisão da seção": ["em revisão da seção", "em elaboração"],
  "em revisão da seção": ["ajustes solicitados", "revisada pela seção"],
  "ajustes solicitados": ["em elaboração"],
  "revisada pela seção": ["consolidada no capítulo"],
  "consolidada no capítulo": ["em revisão do tomo"],
  "em revisão do tomo": ["aprovada no tomo", "ajustes solicitados"],
  "aprovada no tomo": ["em revisão do projeto"],
  "em revisão do projeto": ["aprovada para documentação final", "ajustes solicitados"],
  "aprovada para documentação final": [],
};

function tomeForActivity(sectionCode: string) {
  return PDF_ANALYTIC_SECTIONS.find(section => section.code === sectionCode)?.tome ?? null;
}

async function assertNoPriorityInterfaceBlock(activity: { id: number; sectionId: number }) {
  const db = await requireDb();
  const blocked = await db
    .select({ id: coordinationInterfaces.id, title: coordinationInterfaces.title })
    .from(coordinationInterfaces)
    .leftJoin(interfaceSections, eq(interfaceSections.interfaceId, coordinationInterfaces.id))
    .leftJoin(interfaceActivities, eq(interfaceActivities.interfaceId, coordinationInterfaces.id))
    .where(
      and(
        eq(coordinationInterfaces.blockingClass, "prioritária"),
        ne(coordinationInterfaces.status, "resolvida"),
        or(
          eq(interfaceSections.sectionId, activity.sectionId),
          eq(interfaceActivities.activityId, activity.id)
        )
      )
    );
  const unresolved = blocked.filter(item => item.id);
  if (unresolved.length) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: `A aprovação está bloqueada por ${unresolved.length} interface(s) prioritária(s) não resolvida(s). Resolva ou reclassifique a interface antes de avançar.`,
    });
  }
}

export const activitiesRouter = router({
  bulkAssignmentTargets: protectedProcedure
    .input(z.object({ groupCode: z.enum(["G4", "G10"]) }))
    .query(async ({ ctx, input }) => {
      await ensureSeedData();
      await assertAdministrator(ctx.user);
      const [activityRows, members] = await Promise.all([listActivities(), listTeamMembers()]);
      const referenceCodes = new Set<string>(referenceCodesForGroup(input.groupCode));
      return {
        groupCode: input.groupCode,
        groupLabel: REFERENCE_ASSIGNMENT_GROUP_LABELS[input.groupCode],
        source: "Atividades-Grupos.xlsm / aba Atividades",
        targets: activityRows
          .filter(activity => activity.parentActivityId !== null && activity.planCode && referenceCodes.has(activity.planCode) && activity.allocations.length === 0)
          .map(activity => ({
            id: activity.id,
            planCode: activity.planCode,
            title: activity.title,
            parentActivityId: activity.parentActivityId,
            dueAt: activity.dueAt,
            documentStatus: activity.documentStatus,
          })),
        eligibleMembers: members
          .filter(member => member.active)
          .map(member => ({ id: member.id, name: member.name, title: member.title, institution: member.institution })),
      };
    }),

  bulkAssignReferenceExecutor: protectedProcedure
    .input(z.object({
      groupCode: z.enum(["G4", "G10"]),
      teamMemberId: z.number().int().positive(),
      activityIds: z.array(z.number().int().positive()).min(1).max(100),
      allocatedHours: z.number().positive().max(10_000),
    }))
    .mutation(async ({ ctx, input }) => {
      await ensureSeedData();
      await assertAdministrator(ctx.user);
      const db = await requireDb();
      const groupCode = input.groupCode as ReferenceAssignmentGroupCode;
      const referenceCodes = new Set<string>(referenceCodesForGroup(groupCode));
      const requestedIds = Array.from(new Set(input.activityIds));
      const rows = await db
        .select({
          id: activities.id,
          planCode: activities.planCode,
          parentActivityId: activities.parentActivityId,
          responsibleId: activities.responsibleId,
          structureStatus: activities.structureStatus,
        })
        .from(activities)
        .where(inArray(activities.id, requestedIds));
      if (rows.length !== requestedIds.length || rows.some(row => row.structureStatus !== "canonica" || row.parentActivityId === null || !row.planCode || !referenceCodes.has(row.planCode))) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A seleção contém seções que não pertencem à matriz de referência do grupo informado." });
      }
      const [executor] = await db
        .select({ id: teamMembers.id, active: teamMembers.active })
        .from(teamMembers)
        .where(eq(teamMembers.id, input.teamMemberId));
      if (!executor?.active) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Selecione um integrante ativo para a atribuição em lote." });
      }
      const existing = await db
        .select({ activityId: activityAllocations.activityId })
        .from(activityAllocations)
        .where(and(inArray(activityAllocations.activityId, requestedIds), eq(activityAllocations.allocationType, "vigente")));
      if (existing.length) {
        throw new TRPCError({ code: "CONFLICT", message: "Uma ou mais seções selecionadas já receberam executor. Atualize a lista e escolha apenas seções pendentes." });
      }
      await db.insert(activityAllocations).values(rows.map(activity => ({
        activityId: activity.id,
        teamMemberId: input.teamMemberId,
        allocatedHours: input.allocatedHours,
        responsibility: `Executor de seção — referência ${groupCode}`,
        isExecutionLead: true,
        assignedBy: ctx.user.id,
        note: `Atribuição em lote pela matriz Atividades-Grupos.xlsm (${REFERENCE_ASSIGNMENT_GROUP_LABELS[groupCode]}).`,
        allocationType: "vigente" as const,
      })));
      return { updated: rows.length, groupCode };
    }),
  statusReport: protectedProcedure.query(async ({ ctx }) => {
    await ensureSeedData();
    const member = await getTeamMemberByUserId(ctx.user.id);
    const rows = await listActivities();
    const delegatedRows = member
      ? rows.filter(activity =>
          activity.allocations.some(allocation => allocation.teamMemberId === member.id)
        )
      : [];
    assertActivityAccess(ctx.user, member, delegatedRows.length > 0);
    return listActivityStatusReport();
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    await ensureSeedData();
    const member = await getTeamMemberByUserId(ctx.user.id);
    const rows = await listActivities();
    const delegatedRows = member
      ? rows.filter(activity =>
          activity.allocations.some(
            allocation => allocation.teamMemberId === member.id
          )
        )
      : [];
    assertActivityAccess(ctx.user, member, delegatedRows.length > 0);
    if (isAdministrator(ctx.user)) return rows;
    if (member?.active) return rows;
    return delegatedRows;
  }),

  myWorkloadActions: protectedProcedure.query(async ({ ctx }) => {
    await ensureSeedData();
    const [allActivities, member, materials, interfaces] = await Promise.all([
      listActivities(),
      getTeamMemberByUserId(ctx.user.id),
      listProductionMaterials(),
      listCoordinationInterfaces(),
    ]);

    const isAdmin = isAdministrator(ctx.user);

    const materialByActivityId = new Map<number, (typeof materials)[number]>();
    materials.forEach(m => {
      if (m.activityId) materialByActivityId.set(m.activityId, m);
    });

    type WorkloadActionItem = {
      id: string;
      activityId: number;
      materialId: number | null;
      sectionCode: string;
      activityTitle: string;
      dueAt: number;
      role: "executor" | "revisor" | "coordenador" | "interfaces";
      actionType:
        | "minuta_pendente"
        | "ajustes_a_fazer"
        | "revisao_pendente"
        | "validacao_ajustes"
        | "sem_revisores"
        | "homologar_capitulo"
        | "interface_pendente"
        | "interface_bloqueante";
      actionTitle: string;
      actionDescription: string;
      ctaLabel: string;
      ctaTarget: "drawer" | "revisao" | "interface";
      interfaceId?: number;
      pendingCommentCount?: number;
    };

    const actions: WorkloadActionItem[] = [];

    for (const activity of allActivities) {
      if (activity.parentActivityId !== null) continue;

      const material = materialByActivityId.get(activity.id) ?? null;
      const isExecutor = Boolean(
        isAdmin ||
          (member && activity.allocations.some(a => a.teamMemberId === member.id))
      );
      const isReviewer = Boolean(
        isAdmin ||
          (member && activity.reviewers.some(r => r.teamMemberId === member.id))
      );
      const isCoordinator = Boolean(
        isAdmin ||
          (member && member.id === activity.responsibleId) ||
          (member &&
            member.groupRole === "coordenador" &&
            (member.id === activity.responsibleId || (material && member.groupId === material.responsibleGroupId)))
      );

      // 1. Ações como Executor
      if (isExecutor) {
        if (
          !material ||
          activity.documentStatus === "planejada" ||
          activity.documentStatus === "em elaboração"
        ) {
          actions.push({
            id: `executor_minuta_${activity.id}`,
            activityId: activity.id,
            materialId: material?.id ?? null,
            sectionCode: activity.sectionCode,
            activityTitle: activity.title,
            dueAt: activity.dueAt,
            role: "executor",
            actionType: "minuta_pendente",
            actionTitle: "Minuta Técnica Pendente de Carga",
            actionDescription:
              "Esta atividade está em fase de elaboração. Carregue o documento técnico e submeta à revisão da seção.",
            ctaLabel: material ? "Submeter Minuta" : "Subir Minuta Inicial",
            ctaTarget: material ? "revisao" : "drawer",
          });
        } else if (
          activity.documentStatus === "ajustes solicitados" ||
          (material &&
            (material.openCommentCount > 0 ||
              material.reviewStatus === "em elaboração"))
        ) {
          const openComments = material ? material.openCommentCount : 0;
          actions.push({
            id: `executor_ajustes_${activity.id}`,
            activityId: activity.id,
            materialId: material?.id ?? null,
            sectionCode: activity.sectionCode,
            activityTitle: activity.title,
            dueAt: activity.dueAt,
            role: "executor",
            actionType: "ajustes_a_fazer",
            actionTitle: "Ajustes Solicitados pelos Revisores",
            actionDescription: `Há ${openComments} apontamento(s) pendente(s) de atendimento. Registre a nota de implementação e envie nova versão.`,
            ctaLabel: "Implementar Ajustes",
            ctaTarget: "revisao",
            pendingCommentCount: openComments,
          });
        }
      }

      // 2. Ações como Revisor
      if (isReviewer && !isExecutor) {
        if (
          activity.documentStatus === "submetida à revisão da seção" ||
          activity.documentStatus === "em revisão da seção" ||
          material?.reviewStatus === "em revisão"
        ) {
          if (material && material.implementedCommentCount > 0) {
            actions.push({
              id: `revisor_validacao_${activity.id}`,
              activityId: activity.id,
              materialId: material.id,
              sectionCode: activity.sectionCode,
              activityTitle: activity.title,
              dueAt: activity.dueAt,
              role: "revisor",
              actionType: "validacao_ajustes",
              actionTitle: "Validar Atendimento de Apontamentos",
              actionDescription: `O autor implementou ${material.implementedCommentCount} apontamento(s). Valide e resolva para prosseguir com o parecer.`,
              ctaLabel: "Validar Apontamentos",
              ctaTarget: "revisao",
              pendingCommentCount: material.implementedCommentCount,
            });
          } else {
            actions.push({
              id: `revisor_analise_${activity.id}`,
              activityId: activity.id,
              materialId: material?.id ?? null,
              sectionCode: activity.sectionCode,
              activityTitle: activity.title,
              dueAt: activity.dueAt,
              role: "revisor",
              actionType: "revisao_pendente",
              actionTitle: "Revisão Técnica Atribuída a Você",
              actionDescription:
                "Uma versão do documento foi disponibilizada e aguarda sua análise técnica, apontamentos ou parecer.",
              ctaLabel: "Realizar Análise Técnica",
              ctaTarget: "revisao",
            });
          }
        }
      }

      // 3. Ações como Coordenador
      if (isCoordinator) {
        if (activity.reviewers.length === 0) {
          actions.push({
            id: `coord_sem_revisores_${activity.id}`,
            activityId: activity.id,
            materialId: material?.id ?? null,
            sectionCode: activity.sectionCode,
            activityTitle: activity.title,
            dueAt: activity.dueAt,
            role: "coordenador",
            actionType: "sem_revisores",
            actionTitle: "Atribuir Revisores Técnicos",
            actionDescription:
              "Esta atividade ainda não possui revisores independentes designados para a análise do documento.",
            ctaLabel: "Atribuir Revisores",
            ctaTarget: "drawer",
          });
        } else if (
          activity.documentStatus === "revisada pela seção" ||
          material?.reviewStatus === "aprovado"
        ) {
          actions.push({
            id: `coord_homologar_${activity.id}`,
            activityId: activity.id,
            materialId: material?.id ?? null,
            sectionCode: activity.sectionCode,
            activityTitle: activity.title,
            dueAt: activity.dueAt,
            role: "coordenador",
            actionType: "homologar_capitulo",
            actionTitle: "Homologar e Consolidar no Capítulo",
            actionDescription:
              "A seção foi aprovada na revisão técnica e está apta para homologação editorial no capítulo correspondente.",
            ctaLabel: "Homologar no Capítulo",
            ctaTarget: "revisao",
          });
        }
      }
    }

    // 4. Ações de Interfaces de Coordenação Interdisciplinares
    for (const interf of interfaces) {
      if (interf.status === "resolvida") continue;

      const isDirectlyResponsible = Boolean(member && interf.responsibleId === member.id);
      const isGroupInvolved = Boolean(member?.groupId && interf.groups.some(g => g.groupId === member.groupId));

      if (isAdmin || isDirectlyResponsible || isGroupInvolved) {
        const isBlocking = interf.blockingClass === "prioritária" || interf.priority === "crítica" || interf.priority === "alta";
        const groupsSummary = interf.groups.map(g => g.name).join(" ↔ ") || "Frentes temáticas";

        actions.push({
          id: `interface_${interf.id}`,
          activityId: interf.activities[0]?.activityId ?? 0,
          materialId: null,
          sectionCode: interf.sections[0]?.code ?? "INTER",
          activityTitle: interf.title,
          dueAt: interf.dueAt ?? (Date.now() + 7 * 86400 * 1000),
          role: "interfaces",
          actionType: isBlocking ? "interface_bloqueante" : "interface_pendente",
          actionTitle: isBlocking
            ? "Interface Bloqueante / Prioritária Aguardando Alinhamento"
            : "Interface Interdisciplinar em Discussão",
          actionDescription: isBlocking
            ? `Interface crítica conectando ${groupsSummary}. Alinhe os insumos técnicos para evitar impedimentos metodológicos.`
            : `Interface em aberto para o seu grupo (${groupsSummary}). Registre notas de alinhamento ou confirme o acordo.`,
          ctaLabel: isBlocking ? "Resolver Interface" : "Alinhar Interface",
          ctaTarget: "interface",
          interfaceId: interf.id,
        });
      }
    }

    const executorActions = actions.filter(a => a.role === "executor");
    const reviewerActions = actions.filter(a => a.role === "revisor");
    const coordinatorActions = actions.filter(a => a.role === "coordenador");
    const interfaceActions = actions.filter(a => a.role === "interfaces");

    const summary = {
      total: actions.length,
      executorCount: executorActions.length,
      reviewerCount: reviewerActions.length,
      coordinatorCount: coordinatorActions.length,
      interfaceCount: interfaceActions.length,
    };

    return {
      actions,
      executorActions,
      reviewerActions,
      coordinatorActions,
      interfaceActions,
      summary,
    };
  }),

  detail: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await ensureSeedData();
      const member = await getTeamMemberByUserId(ctx.user.id);
      const activity = await getActivity(input.id);
      if (!activity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Atividade não encontrada.",
        });
      }
      const delegatedMemberIds = activity.allocations.map(
        allocation => allocation.teamMemberId
      );
      const hasDelegation = Boolean(
        member && delegatedMemberIds.includes(member.id)
      );
      assertActivityAccess(ctx.user, member, hasDelegation);
      assertCanViewActivity(
        ctx.user,
        member,
        { responsibleId: activity.responsibleId, delegatedMemberIds }
      );
      const isCoordinator = Boolean(
        isAdministrator(ctx.user) ||
        ctx.user.appRole === "coordenador" ||
        (member?.active && (
          member.id === activity.responsibleId ||
          member.groupRole === "coordenador" ||
          (activity.responsibleGroupId && member.groupId === activity.responsibleGroupId)
        ))
      );
      const isExecutor = Boolean(
        member?.active && (
          activity.allocations.some(item => item.teamMemberId === member.id) ||
          activity.executionSteps?.some(step => step.allocations.some(a => a.teamMemberId === member.id))
        )
      );
      const canManageAllocations = canManageActivityAllocations(
        ctx.user,
        member,
        activity.responsibleId
      );
      return {
        ...activity,
        canManageAllocations,
        isCoordinator,
        isExecutor,
        currentMemberId: member?.id ?? null,
        eligibleParticipants: canManageAllocations
          ? await getEligibleParticipants(activity.responsibleId)
          : [],
        eligibleReviewers: canManageAllocations
          ? await getEligibleReviewers(activity.responsibleId, activity.id)
          : [],
      };
    }),

  updateAllocations: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        allocations: z.array(activityAllocationInputSchema).max(100),
        leadershipChangeJustification: z.string().trim().max(1200).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ensureSeedData();
      const activity = await getActivity(input.id);
      if (!activity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Atividade não encontrada.",
        });
      }
      const member = await getTeamMemberByUserId(ctx.user.id);
      assertCanManageActivityAllocations(
        ctx.user,
        member,
        activity.responsibleId
      );
      const priorLeadId = (activity.allocations ?? []).find(allocation => allocation.isExecutionLead)?.teamMemberId;
      const nextLeadId = input.allocations.find(allocation => allocation.isExecutionLead)?.teamMemberId;
      const leadershipChanged = priorLeadId !== undefined && nextLeadId !== undefined && priorLeadId !== nextLeadId;
      if (leadershipChanged && (input.leadershipChangeJustification?.trim().length ?? 0) < 10) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Informe uma justificativa de pelo menos 10 caracteres para alterar a liderança de execução." });
      }
      await validateResponsibleAndAllocations(
        activity.responsibleId,
        input.allocations
      );
      await replaceActivityAllocations(input.id, input.allocations, ctx.user.id, leadershipChanged ? `Mudança de liderança: ${input.leadershipChangeJustification!.trim()}` : undefined);
      if (leadershipChanged && priorLeadId && nextLeadId) {
        const db = await requireDb();
        await db.insert(activityLeadershipEvents).values({
          activityId: input.id,
          previousTeamMemberId: priorLeadId,
          nextTeamMemberId: nextLeadId,
          justification: input.leadershipChangeJustification!.trim(),
          assignedBy: ctx.user.id,
        });
      }
      return getActivity(input.id);
    }),

  updateReviewers: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        reviewerIds: activityReviewerIdsSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ensureSeedData();
      const activity = await getActivity(input.id);
      if (!activity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Atividade não encontrada.",
        });
      }
      const member = await getTeamMemberByUserId(ctx.user.id);
      assertCanManageActivityReview(ctx.user, member, activity.responsibleId);
      await validateReviewers(activity.responsibleId, input.reviewerIds, activity.id);
      await replaceActivityReviewers(input.id, input.reviewerIds, ctx.user.id);
      return getActivity(input.id);
    }),

  initializeReviewChecklist: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await ensureSeedData();
      const activity = await getActivity(input.id);
      if (!activity) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Atividade não encontrada." });
      }
      if (activity.parentActivityId !== null) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "O checklist de revisão deve ser criado na atividade-mãe." });
      }
      const member = await getTeamMemberByUserId(ctx.user.id);
      assertCanManageActivityReview(ctx.user, member, activity.responsibleId);
      return ensureActivityReviewChecklist(activity, ctx.user.id);
    }),

  applyOfficialChecklistSchedule: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await ensureSeedData();
      const activity = await getActivity(input.id);
      if (!activity) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Atividade não encontrada." });
      }
      if (activity.parentActivityId !== null) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Os prazos de revisão são configurados na atividade-mãe." });
      }
      const member = await getTeamMemberByUserId(ctx.user.id);
      assertCanManageActivityReview(ctx.user, member, activity.responsibleId);
      return applyOfficialReviewChecklistSchedule(activity, ctx.user.id);
    }),

  updateReviewChecklistItem: protectedProcedure
    .input(
      z
        .object({
          id: z.number().int().positive(),
          status: z.enum(["pendente", "em andamento", "concluído", "bloqueado"]).optional(),
          responsibleId: z.number().int().positive().nullable().optional(),
          dueAt: z.number().int().positive().nullable().optional(),
        })
        .refine(input => input.status !== undefined || input.responsibleId !== undefined || input.dueAt !== undefined, {
          message: "Informe ao menos uma alteração no item do checklist.",
        })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const currentRows = await db
        .select()
        .from(reviewChecklistItems)
        .where(eq(reviewChecklistItems.id, input.id))
        .limit(1);
      const current = currentRows[0];
      if (!current) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item de checklist não encontrado." });
      }
      const activity = await getActivity(current.activityId);
      if (!activity) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Atividade não encontrada." });
      }
      const member = await getTeamMemberByUserId(ctx.user.id);
      assertCanManageActivityReview(ctx.user, member, activity.responsibleId);
      if (input.responsibleId !== undefined && input.responsibleId !== null) {
        const members = await listTeamMembers();
        if (!members.some(item => item.id === input.responsibleId && item.active)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "O responsável deve ser um integrante ativo da equipe." });
        }
      }
      const changes: Partial<typeof reviewChecklistItems.$inferInsert> = {};
      const events: Array<{ eventType: "status_alterado" | "responsável_alterado" | "prazo_alterado"; summary: string }> = [];
      if (input.status !== undefined && input.status !== current.status) {
        changes.status = input.status;
        changes.completedAt = input.status === "concluído" ? Date.now() : null;
        changes.completedBy = input.status === "concluído" ? ctx.user.id : null;
        events.push({ eventType: "status_alterado", summary: `Estado alterado de ${current.status} para ${input.status}.` });
      }
      if (input.responsibleId !== undefined && input.responsibleId !== current.responsibleId) {
        changes.responsibleId = input.responsibleId;
        events.push({ eventType: "responsável_alterado", summary: "Responsável do checklist alterado." });
      }
      if (input.dueAt !== undefined && input.dueAt !== current.dueAt) {
        changes.dueAt = input.dueAt;
        events.push({ eventType: "prazo_alterado", summary: "Prazo do checklist alterado." });
      }
      if (Object.keys(changes).length) {
        await db.update(reviewChecklistItems).set(changes).where(eq(reviewChecklistItems.id, current.id));
      }
      if (events.length) {
        await db.insert(reviewChecklistEvents).values(
          events.map(event => ({
            checklistItemId: current.id,
            activityId: current.activityId,
            eventType: event.eventType,
            summary: event.summary,
            actorId: ctx.user.id,
          }))
        );
      }
      return listActivityReviewChecklist(current.activityId);
    }),

  updateDocumentStatus: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        nextStatus: z.enum(DOCUMENT_STATUSES),
        note: z.string().trim().min(3).max(2_000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ensureSeedData();
      const activity = await getActivity(input.id);
      if (!activity) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Atividade não encontrada." });
      }
      const currentStatus = activity.documentStatus;
      if (!DOCUMENT_TRANSITIONS[currentStatus].includes(input.nextStatus)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `A transição de ${currentStatus} para ${input.nextStatus} não é permitida pelo fluxo documental.`,
        });
      }
      const member = await getTeamMemberByUserId(ctx.user.id);
      const administrator = isAdministrator(ctx.user);
      const isExecutionMember = Boolean(
        member?.active && (
          activity.allocations.some(item => item.teamMemberId === member.id) ||
          member.id === activity.responsibleId
        )
      );
      const isActivityCoordinator = Boolean(
        administrator ||
        ctx.user.appRole === "coordenador" ||
        (member?.active && (
          member.id === activity.responsibleId ||
          member.groupRole === "coordenador" ||
          (activity.responsibleGroupId && member.groupId === activity.responsibleGroupId)
        ))
      );
      const isAssignedReviewer = Boolean(
        member?.active && activity.reviewers.some(item => item.teamMemberId === member.id)
      );

      if (["em elaboração", "submetida à revisão da seção"].includes(input.nextStatus)) {
        if (!administrator && !isExecutionMember && !isActivityCoordinator) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Somente o executor designado ou o coordenador do capítulo pode elaborar e submeter a seção.",
          });
        }
        if (input.nextStatus === "submetida à revisão da seção" && !activity.reviewers.length) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Indique ao menos um revisor antes de submeter a seção.",
          });
        }
      }

      if (["em revisão da seção", "ajustes solicitados", "revisada pela seção"].includes(input.nextStatus)) {
        if (!administrator && !isAssignedReviewer && !isActivityCoordinator) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Somente o revisor apontado ou o coordenador pode registrar o resultado da revisão de seção.",
          });
        }
        if (
          input.nextStatus === "revisada pela seção" &&
          activity.reviewers.some(item => item.status !== "aprovado") &&
          !administrator &&
          !isActivityCoordinator
        ) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Todos os revisores indicados devem aprovar a submissão antes da revisão da seção ser concluída.",
          });
        }
      }

      if (["consolidada no capítulo", "em revisão do tomo"].includes(input.nextStatus)) {
        if (!administrator && !isActivityCoordinator) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Somente o coordenador do capítulo ou administrador pode consolidar e encaminhar o capítulo ao tomo.",
          });
        }
        if (input.nextStatus === "consolidada no capítulo" && activity.parentActivityId === null) {
          const pendingChecklistItems = activity.reviewChecklist.items.filter(item => item.status !== "concluído");
          if (pendingChecklistItems.length) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: `Conclua os ${pendingChecklistItems.length} itens pendentes do checklist antes de consolidar o capítulo.`,
            });
          }
          await assertNoPriorityInterfaceBlock(activity);
        }
      }

      if (input.nextStatus === "aprovada no tomo") {
        if (activity.parentActivityId !== null) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "A aprovação de tomo é registrada na atividade-mãe do capítulo." });
        }
        await assertNoPriorityInterfaceBlock(activity);
        const tome = tomeForActivity(activity.sectionCode);
        const db = await requireDb();
        const assignments = tome ? await db.select().from(tomeGovernanceAssignments).where(eq(tomeGovernanceAssignments.tome, tome)).limit(1) : [];
        const assignment = assignments[0];
        const isTomeCoordinator = Boolean(member?.active && assignment && (assignment.coordinatorId === member.id || assignment.substituteId === member.id));
        if (!administrator && !isTomeCoordinator) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Somente o coordenador ou substituto designado do tomo pode aprovar o capítulo." });
        }
      }

      if (["em revisão do projeto", "aprovada para documentação final"].includes(input.nextStatus)) {
        if (activity.parentActivityId !== null) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "A revisão final do projeto é registrada na atividade-mãe do capítulo." });
        }
        if (input.nextStatus === "aprovada para documentação final") await assertNoPriorityInterfaceBlock(activity);
        const db = await requireDb();
        const governance = (await db.select().from(projectEditorialGovernance).orderBy(projectEditorialGovernance.assignedAt).limit(1))[0];
        const isProjectCoordinator = Boolean(member?.active && governance && (governance.coordinatorId === member.id || governance.substituteId === member.id));
        if (!administrator && !isProjectCoordinator) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Somente a coordenação editorial do projeto pode registrar a revisão ou aprovação final." });
        }
      }

      const db = await requireDb();
      await db.update(activities).set({ documentStatus: input.nextStatus }).where(eq(activities.id, activity.id));
      await db.insert(activityDocumentWorkflowEvents).values({
        activityId: activity.id,
        previousStatus: currentStatus,
        nextStatus: input.nextStatus,
        actorId: ctx.user.id,
        note: input.note?.trim() || null,
      });
      return getActivity(activity.id);
    }),

  updateDescriptionQuickly: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        description: z.string().trim().min(3).max(10_000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await ensureSeedData();
      const activity = await getActivity(input.id);
      if (!activity) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Atividade não encontrada." });
      }
      const member = await getTeamMemberByUserId(ctx.user.id);
      assertCanManageActivityAllocations(ctx.user, member, activity.responsibleId);
      const description = input.description.trim();
      if (description === activity.description) return activity;

      const db = await requireDb();
      const migrationKey = `edicao-rapida-descricao-${activity.id}-${Date.now()}`;
      await db.insert(scopeMigrationHistory).values({
        migrationKey,
        entityType: "activity",
        entityId: activity.id,
        action: "descricao_editada_rapida",
        snapshot: JSON.stringify({
          before: { description: activity.description },
          after: { description },
          editedBy: ctx.user.id,
        }),
      });
      await db.update(activities).set({ description }).where(eq(activities.id, activity.id));
      return getActivity(activity.id);
    }),

  updateSchedule: protectedProcedure
    .input(activityScheduleSchema)
    .mutation(async ({ ctx, input }) => {
      await ensureSeedData();
      const activity = await getActivity(input.id);
      if (!activity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Atividade não encontrada.",
        });
      }
      const member = await getTeamMemberByUserId(ctx.user.id);
      assertCanManageActivityAllocations(
        ctx.user,
        member,
        activity.responsibleId
      );
      const db = await requireDb();
      await db
        .update(activities)
        .set({ startAt: input.startAt, dueAt: input.dueAt })
        .where(eq(activities.id, input.id));
      return getActivity(input.id);
    }),

  updateMilestones: protectedProcedure
    .input(activityMilestoneSetSchema)
    .mutation(async ({ ctx, input }) => {
      await ensureSeedData();
      const activity = await getActivity(input.id);
      if (!activity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Atividade não encontrada.",
        });
      }
      const member = await getTeamMemberByUserId(ctx.user.id);
      assertCanManageActivityAllocations(
        ctx.user,
        member,
        activity.responsibleId
      );
      await replaceActivityMilestones(activity, input.milestones, ctx.user.id);
      return getActivity(input.id);
    }),

  addEvidenceLink: protectedProcedure
    .input(
      z.object({
        activityId: z.number().int().positive(),
        label: z.string().trim().min(3).max(240),
        url: z.string().url().max(4_000),
        linkType: z.enum(["material", "evidência de campo"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const activity = await getActivity(input.activityId);
      if (!activity) throw new TRPCError({ code: "NOT_FOUND", message: "Atividade não encontrada." });
      const member = await getTeamMemberByUserId(ctx.user.id);
      assertCanManageActivityAllocations(ctx.user, member, activity.responsibleId);
      const db = await requireDb();
      await db.insert(activityEvidenceLinks).values({
        activityId: input.activityId,
        label: input.label,
        url: input.url,
        linkType: input.linkType,
        createdBy: ctx.user.id,
      });
      return getActivity(input.activityId);
    }),

  removeEvidenceLink: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const [link] = await db.select().from(activityEvidenceLinks).where(eq(activityEvidenceLinks.id, input.id)).limit(1);
      if (!link) throw new TRPCError({ code: "NOT_FOUND", message: "Link não encontrado." });
      const activity = await getActivity(link.activityId);
      if (!activity) throw new TRPCError({ code: "NOT_FOUND", message: "Atividade não encontrada." });
      const member = await getTeamMemberByUserId(ctx.user.id);
      assertCanManageActivityAllocations(ctx.user, member, activity.responsibleId);
      await db.delete(activityEvidenceLinks).where(eq(activityEvidenceLinks.id, input.id));
      return getActivity(link.activityId);
    }),

  create: protectedProcedure
    .input(activityInputSchema)
    .mutation(async ({ ctx, input }) => {
      assertAdministrator(ctx.user);
      await ensureSeedData();
      const db = await requireDb();
      const { allocations, ...activityInput } = input;
      await validateResponsibleAndAllocations(
        activityInput.responsibleId,
        allocations
      );
      const inserted = await db
        .insert(activities)
        .values({ ...activityInput, createdBy: ctx.user.id })
        .$returningId();
      const activityId = inserted[0]?.id;
      if (!activityId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível criar a atividade.",
        });
      }
      await replaceActivityAllocations(activityId, allocations, ctx.user.id);
      await sendActivityNotification(
        activityId,
        "atribuicao",
        `activity:${activityId}:atribuicao:${activityInput.responsibleId}`
      );
      return getActivity(activityId);
    }),

  update: protectedProcedure
    .input(
      activityInputSchema.partial().extend({
        id: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const activity = await getActivity(input.id);
      if (!activity) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Atividade não encontrada." });
      }

      const existingAllocations = await db
        .select({
          teamMemberId: activityAllocations.teamMemberId,
          allocatedHours: activityAllocations.allocatedHours,
          responsibility: activityAllocations.responsibility,
          isExecutionLead: activityAllocations.isExecutionLead,
        })
        .from(activityAllocations)
        .where(
          and(
            eq(activityAllocations.activityId, input.id),
            eq(activityAllocations.allocationType, "vigente")
          )
        );
      const member = await getTeamMemberByUserId(ctx.user.id);
      const administrator = isAdministrator(ctx.user);
      const isCoordinator = Boolean(
        administrator ||
        ctx.user.appRole === "coordenador" ||
        (member?.active && (
          member.id === activity.responsibleId ||
          (member.groupRole === "coordenador" && (!activity.responsibleGroupId || member.groupId === activity.responsibleGroupId))
        ))
      );
      const isAllocatedExecutor = Boolean(
        member?.active && (
          existingAllocations.some(a => a.teamMemberId === member.id) ||
          member.id === activity.responsibleId ||
          (activity.responsibleGroupId && member.groupId === activity.responsibleGroupId)
        )
      );

      if (!administrator && !isCoordinator && !isAllocatedExecutor) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Somente administradores, coordenadores ou executores da atividade podem atualizar a etapa.",
        });
      }

      const responsibleId = input.responsibleId ?? activity.responsibleId;
      const allocations = input.allocations ?? existingAllocations.map(allocation => ({
        teamMemberId: allocation.teamMemberId,
        allocatedHours: allocation.allocatedHours,
        responsibility:
          allocation.responsibility ?? "Responsabilidade de execução",
        isExecutionLead: allocation.isExecutionLead,
      }));
      const { id, allocations: allocationChanges, ...changes } = input;

      if (allocationChanges !== undefined && allocationChanges.length > 0) {
        await validateResponsibleAndAllocations(responsibleId, allocations);
      }

      // Executores não podem alterar o responsável nem reatribuir outros membros
      if (!administrator && !isCoordinator) {
        if (input.responsibleId && input.responsibleId !== activity.responsibleId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Somente a coordenação ou administrador pode alterar o coordenador responsável pela atividade.",
          });
        }
        if (allocationChanges !== undefined) {
          const hasDifferentMembers = allocationChanges.length !== existingAllocations.length ||
            allocationChanges.some(ac => !existingAllocations.some(ea => ea.teamMemberId === ac.teamMemberId));
          if (hasDifferentMembers) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Somente o coordenador ou administrador pode alterar a composição da equipe.",
            });
          }
        }
      }

      if (Object.keys(changes).length) {
        await db.update(activities).set(changes).where(eq(activities.id, id));
      }
      if (allocationChanges !== undefined) {
        await replaceActivityAllocations(id, allocationChanges, ctx.user.id);
      }

      if (
        input.responsibleId &&
        input.responsibleId !== activity.responsibleId
      ) {
        await sendActivityNotification(
          id,
          "atribuicao",
          `activity:${id}:atribuicao:${input.responsibleId}`
        );
      }
      if (input.status === "atrasado" && activity.status !== "atrasado") {
        await sendActivityNotification(id, "atraso", `activity:${id}:atraso`);
      }

      return getActivity(id);
    }),
});
