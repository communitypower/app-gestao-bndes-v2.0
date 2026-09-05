import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const fixtures = vi.hoisted(() => {
  const coordinator = {
    id: 11,
    userId: 101,
    groupId: 7,
    groupRole: "coordenador" as const,
    active: true,
  };
  const delegatedMember = {
    id: 13,
    userId: 103,
    groupId: 7,
    groupRole: "participante" as const,
    active: true,
  };
  const unassignedMember = {
    id: 14,
    userId: 104,
    groupId: 7,
    groupRole: "participante" as const,
    active: true,
  };
  const activity = {
    id: 41,
    responsibleId: coordinator.id,
    responsibleGroupId: coordinator.groupId,
    allocations: [
      {
        teamMemberId: delegatedMember.id,
        allocatedHours: 20,
        responsibility: "Consolidar a base documental da frente.",
        isExecutionLead: true,
      },
    ],
  };
  return { coordinator, delegatedMember, unassignedMember, activity };
});

const dbMocks = vi.hoisted(() => ({
  ensureSeedData: vi.fn().mockResolvedValue(undefined),
  getActivity: vi.fn(),
  getTeamMemberByUserId: vi.fn(),
  listActivities: vi.fn(),
  listTeamMembers: vi.fn().mockResolvedValue([]),
  requireDb: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

function context(id: number, role: "admin" | "user" = "user"): TrpcContext {
  return {
    user: {
      id,
      openId: `delegation-${id}`,
      name: `Usuário ${id}`,
      email: `usuario-${id}@example.com`,
      loginMethod: "manus",
      role,
      appRole: role === "admin" ? "administrador" : "executor",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("acesso de integrante com responsabilidade delegada", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getActivity.mockResolvedValue(fixtures.activity);
    dbMocks.listActivities.mockResolvedValue([fixtures.activity]);
    dbMocks.getTeamMemberByUserId.mockImplementation(async (userId: number) => {
      if (userId === 101) return fixtures.coordinator;
      if (userId === 103) return fixtures.delegatedMember;
      if (userId === 104) return fixtures.unassignedMember;
      return null;
    });
  });

  it("permite ao integrante delegado consultar somente a atividade atribuída", async () => {
    const caller = appRouter.createCaller(context(103));

    await expect(caller.activities.list()).resolves.toEqual([
      fixtures.activity,
    ]);
    await expect(caller.activities.detail({ id: fixtures.activity.id })).resolves.toMatchObject({
      id: fixtures.activity.id,
      canManageAllocations: false,
      eligibleParticipants: [],
      eligibleReviewers: [],
    });
  });

  it("permite a consulta por integrante ativo sem delegação e preserva a gestão para o coordenador designado", async () => {
    const unassignedCaller = appRouter.createCaller(context(104));
    await expect(unassignedCaller.activities.list()).resolves.toEqual([
      fixtures.activity,
    ]);

    const delegatedCaller = appRouter.createCaller(context(103));
    await expect(
      delegatedCaller.activities.updateAllocations({
        id: fixtures.activity.id,
        allocations: [],
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
