import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { parse as parseCookie } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import { projectSettings, teamGroups, teamMembers, userAccessEvents, users } from "../../drizzle/schema";
import { APP_ROLES, type AppRole } from "../../shared/domain";
import { groupDisplayName } from "../../shared/groupDisplay";
import {
  assertAdministrator,
  isActiveCoordinator,
  isAdministrator,
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

      const memberRows = await db
        .select({
          id: teamMembers.id,
          name: teamMembers.name,
          email: teamMembers.email,
          institution: teamMembers.institution,
          groupRole: teamMembers.groupRole,
          groupId: teamMembers.groupId,
          groupName: teamGroups.name,
        })
        .from(teamMembers)
        .leftJoin(teamGroups, eq(teamMembers.groupId, teamGroups.id));

      const membersByEmail = new Map(memberRows.filter(r => Boolean(r.email)).map(r => [r.email!.toLowerCase(), r]));
      const membersByName = new Map(memberRows.filter(r => Boolean(r.name)).map(r => [r.name!.toLowerCase(), r]));

      const sentInvitations = [];

      for (const u of targetUsers) {
        if (!u.email) continue;
        const member = membersByEmail.get(u.email.toLowerCase()) || (u.name ? membersByName.get(u.name.toLowerCase()) : null);
        const recipientName = u.name || "Pesquisador(a)";
        const recipientRole = u.appRole;
        const groupInfo = member?.groupName ? groupDisplayName(member.groupName) : "Coordenação Geral / Transversal";
        const institutionInfo = member?.institution || "UFRJ";
        const origin = ctx.req.headers.origin || "http://localhost:3000";
        const loginUrl = `${origin}/login?email=${encodeURIComponent(u.email)}`;

        const subject = `[Estudo BNDES — Indústria Naval] Instruções de Primeiro Acesso e Confirmação de Registro`;
        const messageBody = `Prezado(a) ${recipientName},

Você foi cadastrado(a) no Portal de Gestão do Estudo Estratégico BNDES — Indústria Naval (UFRJ · COPPE · Instituto de Economia).

Dados do seu perfil:
• Perfil de Acesso: ${recipientRole.toUpperCase()}
• Grupo Temático: ${groupInfo}
• Instituição: ${institutionInfo}

Instruções para o seu Primeiro Acesso:
1. Acesse o portal pelo link institucional direto:
   ${loginUrl}

2. Confirme seu e-mail institucional (${u.email}) na tela de acesso para autenticar sua sessão com segurança.

3. Revise as atividades, frentes e interfaces atribuídas ao seu perfil e confirme seu registro no aplicativo.

Em caso de dúvidas técnicas ou alinhamento de escopo, responda a este comunicado ou procure a coordenação do estudo.

Atenciosamente,
Coordenação Geral do Estudo BNDES / UFRJ`;

        try {
          await db.insert(userAccessEvents).values({
            userId: u.id,
            provisionId: null,
            actorUserId: ctx.user.id,
            eventType: "convite_enviado",
            previousAppRole: u.appRole,
            nextAppRole: u.appRole,
            note: `Instruções de primeiro acesso enviadas para ${u.email}`,
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
    const isCoordinator = ctx.user.appRole === "coordenador" || isActiveCoordinator(teamMember);
    const isLinkedTeamMember = Boolean(teamMember?.active);
    const isExecutionDelegate = Boolean(
      teamMember?.active &&
        (await hasCurrentActivityDelegation(teamMember.id))
    );
    return {
      isAdmin,
      isCoordinator,
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
});
