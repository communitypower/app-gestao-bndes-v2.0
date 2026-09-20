import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Metric, PageHeader, PageLoading, SectionMark, StatusBadge } from "@/components/EditorialUI";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { trpc } from "@/lib/trpc";
import { formatDate, initials } from "@/lib/format";
import { groupDisplayName } from "@shared/groupDisplay";
import { OFFICIAL_MONTH_MILESTONES } from "@shared/officialScheduleMes3";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Clock,
  Crown,
  ExternalLink,
  FilePenLine,
  Filter,
  GitMerge,
  Layers,
  Layers3,
  Search,
  ShieldCheck,
  Briefcase,
  Users,
  UsersRound,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export default function Home() {
  const { data, isLoading } = trpc.dashboard.overview.useQuery();
  const { data: governance, isLoading: governanceLoading } = trpc.governance.overview.useQuery();
  const { data: interfaces, isLoading: interfacesLoading } = trpc.interfaces.list.useQuery();

  // Modo de visualização principal: "atividades" (Estrutura Editorial) ou "recursos" (Equipe / Grupos)
  const [viewMode, setViewMode] = useState<"atividades" | "recursos">("atividades");

  // Filtros
  const [selectedTome, setSelectedTome] = useState<string>("todos");
  const [selectedGroup, setSelectedGroup] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [roleFilter, setRoleFilter] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Estado de expansão/retração de Tomos e Capítulos (Visão por Atividades)
  const [expandedTomos, setExpandedTomos] = useState<Record<string, boolean>>({
    "Apresentação": true,
    "Tomo I": true,
    "Tomo II": true,
    "Tomo III": true,
    "Tomo IV": true,
  });
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({});

  // Estado de expansão/retração de Grupos e Integrantes (Visão por Recursos)
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});
  const [expandedMembers, setExpandedMembers] = useState<Record<number, boolean>>({});

  const months = useMemo(() => {
    if (data?.months && data.months.length > 0) return data.months;

    return OFFICIAL_MONTH_MILESTONES.map((milestone, index) => {
      const deliverables = (data?.bySection ?? [])
        .flatMap(s => [
          ...(s.dueAt && s.dueAt >= milestone.startAt && s.dueAt <= milestone.dueAt ? [{
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
          }] : []),
          ...(s.steps ?? []).filter(step => step.dueAt && step.dueAt >= milestone.startAt && step.dueAt <= milestone.dueAt).map(step => ({
            id: step.id,
            planCode: null,
            detailCode: step.detailCode,
            sectionCode: s.code,
            title: step.title,
            responsibleName: step.responsibleName,
            status: step.status,
            progress: step.progress,
            dueAt: step.dueAt ?? 0,
            tome: s.tome,
          }))
        ]);

      const dueDateObj = new Date(milestone.dueAt);
      const monthNameShort = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" }).format(dueDateObj).replace(".", "");
      const monthNameFull = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(dueDateObj);

      return {
        monthIndex: index,
        monthNum: milestone.month,
        label: monthNameShort,
        monthLabelFull: `${milestone.label} — Término em ${milestone.dueDate.slice(8, 10)}/${milestone.dueDate.slice(5, 7)}/${milestone.dueDate.slice(0, 4)} (${monthNameFull})`,
        start: milestone.startAt,
        end: milestone.dueAt,
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

  // Seções/Capítulos agrupados por Tomo para a Visão por Atividades
  const tomesWithChapters = useMemo(() => {
    if (!data?.byTome || !data?.bySection) return [];
    const query = searchTerm.toLowerCase().trim();

    return data.byTome.map(tomeDef => {
      const chaptersInTome = data.bySection.filter(sec => {
        if (sec.tome !== tomeDef.tome) return false;
        if (selectedTome !== "todos" && selectedTome !== sec.tome) return false;
        if (statusFilter !== "todos" && sec.status !== statusFilter) return false;

        if (!query) return true;

        const matchesChapter =
          sec.code.toLowerCase().includes(query) ||
          sec.title.toLowerCase().includes(query) ||
          (sec.responsibleName && sec.responsibleName.toLowerCase().includes(query));

        const matchesSubstep = (sec.steps ?? []).some(
          step =>
            (step.detailCode && step.detailCode.toLowerCase().includes(query)) ||
            (step.title && step.title.toLowerCase().includes(query)) ||
            (step.responsibleName && step.responsibleName.toLowerCase().includes(query))
        );

        return matchesChapter || matchesSubstep;
      });

      return {
        ...tomeDef,
        chapters: chaptersInTome,
      };
    }).filter(tome => (selectedTome === "todos" || selectedTome === tome.tome) && tome.chapters.length > 0);
  }, [data?.byTome, data?.bySection, selectedTome, statusFilter, searchTerm]);

  // Grupos e Integrantes filtrados para a Visão por Recursos
  const filteredTeamHierarchy = useMemo(() => {
    if (!data?.teamHierarchy) return [];
    const query = searchTerm.toLowerCase().trim();

    return data.teamHierarchy.map(group => {
      if (selectedGroup !== "todos" && String(group.id) !== selectedGroup) return null;

      const filteredMembers = group.members.filter(member => {
        if (roleFilter === "coordenador" && member.groupRole !== "coordenador") return false;
        if (roleFilter === "executor" && member.groupRole === "coordenador") return false;

        if (!query) return true;

        const matchesMember =
          member.name.toLowerCase().includes(query) ||
          member.title.toLowerCase().includes(query) ||
          member.institution.toLowerCase().includes(query) ||
          (member.email && member.email.toLowerCase().includes(query)) ||
          group.name.toLowerCase().includes(query);

        const matchesActivity = member.assignedActivities.some(
          act =>
            act.code.toLowerCase().includes(query) ||
            act.title.toLowerCase().includes(query) ||
            act.tome.toLowerCase().includes(query)
        );

        return matchesMember || matchesActivity;
      });

      if (filteredMembers.length === 0) return null;

      return {
        ...group,
        members: filteredMembers,
      };
    }).filter(Boolean) as NonNullable<typeof data.teamHierarchy>;
  }, [data?.teamHierarchy, selectedGroup, roleFilter, searchTerm]);

  // Controles de Expansão/Retração em massa
  const toggleAllTomos = (expand: boolean) => {
    const next: Record<string, boolean> = {};
    (data?.byTome ?? []).forEach(t => {
      next[t.tome] = expand;
    });
    setExpandedTomos(next);
  };

  const toggleAllChapters = (expand: boolean) => {
    const next: Record<number, boolean> = {};
    (data?.bySection ?? []).forEach(s => {
      next[s.id] = expand;
    });
    setExpandedChapters(next);
  };

  const toggleAllGroups = (expand: boolean) => {
    const next: Record<number, boolean> = {};
    (data?.teamHierarchy ?? []).forEach(g => {
      next[g.id] = expand;
    });
    setExpandedGroups(next);
  };

  const toggleAllMembers = (expand: boolean) => {
    const next: Record<number, boolean> = {};
    (data?.teamHierarchy ?? []).forEach(g => {
      g.members.forEach(m => {
        next[m.id] = expand;
      });
    });
    setExpandedMembers(next);
  };

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

      {/* Seletor de Modo de Visualização e Filtros Integrados */}
      <section className="technical-panel overflow-hidden">
        <div className="flex flex-col gap-4 border-b bg-muted/30 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="data-label">Estrutura de Acompanhamento</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg border bg-background p-1 shadow-2xs">
                <button
                  onClick={() => setViewMode("atividades")}
                  className={`inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    viewMode === "atividades"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Layers3 className="h-4 w-4" />
                  Visão por Atividades (Editorial)
                </button>
                <button
                  onClick={() => setViewMode("recursos")}
                  className={`inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    viewMode === "recursos"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <UsersRound className="h-4 w-4" />
                  Visão por Recursos / Equipe
                </button>
              </div>
            </div>
          </div>

          {/* Busca e Filtros Contextuais */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-56">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={
                  viewMode === "atividades"
                    ? "Buscar capítulo, código ou coordenador…"
                    : "Buscar integrante, grupo ou atividade…"
                }
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-9 pl-8 text-xs"
              />
            </div>

            {viewMode === "atividades" ? (
              <>
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
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      toggleAllTomos(true);
                      toggleAllChapters(true);
                    }}
                    title="Expandir todos os níveis"
                    className="inline-flex items-center gap-1 rounded-md border bg-background px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    <ChevronsUpDown className="h-3.5 w-3.5" />
                    Expandir tudo
                  </button>
                  <button
                    onClick={() => {
                      toggleAllTomos(false);
                      toggleAllChapters(false);
                    }}
                    title="Recolher todos os níveis"
                    className="inline-flex items-center gap-1 rounded-md border bg-background px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    <ChevronsDownUp className="h-3.5 w-3.5" />
                    Recolher tudo
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5 rounded-md border bg-background p-1 text-xs">
                  <Filter className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                  <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="bg-transparent text-xs font-medium focus:outline-none"
                  >
                    <option value="todos">Todos os papéis</option>
                    <option value="coordenador">Apenas Coordenadores</option>
                    <option value="executor">Apenas Executores</option>
                  </select>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      toggleAllGroups(true);
                      toggleAllMembers(true);
                    }}
                    title="Expandir todos os grupos e integrantes"
                    className="inline-flex items-center gap-1 rounded-md border bg-background px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    <ChevronsUpDown className="h-3.5 w-3.5" />
                    Expandir tudo
                  </button>
                  <button
                    onClick={() => {
                      toggleAllGroups(false);
                      toggleAllMembers(false);
                    }}
                    title="Recolher todos os grupos e integrantes"
                    className="inline-flex items-center gap-1 rounded-md border bg-background px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                  >
                    <ChevronsDownUp className="h-3.5 w-3.5" />
                    Recolher tudo
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODO 1: VISÃO POR ATIVIDADES (ENCADEAMENTO EDITORIAL TOMO -> CAPÍTULO -> ETAPA) */}
        {/* ========================================================================= */}
        {viewMode === "atividades" && (
          <div className="space-y-0">
            {/* Grade de Cabeçalho dos 7 Meses (M1 a M7) com HoverCard de Entregáveis Previstos */}
            <div className="border-b bg-card">
              <div className="grid grid-cols-1 divide-y md:grid-cols-[minmax(340px,1.3fr)_repeat(7,minmax(80px,1fr))] md:divide-x md:divide-y-0 paper-rule">
                <div className="hidden md:flex items-center justify-between px-4 py-3 bg-muted/15">
                  <span className="data-label text-muted-foreground">Hierarquia Editorial (Tomo → Capítulo → Etapas)</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {tomesWithChapters.reduce((sum, t) => sum + t.chapters.length, 0)} capítulos
                  </span>
                </div>

                {/* 7 Colunas dos Meses (M1 a M7) com HoverCard interativo */}
                {months.map(month => {
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
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-medium transition-colors ${
                                count > 0
                                  ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
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

            {/* Árvore Hierárquica: Nível 1 (Tomo) → Nível 2 (Capítulo) → Nível 3 (Etapas de Execução) */}
            <div className="divide-y paper-rule">
              {tomesWithChapters.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p className="text-sm">Nenhum capítulo ou atividade encontrado com os filtros atuais.</p>
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
                tomesWithChapters.map(tome => {
                  const isTomeOpen = expandedTomos[tome.tome] !== false;

                  return (
                    <div key={tome.tome} className="bg-card">
                      {/* Nível 1: Cabeçalho do Tomo com Expansão/Retração */}
                      <button
                        onClick={() =>
                          setExpandedTomos(prev => ({
                            ...prev,
                            [tome.tome]: !isTomeOpen,
                          }))
                        }
                        className="w-full flex items-center justify-between gap-4 border-b bg-muted/20 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted">
                            {isTomeOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                          <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
                            {tome.tome}
                          </span>
                          <span className="truncate font-display text-sm font-semibold text-foreground">
                            {tome.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                          <div className="hidden sm:flex items-center gap-2">
                            <span className="font-mono font-medium text-foreground">{tome.progress}%</span>
                            <Progress value={tome.progress} className="h-1.5 w-20 bg-muted" />
                          </div>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {tome.chapters.length} {tome.chapters.length === 1 ? "capítulo" : "capítulos"}
                          </span>
                        </div>
                      </button>

                      {/* Capítulos do Tomo (quando expandido) */}
                      {isTomeOpen && (
                        <div className="divide-y paper-rule">
                          {tome.chapters.map(chapter => {
                            const isChapterOpen = expandedChapters[chapter.id] === true;
                            const targetActivityId = chapter.primaryActivityId ?? chapter.id;
                            const steps = chapter.steps ?? [];
                            const sectionInterfaces = interfaces.filter(
                              item =>
                                item.status !== "resolvida" &&
                                item.sections.some(link => link.sectionId === chapter.id)
                            );
                            const openInterfaces = sectionInterfaces.length;

                            return (
                              <div key={chapter.id} className="group bg-card transition-colors hover:bg-muted/10">
                                {/* Nível 2: Linha do Capítulo */}
                                <div className="grid grid-cols-1 md:grid-cols-[minmax(340px,1.3fr)_repeat(7,minmax(80px,1fr))] md:items-center">
                                  {/* Info e Ações do Capítulo */}
                                  <div className="flex items-start gap-2.5 p-3.5 pl-6 md:p-3.5 md:pl-8">
                                    {steps.length > 0 ? (
                                      <button
                                        onClick={e => {
                                          e.stopPropagation();
                                          setExpandedChapters(prev => ({
                                            ...prev,
                                            [chapter.id]: !isChapterOpen,
                                          }));
                                        }}
                                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                                        title={isChapterOpen ? "Recolher etapas de execução" : `Expandir ${steps.length} etapas`}
                                      >
                                        {isChapterOpen ? (
                                          <ChevronDown className="h-3.5 w-3.5" />
                                        ) : (
                                          <ChevronRight className="h-3.5 w-3.5" />
                                        )}
                                      </button>
                                    ) : (
                                      <div className="h-5 w-5 shrink-0" />
                                    )}

                                    <SectionMark code={chapter.code} />

                                    <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <StatusBadge status={chapter.status} />
                                        {chapter.dueAt && (
                                          <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                                            <Calendar className="h-3 w-3" />
                                            Cronograma: Término em {formatDate(chapter.dueAt)}
                                          </span>
                                        )}
                                        {openInterfaces > 0 && (
                                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                                            <GitMerge className="h-3 w-3" />
                                            {openInterfaces} interface{openInterfaces > 1 ? "s" : ""}
                                          </span>
                                        )}
                                      </div>

                                      <div className="mt-1 flex items-center justify-between gap-2">
                                        <Link
                                          href={`/atividades?ficha=${targetActivityId}`}
                                          className="line-clamp-1 font-semibold text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1.5 group/link"
                                        >
                                          {chapter.title}
                                          <ArrowRight className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity text-primary" />
                                        </Link>
                                        <span className="font-mono text-xs font-medium text-foreground">
                                          {chapter.progress}%
                                        </span>
                                      </div>

                                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                        {chapter.responsibleName && (
                                          <span>Coord.: {chapter.responsibleName}</span>
                                        )}
                                        {steps.length > 0 && (
                                          <>
                                            <span>·</span>
                                            <button
                                              onClick={() =>
                                                setExpandedChapters(prev => ({
                                                  ...prev,
                                                  [chapter.id]: !isChapterOpen,
                                                }))
                                              }
                                              className="text-primary hover:underline font-mono text-[10px]"
                                            >
                                              {steps.length} {steps.length === 1 ? "etapa detalhada" : "etapas detalhadas"} {isChapterOpen ? "▲" : "▼"}
                                            </button>
                                          </>
                                        )}
                                      </div>

                                      <Progress value={chapter.progress} className="mt-2 h-1 bg-muted" />
                                    </div>
                                  </div>

                                  {/* Barras de Meses Ativos (M1 a M7) alinhadas com o cabeçalho */}
                                  {months.map((month, mIdx) => {
                                    const isActive = chapter.activeMonths ? chapter.activeMonths[mIdx] : true;
                                    const isDeliverableMonth =
                                      chapter.dueAt && chapter.dueAt >= month.start && chapter.dueAt <= month.end;

                                    return (
                                      <div
                                        key={month.label}
                                        className="hidden md:flex h-full items-center justify-center border-l paper-rule p-2"
                                      >
                                        {isActive ? (
                                          <div className="relative w-full py-1">
                                            <div
                                              className={`h-2.5 w-full rounded-sm transition-colors ${
                                                chapter.progress === 100
                                                  ? "bg-[#27745B]/60"
                                                  : chapter.status === "atrasado"
                                                  ? "bg-[#B44232]/50"
                                                  : "bg-primary/40 group-hover:bg-primary/70"
                                              }`}
                                            />
                                            {isDeliverableMonth && (
                                              <div
                                                title={`Mês de entrega final deste capítulo (${formatDate(chapter.dueAt)})`}
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

                                {/* Nível 3: Etapas de Execução / Subatividades Detalhadas (quando expandido) */}
                                {isChapterOpen && steps.length > 0 && (
                                  <div className="border-t bg-muted/15 pl-10 sm:pl-16 pr-4 py-2 space-y-2">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pt-1">
                                      Etapas de Execução do Capítulo {chapter.code}:
                                    </p>
                                    <div className="space-y-1.5">
                                      {steps.map(step => (
                                        <Link
                                          key={step.id}
                                          href={`/atividades?ficha=${step.id}`}
                                          className="group/step flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-md border border-border/60 bg-card p-2.5 text-xs transition-colors hover:bg-muted/40 hover:border-primary/40 block"
                                        >
                                          <div className="flex items-start gap-2 min-w-0 flex-1">
                                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-foreground shrink-0 mt-0.5">
                                              {step.detailCode || "Etapa"}
                                            </span>
                                            <div className="min-w-0">
                                              <p className="font-medium text-foreground group-hover/step:text-primary transition-colors line-clamp-1">
                                                {step.title}
                                              </p>
                                              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                                                {step.responsibleName && (
                                                  <span>Líder: {step.responsibleName}</span>
                                                )}
                                                {step.allocations && step.allocations.length > 0 && (
                                                  <span>· {step.allocations.length} alocados</span>
                                                )}
                                                {step.dueAt && (
                                                  <span className="font-mono font-semibold text-primary bg-primary/10 px-1.5 py-0.2 rounded">
                                                    Cronograma: Término em {formatDate(step.dueAt)}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                            <StatusBadge status={step.status} />
                                            <span className="font-mono text-[11px] font-semibold text-foreground w-9 text-right">
                                              {step.progress}%
                                            </span>
                                            <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover/step:opacity-100 group-hover/step:text-primary transition-all" />
                                          </div>
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODO 2: VISÃO POR RECURSOS / EQUIPE (ENCADEAMENTO GRUPO -> COORDENADOR -> EXECUTORES -> ATIVIDADES) */}
        {/* ========================================================================= */}
        {viewMode === "recursos" && (
          <div className="divide-y paper-rule">
            {filteredTeamHierarchy.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">Nenhum grupo ou integrante localizado com os filtros atuais.</p>
                <button
                  onClick={() => {
                    setSelectedGroup("todos");
                    setRoleFilter("todos");
                    setSearchTerm("");
                  }}
                  className="mt-2 text-xs text-primary underline"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              filteredTeamHierarchy.map(group => {
                const isGroupOpen = expandedGroups[group.id] !== false;

                return (
                  <div key={group.id} className="bg-card">
                    {/* Nível 1: Cabeçalho do Grupo Temático com Expansão/Retração */}
                    <button
                      onClick={() =>
                        setExpandedGroups(prev => ({
                          ...prev,
                          [group.id]: !isGroupOpen,
                        }))
                      }
                      className="w-full flex items-center justify-between gap-4 border-b bg-muted/20 px-4 py-3.5 text-left transition-colors hover:bg-muted/40"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted">
                          {isGroupOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                        <Badge variant="outline" className="font-mono text-xs font-bold text-primary">
                          {group.name}
                        </Badge>
                        <span className="truncate font-display text-sm font-semibold text-foreground">
                          {groupDisplayName(group.name)}
                        </span>
                        <span className="hidden sm:inline-block text-xs text-muted-foreground">
                          · {group.institution}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        {group.coordinator && (
                          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-background/80 px-2 py-0.5 rounded border">
                            <ShieldCheck className="h-3 w-3 text-amber-600" />
                            Coord.: {group.coordinator.name}
                          </span>
                        )}
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {group.members.length} {group.members.length === 1 ? "integrante" : "integrantes"} · {group.totalActivities} atividades
                        </span>
                      </div>
                    </button>

                    {/* Integrantes do Grupo (quando expandido) */}
                    {isGroupOpen && (
                      <div className="divide-y paper-rule">
                        {group.members.map(member => {
                          const isMemberOpen = expandedMembers[member.id] === true;
                          const activities = member.assignedActivities ?? [];
                          const isCoord = member.groupRole === "coordenador";

                          return (
                            <div key={member.id} className="bg-card transition-colors hover:bg-muted/10">
                              {/* Nível 2: Linha do Integrante */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 pl-6 sm:pl-10">
                                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                                  {activities.length > 0 ? (
                                    <button
                                      onClick={() =>
                                        setExpandedMembers(prev => ({
                                          ...prev,
                                          [member.id]: !isMemberOpen,
                                        }))
                                      }
                                      className="mt-0.5 sm:mt-0 flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                                      title={isMemberOpen ? "Recolher atividades alocadas" : `Expandir ${activities.length} atividades alocadas`}
                                    >
                                      {isMemberOpen ? (
                                        <ChevronDown className="h-3.5 w-3.5" />
                                      ) : (
                                        <ChevronRight className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                  ) : (
                                    <div className="h-5 w-5 shrink-0" />
                                  )}

                                  <Avatar className="h-8 w-8 text-xs font-mono">
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                      {initials(member.name)}
                                    </AvatarFallback>
                                  </Avatar>

                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-semibold text-sm text-foreground">
                                        {member.name}
                                      </span>
                                      {isCoord ? (
                                        <Badge
                                          variant="outline"
                                          className="h-4 gap-1 border-amber-200 bg-amber-50 px-1.5 py-0 text-[10px] font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                                        >
                                          <ShieldCheck className="h-2.5 w-2.5 text-amber-600 dark:text-amber-400" />
                                          Coordenador(a)
                                        </Badge>
                                      ) : (
                                        <Badge
                                          variant="outline"
                                          className="h-4 gap-1 border-emerald-200 bg-emerald-50 px-1.5 py-0 text-[10px] font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                        >
                                          <Briefcase className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                                          Pesquisador(a) / Executor(a)
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                                      {member.title} · {member.institution}
                                      {member.email && ` · ${member.email}`}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 self-end sm:self-center pl-10 sm:pl-0">
                                  {activities.length > 0 && (
                                    <button
                                      onClick={() =>
                                        setExpandedMembers(prev => ({
                                          ...prev,
                                          [member.id]: !isMemberOpen,
                                        }))
                                      }
                                      className="font-mono text-xs font-medium text-primary hover:underline bg-primary/5 px-2 py-1 rounded"
                                    >
                                      {activities.length} {activities.length === 1 ? "atividade alocada" : "atividades alocadas"} {isMemberOpen ? "▲" : "▼"}
                                    </button>
                                  )}
                                  {member.totalAllocatedHours > 0 && (
                                    <span className="font-mono text-xs text-muted-foreground">
                                      {member.totalAllocatedHours}h alocadas
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Nível 3: Atividades Alocadas ao Integrante (quando expandido) */}
                              {isMemberOpen && activities.length > 0 && (
                                <div className="border-t bg-muted/15 pl-10 sm:pl-16 pr-4 py-2.5 space-y-2">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pt-1">
                                    Atividades e Responsabilidades atribuídas a {member.name}:
                                  </p>
                                  <div className="space-y-1.5">
                                    {activities.map(act => (
                                      <Link
                                        key={act.id}
                                        href={`/atividades?ficha=${act.id}`}
                                        className="group/act flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-md border border-border/60 bg-card p-2.5 text-xs transition-colors hover:bg-muted/40 hover:border-primary/40 block"
                                      >
                                        <div className="flex items-start gap-2 min-w-0 flex-1">
                                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-primary shrink-0 mt-0.5">
                                            {act.code}
                                          </span>
                                          <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                              <span className="font-medium text-foreground group-hover/act:text-primary transition-colors line-clamp-1">
                                                {act.title}
                                              </span>
                                              <span className="text-[10px] text-muted-foreground">
                                                ({act.tome})
                                              </span>
                                            </div>
                                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                                              <span className="font-medium text-foreground">
                                                Papel: {act.roleInActivity}
                                              </span>
                                              {act.allocatedHours > 0 && (
                                                <span>· {act.allocatedHours}h alocadas</span>
                                              )}
                                              {act.responsibility && (
                                                <span>· {act.responsibility}</span>
                                              )}
                                               {act.dueAt && (
                                                 <span>· Cronograma: Término em {formatDate(act.dueAt)}</span>
                                               )}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                          <StatusBadge status={act.status} />
                                          <span className="font-mono text-[11px] font-semibold text-foreground w-9 text-right">
                                            {act.progress}%
                                          </span>
                                          <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover/act:opacity-100 group-hover/act:text-primary transition-all" />
                                        </div>
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
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
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              blockedInterfaces.length ? "bg-red-500/10 text-[#B5482D]" : "bg-primary/10 text-primary"
            }`}
          >
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
