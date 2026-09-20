import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const fixtures = vi.hoisted(() => {
  const adminMember = { id: 1, userId: 1, name: "Denise Cunha", groupId: 1, groupRole: "coordenador" as const, active: true };
  const florianoMember = { id: 2, userId: 2, name: "Floriano Carlos Martins Pires Jr.", groupId: 1, groupRole: "coordenador" as const, active: true };
  const regularMember = { id: 3, userId: 3, name: "Pesquisador Regular", groupId: 2, groupRole: "participante" as const, active: true };

  return {
    adminMember,
    florianoMember,
    regularMember,
  };
});

const dbMocks = vi.hoisted(() => ({
  ensureSeedData: vi.fn().mockResolvedValue(undefined),
  getTeamMemberByUserId: vi.fn(),
  listTeamGroups: vi.fn().mockResolvedValue([]),
  listTeamMembers: vi.fn().mockResolvedValue([]),
  requireDb: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

function context(id: number, name: string, email: string, role: "admin" | "user" = "user"): TrpcContext {
  return {
    user: {
      id,
      openId: `openid-${id}`,
      name,
      email,
      loginMethod: "local",
      role,
      appRole: role === "admin" ? "administrador" : (email.includes("floriano") ? "coordenador" : "executor"),
      accessStatus: "ativo",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("teamRouter — Permissões e Carga de Planilha pelo Prof. Floriano e Administradores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("permite que o Prof. Floriano liste a hierarquia e participantes de equipe", async () => {
    dbMocks.getTeamMemberByUserId.mockResolvedValue(fixtures.florianoMember);
    const caller = appRouter.createCaller(
      context(2, "Floriano Carlos Martins Pires Jr.", "floriano@poli.ufrj.br", "user")
    );

    const hierarchy = await caller.team.hierarchy();
    expect(hierarchy).toBeDefined();

    const list = await caller.team.list();
    expect(list).toBeDefined();
  });

  it("permite que o Administrador liste e gerencie a equipe", async () => {
    dbMocks.getTeamMemberByUserId.mockResolvedValue(fixtures.adminMember);
    const caller = appRouter.createCaller(
      context(1, "Denise Cunha", "denisecunha@poli.ufrj.br", "admin")
    );

    const hierarchy = await caller.team.hierarchy();
    expect(hierarchy).toBeDefined();
  });

  it("bloqueia o acesso a usuários regulares sem permissão de coordenação geral ou administração", async () => {
    dbMocks.getTeamMemberByUserId.mockResolvedValue(fixtures.regularMember);
    const caller = appRouter.createCaller(
      context(3, "Pesquisador Regular", "regular@consultoria.com", "user")
    );

    await expect(caller.team.hierarchy()).rejects.toThrow(/restrita à Coordenação Geral/);
    await expect(caller.team.list()).rejects.toThrow(/restrita à Coordenação Geral/);
  });

  it("permite que o Prof. Floriano execute a importação de revisão da planilha matriz", async () => {
    dbMocks.getTeamMemberByUserId.mockResolvedValue(fixtures.florianoMember);

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockImplementation((table) => {
        return {
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
          then: (resolve: any) => resolve([]),
        };
      }),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 99 }]),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue({ rowCount: 1 }),
    };
    dbMocks.requireDb.mockResolvedValue(mockDb);

    const caller = appRouter.createCaller(
      context(2, "Floriano Carlos Martins Pires Jr.", "floriano@poli.ufrj.br", "user")
    );

    const csvSample = `G1,Sistematização
,,Floriano Carlos Martins Pires Jr.
,,Segen Farid Estefen
G2,Política Industrial
,,Carlos Frederico Leão Rocha
,,Marcelo Colomer Ferraro`;

    const result = await caller.team.importSpreadsheetMatrix({
      csvContent: csvSample,
      syncActivities: true,
    });

    expect(result.success).toBe(true);
    expect(result.groupsCount).toBe(2);
    expect(result.totalMembersCount).toBeGreaterThanOrEqual(4);
  });
});
