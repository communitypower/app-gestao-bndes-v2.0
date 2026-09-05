// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const officialDescription =
  "Descrição oficial da frente com capacidade instalada, tecnologia, competitividade e cenários setoriais.";

vi.mock("@/components/AdminGate", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/ActivityAccessGate", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      governance: { overview: { invalidate: vi.fn().mockResolvedValue(undefined) } },
      dashboard: { overview: { invalidate: vi.fn().mockResolvedValue(undefined) } },
    }),
    dashboard: {
      overview: {
        useQuery: () => ({
          isLoading: false,
          data: {
            settings: {
              projectStartAt: Date.UTC(2026, 7, 1),
              projectEndAt: Date.UTC(2027, 0, 31),
            },
            counts: {
              total: 30,
              pending: 29,
              inProgress: 1,
              concluded: 0,
              delayed: 0,
            },
            hierarchy: {
              sectionCount: 30,
              parentCount: 30,
              stepCount: 253,
              totalCount: 283,
            },
            overallProgress: 1,
            byTome: [
              {
                tome: "Tomo II",
                title: "Tomo II",
                chapterCount: 9,
                parentCount: 9,
                stepCount: 73,
                progress: 35,
                concluded: 0,
                delayed: 1,
                open: 9,
                nextDueAt: Date.UTC(2026, 8, 25),
              },
            ],
            bySection: [
              {
                id: 1,
                code: "II.1",
                title: "Construção Naval Mundial",
                officialDescription,
                primaryActivityId: 21,
                progress: 35,
                total: 1,
                subitemCount: 8,
                concluded: 0,
                delayed: 0,
              },
            ],
            upcoming: [
              {
                id: 21,
                sectionCode: "II.1",
                title: "Construção Naval Mundial",
                officialDescription,
                status: "em andamento" as const,
                responsibleName: "Floriano Carlos Martins Pires Jr.",
                dueAt: Date.UTC(2026, 8, 25),
              },
            ],
            teamCount: 16,
            libraryCount: 0,
            materialCount: 1,
          },
        }),
      },
    },
    governance: {
      overview: {
        useQuery: () => ({
          isLoading: false,
          data: { p0Approval: null, activeMembers: [], tomeAssignments: [] },
        }),
      },
      approveP0: { useMutation: () => ({ isPending: false, mutateAsync: vi.fn().mockResolvedValue(undefined) }) },
    },
    administration: {
      status: { useQuery: () => ({ data: { isAdmin: true }, isLoading: false }) },
    },
    activities: {
      list: {
        useQuery: () => ({ data: [{ id: 21, parentActivityId: null, planCode: "A01", sectionCode: "II.1", title: "Construção Naval Mundial", status: "em andamento", dueAt: Date.UTC(2026, 8, 25) }] }),
      },
    },
    interfaces: {
      list: {
        useQuery: () => ({ data: [], isLoading: false }),
      },
    },
  },
}));

import HomePage from "./Home";

afterEach(() => cleanup());

describe("descrições oficiais no painel", () => {
  it("exibe a descrição no panorama da frente e na próxima entrega", () => {
    render(<HomePage />);
    expect(screen.getByText("Visão geral do projeto")).toBeInTheDocument();
    expect(
      screen.getByText(/5 tomos, 30 capítulos e 253 seções de trabalho/)
    ).toBeInTheDocument();
    expect(screen.getAllByText(officialDescription)).toHaveLength(2);
    expect(screen.getAllByText("Construção Naval Mundial")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /aprovar implementação do p0/i })).toBeInTheDocument();
    expect(screen.getByText("Execução por tomo")).toBeInTheDocument();
    expect(screen.getAllByText("Tomo II").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("link", { name: /Construção Naval Mundial/i }).map(link => link.getAttribute("href"))).toContain("/atividades?ficha=21");
  });

  it("abre a lista do mês e oferece acesso à ficha completa da atividade", () => {
    render(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: /Listar atividades com entrega em set/i }));
    expect(screen.getByText(/Atividades com entrega em set/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Construção Naval Mundial/i })).toHaveAttribute("href", "/atividades?ficha=21");
  });
});
