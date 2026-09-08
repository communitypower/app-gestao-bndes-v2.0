import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Metric, PageHeader, PageLoading, SectionMark, StatusBadge } from "@/components/EditorialUI";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/format";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  FilePenLine,
  Filter,
  GitMerge,
  Layers,
  Search,
  Users,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  const { data, isLoading } = trpc.dashboard.overview.useQuery();
  const { data: governance, isLoading: governanceLoading } = trpc.governance.overview.useQuery();
  const { data: interfaces, isLoading: interfacesLoading } = trpc.interfaces.list.useQuery();

  const [selectedTome, setSelectedTome] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const months = useMemo(() => {
    if (!data?.settings) return [];
    if (data.months && data.months.length > 0) return data.months;

    const start = new Date(data.settings.projectStartAt);
    return Array.from({ length: 6 }, (_, index) => {
      const monthStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1));
      const monthEnd = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index + 1, 0, 23, 59, 59));
      const deliverables = (data.bySection ?? [])
        .filter(s => s.dueAt && s.dueAt >= monthStart.getTime() && s.dueAt <= monthEnd.getTime())
        .map(s => ({
          id: s.primaryActivityId ?? s.id,
          planCode: s.code,
          detailCode: null,
          sectionCode: s.code,
          title: s.title,
          responsibleName: s.responsibleName,
          status: s.status,
          progress: s.progress,
          dueAt: s.dueAt ?? 0,
          tome: s.tome,
        }));

      return {
        monthIndex: index,
        monthNum: index + 1,
        label: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(monthStart).replace(".", ""),
        monthLabelFull: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(monthStart),
        start: monthStart.getTime(),
        end: monthEnd.getTime(),
        deliverables,
        count: deliverables.length,
      };
    });
  }, [data]);

  const blockedInterfaces = useMemo(() => {
    return (interfaces ?? []).filter(item => {
      return item.status !== "resolvida" && item.blockingClass === "prioritária";
    });
  }, [interfaces]);

  const filteredSections = useMemo(() => {
    if (!data?.bySection) return [];
    return data.bySection.filter(section => {
      const matchesTome = selectedTome === "todos" || section.tome === selectedTome;
      const matchesStatus = statusFilter === "todos" || section.status === statusFilter;
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        section.code.toLowerCase().includes(query) ||
        section.title.toLowerCase().includes(query) ||
        (section.responsibleName && section.responsibleName.toLowerCase().includes(query)) ||
        (section.tome && section.tome.toLowerCase().includes(query));
      return matchesTome && matchesStatus && matchesSearch;
    });
  }, [data?.bySection, selectedTome, statusFilter, searchTerm]);

  if (isLoading || governanceLoading || interfacesLoading || !data || !interfaces || !governance) {
    return <PageLoading />;
  }

  const start = new Date(data.settings.projectStartAt);
  const end = new Date(data.settings.projectEndAt);

  return (
    <div className="space-y-6">
      {/* Cabeçalho Executivo */}
      <PageHeader
        eyebrow="Painel executivo de controle"
        title="Visão geral do projeto"
        description={`Controle editorial e cronograma integrado do Estudo (${formatDate(start)} a ${formatDate(end)}). Estrutura consolidada em 5 tomos, ${data.hierarchy.parentCount} capítulos e ${data.hierarchy.stepCount} seções de trabalho — Anexo B do Plano de Trabalho UFRJ.`}
        index="01 — Visão geral"
        action={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 font-mono text-xs font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Pacote P0 {governance.p0Approval ? "validado" : "em implantação"}
            </span>
          </div>
        }
      />

      {/* Métricas Consolidadas de Alto Nível */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric
          label="Progresso geral"
          value={`${data.overallProgress}%`}
          note={`${data.counts.concluded} de ${data.counts.total} capítulos concluídos`}
          accent
        />
        <Metric
          label="Capítulos do estudo"
          value={data.hierarchy.parentCount}
          note={`${data.counts.inProgress} em andamento · ${data.counts.pending} a iniciar`}
        />
        <Metric
          label="Etapas de execução"
          value={data.hierarchy.stepCount}
          note="253 atividades detalhadas catalogadas"
        />
        <Metric
          label="Monitoramento de prazo"
          value={data.counts.delayed === 0 ? "Em dia" : `${data.counts.delayed} em atraso`}
          note={data.counts.delayed === 0 ? "Nenhum atraso crítico registrado" : "Requer atenção da coordenação"}
        />
        <Metric
          label="Interfaces ativas"
          value={interfaces.filter(item => item.status !== "resolvida").length}
          note={
            blockedInterfaces.length > 0
              ? `${blockedInterfaces.length} bloqueio${blockedInterfaces.length > 1 ? "s" : ""} prioritário${blockedInterfaces.length > 1 ? "s" : ""}`
              : "Sem bloqueios críticos no momento"
          }
        />
      </section>

      {/* Execução Consolidada por Tomo */}
      <section className="technical-panel overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b bg-muted/30 p-5">
          <div>
            <p className="data-label">Estrutura editorial</p>
            <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-.025em]">
              Execução por tomo
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Filtrar cronograma por tomo:</span>
            <button
              onClick={() => setSelectedTome("todos")}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedTome === "todos"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Todos ({data.byTome.length})
            </button>
          </div>
        </div>

        <div className="grid divide-y paper-rule sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-5">
          {data.byTome.map(tome => {
            const isSelected = selectedTome === tome.tome;
            return (
              <button
                key={tome.tome}
                onClick={() => setSelectedTome(isSelected ? "todos" : tome.tome)}
                className={`min-w-0 p-4 text-left transition-all hover:bg-muted/20 ${
                  isSelected ? "bg-primary/5 ring-1 ring-inset ring-primary/40" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="data-label text-primary">{tome.tome}</p>
                  {isSelected && (
                    <Badge variant="outline" className="h-4 px-1 text-[9px] font-mono text-primary">
                      Ativo
                    </Badge>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-foreground">
                  {tome.title}
                </p>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <span className="font-mono text-2xl font-semibold">{tome.progress}%</span>
                  <span className="text-[11px] text-muted-foreground">
                    {tome.chapterCount} capítulo{tome.chapterCount === 1 ? "" : "s"}
                  </span>
                </div>
                <Progress value={tome.progress} className="mt-2 h-1.5 bg-muted" />
                <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    {tome.concluded > 0 ? `${tome.concluded} concluído${tome.concluded > 1 ? "s" : ""}` : `${tome.open} em execução`}
                  </span>
                  {tome.delayed > 0 && (
                    <span className="font-medium text-[#B44232]">
                      {tome.delayed} atraso{tome.delayed > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Cronograma Mestre de Capítulos (Full Width & Interativo) */}
      <section className="technical-panel overflow-hidden">
        {/* Cabeçalho da Seção de Cronograma */}
        <div className="flex flex-col gap-4 border-b bg-muted/30 p-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <p className="data-label">Cronograma Mestre de Capítulos</p>
            </div>
            <h2 className="font-display mt-1.5 text-2xl font-semibold tracking-[-.025em]">
              Execução temporal e entregáveis por capítulo
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Passe o mouse sobre os meses para inspecionar os entregáveis previstos. Clique no capítulo para abrir sua ficha de acompanhamento.
            </p>
          </div>

          {/* Filtros e Busca */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-48">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar capítulo, código ou responsável…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-8.5 pl-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-1.5 rounded-md border bg-background p-1 text-xs">
              <Filter className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-medium focus:outline-none"
              >
                <option value="todos">Todos os status</option>
                <option value="em andamento">Em andamento</option>
                <option value="concluído">Concluído</option>
                <option value="pendente">Pendente</option>
                <option value="atrasado">Atrasado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grade de Cabeçalho dos 6 Meses com HoverCard de Entregáveis Previstos */}
        <div className="border-b bg-card">
          <div className="grid grid-cols-1 divide-y md:grid-cols-[minmax(320px,1.2fr)_repeat(6,minmax(90px,1fr))] md:divide-x md:divide-y-0 paper-rule">
            {/* Coluna de Identificação dos Capítulos */}
            <div className="hidden md:flex items-center justify-between px-4 py-3 bg-muted/15">
              <span className="data-label text-muted-foreground">Capítulo / Frente de Trabalho</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                {filteredSections.length} {filteredSections.length === 1 ? "item" : "itens"}
              </span>
            </div>

            {/* 6 Colunas dos Meses (M1 a M6) com HoverCard interativo */}
            {months.map((month) => {
              const monthDeliverables = month.deliverables ?? [];
              const count = monthDeliverables.length;

              return (
                <HoverCard key={month.label} openDelay={100} closeDelay={150}>
                  <HoverCardTrigger asChild>
                    <div className="group flex flex-col items-center justify-center p-3 text-center transition-colors hover:bg-primary/5 cursor-pointer select-none">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-primary">M{month.monthNum}</span>
                        <span className="text-xs font-semibold capitalize text-foreground">{month.label}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-medium transition-colors ${
                          count > 0
                            ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {count} {count === 1 ? "entregável" : "entregáveis"}
                        </span>
                      </div>
                    </div>
                  </HoverCardTrigger>

                  <HoverCardContent align="center" className="w-84 p-4 shadow-xl border-border bg-card">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between border-b pb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                              M{month.monthNum}
                            </span>
                            <h4 className="font-display text-sm font-semibold capitalize">
                              {month.monthLabelFull || month.label}
                            </h4>
                          </div>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {formatDate(month.start)} a {formatDate(month.end)}
                          </p>
                        </div>
                        <Badge variant="secondary" className="font-mono text-[11px]">
                          {count} {count === 1 ? "previsto" : "previstos"}
                        </Badge>
                      </div>

                      {count === 0 ? (
                        <p className="py-2 text-center text-xs text-muted-foreground italic">
                          Nenhum marco de conclusão previsto para este mês.
                        </p>
                      ) : (
                        <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                            Entregáveis previstos no mês:
                          </p>
                          {monthDeliverables.map(deliv => (
                            <Link
                              key={deliv.id}
                              href={`/atividades?ficha=${deliv.id}`}
                              className="group/item flex flex-col gap-1 rounded-md border p-2 text-xs transition-colors hover:bg-muted/50 hover:border-primary/40 block"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[10px] font-bold text-primary">
                                    {deliv.planCode || deliv.sectionCode}
                                  </span>
                                  <StatusBadge status={deliv.status} />
                                </div>
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  {formatDate(deliv.dueAt)}
                                </span>
                              </div>
                              <p className="line-clamp-2 font-medium text-foreground group-hover/item:text-primary transition-colors">
                                {deliv.title}
                              </p>
                              {deliv.responsibleName && (
                                <p className="text-[10px] text-muted-foreground">
                                  Coord.: {deliv.responsibleName}
                                </p>
                              )}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              );
            })}
          </div>
        </div>

        {/* Lista de Capítulos Clicáveis com Linha do Tempo */}
        <div className="divide-y paper-rule">
          {filteredSections.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p className="text-sm">Nenhum capítulo encontrado com os filtros atuais.</p>
              <button
                onClick={() => {
                  setSelectedTome("todos");
                  setStatusFilter("todos");
                  setSearchTerm("");
                }}
                className="mt-2 text-xs text-primary underline"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            filteredSections.map(section => {
              const sectionInterfaces = interfaces.filter(
                item =>
                  item.status !== "resolvida" &&
                  item.sections.some(link => link.sectionId === section.id)
              );
              const openInterfaces = sectionInterfaces.length;
              const targetActivityId = section.primaryActivityId ?? section.id;

              return (
                <Link
                  key={section.id}
                  href={`/atividades?ficha=${targetActivityId}`}
                  className="group block transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-[minmax(320px,1.2fr)_repeat(6,minmax(90px,1fr))] md:items-center md:gap-0 md:p-0">
                    {/* Informações do Capítulo */}
                    <div className="flex items-start gap-3 md:p-4">
                      <SectionMark code={section.code} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] font-semibold text-primary">
                            {section.tome || "Capítulo"}
                          </span>
                          <StatusBadge status={section.status} />
                          {openInterfaces > 0 && (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                              <GitMerge className="h-3 w-3" />
                              {openInterfaces} interface{openInterfaces > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center justify-between gap-2">
                          <p className="line-clamp-1 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {section.title}
                          </p>
                          <span className="font-mono text-xs font-medium text-foreground">
                            {section.progress}%
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                          {section.responsibleName && (
                            <span>Coord.: {section.responsibleName}</span>
                          )}
                          <span>·</span>
                          <span>
                            {section.total} atividade{section.total === 1 ? "" : "s"} · {section.subitemCount} etapa{section.subitemCount === 1 ? "" : "s"}
                          </span>
                        </div>

                        <Progress value={section.progress} className="mt-2 h-1 bg-muted" />
                      </div>

                      <div className="hidden sm:flex items-center self-center pl-2 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all">
                        <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Barras de Período Ativo dos Meses (M1 a M6) alinhadas com o cabeçalho */}
                    {months.map((month, mIdx) => {
                      const isActive = section.activeMonths ? section.activeMonths[mIdx] : true;
                      const isDeliverableMonth = section.dueAt && section.dueAt >= month.start && section.dueAt <= month.end;

                      return (
                        <div
                          key={month.label}
                          className="hidden md:flex h-full items-center justify-center border-l paper-rule p-2"
                        >
                          {isActive ? (
                            <div className="relative w-full py-1">
                              <div
                                className={`h-2.5 w-full rounded-sm transition-colors ${
                                  section.progress === 100
                                    ? "bg-[#27745B]/60 group-hover:bg-[#27745B]"
                                    : section.status === "atrasado"
                                    ? "bg-[#B44232]/50 group-hover:bg-[#B44232]"
                                    : "bg-primary/40 group-hover:bg-primary/70"
                                }`}
                              />
                              {isDeliverableMonth && (
                                <div
                                  title="Mês de entrega final deste capítulo"
                                  className="absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-1.5 rounded-full bg-primary ring-2 ring-background shadow-xs"
                                />
                              )}
                            </div>
                          ) : (
                            <div className="h-0.5 w-3 rounded-full bg-muted/40" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>

      {/* Indicadores de Governança, Equipe e Produção */}
      <section className="technical-panel grid overflow-hidden md:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-4 border-b p-4 md:border-r xl:border-b-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="data-label">Equipe ativa</p>
            <p className="mt-1 text-sm font-medium text-foreground">{data.teamCount} pesquisadores e especialistas</p>
          </div>
        </div>

        <div className="flex items-center gap-4 border-b p-4 xl:border-b-0 xl:border-r">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="data-label">Biblioteca de apoio</p>
            <p className="mt-1 text-sm font-medium text-foreground">{data.libraryCount} referências catalogadas</p>
          </div>
        </div>

        <div className="flex items-center gap-4 border-b p-4 md:border-r md:border-b-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FilePenLine className="h-5 w-5" />
          </div>
          <div>
            <p className="data-label">Produção documental</p>
            <p className="mt-1 text-sm font-medium text-foreground">{data.materialCount} materiais em elaboração</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            blockedInterfaces.length ? "bg-red-500/10 text-[#B5482D]" : "bg-primary/10 text-primary"
          }`}>
            <GitMerge className="h-5 w-5" />
          </div>
          <div>
            <p className="data-label">Interfaces críticas</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {blockedInterfaces.length
                ? `${blockedInterfaces.length} bloqueio${blockedInterfaces.length === 1 ? "" : "s"} prioritário${blockedInterfaces.length === 1 ? "" : "s"}`
                : `${interfaces.filter(item => item.status !== "resolvida").length} pontos abertos`}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
