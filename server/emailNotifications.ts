import { sql } from "drizzle-orm";
import { requireDb } from "./db";
import { getEmailConfig, sendTransactionalEmail, wasEmailSent, type EmailConfig } from "./emailService";

const rowsOf = (res: any): any[] => (Array.isArray(res) ? res : res?.rows ?? []);
const DAY = 24 * 60 * 60 * 1000;
export const DEADLINE_WINDOW_DAYS = 20;

// Etapas em que o autor ainda precisa entregar algo.
const AUTHOR_PENDING_STATUSES = ["planejada", "em elaboração", "ajustes solicitados"];

function formatDate(ms: number) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date(ms));
}

/**
 * E-mail ao revisor quando uma revisão passa a depender dele:
 * indicação como revisor ou nova versão submetida a uma seção que ele revisa.
 */
export async function emailReviewerAssignment(input: {
  recipientUserId: number;
  activityId: number | null | undefined;
  notificationId: number | null;
  type: string;
}) {
  if (!input.activityId) return;
  const db = await requireDb();
  const res = await db.execute(sql`
    SELECT u.email, u.name, a.title, COALESCE(a."detailCode", a."planCode", '') AS code, a."dueAt",
           author.name AS "authorName",
           (SELECT r."revisionNumber" FROM review_submissions s JOIN material_revisions r ON r.id = s."revisionId"
             WHERE s."activityId" = a.id ORDER BY s.id DESC LIMIT 1) AS "revisionNumber"
    FROM users u
    JOIN team_members tm ON (tm."userId" = u.id OR lower(tm.email) = lower(u.email))
    JOIN activity_reviewers ar ON ar."teamMemberId" = tm.id AND ar."activityId" = ${input.activityId}
    JOIN activities a ON a.id = ar."activityId"
    LEFT JOIN team_members author ON author.id = a."responsibleId"
    WHERE u.id = ${input.recipientUserId}
    LIMIT 1`);
  const row = rowsOf(res)[0];
  if (!row?.email) return; // destinatário não é revisor desta seção

  const config = getEmailConfig();
  const section = `${row.code ? `${row.code} — ` : ""}${row.title}`;
  const version = row.revisionNumber ? `R${String(row.revisionNumber).padStart(2, "0")}` : null;
  const motivo =
    input.type === "revisao_atribuida"
      ? "Você foi indicado como revisor técnico desta seção."
      : `Uma nova versão${version ? ` (${version})` : ""} foi submetida para a sua revisão.`;
  const text = [
    `Prezado(a) ${row.name ?? ""},`.trim(),
    `${motivo}`,
    `Seção: ${section}\nAutor: ${row.authorName ?? "—"}${version ? `\nVersão: ${version}` : ""}`,
    `Acesse o portal, em "Documentos & Ações", para baixar a minuta e registrar o seu parecer:\n${config.portalUrl}`,
    "Mensagem automática do portal de Gestão de Documentos do Estudo BNDES — Indústria Naval.",
  ].join("\n\n");

  await sendTransactionalEmail(
    db,
    {
      key: `revisor:${input.type}:${input.activityId}:${input.recipientUserId}:${input.notificationId ?? Date.now()}`,
      kind: "revisao_atribuida",
      activityId: input.activityId,
      to: [{ email: row.email, name: row.name }],
      subject: `[Estudo BNDES] Revisão atribuída: ${section}`,
      text,
    },
    config
  );
}

export type DeadlineReminderItem = { activityId: number; code: string; title: string; dueAt: number; status: string; daysLeft: number };
export type DeadlineReminderGroup = { memberId: number; name: string; email: string | null; items: DeadlineReminderItem[] };

export function deadlineKey(activityId: number, dueAt: number) {
  return `prazo${DEADLINE_WINDOW_DAYS}:${activityId}:${dueAt}`;
}

/** Seções com entrega em menos de 20 dias e ainda sem lembrete enviado, agrupadas por autor. */
export async function collectDeadlineReminders(db: any, now = Date.now()): Promise<DeadlineReminderGroup[]> {
  const until = now + DEADLINE_WINDOW_DAYS * DAY;
  const res = await db.execute(sql`
    SELECT a.id, COALESCE(a."detailCode", a."planCode", '') AS code, a.title, a."dueAt", a."documentStatus" AS status,
           tm.id AS "memberId", tm.name, tm.email, tm.active
    FROM activities a
    JOIN team_members tm ON tm.id = a."responsibleId"
    WHERE a."structureStatus" <> 'arquivada'
      AND a."documentStatus"::text IN (${sql.join(AUTHOR_PENDING_STATUSES.map(s => sql`${s}`), sql`, `)})
      AND a."dueAt" > ${now} AND a."dueAt" <= ${until}
    ORDER BY tm.name, a."dueAt"`);
  const groups = new Map<number, DeadlineReminderGroup>();
  for (const row of rowsOf(res)) {
    if (row.active === false) continue;
    const dueAt = Number(row.dueAt);
    if (await wasEmailSent(db, deadlineKey(row.id, dueAt))) continue;
    const group: DeadlineReminderGroup = groups.get(row.memberId) ?? { memberId: row.memberId, name: row.name, email: row.email ?? null, items: [] };
    group.items.push({ activityId: row.id, code: row.code, title: row.title, dueAt, status: row.status, daysLeft: Math.ceil((dueAt - now) / DAY) });
    groups.set(row.memberId, group);
  }
  return Array.from(groups.values());
}

/** Envia um e-mail por autor listando as seções com prazo em menos de 20 dias. Cada seção é lembrada uma vez por data de entrega. */
export async function runDeadlineReminders(now = Date.now(), config: EmailConfig = getEmailConfig()) {
  const db = await requireDb();
  if (!config.enabled) return { enabled: false, reason: config.reason, sent: 0, failed: 0, pending: 0 };
  const groups = await collectDeadlineReminders(db, now);
  let sent = 0;
  let failed = 0;
  for (const group of groups) {
    if (!group.email) continue;
    const lines = group.items
      .map(item => `• ${item.code ? `${item.code} — ` : ""}${item.title}\n  Entrega: ${formatDate(item.dueAt)} (faltam ${item.daysLeft} dia${item.daysLeft === 1 ? "" : "s"}) · Situação: ${item.status}`)
      .join("\n");
    const text = [
      `Prezado(a) ${group.name},`,
      `Este é um lembrete automático: as seções abaixo, sob sua responsabilidade, têm entrega prevista no cronograma em menos de ${DEADLINE_WINDOW_DAYS} dias.`,
      lines,
      `Para enviar a minuta, acesse o portal em "Documentos & Ações":\n${config.portalUrl}`,
      "Mensagem automática do portal de Gestão de Documentos do Estudo BNDES — Indústria Naval.",
    ].join("\n\n");
    const result = await sendTransactionalEmail(
      db,
      {
        key: `prazo-lote:${group.memberId}:${group.items.map(i => i.activityId).join("-")}:${new Date(now).toISOString().slice(0, 10)}`,
        kind: "prazo_entrega",
        to: [{ email: group.email, name: group.name }],
        subject:
          group.items.length === 1
            ? `[Estudo BNDES] Prazo de entrega em ${group.items[0].daysLeft} dias: ${group.items[0].code || group.items[0].title}`
            : `[Estudo BNDES] ${group.items.length} seções com entrega em menos de ${DEADLINE_WINDOW_DAYS} dias`,
        text,
      },
      config
    );
    if (result.status === "enviado") {
      sent++;
      for (const item of group.items) {
        await db.execute(sql`
          INSERT INTO email_dispatch_logs ("idempotencyKey", kind, "activityId", recipients, subject, status)
          VALUES (${deadlineKey(item.activityId, item.dueAt)}, 'prazo_entrega_item', ${item.activityId}, ${group.email}, ${item.code || item.title}, 'enviado')
          ON CONFLICT ("idempotencyKey") DO NOTHING`);
      }
    } else if (result.status === "erro") {
      failed++;
    }
  }
  return { enabled: true, sent, failed, pending: groups.length };
}

let schedulerStarted = false;
/** Verificação diária dos prazos, no próprio processo do servidor (primeira passada 5 min após o início). */
export function startDeadlineReminderScheduler() {
  if (schedulerStarted || process.env.NODE_ENV === "test") return;
  schedulerStarted = true;
  const run = () =>
    runDeadlineReminders()
      .then(result => console.log("[Email] Lembretes de prazo:", JSON.stringify(result)))
      .catch(err => console.error("[Email] Falha nos lembretes de prazo:", err));
  setTimeout(run, 5 * 60 * 1000);
  setInterval(run, 6 * 60 * 60 * 1000);
}
