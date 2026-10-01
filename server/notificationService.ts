import { eq, or, ilike } from "drizzle-orm";
import { participantNotifications, teamMembers, users } from "../drizzle/schema";
import { requireDb } from "./db";
import { notifyOwner } from "./_core/notification";

export type ParticipantNotificationType =
  | "revisao_atribuida"
  | "versao_submetida"
  | "ajustes_solicitados"
  | "ajustes_implementados"
  | "secao_aprovada"
  | "capitulo_consolidado"
  | "execucao_atribuida";

export interface CreateParticipantNotificationInput {
  recipientUserId?: number | null;
  recipientMemberId?: number | null;
  actorUserId?: number | null;
  activityId?: number | null;
  materialId?: number | null;
  type: ParticipantNotificationType | string;
  title: string;
  message: string;
  actionUrl?: string | null;
}

export async function getUserIdForTeamMember(teamMemberId: number): Promise<number | null> {
  try {
    const db = await requireDb();
    const query = db
      .select({
        userId: teamMembers.userId,
        email: teamMembers.email,
      })
      .from(teamMembers)
      .where(eq(teamMembers.id, teamMemberId));

    const rows = typeof (query as any)?.limit === "function" ? await (query as any).limit(1) : await query;
    const member = Array.isArray(rows) ? rows[0] : null;
    if (!member) return null;
    if (member.userId) return member.userId;
    if (member.email) {
      const userQuery = db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, member.email));
      const userRows = typeof (userQuery as any)?.limit === "function" ? await (userQuery as any).limit(1) : await userQuery;
      return Array.isArray(userRows) && userRows[0]?.id ? userRows[0].id : null;
    }
    return null;
  } catch (err) {
    return null;
  }
}

export async function createParticipantNotification(
  input: CreateParticipantNotificationInput
): Promise<number | null> {
  const db = await requireDb();
  let userId = input.recipientUserId;

  if (!userId && input.recipientMemberId) {
    userId = await getUserIdForTeamMember(input.recipientMemberId);
  }

  // If user account is not linked yet, we still record under recipientMemberId if found via user email
  if (!userId) {
    return null;
  }

  // Avoid notifying the actor themselves
  if (input.actorUserId && input.actorUserId === userId) {
    return null;
  }

  try {
    const inserted = await db
      .insert(participantNotifications)
      .values({
        recipientUserId: userId,
        recipientMemberId: input.recipientMemberId ?? null,
        actorUserId: input.actorUserId ?? null,
        activityId: input.activityId ?? null,
        materialId: input.materialId ?? null,
        type: input.type,
        title: input.title,
        message: input.message,
        actionUrl: input.actionUrl ?? null,
        read: false,
      })
      .returning({ id: participantNotifications.id });

    return inserted[0]?.id ?? null;
  } catch (err) {
    console.error("[Notifications] Failed to insert notification:", err);
    return null;
  }
}

export interface NotifyFlorianoMinutaInput {
  activityId?: number | null;
  materialId?: number | null;
  activityTitle: string;
  sectionCode?: string | null;
  authorName: string;
  authorUserId?: number | null;
}

export async function notifyFlorianoMinutaSubmitted(
  input: NotifyFlorianoMinutaInput
): Promise<{ notifId: number | null; ownerNotified: boolean }> {
  try {
    const db = await requireDb();

    // 1. Localizar o Professor Floriano na base de usuários e membros
    const [florianoUserRows, florianoMemberRows] = await Promise.all([
      db
        .select({ id: users.id, email: users.email, name: users.name })
        .from(users)
        .where(or(ilike(users.email, "%floriano%"), eq(users.role, "admin")))
        .limit(1),
      db
        .select({ id: teamMembers.id, userId: teamMembers.userId, email: teamMembers.email, name: teamMembers.name })
        .from(teamMembers)
        .where(or(ilike(teamMembers.name, "%floriano%"), ilike(teamMembers.email, "%floriano%")))
        .limit(1),
    ]);

    const florianoUser = florianoUserRows[0];
    const florianoMember = florianoMemberRows[0];

    const recipientUserId = florianoUser?.id ?? florianoMember?.userId ?? 1;
    const recipientEmail = florianoUser?.email || florianoMember?.email || "floriano@poli.ufrj.br";
    const formattedCode = input.sectionCode ? `${input.sectionCode} — ` : "";

    // 2. Inserir notificação in-app para a conta do Prof. Floriano
    const notifId = await createParticipantNotification({
      recipientUserId,
      recipientMemberId: florianoMember?.id ?? null,
      actorUserId: input.authorUserId ?? null,
      activityId: input.activityId ?? null,
      materialId: input.materialId ?? null,
      type: "versao_submetida",
      title: "Nova Minuta Submetida — Indicação de Revisor",
      message: `O autor ${input.authorName} submeteu a Minuta Inicial (R01) do capítulo "${formattedCode}${input.activityTitle}". É necessária a indicação do revisor técnico independente.`,
      actionUrl: input.activityId ? `/atividades?ficha=${input.activityId}` : "/atividades",
    });

    // 3. Disparar notificação externa de e-mail / WebDev Notification para o Prof. Floriano
    let ownerNotified = false;
    try {
      ownerNotified = await notifyOwner({
        title: `[Estudo BNDES] Nova Minuta Submetida: ${formattedCode}${input.activityTitle}`,
        content: `Prezado Prof. Floriano Pires (${recipientEmail}),\n\nO autor ${input.authorName} submeteu no sistema a Minuta Inicial (R01) referente ao capítulo:\n\n• Capítulo: ${formattedCode}${input.activityTitle}\n• Ação requerida: Indicar o Revisor Técnico Independente no sistema de Gestão do Estudo BNDES.\n\nAcesse o sistema para realizar a designação do revisor.`,
      });
    } catch (err) {
      console.warn("[Notifications] Failed to notify owner:", err);
    }

    return { notifId, ownerNotified };
  } catch (err) {
    console.error("[Notifications] notifyFlorianoMinutaSubmitted error:", err);
    return { notifId: null, ownerNotified: false };
  }
}
