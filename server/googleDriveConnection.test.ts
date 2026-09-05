import { describe, expect, it, vi } from "vitest";

type FetchLike = typeof fetch;

async function verifyGoogleOAuthClient(
  clientId: string,
  clientSecret: string,
  fetcher: FetchLike = fetch
) {
  const response = await fetcher("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: "verification-code-not-issued",
      grant_type: "authorization_code",
      redirect_uri: "https://gestaobndes-xppnpsup.manus.space/api/integrations/google/callback",
    }).toString(),
  });
  const payload = (await response.json()) as { error?: string };
  if (response.status === 401 || payload.error === "invalid_client") {
    throw new Error("Credenciais OAuth do Google inválidas.");
  }
  return payload.error === "invalid_grant";
}

async function verifyGoogleDriveConnection(accessToken: string, fetcher: FetchLike = fetch) {
  const response = await fetcher(
    "https://www.googleapis.com/drive/v3/about?fields=user(storageQuota)",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) throw new Error(`Google Drive respondeu com ${response.status}`);
  return response.json() as Promise<{ user?: { displayName?: string } }>;
}

describe("verificação da conexão Google Drive", () => {
  it("aceita a resposta invalid_grant como validação do cliente OAuth", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "invalid_grant" }), { status: 400 })
    ) as unknown as FetchLike;

    await expect(
      verifyGoogleOAuthClient("client-id", "client-secret", fetcher)
    ).resolves.toBe(true);
  });

  it.skipIf(!process.env.GOOGLE_DRIVE_CLIENT_ID || !process.env.GOOGLE_DRIVE_CLIENT_SECRET)(
    "valida as credenciais OAuth configuradas no endpoint leve do Google",
    async () => {
      await expect(
        verifyGoogleOAuthClient(
          process.env.GOOGLE_DRIVE_CLIENT_ID!,
          process.env.GOOGLE_DRIVE_CLIENT_SECRET!
        )
      ).resolves.toBe(true);
    }
  );

  it("consulta um endpoint leve do Drive com o token autorizado", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ user: { displayName: "Conta do estudo" } }), { status: 200 })
    ) as unknown as FetchLike;

    const result = await verifyGoogleDriveConnection("token-de-teste", fetcher);

    expect(result.user?.displayName).toBe("Conta do estudo");
    expect(fetcher).toHaveBeenCalledWith(
      "https://www.googleapis.com/drive/v3/about?fields=user(storageQuota)",
      expect.objectContaining({ headers: { Authorization: "Bearer token-de-teste" } })
    );
  });

  it.skipIf(!process.env.GOOGLE_DRIVE_ACCESS_TOKEN)(
    "valida a conta conectada quando o token OAuth estiver disponível",
    async () => {
      const result = await verifyGoogleDriveConnection(process.env.GOOGLE_DRIVE_ACCESS_TOKEN!);
      expect(result.user).toBeDefined();
    }
  );
});
