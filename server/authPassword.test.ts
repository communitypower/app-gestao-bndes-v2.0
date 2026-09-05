import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  verifyProjectMasterKey,
  DEFAULT_MASTER_ACCESS_KEY,
} from "./authPassword";

describe("authPassword security utilities", () => {
  it("hashes and verifies personal passwords correctly", () => {
    const password = "MinhaSenhaForte@2026";
    const hash = hashPassword(password);

    expect(hash).toContain(":");
    expect(verifyPassword(password, hash)).toBe(true);
    expect(verifyPassword("SenhaErrada", hash)).toBe(false);
  });

  it("verifies the default project master access key", () => {
    expect(verifyProjectMasterKey("BNDES2026#Naval")).toBe(true);
    expect(verifyProjectMasterKey("BNDES2026#Naval ")).toBe(true);
    expect(verifyProjectMasterKey("qualquer-outra-senha")).toBe(false);
  });

  it("handles null/empty password hashes gracefully", () => {
    expect(verifyPassword("teste", null)).toBe(false);
    expect(verifyPassword("teste", undefined)).toBe(false);
    expect(verifyPassword("teste", "")).toBe(false);
    expect(verifyPassword("teste", "hash_invalido_sem_salt")).toBe(false);
  });
});
