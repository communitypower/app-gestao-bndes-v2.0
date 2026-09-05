import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const fixtures = vi.hoisted(() => {
  const coordinator = { id: 11, userId: 101, groupId: 7, groupRole: "coordenador" as const, active: true };
  const participant = { id: 12, userId: 102, groupId: 7, groupRole: "participante" as const, active: true };
  const otherCoordinator = { id: 13, userId: 103, groupId: 8, groupRole: "coordenador" as const, active: true };
  return {
    coordinator,
    participant,
    otherCoordinator,
    activity: { id: 21, planCode: "B04", title: "Inventário nacional de estaleiros" },
    group: { id: 7, active: true },
    otherGroup: { id: 8, active: true },
  };
});

const dbMocks = vi.hoisted(() => ({
  getTeamMemberByUserId: vi.fn(),
  listActivities: vi.fn(),
  listFieldworkActivities: vi.fn(),
  listTeamGroups: vi.fn(),
  listTeamMembers: vi.fn(),
  requireDb: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

function context(id: number, role: "admin" | "user" = "user"): TrpcContext {
  return {
    user: {
      id,
      openId: `fieldwork-${id}`,
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

const input = {
  code: "CAMPO-10",
  title: "Visita técnica de validação",
  description: "Coleta de evidências primárias em estaleiro vinculado ao item do plano.",
  category: "visita a estaleiro" as const,
  country: "Brasil",
  location: "Rio de Janeiro",
  relatedActivityId: 21,
  responsibleId: 11,
  groupId: 7,
  startAt: Date.UTC(2026, 7, 10, 12),
  dueAt: Date.UTC(2026, 7, 12, 12),
  status: "pendente" as const,
};

describe("atividades de campo e divulgação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getTeamMemberByUserId.mockImplementation(async (userId: number) => {
      if (userId === 101) return fixtures.coordinator;
      if (userId === 102) return fixtures.participant;
      if (userId === 103) return fixtures.otherCoordinator;
      return null;
    });
    dbMocks.listActivities.mockResolvedValue([fixtures.activity]);
    dbMocks.listTeamGroups.mockResolvedValue([fixtures.group, fixtures.otherGroup]);
    dbMocks.listTeamMembers.mockResolvedValue([fixtures.coordinator, fixtures.participant, fixtures.otherCoordinator]);
    dbMocks.listFieldworkActivities.mockResolvedValue([]);
    dbMocks.requireDb.mockResolvedValue({
      insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) })),
    });
  });

  it("permite ao administrador e a qualquer integrante ativo registrar atividade de campo", async () => {
    await expect(appRouter.createCaller(context(1, "admin")).fieldwork.create(input)).resolves.toEqual([]);
    await expect(appRouter.createCaller(context(101)).fieldwork.create(input)).resolves.toEqual([]);
    await expect(appRouter.createCaller(context(102)).fieldwork.create(input)).resolves.toEqual([]);
    await expect(appRouter.createCaller(context(103)).fieldwork.create(input)).resolves.toEqual([]);
  });

  it("permite responsável ativo de outro grupo quando a designação formal assim exigir", async () => {
    await expect(
      appRouter.createCaller(context(1, "admin")).fieldwork.create({ ...input, responsibleId: fixtures.otherCoordinator.id })
    ).resolves.toEqual([]);
  });
});
