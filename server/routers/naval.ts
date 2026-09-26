import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  callNavalMcpTool,
  getNavalMcpStatus,
  isNavalMcpConfigured,
  listNavalMcpResources,
  listNavalMcpTools,
  readNavalMcpResource,
} from "../_core/mcpClient";
import {
  NAVAL_SOURCE_FILTERS,
  type NavalCitationResult,
  type NavalCrossReferenceResult,
  type NavalSearchCorpusResult,
  type NavalShipyardProfile,
} from "@shared/navalMcp";

function ensureConfigured() {
  if (!isNavalMcpConfigured()) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Servidor MCP bndes-naval-mcp não configurado (defina BNDES_NAVAL_MCP_URL).",
    });
  }
}

async function run<T>(operation: () => Promise<T>): Promise<T> {
  ensureConfigured();
  try {
    return await operation();
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: `Falha ao consultar o bndes-naval-mcp: ${error instanceof Error ? error.message : String(error)}`,
      cause: error,
    });
  }
}

/** Executa uma ferramenta do bndes-naval-mcp e devolve o JSON retornado por ela. */
async function callTyped<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const result = await run(() => callNavalMcpTool(name, args));
  if (result.isError || result.data === null) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: `bndes-naval-mcp (${name}): ${result.text.join(" ") || "resposta sem dados"}`,
    });
  }
  return result.data as T;
}

const sourceFilterValues = NAVAL_SOURCE_FILTERS.map(filter => filter.value) as [string, ...string[]];

export const navalRouter = router({
  status: protectedProcedure.query(() => getNavalMcpStatus()),

  listTools: protectedProcedure.query(() => run(() => listNavalMcpTools())),

  callTool: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        args: z.record(z.string(), z.unknown()).default({}),
      })
    )
    .mutation(({ input }) => run(() => callNavalMcpTool(input.name, input.args))),

  searchCorpus: protectedProcedure
    .input(
      z.object({
        query: z.string().trim().min(3).max(512),
        top_k: z.number().int().min(1).max(20).default(5),
        min_similarity: z.number().min(0).max(1).default(0.7),
        filter_source: z.enum(sourceFilterValues).default("all"),
      })
    )
    .mutation(({ input }) => callTyped<NavalSearchCorpusResult>("search_corpus", input)),

  shipyardProfile: protectedProcedure
    .input(
      z.object({
        sigla: z.string().trim().min(2).max(16),
        include_benchmarks: z.boolean().default(true),
        include_projects: z.boolean().default(true),
      })
    )
    .query(({ input }) => callTyped<NavalShipyardProfile>("get_shipyard_profile", input)),

  crossReference: protectedProcedure
    .input(
      z.object({
        claim: z.string().trim().min(10).max(1024),
        stance: z.enum(["support", "contradict", "both"]).default("both"),
        top_k: z.number().int().min(1).max(10).default(6),
      })
    )
    .mutation(({ input }) => callTyped<NavalCrossReferenceResult>("cross_reference", input)),

  generateCitation: protectedProcedure
    .input(
      z.object({
        doc_id: z.string().trim().min(3).max(64),
        page_or_section: z.string().trim().max(128).optional(),
        citation_type: z.enum(["inline", "footnote", "reference_list"]).default("inline"),
      })
    )
    .mutation(({ input }) => callTyped<NavalCitationResult>("generate_citation", input)),

  listResources: protectedProcedure.query(() => run(() => listNavalMcpResources())),

  readResource: protectedProcedure
    .input(z.object({ uri: z.string().min(1) }))
    .query(({ input }) => run(() => readNavalMcpResource(input.uri))),
});
