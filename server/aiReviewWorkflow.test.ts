import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { evaluateActivityReviewWithAI, generateDeterministicReviewEvaluation } from "./aiReviewEngine";

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
    name: "Usuário Externo",
    active: true,
  };

  const activity = {
    id: 10,
    planCode: "5.1",
    detailCode: "5.1",
    title: "Capítulo 5.1 - Diagnóstico da Indústria Naval",
    sectionId: 1,
    sectionCode: "5.1",
    sectionTitle: "Diagnóstico e Capacidade Produtiva dos Estaleiros",
    responsibleId: coordinator.id,
    responsibleName: coordinator.name,
    responsibleGroupId: coordinator.groupId,
    responsibleRole: coordinator.groupRole,
    groupName: "Grupo Setorial 5",
    documentStatus: "em revisão da seção",
    progress: 75,
    officialDescription: "Diagnóstico completo das instalações dos estaleiros, diques e capacidade de processamento de aço.",
    acceptanceCriteria: "Texto revisado conforme Anexo B, fontes estatísticas citadas e interfaces alinhadas.",
    allocations: [],
    reviewers: [
      { activityId: 10, teamMemberId: reviewer.id, status: "em revisão" },
    ],
  };

  const checklistItems = [
    {
      id: 1,
      activityId: 10,
      itemKey: "secao_texto_fontes",
      title: "Consistência Textual e Fontes Oficiais",
      status: "pendente",
      scope: "seção" as const,
      notes: null,
    },
    {
      id: 2,
      activityId: 10,
      itemKey: "secao_banco_evidencias",
      title: "Banco de Evidências e Séries Temporais",
      status: "pendente",
      scope: "seção" as const,
      notes: null,
    },
    {
      id: 3,
      activityId: 10,
      itemKey: "secao_interfaces",
      title: "Articulação de Interfaces Intercapítulos",
      status: "pendente",
      scope: "seção" as const,
      notes: null,
    },
    {
      id: 4,
      activityId: 10,
      itemKey: "capitulo_coerencia",
      title: "Coerência Global e Diretrizes do Tomo",
      status: "pendente",
      scope: "capítulo" as const,
      notes: null,
    },
    {
      id: 5,
      activityId: 10,
      itemKey: "capitulo_encaminhamento",
      title: "Encaminhamento Editorial e Próximos Passos",
      status: "pendente",
      scope: "capítulo" as const,
      notes: null,
    },
  ];

  const material = {
    id: 20,
    title: "Minuta Técnica 5.1",
    description: "Versão para revisão técnica",
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
        notes: "Versão completa com dados Anexo B",
        fileName: "minuta_5_1_v1.docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        fileSize: 2048,
        storageKey: "production/5.1/minuta_5_1_v1.docx",
        storageUrl: "https://storage.invalid/minuta_5_1_v1.docx",
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
    comments: [
      {
        id: 501,
        materialId: 20,
        revisionId: 101,
        authorId: reviewer.id,
        authorName: reviewer.name,
        comment: "Complementar séries de 2014 a 2024.",
        status: "aberto",
      },
    ],
    decisions: [],
  };

  const coordinationInterface = {
    id: 1,
    title: "Interface 5.1 - 5.2 (Demanda de Embarcações)",
    sourceSectionId: 1,
    targetSectionId: 2,
    responsibleId: coordinator.id,
    status: "resolvida" as const,
  };

  return {
    coordinator,
    reviewer,
    outsider,
    activity,
    checklistItems,
    material,
    coordinationInterface,
  };
});

const { dbMocks, mockDb, notificationMocks } = vi.hoisted(() => {
  const makeWhereResult = () => {
    const promise = Promise.resolve(fixtures.checklistItems);
    (promise as any).limit = vi.fn().mockResolvedValue(fixtures.checklistItems);
    (promise as any).orderBy = vi.fn().mockResolvedValue(fixtures.checklistItems);
    return promise;
  };

  const values = vi.fn().mockResolvedValue(undefined);

  const mockDb = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockImplementation(makeWhereResult),
        orderBy: vi.fn().mockResolvedValue(fixtures.checklistItems),
        limit: vi.fn().mockResolvedValue([fixtures.activity]),
      })),
    })),
    insert: vi.fn(() => ({ values })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      })),
    })),
  };

  const REVIEW_CHECKLIST_TEMPLATE = [
    { scope: "seção", itemKey: "secao_texto_fontes", title: "Texto, fontes e referências da seção verificados" },
    { scope: "seção", itemKey: "secao_banco_evidencias", title: "Banco de dados e evidências da seção conferidos" },
    { scope: "seção", itemKey: "secao_interfaces", title: "Interfaces e escopos sobrepostos da seção tratados" },
    { scope: "capítulo", itemKey: "capitulo_coerencia", title: "Coerência, integração e aderência ao escopo do capítulo verificadas" },
    { scope: "capítulo", itemKey: "capitulo_encaminhamento", title: "Encaminhamento ao coordenador do tomo preparado" },
  ] as const;

  const dbMocks = {
    REVIEW_CHECKLIST_TEMPLATE,
    ensureSeedData: vi.fn().mockResolvedValue(undefined),
    getActivity: vi.fn(),
    getTeamMemberByUserId: vi.fn(),
    listActivities: vi.fn(),
    listTeamMembers: vi.fn(),
    listProductionMaterials: vi.fn(),
    listActivityReviewChecklist: vi.fn(),
    listCoordinationInterfaces: vi.fn(),
    ensureActivityReviewChecklist: vi.fn().mockResolvedValue(undefined),
    listReviewChecklistItems: vi.fn(),
    listReviewChecklistEvents: vi.fn(),
    getReviewChecklistAuditSummary: vi.fn(),
    setReviewChecklistItemStatus: vi.fn(),
    recordReviewChecklistAudit: vi.fn(),
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

describe("Motor de Inteligência Artificial para Revisão e Checklist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getActivity.mockResolvedValue(fixtures.activity);
    dbMocks.getTeamMemberByUserId.mockImplementation(async (userId: number) => {
      if (userId === fixtures.coordinator.userId) return fixtures.coordinator;
      if (userId === fixtures.reviewer.userId) return fixtures.reviewer;
      if (userId === fixtures.outsider.userId) return fixtures.outsider;
      return null;
    });
    dbMocks.listTeamMembers.mockResolvedValue([fixtures.coordinator, fixtures.reviewer]);
    dbMocks.listProductionMaterials.mockResolvedValue([fixtures.material]);
    dbMocks.listActivityReviewChecklist.mockResolvedValue({
      items: fixtures.checklistItems,
      events: [],
    });
    dbMocks.listCoordinationInterfaces.mockResolvedValue([fixtures.coordinationInterface]);
    dbMocks.listReviewChecklistItems.mockResolvedValue(fixtures.checklistItems);
    dbMocks.listReviewChecklistEvents.mockResolvedValue([]);
    dbMocks.getReviewChecklistAuditSummary.mockResolvedValue({
      total: 5,
      conforme: 0,
      parcial: 0,
      nao_conforme: 0,
      pendente: 5,
      nao_se_aplica: 0,
    });
    dbMocks.setReviewChecklistItemStatus.mockResolvedValue({ success: true });
    dbMocks.recordReviewChecklistAudit.mockResolvedValue(undefined);
  });

  describe("Motor Determinístico e Base de Conhecimento Anexo B", () => {
    it("deve gerar avaliação técnica estruturada e fundamentada para um capítulo do Anexo B", () => {
      const evaluation = generateDeterministicReviewEvaluation({
        activity: fixtures.activity,
        material: fixtures.material,
        checklistItems: fixtures.checklistItems,
      });

      expect(evaluation).toBeDefined();
      expect(evaluation.overallScore).toBeGreaterThanOrEqual(0);
      expect(evaluation.overallScore).toBeLessThanOrEqual(100);
      expect(evaluation.stageCriteria).toHaveLength(5);
      expect(evaluation.checklistDiagnostics).toHaveLength(5);
      expect(evaluation.draftParecer).toBeDefined();
      expect(evaluation.draftParecer.text).toContain("Revisão");
      expect(evaluation.draftParecer.decisionType).toMatch(/aprovado|ajustes/);
    });

    it("deve cobrir os 5 itens oficiais do checklist com diagnósticos e justificativas", () => {
      const evaluation = generateDeterministicReviewEvaluation({
        activity: fixtures.activity,
        material: fixtures.material,
        checklistItems: fixtures.checklistItems,
      });

      const keys = evaluation.checklistDiagnostics.map((d) => d.itemKey);
      expect(keys).toContain("secao_texto_fontes");
      expect(keys).toContain("secao_banco_evidencias");
      expect(keys).toContain("secao_interfaces");
      expect(keys).toContain("capitulo_coerencia");
      expect(keys).toContain("capitulo_encaminhamento");

      evaluation.checklistDiagnostics.forEach((diag) => {
        expect(["pendente", "em andamento", "concluído", "bloqueado"]).toContain(diag.recommendedStatus);
        expect(diag.analysis).toBeTruthy();
        expect(Array.isArray(diag.recommendations)).toBe(true);
      });
    });
  });

  describe("Endpoints tRPC de Avaliação por IA", () => {
    it("deve executar aiReviewEvaluation com sucesso para coordenador ou revisor", async () => {
      const caller = appRouter.createCaller(context(fixtures.coordinator.userId));
      const res = await caller.activities.aiReviewEvaluation({
        activityId: fixtures.activity.id,
      });

      expect(res).toBeDefined();
      expect(res.checklistDiagnostics).toHaveLength(5);
      expect(res.stageCriteria).toHaveLength(5);
      expect(res.activityTitle).toBe(fixtures.activity.title);
      expect(res.overallScore).toBeGreaterThanOrEqual(0);
      expect(res.draftParecer).toBeDefined();
    });

    it("deve aplicar sugestões da IA no checklist salvando eventos de auditoria", async () => {
      const caller = appRouter.createCaller(context(fixtures.coordinator.userId));
      const items = [
        {
          itemKey: "secao_texto_fontes",
          status: "concluído" as const,
          notes: "Atende às normas técnicas e citações do Anexo B.",
        },
        {
          itemKey: "secao_interfaces",
          status: "em andamento" as const,
          notes: "Verificar interface com Capítulo 5.2.",
        },
      ];

      const res = await caller.activities.applyAIChecklistSuggestions({
        activityId: fixtures.activity.id,
        items,
      });

      expect(res).toBeDefined();
      expect(Array.isArray(res.items)).toBe(true);
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it("deve gerar minuta de parecer técnico pré-preenchida com justificativas", async () => {
      const caller = appRouter.createCaller(context(fixtures.coordinator.userId));
      const res = await caller.activities.generateAIParecerDraft({
        activityId: fixtures.activity.id,
      });

      expect(res).toBeDefined();
      expect(res.text).toBeTruthy();
      expect(res.keyPoints.length).toBeGreaterThan(0);
      expect(res.decisionType).toMatch(/aprovado|ajustes/);
    });

    it("deve bloquear usuário externo sem permissão de aplicar sugestões ou avaliar", async () => {
      const caller = appRouter.createCaller(context(fixtures.outsider.userId));
      await expect(
        caller.activities.applyAIChecklistSuggestions({
          activityId: fixtures.activity.id,
          items: [{ itemKey: "secao_texto_fontes", status: "concluído" }],
        })
      ).rejects.toThrow();
    });
  });
});
