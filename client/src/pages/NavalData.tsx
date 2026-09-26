import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { PageHeader, PageLoading } from "@/components/EditorialUI";
import { NavalResourcesExplorer, NavalToolsExplorer } from "@/components/NavalMcpExplorer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  NAVAL_DOCUMENTS,
  NAVAL_SHIPYARDS,
  NAVAL_SOURCE_FILTERS,
  type NavalCrossReferenceEvidence,
  type NavalEvidenceChunk,
  type NavalSourceFilter,
} from "@shared/navalMcp";
import { Anchor, BookMarked, Copy, Download, Factory, FileText, RefreshCw, Scale, Search, Settings2, Ship } from "lucide-react";
import { toast } from "sonner";

const selectClass = "h-9 w-full rounded-md border bg-background px-2 text-sm";

function copyText(text: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success("Copiado."))
    .catch(() => toast.error("Não foi possível copiar."));
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function Note({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "warning" }) {
  return (
    <p
      className={`rounded-md border px-3 py-2 text-xs ${
        tone === "warning" ? "border-amber-500/40 bg-amber-500/5 text-amber-800 dark:text-amber-300" : "text-muted-foreground"
      }`}
    >
      {children}
    </p>
  );
}

const STANCE_LABEL: Record<NavalCrossReferenceEvidence["stance"], string> = {
  supports: "corrobora",
  contradicts: "contradiz",
  qualifies: "qualifica",
};

function EvidenceCard({ chunk }: { chunk: NavalEvidenceChunk | NavalCrossReferenceEvidence }) {
  const citation = `(${chunk.abbrev}${chunk.page.startsWith("p.") ? `, ${chunk.page}` : ""})`;
  return (
    <article className="space-y-2 rounded-md border p-3">
      <header className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-foreground">{chunk.source}</span>
        <span className="text-muted-foreground">
          {chunk.abbrev} · {chunk.page}
        </span>
        <Badge variant="outline" className="font-mono">
          {(chunk.similarity * 100).toFixed(0)}%
        </Badge>
        {"stance" in chunk ? <Badge variant="secondary">{STANCE_LABEL[chunk.stance]}</Badge> : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto h-7 px-2 text-xs"
          onClick={() => copyText(`"${chunk.excerpt}" ${citation}`)}
        >
          <Copy className="mr-1 h-3 w-3" />
          Copiar com citação
        </Button>
      </header>
      <p className="whitespace-pre-line text-sm leading-relaxed">{chunk.excerpt}</p>
    </article>
  );
}

// ─── Busca no corpus ─────────────────────────────────────────────────────────

function CorpusSearchPanel() {
  const [query, setQuery] = useState("");
  const [filterSource, setFilterSource] = useState<NavalSourceFilter>("all");
  const [topK, setTopK] = useState(5);
  const [minSimilarity, setMinSimilarity] = useState(0.7);
  const search = trpc.naval.searchCorpus.useMutation({ onError: error => toast.error(error.message) });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (query.trim().length < 3) {
      toast.error("Digite ao menos 3 caracteres.");
      return;
    }
    search.mutate({ query, filter_source: filterSource, top_k: topK, min_similarity: minSimilarity });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Pergunta ou tema" htmlFor="corpus-query">
          <Input
            id="corpus-query"
            placeholder="Ex.: gap de homens-hora entre estaleiros brasileiros e coreanos"
            value={query}
            maxLength={512}
            onChange={event => setQuery(event.target.value)}
          />
        </Field>
        <div className="grid gap-3 md:grid-cols-4">
          <Field label="Fonte" htmlFor="corpus-source">
            <select
              id="corpus-source"
              className={selectClass}
              value={filterSource}
              onChange={event => setFilterSource(event.target.value as NavalSourceFilter)}
            >
              {NAVAL_SOURCE_FILTERS.map(filter => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nº de trechos" htmlFor="corpus-topk">
            <Input
              id="corpus-topk"
              type="number"
              min={1}
              max={20}
              value={topK}
              onChange={event => setTopK(Math.min(20, Math.max(1, Number(event.target.value) || 1)))}
            />
          </Field>
          <Field label={`Similaridade mínima: ${minSimilarity.toFixed(2)}`} htmlFor="corpus-sim">
            <input
              id="corpus-sim"
              type="range"
              min={0.5}
              max={0.95}
              step={0.05}
              className="w-full"
              value={minSimilarity}
              onChange={event => setMinSimilarity(Number(event.target.value))}
            />
          </Field>
          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={search.isPending}>
              <Search className="mr-2 h-4 w-4" />
              {search.isPending ? "Buscando…" : "Buscar"}
            </Button>
          </div>
        </div>
      </form>

      {search.data ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {search.data.metadata.totalFound} trecho(s) encontrados · filtro: {search.data.metadata.filterApplied}
          </p>
          {search.data.metadata.note ? <Note tone="warning">{search.data.metadata.note}</Note> : null}
          {search.data.results.map((chunk, index) => (
            <EvidenceCard key={index} chunk={chunk} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ─── Perfil de estaleiro ─────────────────────────────────────────────────────

function formatNumber(value: number | null, suffix = "") {
  return value === null || value === undefined ? "—" : `${value.toLocaleString("pt-BR")}${suffix}`;
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

const LEVEL_TONE: Record<string, string> = {
  adequado: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  intermediario: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  critico: "bg-red-500/10 text-red-700 dark:text-red-300",
};

const LEVEL_LABEL: Record<string, string> = {
  adequado: "adequado",
  intermediario: "intermediário",
  critico: "crítico",
};

function Level({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
      <span>{label}</span>
      <span className={`rounded px-2 py-0.5 text-xs font-medium ${LEVEL_TONE[value] ?? "bg-muted text-muted-foreground"}`}>
        {LEVEL_LABEL[value] ?? value}
      </span>
    </div>
  );
}

function ShipyardPanel() {
  const [sigla, setSigla] = useState<string>(NAVAL_SHIPYARDS[0]);
  const [includeProjects, setIncludeProjects] = useState(true);
  const [includeBenchmarks, setIncludeBenchmarks] = useState(true);
  const profileQuery = trpc.naval.shipyardProfile.useQuery(
    { sigla, include_projects: includeProjects, include_benchmarks: includeBenchmarks },
    { staleTime: 5 * 60_000 }
  );
  const profile = profileQuery.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <Field label="Estaleiro" htmlFor="shipyard-sigla">
          <select
            id="shipyard-sigla"
            className={`${selectClass} min-w-48`}
            value={sigla}
            onChange={event => setSigla(event.target.value)}
          >
            {NAVAL_SHIPYARDS.map(item => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={includeProjects} onCheckedChange={setIncludeProjects} /> Projetos
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={includeBenchmarks} onCheckedChange={setIncludeBenchmarks} /> Benchmarks
        </label>
      </div>

      {profileQuery.isLoading ? <PageLoading /> : null}
      {profileQuery.error ? <p className="text-sm text-destructive">{profileQuery.error.message}</p> : null}

      {profile && !profile.found ? <Note tone="warning">{profile.analyticalNote}</Note> : null}

      {profile?.found ? (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold">
              {profile.name} <span className="font-mono text-sm text-muted-foreground">({profile.sigla})</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              {[profile.location, profile.status].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Aço processado" value={formatNumber(profile.capacity.steelTonPerYear, " t/ano")} />
            <Stat label="Diques secos" value={formatNumber(profile.capacity.dryDockCount)} />
            <Stat label="Maior dique" value={formatNumber(profile.capacity.dryDockMaxLengthM, " m")} />
            <Stat label="Área coberta" value={formatNumber(profile.capacity.coveredAreaM2, " m²")} />
            <Stat label="Força de trabalho (pico)" value={formatNumber(profile.workforce.peak)} />
            <Stat label="Força de trabalho (atual)" value={formatNumber(profile.workforce.current)} />
            <Stat label="Retenção" value={profile.workforce.retentionRate ?? "—"} />
            <Stat label="Promef entregue" value={profile.promef.completionRate ?? "—"} />
          </div>

          <section className="space-y-2">
            <h3 className="text-sm font-semibold">Hierarquia de déficits de competitividade</h3>
            <div className="grid gap-2 md:grid-cols-3">
              <Level label="Planejamento / Gestão / Engenharia" value={profile.competitiveness.management} />
              <Level label="Processos integrados" value={profile.competitiveness.processes} />
              <Level label="Equipamentos" value={profile.competitiveness.equipment} />
            </div>
            <p className="text-sm">{profile.competitiveness.summary}</p>
          </section>

          <Note>{profile.analyticalNote}</Note>

          {profile.promef.notes || profile.decarbonization.readiness || profile.decarbonization.notes ? (
            <div className="grid gap-3 md:grid-cols-2">
              {profile.promef.notes ? (
                <div className="rounded-md border p-3 text-sm">
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Promef</p>
                  {profile.promef.notes}
                </div>
              ) : null}
              {profile.decarbonization.readiness || profile.decarbonization.notes ? (
                <div className="rounded-md border p-3 text-sm">
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Descarbonização</p>
                  {[profile.decarbonization.readiness, profile.decarbonization.notes].filter(Boolean).join(" — ")}
                </div>
              ) : null}
            </div>
          ) : null}

          {profile.projects.length ? (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Projetos</h3>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Projeto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Unid.</TableHead>
                      <TableHead>Programa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profile.projects.map((project, index) => (
                      <TableRow key={index}>
                        <TableCell>{project.name ?? "—"}</TableCell>
                        <TableCell>{project.vesselType ?? "—"}</TableCell>
                        <TableCell>{project.client ?? "—"}</TableCell>
                        <TableCell>{project.period}</TableCell>
                        <TableCell>{project.units ?? "—"}</TableCell>
                        <TableCell>{project.program ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          ) : null}

          {profile.benchmarks.length ? (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Benchmarks internacionais</h3>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>País</TableHead>
                      <TableHead>Estaleiro</TableHead>
                      <TableHead>Métrica</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Ano</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profile.benchmarks.map((benchmark, index) => (
                      <TableRow key={index}>
                        <TableCell>{benchmark.country}</TableCell>
                        <TableCell>{benchmark.shipyardName ?? "—"}</TableCell>
                        <TableCell>{benchmark.metric}</TableCell>
                        <TableCell>
                          {benchmark.value ?? "—"} {benchmark.unit ?? ""}
                        </TableCell>
                        <TableCell>{benchmark.year ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          ) : null}

          {profile.sources.length ? (
            <section className="space-y-1">
              <h3 className="text-sm font-semibold">Fontes</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {profile.sources.map(source => (
                  <li key={source}>{source}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ─── Verificação de afirmação ────────────────────────────────────────────────

const VERDICT: Record<string, { label: string; className: string }> = {
  well_supported: { label: "Bem fundamentada", className: "bg-emerald-600 text-white" },
  partially_supported: { label: "Parcialmente fundamentada", className: "bg-amber-500 text-white" },
  contradicted: { label: "Contradita pelo corpus", className: "bg-red-600 text-white" },
  inconclusive: { label: "Inconclusiva", className: "bg-muted text-foreground" },
};

function CrossReferencePanel() {
  const [claim, setClaim] = useState("");
  const [stance, setStance] = useState<"both" | "support" | "contradict">("both");
  const check = trpc.naval.crossReference.useMutation({ onError: error => toast.error(error.message) });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (claim.trim().length < 10) {
      toast.error("A afirmação precisa ter ao menos 10 caracteres.");
      return;
    }
    check.mutate({ claim, stance });
  };

  const verdict = check.data ? VERDICT[check.data.verdict] ?? VERDICT.inconclusive : null;

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Afirmação a verificar" htmlFor="claim-text">
          <Textarea
            id="claim-text"
            rows={3}
            maxLength={1024}
            placeholder="Ex.: O principal gargalo dos estaleiros brasileiros é a gestão da produção, não os equipamentos."
            value={claim}
            onChange={event => setClaim(event.target.value)}
          />
        </Field>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Buscar evidências que" htmlFor="claim-stance">
            <select
              id="claim-stance"
              className={`${selectClass} min-w-48`}
              value={stance}
              onChange={event => setStance(event.target.value as typeof stance)}
            >
              <option value="both">corroboram e contradizem</option>
              <option value="support">corroboram</option>
              <option value="contradict">contradizem</option>
            </select>
          </Field>
          <Button type="submit" disabled={check.isPending}>
            <Scale className="mr-2 h-4 w-4" />
            {check.isPending ? "Verificando…" : "Verificar"}
          </Button>
        </div>
      </form>

      {check.data && verdict ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded px-2.5 py-1 text-sm font-semibold ${verdict.className}`}>{verdict.label}</span>
            <p className="text-sm text-muted-foreground">{check.data.verdictRationale}</p>
          </div>
          {check.data.supporting.length ? (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Evidências a favor ({check.data.supporting.length})</h3>
              {check.data.supporting.map((chunk, index) => (
                <EvidenceCard key={index} chunk={chunk} />
              ))}
            </section>
          ) : null}
          {check.data.contradicting.length ? (
            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Evidências contrárias ou que qualificam ({check.data.contradicting.length})</h3>
              {check.data.contradicting.map((chunk, index) => (
                <EvidenceCard key={index} chunk={chunk} />
              ))}
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ─── Citação ABNT ────────────────────────────────────────────────────────────

function CitationPanel() {
  const [docId, setDocId] = useState<string>(NAVAL_DOCUMENTS[0].id);
  const [locator, setLocator] = useState("");
  const citation = trpc.naval.generateCitation.useMutation({ onError: error => toast.error(error.message) });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    citation.mutate({ doc_id: docId, page_or_section: locator.trim() || undefined });
  };

  const formats = citation.data
    ? [
        { label: "No corpo do texto", value: citation.data.inline },
        { label: "Nota de rodapé", value: citation.data.footnote },
        { label: "Lista de referências", value: citation.data.referenceList },
      ].filter(item => item.value)
    : [];

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
        <Field label="Documento" htmlFor="citation-doc">
          <select
            id="citation-doc"
            className={`${selectClass} min-w-64`}
            value={docId}
            onChange={event => setDocId(event.target.value)}
          >
            {NAVAL_DOCUMENTS.map(doc => (
              <option key={doc.id} value={doc.id}>
                {doc.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Página ou seção (opcional)" htmlFor="citation-locator">
          <Input
            id="citation-locator"
            placeholder="47 ou 3.2 Competitividade"
            value={locator}
            maxLength={128}
            onChange={event => setLocator(event.target.value)}
          />
        </Field>
        <Button type="submit" disabled={citation.isPending}>
          <BookMarked className="mr-2 h-4 w-4" />
          {citation.isPending ? "Gerando…" : "Gerar citação"}
        </Button>
      </form>

      {citation.data?.warning ? <Note tone="warning">{citation.data.warning}</Note> : null}
      {formats.map(item => (
        <div key={item.label} className="flex items-start gap-3 rounded-md border p-3">
          <div className="flex-1">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-sm">{item.value}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => copyText(item.value)} title="Copiar">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

// ─── Documentos do corpus ────────────────────────────────────────────────────

const DOCUMENT_LABELS: Record<string, string> = Object.fromEntries(NAVAL_DOCUMENTS.map(doc => [doc.id, doc.label]));
const MAX_MATCHES = 50;

function DocumentsPanel() {
  const documentsQuery = trpc.naval.listDocuments.useQuery();
  const [docId, setDocId] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const documents = documentsQuery.data ?? [];
  const activeDocId = docId ?? documents[0]?.docId ?? null;
  const documentQuery = trpc.naval.readDocument.useQuery(
    { docId: activeDocId ?? "" },
    { enabled: Boolean(activeDocId), staleTime: 30 * 60_000 }
  );
  const text = documentQuery.data?.found ? documentQuery.data.text : "";

  const matches = useMemo(() => {
    const needle = term.trim().toLowerCase();
    if (needle.length < 3 || !text) return null;
    const found: string[] = [];
    let total = 0;
    for (const paragraph of text.split(/\n\s*\n/)) {
      if (paragraph.toLowerCase().includes(needle)) {
        total += 1;
        if (found.length < MAX_MATCHES) found.push(paragraph.trim());
      }
    }
    return { found, total };
  }, [term, text]);

  const download = () => {
    if (!activeDocId || !text) return;
    const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeDocId}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (documentsQuery.isLoading) return <PageLoading />;
  if (documentsQuery.error) return <p className="text-sm text-destructive">{documentsQuery.error.message}</p>;
  if (!documents.length) {
    return <Note>O servidor não disponibiliza documentos do corpus para leitura.</Note>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Documento" htmlFor="doc-select">
          <select
            id="doc-select"
            className={`${selectClass} min-w-64`}
            value={activeDocId ?? ""}
            onChange={event => {
              setDocId(event.target.value);
              setTerm("");
            }}
          >
            {documents.map(doc => (
              <option key={doc.docId} value={doc.docId}>
                {DOCUMENT_LABELS[doc.docId] ?? doc.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="min-w-64 flex-1">
          <Field label="Procurar no documento" htmlFor="doc-term">
            <Input
              id="doc-term"
              placeholder="Mínimo de 3 caracteres"
              value={term}
              onChange={event => setTerm(event.target.value)}
            />
          </Field>
        </div>
        <Button type="button" variant="outline" onClick={download} disabled={!text}>
          <Download className="mr-2 h-4 w-4" />
          Baixar .md
        </Button>
      </div>

      {documentQuery.isLoading ? <PageLoading /> : null}
      {documentQuery.error ? <p className="text-sm text-destructive">{documentQuery.error.message}</p> : null}
      {documentQuery.data && !documentQuery.data.found ? (
        <Note tone="warning">{documentQuery.data.text || "Documento não encontrado no servidor."}</Note>
      ) : null}

      {matches ? (
        <section className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {matches.total} parágrafo(s) com “{term.trim()}”
            {matches.total > MAX_MATCHES ? ` — exibindo os ${MAX_MATCHES} primeiros` : ""}
          </p>
          {matches.found.map((paragraph, index) => (
            <p key={index} className="whitespace-pre-line rounded-md border p-3 text-sm leading-relaxed">
              {paragraph}
            </p>
          ))}
        </section>
      ) : text ? (
        <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-xs leading-relaxed">
          {text}
        </pre>
      ) : null}
    </div>
  );
}

// ─── Página ──────────────────────────────────────────────────────────────────

export default function NavalDataPage() {
  const utils = trpc.useUtils();
  const statusQuery = trpc.naval.status.useQuery();
  const status = statusQuery.data;

  const statusBadge = useMemo(() => {
    if (!status) return null;
    if (!status.configured) return <Badge variant="outline">Não configurado</Badge>;
    if (!status.connected) return <Badge variant="destructive">Desconectado</Badge>;
    return <Badge>Conectado · {status.server?.name ?? status.transport}</Badge>;
  }, [status]);

  return (
    <div>
      <PageHeader
        eyebrow="Integração MCP"
        title="Dados Navais"
        description="Busca no corpus do estudo, perfis de estaleiros, verificação de afirmações e citações ABNT — via servidor bndes-naval-mcp."
        action={
          <div className="flex items-center gap-2">
            {statusBadge}
            <Button
              variant="outline"
              size="sm"
              onClick={() => utils.naval.invalidate()}
              title="Atualizar conexão e dados"
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
        <Tabs defaultValue="corpus">
          <TabsList className="flex-wrap">
            <TabsTrigger value="corpus">
              <Search className="mr-2 h-4 w-4" />
              Busca no corpus
            </TabsTrigger>
            <TabsTrigger value="shipyards">
              <Factory className="mr-2 h-4 w-4" />
              Estaleiros
            </TabsTrigger>
            <TabsTrigger value="verify">
              <Scale className="mr-2 h-4 w-4" />
              Verificar afirmação
            </TabsTrigger>
            <TabsTrigger value="citation">
              <BookMarked className="mr-2 h-4 w-4" />
              Citação ABNT
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="mr-2 h-4 w-4" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="advanced">
              <Settings2 className="mr-2 h-4 w-4" />
              Avançado
            </TabsTrigger>
          </TabsList>
          <TabsContent value="corpus" className="mt-4">
            <CorpusSearchPanel />
          </TabsContent>
          <TabsContent value="shipyards" className="mt-4">
            <ShipyardPanel />
          </TabsContent>
          <TabsContent value="verify" className="mt-4">
            <CrossReferencePanel />
          </TabsContent>
          <TabsContent value="citation" className="mt-4">
            <CitationPanel />
          </TabsContent>
          <TabsContent value="documents" className="mt-4">
            <DocumentsPanel />
          </TabsContent>
          <TabsContent value="advanced" className="mt-4 space-y-8">
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Anchor className="h-4 w-4" /> Todas as ferramentas do servidor
              </h2>
              <NavalToolsExplorer />
            </section>
            <section className="space-y-3">
              <h2 className="text-sm font-semibold">Recursos</h2>
              <NavalResourcesExplorer />
            </section>
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  );
}
