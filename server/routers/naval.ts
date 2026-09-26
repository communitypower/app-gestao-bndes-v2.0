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

  listResources: protectedProcedure.query(() => run(() => listNavalMcpResources())),

  readResource: protectedProcedure
    .input(z.object({ uri: z.string().min(1) }))
    .query(({ input }) => run(() => readNavalMcpResource(input.uri))),
});
