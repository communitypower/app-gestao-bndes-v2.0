import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { ENV } from "./_core/env";
import { resetNavalMcpClient } from "./_core/mcpClient";
import { navalRouter } from "./routers/naval";

const TOKEN = "token-de-teste";

function buildMcpServer() {
  const server = new McpServer({ name: "bndes-naval-mcp-teste", version: "0.0.1" });
  server.registerTool(
    "listar_estaleiros",
    {
      description: "Lista estaleiros por UF",
      inputSchema: { uf: z.string() },
    },
    async ({ uf }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify([{ nome: `Estaleiro ${uf}`, uf, empregos: 1200 }]),
        },
      ],
    })
  );
  // Mesmo formato do bndes-naval-mcp real: JSON indentado em um bloco de texto.
  const json = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] });
  server.registerTool(
    "search_corpus",
    { inputSchema: { query: z.string(), top_k: z.number(), min_similarity: z.number(), filter_source: z.string() } },
    async ({ query, top_k, filter_source }) =>
      json({
        query,
        results: [
          {
            source: "Benchmarking COPPE",
            abbrev: "COPPE/UFRJ, 2007",
            year: 2007,
            page: "p. 47",
            similarity: 0.83,
            excerpt: `trecho sobre ${query}`,
            isAnonymized: false,
          },
        ],
        metadata: { totalFound: 1, filterApplied: filter_source, minSimilarity: 0.7, note: `top_k=${top_k}` },
      })
  );
  server.registerTool(
    "get_shipyard_profile",
    { inputSchema: { sigla: z.string(), include_benchmarks: z.boolean(), include_projects: z.boolean() } },
    async ({ sigla, include_projects }) =>
      json({ found: true, sigla, name: "Estaleiro Atlântico Sul", projects: include_projects ? [{ name: "Suezmax" }] : [] })
  );
  server.registerTool("generate_citation", { inputSchema: { doc_id: z.string() } }, async () => ({
    isError: true,
    content: [{ type: "text", text: "catálogo indisponível" }],
  }));
  server.registerTool("ferramenta_restrita", { description: "Não liberada" }, async () => ({
    content: [{ type: "text", text: "segredo" }],
  }));
  server.registerResource(
    "frota",
    "naval://frota",
    { description: "Resumo da frota", mimeType: "application/json" },
    async uri => ({ contents: [{ uri: uri.href, text: JSON.stringify({ total: 42 }) }] })
  );
  return server;
}

const ctx = {
  user: { id: 1, openId: "local_admin", name: "Admin", role: "admin", appRole: "administrador" },
  req: {} as any,
  res: {} as any,
};
const caller = navalRouter.createCaller(ctx as any);

let httpServer: Server;
const originalEnv = { ...ENV };

beforeAll(async () => {
  httpServer = createServer(async (req, res) => {
    if (req.headers.authorization !== `Bearer ${TOKEN}`) {
      res.writeHead(401).end();
      return;
    }
    // Modo stateless: um servidor/transport por requisição.
    const server = buildMcpServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res);
  });
  await new Promise<void>(resolve => httpServer.listen(0, "127.0.0.1", resolve));
  const { port } = httpServer.address() as AddressInfo;

  ENV.bndesNavalMcpUrl = `http://127.0.0.1:${port}/mcp`;
  ENV.bndesNavalMcpToken = TOKEN;
  ENV.bndesNavalMcpAllowedTools = "listar_estaleiros,search_corpus,get_shipyard_profile,generate_citation";
  resetNavalMcpClient();
});

afterAll(async () => {
  resetNavalMcpClient();
  Object.assign(ENV, originalEnv);
  await new Promise(resolve => httpServer.close(resolve));
});

describe("naval router — integração com bndes-naval-mcp", () => {
  it("informa status conectado via Streamable HTTP", async () => {
    const status = await caller.status();
    expect(status.connected).toBe(true);
    expect(status.transport).toBe("streamable-http");
    expect(status.server?.name).toBe("bndes-naval-mcp-teste");
  });

  it("lista apenas as ferramentas liberadas", async () => {
    const tools = await caller.listTools();
    expect(tools.map(tool => tool.name)).toEqual([
      "listar_estaleiros",
      "search_corpus",
      "get_shipyard_profile",
      "generate_citation",
    ]);
    expect(tools[0].inputSchema).toMatchObject({ properties: { uf: { type: "string" } } });
  });

  it("executa ferramenta e converte texto JSON em dados", async () => {
    const result = await caller.callTool({ name: "listar_estaleiros", args: { uf: "RJ" } });
    expect(result.isError).toBe(false);
    expect(result.data).toEqual([{ nome: "Estaleiro RJ", uf: "RJ", empregos: 1200 }]);
  });

  it("bloqueia ferramenta fora da lista liberada", async () => {
    await expect(caller.callTool({ name: "ferramenta_restrita", args: {} })).rejects.toThrow(/não liberada/);
  });

  it("searchCorpus aplica padrões e devolve o resultado tipado", async () => {
    const result = await caller.searchCorpus({ query: "curva de aprendizado" });
    expect(result.results[0]).toMatchObject({ abbrev: "COPPE/UFRJ, 2007", page: "p. 47" });
    expect(result.metadata).toMatchObject({ filterApplied: "all", note: "top_k=5" });
  });

  it("shipyardProfile repassa as opções ao servidor", async () => {
    const profile = await caller.shipyardProfile({ sigla: "EAS", include_projects: false });
    expect(profile).toMatchObject({ found: true, sigla: "EAS", projects: [] });
  });

  it("valida a entrada antes de chamar o servidor", async () => {
    await expect(caller.searchCorpus({ query: "ab" })).rejects.toThrow();
    await expect(caller.crossReference({ claim: "curta" })).rejects.toThrow();
  });

  it("converte erro da ferramenta em erro tRPC com a mensagem do servidor", async () => {
    await expect(caller.generateCitation({ doc_id: "coppe-v1" })).rejects.toThrow(/catálogo indisponível/);
  });

  it("lista e lê recursos", async () => {
    const resources = await caller.listResources();
    expect(resources.map(resource => resource.uri)).toContain("naval://frota");
    const contents = await caller.readResource({ uri: "naval://frota" });
    expect(contents[0].data).toEqual({ total: 42 });
  });

  it("retorna erro claro quando a URL não está configurada", async () => {
    const url = ENV.bndesNavalMcpUrl;
    ENV.bndesNavalMcpUrl = "";
    try {
      expect((await caller.status()).configured).toBe(false);
      await expect(caller.listTools()).rejects.toThrow(/BNDES_NAVAL_MCP_URL/);
    } finally {
      ENV.bndesNavalMcpUrl = url;
    }
  });
});
