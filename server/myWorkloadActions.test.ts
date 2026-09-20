import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const fixtures = vi.hoisted(() => {
  const coordG1 = {
    id: 1,
    userId: 101,
    groupId: 1,
    groupRole: "coordenador" as const,
    name: "Floriano Carlos Martins Pires Jr.",
    active: true,
  };
  const coordG10 = {
    id: 3,
    userId: 103,
    groupId: 10,
    groupRole: "coordenador" as const,
    name: "Cassiano Marins de Souza",
    active: true,
  };
  const coordG11 = {
    id: 11,
    userId: 111,
    groupId: 11,
    groupRole: "coordenador" as const,
    name: "Marta Cecilia Tapia Reyes",
    active: true,
  };
  const executor = {
    id: 20,
    userId: 120,
    groupId: 11,
    groupRole: "participante" as const,
    name: "Marcos Pereira",
    active: true,
  };

  const activityG1 = {
    id: 101,
    parentActivityId: null,
    sectionCode: "I.1",
    title: "Apresentação e Metodologia",
    responsibleId: coordG1.id,
    responsibleGroupId: coordG1.groupId,
    documentStatus: "em elaboração",
    dueAt: Date.UTC(2026, 7, 25, 12),
    allocations: [],
    reviewers: [],
  };

  const activityG10_II7 = {
    id: 107,
    parentActivityId: null,
    sectionCode: "II.7",
    title: "Padrão tecnológico e recursos humanos",
    responsibleId: coordG10.id,
    responsibleGroupId: coordG10.groupId,
    documentStatus: "em elaboração",
    dueAt: Date.UTC(2026, 8, 15, 12),
    allocations: [],
    reviewers: [],
  };

  const activityG10_II8 = {
    id: 108,
    parentActivityId: null,
    sectionCode: "II.8",
    title: "Produtividade e competitividade",
    responsibleId: coordG10.id,
    responsibleGroupId: coordG10.groupId,
    documentStatus: "em elaboração",
    dueAt: Date.UTC(2026, 8, 15, 12),
    allocations: [],
    reviewers: [],
  };

  const activityG1_II3 = {
    id: 103,
    parentActivityId: null,
    sectionCode: "II.3",
    title: "Construção naval e offshore no Brasil",
    responsibleId: coordG1.id,
    responsibleGroupId: coordG1.groupId,
    documentStatus: "em elaboração",
    dueAt: Date.UTC(2026, 8, 15, 12),
    allocations: [],
    reviewers: [],
  };

  const activityG11_II4 = {
    id: 114,
    parentActivityId: null,
    sectionCode: "II.4",
    title: "Estrutura atual e capacidade dos estaleiros brasileiros",
    responsibleId: coordG11.id,
    responsibleGroupId: coordG11.groupId,
    documentStatus: "em elaboração",
    dueAt: Date.UTC(2026, 8, 15, 12),
    allocations: [
      {
        id: 1,
        activityId: 114,
        teamMemberId: executor.id,
        memberName: executor.name,
        allocatedHours: 40,
        responsibility: "Redigir minuta",
        isExecutionLead: true,
      },
    ],
    reviewers: [],
  };

  return { coordG1, coordG10, coordG11, executor, activityG1, activityG1_II3, activityG10_II7, activityG10_II8, activityG11_II4 };
});

const dbMocks = vi.hoisted(() => ({
  ensureSeedData: vi.fn().mockResolvedValue(undefined),
  getTeamMemberByUserId: vi.fn(),
  listActivities: vi.fn(),
  listProductionMaterials: vi.fn().mockResolvedValue([]),
  listCoordinationInterfaces: vi.fn().mockResolvedValue([]),
  listTeamMembers: vi.fn().mockResolvedValue([]),
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
      openId: `auth-${id}`,
      name: `Usuário ${id}`,
      email: `user-${id}@example.com`,
      loginMethod: "local",
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

describe("myWorkloadActions - segregação de ações por papel e alocação correta de grupos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.listActivities.mockResolvedValue([
      fixtures.activityG1,
      fixtures.activityG1_II3,
      fixtures.activityG10_II7,
      fixtures.activityG10_II8,
      fixtures.activityG11_II4,
    ]);
    dbMocks.listProductionMaterials.mockResolvedValue([]);
    dbMocks.listCoordinationInterfaces.mockResolvedValue([]);
    dbMocks.getTeamMemberByUserId.mockImplementation(async (userId: number) => {
      if (userId === 101) return fixtures.coordG1;
      if (userId === 103) return fixtures.coordG10;
      if (userId === 111) return fixtures.coordG11;
      if (userId === 120) return fixtures.executor;
      return null;
    });
  });

  it("coordenador do G10 (Cassiano) recebe ações para os capítulos II.7 e II.8", async () => {
    const caller = appRouter.createCaller(context(103, "user"));
    const result = await caller.activities.myWorkloadActions({ viewMode: "my_actions" });

    const ii7Action = result.actions.find(a => a.activityId === fixtures.activityG10_II7.id);
    const ii8Action = result.actions.find(a => a.activityId === fixtures.activityG10_II8.id);
    const g11Action = result.actions.find(a => a.activityId === fixtures.activityG11_II4.id);

    expect(ii7Action).toBeDefined();
    expect(ii8Action).toBeDefined();
    expect(g11Action).toBeUndefined();
  });

  it("coordenadora do G11 (Marta) NÃO recebe ações de II.7, II.8 e II.3, apenas de II.4", async () => {
    const caller = appRouter.createCaller(context(111, "user"));
    const result = await caller.activities.myWorkloadActions({ viewMode: "my_actions" });

    const ii7Action = result.actions.find(a => a.activityId === fixtures.activityG10_II7.id);
    const ii8Action = result.actions.find(a => a.activityId === fixtures.activityG10_II8.id);
    const ii3Action = result.actions.find(a => a.activityId === fixtures.activityG1_II3.id);
    const ii4Action = result.actions.find(a => a.activityId === fixtures.activityG11_II4.id);

    expect(ii7Action).toBeUndefined();
    expect(ii8Action).toBeUndefined();
    expect(ii3Action).toBeUndefined();
    expect(ii4Action).toBeDefined();
  });

  it("coordenador do G1 (Floriano) recebe ações de I.1 e II.3", async () => {
    const caller = appRouter.createCaller(context(101, "user"));
    const result = await caller.activities.myWorkloadActions({ viewMode: "my_actions" });

    const i1Action = result.actions.find(a => a.activityId === fixtures.activityG1.id);
    const ii3Action = result.actions.find(a => a.activityId === fixtures.activityG1_II3.id);
    const ii4Action = result.actions.find(a => a.activityId === fixtures.activityG11_II4.id);

    expect(i1Action).toBeDefined();
    expect(ii3Action).toBeDefined();
    expect(ii4Action).toBeUndefined();
  });

  it("administrador em 'all_pending' visualiza todas as pendências da equipe", async () => {
    const caller = appRouter.createCaller(context(1, "admin"));
    const result = await caller.activities.myWorkloadActions({ viewMode: "all_pending" });

    // Em all_pending, cada atividade não iniciada gera ação de elaboração (executor) e designação (coordenador)
    expect(result.actions.length).toBe(10);
    expect(result.summary.total).toBe(10);
    expect(result.summary.coordinatorCount).toBe(5);
    expect(result.summary.executorCount).toBe(5);
  });

  it("retorna as ações estritamente ordenadas por prazo cronológico (dueAt ascendente)", async () => {
    const caller = appRouter.createCaller(context(1, "admin"));
    const result = await caller.activities.myWorkloadActions({ viewMode: "all_pending" });

    // Verificar que cada ação tem dueAt <= à ação seguinte (ou null ao final)
    for (let i = 0; i < result.actions.length - 1; i++) {
      const current = result.actions[i].dueAt;
      const next = result.actions[i + 1].dueAt;
      if (current !== null && next !== null) {
        expect(current).toBeLessThanOrEqual(next);
      }
    }
  });
});
