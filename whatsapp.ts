type WhatsAppTemplateInput = {
  to: string;
  templateName: string;
  languageCode: string;
  parameters: string[];
};

type WhatsAppSendResult = {
  ok: boolean;
  messageId?: string;
  error?: string;
  notConfigured?: boolean;
};

export function isWhatsAppConfigured() {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN &&
      process.env.WHATSAPP_PHONE_NUMBER_ID
  );
}

export async function sendWhatsAppTemplate(
  input: WhatsAppTemplateInput
): Promise<WhatsAppSendResult> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v26.0";

  if (!accessToken || !phoneNumberId) {
    return {
      ok: false,
      notConfigured: true,
      error: "Credenciais da API do WhatsApp ainda não configuradas.",
    };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: input.to,
          type: "template",
          template: {
            name: input.templateName,
            language: { code: input.languageCode },
            components: [
              {
                type: "body",
                parameters: input.parameters.map(text => ({
                  type: "text",
                  text,
                })),
              },
            ],
          },
        }),
      }
    );

    const payload = (await response.json().catch(() => ({}))) as {
      messages?: Array<{ id?: string }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      return {
        ok: false,
        error:
          payload.error?.message ||
          `A API do WhatsApp respondeu com HTTP ${response.status}.`,
      };
    }

    return { ok: true, messageId: payload.messages?.[0]?.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha desconhecida.",
    };
  }
}
