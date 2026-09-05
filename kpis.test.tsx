// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/ActivityAccessGate", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/EditorialUI", () => ({
  PageHeader: ({ title, description }: { title: string; description: string }) => <><h1>{title}</h1><p>{description}</p></>,
  PageLoading: () => <div>Carregando</div>,
  SectionMark: ({ code }: { code: string }) => <span>{code}</span>,
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null,
  Cell: () => null,
  LabelList: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    dashboard: {
      documentKpis: {
        useQuery: () => ({
          isLoading: false,
          error: null,
          data: {
            totalDocuments: 281,
            chapters: 30,
            sections: 251,
            concluded: 4,
            inProgress: 277,
            priorityInterfaceBlockers: 5,
            updatedAt: "2026-08-30T00:00:00.000Z",
            stages: [
              { key: "planejada", label: "Planejada", stage: "Preparação", chapters: 12, sections: 200, total: 212 },
              { key: "aprovada para documentação final", label: "Aprovada para documentação final", stage: "Conclusão", chapters: 1, sections: 3, total: 4 },
            ],
          },
        }),
      },
    },
  },
}));

import KpisPage from "./Kpis";

afterEach(() => cleanup());

describe("dashboard de KPIs documentais", () => {
  it("exibe as contagens e as fases do workflow documental", () => {
    render(<KpisPage />);
    expect(screen.getByRole("heading", { name: "Indicadores do fluxo documental" })).toBeInTheDocument();
    expect(screen.getByText("Documentos acompanhados")).toBeInTheDocument();
    expect(screen.getByText("281")).toBeInTheDocument();
    expect(screen.getByText("Interfaces prioritárias")).toBeInTheDocument();
    expect(screen.getAllByText("5").length).toBeGreaterThan(0);
    expect(screen.getByText("Planejada")).toBeInTheDocument();
    expect(screen.getByText("Aprovada para documentação final")).toBeInTheDocument();
    expect(screen.getByText("Capítulos e seções em cada etapa")).toBeInTheDocument();
  });
});
