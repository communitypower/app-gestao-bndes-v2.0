import { afterEach, describe, expect, it } from "vitest";
import { isWhatsAppConfigured } from "./whatsapp";

const originalToken = process.env.WHATSAPP_ACCESS_TOKEN;
const originalPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

afterEach(() => {
  if (originalToken === undefined) delete process.env.WHATSAPP_ACCESS_TOKEN;
  else process.env.WHATSAPP_ACCESS_TOKEN = originalToken;

  if (originalPhoneNumberId === undefined) {
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  } else {
    process.env.WHATSAPP_PHONE_NUMBER_ID = originalPhoneNumberId;
  }
});

describe("credenciais seguras do WhatsApp", () => {
  it("só considera a integração configurada quando token e Phone Number ID coexistem", () => {
    delete process.env.WHATSAPP_ACCESS_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    expect(isWhatsAppConfigured()).toBe(false);

    process.env.WHATSAPP_ACCESS_TOKEN = "token-de-teste";
    expect(isWhatsAppConfigured()).toBe(false);

    process.env.WHATSAPP_PHONE_NUMBER_ID = "123456789";
    expect(isWhatsAppConfigured()).toBe(true);
  });
});
