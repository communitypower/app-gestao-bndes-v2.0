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

export function assertAdministrator(user: User) {
  if (!isAdministrator(user)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Esta ação exige o perfil administrador.",
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
  responsibleId: number
) {
  return (
    isAdministrator(user) ||
    Boolean(member?.active && member.id === responsibleId)
  );
}

export function assertCanManageActivityAllocations(
  user: User,
  member: ActivityAccessMember | null | undefined,
  responsibleId: number
) {
  if (!canManageActivityAllocations(user, member, responsibleId)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Somente o administrador ou o coordenador designado da atividade pode distribuir responsabilidades e horas.",
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
  scope: ActivityReviewScope
) {
  if (isAdministrator(user)) return true;
  if (!member?.active) return false;
  return (
    member.id === scope.responsibleId ||
    Boolean(member.groupId && member.groupId === scope.responsibleGroupId) ||
    scope.reviewerIds.includes(member.id)
  );
}

export function assertCanViewActivityReview(
  user: User,
  member: ActivityAccessMember | null | undefined,
  scope: ActivityReviewScope
) {
  if (!canViewActivityReview(user, member, scope)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Este material é visível apenas para o grupo responsável e os revisores apontados.",
    });
  }
}

export function assertCanManageActivityReview(
  user: User,
  member: ActivityAccessMember | null | undefined,
  responsibleId: number
) {
  if (isAdministrator(user)) return;
  if (!member?.active || member.id !== responsibleId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Somente o coordenador designado da atividade pode alocar revisores e submeter este material.",
    });
  }
}

export function assertCanReviewActivity(
  user: User,
  member: ActivityAccessMember | null | undefined,
  reviewerIds: number[]
) {
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
  const isGroupMember = Boolean(
    member.groupId && member.groupId === activity.responsibleGroupId
  );
  const isExecutor = Boolean(
    activity.allocations?.some(a => a.teamMemberId === member.id)
  );
  const isReviewer = Boolean(
    activity.reviewers?.some(r => r.teamMemberId === member.id)
  );
  return isResponsible || isGroupCoordinator || isGroupMember || isExecutor || isReviewer;
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
        "Você só pode carregar materiais para atividades ou seções alocadas a você como coordenador, executor ou revisor.",
    });
  }
}

export function canViewCoordinationInterface(
  user: User,
  member: ActivityAccessMember | null | undefined,
  groupIds: number[]
) {
  return (
    isAdministrator(user) ||
    Boolean(member?.active && member.groupId && groupIds.includes(member.groupId))
  );
}

export function assertCanViewCoordinationInterface(
  user: User,
  member: ActivityAccessMember | null | undefined,
  groupIds: number[]
) {
  if (!canViewCoordinationInterface(user, member, groupIds)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Esta interface é restrita aos grupos envolvidos.",
    });
  }
}

export function assertCanManageCoordinationInterface(
  user: User,
  member: ActivityAccessMember | null | undefined,
  groupIds: number[]
) {
  if (isAdministrator(user)) return;
  if (
    !member?.active ||
    !member?.groupId ||
    !groupIds.includes(member.groupId)
  ) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "Somente administradores ou integrantes ativos vinculados aos grupos envolvidos podem gerir esta interface.",
    });
  }
}

export function assertCanResolveCoordinationInterface(
  user: User,
  member: ActivityAccessMember | null | undefined,
  responsibleId: number
) {
  if (isAdministrator(user)) return;
  if (!member?.active || member.id !== responsibleId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message:
        "A resolução final deve ser registrada pelo coordenador designado responsável.",
    });
  }
}
