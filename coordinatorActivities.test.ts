import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const fixtures = vi.hoisted(() => {
  const responsible = {
    id: 11,
    userId: 101,
    groupId: 7,
    groupRole: "coordenador" as const,
    active: true,
  };
  const otherCoordinator = {
    id: 12,
    userId: 102,
    groupId: 8,
    groupRole: "coordenador" as const,
    active: true,
  };
  const participant = {
    id: 13,
    userId: 103,
    groupId: 7,
    groupRole: "participante" as const,
    active: true,
  };
  const activity = {
    id: 21,
    responsibleId: responsible.id,
    responsibleGroupId: responsible.groupId,
    startAt: Date.UTC(2026, 7, 3, 12),
    dueAt: Date.UTC(2026, 7, 25, 12),
  };
  return { responsible, otherCoordinator, participant, activity };
});

const dbMocks = vi.hoisted(() => ({
  ensureSeedData: vi.fn().mockResolvedValue(undefined),
  getActivity: vi.fn().mockResolvedValue(fixtures.activity),
  getTeamMemberByUserId: vi.fn(),
  listActivities: vi.fn(),
  listTeamMembers: vi.fn(),
  requireDb: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

function context(
  id: number,
  role: "admin" | "user" = "user"
): TrpcContext {
  return {
    user: {
      id,
      openId: `authorization-${id}`,
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

describe("autorização das horas por atividade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getActivity.mockResolvedValue(fixtures.activity);
    dbMocks.getTeamMemberByUserId.mockImplementation(async (userId: number) => {
      if (userId === 101) return fixtures.responsible;
      if (userId === 102) return fixtures.otherCoordinator;
      if (userId === 103) return fixtures.participant;
      return null;
    });

    const members = [
      fixtures.responsible,
      fixtures.otherCoordinator,
      fixtures.participant,
    ];
    dbMocks.requireDb.mockResolvedValue({
      select: vi.fn(() => ({
        from: vi.fn().mockResolvedValue(members),
      })),
      delete: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      })),
      insert: vi.fn(() => ({
        values: vi.fn().mockResolvedValue(undefined),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn().mockResolvedValue(undefined),
        })),
      })),
    });
  });

  it("permite ao administrador distribuir responsabilidades de execução", async () => {
    const caller = appRouter.createCaller(context(1, "admin"));
    await expect(
      caller.activities.updateAllocations({
        id: fixtures.activity.id,
        allocations: [
          {
            teamMemberId: fixtures.participant.id,
            allocatedHours: 24,
            responsibility: "Consolidar a base documental da frente.",
            isExecutionLead: true,
          },
        ],
      })
    ).resolves.toMatchObject({ id: fixtures.activity.id });
  });

  it("permite ao coordenador responsável distribuir a execução no próprio grupo", async () => {
    const caller = appRouter.createCaller(context(101));
    await expect(
      caller.activities.updateAllocations({
        id: fixtures.activity.id,
        allocations: [
          {
            teamMemberId: fixtures.participant.id,
            allocatedHours: 16,
            responsibility: "Preparar a análise e a minuta técnica.",
            isExecutionLead: true,
          },
        ],
      })
    ).resolves.toMatchObject({ id: fixtures.activity.id });
  });

  it("bloqueia coordenador de outro grupo", async () => {
    const caller = appRouter.createCaller(context(102));
    await expect(
      caller.activities.updateAllocations({
        id: fixtures.activity.id,
        allocations: [],
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("bloqueia participante mesmo quando pertence ao grupo responsável", async () => {
    const caller = appRouter.createCaller(context(103));
    await expect(
      caller.activities.updateAllocations({
        id: fixtures.activity.id,
        allocations: [],
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("permite ao coordenador responsável definir o período da própria atividade", async () => {
    const caller = appRouter.createCaller(context(101));
    await expect(
      caller.activities.updateSchedule({
        id: fixtures.activity.id,
        startAt: Date.UTC(2026, 7, 3, 12),
        dueAt: Date.UTC(2026, 7, 25, 12),
      })
    ).resolves.toMatchObject({ id: fixtures.activity.id });
  });

  it("bloqueia a atualização de período por coordenador de outro grupo", async () => {
    const caller = appRouter.createCaller(context(102));
    await expect(
      caller.activities.updateSchedule({
        id: fixtures.activity.id,
        startAt: null,
        dueAt: Date.UTC(2026, 7, 25, 12),
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejeita período cujo início é posterior ao término", async () => {
    const caller = appRouter.createCaller(context(101));
    await expect(
      caller.activities.updateSchedule({
        id: fixtures.activity.id,
        startAt: Date.UTC(2026, 7, 26, 12),
        dueAt: Date.UTC(2026, 7, 25, 12),
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("permite ao coordenador responsável registrar marcos dentro do período", async () => {
    const caller = appRouter.createCaller(context(101));
    await expect(
      caller.activities.updateMilestones({
        id: fixtures.activity.id,
        milestones: [
          {
            title: "Validação da coleta documental",
            description: null,
            dueAt: Date.UTC(2026, 7, 14, 12),
            status: "planejado",
            sortOrder: 0,
          },
        ],
      })
    ).resolves.toMatchObject({ id: fixtures.activity.id });
  });

  it("bloqueia marcos fora do período e alterações por coordenador de outro grupo", async () => {
    const outsider = appRouter.createCaller(context(102));
    await expect(
      outsider.activities.updateMilestones({
        id: fixtures.activity.id,
        milestones: [],
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    const coordinator = appRouter.createCaller(context(101));
    await expect(
      coordinator.activities.updateMilestones({
        id: fixtures.activity.id,
        milestones: [
          {
            title: "Marco posterior ao prazo",
            description: null,
            dueAt: Date.UTC(2026, 7, 26, 12),
            status: "planejado",
            sortOrder: 0,
          },
        ],
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
