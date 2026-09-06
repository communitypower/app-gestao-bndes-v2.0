import { describe, expect, it } from "vitest";
import { assistantRouter } from "./routers/assistant";

describe("assistantRouter — Assistente de IA do Estudo BNDES", () => {
  const mockAdminCtx = {
    user: {
      id: 1,
      openId: "local_admin",
      name: "Administrador do Estudo",
      email: "admin@estudo.ufrj.br",
      role: "admin",
      appRole: "administrador",
    },
    req: {} as any,
    res: {} as any,
  };

  const caller = assistantRouter.createCaller(mockAdminCtx as any);

  it("retorna métricas oficiais da base de conhecimento do estudo", async () => {
    const metrics = await caller.getKnowledgeMetrics();
    expect(metrics.totalSections).toBeGreaterThanOrEqual(14);
    expect(metrics.totalActivities).toBeGreaterThanOrEqual(250);
    expect(metrics.totalGroups).toBeGreaterThanOrEqual(6);
    expect(metrics.totalMembers).toBeGreaterThanOrEqual(20);
    expect(typeof metrics.hasLlmKey).toBe("boolean");
  });

  it("fornece prompts sugeridos organizados por escopo e categoria", async () => {
    const prompts = await caller.getSuggestedPrompts();
    expect(prompts.length).toBeGreaterThanOrEqual(5);
    expect(prompts.some(p => p.scope === "structure")).toBe(true);
    expect(prompts.some(p => p.scope === "groups")).toBe(true);
    expect(prompts.some(p => p.scope === "library")).toBe(true);
  });

  it("realiza busca rápida no acervo de conhecimento", async () => {
    const results = await caller.searchKnowledge({ query: "FMM", limit: 5 });
    expect(results).toHaveProperty("sections");
    expect(results).toHaveProperty("activities");
    expect(results).toHaveProperty("library");
  });

  it("responde com grounding contextual para consulta sobre um Tomo específico", async () => {
    const response = await caller.ask({
      message: "O que aborda o Tomo I.1 e quais os seus objetivos?",
      scope: "structure",
      history: [],
    });

    expect(response.content).toContain("Tomo I.1");
    expect(response.content.toLowerCase()).toContain("indústria naval");
    expect(response.mode).toBeDefined();
  });

  it("responde com informações do grupo quando consultado por Grupo", async () => {
    const response = await caller.ask({
      message: "Quem coordena e quais integrantes fazem parte do Grupo 2?",
      scope: "groups",
      history: [],
    });

    expect(response.content).toContain("Grupo 2");
    expect(response.content).toContain("Integrantes");
  });

  it("responde sobre temas transversais como FMM", async () => {
    const response = await caller.ask({
      message: "Como funciona o Fundo da Marinha Mercante FMM no estudo?",
      scope: "library",
      history: [],
    });

    expect(response.content).toContain("Fundo da Marinha Mercante");
    expect(response.content).toContain("Tomo III.5");
  });

  it("responde detalhadamente sobre as atividades e capítulos atribuídos a Cassiano Marins de Souza", async () => {
    const response = await caller.ask({
      message: "Quais são as atividades atribuídas a Cassiano?",
      scope: "groups",
      history: [],
    });

    expect(response.content).toContain("Cassiano Marins de Souza");
    expect(response.content).toContain("G10");
    expect(response.content).toContain("Tomo II.1");
    expect(response.content).toContain("Tomo II.2");
    expect(response.content).toContain("Tomo III.3");
    expect(response.content).toContain("Atividades Analíticas Atribuídas");
  });

  it("responde sobre os integrantes gerais do estudo e os 11 grupos temáticos", async () => {
    const response = await caller.ask({
      message: "Quem são os integrantes do estudo e como a equipe está estruturada?",
      scope: "groups",
      history: [],
    });

    expect(response.content).toContain("Quadro de Integrantes e Grupos de Pesquisa");
    expect(response.content).toContain("Floriano Carlos Martins Pires Jr.");
    expect(response.content).toContain("G1 — Sistematização");
    expect(response.content).toContain("G10 — Construção Naval Mundial e Análise Econômica");
  });

  it("responde sobre outros coordenadores como Floriano Pires e Carlos Rocha", async () => {
    const respFloriano = await caller.ask({
      message: "Quais capítulos e responsabilidades são do Floriano Pires?",
      scope: "groups",
      history: [],
    });
    expect(respFloriano.content).toContain("Floriano Carlos Martins Pires Jr.");
    expect(respFloriano.content).toContain("Coordenador Geral");

    const respRocha = await caller.ask({
      message: "Quais atividades e grupos estão atribuídos a Carlos Rocha?",
      scope: "groups",
      history: [],
    });
    expect(respRocha.content).toContain("Carlos Frederico Leão Rocha");
    expect(respRocha.content).toContain("G2");
  });
});

