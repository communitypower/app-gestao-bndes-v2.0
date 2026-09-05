import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { fieldworkActivities } from "../../drizzle/schema";
import { isAdministrator } from "../access";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getTeamMemberByUserId,
  listActivities,
  listFieldworkActivities,
  listTeamGroups,
  listTeamMembers,
  requireDb,
} from "../db";
import { fieldworkActivityInputSchema } from "./schemas";

async function validateFieldworkSelection(input: {
  relatedActivityId: number | null;
  responsibleId: number | null;
  groupId: number | null;
}) {
  const [activities, groups, members] = await Promise.all([
    listActivities(),
    listTeamGroups(),
    listTeamMembers(),
  ]);
  const relatedActivity = input.relatedActivityId
    ? activities.find(item => item.id === input.relatedActivityId)
    : undefined;
  if (input.relatedActivityId && !relatedActivity) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "O item de atividade relacionado não existe.",
    });
  }
  const group = input.groupId
    ? groups.find(item => item.id === input.groupId && item.active)
    : undefined;
  if (input.groupId && !group) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Selecione um grupo ativo.",
    });
  }
  const responsible = input.responsibleId
    ? members.find(item => item.id === input.responsibleId && item.active)
    : undefined;
  if (input.responsibleId && !responsible) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Selecione um integrante ativo.",
    });
  }
  return { relatedActivity, group, responsible };
}

async function assertCanManageFieldwork(
  user: Parameters<typeof isAdministrator>[0],
  member: Awaited<ReturnType<typeof getTeamMemberByUserId>>,
  groupId: number | null
) {
  if (isAdministrator(user)) return;
  if (!member?.active) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Somente o administrador ou um integrante ativo pode alterar esta atividade.",
    });
  }
}

export const fieldworkRouter = router({
  list: protectedProcedure.query(async () => listFieldworkActivities()),

  options: protectedProcedure.query(async ({ ctx }) => {
    const member = await getTeamMemberByUserId(ctx.user.id);
    const [activities, groups, members] = await Promise.all([
      listActivities(),
      listTeamGroups(),
      listTeamMembers(),
    ]);
    return {
      canManage: isAdministrator(ctx.user) || Boolean(member?.active),
      currentMember: member,
      activities: activities.map(item => ({
        id: item.id,
        planCode: item.planCode,
        title: item.title,
      })),
      groups: groups.filter(item => item.active),
      members: members.filter(item => item.active),
    };
  }),

  create: protectedProcedure
    .input(fieldworkActivityInputSchema)
    .mutation(async ({ ctx, input }) => {
      const member = await getTeamMemberByUserId(ctx.user.id);
      await assertCanManageFieldwork(ctx.user, member, input.groupId);
      await validateFieldworkSelection(input);
      const db = await requireDb();
      await db.insert(fieldworkActivities).values({ ...input, createdBy: ctx.user.id });
      return listFieldworkActivities();
    }),

  update: protectedProcedure
    .input(fieldworkActivityInputSchema.safeExtend({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const current = await db
        .select({ id: fieldworkActivities.id, groupId: fieldworkActivities.groupId })
        .from(fieldworkActivities)
        .where(eq(fieldworkActivities.id, input.id))
        .limit(1);
      if (!current[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Atividade de campo não encontrada." });
      }
      const member = await getTeamMemberByUserId(ctx.user.id);
      await assertCanManageFieldwork(ctx.user, member, current[0].groupId);
      await validateFieldworkSelection(input);
      const { id, ...changes } = input;
      await db.update(fieldworkActivities).set(changes).where(eq(fieldworkActivities.id, id));
      return listFieldworkActivities();
    }),

  linkToActivity: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), relatedActivityId: z.number().int().positive().nullable() }))
    .mutation(async ({ ctx, input }) => {
      const db = await requireDb();
      const current = await db
        .select({ id: fieldworkActivities.id, groupId: fieldworkActivities.groupId })
        .from(fieldworkActivities)
        .where(eq(fieldworkActivities.id, input.id))
        .limit(1);
      if (!current[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Atividade de campo não encontrada." });
      const member = await getTeamMemberByUserId(ctx.user.id);
      await assertCanManageFieldwork(ctx.user, member, current[0].groupId);
      await validateFieldworkSelection({ relatedActivityId: input.relatedActivityId, responsibleId: null, groupId: current[0].groupId });
      await db.update(fieldworkActivities).set({ relatedActivityId: input.relatedActivityId }).where(eq(fieldworkActivities.id, input.id));
      return listFieldworkActivities();
    }),
});
