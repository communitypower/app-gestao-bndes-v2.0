import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  ensureSeedData: vi.fn(),
  getDashboardData: vi.fn(),
  getDocumentWorkflowKpis: vi.fn(),
  listSections: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

function context(): TrpcContext {
  return {
    user: {
      id: 4,
      openId: "kpi-user",
      name: "Integrante do Estudo",
      email: "kpi@example.com",
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

describe("KPIs do workflow documental", () => {
  it("retorna a distribuição de documentos por fase para integrante autenticado", async () => {
    const result = {
      totalDocuments: 281,
      chapters: 30,
      sections: 251,
      concluded: 0,
      inProgress: 281,
      priorityInterfaceBlockers: 5,
      stages: [{ key: "planejada", label: "Planejada", stage: "Preparação", chapters: 30, sections: 251, total: 281 }],
      updatedAt: "2026-08-30T00:00:00.000Z",
    };
    dbMocks.getDocumentWorkflowKpis.mockResolvedValue(result);

    const caller = appRouter.createCaller(context());

    await expect(caller.dashboard.documentKpis()).resolves.toEqual(result);
    expect(dbMocks.ensureSeedData).toHaveBeenCalledTimes(1);
    expect(dbMocks.getDocumentWorkflowKpis).toHaveBeenCalledTimes(1);
  });
});
