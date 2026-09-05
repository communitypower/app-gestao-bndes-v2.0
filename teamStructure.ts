import type { TeamGroupRole } from "./domain";

export type TeamStructureMember = {
  id: number;
  groupId: number | null;
  groupRole: TeamGroupRole;
  active: boolean;
};

export type ActivityAllocationInput = {
  teamMemberId: number;
  allocatedHours: number;
  responsibility: string;
  isExecutionLead: boolean;
};

export function isActiveCoordinator(
  member: TeamStructureMember | undefined
): member is TeamStructureMember {
  return Boolean(
    member?.active &&
      member.groupId &&
      member.groupRole === "coordenador"
  );
}

export function isEligibleCollaborator(
  _coordinator: TeamStructureMember,
  member: TeamStructureMember | undefined
) {
  return Boolean(member?.active);
}

export function validateActivityTeamSelection(
  responsible: TeamStructureMember | undefined,
  members: TeamStructureMember[],
  allocations: ActivityAllocationInput[]
) {
  const errors: string[] = [];
  if (!responsible?.active) {
    errors.push("O coordenador da atividade deve ser um integrante ativo da equipe.");
    return errors;
  }

  const memberById = new Map(members.map(member => [member.id, member]));
  const seen = new Set<number>();
  let executionLeadCount = 0;
  for (const allocation of allocations) {
    if (seen.has(allocation.teamMemberId)) {
      errors.push("Cada colaborador pode aparecer apenas uma vez na alocação.");
      continue;
    }
    seen.add(allocation.teamMemberId);

    if (!Number.isFinite(allocation.allocatedHours) || allocation.allocatedHours <= 0) {
      errors.push("As horas alocadas devem ser maiores que zero.");
    }
    const responsibility = allocation.responsibility.trim();
    if (responsibility.length < 3 || responsibility.length > 1_000) {
      errors.push(
        "Informe um escopo de responsabilidade entre 3 e 1.000 caracteres para cada integrante."
      );
    }
    if (allocation.isExecutionLead) executionLeadCount += 1;
    if (!isEligibleCollaborator(responsible, memberById.get(allocation.teamMemberId))) {
      errors.push("Só é possível alocar integrantes ativos.");
    }
  }
  if (allocations.length > 0 && executionLeadCount !== 1) {
    errors.push(
      "Defina exatamente um líder de execução quando houver responsabilidades delegadas."
    );
  }
  return errors;
}

export function totalAllocatedHours(
  allocations: Array<{ allocatedHours: number }>
) {
  return Number(
    allocations
      .reduce((sum, allocation) => sum + allocation.allocatedHours, 0)
      .toFixed(2)
  );
}
