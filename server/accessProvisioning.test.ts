import { isProvisionActivatable, normalizeProvisionEmail } from "./accessProvisioning";
import { describe, expect, it } from "vitest";

describe("pré-cadastro de acesso por e-mail", () => {
  it("normaliza o e-mail informado no login antes da vinculação", () => {
    expect(normalizeProvisionEmail("  PedroLameira@UFPA.br ")).toBe("pedrolameira@ufpa.br");
    expect(normalizeProvisionEmail(" ")).toBeUndefined();
    expect(normalizeProvisionEmail(null)).toBeUndefined();
  });

  it("permite ativar apenas pré-cadastros pendentes ou já ativados", () => {
    expect(isProvisionActivatable("pendente")).toBe(true);
    expect(isProvisionActivatable("ativado")).toBe(true);
    expect(isProvisionActivatable("revogado")).toBe(false);
  });
});
