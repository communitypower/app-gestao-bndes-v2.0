import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getGovernanceOverview: vi.fn(),
  listTeamMembers: vi.fn(),
  requireDb: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

function context(id: number, role: "admin" | "user" = "admin"): TrpcContext {
  return {
    user: {
      id,
      openId: `governance-${id}`,
      name: `Usuário ${id}`,
      email: `governance-${id}@example.com`,
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

function mutationDb() {
  const values = vi.fn(() => ({
    onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
  }));
  return {
    insert: vi.fn(() => ({ values })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([]) })),
      })),
    })),
  };
}

const emptyGovernance = {
  p0Approval: null,
  activeMembers: [
    {
      id: 7,
      name: "Coordenação do Tomo",
      title: "Professor",
      institution: "UFRJ",
      groupName: "Núcleo",
      groupRole: "coordenador" as const,
    },
  ],
  tomeAssignments: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  dbMocks.getGovernanceOverview.mockResolvedValue(emptyGovernance);
  dbMocks.listTeamMembers.mockResolvedValue([
    { id: 7, name: "Coordenação do Tomo", active: true },
    { id: 8, name: "Substituição do Tomo", active: true },
  ]);
  dbMocks.requireDb.mockResolvedValue(mutationDb());
});

describe("governança documental", () => {
  it("permite consulta do workflow e restringe a aprovação do P0 ao administrador", async () => {
    const collaborator = appRouter.createCaller(context(2, "user"));

    await expect(collaborator.governance.overview()).resolves.toEqual(emptyGovernance);
    await expect(collaborator.governance.approveP0({})).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("registra a aprovação P0 apenas quando não existe uma decisão anterior", async () => {
    const admin = appRouter.createCaller(context(1));

    await expect(admin.governance.approveP0({ note: "Início autorizado pela coordenação." })).resolves.toEqual(emptyGovernance);
    expect(dbMocks.requireDb).toHaveBeenCalledTimes(1);

    dbMocks.getGovernanceOverview.mockResolvedValueOnce({
      ...emptyGovernance,
      p0Approval: { id: 1, decision: "aprovada" },
    });
    await expect(admin.governance.approveP0({})).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("impede usar o mesmo integrante como coordenador e substituto do tomo", async () => {
    const admin = appRouter.createCaller(context(1));

    await expect(
      admin.governance.updateTomeAssignment({
        tome: "Tomo I",
        coordinatorId: 7,
        substituteId: 7,
        justification: "Definição inicial da governança do tomo.",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
