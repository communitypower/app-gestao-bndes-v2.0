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
            months: [
              {
                monthIndex: 0,
                monthNum: 1,
                label: "ago",
                monthLabelFull: "agosto de 2026",
                start: Date.UTC(2026, 7, 1),
                end: Date.UTC(2026, 7, 31),
                deliverables: [],
                count: 0,
              },
              {
                monthIndex: 1,
                monthNum: 2,
                label: "set",
                monthLabelFull: "setembro de 2026",
                start: Date.UTC(2026, 8, 1),
                end: Date.UTC(2026, 8, 30),
                deliverables: [
                  {
                    id: 21,
                    planCode: "II.1",
                    sectionCode: "II.1",
                    title: "Construção Naval Mundial",
                    responsibleName: "Floriano Carlos Martins Pires Jr.",
                    status: "em andamento",
                    progress: 35,
                    dueAt: Date.UTC(2026, 8, 25),
                    tome: "Tomo II",
                  },
                ],
                count: 1,
              },
            ],
            byTome: [
              {
                tome: "Tomo II",
                title: "Tomo II — Indústria Naval Brasileira e Internacional",
                chapterCount: 9,
                parentCount: 9,
                stepCount: 73,
                progress: 35,
                concluded: 0,
                delayed: 0,
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
                responsibleName: "Floriano Carlos Martins Pires Jr.",
                tome: "Tomo II",
                status: "em andamento",
                progress: 35,
                total: 1,
                subitemCount: 8,
                concluded: 0,
                delayed: 0,
                activeMonths: [true, true, false, false, false, false],
                startAt: Date.UTC(2026, 7, 1),
                dueAt: Date.UTC(2026, 8, 25),
                steps: [
                  {
                    id: 101,
                    parentActivityId: 21,
                    detailCode: "II.1.1",
                    title: "Capacidade instalada dos estaleiros líderes",
                    responsibleName: "Floriano Carlos Martins Pires Jr.",
                    responsibleRole: "coordenador",
                    groupName: "G10",
                    status: "em andamento",
                    progress: 40,
                    startAt: Date.UTC(2026, 7, 1),
                    dueAt: Date.UTC(2026, 8, 25),
                    allocations: [],
                  },
                ],
              },
            ],
            teamHierarchy: [
              {
                id: 10,
                name: "G10 — Construção Naval Mundial e Análise Econômica",
                institution: "UFRJ / COPPE",
                active: true,
                coordinator: {
                  id: 1,
                  name: "Floriano Carlos Martins Pires Jr.",
                  title: "Professor Titular",
                  institution: "UFRJ",
                  email: "floriano@ufrj.br",
                },
                members: [
                  {
                    id: 1,
                    name: "Floriano Carlos Martins Pires Jr.",
                    title: "Professor Titular",
                    institution: "UFRJ",
                    email: "floriano@ufrj.br",
                    active: true,
                    groupRole: "coordenador",
                    appRole: "coordenador",
                    totalAllocatedHours: 80,
                    assignedActivitiesCount: 2,
                    assignedActivities: [
                      {
                        id: 21,
                        code: "II.1",
                        title: "Construção Naval Mundial",
                        sectionCode: "II.1",
                        tome: "Tomo II",
                        isParent: true,
                        roleInActivity: "coordenação",
                        allocatedHours: 40,
                        responsibility: "Coordenação geral do capítulo",
                        status: "em andamento",
                        progress: 35,
                        startAt: Date.UTC(2026, 7, 1),
                        dueAt: Date.UTC(2026, 8, 25),
                      },
                    ],
                  },
                ],
                memberCount: 1,
                activeMemberCount: 1,
                totalHours: 80,
                totalActivities: 2,
              },
            ],
            upcoming: [],
            teamCount: 16,
            libraryCount: 328,
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

describe("painel de visão geral reformulado e integrado com visões por atividades e recursos", () => {
  it("exibe a visão por atividades com encadeamento hierárquico Tomo -> Capítulo e links clicáveis", () => {
    render(<HomePage />);
    expect(screen.getByText("Visão geral do projeto")).toBeInTheDocument();
    expect(
      screen.getByText(/5 tomos, 30 capítulos e 253 seções de trabalho/)
    ).toBeInTheDocument();
    expect(screen.getByText("Visão por Atividades (Editorial)")).toBeInTheDocument();
    expect(screen.getByText("Visão por Recursos / Equipe")).toBeInTheDocument();

    // Valida exibição do Tomo e do Capítulo
    expect(screen.getByText("Construção Naval Mundial")).toBeInTheDocument();
    expect(screen.getByText("Tomo II — Indústria Naval Brasileira e Internacional")).toBeInTheDocument();

    // Confirma que os capítulos possuem link clicável para abrir a ficha de acompanhamento
    const chapterLinks = screen.getAllByRole("link");
    expect(chapterLinks.length).toBeGreaterThan(0);
    expect(chapterLinks.some(link => link.getAttribute("href") === "/atividades?ficha=21")).toBe(true);

    // Confirma que não há bloco redundante de "Próximas entregas"
    expect(screen.queryByText("Próximas entregas")).not.toBeInTheDocument();
  });

  it("permite alternar para a visão por recursos exibindo o encadeamento Grupo -> Integrante -> Atividades", () => {
    render(<HomePage />);
    const resourcesButton = screen.getByRole("button", { name: /Visão por Recursos \/ Equipe/i });
    fireEvent.click(resourcesButton);

    // Verifica presença do grupo
    expect(screen.getByText("G10 · CN mundial")).toBeInTheDocument();
    expect(screen.getByText("Floriano Carlos Martins Pires Jr.")).toBeInTheDocument();
    expect(screen.getByText("Coordenador(a)")).toBeInTheDocument();
    expect(screen.getByText("80h alocadas")).toBeInTheDocument();
  });
});
