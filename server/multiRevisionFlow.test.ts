import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const fixtures = vi.hoisted(() => {
  const coordinator = {
    id: 11,
    userId: 101,
    groupId: 7,
    groupRole: "coordenador" as const,
    name: "Coordenador Alfa",
    active: true,
  };
  const reviewer = {
    id: 12,
    userId: 102,
    groupId: 8,
    groupRole: "participante" as const,
    name: "Revisor Beta",
    active: true,
  };
  const outsider = {
    id: 99,
    userId: 199,
    groupId: 99,
    groupRole: "participante" as const,
    name: "Outro Usuário",
    active: true,
  };

  const activity = {
    id: 10,
    title: "Capítulo 5.1 - Diagnóstico",
    sectionId: 1,
    sectionCode: "5.1",
    sectionTitle: "Diagnóstico Setorial",
    responsibleId: coordinator.id,
    responsibleName: coordinator.name,
    responsibleGroupId: coordinator.groupId,
    documentStatus: "em elaboração",
    allocations: [],
    reviewers: [
      { activityId: 10, teamMemberId: reviewer.id, status: "em revisão" },
    ],
  };

  const materialInReview = {
    id: 20,
    title: "Minuta Técnica 5.1",
    description: "Versão preliminar",
    activityId: 10,
    sectionId: 1,
    sectionCode: "5.1",
    responsibleId: coordinator.id,
    responsibleGroupId: coordinator.groupId,
    currentRevision: 1,
    reviewStatus: "em revisão" as const,
    revisions: [
      {
        id: 101,
        materialId: 20,
        revisionNumber: 1,
        notes: "Versão inicial",
        fileName: "minuta_v1.docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileSize: 1024,
        storageKey: "production/5.1/minuta_v1.docx",
        storageUrl: "https://storage.invalid/minuta_v1.docx",
        uploadedBy: coordinator.userId,
      },
    ],
    reviewers: [
      {
        id: 301,
        activityId: 10,
        teamMemberId: reviewer.id,
        reviewerName: reviewer.name,
        status: "em revisão" as const,
      },
    ],
    submissions: [
      {
        id: 401,
        activityId: 10,
        materialId: 20,
        revisionId: 101,
        status: "em revisão" as const,
        decisions: [],
      },
    ],
    comments: [],
    decisions: [],
  };

  const materialNeedsAdjustments = {
    ...materialInReview,
    reviewStatus: "ajustes solicitados" as const,
    submissions: [
      {
        id: 401,
        activityId: 10,
        materialId: 20,
        revisionId: 101,
        status: "ajustes solicitados" as const,
        decisions: [
          {
            id: 501,
            submissionId: 401,
            reviewerId: reviewer.id,
            reviewerName: reviewer.name,
            decision: "ajustes solicitados" as const,
            note: "Adicionar tabela de indicadores.",
            decidedAt: Date.now(),
          },
        ],
      },
    ],
  };

  return {
    coordinator,
    reviewer,
    outsider,
    activity,
    materialInReview,
    materialNeedsAdjustments,
  };
});

const { dbMocks, mockDb, notificationMocks } = vi.hoisted(() => {
  const mockDb = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  };

  const dbMocks = {
    ensureSeedData: vi.fn().mockResolvedValue(undefined),
    getActivity: vi.fn(),
    getTeamMemberByUserId: vi.fn(),
    listActivities: vi.fn(),
    listProductionMaterials: vi.fn(),
    requireDb: vi.fn().mockResolvedValue(mockDb),
    syncActivityDocumentStatus: vi.fn().mockResolvedValue(undefined),
  };

  const notificationMocks = {
    createParticipantNotification: vi.fn().mockResolvedValue(undefined),
    getUserIdForTeamMember: vi.fn().mockResolvedValue(102),
  };

  return { dbMocks, mockDb, notificationMocks };
});

vi.mock("./db", () => dbMocks);
vi.mock("./notificationService", () => notificationMocks);
vi.mock("./fileUpload", () => ({
  uploadProjectFile: vi.fn().mockResolvedValue({
    key: "production/5.1/minuta_v2.docx",
    url: "https://storage.invalid/minuta_v2.docx",
  }),
}));
vi.mock("./storage", () => ({
  storageGetSignedUrl: vi.fn().mockResolvedValue("https://storage.invalid/signed"),
}));

import { appRouter } from "./routers";

function context(id: number, role: "admin" | "user" = "user"): TrpcContext {
  return {
    user: {
      id,
      openId: `user-${id}`,
      name: `Usuário ${id}`,
      email: `user-${id}@example.com`,
      role,
    },
  };
}

describe("Fluxo de Múltiplas Revisões e Regras de Governança", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getActivity.mockResolvedValue(fixtures.activity);
    dbMocks.getTeamMemberByUserId.mockImplementation(async (userId: number) => {
      if (userId === fixtures.coordinator.userId) return fixtures.coordinator;
      if (userId === fixtures.reviewer.userId) return fixtures.reviewer;
      if (userId === fixtures.outsider.userId) return fixtures.outsider;
      return null;
    });

    const chainable = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ code: "5.1" }]),
      set: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 102 }]),
      }),
    };
    mockDb.select.mockReturnValue(chainable);
    mockDb.insert.mockReturnValue(chainable);
    mockDb.update.mockReturnValue(chainable);
  });

  it("bloqueia carregamento de nova revisão se a versão anterior (R01) ainda estiver 'em revisão'", async () => {
    dbMocks.listProductionMaterials.mockResolvedValue([fixtures.materialInReview]);

    const caller = appRouter.createCaller(context(fixtures.coordinator.userId));

    await expect(
      caller.production.addRevision({
        materialId: fixtures.materialInReview.id,
        notes: "Tentando subir R02 antes do parecer",
        autoSubmit: false,
        file: {
          fileName: "minuta_v2.docx",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          fileSize: 2048,
          base64: "YmFzZTY0",
        },
      })
    ).rejects.toThrow(/ainda está em processo ativo de avaliação técnica/i);
  });

  it("bloqueia a criação de um documento paralelo para a mesma atividade se já houver um 'em revisão'", async () => {
    dbMocks.listProductionMaterials.mockResolvedValue([fixtures.materialInReview]);

    const caller = appRouter.createCaller(context(fixtures.coordinator.userId));

    await expect(
      caller.production.create({
        title: "Outra Minuta Paralela",
        description: "Tentativa de bypass",
        activityId: fixtures.activity.id,
        sectionId: fixtures.activity.sectionId,
        notes: "Nova minuta",
        file: {
          fileName: "paralelo.docx",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          fileSize: 1024,
          base64: "YmFzZTY0",
        },
      })
    ).rejects.toThrow(/já possui um documento em revisão técnica ativa/i);
  });

  it("permite anexar Revisão R02 após parecer com 'ajustes solicitados' e realiza auto-submissão se solicitado", async () => {
    dbMocks.listProductionMaterials.mockResolvedValue([fixtures.materialNeedsAdjustments]);

    const caller = appRouter.createCaller(context(fixtures.coordinator.userId));

    const result = await caller.production.addRevision({
      materialId: fixtures.materialNeedsAdjustments.id,
      notes: "Tabela de indicadores inserida conforme solicitado pelo revisor.",
      autoSubmit: true,
      file: {
        fileName: "minuta_v2_ajustada.docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileSize: 2048,
        base64: "YmFzZTY0",
      },
    });

    expect(result).toBeDefined();
    expect(dbMocks.syncActivityDocumentStatus).toHaveBeenCalledWith(
      fixtures.activity.id,
      "submetida à revisão da seção",
      fixtures.coordinator.userId,
      expect.stringContaining("Revisão R02")
    );
    expect(notificationMocks.createParticipantNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "versao_submetida",
        title: expect.stringContaining("Revisão R02"),
      })
    );
  });

  it("garante que usuário externo não-coordenador nem admin é impedido de anexar revisão", async () => {
    dbMocks.listProductionMaterials.mockResolvedValue([fixtures.materialNeedsAdjustments]);

    const caller = appRouter.createCaller(context(fixtures.outsider.userId));

    await expect(
      caller.production.addRevision({
        materialId: fixtures.materialNeedsAdjustments.id,
        notes: "Tentativa não autorizada",
        autoSubmit: false,
        file: {
          fileName: "invasao.docx",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          fileSize: 1024,
          base64: "YmFzZTY0",
        },
      })
    ).rejects.toThrow(/Somente o coordenador do capítulo ou o administrador/i);
  });
});
