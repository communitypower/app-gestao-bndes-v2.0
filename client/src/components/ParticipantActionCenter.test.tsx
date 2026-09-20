// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ParticipantActionCenter } from "./ParticipantActionCenter";

const mockActions = [
  {
    id: "act-1",
    activityId: 21,
    materialId: 101,
    sectionCode: "10.1",
    activityTitle: "Construção Naval Mundial",
    dueAt: Date.UTC(2026, 8, 15),
    role: "executor" as const,
    actionType: "ajustes_solicitados",
    actionTitle: "Ajustes solicitados pela coordenação",
    actionDescription: "Revisar as tabelas de capacidade produtiva e complementar fontes estatísticas.",
    ctaLabel: "Editar capítulo",
    ctaTarget: "activity",
    pendingCommentCount: 2,
  },
  {
    id: "act-2",
    activityId: 22,
    materialId: null,
    sectionCode: "8.2.3",
    activityTitle: "Estrutura Portuária Nacional",
    dueAt: Date.UTC(2026, 8, 20),
    role: "revisor" as const,
    actionType: "revisao_pendente",
    actionTitle: "Revisão técnica pendente",
    actionDescription: "Realizar parecer técnico sobre a infraestrutura de atracação.",
    ctaLabel: "Revisar capítulo",
    ctaTarget: "activity",
    pendingCommentCount: 0,
  },
  {
    id: "act-3",
    activityId: 23,
    materialId: null,
    sectionCode: "4.1",
    activityTitle: "Interface de Combustíveis Marítimos",
    dueAt: null,
    role: "interfaces" as const,
    actionType: "interface_bloqueante",
    actionTitle: "Alinhamento com frente de transição energética",
    actionDescription: "Definir parâmetros comuns para emissões de gases no transporte aquaviário.",
    ctaLabel: "Acessar interface",
    ctaTarget: "interfaces",
    interfaceId: 55,
    pendingCommentCount: 1,
  },
];

const mockSummary = {
  total: 3,
  executorCount: 1,
  reviewerCount: 1,
  coordinatorCount: 0,
  interfaceCount: 1,
};

vi.mock("@/lib/trpc", () => ({
  trpc: {
    activities: {
      myWorkloadActions: {
        useQuery: () => ({
          data: {
            actions: mockActions,
            summary: mockSummary,
          },
          isLoading: false,
        }),
      },
    },
  },
}));

describe("ParticipantActionCenter - Direct Display, Filtering and Month Distribution", () => {
  afterEach(() => {
    cleanup();
  });

  it("renderiza o painel com título, total de pendências e todos os cartões de ação diretamente visíveis", () => {
    render(<ParticipantActionCenter onSelectActivity={vi.fn()} />);

    expect(screen.getByText("Minhas Ações no Estudo")).toBeInTheDocument();
    expect(screen.getByText("3 pendentes")).toBeInTheDocument();
    expect(screen.getByText("Construção Naval Mundial")).toBeInTheDocument();
    expect(screen.getByText("Estrutura Portuária Nacional")).toBeInTheDocument();
    expect(screen.getByText("Interface de Combustíveis Marítimos")).toBeInTheDocument();
  });

  it("exibe as ações distribuídas por blocos mensais cronológicos", () => {
    render(<ParticipantActionCenter onSelectActivity={vi.fn()} />);

    // Deve exibir o cabeçalho do mês M1 (Setembro 2026) e o bloco sem prazo
    expect(screen.getByText(/Mês 1 — Setembro 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/Fluxo Contínuo \/ Sem Prazo Fixo/i)).toBeInTheDocument();
  });

  it("exibe diretamente os detalhes complementares sem necessidade de cliques de expansão", () => {
    render(<ParticipantActionCenter onSelectActivity={vi.fn()} />);

    // Detalhes como Material #101, Interface #55 e contadores de comentários estão diretamente visíveis
    expect(screen.getByText("Material #101")).toBeInTheDocument();
    expect(screen.getByText("Interface #55")).toBeInTheDocument();
    expect(screen.getByText(/2 apontamentos pendentes/i)).toBeInTheDocument();
    expect(screen.getByText(/1 apontamento pendente/i)).toBeInTheDocument();
  });

  it("filtra as ações por papel do participante", () => {
    render(<ParticipantActionCenter onSelectActivity={vi.fn()} />);

    // Filtra por Revisor
    const revisorFilterBtn = screen.getByRole("button", { name: /Revisão Técnica/i });
    fireEvent.click(revisorFilterBtn);

    expect(screen.getByText("Estrutura Portuária Nacional")).toBeInTheDocument();
    expect(screen.queryByText("Construção Naval Mundial")).not.toBeInTheDocument();
    expect(screen.queryByText("Interface de Combustíveis Marítimos")).not.toBeInTheDocument();

    // Volta para Todas
    const todasFilterBtn = screen.getByRole("button", { name: /Todos os Fluxos/i });
    fireEvent.click(todasFilterBtn);

    expect(screen.getByText("Construção Naval Mundial")).toBeInTheDocument();
    expect(screen.getByText("Estrutura Portuária Nacional")).toBeInTheDocument();
    expect(screen.getByText("Interface de Combustíveis Marítimos")).toBeInTheDocument();
  });

  it("filtra as ações por mês de término do cronograma via lista suspensa", () => {
    render(<ParticipantActionCenter onSelectActivity={vi.fn()} />);

    // Abre o dropdown de seleção de meses
    const monthDropdown = screen.getByRole("button", { name: /Selecionar meses do cronograma/i });
    fireEvent.click(monthDropdown);

    // Filtra por Mês 1 (Setembro de 2026)
    const m1Option = screen.getByText("Setembro de 2026");
    fireEvent.click(m1Option);

    expect(screen.getByText("Construção Naval Mundial")).toBeInTheDocument();
    expect(screen.getByText("Estrutura Portuária Nacional")).toBeInTheDocument();
    expect(screen.queryByText("Interface de Combustíveis Marítimos")).not.toBeInTheDocument();

    // Filtra também ou alterna para Sem Prazo
    // Desmarca M1 clicando novamente
    fireEvent.click(m1Option);
    const semPrazoOption = screen.getByText("Sem Prazo Definido");
    fireEvent.click(semPrazoOption);

    expect(screen.getByText("Interface de Combustíveis Marítimos")).toBeInTheDocument();
    expect(screen.queryByText("Construção Naval Mundial")).not.toBeInTheDocument();
    expect(screen.queryByText("Estrutura Portuária Nacional")).not.toBeInTheDocument();

    // Volta para Todos os Meses
    const todosMesesBtn = screen.getByRole("button", { name: /^Todos os Meses/i });
    fireEvent.click(todosMesesBtn);

    expect(screen.getByText("Construção Naval Mundial")).toBeInTheDocument();
    expect(screen.getByText("Estrutura Portuária Nacional")).toBeInTheDocument();
    expect(screen.getByText("Interface de Combustíveis Marítimos")).toBeInTheDocument();
  });

  it("chama onSelectActivity ao clicar no CTA de uma atividade", () => {
    const handleSelect = vi.fn();
    render(<ParticipantActionCenter onSelectActivity={handleSelect} />);

    const editBtn = screen.getByRole("button", { name: /Editar capítulo/i });
    fireEvent.click(editBtn);

    expect(handleSelect).toHaveBeenCalledWith(21);
  });
});
