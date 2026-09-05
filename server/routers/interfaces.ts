import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  coordinationInterfaces,
  interfaceAiAnalyses,
  interfaceActivities,
  interfaceComments,
  interfaceEvidenceFiles,
  interfaceEvents,
  interfaceGroups,
  interfaceSections,
} from "../../drizzle/schema";
import {
  assertCanManageCoordinationInterface,
  assertCanResolveCoordinationInterface,
  assertCanViewCoordinationInterface,
  canViewCoordinationInterface,
  isAdministrator,
} from "../access";
import { invokeLLM } from "../_core/llm";
import { protectedProcedure, router } from "../_core/trpc";
import { uploadProjectFile } from "../fileUpload";
import { storageGetSignedUrl } from "../storage";
import {
  ensureSeedData,
  getCoordinationInterface,
  getTeamMemberByUserId,
  listActivities,
  listCoordinationInterfaces,
  listSections,
  listTeamGroups,
  listTeamMembers,
  requireDb,
} from "../db";
import { coordinationInterfaceInputSchema, fileInputSchema } from "./schemas";

async function validateInterfaceSelection(input: {
  responsibleId: number;
  sectionIds: number[];
  groupIds: number[];
  activityIds: number[];
  status: "identificada" | "em discussão" | "encaminhada" | "resolvida";
  resolution: string | null;
}) {
  const [sections, groups, members, activities] = await Promise.all([
    listSections(),
    listTeamGroups(),
    listTeamMembers(),
    listActivities(),
  ]);
  const sectionSet = new Set(sections.map(item => item.id));
  if (input.sectionIds.some(id => !sectionSet.has(id))) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Uma das seções selecionadas não existe.",
    });
  }
  const activeGroupSet = new Set(
    groups.filter(item => item.active).map(item => item.id)
  );
  if (input.groupIds.some(id => !activeGroupSet.has(id))) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Selecione apenas grupos ativos.",
    });
  }
  const requestedActivityIds = input.activityIds ?? [];
  const selectedActivities = (activities ?? []).filter(activity =>
    requestedActivityIds.includes(activity.id)
  );
  if (selectedActivities.length !== requestedActivityIds.length) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Um dos itens de atividade selecionados não existe.",
    });
  }
  if (
    selectedActivities.some(
      activity =>
        !input.sectionIds.includes(activity.sectionId)
    )
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Cada item relacionado deve pertencer a uma seção e grupo selecionados na interface.",
    });
  }
  const responsible = members.find(item => item.id === input.responsibleId);
  if (
    !responsible?.active
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "O responsável deve ser um integrante ativo da equipe.",
    });
  }
  if (input.status === "resolvida" && !input.resolution?.trim()) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Registre a solução adotada antes de encerrar a interface.",
    });
  }
  return responsible;
}

async function replaceRelations(
  interfaceId: number,
  sectionIds: number[],
  groupIds: number[],
  activityIds: number[],
  responsibleGroupId: number
) {
  const db = await requireDb();
  await db
    .delete(interfaceSections)
    .where(eq(interfaceSections.interfaceId, interfaceId));
  await db
    .delete(interfaceGroups)
    .where(eq(interfaceGroups.interfaceId, interfaceId));
  await db
    .delete(interfaceActivities)
    .where(eq(interfaceActivities.interfaceId, interfaceId));
  await db.insert(interfaceSections).values(
    sectionIds.map((sectionId, index) => ({
      interfaceId,
      sectionId,
      role: index === 0 ? ("origem" as const) : ("relacionada" as const),
    }))
  );
  await db.insert(interfaceGroups).values(
    groupIds.map(groupId => ({
      interfaceId,
      groupId,
      role:
        groupId === responsibleGroupId
          ? ("responsável" as const)
          : ("envolvido" as const),
    }))
  );
  if (activityIds.length) {
    await db.insert(interfaceActivities).values(
      activityIds.map((activityId, index) => ({
        interfaceId,
        activityId,
        role: index === 0 ? ("origem" as const) : ("relacionada" as const),
      }))
    );
  }
}

export const interfacesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    await ensureSeedData();
    const [items, member] = await Promise.all([
      listCoordinationInterfaces(),
      getTeamMemberByUserId(ctx.user.id),
    ]);
    return items
      .filter(item =>
        canViewCoordinationInterface(
          ctx.user,
          member,
          item.groups.map(group => group.groupId)
        )
      )
      .map(item => ({
        ...item,
        permissions: {
          canUploadEvidence: canViewCoordinationInterface(
            ctx.user,
            member,
            item.groups.map(group => group.groupId)
          ),
          canManage:
            isAdministrator(ctx.user) ||
            Boolean(
              member?.active &&
                item.groups.some(group => group.groupId === member.groupId)
            ),
          canResolve:
            isAdministrator(ctx.user) ||
            Boolean(
              member?.active && member.id === item.responsibleId
            ),
        },
      }));
  }),

  options: protectedProcedure.query(async ({ ctx }) => {
    const member = await getTeamMemberByUserId(ctx.user.id);
    if (!isAdministrator(ctx.user) && !member?.active) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Somente integrantes ativos podem cadastrar interfaces.",
      });
    }
    const [sections, groups, members, activities] = await Promise.all([
      listSections(),
      listTeamGroups(),
      listTeamMembers(),
      listActivities(),
    ]);
    return {
      sections,
      groups: groups.filter(group => group.active),
      coordinators: members.filter(item => item.active),
      activities: (activities ?? []).map(activity => ({
        id: activity.id,
        planCode: activity.planCode,
        title: activity.title,
        sectionId: activity.sectionId,
        responsibleGroupId: activity.responsibleGroupId,
      })),
      currentMember: member,
      isAdmin: isAdministrator(ctx.user),
    };
  }),

  uploadEvidence: protectedProcedure
    .input(z.object({ interfaceId: z.number().int().positive(), activityId: z.number().int().positive().nullable(), file: fileInputSchema }))
    .mutation(async ({ ctx, input }) => {
      const item = await getCoordinationInterface(input.interfaceId);
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Interface não encontrada." });
      const member = await getTeamMemberByUserId(ctx.user.id);
      assertCanViewCoordinationInterface(ctx.user, member, item.groups.map(group => group.groupId));
      if (input.activityId && !item.activities.some(activity => activity.activityId === input.activityId)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A atividade selecionada não está vinculada à interface." });
      }
      const stored = await uploadProjectFile("interfaces", `interface-${input.interfaceId}`, input.file);
      const db = await requireDb();
      await db.insert(interfaceEvidenceFiles).values({
        interfaceId: input.interfaceId,
        activityId: input.activityId,
        fileName: input.file.fileName,
        mimeType: input.file.mimeType,
        fileSize: input.file.fileSize,
        storageKey: stored.key,
        storageUrl: stored.url,
        uploadedBy: ctx.user.id,
      });
      await db.insert(interfaceEvents).values({ interfaceId: input.interfaceId, eventType: "atualizada", summary: `Evidência anexada: ${input.file.fileName}`, actorId: ctx.user.id });
      return { storageUrl: stored.url };
    }),

  preAnalyze: protectedProcedure
    .input(z.object({ interfaceId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const item = await getCoordinationInterface(input.interfaceId);
      if (!item) throw new TRPCError({ code: "NOT_FOUND", message: "Interface não encontrada." });
      const member = await getTeamMemberByUserId(ctx.user.id);
      assertCanManageCoordinationInterface(ctx.user, member, item.groups.map(group => group.groupId));
      const db = await requireDb();
      const files = await db.select().from(interfaceEvidenceFiles).where(eq(interfaceEvidenceFiles.interfaceId, input.interfaceId));
      if (files.length < 2) throw new TRPCError({ code: "BAD_REQUEST", message: "Anexe ao menos dois arquivos para a pré-análise de inconsistências." });
      try {
        const fileContent = await Promise.all(files.filter(file => file.mimeType === "application/pdf").map(async file => ({ type: "file_url" as const, file_url: { url: await storageGetSignedUrl(file.storageKey), mime_type: "application/pdf" as const } })));
        const response = await invokeLLM({
          model: "gpt-5-mini",
          messages: [
            { role: "system", content: "Você é um revisor técnico. Compare apenas os arquivos fornecidos. Identifique inconsistências de escopo, conceito, número, definição, cronologia, duplicidade e lacuna. Não decida a solução; produza evidências para deliberação humana." },
            { role: "user", content: [{ type: "text", text: `Interface: ${item.title}\nDescrição: ${item.description}\nRetorne JSON com resumo, achados (tema, severidade, evidência, recomendação) e limitações.` }, ...fileContent] },
          ],
          response_format: { type: "json_object" },
          max_tokens: 4000,
        });
        const result = typeof response.choices[0]?.message.content === "string" ? response.choices[0].message.content : JSON.stringify(response.choices[0]?.message.content);
        await db.insert(interfaceAiAnalyses).values({ interfaceId: input.interfaceId, model: "gpt-5-mini", status: "concluída", resultJson: result, requestedBy: ctx.user.id });
        await db.insert(interfaceEvents).values({ interfaceId: input.interfaceId, eventType: "atualizada", summary: "Pré-análise de inconsistências por IA concluída; requer deliberação humana.", actorId: ctx.user.id });
        return { result };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha ao executar a pré-análise.";
        await db.insert(interfaceAiAnalyses).values({ interfaceId: input.interfaceId, model: "gpt-5-mini", status: "falhou", errorMessage: message, requestedBy: ctx.user.id });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
      }
    }),

  create: protectedProcedure
    .input(coordinationInterfaceInputSchema)
    .mutation(async ({ ctx, input }) => {
      const member = await getTeamMemberByUserId(ctx.user.id);
      if (!isAdministrator(ctx.user)) {
        if (
          !member?.active ||
          input.responsibleId !== member.id ||
          Boolean(member.groupId && !input.groupIds.includes(member.groupId))
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "O integrante ativo deve assumir a interface e incluir o próprio grupo, quando houver vínculo de grupo.",
          });
        }
      }
      const responsible = await validateInterfaceSelection(input);
      const db = await requireDb();
      const inserted = await db
        .insert(coordinationInterfaces)
        .values({
          title: input.title,
          description: input.description,
          interfaceType: input.interfaceType,
          responsibleId: input.responsibleId,
          priority: input.priority,
          blockingClass: input.blockingClass,
          status: input.status,
          dueAt: input.dueAt,
          resolution: input.resolution,
          resolvedAt: input.status === "resolvida" ? Date.now() : null,
          createdBy: ctx.user.id,
        })
        .returning({ id: coordinationInterfaces.id });
      const interfaceId = inserted[0]?.id;
      if (!interfaceId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível criar a interface.",
        });
      }
      await replaceRelations(
        interfaceId,
        input.sectionIds,
        input.groupIds,
        input.activityIds,
        responsible.groupId ?? input.groupIds[0]!
      );
      await db.insert(interfaceEvents).values({
        interfaceId,
        actorId: ctx.user.id,
        eventType: "criada",
        summary: `Interface criada com status ${input.status}.`,
      });
      return getCoordinationInterface(interfaceId);
    }),

  update: protectedProcedure
    .input(coordinationInterfaceInputSchema.safeExtend({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const current = await getCoordinationInterface(input.id);
      if (!current) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Interface não encontrada.",
        });
      }
      const member = await getTeamMemberByUserId(ctx.user.id);
      const currentGroupIds = current.groups.map(group => group.groupId);
      assertCanManageCoordinationInterface(ctx.user, member, currentGroupIds);
      if (
        input.responsibleId !== current.responsibleId &&
        !isAdministrator(ctx.user) &&
        member?.id !== current.responsibleId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Somente o responsável atual ou o administrador pode transferir a interface.",
        });
      }
      const closing = input.status === "resolvida";
      const reopening =
        current.status === "resolvida" && input.status !== "resolvida";
      if (closing || reopening) {
        assertCanResolveCoordinationInterface(
          ctx.user,
          member,
          current.responsibleId
        );
      }
      const responsible = await validateInterfaceSelection(input);
      const db = await requireDb();
      await db
        .update(coordinationInterfaces)
        .set({
          title: input.title,
          description: input.description,
          interfaceType: input.interfaceType,
          responsibleId: input.responsibleId,
          priority: input.priority,
          blockingClass: input.blockingClass,
          status: input.status,
          dueAt: input.dueAt,
          resolution: input.resolution,
          resolvedAt: closing ? Date.now() : null,
        })
        .where(eq(coordinationInterfaces.id, input.id));
      await replaceRelations(
        input.id,
        input.sectionIds,
        input.groupIds,
        input.activityIds,
        responsible.groupId ?? input.groupIds[0]!
      );
      const statusChanged = current.status !== input.status;
      await db.insert(interfaceEvents).values({
        interfaceId: input.id,
        actorId: ctx.user.id,
        eventType: closing
          ? "resolvida"
          : reopening
            ? "reaberta"
            : statusChanged
              ? "status alterado"
              : "atualizada",
        summary: closing
          ? `Interface resolvida: ${input.resolution}`
          : statusChanged
            ? `Status alterado de ${current.status} para ${input.status}.`
            : "Dados, seções ou grupos da interface foram atualizados.",
      });
      return getCoordinationInterface(input.id);
    }),

  addComment: protectedProcedure
    .input(
      z.object({
        interfaceId: z.number().int().positive(),
        content: z.string().trim().min(2).max(10_000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const item = await getCoordinationInterface(input.interfaceId);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Interface não encontrada.",
        });
      }
      const member = await getTeamMemberByUserId(ctx.user.id);
      assertCanManageCoordinationInterface(
        ctx.user,
        member,
        item.groups.map(group => group.groupId)
      );
      const db = await requireDb();
      await db.insert(interfaceComments).values({
        interfaceId: input.interfaceId,
        authorId: ctx.user.id,
        content: input.content,
      });
      return getCoordinationInterface(input.interfaceId);
    }),

  detail: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const item = await getCoordinationInterface(input.id);
      if (!item) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Interface não encontrada.",
        });
      }
      const member = await getTeamMemberByUserId(ctx.user.id);
      assertCanViewCoordinationInterface(
        ctx.user,
        member,
        item.groups.map(group => group.groupId)
      );
      return item;
    }),
});
