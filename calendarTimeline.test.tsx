// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

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
  return { activity, updateSchedule, updateMilestones, updateAllocations, capture, savePdf, jsPDF };
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
      list: { useQuery: () => ({ data: [fixtures.activity], isLoading: false }) },
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

describe("cronograma de itens", () => {
  it("exibe marco sem início, abre o diálogo de definição de período e exporta a visualização", async () => {
    const linkClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    render(<CalendarPage />);
    expect(screen.getByText("Execução por item")).toBeInTheDocument();
    expect(screen.getAllByText("A01").length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/M1:.*ago.*set/i)).toBeInTheDocument();
    expect(screen.getByText("1 entregável")).toBeInTheDocument();
    expect(screen.getByText(/início a definir/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Imagem/i }));
    await waitFor(() => expect(fixtures.capture).toHaveBeenCalled());
    expect(linkClick).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /PDF/i }));
    await waitFor(() => expect(fixtures.savePdf).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /^período$/i }));
    expect(screen.getByRole("heading", { name: /definição de período/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Data inicial")).toHaveValue("");
    expect(screen.getByLabelText("Data de término")).toHaveValue("2026-08-25");
    expect(screen.getByRole("link", { name: /abrir ficha/i })).toHaveAttribute(
      "href",
      "/atividades?ficha=101"
    );

    linkClick.mockRestore();
  });
});
