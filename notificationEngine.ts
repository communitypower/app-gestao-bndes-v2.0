import { and, asc, eq, isNull, lte, or } from "drizzle-orm";
import {
  activities,
  notificationLogs,
  projectSettings,
  studySections,
  teamMembers,
} from "../drizzle/schema";
import type { NotificationEvent } from "../shared/domain";
import { requireDb } from "./db";
import { sendWhatsAppTemplate } from "./whatsapp";

const EVENT_LABELS: Record<NotificationEvent, string> = {
  atribuicao: "Nova atribuição",
  prazo_3_dias: "Entrega em 3 dias",
  atraso: "Atividade marcada como atrasada",
};

function formatDueDate(timestamp: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(timestamp));
}

export async function sendActivityNotification(
  activityId: number,
  event: NotificationEvent,
  idempotencyKey: string
) {
  const db = await requireDb();
  const existing = await db
    .select({ id: notificationLogs.id })
    .from(notificationLogs)
    .where(eq(notificationLogs.idempotencyKey, idempotencyKey))
    .limit(1);
  if (existing.length) return { duplicate: true };

  const rows = await db
    .select({
      activityId: activities.id,
      activityTitle: activities.title,
      dueAt: activities.dueAt,
      sectionCode: studySections.code,
      teamMemberId: teamMembers.id,
      responsibleName: teamMembers.name,
      recipientPhone: teamMembers.whatsappPhone,
      whatsappOptIn: teamMembers.whatsappOptIn,
      whatsappEnabled: projectSettings.whatsappEnabled,
      templateName: projectSettings.whatsappTemplateName,
      languageCode: projectSettings.whatsappLanguageCode,
    })
    .from(activities)
    .innerJoin(studySections, eq(activities.sectionId, studySections.id))
    .innerJoin(teamMembers, eq(activities.responsibleId, teamMembers.id))
    .innerJoin(projectSettings, eq(projectSettings.id, 1))
    .where(eq(activities.id, activityId))
    .limit(1);

  const context = rows[0];
  if (!context) return { skipped: "activity-not-found" };

  const inserted = await db
    .insert(notificationLogs)
    .values({
      activityId,
      teamMemberId: context.teamMemberId,
      event,
      recipientPhone: context.recipientPhone,
      idempotencyKey,
    })
    .$returningId();
  const logId = inserted[0]?.id;

  return processNotificationLog(logId);
}

async function processNotificationLog(logId: number) {
  const db = await requireDb();
  const rows = await db
    .select({
      logId: notificationLogs.id,
      event: notificationLogs.event,
      attempts: notificationLogs.attempts,
      activityTitle: activities.title,
      dueAt: activities.dueAt,
      sectionCode: studySections.code,
      responsibleName: teamMembers.name,
      recipientPhone: teamMembers.whatsappPhone,
      whatsappOptIn: teamMembers.whatsappOptIn,
      whatsappEnabled: projectSettings.whatsappEnabled,
      templateName: projectSettings.whatsappTemplateName,
      languageCode: projectSettings.whatsappLanguageCode,
    })
    .from(notificationLogs)
    .innerJoin(activities, eq(notificationLogs.activityId, activities.id))
    .innerJoin(studySections, eq(activities.sectionId, studySections.id))
    .innerJoin(teamMembers, eq(notificationLogs.teamMemberId, teamMembers.id))
    .innerJoin(projectSettings, eq(projectSettings.id, 1))
    .where(eq(notificationLogs.id, logId))
    .limit(1);
  const context = rows[0];
  if (!context) return { skipped: "notification-not-found" };

  if (
    !context.whatsappEnabled ||
    !context.recipientPhone ||
    !context.whatsappOptIn
  ) {
    await db
      .update(notificationLogs)
      .set({
        status: "ignorado",
        errorMessage: !context.whatsappEnabled
          ? "Integração de WhatsApp desativada."
          : !context.recipientPhone
            ? "Responsável sem telefone cadastrado."
            : "Responsável sem consentimento para receber alertas.",
      })
      .where(eq(notificationLogs.id, logId));
    return { skipped: "recipient-or-integration-disabled" };
  }

  const attempt = context.attempts + 1;
  const now = Date.now();
  const result = await sendWhatsAppTemplate({
    to: context.recipientPhone,
    templateName: context.templateName,
    languageCode: context.languageCode,
    parameters: [
      context.responsibleName,
      EVENT_LABELS[context.event],
      context.activityTitle,
      context.sectionCode,
      formatDueDate(context.dueAt),
    ],
  });

  await db
    .update(notificationLogs)
    .set({
      status: result.ok
        ? "enviado"
        : result.notConfigured
          ? "ignorado"
          : attempt >= 3
            ? "falhou"
            : "pendente",
      attempts: attempt,
      lastAttemptAt: now,
      nextAttemptAt:
        result.ok || result.notConfigured || attempt >= 3
          ? null
          : now + attempt * 60 * 60 * 1000,
      providerMessageId: result.messageId,
      errorMessage: result.error,
      sentAt: result.ok ? now : undefined,
    })
    .where(eq(notificationLogs.id, logId));
  return result;
}

export async function processPendingNotificationQueue(now = Date.now()) {
  const db = await requireDb();
  const pending = await db
    .select({ id: notificationLogs.id })
    .from(notificationLogs)
    .where(
      and(
        eq(notificationLogs.status, "pendente"),
        or(
          isNull(notificationLogs.nextAttemptAt),
          lte(notificationLogs.nextAttemptAt, now)
        )
      )
    )
    .orderBy(asc(notificationLogs.createdAt))
    .limit(25);

  let processed = 0;
  for (const item of pending) {
    await processNotificationLog(item.id);
    processed += 1;
  }
  return { processed };
}

function dateKey(timestamp: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).formatToParts(new Date(timestamp));
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}`;
}

export function isThreeDayDeadline(
  dueAt: number,
  status: string,
  now = Date.now()
) {
  return (
    status !== "concluído" &&
    dateKey(dueAt) === dateKey(now + 3 * 24 * 60 * 60 * 1000)
  );
}

export function shouldMarkActivityDelayed(
  dueAt: number,
  status: string,
  now = Date.now()
) {
  return status !== "concluído" && status !== "atrasado" && dueAt < now;
}

export async function processScheduledActivityAlerts(now = Date.now()) {
  const db = await requireDb();
  const activityRows = await db
    .select({
      id: activities.id,
      dueAt: activities.dueAt,
      status: activities.status,
    })
    .from(activities);

  let deadlineAlerts = 0;
  let markedDelayed = 0;

  for (const activity of activityRows) {
    if (isThreeDayDeadline(activity.dueAt, activity.status, now)) {
      await sendActivityNotification(
        activity.id,
        "prazo_3_dias",
        `activity:${activity.id}:prazo_3_dias:${dateKey(activity.dueAt)}`
      );
      deadlineAlerts += 1;
    }

    if (shouldMarkActivityDelayed(activity.dueAt, activity.status, now)) {
      await db
        .update(activities)
        .set({ status: "atrasado" })
        .where(eq(activities.id, activity.id));
      await sendActivityNotification(
        activity.id,
        "atraso",
        `activity:${activity.id}:atraso`
      );
      markedDelayed += 1;
    }
  }

  const queue = await processPendingNotificationQueue(now);
  return { deadlineAlerts, markedDelayed, queueProcessed: queue.processed };
}
