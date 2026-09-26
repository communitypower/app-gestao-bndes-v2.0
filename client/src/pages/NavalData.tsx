import { useEffect, useMemo, useState } from "react";
import { PageHeader, PageLoading } from "@/components/EditorialUI";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Database, FileText, Play, RefreshCw, Ship } from "lucide-react";
import { toast } from "sonner";

type JsonSchemaProperty = {
  type?: string | string[];
  description?: string;
  enum?: unknown[];
  default?: unknown;
  title?: string;
};

type ToolSchema = {
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
};

function primaryType(prop: JsonSchemaProperty) {
  const type = Array.isArray(prop.type) ? prop.type.find(t => t !== "null") : prop.type;
  return type ?? "string";
}

function isSimpleField(prop: JsonSchemaProperty) {
  return ["string", "number", "integer", "boolean"].includes(primaryType(prop));
}

function coerceValue(prop: JsonSchemaProperty, raw: string): unknown {
  const type = primaryType(prop);
  if (type === "number" || type === "integer") return raw === "" ? undefined : Number(raw);
  if (type === "boolean") return raw === "" ? undefined : raw === "true";
  return raw === "" ? undefined : raw;
}

/** Procura a primeira lista de objetos para exibir como tabela. */
function findRows(data: unknown): Record<string, unknown>[] | null {
  const isRows = (value: unknown): value is Record<string, unknown>[] =>
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(item => item !== null && typeof item === "object" && !Array.isArray(item));
  if (isRows(data)) return data;
  if (data && typeof data === "object") {
    for (const value of Object.values(data)) {
      if (isRows(value)) return value;
    }
  }
  return null;
}

function formatCell(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function DataView({ data, text }: { data: unknown; text?: string[] }) {
  const rows = findRows(data);
  if (rows) {
    const columns = Array.from(new Set(rows.flatMap(row => Object.keys(row))));
    return (
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(column => (
                <TableHead key={column}>{column}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={index}>
                {columns.map(column => (
                  <TableCell key={column} className="max-w-xs truncate text-xs">
                    {formatCell(row[column])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="border-t px-3 py-2 text-xs text-muted-foreground">{rows.length} registro(s)</p>
      </div>
    );
  }
  const body = data !== null && data !== undefined ? JSON.stringify(data, null, 2) : (text ?? []).join("\n\n");
  return (
    <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-xs">
      {body || "Sem conteúdo."}
    </pre>
  );
}

function ToolsPanel() {
  const toolsQuery = trpc.naval.listTools.useQuery();
  const callTool = trpc.naval.callTool.useMutation({
    onError: error => toast.error(error.message),
  });
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [rawJson, setRawJson] = useState("{}");

  const tools = toolsQuery.data ?? [];
  const selected = tools.find(tool => tool.name === selectedName) ?? null;
  const schema = (selected?.inputSchema ?? {}) as ToolSchema;
  const properties = schema.properties ?? {};
  const required = new Set(schema.required ?? []);
  const usesForm = Object.values(properties).every(isSimpleField);

  useEffect(() => {
    if (!selectedName && tools.length) setSelectedName(tools[0].name);
  }, [tools, selectedName]);

  useEffect(() => {
    const initial: Record<string, string> = {};
    for (const [key, prop] of Object.entries(properties)) {
      initial[key] = prop.default !== undefined ? String(prop.default) : "";
    }
    setFields(initial);
    setRawJson("{}");
    callTool.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedName]);

  const execute = () => {
    if (!selected) return;
    let args: Record<string, unknown> = {};
    if (usesForm) {
      for (const [key, prop] of Object.entries(properties)) {
        const value = coerceValue(prop, fields[key] ?? "");
        if (value !== undefined) args[key] = value;
      }
      const missing = [...required].filter(key => args[key] === undefined);
      if (missing.length) {
        toast.error(`Preencha: ${missing.join(", ")}`);
        return;
      }
    } else {
      try {
        args = JSON.parse(rawJson || "{}");
      } catch {
        toast.error("Parâmetros em JSON inválidos.");
        return;
      }
    }
    callTool.mutate({ name: selected.name, args });
  };

  if (toolsQuery.isLoading) return <PageLoading />;
  if (toolsQuery.error) {
    return <p className="text-sm text-destructive">{toolsQuery.error.message}</p>;
  }
  if (!tools.length) {
    return <p className="text-sm text-muted-foreground">O servidor não expõe ferramentas.</p>;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      <nav className="space-y-1">
        {tools.map(tool => (
          <button
            key={tool.name}
            type="button"
            onClick={() => setSelectedName(tool.name)}
            className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
              tool.name === selectedName ? "border-primary bg-primary/5" : "hover:bg-muted/60"
            }`}
          >
            <span className="block font-medium">{tool.title || tool.name}</span>
            <span className="block font-mono text-[11px] text-muted-foreground">{tool.name}</span>
          </button>
        ))}
      </nav>

      {selected ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">{selected.title || selected.name}</h2>
            {selected.description ? (
              <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{selected.description}</p>
            ) : null}
          </div>

          {usesForm ? (
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(properties).map(([key, prop]) => {
                const type = primaryType(prop);
                const options = prop.enum ?? (type === "boolean" ? [true, false] : null);
                return (
                  <div key={key} className="space-y-1">
                    <Label htmlFor={`naval-${key}`}>
                      {prop.title || key}
                      {required.has(key) ? <span className="text-destructive"> *</span> : null}
                    </Label>
                    {options ? (
                      <select
                        id={`naval-${key}`}
                        className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                        value={fields[key] ?? ""}
                        onChange={event => setFields(prev => ({ ...prev, [key]: event.target.value }))}
                      >
                        <option value="">—</option>
                        {options.map(option => (
                          <option key={String(option)} value={String(option)}>
                            {String(option)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        id={`naval-${key}`}
                        type={type === "number" || type === "integer" ? "number" : "text"}
                        value={fields[key] ?? ""}
                        onChange={event => setFields(prev => ({ ...prev, [key]: event.target.value }))}
                      />
                    )}
                    {prop.description ? (
                      <p className="text-[11px] text-muted-foreground">{prop.description}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1">
              <Label htmlFor="naval-json">Parâmetros (JSON)</Label>
              <Textarea
                id="naval-json"
                className="font-mono text-xs"
                rows={6}
                value={rawJson}
                onChange={event => setRawJson(event.target.value)}
              />
            </div>
          )}

          <Button onClick={execute} disabled={callTool.isPending}>
            <Play className="mr-2 h-4 w-4" />
            {callTool.isPending ? "Consultando…" : "Consultar"}
          </Button>

          {callTool.data ? (
            <div className="space-y-2">
              {callTool.data.isError ? <Badge variant="destructive">A ferramenta retornou erro</Badge> : null}
              <DataView data={callTool.data.data} text={callTool.data.text} />
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function ResourcesPanel() {
  const resourcesQuery = trpc.naval.listResources.useQuery();
  const [uri, setUri] = useState<string | null>(null);
  const contentQuery = trpc.naval.readResource.useQuery({ uri: uri ?? "" }, { enabled: Boolean(uri) });

  if (resourcesQuery.isLoading) return <PageLoading />;
  if (resourcesQuery.error) {
    return <p className="text-sm text-destructive">{resourcesQuery.error.message}</p>;
  }
  const resources = resourcesQuery.data ?? [];
  if (!resources.length) {
    return <p className="text-sm text-muted-foreground">O servidor não expõe recursos.</p>;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      <nav className="space-y-1">
        {resources.map(resource => (
          <button
            key={resource.uri}
            type="button"
            onClick={() => setUri(resource.uri)}
            className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
              resource.uri === uri ? "border-primary bg-primary/5" : "hover:bg-muted/60"
            }`}
          >
            <span className="block font-medium">{resource.name}</span>
            <span className="block truncate font-mono text-[11px] text-muted-foreground">{resource.uri}</span>
          </button>
        ))}
      </nav>
      <section className="space-y-3">
        {!uri ? <p className="text-sm text-muted-foreground">Selecione um recurso.</p> : null}
        {contentQuery.isLoading && uri ? <PageLoading /> : null}
        {contentQuery.error ? <p className="text-sm text-destructive">{contentQuery.error.message}</p> : null}
        {contentQuery.data?.map(item => (
          <div key={item.uri} className="space-y-1">
            <p className="font-mono text-[11px] text-muted-foreground">
              {item.uri} {item.mimeType ? `· ${item.mimeType}` : ""}
            </p>
            {item.hasBinary ? (
              <p className="text-sm text-muted-foreground">Conteúdo binário (não exibido).</p>
            ) : (
              <DataView data={item.data} text={item.text ? [item.text] : []} />
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

export default function NavalDataPage() {
  const utils = trpc.useUtils();
  const statusQuery = trpc.naval.status.useQuery();
  const status = statusQuery.data;

  const statusBadge = useMemo(() => {
    if (!status) return null;
    if (!status.configured) return <Badge variant="outline">Não configurado</Badge>;
    if (!status.connected) return <Badge variant="destructive">Desconectado</Badge>;
    return <Badge>Conectado · {status.transport}</Badge>;
  }, [status]);

  return (
    <div>
      <PageHeader
        eyebrow="Integração MCP"
        title="Dados Navais"
        description="Consulta às ferramentas e recursos do servidor bndes-naval-mcp."
        action={
          <div className="flex items-center gap-2">
            {statusBadge}
            <Button
              variant="outline"
              size="sm"
              onClick={() => utils.naval.invalidate()}
              title="Atualizar conexão e listas"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {statusQuery.isLoading ? <PageLoading /> : null}

      {status && !status.configured ? (
        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          <Ship className="mb-2 h-5 w-5" />
          Defina a variável de ambiente <code className="font-mono">BNDES_NAVAL_MCP_URL</code> (e, se o servidor
          exigir, <code className="font-mono">BNDES_NAVAL_MCP_TOKEN</code>) no servidor do portal para habilitar esta
          seção.
        </div>
      ) : null}

      {status?.configured && !status.connected ? (
        <p className="rounded-md border border-destructive/40 p-4 text-sm text-destructive">
          Não foi possível conectar ao bndes-naval-mcp: {status.error}
        </p>
      ) : null}

      {status?.connected ? (
        <Tabs defaultValue="tools">
          <TabsList>
            <TabsTrigger value="tools">
              <Database className="mr-2 h-4 w-4" />
              Consultas
            </TabsTrigger>
            <TabsTrigger value="resources">
              <FileText className="mr-2 h-4 w-4" />
              Recursos
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tools" className="mt-4">
            <ToolsPanel />
          </TabsContent>
          <TabsContent value="resources" className="mt-4">
            <ResourcesPanel />
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}
