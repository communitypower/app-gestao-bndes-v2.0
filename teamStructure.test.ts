import { describe, expect, it } from "vitest";
import {
  isActiveCoordinator,
  totalAllocatedHours,
  validateActivityTeamSelection,
} from "./teamStructure";

const coordinator = {
  id: 1,
  groupId: 10,
  groupRole: "coordenador" as const,
  active: true,
};
const participant = {
  id: 2,
  groupId: 10,
  groupRole: "participante" as const,
  active: true,
};

describe("estrutura de grupos e alocação de horas", () => {
  it("mantém o rótulo de coordenação de grupo sem restringir a coordenação da atividade", () => {
    expect(isActiveCoordinator(coordinator)).toBe(true);
    expect(isActiveCoordinator(participant)).toBe(false);
    expect(isActiveCoordinator({ ...coordinator, active: false })).toBe(false);
    expect(isActiveCoordinator({ ...coordinator, groupId: null })).toBe(false);
  });

  it("aceita alocação para integrante ativo de qualquer grupo, sem alterar a coordenação formal", () => {
    expect(
      validateActivityTeamSelection(coordinator, [coordinator, participant], [
        {
          teamMemberId: participant.id,
          allocatedHours: 24,
          responsibility: "Consolidar os dados da frente",
          isExecutionLead: true,
        },
      ])
    ).toEqual([]);

    expect(
      validateActivityTeamSelection(
        coordinator,
        [coordinator, participant, { ...participant, id: 3, groupId: 11 }],
        [{
          teamMemberId: 3,
          allocatedHours: 8,
          responsibility: "Preparar a análise comparativa",
          isExecutionLead: true,
        }]
      )
    ).toEqual([]);
  });

  it("rejeita duplicidade e horas não positivas, mas aceita integrante ativo como coordenador da atividade", () => {
    expect(
      validateActivityTeamSelection(coordinator, [coordinator, participant], [
        {
          teamMemberId: participant.id,
          allocatedHours: 0,
          responsibility: "Preparar a base documental",
          isExecutionLead: true,
        },
        {
          teamMemberId: participant.id,
          allocatedHours: 12,
          responsibility: "Revisar os resultados",
          isExecutionLead: false,
        },
      ])
    ).toEqual(
      expect.arrayContaining([
        "As horas alocadas devem ser maiores que zero.",
        "Cada colaborador pode aparecer apenas uma vez na alocação.",
      ])
    );
    expect(
      validateActivityTeamSelection(participant, [coordinator, participant], [])
    ).toEqual([]);
  });

  it("soma as horas individuais com duas casas decimais", () => {
    expect(
      totalAllocatedHours([
        {
          teamMemberId: 2,
          allocatedHours: 12.5,
          responsibility: "Coordenação da execução",
          isExecutionLead: true,
        },
        {
          teamMemberId: 3,
          allocatedHours: 7.25,
          responsibility: "Análise dos dados",
          isExecutionLead: false,
        },
      ])
    ).toBe(19.75);
  });

  it("exige escopo válido e exatamente um líder de execução", () => {
    const secondParticipant = { ...participant, id: 3 };
    expect(
      validateActivityTeamSelection(
        coordinator,
        [coordinator, participant, secondParticipant],
        [
          {
            teamMemberId: participant.id,
            allocatedHours: 8,
            responsibility: "",
            isExecutionLead: true,
          },
          {
            teamMemberId: secondParticipant.id,
            allocatedHours: 8,
            responsibility: "Apoiar a redação",
            isExecutionLead: true,
          },
        ]
      )
    ).toEqual(
      expect.arrayContaining([
        "Informe um escopo de responsabilidade entre 3 e 1.000 caracteres para cada integrante.",
        "Defina exatamente um líder de execução quando houver responsabilidades delegadas.",
      ])
    );
  });
});
