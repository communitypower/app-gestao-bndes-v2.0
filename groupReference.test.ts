import { describe, expect, it } from "vitest";
import { groupReferenceFor, KICKOFF_GROUP_REFERENCE } from "./groupReference";

describe("composição funcional G1–G11 do kick-off", () => {
  it("mantém os onze grupos funcionais e todos os participantes indicados no kick-off", () => {
    expect(Object.keys(KICKOFF_GROUP_REFERENCE)).toHaveLength(11);
    expect(groupReferenceFor("G4 — Transporte Marítimo Mundial")?.members).toEqual([
      "Luiz Felipe Assis",
      "Floriano Carlos Martins Pires Jr.",
    ]);
    expect(groupReferenceFor("G10 — Construção Naval Mundial e Análise Econômica")?.scope).toContain("mundial");
    const uniqueMembers = new Set(Object.values(KICKOFF_GROUP_REFERENCE).flatMap(group => group.members));
    expect(uniqueMembers).toHaveLength(29);
    expect(groupReferenceFor("G7 — Fluvial: Transporte e Construção")?.members).toContain("Emmanuel Loureiro");
  });

  it("não cria referência para grupos inexistentes", () => {
    expect(groupReferenceFor("Grupo inexistente")).toBeNull();
  });
});
