import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  ensureSeedData: vi.fn().mockResolvedValue(undefined),
  getTeamMemberByUserId: vi.fn().mockResolvedValue(null),
  hasCurrentActivityDelegation: vi.fn().mockResolvedValue(false),
  listLibraryItems: vi.fn().mockResolvedValue([]),
  listProductionMaterials: vi.fn().mockResolvedValue([]),
  requireDb: vi.fn(),
  getProjectSettings: vi.fn(),
  listNotificationLogs: vi.fn(),
  listUsers: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

function collaboratorContext(): TrpcContext {
  return {
    user: {
      id: 88,
      openId: "collaborator-areas-test",
      name: "Colaborador Áreas",
      email: "areas@example.com",
      loginMethod: "manus",
      role: "user",
      appRole: "executor",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("áreas autorizadas do colaborador", () => {
  it("permite consultar a biblioteca com busca e filtros tipados", async () => {
    const caller = appRouter.createCaller(collaboratorContext());
    await expect(
      caller.library.list({
        search: "financiamento",
        theme: "política industrial",
        sectionId: 9,
      })
    ).resolves.toEqual([]);
    expect(dbMocks.listLibraryItems).toHaveBeenCalledWith({
      search: "financiamento",
      theme: "política industrial",
      sectionId: 9,
    });
  });

  it("permite consultar a produção colaborativa", async () => {
    const caller = appRouter.createCaller(collaboratorContext());
    await expect(caller.production.list()).resolves.toEqual([]);
    expect(dbMocks.listProductionMaterials).toHaveBeenCalledTimes(1);
  });

  it("habilita atividades somente quando o integrante possui responsabilidade delegada vigente", async () => {
    dbMocks.getTeamMemberByUserId.mockResolvedValueOnce({
      id: 21,
      groupId: 7,
      groupRole: "participante",
      name: "Integrante Delegado",
      groupName: "Núcleo",
      active: true,
    });
    dbMocks.hasCurrentActivityDelegation.mockResolvedValueOnce(true);
    dbMocks.getProjectSettings.mockResolvedValueOnce({ id: 1 });

    const caller = appRouter.createCaller(collaboratorContext());
    await expect(caller.administration.status()).resolves.toMatchObject({
      isCoordinator: false,
      isExecutionDelegate: true,
      canAccessActivities: true,
      activityMembership: {
        id: 21,
        accessMode: "delegação",
      },
    });
  });
});
