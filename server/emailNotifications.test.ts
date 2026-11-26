import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sql } from "drizzle-orm";
import { requireDb } from "./db";
import { getEmailConfig, sendTransactionalEmail } from "./emailService";
import { collectDeadlineReminders, runDeadlineReminders, emailReviewerAssignment } from "./emailNotifications";

const rowsOf = (res: any): any[] => (Array.isArray(res) ? res : res?.rows ?? []);
const DAY = 86400000;
const enabled = { ...getEmailConfig({ EMAIL_NOTIFICATIONS_ENABLED: "true", BREVO_API_KEY: "k", MAIL_FROM_EMAIL: "estudo@exemplo.br" } as any) };

describe("avisos por e-mail", () => {
  let fetchMock: any;
  beforeEach(() => {
    fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ messageId: "m1" }) }));
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("não envia nada enquanto o envio não for ativado", async () => {
    const db = await requireDb();
    const cfg = getEmailConfig({} as any);
    expect(cfg.enabled).toBe(false);
    const res = await sendTransactionalEmail(db, { key: "x1", kind: "t", to: [{ email: "a@b.br" }], subject: "s", text: "t" }, cfg);
    expect(res.status).toBe("desativado");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("envia uma vez por chave (idempotente)", async () => {
    const db = await requireDb();
    const input = { key: `t-${Date.now()}`, kind: "t", to: [{ email: "a@b.br" }], subject: "s", text: "t" };
    expect((await sendTransactionalEmail(db, input, enabled)).status).toBe("enviado");
    expect((await sendTransactionalEmail(db, input, enabled)).status).toBe("duplicado");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("lembra o autor uma única vez quando a entrega fica a menos de 20 dias", async () => {
    const db = await requireDb();
    const now = Date.now();
    const act = rowsOf(await db.execute(sql`SELECT a.id FROM activities a JOIN team_members tm ON tm.id=a."responsibleId" WHERE a."structureStatus" <> 'arquivada' AND tm.email IS NOT NULL ORDER BY a.id LIMIT 2`));
    await db.execute(sql`UPDATE activities SET "dueAt" = ${now + 400 * DAY}`);
    await db.execute(sql`UPDATE activities SET "dueAt" = ${now + 10 * DAY}, "documentStatus" = 'planejada' WHERE id = ${act[0].id}`);
    await db.execute(sql`UPDATE activities SET "dueAt" = ${now + 30 * DAY}, "documentStatus" = 'planejada' WHERE id = ${act[1].id}`);

    const pending = await collectDeadlineReminders(db, now);
    const ids = pending.flatMap(g => g.items.map(i => i.activityId));
    expect(ids).toEqual([act[0].id]);

    const first = await runDeadlineReminders(now, enabled);
    expect(first.sent).toBe(1);
    const second = await runDeadlineReminders(now, enabled);
    expect(second.sent).toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.textContent).toContain("menos de 20 dias");
  });

  it("avisa o revisor indicado e ignora quem não é revisor da seção", async () => {
    const db = await requireDb();
    const row = rowsOf(await db.execute(sql`
      SELECT a.id AS aid, tm.id AS tmid, u.id AS uid FROM activities a, team_members tm JOIN users u ON lower(u.email)=lower(tm.email)
      WHERE tm.id <> a."responsibleId" ORDER BY a.id, tm.id LIMIT 1`))[0];
    await db.execute(sql`INSERT INTO activity_reviewers ("activityId","teamMemberId","assignedBy") VALUES (${row.aid}, ${row.tmid}, ${row.uid}) ON CONFLICT DO NOTHING`);
    const env = process.env;
    process.env = { ...env, EMAIL_NOTIFICATIONS_ENABLED: "true", BREVO_API_KEY: "k", MAIL_FROM_EMAIL: "estudo@exemplo.br" };
    try {
      await emailReviewerAssignment({ recipientUserId: row.uid, activityId: row.aid, notificationId: 999001, type: "revisao_atribuida" });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(JSON.parse(fetchMock.mock.calls[0][1].body).subject).toContain("Revisão atribuída");
      fetchMock.mockClear();
      await emailReviewerAssignment({ recipientUserId: row.uid, activityId: row.aid + 100000, notificationId: 999002, type: "revisao_atribuida" });
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      process.env = env;
    }
  });
});
