import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { parse as parseCookie } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import { projectSettings, teamGroups, teamMembers, teamGroupMemberships, userAccessEvents, users } from "../../drizzle/schema";
import { APP_ROLES, TEAM_GROUP_SEED, GROUP_MEMBERSHIPS_SEED, TEAM_SEED, type AppRole } from "../../shared/domain";
import { groupDisplayName } from "../../shared/groupDisplay";
import {
  assertAdministrator,
  isActiveCoordinator,
  isAdministrator,
  isGeneralCoordinatorOrAdmin,
} from "../access";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createHeartbeatJob,
  updateHeartbeatJob,
} from "../_core/heartbeat";
import {
  getProjectSettings,
  hasCurrentActivityDelegation,
  getTeamMemberByUserId,
  ensureSeedData,
  resetAndSeedPilotDatabase,
  listNotificationLogs,
  listUsers,
  listUserAccessDirectory,
  updateUserAccess,
  requireDb,
} from "../db";
import { processScheduledActivityAlerts } from "../notificationEngine";
import { isWhatsAppConfigured } from "../whatsapp";

export const whatsappSettingsSchema = z.object({
  whatsappEnabled: z.boolean(),
  whatsappTemplateName: z
    .string()
    .regex(/^[a-z0-9_]+$/)
    .max(128),
  whatsappLanguageCode: z.string().min(2).max(12),
});

export const administrationRouter = router({
  accessDirectory: protectedProcedure.query(async ({ ctx }) => {
    assertAdministrator(ctx.user);
    await ensureSeedData();
    return listUserAccessDirectory();
  }),

  updateUserAccess: protectedProcedure.input(z.object({ target: z.enum(["conta", "pre-cadastro"]), id: z.number().int().positive(), appRole: z.enum(APP_ROLES), status: z.enum(["ativo", "revogado", "pendente", "ativado"]), note: z.string().trim().max(500).optional() })).mutation(async ({ ctx, input }) => {
    assertAdministrator(ctx.user);
    return updateUserAccess({ actorUserId: ctx.user.id, ...input });
  }),

  sendFirstAccessInvitation: protectedProcedure
    .input(
      z.object({
        userId: z.number().int().positive().optional(),
        email: z.string().optional(),
        all: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      assertAdministrator(ctx.user);
      await ensureSeedData();
      const db = await requireDb();

      let targetUsers: Array<{
        id: number;
        name: string | null;
        email: string | null;
        appRole: AppRole;
        openId: string;
      }> = [];

      if (input.all) {
        targetUsers = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            appRole: users.appRole,
            openId: users.openId,
          })
          .from(users)
          .where(sql`${users.email} IS NOT NULL AND ${users.email} != ''`);
      } else if (input.userId) {
        targetUsers = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            appRole: users.appRole,
            openId: users.openId,
          })
          .from(users)
          .where(eq(users.id, input.userId))
          .limit(1);
      } else if (input.email) {
        targetUsers = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            appRole: users.appRole,
            openId: users.openId,
          })
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);
      }

      if (targetUsers.length === 0) {
        throw new Error("Nenhum participante com e-mail válido localizado para envio de convite.");
      }

      const [memberRows, membershipsRows, allGroups] = await Promise.all([
        db
          .select({
            id: teamMembers.id,
            userId: teamMembers.userId,
            name: teamMembers.name,
            email: teamMembers.email,
            institution: teamMembers.institution,
            groupRole: teamMembers.groupRole,
            groupId: teamMembers.groupId,
            groupName: teamGroups.name,
            active: teamMembers.active,
          })
          .from(teamMembers)
          .leftJoin(teamGroups, eq(teamMembers.groupId, teamGroups.id)),
        db
          .select({
            groupId: teamGroupMemberships.groupId,
            teamMemberId: teamGroupMemberships.teamMemberId,
            groupName: teamGroups.name,
          })
          .from(teamGroupMemberships)
          .leftJoin(teamGroups, eq(teamGroupMemberships.groupId, teamGroups.id)),
        db
          .select({
            id: teamGroups.id,
            name: teamGroups.name,
          })
          .from(teamGroups),
      ]);

      const emailByMemberName = new Map<string, string>();
      for (const m of memberRows) {
        if (m.name && m.email) {
          emailByMemberName.set(m.name.trim().toLowerCase(), m.email.trim());
        }
      }
      for (const s of TEAM_SEED) {
        if (s.name && s.email && !emailByMemberName.has(s.name.trim().toLowerCase())) {
          emailByMemberName.set(s.name.trim().toLowerCase(), s.email.trim());
        }
      }
      for (const u of targetUsers) {
        if (u.name && u.email && !emailByMemberName.has(u.name.trim().toLowerCase())) {
          emailByMemberName.set(u.name.trim().toLowerCase(), u.email.trim());
        }
      }

      const sentInvitations = [];

      for (const u of targetUsers) {
        if (!u.email) continue;
        const userEmailNorm = u.email.trim().toLowerCase();
        const userNameNorm = (u.name || "").trim().toLowerCase();

        const member = memberRows.find(
          r =>
            (r.userId && r.userId === u.id) ||
            (r.email && r.email.trim().toLowerCase() === userEmailNorm) ||
            (r.name && r.name.trim().toLowerCase() === userNameNorm)
        );

        const recipientName = u.name || member?.name || "Pesquisador(a)";
        const recipientRole = u.appRole;
        const institutionInfo = member?.institution || "UFRJ";

        // Collect all associated group IDs and names
        const associatedGroupIds = new Set<number>();
        const associatedGroupNames = new Set<string>();

        if (member?.groupId) {
          associatedGroupIds.add(member.groupId);
          if (member.groupName) associatedGroupNames.add(member.groupName);
        }

        if (member) {
          for (const ms of membershipsRows) {
            if (ms.teamMemberId === member.id && ms.groupId) {
              associatedGroupIds.add(ms.groupId);
              if (ms.groupName) associatedGroupNames.add(ms.groupName);
            }
          }
        }

        for (const gSeed of TEAM_GROUP_SEED) {
          const isCoord =
            gSeed.coordinatorName.trim().toLowerCase() === userNameNorm ||
            (member?.name && gSeed.coordinatorName.trim().toLowerCase() === member.name.trim().toLowerCase());
          const isMem = gSeed.memberNames.some(
            n =>
              n.trim().toLowerCase() === userNameNorm ||
              (member?.name && n.trim().toLowerCase() === member.name.trim().toLowerCase())
          );
          if (isCoord || isMem) {
            associatedGroupNames.add(gSeed.name);
            const dbGroup = allGroups.find(g => g.name === gSeed.name);
            if (dbGroup) associatedGroupIds.add(dbGroup.id);
          }
        }

        for (const gm of GROUP_MEMBERSHIPS_SEED) {
          if (
            gm.memberName.trim().toLowerCase() === userNameNorm ||
            (member?.name && gm.memberName.trim().toLowerCase() === member.name.trim().toLowerCase())
          ) {
            associatedGroupNames.add(gm.groupName);
            const dbGroup = allGroups.find(g => g.name === gm.groupName);
            if (dbGroup) associatedGroupIds.add(dbGroup.id);
          }
        }

        const groupInfo =
          associatedGroupNames.size > 0
            ? Array.from(associatedGroupNames)
                .map(g => groupDisplayName(g))
                .join(" / ")
            : member?.groupName
            ? groupDisplayName(member.groupName)
            : "Coordenação Geral / Transversal";

        // Collect all co-members of these group(s) to include in CC
        const ccMap = new Map<string, { name: string; email: string; role?: string; groupName?: string }>();

        // 1. Co-members from DB memberRows
        for (const m of memberRows) {
          if (m.groupId && associatedGroupIds.has(m.groupId) && m.email) {
            const emailNorm = m.email.trim().toLowerCase();
            if (emailNorm !== userEmailNorm && !ccMap.has(emailNorm)) {
              ccMap.set(emailNorm, {
                name: m.name || m.email,
                email: m.email.trim(),
                role: m.groupRole,
                groupName: m.groupName || undefined,
              });
            }
          }
        }

        // 2. Co-members from DB membershipsRows
        for (const ms of membershipsRows) {
          if (ms.groupId && associatedGroupIds.has(ms.groupId)) {
            const mem = memberRows.find(m => m.id === ms.teamMemberId);
            if (mem && mem.email) {
              const emailNorm = mem.email.trim().toLowerCase();
              if (emailNorm !== userEmailNorm && !ccMap.has(emailNorm)) {
                ccMap.set(emailNorm, {
                  name: mem.name || mem.email,
                  email: mem.email.trim(),
                  role: mem.groupRole,
                  groupName: ms.groupName || mem.groupName || undefined,
                });
              }
            }
          }
        }

        // 3. Co-members from domain seeds
        for (const gName of Array.from(associatedGroupNames)) {
          const gSeed = TEAM_GROUP_SEED.find(g => g.name === gName);
          if (gSeed) {
            const coordEmail = emailByMemberName.get(gSeed.coordinatorName.trim().toLowerCase());
            if (coordEmail && coordEmail.toLowerCase() !== userEmailNorm && !ccMap.has(coordEmail.toLowerCase())) {
              ccMap.set(coordEmail.toLowerCase(), {
                name: gSeed.coordinatorName,
                email: coordEmail,
                role: "coordenador",
                groupName: gSeed.name,
              });
            }
            for (const memName of gSeed.memberNames) {
              const memEmail = emailByMemberName.get(memName.trim().toLowerCase());
              if (memEmail && memEmail.toLowerCase() !== userEmailNorm && !ccMap.has(memEmail.toLowerCase())) {
                ccMap.set(memEmail.toLowerCase(), {
                  name: memName,
                  email: memEmail,
                  role: "participante",
                  groupName: gSeed.name,
                });
              }
            }
          }

          const groupMems = GROUP_MEMBERSHIPS_SEED.filter(gm => gm.groupName === gName);
          for (const gm of groupMems) {
            const memEmail = emailByMemberName.get(gm.memberName.trim().toLowerCase());
            if (memEmail && memEmail.toLowerCase() !== userEmailNorm && !ccMap.has(memEmail.toLowerCase())) {
              ccMap.set(memEmail.toLowerCase(), {
                name: gm.memberName,
                email: memEmail,
                role: "participante",
                groupName: gm.groupName,
              });
            }
          }
        }

        const ccRecipients = Array.from(ccMap.values()).sort((a, b) => {
          if (a.role === "coordenador" && b.role !== "coordenador") return -1;
          if (a.role !== "coordenador" && b.role === "coordenador") return 1;
          return a.name.localeCompare(b.name, "pt-BR");
        });

        const ccEmails = ccRecipients.map(r => r.email);
        const ccString = ccEmails.join(", ");
        const ccFormatted = ccRecipients.map(r => `${r.name} <${r.email}>`).join(", ");

        const host = ctx.req.get("host");
        const proto = ctx.req.headers["x-forwarded-proto"] || ctx.req.protocol || "https";
        const origin = ctx.req.headers.origin || (host ? `${proto}://${host}` : "http://localhost:3000");
        const loginUrl = `${origin}/login?email=${encodeURIComponent(u.email)}`;

        const subject = `[Estudo BNDES — Indústria Naval] Instruções de Primeiro Acesso e Confirmação de Registro`;
        const messageBody = `Prezado(a) ${recipientName},

Você foi cadastrado(a) no Portal de Gestão do Estudo Estratégico BNDES — Indústria Naval (UFRJ · COPPE · Instituto de Economia).

Dados do seu perfil:
• Perfil de Acesso: ${recipientRole.toUpperCase()}
• Grupo Temático: ${groupInfo}
• Instituição: ${institutionInfo}${ccRecipients.length > 0 ? `\n• Integrantes do Grupo em Cópia (CC): ${ccFormatted}` : ""}

Instruções para o seu Primeiro Acesso:
1. Acesse o portal pelo link institucional direto:
   ${loginUrl}

2. Confirme seu e-mail institucional (${u.email}) na tela de acesso para autenticar sua sessão com segurança.

3. Revise as atividades, frentes e interfaces atribuídas ao seu perfil e confirme seu registro no aplicativo.

Em caso de dúvidas técnicas ou alinhamento de escopo, responda a este comunicado ou procure a coordenação do estudo.

Atenciosamente,
Coordenação Geral do Estudo BNDES / UFRJ`;

        const mailtoUrl = `mailto:${encodeURIComponent(u.email)}?${ccEmails.length > 0 ? `cc=${encodeURIComponent(ccString)}&` : ""}subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageBody)}`;

        try {
          await db.insert(userAccessEvents).values({
            userId: u.id,
            provisionId: null,
            actorUserId: ctx.user.id,
            eventType: "convite_enviado",
            previousAppRole: u.appRole,
            nextAppRole: u.appRole,
            note: `Instruções de primeiro acesso enviadas para ${u.email}${ccEmails.length > 0 ? ` (CC: ${ccEmails.length} integrantes)` : ""}`,
          });
        } catch (eventErr) {
          console.warn("[UserAccessEvents] Warning inserting event:", eventErr);
        }

        sentInvitations.push({
          userId: u.id,
          name: recipientName,
          email: u.email,
          appRole: recipientRole,
          groupName: groupInfo,
          institution: institutionInfo,
          subject,
          messageBody,
          loginUrl,
          ccEmails,
          ccRecipients,
          ccFormatted,
          ccString,
          mailtoUrl,
          sentAt: new Date(),
        });
      }

      return {
        success: true,
        count: sentInvitations.length,
        invitations: sentInvitations,
        latestInvitation: sentInvitations[0] ?? null,
      };
    }),

  status: protectedProcedure.query(async ({ ctx }) => {
    await ensureSeedData();
    const isAdmin = isAdministrator(ctx.user);
    const teamMember = await getTeamMemberByUserId(ctx.user.id);
    const isGeneralCoordinator = isGeneralCoordinatorOrAdmin(ctx.user, teamMember);
    const canManageTeam = isAdmin || isGeneralCoordinator;
    const isCoordinator = ctx.user.appRole === "coordenador" || isActiveCoordinator(teamMember);
    const isLinkedTeamMember = Boolean(teamMember?.active);
    const isExecutionDelegate = Boolean(
      teamMember?.active &&
        (await hasCurrentActivityDelegation(teamMember.id))
    );
    return {
      isAdmin,
      isCoordinator,
      isGeneralCoordinator,
      canManageTeam,
      isExecutionDelegate,
      isLinkedTeamMember,
      canAccessActivities: isAdmin || isLinkedTeamMember,
      canAccessInterfaces: isAdmin || isLinkedTeamMember,
      teamMembership: isLinkedTeamMember && teamMember
        ? {
            id: teamMember.id,
            groupId: teamMember.groupId,
            groupRole: teamMember.groupRole,
            name: teamMember.name,
            groupName: teamMember.groupName,
          }
        : null,
      activityMembership: (isCoordinator || isExecutionDelegate) && teamMember
        ? {
            id: teamMember.id,
            groupId: teamMember.groupId,
            name: teamMember.name,
            groupName: teamMember.groupName,
            accessMode: isCoordinator ? "coordenação" : "delegação",
          }
        : null,
      settings: await getProjectSettings(),
      whatsappConfigured: isWhatsAppConfigured(),
      users: isAdmin ? await listUsers() : [],
      notificationLogs: isAdmin ? await listNotificationLogs() : [],
    };
  }),

  updateProject: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(3).max(220),
        projectStartAt: z.number().int().positive(),
        projectEndAt: z.number().int().positive(),
        timezone: z.string().trim().min(3).max(64),
      })
    )
    .mutation(async ({ ctx, input }) => {
      assertAdministrator(ctx.user);
      const db = await requireDb();
      await db.update(projectSettings).set(input).where(eq(projectSettings.id, 1));
      return getProjectSettings();
    }),

  updateWhatsApp: protectedProcedure
    .input(whatsappSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      assertAdministrator(ctx.user);
      const db = await requireDb();
      await db.update(projectSettings).set(input).where(eq(projectSettings.id, 1));
      return getProjectSettings();
    }),

  setUserRole: protectedProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        appRole: z.enum(APP_ROLES),
      })
    )
    .mutation(async ({ ctx, input }) => {
      assertAdministrator(ctx.user);
      const db = await requireDb();
      await db
        .update(users)
        .set({ appRole: input.appRole })
        .where(eq(users.id, input.userId));
      return listUsers();
    }),

  processAlertsNow: protectedProcedure.mutation(async ({ ctx }) => {
    assertAdministrator(ctx.user);
    return processScheduledActivityAlerts();
  }),

  configureSchedule: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      assertAdministrator(ctx.user);
      const db = await requireDb();
      const settings = await getProjectSettings();
      const sessionToken =
        parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";

      if (settings.scheduleCronTaskUid) {
        await updateHeartbeatJob(
          settings.scheduleCronTaskUid,
          { enable: input.enabled },
          sessionToken
        );
        return {
          enabled: input.enabled,
          taskUid: settings.scheduleCronTaskUid,
        };
      }

      if (!input.enabled) {
        return { enabled: false, taskUid: null };
      }

      const job = await createHeartbeatJob(
        {
          name: "estudo-bndes-alertas-prazo",
          cron: "0 0 12 * * *",
          path: "/api/scheduled/activity-alerts",
          description:
            "Verificação diária de entregas a três dias do vencimento e atividades atrasadas.",
        },
        sessionToken
      );

      await db
        .update(projectSettings)
        .set({ scheduleCronTaskUid: job.taskUid })
        .where(eq(projectSettings.id, 1));
      return { enabled: true, taskUid: job.taskUid };
    }),

  resetPilotEnvironment: protectedProcedure.mutation(async ({ ctx }) => {
    assertAdministrator(ctx.user);
    const result = await resetAndSeedPilotDatabase();
    return result;
  }),
});
