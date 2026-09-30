// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ParticipantAction, ParticipantActionCenter } from "./ParticipantActionCenter";

const mockActions: ParticipantAction[] = [
  {
    id: "act-1",
    activityId: 21,
    materialId: 101,
    sectionCode: "10.1",
    activityTitle: "Construção Naval Mundial",
    dueAt: Date.UTC(2026, 8, 15),
    role: "executor" as const,
    actionType: "ajustes_a_fazer",
    actionTitle: "Implementar Comentários do Revisor",
    actionDescription: "Revisar as tabelas de capacidade produtiva e complementar fontes estatísticas.",
    ctaLabel: "Implementar Ajustes",
    ctaTarget: "revisao",
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
    actionTitle: "Análise Técnica & Registro de Comentários",
    actionDescription: "Realizar parecer técnico sobre a infraestrutura de atracação.",
    ctaLabel: "Realizar Análise Técnica",
    ctaTarget: "revisao",
    pendingCommentCount: 0,
  },
  {
    id: "act-3",
    activityId: 23,
    materialId: null,
    sectionCode: "4.1",
    activityTitle: "Combustíveis Marítimos e Transição",
    dueAt: null,
    role: "coordenador" as const,
    actionType: "sem_revisores",
    actionTitle: "Indicar Revisor Técnico Independente (Prof. Floriano)",
    actionDescription: "O Prof. Floriano deve indicar o revisor técnico independente para esta seção.",
    ctaLabel: "Indicar Revisor",
    ctaTarget: "drawer",
    pendingCommentCount: 0,
  },
];

const mockSummary = {
  total: 3,
  executorCount: 1,
  reviewerCount: 1,
  coordinatorCount: 1,
};

let currentMockActions = [...mockActions];
let currentMockSummary = { ...mockSummary };

vi.mock("@/lib/trpc", () => ({
  trpc: {
    activities: {
      myWorkloadActions: {
        useQuery: () => ({
          data: {
            actions: currentMockActions,
            summary: currentMockSummary,
          },
          isLoading: false,
        }),
      },
    },
  },
}));

describe("ParticipantActionCenter - Direct Display, Filtering and 6-Step Workflow Distribution", () => {
  afterEach(() => {
    cleanup();
    currentMockActions = [...mockActions];
    currentMockSummary = { ...mockSummary };
  });

  it("renderiza o painel com título, total de pendências e as caixas de ação separadas", () => {
    render(<ParticipantActionCenter onSelectActivity={vi.fn()} />);

    expect(screen.getByText("Minhas Ações no Estudo")).toBeInTheDocument();
    expect(screen.getByText("3 pendentes")).toBeInTheDocument();
    expect(screen.getByText("4. Implementação de Ajustes pelo Autor")).toBeInTheDocument();
    expect(screen.getByText("3. Revisão Técnica & Registro de Comentários")).toBeInTheDocument();
    expect(screen.getByText("2. Indicação de Revisores Pendente (Prof. Floriano)")).toBeInTheDocument();
    expect(screen.getByText("Construção Naval Mundial")).toBeInTheDocument();
    expect(screen.getByText("Estrutura Portuária Nacional")).toBeInTheDocument();
    expect(screen.getByText("Combustíveis Marítimos e Transição")).toBeInTheDocument();
  });

  it("exibe as ações distribuídas por blocos mensais cronológicos ao alternar para o modo cronológico", () => {
    render(<ParticipantActionCenter onSelectActivity={vi.fn()} defaultLayout="cronologico" />);

    // Deve exibir o cabeçalho do mês M1 (Setembro 2026) e o bloco sem prazo
    expect(screen.getByText(/Mês 1 — Setembro 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/Fluxo Contínuo \/ Sem Prazo Fixo/i)).toBeInTheDocument();
  });

  it("exibe diretamente os detalhes complementares sem necessidade de cliques de expansão", () => {
    render(<ParticipantActionCenter onSelectActivity={vi.fn()} />);

    // Detalhes como Material #101 e contadores de comentários estão diretamente visíveis
    expect(screen.getByText("Material #101")).toBeInTheDocument();
    expect(screen.getByText(/2 apontamentos pendentes/i)).toBeInTheDocument();
  });

  it("filtra as ações por papel do participante no fluxo", () => {
    render(<ParticipantActionCenter onSelectActivity={vi.fn()} />);

    // Filtra por Revisor Técnico
    const revisorFilterBtn = screen.getByRole("button", { name: /Revisor Técnico/i });
    fireEvent.click(revisorFilterBtn);

    expect(screen.getByText("Estrutura Portuária Nacional")).toBeInTheDocument();
    expect(screen.queryByText("Construção Naval Mundial")).not.toBeInTheDocument();
    expect(screen.queryByText("Combustíveis Marítimos e Transição")).not.toBeInTheDocument();

    // Filtra por Coord. Geral
    const coordFilterBtn = screen.getByRole("button", { name: /Coord\. Geral/i });
    fireEvent.click(coordFilterBtn);

    expect(screen.getByText("Combustíveis Marítimos e Transição")).toBeInTheDocument();
    expect(screen.queryByText("Construção Naval Mundial")).not.toBeInTheDocument();
    expect(screen.queryByText("Estrutura Portuária Nacional")).not.toBeInTheDocument();

    // Volta para Todas
    const todasFilterBtn = screen.getByRole("button", { name: /Todos os Fluxos/i });
    fireEvent.click(todasFilterBtn);

    expect(screen.getByText("Construção Naval Mundial")).toBeInTheDocument();
    expect(screen.getByText("Estrutura Portuária Nacional")).toBeInTheDocument();
    expect(screen.getByText("Combustíveis Marítimos e Transição")).toBeInTheDocument();
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
    expect(screen.queryByText("Combustíveis Marítimos e Transição")).not.toBeInTheDocument();

    // Filtra também ou alterna para Sem Prazo
    // Desmarca M1 clicando novamente
    fireEvent.click(m1Option);
    const semPrazoOption = screen.getByText("Sem Prazo Definido");
    fireEvent.click(semPrazoOption);

    expect(screen.getByText("Combustíveis Marítimos e Transição")).toBeInTheDocument();
    expect(screen.queryByText("Construção Naval Mundial")).not.toBeInTheDocument();
    expect(screen.queryByText("Estrutura Portuária Nacional")).not.toBeInTheDocument();

    // Volta para Todos os Meses
    const todosMesesBtn = screen.getByRole("button", { name: /^Todos os Meses/i });
    fireEvent.click(todosMesesBtn);

    expect(screen.getByText("Construção Naval Mundial")).toBeInTheDocument();
    expect(screen.getByText("Estrutura Portuária Nacional")).toBeInTheDocument();
    expect(screen.getByText("Combustíveis Marítimos e Transição")).toBeInTheDocument();
  });

  it("chama onSelectActivity com upload_revision ao clicar no CTA de ajustes", () => {
    const handleSelect = vi.fn();
    render(<ParticipantActionCenter onSelectActivity={handleSelect} />);

    const editBtn = screen.getByRole("button", { name: /Implementar Ajustes/i });
    fireEvent.click(editBtn);

    expect(handleSelect).toHaveBeenCalledWith(21, "upload_revision");
  });

  it("chama onSelectActivity com upload_minuta ao clicar em Subir Minuta Inicial", () => {
    currentMockActions = [
      {
        id: "act-4",
        activityId: 24,
        materialId: null,
        sectionCode: "5.1",
        activityTitle: "Descarbonização Marítima",
        dueAt: Date.UTC(2026, 8, 25),
        role: "executor" as const,
        actionType: "minuta_pendente",
        actionTitle: "Minuta Técnica Inicial a Elaborar / Subir",
        actionDescription: "Esta atividade está em fase de elaboração.",
        ctaLabel: "Subir Minuta Inicial (R01)",
        ctaTarget: "drawer",
        pendingCommentCount: 0,
      },
    ];
    currentMockSummary = {
      total: 1,
      executorCount: 1,
      reviewerCount: 0,
      coordinatorCount: 0,
    };
    const handleSelect = vi.fn();
    render(<ParticipantActionCenter onSelectActivity={handleSelect} />);

    const uploadMinutaBtn = screen.getByRole("button", { name: /Subir Minuta Inicial/i });
    fireEvent.click(uploadMinutaBtn);

    expect(handleSelect).toHaveBeenCalledWith(24, "upload_minuta");
  });

  it("não chama upload_minuta (não abre Explorer) ao clicar em Submeter Minuta quando o arquivo já foi carregado", () => {
    currentMockActions = [
      {
        id: "act-5",
        activityId: 30,
        materialId: 101,
        sectionCode: "4.2",
        activityTitle: "Financiamento Naval",
        dueAt: Date.UTC(2026, 8, 25),
        role: "executor" as const,
        actionType: "minuta_pendente",
        actionTitle: "Submeter Minuta para Revisão",
        actionDescription: "A minuta inicial já foi carregada no sistema.",
        ctaLabel: "Submeter Minuta",
        ctaTarget: "revisao",
        pendingCommentCount: 0,
      },
    ];
    currentMockSummary = {
      total: 1,
      executorCount: 1,
      reviewerCount: 0,
      coordinatorCount: 0,
    };
    const handleSelect = vi.fn();
    render(<ParticipantActionCenter onSelectActivity={handleSelect} />);

    const submitMinutaBtn = screen.getByRole("button", { name: /Submeter Minuta/i });
    fireEvent.click(submitMinutaBtn);

    // Deve abrir a ficha diretamente sem acionar 'upload_minuta' (que abriria o Explorer)
    expect(handleSelect).toHaveBeenCalledWith(30);
    expect(handleSelect).not.toHaveBeenCalledWith(30, "upload_minuta");
  });
});
