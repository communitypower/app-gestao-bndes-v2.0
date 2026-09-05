import { eq } from "drizzle-orm";
import { participantNotifications, teamMembers, users } from "../drizzle/schema";
import { requireDb } from "./db";

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
