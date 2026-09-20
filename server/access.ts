import { TRPCError } from "@trpc/server";
import type { User } from "../drizzle/schema";

export type ActivityAccessMember = {
  id: number;
  groupId: number | null;
  groupRole: "coordenador" | "participante";
  active: boolean;
};

export function isAdministrator(user: User) {
  return user.role === "admin" || user.appRole === "administrador";
}

export function isGeneralCoordinatorOrAdmin(
  user: User,
  member?: { name?: string | null } | null
) {
  if (isAdministrator(user)) return true;
  if (user.email && user.email.toLowerCase().includes("floriano")) return true;
  if (member?.name && member.name.includes("Floriano")) return true;
  return false;
}

export function assertAdministrator(user: User) {
  if (!isAdministrator(user)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Esta ação exige o perfil administrador.",
    });
  }
}

export function assertGeneralCoordinatorOrAdmin(
  user: User,
  member?: { name?: string | null } | null
) {
  if (!isGeneralCoordinatorOrAdmin(user, member)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Esta ação é restrita à Coordenação Geral (Prof. Floriano) ou Administradores.",
    });
  }
}

export function isActiveCoordinator(
  member: ActivityAccessMember | null | undefined
) {
  return Boolean(
    member?.active &&
      member.groupId &&
      member.groupRole === "coordenador"
  );
}

export function canAccessActivities(
  user: User,
  member: ActivityAccessMember | null | undefined,
  hasDelegatedActivities = false
) {
  return (
    isAdministrator(user) ||
    Boolean(member?.active) ||
    hasDelegatedActivities
  );
}

export function assertActivityAccess(
  user: User,
  member: ActivityAccessMember | null | undefined,
  hasDelegatedActivities = false
) {
  if (!canAccessActivities(user, member, hasDelegatedActivities)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "A área de atividades é restrita a integrantes ativos da equipe.",
    });
  }
}

export type ActivityExecutionScope = {
  responsibleId: number;
  delegatedMemberIds: number[];
};

export function canViewActivity(
  user: User,
  member: ActivityAccessMember | null | undefined,
  scope: ActivityExecutionScope
) {
  return (
    isAdministrator(user) ||
    Boolean(member?.active)
  );
}

export function assertCanViewActivity(
  user: User,
  member: ActivityAccessMember | null | undefined,
  scope: ActivityExecutionScope
) {
  if (!canViewActivity(user, member, scope)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Esta atividade é visível apenas para integrantes ativos da equipe.",
    });
  }
}

export function canManageActivityAllocations(
  user: User,
  member: ActivityAccessMember | null | undefined,
  responsibleId: number,
  responsibleGroupId?: number | null,
  parentResponsibleId?: number | null,
  parentResponsibleGroupId?: number | null
) {
  if (isAdministrator(user)) return true;
  if (!member?.active) return false;
  if (member.id === responsibleId) return true;
  if (responsibleGroupId && member.groupId === responsibleGroupId && member.groupRole === "coordenador") return true;
  if (parentResponsibleId && member.id === parentResponsibleId) return true;
  if (parentResponsibleGroupId && member.groupId === parentResponsibleGroupId && member.groupRole === "coordenador") return true;
  return false;
}

export function assertCanManageActivityAllocations(
  user: User,
  member: ActivityAccessMember | null | undefined,
  responsibleId: number,
  responsibleGroupId?: number | null,
  parentResponsibleId?: number | null,
  parentResponsibleGroupId?: number | null
) {
  if (!canManageActivityAllocations(user, member, responsibleId, responsibleGroupId, parentResponsibleId, parentResponsibleGroupId)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "A atribuição de execução desta seção é de responsabilidade do coordenador da seção correspondente ou do administrador.",
    });
  }
}

export type ActivityReviewScope = {
  responsibleId: number;
  responsibleGroupId: number | null;
  reviewerIds: number[];
};

export function canViewActivityReview(
  user: User,
  member: ActivityAccessMember | null | undefined,
  scope?: ActivityReviewScope
) {
  if (isAdministrator(user) || user.appRole === "coordenador") return true;
  if (!member?.active) return false;
  // Transparência: todos os participantes dos grupos envolvidos e da equipe ativa podem visualizar
  return true;
}

export function assertCanViewActivityReview(
  user: User,
  member: ActivityAccessMember | null | undefined,
  scope?: ActivityReviewScope
) {
  if (!canViewActivityReview(user, member, scope)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Este material é visível apenas para participantes ativos da equipe e grupos envolvidos.",
    });
  }
}

export function assertCanManageActivityReview(
  user: User,
  member: ActivityAccessMember | null | undefined,
  responsibleId: number,
  responsibleGroupId?: number | null
) {
  if (isAdministrator(user)) return;
  if (!member?.active) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Somente o coordenador do capítulo ou o administrador pode alocar revisores e submeter este material.",
    });
  }
  if (member.id === responsibleId) return;
  if (responsibleGroupId && member.groupId === responsibleGroupId && member.groupRole === "coordenador") return;
  throw new TRPCError({
    code: "FORBIDDEN",
    message:
      "Somente o coordenador do capítulo ou o administrador pode alocar revisores e submeter este material.",
  });
}

export function assertCanReviewActivity(
  user: User,
  member: ActivityAccessMember | null | undefined,
  reviewerIds: number[]
) {
  if (isAdministrator(user)) return;
  if (!member?.active || !reviewerIds.includes(member.id)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Somente um revisor apontado pode registrar este parecer.",
    });
  }
}

export type ActivityMaterialUploadScope = {
  responsibleId: number;
  responsibleGroupId?: number | null;
  allocations?: Array<{ teamMemberId: number }>;
  reviewers?: Array<{ teamMemberId: number }>;
};

export function canUploadActivityMaterial(
  user: User,
  member: ActivityAccessMember | null | undefined,
  activity: ActivityMaterialUploadScope
) {
  if (isAdministrator(user)) return true;
  if (!member?.active) return false;
  const isResponsible = member.id === activity.responsibleId;
  const isGroupCoordinator = Boolean(
    member.groupId &&
      member.groupId === activity.responsibleGroupId &&
      member.groupRole === "coordenador"
  );
  return isResponsible || isGroupCoordinator;
}

export function assertCanUploadActivityMaterial(
  user: User,
  member: ActivityAccessMember | null | undefined,
  activity: ActivityMaterialUploadScope
) {
  if (!canUploadActivityMaterial(user, member, activity)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Somente o coordenador do capítulo ou o administrador pode anexar materiais e dar fluxo para a revisão.",
    });
  }
}

export function canViewCoordinationInterface(
  user: User,
  member: ActivityAccessMember | null | undefined,
  groupIds: number[],
  chapterCoordinatorIds: number[] = [],
  responsibleId?: number | null
) {
  if (isAdministrator(user)) return true;
  if (!member?.active) return false;
  if (responsibleId && member.id === responsibleId) return true;
  if (member.groupId && groupIds.includes(member.groupId)) return true;
  if (chapterCoordinatorIds.includes(member.id)) return true;
  return false;
}

export function assertCanViewCoordinationInterface(
  user: User,
  member: ActivityAccessMember | null | undefined,
  groupIds: number[],
  chapterCoordinatorIds: number[] = [],
  responsibleId?: number | null
) {
  if (!canViewCoordinationInterface(user, member, groupIds, chapterCoordinatorIds, responsibleId)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Esta interface é restrita aos grupos e coordenadores de capítulo envolvidos.",
    });
  }
}

export function assertCanManageCoordinationInterface(
  user: User,
  member: ActivityAccessMember | null | undefined,
  groupIds: number[],
  chapterCoordinatorIds: number[] = [],
  responsibleId?: number | null
) {
  if (isAdministrator(user)) return;
  if (!member?.active) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Somente integrantes ativos podem interagir com esta interface.",
    });
  }
  const isLinkedGroup = Boolean(member.groupId && groupIds.includes(member.groupId));
  const isChapterCoordinator = chapterCoordinatorIds.includes(member.id);
  const isResponsible = Boolean(responsibleId && member.id === responsibleId);

  if (!isLinkedGroup && !isChapterCoordinator && !isResponsible) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Somente administradores, coordenadores de capítulo ou integrantes ativos vinculados aos grupos envolvidos podem gerir esta interface.",
    });
  }
}

export function assertCanResolveCoordinationInterface(
  user: User,
  member: ActivityAccessMember | null | undefined,
  responsibleId: number,
  chapterCoordinatorIds: number[] = []
) {
  if (isAdministrator(user)) return;
  if (!member?.active) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Somente integrantes ativos podem registrar resolução.",
    });
  }
  const isResponsible = member.id === responsibleId;
  const isChapterCoordinator = chapterCoordinatorIds.includes(member.id);

  if (!isResponsible && !isChapterCoordinator) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "A resolução final deve ser registrada pelo coordenador designado responsável ou por um dos coordenadores de capítulo envolvidos.",
    });
  }
}

