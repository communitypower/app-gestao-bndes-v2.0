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

describe("ParticipantActionCenter - Expand/Collapse and Filtering", () => {
  afterEach(() => {
    cleanup();
  });

  it("renderiza o painel com título, total de pendências e cartões de ação", () => {
    render(<ParticipantActionCenter onSelectActivity={vi.fn()} />);

    expect(screen.getByText("Minhas Ações no Estudo")).toBeInTheDocument();
    expect(screen.getByText("3 pendentes")).toBeInTheDocument();
    expect(screen.getByText("Construção Naval Mundial")).toBeInTheDocument();
    expect(screen.getByText("Estrutura Portuária Nacional")).toBeInTheDocument();
    expect(screen.getByText("Interface de Combustíveis Marítimos")).toBeInTheDocument();
  });

  it("permite recolher e expandir o painel inteiro de ações", () => {
    render(<ParticipantActionCenter onSelectActivity={vi.fn()} />);

    // Painel começa aberto
    expect(screen.getByText("Todas (3)")).toBeInTheDocument();
    expect(screen.getByText("Construção Naval Mundial")).toBeInTheDocument();

    // Clica para recolher o painel
    const togglePanelBtn = screen.getByRole("button", { name: /Recolher painel/i });
    fireEvent.click(togglePanelBtn);

    // O conteúdo das ações fica oculto e os filtros somem
    expect(screen.queryByText("Todas (3)")).not.toBeInTheDocument();
    expect(screen.queryByText("Construção Naval Mundial")).not.toBeInTheDocument();
    expect(screen.getByText(/Clique para expandir e ver detalhes/i)).toBeInTheDocument();

    // Clica para expandir novamente
    const expandPanelBtn = screen.getByRole("button", { name: /Expandir painel/i });
    fireEvent.click(expandPanelBtn);

    // O conteúdo volta a ser exibido
    expect(screen.getByText("Todas (3)")).toBeInTheDocument();
    expect(screen.getByText("Construção Naval Mundial")).toBeInTheDocument();
  });

  it("permite expandir e recolher individualmente os cartões de ação", () => {
    render(<ParticipantActionCenter onSelectActivity={vi.fn()} />);

    // No estado inicial compacto, detalhes como "Material #101" ou "2 apontamentos pendentes" não aparecem
    expect(screen.queryByText("Material #101")).not.toBeInTheDocument();
    expect(screen.queryByText(/2 apontamentos pendentes/i)).not.toBeInTheDocument();

    // Clica em 'Mais detalhes' no primeiro card
    const moreDetailsButtons = screen.getAllByRole("button", { name: /Mais detalhes/i });
    fireEvent.click(moreDetailsButtons[0]);

    // O card agora exibe os detalhes adicionais
    expect(screen.getByText("Material #101")).toBeInTheDocument();
    expect(screen.getByText(/2 apontamentos pendentes/i)).toBeInTheDocument();

    // O botão muda para 'Menos detalhes'
    const lessDetailsBtn = screen.getByRole("button", { name: /Menos detalhes/i });
    expect(lessDetailsBtn).toBeInTheDocument();

    // Clica em 'Menos detalhes' para recolher o item
    fireEvent.click(lessDetailsBtn);
    expect(screen.queryByText("Material #101")).not.toBeInTheDocument();
  });

  it("permite expandir todos os itens e recolher todos de uma só vez", () => {
    render(<ParticipantActionCenter onSelectActivity={vi.fn()} />);

    const expandAllBtns = screen.getAllByRole("button", { name: /Expandir todos os itens/i });
    expect(expandAllBtns.length).toBeGreaterThan(0);

    // Clica para expandir todos os itens
    fireEvent.click(expandAllBtns[0]);

    // Todos os cards revelam seus detalhes
    expect(screen.getByText("Material #101")).toBeInTheDocument();
    expect(screen.getByText("Interface #55")).toBeInTheDocument();
    expect(screen.getByText(/2 apontamentos pendentes/i)).toBeInTheDocument();

    // O botão do toolbar muda para "Recolher todos os itens"
    const collapseAllBtns = screen.getAllByRole("button", { name: /Recolher todos os itens/i });
    expect(collapseAllBtns.length).toBeGreaterThan(0);

    // Clica para recolher todos os itens
    fireEvent.click(collapseAllBtns[0]);

    // Os detalhes voltam a ficar ocultos
    expect(screen.queryByText("Material #101")).not.toBeInTheDocument();
    expect(screen.queryByText("Interface #55")).not.toBeInTheDocument();
  });

  it("filtra as ações por papel do participante", () => {
    render(<ParticipantActionCenter onSelectActivity={vi.fn()} />);

    // Filtra por Revisor
    const revisorFilterBtn = screen.getByRole("button", { name: /Revisor \(1\)/i });
    fireEvent.click(revisorFilterBtn);

    expect(screen.getByText("Estrutura Portuária Nacional")).toBeInTheDocument();
    expect(screen.queryByText("Construção Naval Mundial")).not.toBeInTheDocument();
    expect(screen.queryByText("Interface de Combustíveis Marítimos")).not.toBeInTheDocument();

    // Volta para Todas
    const todasFilterBtn = screen.getByRole("button", { name: /Todas \(3\)/i });
    fireEvent.click(todasFilterBtn);

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
