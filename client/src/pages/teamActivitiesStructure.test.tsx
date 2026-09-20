// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const fixtures = vi.hoisted(() => {
  const coordinator = {
  id: 1,
  userId: null,
  groupId: 10,
  groupRole: "coordenador" as const,
  name: "Floriano Carlos Martins Pires Jr.",
  title: "Professor",
  institution: "UFRJ",
  whatsappPhone: null,
  whatsappOptIn: true,
  active: true,
  groupName: "Núcleo",
  groupInstitution: "Interinstitucional",
  groupActive: true,
  createdAt: new Date("2026-07-01T12:00:00Z"),
  updatedAt: new Date("2026-07-01T12:00:00Z"),
  };

  const participant = {
    ...coordinator,
    id: 2,
    groupRole: "participante" as const,
    name: "Cassiano Marins de Souza",
    title: "Consultor",
    institution: "Consultoria",
  };

  const activity = {
  id: 21,
  parentActivityId: null,
  planCode: "B01",
  planSortOrder: 16,
  title: "Construção Naval Mundial",
  description: "Análise da trajetória e da estrutura da construção naval mundial.",
  planningSummary:
    "Estruturar, comparar e sistematizar a construção naval mundial, sua produção, capacidade, tecnologia e competitividade.",
  planningResponsible: "M1",
  planningSupport: "M2; M3",
  portalDeliverable: "Página temática; séries de produção; quadro comparativo internacional.",
  dependencies: "Dados de produção, frota, estaleiros e indicadores internacionais.",
  keywords: "construção naval; capacidade; competitividade",
  planningStatus: "Planejada",
  contentType: "Atividade de desenvolvimento + ficha pública",
  visibility: "Público após aprovação",
  acceptanceCriteria: "Texto revisado, fontes registradas e ficha de portal preenchida.",
  sourceBase: "Estrutura-Relatorio_1.docx",
  editorialDeliveryAt: Date.UTC(2026, 8, 15),
  bndesDeliveryAt: Date.UTC(2026, 8, 30),
  documentStatus: "planejada" as const,
  dueAt: Date.UTC(2026, 9, 1),
  status: "em andamento" as const,
  progress: 35,
  sectionId: 1,
  sectionCode: "II.1",
  sectionTitle: "Construção Naval Mundial",
  officialDescription:
    "Analisa a trajetória e a estrutura atual da construção naval mundial, sua capacidade instalada, tecnologia, competitividade e principais mercados.",
  responsibleId: coordinator.id,
  responsibleName: coordinator.name,
  responsibleTitle: coordinator.title,
  institution: coordinator.institution,
  responsibleGroupId: 10,
  responsibleRole: "coordenador" as const,
  groupName: "Núcleo",
  whatsappPhone: null,
  whatsappOptIn: true,
  createdAt: new Date("2026-07-01T12:00:00Z"),
  updatedAt: new Date("2026-07-02T12:00:00Z"),
  allocations: [
    {
      id: 40,
      activityId: 21,
      teamMemberId: participant.id,
      allocatedHours: 24,
      responsibility: "Consolidar dados e preparar a redação técnica da frente.",
      isExecutionLead: true,
      memberName: participant.name,
      memberTitle: participant.title,
      institution: participant.institution,
      groupId: 10,
      groupRole: "participante" as const,
      active: true,
    },
  ],
  totalAllocatedHours: 24,
  canManageAllocations: true,
  historicalAllocations: [
    {
      id: 41,
      activityId: 21,
      teamMemberId: 3,
      allocatedHours: 10,
      allocationType: "histórica" as const,
      note: "Alocação preservada da estrutura anterior.",
      memberName: "Andre Ricardo Mendonça Pinheiro",
      memberTitle: "Doutorando",
      institution: "UFRJ",
      groupId: 7,
      groupRole: "coordenador" as const,
      active: true,
    },
  ],
  historicalAllocatedHours: 10,
  reviewers: [],
  evidenceLinks: [],
  submissions: [],
  activeSubmission: null,
  productionMaterials: [
    {
      id: 101,
      activityId: 21,
      title: "Minuta Técnica do Capítulo II.1",
      description: "Versão preliminar para revisão técnica dos pares.",
      currentRevision: 1,
      reviewStatus: "em revisão",
      revisions: [
        {
          id: 1,
          revisionNumber: 1,
          fileName: "Minuta_Capitulo_II_1.docx",
          fileSize: 1048576,
          storageUrl: "https://example.com/minuta.docx",
        },
      ],
      comments: [],
    },
  ],
  reviewChecklist: { items: [], events: [] },
  interfaces: [
    {
      id: 91,
      title: "Fronteira entre capacidade e produtividade",
      priority: "alta" as const,
      status: "em discussão" as const,
      interfaceType: "escopo sobreposto" as const,
      responsibleName: "Floriano Carlos Martins Pires Jr.",
      groups: [{ name: "Núcleo" }, { name: "IE-UFRJ" }],
      events: [
        {
          summary: "Delimitar indicadores compartilhados antes da consolidação.",
        },
      ],
    },
  ],
  eligibleParticipants: [participant],
  eligibleReviewers: [participant],
  };

  const childActivity = {
    ...activity,
    id: 22,
    parentActivityId: 21,
    detailCode: "II.1.1",
    title: "Trajetória histórica da indústria naval",
    description: "Análise histórica da evolução dos estaleiros.",
    officialDescription: "Análise histórica da evolução dos estaleiros.",
    totalAllocatedHours: 12,
  };

  return { coordinator, participant, activity, childActivity, detailLoading: false };
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/components/AdminGate", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/ActivityAccessGate", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      team: {
        hierarchy: { invalidate: vi.fn() },
        list: { invalidate: vi.fn() },
      },
      activities: {
        list: { invalidate: vi.fn() },
        detail: { invalidate: vi.fn() },
        statusReport: { invalidate: vi.fn() },
        bulkAssignmentTargets: { invalidate: vi.fn() },
      },
      dashboard: { overview: { invalidate: vi.fn() } },
      administration: { status: { invalidate: vi.fn() } },
      fieldwork: { list: { invalidate: vi.fn() } },
      production: { list: { invalidate: vi.fn() } },
    }),
    administration: {
      status: {
        useQuery: () => ({
          data: {
            isAdmin: true,
            isCoordinator: false,
            canAccessActivities: true,
            activityMembership: null,
            users: [],
          },
          isLoading: false,
        }),
      },
    },
    production: {
      create: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue({ id: 101 }),
          isPending: false,
        }),
      },
      addRevision: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue({ id: 101 }),
          isPending: false,
        }),
      },
      submitForReview: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue({ submissionId: 201 }),
          isPending: false,
        }),
      },
      addComment: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue({ id: 101 }),
          isPending: false,
        }),
      },
      reviewDecision: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue({ id: 1 }),
          isPending: false,
        }),
      },
    },
    team: {
      hierarchy: {
        useQuery: () => ({
          data: [
            {
              id: 10,
              name: "G1 — Sistematização",
              institution: "Interinstitucional",
              active: true,
              createdAt: new Date("2026-07-01T12:00:00Z"),
              updatedAt: new Date("2026-07-01T12:00:00Z"),
              coordinator: fixtures.coordinator,
              participants: [fixtures.participant],
              kickoffParticipants: [
                fixtures.coordinator,
                { ...fixtures.participant, id: 3, name: "Segen Farid Estefen", primaryGroupId: 10, membershipSource: "kickoff_2026_08_30", sourceDocument: "kick-off" },
                { ...fixtures.participant, primaryGroupId: 10, membershipSource: "kickoff_2026_08_30", sourceDocument: "kick-off" },
              ],
              assignedSections: [
                {
                  groupId: 10,
                  activityId: 21,
                  planCode: "B01",
                  planSortOrder: 16,
                  activityTitle: "Construção Naval Mundial",
                  planningSummary:
                    "Estruturar, comparar e sistematizar a construção naval mundial, sua produção, capacidade, tecnologia e competitividade.",
                  portalDeliverable:
                    "Página temática; séries de produção; quadro comparativo internacional.",
                  sectionId: 1,
                  sectionCode: "II.1",
                  sectionTitle: "Construção Naval Mundial",
                  officialDescription:
                    "Analisa capacidade instalada, tecnologia e competitividade da construção naval mundial.",
                  sortOrder: 10,
                },
              ],
              memberCount: 2,
              activeMemberCount: 2,
            },
          ],
          isLoading: false,
        }),
      },
      list: {
        useQuery: () => ({
          data: [fixtures.coordinator, fixtures.participant],
        }),
        invalidate: vi.fn(),
      },
      create: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue([]),
          isPending: false,
        }),
      },
      update: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue([]),
          isPending: false,
        }),
      },
      importSpreadsheetMatrix: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue({
            success: true,
            groupsCount: 11,
            totalMembersCount: 33,
            addedMembersCount: 0,
            updatedMembersCount: 33,
            allocationsUpdated: 0,
            governance: { geral: [], administrativa: [], tecnica: [] },
            groups: [],
          }),
          isPending: false,
        }),
      },
    },
    dashboard: {
      sections: {
        useQuery: () => ({
          data: [{ id: 1, code: "II.1", title: "Construção Naval Mundial" }],
        }),
      },
    },
    fieldwork: {
      list: { useQuery: () => ({ data: [] }) },
      linkToActivity: { useMutation: () => ({ mutateAsync: vi.fn().mockResolvedValue([]), isPending: false }) },
    },
    activities: {
      myWorkloadActions: {
        useQuery: () => ({
          data: {
            summary: {
              total: 1,
              executorCount: 1,
              reviewerCount: 0,
              coordinatorCount: 0,
              interfaceCount: 0,
            },
            actions: [
              {
                id: "act-21",
                activityId: fixtures.activity.id,
                materialId: null,
                sectionCode: fixtures.activity.sectionCode,
                activityTitle: fixtures.activity.title,
                dueAt: fixtures.activity.dueAt,
                role: "executor" as const,
                actionType: "em_elaboracao",
                actionTitle: fixtures.activity.title,
                actionDescription: fixtures.activity.description,
                ctaLabel: "Abrir Ficha",
                ctaTarget: "activity_sheet",
              },
            ],
          },
          isLoading: false,
        }),
      },
      list: {
        useQuery: () => ({ data: [fixtures.activity, fixtures.childActivity], isLoading: false }),
      },
      statusReport: {
        useQuery: () => ({
          data: [{
            id: fixtures.activity.id,
            parentActivityId: null,
            parentActivityTitle: null,
            sectionCode: fixtures.activity.sectionCode,
            sectionTitle: fixtures.activity.sectionTitle,
            planCode: fixtures.activity.planCode,
            detailCode: null,
            title: fixtures.activity.title,
            status: fixtures.activity.status,
            progress: fixtures.activity.progress,
            startAt: null,
            dueAt: fixtures.activity.dueAt,
            actualStartAt: null,
            actualEndAt: null,
            nextStep: "Consolidar minutas",
            coordinator: { id: fixtures.coordinator.id, name: fixtures.coordinator.name },
            executionResponsibles: [{ id: fixtures.participant.id, name: fixtures.participant.name, isExecutionLead: true, allocatedHours: 0 }],
            reviewers: [],
            totalAllocatedHours: 0,
            checklist: { total: 0, completed: 0, pending: 0, blocked: 0, items: [] },
          }],
        }),
      },
      bulkAssignmentTargets: {
        useQuery: () => ({
          data: {
            groupCode: "G4",
            groupLabel: "G4 — Transporte Marítimo Mundial",
            source: "Atividades-Grupos.xlsm / aba Atividades",
            targets: [{ id: 22, planCode: "I.3.1", title: "Demanda por transporte marítimo", parentActivityId: 21, dueAt: Date.UTC(2026, 9, 15), documentStatus: "planejada" }],
            eligibleMembers: [fixtures.participant],
          },
          isLoading: false,
        }),
      },
      bulkAssignReferenceExecutor: {
        useMutation: () => ({ mutateAsync: vi.fn().mockResolvedValue({ updated: 1, groupCode: "G4" }), isPending: false }),
      },
      detail: {
        useQuery: () =>
          fixtures.detailLoading
            ? { data: undefined, isLoading: true }
            : { data: fixtures.activity, isLoading: false },
      },
      updateQuickInfo: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue(fixtures.activity),
          isPending: false,
        }),
      },
      create: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue([]),
          isPending: false,
        }),
      },
      update: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue([]),
          isPending: false,
        }),
      },
      updateAllocations: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue(fixtures.activity),
          isPending: false,
        }),
      },
      decideCrossGroupAllocation: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue(fixtures.activity),
          isPending: false,
        }),
      },
      updateReviewers: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue(fixtures.activity),
          isPending: false,
        }),
      },
      initializeReviewChecklist: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue(fixtures.activity),
          isPending: false,
        }),
      },
      applyOfficialChecklistSchedule: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue(fixtures.activity),
          isPending: false,
        }),
      },
      updateReviewChecklistItem: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue(fixtures.activity),
          isPending: false,
        }),
      },
      updateDescriptionQuickly: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue(fixtures.activity),
          isPending: false,
        }),
      },
      updateDocumentStatus: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue(fixtures.activity),
          isPending: false,
        }),
      },
      addEvidenceLink: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue(fixtures.activity),
          isPending: false,
        }),
      },
      applyAIChecklistSuggestions: {
        useMutation: () => ({
          mutateAsync: vi.fn().mockResolvedValue(fixtures.activity),
          isPending: false,
        }),
      },
      aiReviewEvaluation: {
        useQuery: () => ({
          data: undefined,
          isLoading: false,
          refetch: vi.fn(),
        }),
      },
      generateAIParecerDraft: {
        useQuery: () => ({
          data: undefined,
          isLoading: false,
          refetch: vi.fn(),
        }),
      },
    },
  },
}));

import ActivitiesPage from "./Activities";
import TeamPage from "./Team";

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  Element.prototype.scrollIntoView = vi.fn();
  Object.defineProperty(URL, "createObjectURL", { writable: true, value: vi.fn(() => "blob:status") });
  Object.defineProperty(URL, "revokeObjectURL", { writable: true, value: vi.fn() });
});

afterEach(() => cleanup());

describe("estrutura hierárquica da equipe", () => {
  it("exibe grupos inicialmente recolhidos e revela o coordenador e participantes ao expandir", () => {
    render(<TeamPage />);
    expect(screen.getByText("G1 · Sistematização")).toBeInTheDocument();
    expect(screen.getAllByText(/Floriano Carlos Martins Pires Jr./i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /expandir informações do grupo g1/i }));
    expect(screen.getAllByText(/Floriano Carlos Martins Pires Jr./i).length).toBeGreaterThan(1);
    expect(screen.getAllByText(/Cassiano Marins de Souza/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Segen Farid Estefen")).toBeInTheDocument();
    expect(screen.getByText("Coordenador responsável")).toBeInTheDocument();
    expect(screen.getByText("Participantes indicados no kick-off")).toBeInTheDocument();
    expect(screen.getByText("Itens sob coordenação")).toBeInTheDocument();
    expect(screen.getByText("Construção Naval Mundial")).toBeInTheDocument();
    expect(
      screen.getByText(/sistematizar a construção naval mundial, sua produção/i)
    ).toBeInTheDocument();
  });
});

describe("ficha visível da atividade", () => {
  it("renderiza o painel de minhas ações com itens imediatos", () => {
    render(<ActivitiesPage />);
    expect(screen.getByText("Minhas Ações no Estudo")).toBeInTheDocument();
    expect(screen.getAllByText(/construção naval mundial/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/abrir ficha/i).length).toBeGreaterThan(0);
  });

  it("abre a ficha unificada da atividade e exibe dados institucionais, repositório de documentos e checklist", async () => {
    render(<ActivitiesPage />);
    const openButtons = screen.getAllByRole("button", { name: /abrir ficha/i });
    fireEvent.click(openButtons[0]);

    expect(await screen.findByText("Ficha da Atividade")).toBeInTheDocument();
    expect(screen.getByText("Prazos, Status e Próximo Passo")).toBeInTheDocument();
    expect(screen.getByText("Documentos, Textos Intermediários e Minutas")).toBeInTheDocument();
    expect(screen.getByText("Etapa do Workflow e Checklist de Revisão")).toBeInTheDocument();
    expect(screen.getByText(/Equipe Temática de Apoio ao Capítulo/i)).toBeInTheDocument();
  });

  it("permite alternar para edição de informações básicas na Ficha", async () => {
    render(<ActivitiesPage />);
    const openButtons = screen.getAllByRole("button", { name: /abrir ficha/i });
    fireEvent.click(openButtons[0]);

    const editButton = await screen.findByRole("button", { name: /editar informações/i });
    fireEvent.click(editButton);

    expect(screen.getByLabelText(/descrição operacional/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/próximo passo imediato/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /salvar alterações/i })).toBeInTheDocument();
  });

  it("permite abrir formulário de anexo de novos documentos pelo coordenador", async () => {
    render(<ActivitiesPage />);
    const openButtons = screen.getAllByRole("button", { name: /abrir ficha/i });
    fireEvent.click(openButtons[0]);

    const attachBtn = await screen.findByRole("button", { name: /anexar documento \/ versão/i });
    fireEvent.click(attachBtn);

    expect(screen.getByPlaceholderText(/ex: minuta técnica intermediária/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/arquivo/i)).toBeInTheDocument();
  });

  it("permite apontar revisor técnico clicando no integrante da equipe temática", async () => {
    render(<ActivitiesPage />);
    const openButtons = screen.getAllByRole("button", { name: /abrir ficha/i });
    fireEvent.click(openButtons[0]);

    expect(await screen.findByText(/Equipe Temática de Apoio ao Capítulo/i)).toBeInTheDocument();
    const memberButton = screen.getByRole("button", { name: new RegExp(fixtures.participant.name, "i") });
    expect(memberButton).toBeInTheDocument();
    fireEvent.click(memberButton);
  });

  it("permite registrar parecer de revisão técnica diretamente no card do documento", async () => {
    render(<ActivitiesPage />);
    const openButtons = screen.getAllByRole("button", { name: /abrir ficha/i });
    fireEvent.click(openButtons[0]);

    expect(await screen.findByText(/Parecer da Revisão Técnica/i)).toBeInTheDocument();
    const approveBtn = screen.getByRole("button", { name: /Aprovar Minuta Técnica/i });
    const adjustBtn = screen.getByRole("button", { name: /Solicitar Ajustes/i });
    expect(approveBtn).toBeInTheDocument();
    expect(adjustBtn).toBeInTheDocument();
    fireEvent.click(approveBtn);
  });

  it("mantém títulos acessíveis no diálogo da Ficha da Atividade", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      render(<ActivitiesPage />);
      const openButtons = screen.getAllByRole("button", { name: /abrir ficha/i });
      fireEvent.click(openButtons[0]);

      expect(await screen.findByRole("heading", { name: /construção naval mundial/i })).toBeInTheDocument();
      expect(consoleError.mock.calls.flat().join(" ")).not.toContain("requires a `DialogTitle`");
    } finally {
      consoleError.mockRestore();
    }
  });
});
