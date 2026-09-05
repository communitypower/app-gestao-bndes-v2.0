import { TRPCError } from "@trpc/server";
import { and, eq, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import {
  activityReviewers,
  materialComments,
  materialRevisions,
  productionMaterials,
  reviewDecisions,
  reviewSubmissions,
  studySections,
} from "../../drizzle/schema";
import {
  assertAdministrator,
  assertCanManageActivityReview,
  assertCanReviewActivity,
  assertCanUploadActivityMaterial,
  assertCanViewActivityReview,
  canUploadActivityMaterial,
  canViewActivityReview,
  isAdministrator,
  type ActivityAccessMember,
} from "../access";
import { protectedProcedure, router } from "../_core/trpc";
import {
  ensureSeedData,
  getActivity,
  getTeamMemberByUserId,
  listActivities,
  listProductionMaterials,
  requireDb,
  syncActivityDocumentStatus,
} from "../db";
import { uploadProjectFile } from "../fileUpload";
import {
  createParticipantNotification,
  getUserIdForTeamMember,
} from "../notificationService";
import { storageGetSignedUrl } from "../storage";
import { fileInputSchema, reviewDecisionSchema } from "./schemas";

type ProductionMaterialRow = Awaited<
  ReturnType<typeof listProductionMaterials>
>[number];

function reviewScope(material: ProductionMaterialRow) {
  return {
    responsibleId: material.responsibleId ?? 0,
    responsibleGroupId: material.responsibleGroupId,
    reviewerIds: material.reviewers.map(reviewer => reviewer.teamMemberId),
  };
}

function isExecutionAssignee(
  activity: Awaited<ReturnType<typeof getActivity>> | null | undefined,
  memberId: number | undefined
) {
  return Boolean(
    memberId && activity?.allocations?.some(allocation => allocation.teamMemberId === memberId)
  );
}

function canViewMaterial(
  user: Parameters<typeof isAdministrator>[0],
  member: ActivityAccessMember | null,
  material: ProductionMaterialRow,
  activity?: Awaited<ReturnType<typeof getActivity>> | null
) {
  if (isAdministrator(user)) return true;
  if (!material.activityId) return Boolean(member?.active);
  const isAssignee = isExecutionAssignee(activity, member?.id);
  return (
    isAssignee ||
    canViewActivityReview(user, member, reviewScope(material))
  );
}

function assertCanEditMaterial(
  user: Parameters<typeof isAdministrator>[0],
  member: ActivityAccessMember | null,
  material: ProductionMaterialRow
) {
  if (!material.activityId || isAdministrator(user)) return;
  if (!member?.active) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Somente integrantes ativos podem desenvolver novas versões.",
    });
  }
}

function isMaterialManager(
  user: Parameters<typeof isAdministrator>[0],
  member: ActivityAccessMember | null,
  material: ProductionMaterialRow
) {
  return (
    isAdministrator(user) ||
    Boolean(
      member?.active && member.id === material.responsibleId
    )
  );
}

async function getMaterialOrThrow(materialId: number) {
  const material = (await listProductionMaterials()).find(
    item => item.id === materialId
  );
  if (!material) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Material não encontrado.",
    });
  }
  return material;
}

async function markPreviousSubmissionsReplaced(materialId: number) {
  const db = await requireDb();
  await db
    .update(reviewSubmissions)
    .set({ status: "substituído", completedAt: Date.now() })
    .where(
      and(
        eq(reviewSubmissions.materialId, materialId),
        ne(reviewSubmissions.status, "substituído")
      )
    );
}

export const productionRouter = router({
  allocatedActivities: protectedProcedure.query(async ({ ctx }) => {
    await ensureSeedData();
    const [allActivities, member] = await Promise.all([
      listActivities(),
      getTeamMemberByUserId(ctx.user.id),
    ]);

    if (isAdministrator(ctx.user)) {
      return allActivities.map(act => ({
        id: act.id,
        title: act.title,
        sectionId: act.sectionId,
        sectionCode: act.sectionCode,
        sectionTitle: act.sectionTitle,
        responsibleId: act.responsibleId,
        responsibleName: act.responsibleName,
        allocationRole: "administrador" as const,
        allocationLabel: "Administração",
      }));
    }

    if (!member?.active) {
      return [];
    }

    return allActivities
      .filter(act => canUploadActivityMaterial(ctx.user, member, act))
      .map(act => {
        let role: "coordenador" | "executor" | "revisor" | "grupo" = "grupo";
        let label = "Grupo Responsável";

        if (
          act.responsibleId === member.id ||
          (member.groupId &&
            member.groupId === act.responsibleGroupId &&
            member.groupRole === "coordenador")
        ) {
          role = "coordenador";
          label = "Coordenação";
        } else if (act.allocations?.some(a => a.teamMemberId === member.id)) {
          role = "executor";
          label = "Execução";
        } else if (act.reviewers?.some(r => r.teamMemberId === member.id)) {
          role = "revisor";
          label = "Revisão";
        }

        return {
          id: act.id,
          title: act.title,
          sectionId: act.sectionId,
          sectionCode: act.sectionCode,
          sectionTitle: act.sectionTitle,
          responsibleId: act.responsibleId,
          responsibleName: act.responsibleName,
          allocationRole: role,
          allocationLabel: label,
        };
      });
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const [materials, member] = await Promise.all([
      listProductionMaterials(),
      getTeamMemberByUserId(ctx.user.id),
    ]);
    const materialsWithActivities = await Promise.all(materials.map(async material => ({
      material,
      activity: material.activityId ? await getActivity(material.activityId) : null,
    })));
    return materialsWithActivities
      .filter(({ material, activity }) => canViewMaterial(ctx.user, member, material, activity))
      .map(({ material, activity }) => ({
        ...material,
        activityDocumentStatus: activity?.documentStatus ?? null,
        permissions: {
          canManageReview: isMaterialManager(ctx.user, member, material),
          canDevelop: Boolean(
            !material.activityId ||
              isAdministrator(ctx.user) ||
              (member?.active &&
                member.groupId === material.responsibleGroupId)
          ),
          canReview: Boolean(
            member?.active &&
              !isExecutionAssignee(activity, member.id) &&
              material.reviewers.some(
                reviewer => reviewer.teamMemberId === member.id
              )
          ),
          isGroupViewer: Boolean(
            member?.active &&
              member.groupId &&
              member.groupId === material.responsibleGroupId
          ),
        },
      }));
  }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().trim().min(3).max(320),
        description: z.string().trim().max(10_000).nullable(),
        activityId: z.number().int().positive().nullable(),
        sectionId: z.number().int().positive(),
        notes: z.string().trim().max(10_000).nullable(),
        file: fileInputSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const member = await getTeamMemberByUserId(ctx.user.id);
      if (input.activityId) {
        const activity = await getActivity(input.activityId);
        if (!activity) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Atividade não encontrada.",
          });
        }
        assertCanUploadActivityMaterial(
          ctx.user,
          member,
          activity
        );
        if (activity.sectionId !== input.sectionId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "O material deve usar a mesma seção da atividade.",
          });
        }
      } else {
        if (!isAdministrator(ctx.user)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Selecione uma atividade alocada ao seu perfil para vincular o material.",
          });
        }
      }
      const section = await db
        .select({ code: studySections.code })
        .from(studySections)
        .where(eq(studySections.id, input.sectionId))
        .limit(1);
      if (!section[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Seção não encontrada.",
        });
      }
      const stored = await uploadProjectFile(
        "production",
        section[0].code,
        input.file
      );
      const inserted = await db
        .insert(productionMaterials)
        .values({
          title: input.title,
          description: input.description,
          activityId: input.activityId,
          sectionId: input.sectionId,
          createdBy: ctx.user.id,
        })
        .returning({ id: productionMaterials.id });
      const materialId = inserted[0]?.id;
      if (!materialId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível criar o material.",
        });
      }
      await db.insert(materialRevisions).values({
        materialId,
        revisionNumber: 1,
        notes: input.notes,
        fileName: input.file.fileName,
        mimeType: input.file.mimeType,
        fileSize: input.file.fileSize,
        storageKey: stored.key,
        storageUrl: stored.url,
        uploadedBy: ctx.user.id,
      });
      return getMaterialOrThrow(materialId);
    }),

  addRevision: protectedProcedure
    .input(
      z.object({
        materialId: z.number().int().positive(),
        notes: z.string().trim().max(10_000).nullable(),
        file: fileInputSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [material, member] = await Promise.all([
        getMaterialOrThrow(input.materialId),
        getTeamMemberByUserId(ctx.user.id),
      ]);
      assertCanEditMaterial(ctx.user, member, material);
      const db = await requireDb();
      const stored = await uploadProjectFile(
        "production",
        material.sectionCode,
        input.file
      );
      const nextRevision = material.currentRevision + 1;
      await db.insert(materialRevisions).values({
        materialId: input.materialId,
        revisionNumber: nextRevision,
        notes: input.notes,
        fileName: input.file.fileName,
        mimeType: input.file.mimeType,
        fileSize: input.file.fileSize,
        storageKey: stored.key,
        storageUrl: stored.url,
        uploadedBy: ctx.user.id,
      });
      await markPreviousSubmissionsReplaced(input.materialId);
      await db
        .update(productionMaterials)
        .set({ currentRevision: nextRevision, reviewStatus: "em elaboração" })
        .where(eq(productionMaterials.id, input.materialId));
      if (material.activityId) {
        await db
          .update(activityReviewers)
          .set({ status: "pendente", decisionNote: null, decidedAt: null })
          .where(eq(activityReviewers.activityId, material.activityId));
        await syncActivityDocumentStatus(
          material.activityId,
          "em elaboração",
          ctx.user.id,
          input.notes ? `Nova versão ${nextRevision}: ${input.notes}` : `Nova versão ${nextRevision} registrada em elaboração.`
        );
      }
      return getMaterialOrThrow(input.materialId);
    }),

  submitForReview: protectedProcedure
    .input(
      z.object({
        materialId: z.number().int().positive(),
        message: z.string().trim().max(10_000).nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [material, member] = await Promise.all([
        getMaterialOrThrow(input.materialId),
        getTeamMemberByUserId(ctx.user.id),
      ]);
      if (!material.activityId || !material.responsibleId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Vincule o material a uma atividade antes de submetê-lo.",
        });
      }
      const activity = await getActivity(material.activityId);
      const isAssignedExecutor = Boolean(
        member?.active && (activity?.allocations ?? []).some(allocation => allocation.teamMemberId === member.id)
      );
      if (
        !isAdministrator(ctx.user) &&
        member?.id !== material.responsibleId &&
        !isAssignedExecutor
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Somente o executor designado ou o coordenador do capítulo pode submeter a versão à revisão.",
        });
      }
      if (!material.reviewers.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Aloque ao menos um revisor antes da submissão.",
        });
      }
      const revision = material.revisions.find(
        item => item.revisionNumber === material.currentRevision
      );
      if (!revision) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "A revisão atual do material não foi encontrada.",
        });
      }
      const db = await requireDb();
      await markPreviousSubmissionsReplaced(material.id);
      const inserted = await db
        .insert(reviewSubmissions)
        .values({
          activityId: material.activityId,
          materialId: material.id,
          revisionId: revision.id,
          submittedBy: ctx.user.id,
          status: "em revisão",
          message: input.message,
          submittedAt: Date.now(),
        })
        .returning({ id: reviewSubmissions.id });
      await db
        .update(productionMaterials)
        .set({ reviewStatus: "em revisão" })
        .where(eq(productionMaterials.id, material.id));
      await db
        .update(activityReviewers)
        .set({ status: "em revisão", decisionNote: null, decidedAt: null })
        .where(eq(activityReviewers.activityId, material.activityId));
      if (material.activityId) {
        await syncActivityDocumentStatus(
          material.activityId,
          "submetida à revisão da seção",
          ctx.user.id,
          input.message ?? "Versão do material submetida formalmente para revisão da seção."
        );

        // Notificar todos os revisores atribuídos
        const actCode = activity?.planCode || activity?.detailCode || "";
        for (const rev of material.reviewers) {
          const revUserId = await getUserIdForTeamMember(rev.teamMemberId);
          if (revUserId && revUserId !== ctx.user.id) {
            await createParticipantNotification({
              recipientUserId: revUserId,
              actorUserId: ctx.user.id,
              activityId: material.activityId,
              type: "versao_submetida",
              title: "Nova versão submetida para revisão",
              message: `A atividade ${actCode ? `${actCode} — ` : ""}("${activity?.title ?? material.title}") teve uma nova versão submetida para sua revisão técnica.`,
              actionUrl: `/atividades?ficha=${material.activityId}`,
            });
          }
        }
      }
      return { submissionId: inserted[0]?.id ?? null };
    }),

  addComment: protectedProcedure
    .input(
      z.object({
        materialId: z.number().int().positive(),
        submissionId: z.number().int().positive().nullable(),
        content: z.string().trim().min(2).max(10_000),
        commentType: z.enum([
          "comentário",
          "solicitação de ajuste",
          "resposta",
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [material, member] = await Promise.all([
        getMaterialOrThrow(input.materialId),
        getTeamMemberByUserId(ctx.user.id),
      ]);
      const db = await requireDb();
      if (!input.submissionId) {
        if (material.activityId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Selecione uma submissão formal para comentar.",
          });
        }
        await db.insert(materialComments).values({
          materialId: material.id,
          revisionId: material.revisions[0]?.id ?? null,
          submissionId: null,
          authorId: ctx.user.id,
          content: input.content,
          commentType: "comentário",
        });
        return getMaterialOrThrow(material.id);
      }
      const submission = material.submissions.find(
        item => item.id === input.submissionId
      );
      if (!submission || submission.status === "substituído") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "A submissão selecionada não está disponível para comentários.",
        });
      }
      assertCanViewActivityReview(ctx.user, member, reviewScope(material));
      const activity = material.activityId ? await getActivity(material.activityId) : null;
      const isAssignee = isExecutionAssignee(activity, member?.id);
      const manager = isMaterialManager(ctx.user, member, material);
      const reviewer = Boolean(
        member?.active &&
          material.reviewers.some(item => item.teamMemberId === member.id)
      );
      if (!manager && !reviewer && !isAssignee && !isAdministrator(ctx.user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "A visualização pelo grupo não inclui o registro de comentários.",
        });
      }
      if (input.commentType === "resposta" && !manager && !isAssignee && !isAdministrator(ctx.user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Somente o autor responsável ou a coordenação pode registrar respostas.",
        });
      }
      if (input.commentType === "solicitação de ajuste" && !reviewer && !isAdministrator(ctx.user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Somente revisores apontados podem solicitar ajustes.",
        });
      }
      await db.insert(materialComments).values({
        materialId: material.id,
        revisionId: submission.revisionId,
        submissionId: submission.id,
        authorId: ctx.user.id,
        content: input.content,
        commentType: input.commentType,
        status: input.commentType === "solicitação de ajuste" ? "aberto" : "aberto",
      });
      return getMaterialOrThrow(material.id);
    }),

  implementComment: protectedProcedure
    .input(
      z.object({
        commentId: z.number().int().positive(),
        implementationNote: z.string().trim().min(2).max(10_000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const commentRow = await db
        .select({
          id: materialComments.id,
          materialId: materialComments.materialId,
          status: materialComments.status,
        })
        .from(materialComments)
        .where(eq(materialComments.id, input.commentId))
        .limit(1);
      const comment = commentRow[0];
      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Apontamento não encontrado.",
        });
      }
      const [material, member] = await Promise.all([
        getMaterialOrThrow(comment.materialId),
        getTeamMemberByUserId(ctx.user.id),
      ]);
      const activity = material.activityId ? await getActivity(material.activityId) : null;
      const isAssignee = isExecutionAssignee(activity, member?.id);
      const isManager = isMaterialManager(ctx.user, member, material);
      if (!isAssignee && !isManager && !isAdministrator(ctx.user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Somente o autor/executor responsável ou a coordenação pode registrar a implementação do apontamento.",
        });
      }
      await db
        .update(materialComments)
        .set({
          status: "implementado",
          implementationNote: input.implementationNote,
          implementedAt: Date.now(),
          implementedBy: ctx.user.id,
        })
        .where(eq(materialComments.id, input.commentId));

      // Notificar revisores que o apontamento foi atendido
      if (material.activityId) {
        const actCode = activity?.planCode || activity?.detailCode || "";
        for (const rev of material.reviewers) {
          const revUserId = await getUserIdForTeamMember(rev.teamMemberId);
          if (revUserId && revUserId !== ctx.user.id) {
            await createParticipantNotification({
              recipientUserId: revUserId,
              actorUserId: ctx.user.id,
              activityId: material.activityId,
              type: "ajustes_implementados",
              title: "Apontamento atendido pelo autor",
              message: `O autor registrou a implementação de apontamento na atividade ${actCode ? `${actCode} — ` : ""}("${activity?.title ?? material.title}"). Valide na Estação de Revisão.`,
              actionUrl: `/atividades?ficha=${material.activityId}`,
            });
          }
        }
      }

      return getMaterialOrThrow(material.id);
    }),

  resolveComment: protectedProcedure
    .input(z.object({ commentId: z.number().int().positive(), resolved: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const comment = await db
        .select({ materialId: materialComments.materialId })
        .from(materialComments)
        .where(eq(materialComments.id, input.commentId))
        .limit(1);
      if (!comment[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comentário não encontrado.",
        });
      }
      const [material, member] = await Promise.all([
        getMaterialOrThrow(comment[0].materialId),
        getTeamMemberByUserId(ctx.user.id),
      ]);
      const isReviewer = Boolean(
        member?.active &&
          material.reviewers.some(r => r.teamMemberId === member.id)
      );
      const isManager = isMaterialManager(ctx.user, member, material);
      if (!isReviewer && !isManager && !isAdministrator(ctx.user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Somente os revisores designados ou a coordenação podem aceitar ou reabrir apontamentos.",
        });
      }
      await db
        .update(materialComments)
        .set({
          status: input.resolved ? "resolvido" : "aberto",
          resolvedAt: input.resolved ? Date.now() : null,
          resolvedBy: input.resolved ? ctx.user.id : null,
        })
        .where(eq(materialComments.id, input.commentId));
      return getMaterialOrThrow(material.id);
    }),

  reviewDecision: protectedProcedure
    .input(reviewDecisionSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const submissionRow = await db
        .select({
          id: reviewSubmissions.id,
          materialId: reviewSubmissions.materialId,
          activityId: reviewSubmissions.activityId,
          status: reviewSubmissions.status,
        })
        .from(reviewSubmissions)
        .where(eq(reviewSubmissions.id, input.submissionId))
        .limit(1);
      const submission = submissionRow[0];
      if (!submission || submission.status === "substituído") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Esta submissão não está aberta para parecer.",
        });
      }
      const [material, member, activity] = await Promise.all([
        getMaterialOrThrow(submission.materialId),
        getTeamMemberByUserId(ctx.user.id),
        getActivity(submission.activityId),
      ]);
      if (isExecutionAssignee(activity, member?.id)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "O executor designado não pode emitir parecer sobre o próprio trabalho.",
        });
      }
      assertCanReviewActivity(
        ctx.user,
        member,
        material.reviewers.map(item => item.teamMemberId)
      );

      // Bloqueio mandatário: aprovação só é autorizada quando todos os apontamentos de ajuste estiverem resolvidos
      if (input.decision === "aprovado") {
        const allComments = await db
          .select({
            id: materialComments.id,
            status: materialComments.status,
            commentType: materialComments.commentType,
            resolvedAt: materialComments.resolvedAt,
          })
          .from(materialComments)
          .where(
            and(
              eq(materialComments.materialId, material.id),
              eq(materialComments.commentType, "solicitação de ajuste"),
              or(
                eq(materialComments.submissionId, submission.id),
                sql`${materialComments.submissionId} IS NULL`
              )
            )
          );
        const pendingAdjustments = allComments.filter(
          c => c.status !== "resolvido" && !c.resolvedAt
        );
        if (pendingAdjustments.length > 0) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `A aprovação está bloqueada pois existem ${pendingAdjustments.length} apontamento(s) de ajuste não resolvido(s). Valide e aceite todos os apontamentos antes de aprovar e remeter ao coordenador.`,
          });
        }
      }

      await db
        .insert(reviewDecisions)
        .values({
          submissionId: submission.id,
          reviewerId: member!.id,
          decision: input.decision,
          note: input.note,
          decidedAt: Date.now(),
        })
        .onConflictDoUpdate({
          target: [reviewDecisions.submissionId, reviewDecisions.reviewerId],
          set: {
            decision: input.decision,
            note: input.note,
            decidedAt: Date.now(),
          },
        });
      await db
        .update(activityReviewers)
        .set({
          status: input.decision,
          decisionNote: input.note,
          decidedAt: Date.now(),
        })
        .where(
          and(
            eq(activityReviewers.activityId, submission.activityId),
            eq(activityReviewers.teamMemberId, member!.id)
          )
        );
      const decisions = await db
        .select({ decision: reviewDecisions.decision })
        .from(reviewDecisions)
        .where(eq(reviewDecisions.submissionId, submission.id));
      const hasAdjustments = decisions.some(
        item => item.decision === "ajustes solicitados"
      );
      const allApproved =
        decisions.length === material.reviewers.length &&
        material.reviewers.length > 0 &&
        decisions.every(item => item.decision === "aprovado");
      const submissionStatus = hasAdjustments
        ? "ajustes solicitados"
        : allApproved
          ? "aprovado"
          : "em revisão";
      await db
        .update(reviewSubmissions)
        .set({
          status: submissionStatus,
          completedAt: allApproved || hasAdjustments ? Date.now() : null,
        })
        .where(eq(reviewSubmissions.id, submission.id));
      await db
        .update(productionMaterials)
        .set({
          reviewStatus: allApproved
            ? "aprovado"
            : hasAdjustments
              ? "em elaboração"
              : "em revisão",
        })
        .where(eq(productionMaterials.id, material.id));

      if (hasAdjustments) {
        if (material.activityId) {
          await syncActivityDocumentStatus(
            material.activityId,
            "ajustes solicitados",
            ctx.user.id,
            input.note ?? "Ajustes solicitados pela equipe de revisão."
          );

          // Notificar autores/executores
          const actCode = activity?.planCode || activity?.detailCode || "";
          const targetMemberIds: number[] = [];
          if (material.responsibleId && !targetMemberIds.includes(material.responsibleId)) {
            targetMemberIds.push(material.responsibleId);
          }
          (activity?.allocations ?? []).forEach(a => {
            if (!targetMemberIds.includes(a.teamMemberId)) targetMemberIds.push(a.teamMemberId);
          });
          for (let i = 0; i < targetMemberIds.length; i++) {
            const tId = targetMemberIds[i];
            const targetUserId = await getUserIdForTeamMember(tId);
            if (targetUserId && targetUserId !== ctx.user.id) {
              await createParticipantNotification({
                recipientUserId: targetUserId,
                actorUserId: ctx.user.id,
                activityId: material.activityId,
                type: "ajustes_solicitados",
                title: "Ajustes solicitados pela revisão técnica",
                message: `Foram solicitados ajustes na atividade ${actCode ? `${actCode} — ` : ""}("${activity?.title ?? material.title}"). Verifique os apontamentos e submeta nova versão.`,
                actionUrl: `/atividades?ficha=${material.activityId}`,
              });
            }
          }
        }
      } else if (allApproved) {
        if (material.activityId) {
          await syncActivityDocumentStatus(
            material.activityId,
            "revisada pela seção",
            ctx.user.id,
            "Seção aprovada pelos revisores. Habilitada para remissão ao coordenador do capítulo."
          );

          // Notificar coordenador do capítulo para homologação/remissão
          const actCode = activity?.planCode || activity?.detailCode || "";
          const coordMemberId = material.responsibleId;
          if (coordMemberId) {
            const coordUserId = await getUserIdForTeamMember(coordMemberId);
            if (coordUserId && coordUserId !== ctx.user.id) {
              await createParticipantNotification({
                recipientUserId: coordUserId,
                actorUserId: ctx.user.id,
                activityId: material.activityId,
                type: "secao_aprovada",
                title: "Seção revisada e aprovada - Pronta para Consolidação",
                message: `A atividade ${actCode ? `${actCode} — ` : ""}("${activity?.title ?? material.title}") foi aprovada por todos os revisores e aguarda homologação no capítulo.`,
                actionUrl: `/atividades?ficha=${material.activityId}`,
              });
            }
          }
        }
      }

      return getMaterialOrThrow(material.id);
    }),

  consolidateInChapter: protectedProcedure
    .input(
      z.object({
        materialId: z.number().int().positive(),
        note: z.string().trim().max(2_000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const material = await getMaterialOrThrow(input.materialId);
      if (!material.activityId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Material não vinculado a uma atividade.",
        });
      }
      const [activity, member] = await Promise.all([
        getActivity(material.activityId),
        getTeamMemberByUserId(ctx.user.id),
      ]);
      if (!activity) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Atividade não encontrada.",
        });
      }
      const isChapterCoord = Boolean(
        member?.active &&
          (member.id === material.responsibleId ||
            (member.groupId &&
              member.groupId === material.responsibleGroupId &&
              member.groupRole === "coordenador"))
      );
      if (!isChapterCoord && !isAdministrator(ctx.user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Somente o coordenador do capítulo ou administrador pode homologar a seção e consolidar no capítulo.",
        });
      }
      await syncActivityDocumentStatus(
        material.activityId,
        "consolidada no capítulo",
        ctx.user.id,
        input.note ?? "Seção homologada e consolidada no capítulo pelo coordenador."
      );

      // Notificar executores e revisores da homologação final
      const notifyMemberIds: number[] = [];
      (activity.allocations ?? []).forEach(a => {
        if (!notifyMemberIds.includes(a.teamMemberId)) notifyMemberIds.push(a.teamMemberId);
      });
      material.reviewers.forEach(r => {
        if (!notifyMemberIds.includes(r.teamMemberId)) notifyMemberIds.push(r.teamMemberId);
      });
      const actCode = activity.planCode || activity.detailCode || "";
      for (let i = 0; i < notifyMemberIds.length; i++) {
        const mId = notifyMemberIds[i];
        const uId = await getUserIdForTeamMember(mId);
        if (uId && uId !== ctx.user.id) {
          await createParticipantNotification({
            recipientUserId: uId,
            actorUserId: ctx.user.id,
            activityId: material.activityId,
            type: "capitulo_consolidado",
            title: "Seção homologada e consolidada no capítulo",
            message: `A atividade ${actCode ? `${actCode} — ` : ""}("${activity.title}") foi homologada e consolidada com sucesso no capítulo.`,
            actionUrl: `/atividades?ficha=${material.activityId}`,
          });
        }
      }

      return getMaterialOrThrow(material.id);
    }),

  setReviewStatus: protectedProcedure
    .input(
      z.object({
        materialId: z.number().int().positive(),
        reviewStatus: z.enum(["em elaboração", "em revisão", "aprovado"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      assertAdministrator(ctx.user);
      const material = await getMaterialOrThrow(input.materialId);
      if (material.activityId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Use o fluxo formal de submissão e parecer para este material.",
        });
      }
      const db = await requireDb();
      await db
        .update(productionMaterials)
        .set({ reviewStatus: input.reviewStatus })
        .where(eq(productionMaterials.id, input.materialId));
      return getMaterialOrThrow(input.materialId);
    }),

  accessRevision: protectedProcedure
    .input(z.object({ revisionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const db = await requireDb();
      const revision = await db
        .select({
          key: materialRevisions.storageKey,
          materialId: materialRevisions.materialId,
        })
        .from(materialRevisions)
        .where(eq(materialRevisions.id, input.revisionId))
        .limit(1);
      if (!revision[0]?.key) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Revisão não encontrada.",
        });
      }
      const [material, member] = await Promise.all([
        getMaterialOrThrow(revision[0].materialId),
        getTeamMemberByUserId(ctx.user.id),
      ]);
      if (material.activityId) {
        assertCanViewActivityReview(ctx.user, member, reviewScope(material));
      }
      return { url: await storageGetSignedUrl(revision[0].key) };
    }),
});
