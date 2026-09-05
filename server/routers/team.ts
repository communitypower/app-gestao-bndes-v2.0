import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { activities, teamGroups, teamMembers } from "../../drizzle/schema";
import { TEAM_GROUP_ROLES } from "../../shared/domain";
import { assertAdministrator } from "../access";
import { protectedProcedure, router } from "../_core/trpc";
import {
  ensureSeedData,
  listTeamGroups,
  listTeamMembers,
  requireDb,
} from "../db";

const teamInputSchema = z.object({
  userId: z.number().int().positive().nullable(),
  name: z.string().trim().min(3).max(220),
  title: z.string().trim().min(2).max(120),
  institution: z.string().trim().min(2).max(160),
  email: z.string().trim().max(320).nullable().optional(),
  groupId: z.number().int().positive(),
  groupRole: z.enum(TEAM_GROUP_ROLES),
  whatsappPhone: z.string().trim().max(32).nullable(),
  whatsappOptIn: z.boolean(),
  active: z.boolean(),
});

async function assertUserLinkAvailable(
  userId: number | null,
  currentMemberId?: number
) {
  if (!userId) return;
  const db = await requireDb();
  const linked = await db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId))
    .limit(1);
  if (linked[0] && linked[0].id !== currentMemberId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Esta conta de acesso já está vinculada a outro integrante.",
    });
  }
}

async function assertValidGroupSelection(
  groupId: number,
  groupRole: (typeof TEAM_GROUP_ROLES)[number],
  active: boolean
) {
  const db = await requireDb();
  const group = await db
    .select()
    .from(teamGroups)
    .where(eq(teamGroups.id, groupId))
    .limit(1);
  if (!group[0] || !group[0].active) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Selecione um grupo participante ativo.",
    });
  }
  if (groupRole === "coordenador" && !active) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "O coordenador do grupo deve permanecer ativo.",
    });
  }
}

async function promoteCoordinator(groupId: number, memberId: number) {
  const db = await requireDb();
  const previous = await db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.groupId, groupId),
        eq(teamMembers.groupRole, "coordenador")
      )
    );
  const previousIds = previous
    .map(member => member.id)
    .filter(id => id !== memberId);
  for (const previousId of previousIds) {
    await db
      .update(teamMembers)
      .set({ groupRole: "participante" })
      .where(eq(teamMembers.id, previousId));
    await db
      .update(activities)
      .set({ responsibleId: memberId })
      .where(eq(activities.responsibleId, previousId));
  }
}

export const teamRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    assertAdministrator(ctx.user);
    await ensureSeedData();
    return listTeamMembers();
  }),

  hierarchy: protectedProcedure.query(async ({ ctx }) => {
    assertAdministrator(ctx.user);
    await ensureSeedData();
    return listTeamGroups();
  }),

  create: protectedProcedure
    .input(teamInputSchema)
    .mutation(async ({ ctx, input }) => {
      assertAdministrator(ctx.user);
      await ensureSeedData();
      await assertValidGroupSelection(
        input.groupId,
        input.groupRole,
        input.active
      );
      await assertUserLinkAvailable(input.userId);
      const db = await requireDb();
      const inserted = await db
        .insert(teamMembers)
        .values(input)
        .$returningId();
      const memberId = inserted[0]?.id;
      if (memberId && input.groupRole === "coordenador") {
        await promoteCoordinator(input.groupId, memberId);
      }
      return listTeamMembers();
    }),

  update: protectedProcedure
    .input(teamInputSchema.partial().extend({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      assertAdministrator(ctx.user);
      const db = await requireDb();
      const { id, ...changes } = input;
      const current = await db
        .select()
        .from(teamMembers)
        .where(eq(teamMembers.id, id))
        .limit(1);
      if (!current[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Participante não encontrado.",
        });
      }
      const next = { ...current[0], ...changes };
      if (!next.groupId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Selecione o grupo do participante.",
        });
      }
      await assertValidGroupSelection(
        next.groupId,
        next.groupRole,
        next.active
      );
      await assertUserLinkAvailable(next.userId, id);
      const leavingCoordinator =
        current[0].groupRole === "coordenador" &&
        (next.groupRole !== "coordenador" ||
          next.groupId !== current[0].groupId ||
          !next.active);
      if (leavingCoordinator) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Antes de mover ou desativar este coordenador, promova outro participante do grupo.",
        });
      }
      if (next.groupRole === "coordenador") {
        await promoteCoordinator(next.groupId, id);
      }
      await db.update(teamMembers).set(changes).where(eq(teamMembers.id, id));
      return listTeamMembers();
    }),
});
