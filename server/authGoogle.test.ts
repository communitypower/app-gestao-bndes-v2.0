import { describe, it, expect, beforeAll } from "vitest";
import { getAuthorizedUserByEmail } from "./authGoogle";
import { ensureSeedData, requireDb } from "./db";

describe("authGoogle authorization checks", () => {
  beforeAll(async () => {
    const db = await requireDb();
    await ensureSeedData(db);
  });

  it("authorizes a known team coordinator email", async () => {
    const result = await getAuthorizedUserByEmail("fred@ie.ufrj.br");
    expect(result.authorized).toBe(true);
    if (result.authorized) {
      expect(result.user.name).toContain("Carlos Frederico");
      expect(result.user.appRole).toBe("coordenador");
    }
  });

  it("authorizes the general coordinator email (Floriano)", async () => {
    const result = await getAuthorizedUserByEmail("floriano@oceanica.ufrj.br");
    expect(result.authorized).toBe(true);
    if (result.authorized) {
      expect(result.user.appRole).toBe("coordenador");
      expect(result.user.role).toBe("user");
    }
  });

  it("authorizes the study admin email (Denise Cunha)", async () => {
    const result = await getAuthorizedUserByEmail("denisecunha@poli.ufrj.br");
    expect(result.authorized).toBe(true);
    if (result.authorized) {
      expect(result.user.role).toBe("admin");
      expect(result.user.appRole).toBe("administrador");
    }
  });

  it("authorizes the dedicated system admin email", async () => {
    const result = await getAuthorizedUserByEmail("admin@estudo.ufrj.br");
    expect(result.authorized).toBe(true);
    if (result.authorized) {
      expect(result.user.role).toBe("admin");
      expect(result.user.appRole).toBe("administrador");
    }
  });

  it("rejects an unknown external email not in the study team", async () => {
    const result = await getAuthorizedUserByEmail("pessoa_de_fora@qualquer.com");
    expect(result.authorized).toBe(false);
  });
});
