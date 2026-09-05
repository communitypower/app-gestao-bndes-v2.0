import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const fixtures = vi.hoisted(() => {
  const responsible = {
    id: 11,
    userId: 101,
    groupId: 7,
    groupRole: "coordenador" as const,
    name: "Coordenação Alfa",
    active: true,
  };
  const otherCoordinator = {
    id: 12,
    userId: 102,
    groupId: 8,
    groupRole: "coordenador" as const,
    name: "Coordenação Beta",
    active: true,
  };
  const groupParticipant = {
    id: 13,
    userId: 103,
    groupId: 7,
    groupRole: "participante" as const,
    name: "Participante Alfa",
    active: true,
  };
  const reviewer = {
    id: 14,
    userId: 104,
    groupId: 8,
    groupRole: "participante" as const,
    name: "Revisora Beta",
    active: true,
  };
  const executor = {
    id: 16,
    userId: 106,
    groupId: 7,
    groupRole: "participante" as const,
    name: "Executor Alfa",
    active: true,
  };
  const outsider = {
    id: 15,
    userId: 105,
    groupId: 9,
    groupRole: "participante" as const,
    name: "Participante Gama",
    active: true,
  };
  const activity = {
    id: 21,
    title: "Atividade 5.1",
    sectionId: 1,
    sectionCode: "5.1",
    sectionTitle: "Capacidade instalada",
    responsibleId: responsible.id,
    responsibleName: responsible.name,
    responsibleGroupId: responsible.groupId,
    allocations: [
      { activityId: 21, teamMemberId: executor.id, allocatedHours: 12, isExecutionLead: true },
    ],
    reviewers: [
      { activityId: 21, teamMemberId: reviewer.id, status: "em revisão" },
    ],
  };
  const submission = {
    id: 401,
    materialId: 31,
    activityId: activity.id,
    revisionId: 301,
    status: "em revisão" as const,
  };
  const material = {
    id: 31,
    title: "Diagnóstico preliminar",
    activityId: activity.id,
    sectionId: 1,
    sectionCode: "5.1",
    responsibleId: responsible.id,
    responsibleGroupId: responsible.groupId,
    currentRevision: 1,
    reviewStatus: "em revisão" as const,
    revisions: [
      {
        id: 301,
        materialId: 31,
        revisionNumber: 1,
        storageKey: "production/5.1/material.docx",
      },
    ],
    reviewers: [
      {
        id: 201,
        activityId: activity.id,
        teamMemberId: reviewer.id,
        reviewerName: reviewer.name,
        status: "em revisão" as const,
      },
    ],
    submissions: [submission],
    comments: [],
    decisions: [],
  };
  const interfaceItem = {
    id: 501,
    title: "Premissas comuns de capacidade instalada",
    description: "Compatibilizar limites e bases entre as duas seções.",
    interfaceType: "escopo sobreposto" as const,
    responsibleId: responsible.id,
    responsibleName: responsible.name,
    responsibleGroupName: "Grupo Alfa",
    priority: "alta" as const,
    status: "em discussão" as const,
    dueAt: null,
    resolution: null,
    sections: [
      { id: 601, interfaceId: 501, sectionId: 1, code: "5.1", title: "Capacidade instalada", role: "origem" as const },
      { id: 602, interfaceId: 501, sectionId: 2, code: "5.2", title: "Produtividade", role: "relacionada" as const },
    ],
    groups: [
      { id: 701, interfaceId: 501, groupId: 7, name: "Grupo Alfa", institution: "UFRJ", role: "responsável" as const },
      { id: 702, interfaceId: 501, groupId: 8, name: "Grupo Beta", institution: "UFF", role: "envolvido" as const },
    ],
    comments: [],
    events: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  return {
    responsible,
    otherCoordinator,
    groupParticipant,
    reviewer,
    executor,
    outsider,
    activity,
    submission,
    material,
    interfaceItem,
  };
});

const dbMocks = vi.hoisted(() => ({
  ensureSeedData: vi.fn().mockResolvedValue(undefined),
  getActivity: vi.fn(),
  getCoordinationInterface: vi.fn(),
  getTeamMemberByUserId: vi.fn(),
  listActivities: vi.fn(),
  listCoordinationInterfaces: vi.fn(),
  listProductionMaterials: vi.fn(),
  listSections: vi.fn(),
  listTeamGroups: vi.fn(),
  listTeamMembers: vi.fn(),
  requireDb: vi.fn(),
  syncActivityDocumentStatus: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./db", () => dbMocks);
vi.mock("./fileUpload", () => ({
  uploadProjectFile: vi.fn().mockResolvedValue({
    key: "production/test/file.docx",
    url: "https://storage.invalid/file.docx",
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
      openId: `workflow-${id}`,
      name: `Usuário ${id}`,
      email: `workflow-${id}@example.com`,
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

function mutationDb(returningId = 901) {
  const values = vi.fn(() => ({
    $returningId: vi.fn().mockResolvedValue([{ id: returningId }]),
    onDuplicateKeyUpdate: vi.fn().mockResolvedValue(undefined),
  }));
  const makeWhereResult = () => {
    const arr = [{ id: 1, teamMemberId: 14, code: "5.1" }];
    const promise = Promise.resolve(arr) as any;
    promise.filter = (fn: any) => arr.filter(fn);
    promise.limit = vi.fn().mockResolvedValue([{ code: "5.1" }]);
    return promise;
  };
  return {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockImplementation(makeWhereResult),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn().mockResolvedValue(undefined),
    })),
    insert: vi.fn(() => ({ values })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      })),
    })),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  dbMocks.getActivity.mockResolvedValue(fixtures.activity);
  dbMocks.getCoordinationInterface.mockResolvedValue(fixtures.interfaceItem);
  dbMocks.listActivities.mockResolvedValue([fixtures.activity]);
  dbMocks.listCoordinationInterfaces.mockResolvedValue([fixtures.interfaceItem]);
  dbMocks.listProductionMaterials.mockResolvedValue([fixtures.material]);
  dbMocks.listSections.mockResolvedValue([
    { id: 1, code: "5.1", title: "Capacidade instalada" },
    { id: 2, code: "5.2", title: "Produtividade" },
  ]);
  dbMocks.listTeamGroups.mockResolvedValue([
    { id: 7, name: "Grupo Alfa", active: true },
    { id: 8, name: "Grupo Beta", active: true },
    { id: 9, name: "Grupo Gama", active: true },
  ]);
  dbMocks.listTeamMembers.mockResolvedValue([
    fixtures.responsible,
    fixtures.otherCoordinator,
    fixtures.groupParticipant,
    fixtures.reviewer,
    fixtures.executor,
    fixtures.outsider,
  ]);
  dbMocks.getTeamMemberByUserId.mockImplementation(async (userId: number) => {
    if (userId === 101) return fixtures.responsible;
    if (userId === 102) return fixtures.otherCoordinator;
    if (userId === 103) return fixtures.groupParticipant;
    if (userId === 104) return fixtures.reviewer;
    if (userId === 105) return fixtures.outsider;
    if (userId === 106) return fixtures.executor;
    return null;
  });
  dbMocks.requireDb.mockResolvedValue(mutationDb());
});

describe("alocação de revisores por atividade", () => {
  it("permite ao administrador e ao coordenador responsável atualizar revisores", async () => {
    const admin = appRouter.createCaller(context(1, "admin"));
    const coordinator = appRouter.createCaller(context(101));

    await expect(
      admin.activities.updateReviewers({ id: 21, reviewerIds: [14] })
    ).resolves.toMatchObject({ id: 21 });
    await expect(
      coordinator.activities.updateReviewers({ id: 21, reviewerIds: [14] })
    ).resolves.toMatchObject({ id: 21 });
  });

  it("bloqueia coordenador alheio e participante do grupo responsável", async () => {
    const other = appRouter.createCaller(context(102));
    const participant = appRouter.createCaller(context(103));

    await expect(
      other.activities.updateReviewers({ id: 21, reviewerIds: [14] })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      participant.activities.updateReviewers({ id: 21, reviewerIds: [14] })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("impede que o executor designado seja indicado como revisor do próprio trabalho", async () => {
    const admin = appRouter.createCaller(context(1, "admin"));

    await expect(
      admin.activities.updateReviewers({ id: 21, reviewerIds: [16] })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("escopo de visualização e ciclo de revisão", () => {
  it("permite visualizar ao grupo e ao revisor, mas oculta de integrante externo", async () => {
    const groupViewer = await appRouter.createCaller(context(103)).production.list();
    const reviewer = await appRouter.createCaller(context(104)).production.list();
    const outsider = await appRouter.createCaller(context(105)).production.list();

    expect(groupViewer).toHaveLength(1);
    expect(groupViewer[0]?.permissions.isGroupViewer).toBe(true);
    expect(groupViewer[0]?.permissions.canReview).toBe(false);
    expect(reviewer[0]?.permissions.canReview).toBe(true);
    expect(outsider).toEqual([]);
  });

  it("permite ao coordenador submeter a versão vigente para os revisores apontados", async () => {
    dbMocks.requireDb.mockResolvedValue(mutationDb(901));
    const coordinator = appRouter.createCaller(context(101));

    await expect(
      coordinator.production.submitForReview({
        materialId: fixtures.material.id,
        message: "Solicito revisão das premissas e resultados.",
      })
    ).resolves.toEqual({ submissionId: 901 });
  });

  it("permite apontamento ao revisor e bloqueia comentário do observador do grupo", async () => {
    const reviewer = appRouter.createCaller(context(104));
    const groupViewer = appRouter.createCaller(context(103));

    await expect(
      reviewer.production.addComment({
        materialId: fixtures.material.id,
        submissionId: fixtures.submission.id,
        content: "Rever a base de comparação da capacidade instalada.",
        commentType: "solicitação de ajuste",
      })
    ).resolves.toMatchObject({ id: fixtures.material.id });

    await expect(
      groupViewer.production.addComment({
        materialId: fixtures.material.id,
        submissionId: fixtures.submission.id,
        content: "Comentário do observador.",
        commentType: "comentário",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("registra parecer do revisor e bloqueia participante não apontado", async () => {
    let selectCall = 0;
    const db = {
      ...mutationDb(),
      select: vi.fn(() => {
        selectCall += 1;
        if (selectCall === 1) {
          return {
            from: vi.fn(() => ({
              where: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([fixtures.submission]),
              })),
            })),
          };
        }
        if (selectCall === 2) {
          return {
            from: vi.fn(() => ({
              where: vi.fn().mockResolvedValue([]), // Nenhum apontamento pendente
            })),
          };
        }
        return {
          from: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([{ decision: "aprovado" }]),
          })),
        };
      }),
    };
    dbMocks.requireDb.mockResolvedValue(db);
    const reviewer = appRouter.createCaller(context(104));

    await expect(
      reviewer.production.reviewDecision({
        submissionId: fixtures.submission.id,
        decision: "aprovado",
        note: "Premissas consistentes após a revisão.",
      })
    ).resolves.toMatchObject({ id: fixtures.material.id });

    selectCall = 0;
    await expect(
      appRouter.createCaller(context(103)).production.reviewDecision({
        submissionId: fixtures.submission.id,
        decision: "aprovado",
        note: null,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("bloqueia aprovação de parecer se houver apontamentos não resolvidos", async () => {
    let selectCall = 0;
    const db = {
      ...mutationDb(),
      select: vi.fn(() => {
        selectCall += 1;
        if (selectCall === 1) {
          return {
            from: vi.fn(() => ({
              where: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([fixtures.submission]),
              })),
            })),
          };
        }
        if (selectCall === 2) {
          return {
            from: vi.fn(() => ({
              where: vi.fn().mockResolvedValue([
                { id: 401, status: "aberto", commentType: "solicitação de ajuste", resolvedAt: null },
              ]),
            })),
          };
        }
        return {
          from: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
        };
      }),
    };
    dbMocks.requireDb.mockResolvedValue(db);
    const reviewer = appRouter.createCaller(context(104));

    await expect(
      reviewer.production.reviewDecision({
        submissionId: fixtures.submission.id,
        decision: "aprovado",
        note: "Tentativa de aprovação com pendência.",
      })
    ).rejects.toThrow(/A aprovação está bloqueada pois existem 1 apontamento/);
  });

  it("permite ao autor/executor implementar apontamento com nota técnica", async () => {
    const db = {
      ...mutationDb(),
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([
              { id: 401, materialId: fixtures.material.id, status: "aberto" },
            ]),
          })),
        })),
      })),
    };
    dbMocks.requireDb.mockResolvedValue(db);
    const executor = appRouter.createCaller(context(106));

    await expect(
      executor.production.implementComment({
        commentId: 401,
        implementationNote: "Parágrafo 3 revisado com os novos dados de demanda.",
      })
    ).resolves.toMatchObject({ id: fixtures.material.id });
  });

  it("permite ao revisor resolver e aceitar apontamento", async () => {
    const db = {
      ...mutationDb(),
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([
              { id: 401, materialId: fixtures.material.id, status: "implementado" },
            ]),
          })),
        })),
      })),
    };
    dbMocks.requireDb.mockResolvedValue(db);
    const reviewer = appRouter.createCaller(context(104));

    await expect(
      reviewer.production.resolveComment({
        commentId: 401,
        resolved: true,
      })
    ).resolves.toMatchObject({ id: fixtures.material.id });
  });

  it("permite ao coordenador consolidar a seção aprovada no capítulo", async () => {
    dbMocks.listProductionMaterials.mockResolvedValue([
      {
        ...fixtures.material,
        reviewStatus: "aprovado",
      },
    ]);
    dbMocks.getActivity.mockResolvedValue({
      ...fixtures.activity,
      documentStatus: "revisada pela seção",
    });
    const coordinator = appRouter.createCaller(context(101));

    await expect(
      coordinator.production.consolidateInChapter({
        materialId: fixtures.material.id,
        note: "Seção 5.1 consolidada no capítulo 5 com pareceres favoráveis.",
      })
    ).resolves.toMatchObject({ id: fixtures.material.id });

    expect(dbMocks.syncActivityDocumentStatus).toHaveBeenCalledWith(
      fixtures.material.activityId,
      "consolidada no capítulo",
      101,
      "Seção 5.1 consolidada no capítulo 5 com pareceres favoráveis."
    );
  });

  it("bloqueia o executor designado de emitir parecer em uma designação legada", async () => {
    dbMocks.requireDb.mockResolvedValue({
      ...mutationDb(),
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([fixtures.submission]),
          })),
        })),
      })),
    });
    const executor = appRouter.createCaller(context(106));

    await expect(
      executor.production.reviewDecision({
        submissionId: fixtures.submission.id,
        decision: "aprovado",
        note: "Parecer que não deve ser permitido ao executor.",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("gestão e resolução de interfaces entre grupos", () => {
  const input = {
    title: "Premissas comuns de capacidade instalada",
    description: "Compatibilizar limites e bases entre as duas seções.",
    interfaceType: "escopo sobreposto" as const,
    responsibleId: 11,
    priority: "alta" as const,
    status: "em discussão" as const,
    dueAt: null,
    resolution: null,
    sectionIds: [1, 2],
    groupIds: [7, 8],
  };

  it("mostra a interface aos grupos envolvidos e oculta do grupo externo", async () => {
    const involved = await appRouter.createCaller(context(103)).interfaces.list();
    const external = await appRouter.createCaller(context(105)).interfaces.list();

    expect(involved).toHaveLength(1);
    expect(external).toEqual([]);
  });

  it("permite ao coordenador responsável criar a interface com duas seções e dois grupos", async () => {
    dbMocks.requireDb.mockResolvedValue(mutationDb(501));
    await expect(
      appRouter.createCaller(context(101)).interfaces.create(input)
    ).resolves.toMatchObject({ id: 501 });
  });

  it("aceita item do plano pertencente às seções e grupos da interface", async () => {
    dbMocks.requireDb.mockResolvedValue(mutationDb(502));
    dbMocks.getCoordinationInterface.mockImplementation(async (id: number) => ({
      ...fixtures.interfaceItem,
      id,
    }));
    await expect(
      appRouter.createCaller(context(101)).interfaces.create({
        ...input,
        activityIds: [fixtures.activity.id],
      })
    ).resolves.toMatchObject({ id: 502 });
  });

  it("permite discussão a integrantes ativos dos grupos envolvidos", async () => {
    await expect(
      appRouter.createCaller(context(102)).interfaces.addComment({
        interfaceId: 501,
        content: "Validaremos a fronteira metodológica na próxima reunião.",
      })
    ).resolves.toMatchObject({ id: 501 });

    await expect(
      appRouter.createCaller(context(103)).interfaces.addComment({
        interfaceId: 501,
        content: "Comentário de integrante ativo do grupo envolvido.",
      })
    ).resolves.toMatchObject({ id: 501 });
  });

  it("reserva a resolução ao coordenador responsável ou administrador", async () => {
    const resolvedInput = {
      id: 501,
      ...input,
      status: "resolvida" as const,
      resolution: "A seção 5.1 consolida a capacidade; a 5.2 referencia seus resultados.",
    };

    await expect(
      appRouter.createCaller(context(102)).interfaces.update(resolvedInput)
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      appRouter.createCaller(context(101)).interfaces.update(resolvedInput)
    ).resolves.toMatchObject({ id: 501 });
  });
});

describe("limitação de carregamento de materiais por usuário", () => {
  it("expõe apenas as atividades alocadas para o executor e coordenador, e oculta de usuário sem alocação", async () => {
    const coordinatorActivities = await appRouter
      .createCaller(context(101))
      .production.allocatedActivities();
    const executorActivities = await appRouter
      .createCaller(context(106))
      .production.allocatedActivities();
    const reviewerActivities = await appRouter
      .createCaller(context(104))
      .production.allocatedActivities();
    const outsiderActivities = await appRouter
      .createCaller(context(105))
      .production.allocatedActivities();
    const adminActivities = await appRouter
      .createCaller(context(1, "admin"))
      .production.allocatedActivities();

    expect(coordinatorActivities).toHaveLength(1);
    expect(coordinatorActivities[0]?.allocationRole).toBe("coordenador");

    expect(executorActivities).toHaveLength(1);
    expect(executorActivities[0]?.allocationRole).toBe("executor");

    expect(reviewerActivities).toHaveLength(1);
    expect(reviewerActivities[0]?.allocationRole).toBe("revisor");

    expect(outsiderActivities).toHaveLength(0);

    expect(adminActivities).toHaveLength(1);
    expect(adminActivities[0]?.allocationRole).toBe("administrador");
  });

  it("permite ao executor alocado carregar material para sua atividade e bloqueia usuário externo", async () => {
    dbMocks.requireDb.mockResolvedValue(mutationDb(999));
    dbMocks.listProductionMaterials.mockResolvedValue([
      fixtures.material,
      { ...fixtures.material, id: 999 },
    ]);
    const executor = appRouter.createCaller(context(106));
    const outsider = appRouter.createCaller(context(105));

    await expect(
      executor.production.create({
        title: "Relatório de execução",
        description: "Versão elaborada pelo executor",
        activityId: fixtures.activity.id,
        sectionId: fixtures.activity.sectionId,
        notes: "Versão 1",
        file: {
          fileName: "execucao.pdf",
          mimeType: "application/pdf",
          fileSize: 1024,
          base64: "AQIDBA==",
        },
      })
    ).resolves.toMatchObject({ id: 999 });

    await expect(
      outsider.production.create({
        title: "Tentativa não autorizada",
        description: "Tentativa de envio",
        activityId: fixtures.activity.id,
        sectionId: fixtures.activity.sectionId,
        notes: null,
        file: {
          fileName: "tentativa.pdf",
          mimeType: "application/pdf",
          fileSize: 1024,
          base64: "AQIDBA==",
        },
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
