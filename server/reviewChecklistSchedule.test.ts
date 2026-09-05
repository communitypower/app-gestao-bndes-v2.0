import { describe, expect, it } from "vitest";
import {
  officialReviewChecklistDeadline,
  REVIEW_CHECKLIST_TEMPLATE,
} from "./db";

describe("prazos do checklist de revisão", () => {
  const dueAt = Date.UTC(2027, 3, 20, 12, 0, 0);

  it("escalona as cinco verificações antes do prazo oficial do capítulo", () => {
    const activity = { startAt: null, dueAt };
    const deadlines = Object.fromEntries(
      REVIEW_CHECKLIST_TEMPLATE.map(item => [
        item.itemKey,
        officialReviewChecklistDeadline(activity, item.itemKey),
      ])
    );

    expect(deadlines.secao_texto_fontes).toBe(dueAt - 21 * 24 * 60 * 60 * 1000);
    expect(deadlines.secao_banco_evidencias).toBe(dueAt - 14 * 24 * 60 * 60 * 1000);
    expect(deadlines.secao_interfaces).toBe(dueAt - 10 * 24 * 60 * 60 * 1000);
    expect(deadlines.capitulo_coerencia).toBe(dueAt - 7 * 24 * 60 * 60 * 1000);
    expect(deadlines.capitulo_encaminhamento).toBe(dueAt - 2 * 24 * 60 * 60 * 1000);
  });

  it("não antecipa um item de revisão para antes do início oficial do capítulo", () => {
    const startAt = dueAt - 10 * 24 * 60 * 60 * 1000;
    expect(
      officialReviewChecklistDeadline({ startAt, dueAt }, "secao_texto_fontes")
    ).toBe(startAt);
  });

  it("usa a entrega interna editorial, e não a entrega contratual ao BNDES, como âncora do checklist", () => {
    const editorialDeliveryAt = Date.UTC(2027, 3, 15, 12, 0, 0);
    expect(
      officialReviewChecklistDeadline({ startAt: null, dueAt, editorialDeliveryAt }, "capitulo_encaminhamento")
    ).toBe(editorialDeliveryAt - 2 * 24 * 60 * 60 * 1000);
  });
});
