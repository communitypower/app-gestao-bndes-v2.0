// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import TeamPage from "./Team";

const mockGroup = {
  id: 1,
  name: "G1 — Sistematização",
  institution: "Interinstitucional",
  active: true,
  coordinator: {
    id: 10,
    userId: 2,
    groupId: 1,
    groupRole: "coordenador" as const,
    name: "Floriano Carlos Martins Pires Jr.",
    title: "Professor",
    institution: "UFRJ",
    email: "floriano@poli.ufrj.br",
    whatsappPhone: null,
    whatsappOptIn: false,
    active: true,
  },
  participants: [],
  kickoffParticipants: [
    {
      id: 10,
      userId: 2,
      groupId: 1,
      primaryGroupId: 1,
      groupRole: "coordenador" as const,
      name: "Floriano Carlos Martins Pires Jr.",
      title: "Professor",
      institution: "UFRJ",
      email: "floriano@poli.ufrj.br",
      active: true,
      membershipSource: "matriz_xlsm",
      sourceDocument: "Atividades-Grupos.xlsm",
    },
  ],
  assignedSections: [
    {
      groupId: 1,
      activityId: 101,
      planCode: "I.1",
      planSortOrder: 1,
      activityTitle: "Contexto Macroeconômico",
      planningSummary: "Análise do contexto macroeconômico nacional e internacional.",
      portalDeliverable: "Relatório setorial",
      status: "em andamento",
      startAt: Date.now(),
      dueAt: Date.now() + 30 * 86400000,
      sectionId: 1,
      sectionCode: "I.1",
      sectionTitle: "Contexto Macroeconômico",
      officialDescription: "Análise macroeconômica.",
      sortOrder: 1,
    },
  ],
  memberCount: 1,
  activeMemberCount: 1,
};

const mutateSpreadsheetMock = vi.fn().mockResolvedValue({
  success: true,
  groupsCount: 11,
  totalMembersCount: 33,
  addedMembersCount: 1,
  updatedMembersCount: 32,
  allocationsUpdated: 5,
  governance: {
    geral: ["Floriano Carlos Martins Pires Jr."],
    administrativa: ["Luiz Felipe Assis", "Denise Cunha"],
    tecnica: ["Floriano Carlos Martins Pires Jr."],
  },
  groups: [],
});

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
      },
      administration: {
        status: { invalidate: vi.fn() },
      },
    }),
    team: {
      hierarchy: {
        useQuery: () => ({
          data: [mockGroup],
          isLoading: false,
        }),
      },
      create: {
        useMutation: () => ({
          mutateAsync: vi.fn(),
          isPending: false,
        }),
      },
      update: {
        useMutation: () => ({
          mutateAsync: vi.fn(),
          isPending: false,
        }),
      },
      importSpreadsheetMatrix: {
        useMutation: () => ({
          mutateAsync: mutateSpreadsheetMock,
          isPending: false,
        }),
      },
    },
    administration: {
      status: {
        useQuery: () => ({
          data: {
            isAdmin: false,
            isGeneralCoordinator: true,
            canManageTeam: true,
            isCoordinator: true,
            users: [],
          },
          isLoading: false,
        }),
      },
    },
  },
}));

describe("TeamPage — Carga de Revisão da Planilha e Gestão pelo Prof. Floriano", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renderiza o botão 'Carregar revisão da planilha' para o perfil de Coordenação Geral", () => {
    render(<TeamPage />);
    const buttons = screen.getAllByRole("button", { name: /carregar revisão da planilha/i });
    expect(buttons.length).toBeGreaterThan(0);
    expect(screen.getByText("Incluir integrante")).toBeInTheDocument();
  });

  it("abre o diálogo de carga da planilha ao clicar no botão e exibe a pré-visualização", async () => {
    render(<TeamPage />);
    const button = screen.getAllByRole("button", { name: /carregar revisão da planilha/i })[0];
    fireEvent.click(button);

    expect(screen.getByText("Carregar Revisão da Planilha (Atividades e Grupos)")).toBeInTheDocument();
    expect(screen.getByText("Pré-visualização da Estrutura Identificada")).toBeInTheDocument();
    expect(screen.getByText("Grupos Detectados")).toBeInTheDocument();
  });

  it("executa a mutação ao confirmar a aplicação da revisão da planilha", async () => {
    render(<TeamPage />);
    const openBtn = screen.getAllByRole("button", { name: /carregar revisão da planilha/i })[0];
    fireEvent.click(openBtn);

    const confirmBtn = screen.getByText("Confirmar e Aplicar Revisão");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mutateSpreadsheetMock).toHaveBeenCalledTimes(1);
    });
  });
});
