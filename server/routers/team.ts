import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { activities, teamGroups, teamMembers, teamGroupMemberships, users } from "../../drizzle/schema";
import { TEAM_GROUP_ROLES, TEAM_SEED, type AppRole, type TeamGroupRole } from "../../shared/domain";
import { assertGeneralCoordinatorOrAdmin } from "../access";
import { protectedProcedure, router } from "../_core/trpc";
import {
  ensureSeedData,
  getTeamMemberByUserId,
  listTeamGroups,
  listTeamMembers,
  requireDb,
} from "../db";
import { parseSpreadsheetMatrix } from "../../shared/matrixParser";

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
    const teamMember = await getTeamMemberByUserId(ctx.user.id);
    assertGeneralCoordinatorOrAdmin(ctx.user, teamMember);
    await ensureSeedData();
    return listTeamMembers();
  }),

  hierarchy: protectedProcedure.query(async ({ ctx }) => {
    const teamMember = await getTeamMemberByUserId(ctx.user.id);
    assertGeneralCoordinatorOrAdmin(ctx.user, teamMember);
    await ensureSeedData();
    return listTeamGroups();
  }),

  create: protectedProcedure
    .input(teamInputSchema)
    .mutation(async ({ ctx, input }) => {
      const teamMember = await getTeamMemberByUserId(ctx.user.id);
      assertGeneralCoordinatorOrAdmin(ctx.user, teamMember);
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
        .returning({ id: teamMembers.id });
      const memberId = inserted[0]?.id;
      if (memberId && input.groupRole === "coordenador") {
        await promoteCoordinator(input.groupId, memberId);
      }
      return listTeamMembers();
    }),

  update: protectedProcedure
    .input(teamInputSchema.partial().extend({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const teamMember = await getTeamMemberByUserId(ctx.user.id);
      assertGeneralCoordinatorOrAdmin(ctx.user, teamMember);
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

  importSpreadsheetMatrix: protectedProcedure
    .input(
      z.object({
        csvContent: z.string().min(10, "Conteúdo da planilha vazio ou insuficiente."),
        syncActivities: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const teamMember = await getTeamMemberByUserId(ctx.user.id);
      assertGeneralCoordinatorOrAdmin(ctx.user, teamMember);
      await ensureSeedData();

      const parsed = parseSpreadsheetMatrix(input.csvContent);
      if (parsed.groups.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nenhum grupo válido (G1-G11) foi identificado no conteúdo fornecido.",
        });
      }

      const db = await requireDb();

      // 1. Grupos no banco
      const existingGroups = await db.select().from(teamGroups);
      const groupMapByCode = new Map<string, typeof existingGroups[number]>();
      const groupMapByName = new Map<string, typeof existingGroups[number]>();

      for (const g of existingGroups) {
        groupMapByName.set(g.name.toLowerCase(), g);
        const match = g.name.match(/^(G\d+)/i);
        if (match) {
          groupMapByCode.set(match[1].toUpperCase(), g);
        }
      }

      const syncedGroupIds = new Map<string, number>();

      for (const parsedGroup of parsed.groups) {
        let groupRecord = groupMapByCode.get(parsedGroup.groupCode) || groupMapByName.get(parsedGroup.fullName.toLowerCase());
        if (groupRecord) {
          if (groupRecord.name !== parsedGroup.fullName) {
            await db.update(teamGroups).set({ name: parsedGroup.fullName }).where(eq(teamGroups.id, groupRecord.id));
          }
          syncedGroupIds.set(parsedGroup.groupCode, groupRecord.id);
        } else {
          const inserted = await db.insert(teamGroups).values({
            name: parsedGroup.fullName,
            institution: "Interinstitucional",
            active: true,
          }).returning({ id: teamGroups.id });
          if (inserted[0]?.id) {
            syncedGroupIds.set(parsedGroup.groupCode, inserted[0].id);
          }
        }
      }

      // 2. Integrantes no banco
      const existingMembers = await db.select().from(teamMembers);
      const memberByName = new Map(existingMembers.map(m => [m.name.trim().toLowerCase(), m]));
      const existingUsers = await db.select().from(users);
      const userByName = new Map(existingUsers.filter(u => u.name).map(u => [u.name!.trim().toLowerCase(), u]));
      const userByEmail = new Map(existingUsers.filter(u => u.email).map(u => [u.email!.trim().toLowerCase(), u]));

      const addedMembers: string[] = [];
      const updatedMembers: string[] = [];

      for (const parsedGroup of parsed.groups) {
        const groupId = syncedGroupIds.get(parsedGroup.groupCode);
        if (!groupId) continue;

        for (let idx = 0; idx < parsedGroup.members.length; idx++) {
          const memberName = parsedGroup.members[idx];
          const isCoordinator = idx === 0 || memberName === parsedGroup.coordinatorName;
          const groupRole: TeamGroupRole = isCoordinator ? "coordenador" : "participante";

          const normName = memberName.toLowerCase();
          const existing = memberByName.get(normName);
          const seed = TEAM_SEED.find(s => s.name.toLowerCase() === normName);

          if (existing) {
            await db.update(teamMembers).set({
              groupId: groupId ?? existing.groupId,
              groupRole: isCoordinator ? "coordenador" : existing.groupRole,
              active: true,
            }).where(eq(teamMembers.id, existing.id));
            updatedMembers.push(memberName);
          } else {
            const email = seed?.email ?? `${memberName.toLowerCase().replace(/[^a-z0-9]/g, ".")}@consultoria.com`;
            const title = seed?.title ?? (isCoordinator ? "Coordenador de Grupo" : "Pesquisador / Consultor");
            const institution = seed?.institution ?? "UFRJ / Consultoria";
            const appRole: AppRole = seed?.appRole ?? (isCoordinator ? "coordenador" : "executor");

            // Criar usuário se necessário
            let userId: number | null = null;
            const existingUser = userByEmail.get(email.toLowerCase()) || userByName.get(normName);
            if (existingUser) {
              userId = existingUser.id;
            } else {
              const openId = `seed_user_${email.replace(/[^a-zA-Z0-9_]/g, "_")}`;
              const [insertedUser] = await db.insert(users).values({
                openId,
                name: memberName,
                email,
                role: appRole === "administrador" ? "admin" : "user",
                appRole,
                accessStatus: "ativo",
              }).returning({ id: users.id });
              userId = insertedUser?.id ?? null;
            }

            const [insertedMember] = await db.insert(teamMembers).values({
              userId,
              name: memberName,
              title,
              institution,
              email,
              groupId,
              groupRole,
              active: true,
              whatsappOptIn: false,
            }).returning({ id: teamMembers.id });

            if (insertedMember) {
              memberByName.set(normName, {
                ...insertedMember,
                userId,
                name: memberName,
                title,
                institution,
                email,
                groupId,
                groupRole,
                active: true,
                whatsappPhone: null,
                whatsappOptIn: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
            addedMembers.push(memberName);
          }
        }
      }

      // 3. Reconciliar team_group_memberships
      const allMembersAfterInsert = await db.select().from(teamMembers);
      const allMembersByName = new Map(allMembersAfterInsert.map(m => [m.name.trim().toLowerCase(), m]));

      for (const parsedGroup of parsed.groups) {
        const groupId = syncedGroupIds.get(parsedGroup.groupCode);
        if (!groupId) continue;

        for (const memberName of parsedGroup.members) {
          const memberObj = allMembersByName.get(memberName.toLowerCase());
          if (!memberObj) continue;

          const existingMembership = await db
            .select({ id: teamGroupMemberships.id })
            .from(teamGroupMemberships)
            .where(
              and(
                eq(teamGroupMemberships.groupId, groupId),
                eq(teamGroupMemberships.teamMemberId, memberObj.id)
              )
            )
            .limit(1);

          if (!existingMembership[0]) {
            await db.insert(teamGroupMemberships).values({
              groupId,
              teamMemberId: memberObj.id,
              membershipSource: "matriz_revisao",
              sourceDocument: "Revisão Planilha Atividades-Grupos",
            });
          }
        }
      }

      // 4. Se syncActivities ativado, reatribuir o coordenador correto às atividades correspondentes
      let allocationsUpdated = 0;
      if (input.syncActivities) {
        for (const parsedGroup of parsed.groups) {
          const groupId = syncedGroupIds.get(parsedGroup.groupCode);
          if (!groupId || !parsedGroup.coordinatorName) continue;

          const coordMember = allMembersByName.get(parsedGroup.coordinatorName.toLowerCase());
          if (!coordMember) continue;

          // Encontrar atividades cujo responsável anterior pertencia a este grupo
          const groupMembers = allMembersAfterInsert.filter(m => m.groupId === groupId).map(m => m.id);
          if (groupMembers.length > 0) {
            for (const memberId of groupMembers) {
              if (memberId !== coordMember.id) {
                await db.update(activities)
                  .set({ responsibleId: coordMember.id })
                  .where(
                    and(
                      eq(activities.responsibleId, memberId),
                      eq(activities.structureStatus, "canonica")
                    )
                  );
                allocationsUpdated++;
              }
            }
          }
        }
      }

      return {
        success: true,
        groupsCount: parsed.groups.length,
        totalMembersCount: parsed.allMemberNames.length,
        addedMembersCount: addedMembers.length,
        updatedMembersCount: updatedMembers.length,
        allocationsUpdated,
        governance: parsed.governance,
        groups: parsed.groups,
      };
    }),
});
