// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const fixtures = vi.hoisted(() => {
  const updateSchedule = vi.fn();
  const updateMilestones = vi.fn();
  const updateAllocations = vi.fn();
  const capture = vi.fn().mockResolvedValue({
    toDataURL: () => "data:image/png;base64,cronograma",
    width: 120,
    height: 60,
  });
  const savePdf = vi.fn();
  const addImage = vi.fn();
  const jsPDF = vi.fn().mockImplementation(() => ({ addImage, save: savePdf }));
  const activity = {
    id: 101,
    planCode: "A01",
    sectionCode: "I.1",
    title: "Introdução, objetivos e escopo do Relatório 1",
    description: "Nota operacional.",
    planningSummary: "Estrutura e escopo do relatório para publicação no Portal Naval.",
    planningResponsible: "M2",
    planningSupport: "M1; M3",
    portalDeliverable: "Página de introdução e escopo.",
    dependencies: "Definição de estrutura editorial.",
    startAt: null,
    dueAt: Date.UTC(2026, 7, 25, 12),
    parentActivityId: null,
    status: "pendente" as const,
    progress: 0,
    groupName: "Núcleo",
    responsibleName: "Floriano Carlos Martins Pires Jr.",
    canManageAllocations: true,
    milestones: [],
    allocations: [],
    eligibleParticipants: [],
  };
  let activitiesData: any[] = [activity];
  return { activity, activitiesData, updateSchedule, updateMilestones, updateAllocations, capture, savePdf, jsPDF };
});

vi.mock("html2canvas", () => ({ default: fixtures.capture }));
vi.mock("jspdf", () => ({ jsPDF: fixtures.jsPDF }));

vi.mock("@/components/ActivityAccessGate", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      activities: { list: { invalidate: vi.fn() }, detail: { invalidate: vi.fn() } },
      dashboard: { overview: { invalidate: vi.fn() } },
    }),
    activities: {
      list: { useQuery: () => ({ data: fixtures.activitiesData, isLoading: false }) },
      detail: { useQuery: () => ({ data: fixtures.activity, isLoading: false }) },
      updateSchedule: {
        useMutation: () => ({ mutate: fixtures.updateSchedule, mutateAsync: fixtures.updateSchedule, isPending: false }),
      },
      updateMilestones: {
        useMutation: () => ({ mutateAsync: fixtures.updateMilestones, isPending: false }),
      },
      updateAllocations: {
        useMutation: () => ({ mutateAsync: fixtures.updateAllocations, isPending: false }),
      },
    },
    dashboard: {
      overview: {
        useQuery: () => ({
          data: {
            settings: {
              projectStartAt: Date.UTC(2026, 7, 21, 3),
              projectEndAt: Date.UTC(2027, 1, 21, 2, 59, 59),
            },
          },
          isLoading: false,
        }),
      },
    },
  },
}));

import CalendarPage from "./Calendar";

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
});

describe("cronograma de itens", () => {
  it("exibe visão compacta por padrão, abre diálogo de entregáveis do mês, expande itens e abre definição de período", async () => {
    const linkClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    render(<CalendarPage />);
    expect(screen.getByText("Execução por item")).toBeInTheDocument();
    expect(screen.getByLabelText(/M1:.*ago.*set/i)).toBeInTheDocument();
    expect(screen.getByText("1 entregável")).toBeInTheDocument();

    // 1. Testa clique no mês para abrir diálogo de entregáveis planejados do mês
    fireEvent.click(screen.getByLabelText(/M1:.*ago.*set/i));
    expect(screen.getByRole("heading", { name: /Entregáveis Planejados/i })).toBeInTheDocument();
    expect(screen.getByText("Introdução, objetivos e escopo do Relatório 1")).toBeInTheDocument();

    // Fecha o modal de entregáveis do mês
    fireEvent.click(screen.getByRole("button", { name: /Fechar/i }));

    // 2. Testa botão "Expandir Tudo" para revelar os sub-itens compactados
    fireEvent.click(screen.getByRole("button", { name: /Expandir Tudo/i }));
    expect(screen.getAllByText("A01").length).toBeGreaterThan(0);
    expect(screen.getByText(/início a definir/i)).toBeInTheDocument();

    // 3. Testa exportações
    fireEvent.click(screen.getByRole("button", { name: /Imagem/i }));
    await waitFor(() => expect(fixtures.capture).toHaveBeenCalled());
    expect(linkClick).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /PDF/i }));
    await waitFor(() => expect(fixtures.savePdf).toHaveBeenCalled());

    // 4. Testa abertura da definição de período
    fireEvent.click(screen.getByRole("button", { name: /^período$/i }));
    expect(screen.getByRole("heading", { name: /definição de período/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Data inicial")).toHaveValue("");
    expect(screen.getByLabelText("Data de término")).toHaveValue("2026-08-25");
    expect(screen.getByRole("link", { name: /abrir ficha/i })).toHaveAttribute(
      "href",
      "/atividades?ficha=101"
    );

    // Fecha o modal de definição de período
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    linkClick.mockRestore();
  });

  it("organiza hierarquia com nível de tomos, capítulos nos níveis superiores e seções filhas no nível da atividade, sem repetir o título do capítulo", async () => {
    // Cenário com capítulo I.1 (título) e duas seções filhas (I.1.1 e I.1.2) dentro da faixa do projeto
    fixtures.activitiesData = [
      {
        id: 2,
        planCode: "I.1",
        detailCode: null,
        sectionCode: "I.1",
        title: "Introdução",
        description: "Capítulo de introdução.",
        startAt: null,
        dueAt: Date.UTC(2026, 7, 25, 12),
        parentActivityId: null,
        status: "pendente" as const,
        progress: 0,
        groupName: "G1",
        responsibleName: "Prof. Carlos Rocha",
        canManageAllocations: true,
        milestones: [],
        allocations: [],
        eligibleParticipants: [],
      },
      {
        id: 31,
        planCode: null,
        detailCode: "I.1.1",
        sectionCode: "I.1",
        title: "Objetivos",
        description: "Objetivos específicos da seção.",
        startAt: Date.UTC(2026, 7, 22, 12),
        dueAt: Date.UTC(2026, 7, 26, 12),
        parentActivityId: 2,
        status: "concluído" as const,
        progress: 100,
        groupName: "G1",
        responsibleName: "Prof. Carlos Rocha",
        canManageAllocations: true,
        milestones: [],
        allocations: [],
        eligibleParticipants: [],
      },
      {
        id: 32,
        planCode: null,
        detailCode: "I.1.2",
        sectionCode: "I.1",
        title: "Escopo setorial, temporal e geográfico",
        description: "Delimitação do escopo.",
        startAt: Date.UTC(2026, 7, 23, 12),
        dueAt: Date.UTC(2026, 7, 29, 12),
        parentActivityId: 2,
        status: "em andamento" as const,
        progress: 50,
        groupName: "G1",
        responsibleName: "Prof. Carlos Rocha",
        canManageAllocations: true,
        milestones: [],
        allocations: [],
        eligibleParticipants: [],
      },
    ];

    render(<CalendarPage />);

    // 1. Nível do Tomo está presente com título e badge
    expect(screen.getAllByText("Tomo I").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Economia Marítima, Mercados e Demanda para a Indústria Naval").length
    ).toBeGreaterThan(0);

    // 2. Nível do Capítulo está presente
    expect(screen.getAllByText(/Capítulo I\.1/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Introdução").length).toBeGreaterThan(0);

    // 3. Expandir tudo para inspecionar as linhas da timeline
    fireEvent.click(screen.getByRole("button", { name: /Expandir Tudo/i }));

    // 4. As seções filhas estão presentes como linhas de atividade
    expect(screen.getAllByText("I.1.1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Objetivos").length).toBeGreaterThan(0);
    expect(screen.getAllByText("I.1.2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Escopo setorial, temporal e geográfico").length).toBeGreaterThan(0);

    // 5. Título não é uma atividade: "Introdução" aparece no cabeçalho do capítulo, NÃO como link de ficha de atividade
    const activityLinks = screen.getAllByRole("link");
    const activityLinkTitles = activityLinks.map(l => l.textContent);
    expect(activityLinkTitles.some(t => t?.includes("Objetivos"))).toBe(true);
    expect(activityLinkTitles.some(t => t?.includes("Escopo setorial, temporal e geográfico"))).toBe(true);
    // O título "Introdução" não é link de atividade dentro da lista
    expect(activityLinkTitles.some(t => t === "Introdução" || t?.startsWith("Introdução"))).toBe(false);
  });
});
