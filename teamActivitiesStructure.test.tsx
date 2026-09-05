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

  return { coordinator, participant, activity, detailLoading: false };
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/components/AdminGate", () => ({
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
      list: {
        useQuery: () => ({ data: [fixtures.activity], isLoading: false }),
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
            coordinator: { id: fixtures.coordinator.id, name: fixtures.coordinator.name },
            executionResponsibles: [{ id: fixtures.participant.id, name: fixtures.participant.name, isExecutionLead: true, allocatedHours: 24 }],
            reviewers: [],
            totalAllocatedHours: 24,
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
    expect(screen.queryByText("Floriano Carlos Martins Pires Jr.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /expandir informações do grupo g1/i }));
    expect(screen.getAllByText("Floriano Carlos Martins Pires Jr.").length).toBeGreaterThan(0);
    expect(screen.getByText("Cassiano Marins de Souza")).toBeInTheDocument();
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
  it("oferece filtros por responsável e revisor e exportação de status", () => {
    render(<ActivitiesPage />);
    expect(screen.getByRole("combobox", { name: /responsável/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /revisor/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^csv$/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /^pdf$/i })).toBeEnabled();
  });

  it("oferece atribuição em lote auditável para as seções pendentes de G4 e G10", () => {
    render(<ActivitiesPage />);
    fireEvent.click(screen.getByRole("button", { name: /atribuir g4\/g10 em lote/i }));
    expect(screen.getByText("Atribuir executores em lote")).toBeInTheDocument();
    expect(screen.getAllByText(/g4 — transporte marítimo mundial/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/i\.3\.1 · demanda por transporte marítimo/i)).toBeInTheDocument();
    expect(screen.getByText(/referência à matriz atividades-grupos\.xlsm/i)).toBeInTheDocument();
  });

  it("gera o download CSV do status das atividades", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    try {
      render(<ActivitiesPage />);
      fireEvent.click(screen.getByRole("button", { name: /^csv$/i }));
      await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
      expect(click).toHaveBeenCalled();
    } finally {
      click.mockRestore();
    }
  });

  it("abre a ficha completa por uma ação distinta da edição", async () => {
    render(<ActivitiesPage />);
    expect(
      screen.getByRole("button", { name: /ver ficha/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /editar construção naval mundial/i,
      })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /ver ficha/i }));
    expect(await screen.findByText("Ficha da atividade")).toBeInTheDocument();
    expect(
      screen.queryByText(/sistematizar a construção naval mundial, sua produção/i)
    ).not.toBeInTheDocument();
    expect(screen.getByText("Descrição da atividade")).toBeInTheDocument();
    expect(
      screen.getByText("Análise da trajetória e da estrutura da construção naval mundial.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Planejamento funcional")).not.toBeInTheDocument();
    expect(screen.getByText("Página temática; séries de produção; quadro comparativo internacional.")).toBeInTheDocument();
    expect(screen.getByText(/dados de produção, frota, estaleiros/i)).toBeInTheDocument();
    expect(screen.getByText("Cassiano Marins de Souza")).toBeInTheDocument();
    expect(screen.getAllByText("24h").length).toBeGreaterThan(0);
    expect(screen.getByText("Liderança de execução")).toBeInTheDocument();
    expect(
      screen.getByText("Consolidar dados e preparar a redação técnica da frente.")
    ).toBeInTheDocument();
    expect(screen.getByText("Registro histórico")).toBeInTheDocument();
    expect(screen.getByText("Andre Ricardo Mendonça Pinheiro")).toBeInTheDocument();
    expect(screen.getByText("Alocação preservada da estrutura anterior.")).toBeInTheDocument();
    expect(
      screen.getAllByText("Fronteira entre capacidade e produtividade").length
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(/delimitar indicadores compartilhados/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Checklist por seção e capítulo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /criar checklist de revisão/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /atribuir responsáveis/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /atribuir revisores/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edição rápida/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /edição rápida/i }));
    expect(screen.getByLabelText("Descrição da atividade")).toHaveValue(
      "Análise da trajetória e da estrutura da construção naval mundial."
    );
    expect(
      screen.getByRole("button", { name: /editar atividade/i })
    ).toBeInTheDocument();
  });

  it("disponibiliza a reaplicação explícita do cronograma oficial quando o checklist já existe", async () => {
    fixtures.activity.reviewChecklist.items = [
      {
        id: 501,
        scope: "seção",
        itemKey: "secao_texto_fontes",
        title: "Texto, fontes e referências da seção verificados",
        responsibleId: fixtures.participant.id,
        responsibleName: fixtures.participant.name,
        completedByName: null,
        dueAt: Date.UTC(2026, 8, 10, 12, 0, 0),
        status: "pendente",
      },
    ] as never;
    try {
      render(<ActivitiesPage />);
      fireEvent.click(screen.getByRole("button", { name: /ver ficha/i }));
      expect(await screen.findByRole("button", { name: /aplicar cronograma oficial/i })).toBeInTheDocument();
      expect(screen.getByRole("combobox", { name: /responsável por texto, fontes/i })).toBeInTheDocument();
    } finally {
      fixtures.activity.reviewChecklist.items = [];
    }
  });

  it("impede o vínculo de material quando o rótulo tem menos de três caracteres", async () => {
    render(<ActivitiesPage />);
    fireEvent.click(screen.getByRole("button", { name: /ver ficha/i }));
    const label = await screen.findByPlaceholderText(/nome do material ou evidência/i);
    fireEvent.change(label, { target: { value: "x" } });
    fireEvent.change(screen.getByPlaceholderText("https://..."), { target: { value: "https://example.com/material" } });
    expect(label).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("button", { name: /^vincular$/i })).toBeDisabled();
  });

  it("mantém títulos acessíveis enquanto os diálogos assíncronos carregam", async () => {
    fixtures.detailLoading = true;
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const scenarios = [
      { button: /ver ficha/i, title: /ficha da atividade/i },
      { button: /^distribuir$/i, title: /distribuição da execução/i },
      { button: /revisores/i, title: /alocar revisores/i },
    ];

    try {
      for (const scenario of scenarios) {
        const view = render(<ActivitiesPage />);
        fireEvent.click(screen.getByRole("button", { name: scenario.button }));
        expect(
          await screen.findByRole("heading", { name: scenario.title })
        ).toBeInTheDocument();
        view.unmount();
      }

      expect(
        consoleError.mock.calls.flat().join(" ")
      ).not.toContain("requires a `DialogTitle`");
    } finally {
      fixtures.detailLoading = false;
      consoleError.mockRestore();
    }
  });
});
