import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { ENV } from "./env";

/**
 * Cliente do servidor MCP bndes-naval-mcp.
 *
 * Mantém uma única conexão por processo (reaberta automaticamente após falha),
 * tenta Streamable HTTP e, se o servidor não suportar, recorre a SSE.
 */

const CLIENT_INFO = { name: "portal-naval-estudo-bndes", version: "1.0.0" };
const REQUEST_TIMEOUT_MS = 30_000;
const TOOLS_CACHE_TTL_MS = 60_000;

export type NavalMcpTool = {
  name: string;
  title?: string;
  description?: string;
  inputSchema: Record<string, unknown>;
};

export type NavalMcpToolResult = {
  isError: boolean;
  /** Conteúdo estruturado quando o servidor devolve structuredContent ou texto JSON. */
  data: unknown;
  /** Blocos de texto devolvidos pela ferramenta, na ordem recebida. */
  text: string[];
};

let clientPromise: Promise<Client> | null = null;
let transportKind: "streamable-http" | "sse" | null = null;
let toolsCache: { at: number; tools: NavalMcpTool[] } | null = null;

export function isNavalMcpConfigured() {
  return Boolean(ENV.bndesNavalMcpUrl);
}

function requestInit(): RequestInit | undefined {
  return ENV.bndesNavalMcpToken
    ? { headers: { Authorization: `Bearer ${ENV.bndesNavalMcpToken}` } }
    : undefined;
}

async function connect(): Promise<Client> {
  if (!isNavalMcpConfigured()) {
    throw new Error("BNDES_NAVAL_MCP_URL não configurada.");
  }
  const url = new URL(ENV.bndesNavalMcpUrl);

  try {
    const client = new Client(CLIENT_INFO);
    await client.connect(new StreamableHTTPClientTransport(url, { requestInit: requestInit() }));
    transportKind = "streamable-http";
    return client;
  } catch (streamableError) {
    try {
      const client = new Client(CLIENT_INFO);
      await client.connect(new SSEClientTransport(url, { requestInit: requestInit() }));
      transportKind = "sse";
      return client;
    } catch {
      throw streamableError;
    }
  }
}

export async function getNavalMcpClient(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = connect().then(client => {
      client.onclose = () => resetNavalMcpClient();
      return client;
    });
    clientPromise.catch(() => resetNavalMcpClient());
  }
  return clientPromise;
}

export function resetNavalMcpClient() {
  const pending = clientPromise;
  clientPromise = null;
  transportKind = null;
  toolsCache = null;
  pending?.then(client => client.close()).catch(() => undefined);
}

/** Executa uma operação e reconecta uma vez caso a sessão tenha caído. */
async function withClient<T>(operation: (client: Client) => Promise<T>): Promise<T> {
  try {
    return await operation(await getNavalMcpClient());
  } catch (error) {
    // Erros de protocolo (parâmetros inválidos, timeout etc.) não indicam sessão perdida.
    if (error instanceof McpError && error.code !== ErrorCode.ConnectionClosed) throw error;
    resetNavalMcpClient();
    return operation(await getNavalMcpClient());
  }
}

function allowedToolNames(): Set<string> | null {
  const names = ENV.bndesNavalMcpAllowedTools
    .split(",")
    .map(name => name.trim())
    .filter(Boolean);
  return names.length ? new Set(names) : null;
}

export function isNavalMcpToolAllowed(name: string) {
  const allowed = allowedToolNames();
  return !allowed || allowed.has(name);
}

export async function listNavalMcpTools(): Promise<NavalMcpTool[]> {
  if (toolsCache && Date.now() - toolsCache.at < TOOLS_CACHE_TTL_MS) {
    return toolsCache.tools;
  }
  const tools: NavalMcpTool[] = [];
  let cursor: string | undefined;
  do {
    const page = await withClient(client =>
      client.listTools(cursor ? { cursor } : undefined, { timeout: REQUEST_TIMEOUT_MS })
    );
    for (const tool of page.tools) {
      if (!isNavalMcpToolAllowed(tool.name)) continue;
      tools.push({
        name: tool.name,
        title: tool.title ?? tool.annotations?.title,
        description: tool.description,
        inputSchema: tool.inputSchema as Record<string, unknown>,
      });
    }
    cursor = page.nextCursor;
  } while (cursor);

  toolsCache = { at: Date.now(), tools };
  return tools;
}

function tryParseJson(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}

export async function callNavalMcpTool(
  name: string,
  args: Record<string, unknown>
): Promise<NavalMcpToolResult> {
  if (!isNavalMcpToolAllowed(name)) {
    throw new Error(`Ferramenta "${name}" não liberada para o portal.`);
  }
  const result = await withClient(client =>
    client.callTool({ name, arguments: args }, undefined, { timeout: REQUEST_TIMEOUT_MS })
  );

  const content = Array.isArray(result.content) ? result.content : [];
  const text = content
    .filter((block): block is { type: "text"; text: string } => block?.type === "text")
    .map(block => block.text);

  let data: unknown = result.structuredContent;
  if (data === undefined && text.length === 1) {
    data = tryParseJson(text[0]);
  }

  return { isError: Boolean(result.isError), data: data ?? null, text };
}

export async function listNavalMcpResources() {
  const resources: { uri: string; name: string; description?: string; mimeType?: string }[] = [];
  let cursor: string | undefined;
  do {
    const page = await withClient(client =>
      client.listResources(cursor ? { cursor } : undefined, { timeout: REQUEST_TIMEOUT_MS })
    );
    for (const resource of page.resources) {
      resources.push({
        uri: resource.uri,
        name: resource.title ?? resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
      });
    }
    cursor = page.nextCursor;
  } while (cursor);
  return resources;
}

export async function readNavalMcpResource(uri: string) {
  const result = await withClient(client =>
    client.readResource({ uri }, { timeout: REQUEST_TIMEOUT_MS })
  );
  return result.contents.map(item => ({
    uri: item.uri,
    mimeType: item.mimeType,
    text: "text" in item && typeof item.text === "string" ? item.text : null,
    data: "text" in item && typeof item.text === "string" ? tryParseJson(item.text) ?? null : null,
    hasBinary: "blob" in item,
  }));
}

export async function getNavalMcpStatus() {
  if (!isNavalMcpConfigured()) {
    return { configured: false as const, connected: false, transport: null, server: null, error: null };
  }
  try {
    const client = await getNavalMcpClient();
    return {
      configured: true as const,
      connected: true,
      transport: transportKind,
      server: client.getServerVersion() ?? null,
      error: null,
    };
  } catch (error) {
    return {
      configured: true as const,
      connected: false,
      transport: null,
      server: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
