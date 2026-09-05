// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  isAdmin: true,
  libraryItems: [] as Array<Record<string, unknown>>,
  settings: {
    id: 1,
    name: "Diagnósticos e Políticas Públicas — Indústria Naval",
    projectStartAt: Date.UTC(2026, 7, 1),
    projectEndAt: Date.UTC(2027, 1, 1),
    timezone: "America/Sao_Paulo",
    whatsappEnabled: false,
    whatsappTemplateName: "estudo_bndes_alerta_atividade",
    whatsappLanguageCode: "pt_BR",
    scheduleCronTaskUid: null,
  },
}));

const mocks = vi.hoisted(() => ({
  libraryList: vi.fn(),
  addLink: vi.fn().mockResolvedValue([]),
  upload: vi.fn().mockResolvedValue([]),
  updateWhatsApp: vi.fn().mockResolvedValue({}),
  configureSchedule: vi.fn().mockResolvedValue({}),
  processAlertsNow: vi.fn().mockResolvedValue({
    deadlineAlerts: 0,
    markedDelayed: 0,
    queueProcessed: 0,
  }),
  setUserRole: vi.fn().mockResolvedValue([]),
  updateTomeAssignment: vi.fn().mockResolvedValue({}),
  refetchAdmin: vi.fn().mockResolvedValue({}),
  refetchGovernance: vi.fn().mockResolvedValue({}),
  invalidateLibrary: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      library: { list: { invalidate: mocks.invalidateLibrary } },
    }),
    dashboard: {
      sections: {
        useQuery: () => ({
          data: [
            { id: 1, code: "5.1", title: "Comércio internacional" },
            { id: 9, code: "5.9", title: "Financiamento" },
          ],
        }),
      },
    },
    library: {
      list: {
        useQuery: (...args: unknown[]) => mocks.libraryList(...args),
      },
      addLink: {
        useMutation: () => ({ mutateAsync: mocks.addLink, isPending: false }),
      },
      upload: {
        useMutation: () => ({ mutateAsync: mocks.upload, isPending: false }),
      },
    },
    administration: {
      status: {
        useQuery: () => ({
          data: {
            isAdmin: state.isAdmin,
            whatsappConfigured: false,
            settings: state.settings,
            users: [],
            notificationLogs: [],
          },
          isLoading: false,
          refetch: mocks.refetchAdmin,
        }),
      },
      updateWhatsApp: {
        useMutation: () => ({
          mutateAsync: mocks.updateWhatsApp,
          isPending: false,
        }),
      },
      configureSchedule: {
        useMutation: () => ({
          mutateAsync: mocks.configureSchedule,
          isPending: false,
        }),
      },
      processAlertsNow: {
        useMutation: () => ({
          mutateAsync: mocks.processAlertsNow,
          isPending: false,
        }),
      },
      setUserRole: {
        useMutation: () => ({ mutateAsync: mocks.setUserRole }),
      },
    },
    governance: {
      overview: {
        useQuery: () => ({
          data: {
            p0Approval: null,
            activeMembers: [],
            tomeAssignments: [
              { tome: "Apresentação", coordinatorId: null, coordinatorName: null, substituteId: null, substituteName: null, assignedAt: null, history: [] },
            ],
          },
          isLoading: false,
          refetch: mocks.refetchGovernance,
        }),
      },
      updateTomeAssignment: {
        useMutation: () => ({ mutateAsync: mocks.updateTomeAssignment, isPending: false }),
      },
    },
  },
}));

import AdministrationPage from "./Administration";
import LibraryPage from "./Library";

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
});

beforeEach(() => {
  state.isAdmin = true;
  state.libraryItems = [
    {
      id: 1,
      title: "Política industrial naval",
      description: "Documento de referência para análise setorial.",
      theme: "política industrial",
      itemType: "link",
      externalUrl: "https://example.com/referencia",
      storageUrl: null,
      fileSize: null,
      sectionCode: "5.9",
      createdAt: Date.UTC(2026, 7, 1),
    },
  ];
  mocks.libraryList.mockImplementation(() => ({
    data: state.libraryItems,
    isLoading: false,
  }));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("interface da biblioteca", () => {
  it("renderiza o acervo, aplica a busca e abre a ação de nova referência", async () => {
    render(<LibraryPage />);
    expect(screen.getByText("Biblioteca de referências")).toBeInTheDocument();
    expect(screen.getByText("Política industrial naval")).toBeInTheDocument();

    fireEvent.change(
      screen.getByPlaceholderText("Buscar título, descrição ou tema"),
      { target: { value: "financiamento" } }
    );
    expect(mocks.libraryList).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: "financiamento" })
    );

    fireEvent.click(screen.getByRole("button", { name: /nova referência/i }));
    expect(await screen.findByText("Adicionar referência")).toBeInTheDocument();
    expect(screen.getByText(/PDF, Word, planilhas/i)).toBeInTheDocument();
  });

  it("mostra o estado vazio quando não há referências", () => {
    state.libraryItems = [];
    render(<LibraryPage />);
    expect(screen.getByText("Nenhuma referência cadastrada")).toBeInTheDocument();
  });
});

describe("interface da administração do WhatsApp", () => {
  it("renderiza o estado da integração, salva o modelo e processa alertas", async () => {
    render(<AdministrationPage />);
    expect(screen.getByText("Administração da plataforma")).toBeInTheDocument();
    expect(screen.getByText("Credenciais pendentes")).toBeInTheDocument();
    expect(screen.getByText("Ativar após publicação")).toBeInTheDocument();
    expect(screen.getByText("Coordenação e substituição por tomo")).toBeInTheDocument();
    expect(screen.getByText("Apresentação")).toBeInTheDocument();

    expect(
      screen.getByDisplayValue("estudo_bndes_alerta_atividade")
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /salvar integração/i }));
    await waitFor(() =>
      expect(mocks.updateWhatsApp).toHaveBeenCalledWith(
        expect.objectContaining({
          whatsappTemplateName: "estudo_bndes_alerta_atividade",
          whatsappLanguageCode: "pt_BR",
        })
      )
    );

    fireEvent.click(screen.getByRole("button", { name: /processar agora/i }));
    await waitFor(() => expect(mocks.processAlertsNow).toHaveBeenCalledTimes(1));
  });

  it("mostra o bloqueio e os destinos permitidos ao colaborador", () => {
    state.isAdmin = false;
    render(<AdministrationPage />);
    expect(screen.getByText("Área do administrador")).toBeInTheDocument();
    expect(screen.getByText("Biblioteca")).toBeInTheDocument();
    expect(screen.getByText("Produção")).toBeInTheDocument();
  });
});
