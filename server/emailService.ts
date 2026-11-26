import { sql } from "drizzle-orm";

// Envio de e-mails transacionais do portal.
// O Railway bloqueia SMTP nos planos Free/Trial/Hobby, por isso o envio usa API HTTPS
// (Brevo ou Resend). Nada é enviado enquanto EMAIL_NOTIFICATIONS_ENABLED !== "true".

export type EmailRecipient = { email: string; name?: string | null };

export type EmailConfig = {
  enabled: boolean;
  provider: "brevo" | "resend" | null;
  fromEmail: string;
  fromName: string;
  portalUrl: string;
  redirectTo: string | null;
  reason?: string;
};

export function getEmailConfig(env: NodeJS.ProcessEnv = process.env): EmailConfig {
  const provider: EmailConfig["provider"] = env.BREVO_API_KEY ? "brevo" : env.RESEND_API_KEY ? "resend" : null;
  const fromEmail = (env.MAIL_FROM_EMAIL ?? "").trim();
  const base = {
    provider,
    fromEmail,
    fromName: (env.MAIL_FROM_NAME ?? "Estudo BNDES — Gestão de Documentos").trim(),
    portalUrl: (env.PORTAL_URL ?? "https://app-gestao-bndes-v20-production.up.railway.app").replace(/\/+$/, ""),
    redirectTo: env.EMAIL_REDIRECT_TO?.trim() || null,
  };
  if (env.EMAIL_NOTIFICATIONS_ENABLED !== "true") {
    return { ...base, enabled: false, reason: "EMAIL_NOTIFICATIONS_ENABLED não está como true" };
  }
  if (!provider) return { ...base, enabled: false, reason: "nenhuma chave BREVO_API_KEY ou RESEND_API_KEY" };
  if (!fromEmail) return { ...base, enabled: false, reason: "MAIL_FROM_EMAIL não configurado" };
  return { ...base, enabled: true };
}

const rowsOf = (res: any): any[] => (Array.isArray(res) ? res : res?.rows ?? []);

let tableReady = false;
export async function ensureEmailLogTable(db: any) {
  if (tableReady) return;
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS email_dispatch_logs (
      id serial PRIMARY KEY,
      "idempotencyKey" varchar(255) NOT NULL UNIQUE,
      kind varchar(64) NOT NULL,
      "activityId" integer,
      recipients text NOT NULL,
      subject text NOT NULL,
      status varchar(24) NOT NULL,
      "providerMessageId" varchar(255),
      "errorMessage" text,
      "createdAt" timestamp DEFAULT now() NOT NULL
    )`);
  tableReady = true;
}

export async function wasEmailSent(db: any, key: string): Promise<boolean> {
  await ensureEmailLogTable(db);
  const res = await db.execute(
    sql`SELECT 1 FROM email_dispatch_logs WHERE "idempotencyKey" = ${key} AND status = 'enviado' LIMIT 1`
  );
  return rowsOf(res).length > 0;
}

async function recordEmail(
  db: any,
  entry: { key: string; kind: string; activityId?: number | null; to: EmailRecipient[]; subject: string; status: string; providerMessageId?: string | null; error?: string | null }
) {
  await db.execute(sql`
    INSERT INTO email_dispatch_logs ("idempotencyKey", kind, "activityId", recipients, subject, status, "providerMessageId", "errorMessage")
    VALUES (${entry.key}, ${entry.kind}, ${entry.activityId ?? null}, ${entry.to.map(r => r.email).join(", ")}, ${entry.subject}, ${entry.status}, ${entry.providerMessageId ?? null}, ${entry.error ?? null})
    ON CONFLICT ("idempotencyKey") DO UPDATE SET status = EXCLUDED.status, "providerMessageId" = EXCLUDED."providerMessageId", "errorMessage" = EXCLUDED."errorMessage"`);
}

async function callProvider(config: EmailConfig, to: EmailRecipient[], cc: EmailRecipient[], subject: string, text: string, html: string) {
  const env = process.env;
  if (config.provider === "brevo") {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": env.BREVO_API_KEY!, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { email: config.fromEmail, name: config.fromName },
        to: to.map(r => ({ email: r.email, name: r.name ?? undefined })),
        ...(cc.length ? { cc: cc.map(r => ({ email: r.email, name: r.name ?? undefined })) } : {}),
        subject,
        textContent: text,
        htmlContent: html,
      }),
    });
    const body: any = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Brevo ${response.status}: ${body?.message ?? JSON.stringify(body)}`);
    return String(body?.messageId ?? "");
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: `${config.fromName} <${config.fromEmail}>`,
      to: to.map(r => r.email),
      ...(cc.length ? { cc: cc.map(r => r.email) } : {}),
      subject,
      text,
      html,
    }),
  });
  const body: any = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Resend ${response.status}: ${body?.message ?? JSON.stringify(body)}`);
  return String(body?.id ?? "");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);
}

export function textToHtml(text: string) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#1f2937">${escapeHtml(text)
    .split(/\n{2,}/)
    .map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("")}</div>`;
}

export type SendEmailInput = {
  key: string;
  kind: string;
  activityId?: number | null;
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  subject: string;
  text: string;
};

export type SendEmailResult = { status: "enviado" | "duplicado" | "desativado" | "sem_destinatario" | "erro"; error?: string };

export async function sendTransactionalEmail(db: any, input: SendEmailInput, config = getEmailConfig()): Promise<SendEmailResult> {
  const to = input.to.filter(r => r.email && r.email.includes("@"));
  if (!to.length) return { status: "sem_destinatario" };
  if (!config.enabled) {
    console.log(`[Email] Desativado (${config.reason}); não enviado: ${input.subject} → ${to.map(r => r.email).join(", ")}`);
    return { status: "desativado" };
  }
  if (await wasEmailSent(db, input.key)) return { status: "duplicado" };

  let finalTo = to;
  let finalCc = (input.cc ?? []).filter(r => r.email && r.email.includes("@"));
  let subject = input.subject;
  let text = input.text;
  if (config.redirectTo) {
    text = `[Modo de teste — destinatários originais: ${[...to, ...finalCc].map(r => r.email).join(", ")}]\n\n${text}`;
    subject = `[TESTE] ${subject}`;
    finalTo = [{ email: config.redirectTo }];
    finalCc = [];
  }

  try {
    const messageId = await callProvider(config, finalTo, finalCc, subject, text, textToHtml(text));
    await recordEmail(db, { key: input.key, kind: input.kind, activityId: input.activityId, to: finalTo, subject, status: "enviado", providerMessageId: messageId });
    return { status: "enviado" };
  } catch (err: any) {
    const message = err?.message ?? String(err);
    console.error(`[Email] Falha ao enviar "${subject}":`, message);
    await recordEmail(db, { key: input.key, kind: input.kind, activityId: input.activityId, to: finalTo, subject, status: "erro", error: message }).catch(() => {});
    return { status: "erro", error: message };
  }
}
