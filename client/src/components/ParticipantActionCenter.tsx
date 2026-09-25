import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileCheck2,
  FileEdit,
  FileText,
  Filter,
  GitMerge,
  Layers,
  MessageSquare,
  Sparkles,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { Checkbox } from "./ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export interface ParticipantAction {
  id: string;
  activityId: number;
  materialId: number | null;
  sectionCode?: string | null;
  activityTitle: string;
  dueAt: number | null;
  role: "executor" | "revisor" | "coordenador" | "interfaces";
  actionType: string;
  actionTitle: string;
  actionDescription: string;
  ctaLabel: string;
  ctaTarget: string;
  interfaceId?: number;
  pendingCommentCount?: number;
}

export interface ParticipantActionCenterProps {
  onSelectActivity: (activityId: number) => void;
  onAssignReviewers?: (activityId: number) => void;
}

type RoleFilter = "todos" | "executor" | "revisor" | "coordenador" | "interfaces";

export interface MonthGroupInfo {
  key: string;
  label: string;
  shortLabel: string;
  monthTag: string | null;
  fullTitle: string;
  sortTime: number;
}

export function getMonthInfo(dueAt: number | null): MonthGroupInfo {
  if (!dueAt) {
    return {
      key: "sem_prazo",
      label: "Sem Prazo Definido",
      shortLabel: "Sem Prazo",
      monthTag: null,
      fullTitle: "Fluxo Contínuo / Sem Prazo Fixo",
      sortTime: Number.MAX_SAFE_INTEGER,
    };
  }

  const date = new Date(dueAt);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth(); // 0-indexed: 0 = Jan, 8 = Set

  const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" }).format(date);
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const shortMonth = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" }).format(date).replace(".", "");
  const capitalizedShort = shortMonth.charAt(0).toUpperCase() + shortMonth.slice(1);
  const shortYear = String(year).slice(-2);

  // Marco de início do estudo: Setembro 2026 (M1)
  const diffFromSet26 = (year - 2026) * 12 + (month - 8);
  let monthTag: string | null = null;
  let fullTitle = `${capitalizedMonth} de ${year}`;

  if (diffFromSet26 >= 0 && diffFromSet26 < 12) {
    monthTag = `M${diffFromSet26 + 1}`;
    fullTitle = `Mês ${diffFromSet26 + 1} — ${capitalizedMonth} ${year}`;
  } else if (diffFromSet26 === -1) {
    monthTag = "M0";
    fullTitle = `Mês Inicial (M0) — ${capitalizedMonth} ${year}`;
  }

  return {
    key: `${year}-${String(month + 1).padStart(2, "0")}`,
    label: `${capitalizedMonth} de ${year}`,
    shortLabel: monthTag ? `${monthTag} · ${capitalizedShort}/${shortYear}` : `${capitalizedShort}/${shortYear}`,
    monthTag,
    fullTitle,
    sortTime: Date.UTC(year, month, 1),
  };
}

function formatDeadlineDisplay(dueAt: number | null) {
  if (!dueAt) {
    return {
      text: "Sem prazo fixado no Cronograma",
      monthTag: null,
      formattedDate: "—",
      badgeClass: "bg-muted/80 text-muted-foreground",
      isOverdue: false,
    };
  }

  const date = new Date(dueAt);
  const formattedDate = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });

  const monthInfo = getMonthInfo(dueAt);
  const now = Date.now();
  const daysDiff = Math.ceil((dueAt - now) / (24 * 60 * 60 * 1000));

  if (daysDiff < 0) {
    return {
      text: `Vencido no Cronograma (${formattedDate})`,
      monthTag: monthInfo.monthTag,
      formattedDate,
      daysDiff,
      badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-900/50 font-semibold",
      isOverdue: true,
    };
  }

  if (daysDiff === 0) {
    return {
      text: `Vence hoje no Cronograma (${formattedDate})`,
      monthTag: monthInfo.monthTag,
      formattedDate,
      daysDiff,
      badgeClass: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300 font-semibold",
      isOverdue: false,
    };
  }

  if (daysDiff <= 7) {
    return {
      text: `Vence em ${daysDiff} dias no Cronograma (${formattedDate})`,
      monthTag: monthInfo.monthTag,
      formattedDate,
      daysDiff,
      badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200/80 font-medium",
      isOverdue: false,
    };
  }

  return {
    text: `Cronograma: ${formattedDate}`,
    monthTag: monthInfo.monthTag,
    formattedDate,
    daysDiff,
    badgeClass: "bg-muted/70 text-muted-foreground border border-border/40 font-medium",
    isOverdue: false,
  };
}

export function ParticipantActionCenter({
  onSelectActivity,
  onAssignReviewers,
}: ParticipantActionCenterProps) {
  const [selectedRole, setSelectedRole] = useState<RoleFilter>("todos");
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"my_actions" | "all_pending">("my_actions");
  const [isMonthPopoverOpen, setIsMonthPopoverOpen] = useState(false);

  const queryResult = trpc.activities?.myWorkloadActions?.useQuery
    ? trpc.activities.myWorkloadActions.useQuery({ viewMode }, { refetchInterval: 30_000 })
    : { data: undefined, isLoading: false };
  const { data, isLoading } = queryResult;

  const allActions: ParticipantAction[] = (data?.actions as any) ?? [];

  // 1. Agrupamento de Meses disponíveis na base de dados
  const availableMonths = useMemo(() => {
    const map = new Map<string, { info: MonthGroupInfo; totalCount: number; roleCounts: Record<RoleFilter, number> }>();

    for (const action of allActions) {
      const info = getMonthInfo(action.dueAt);
      if (!map.has(info.key)) {
        map.set(info.key, {
          info,
          totalCount: 0,
          roleCounts: { todos: 0, executor: 0, revisor: 0, coordenador: 0, interfaces: 0 },
        });
      }
      const entry = map.get(info.key)!;
      entry.totalCount += 1;
      entry.roleCounts.todos += 1;
      if (action.role in entry.roleCounts) {
        entry.roleCounts[action.role] += 1;
      }
    }

    return Array.from(map.values()).sort((a, b) => a.info.sortTime - b.info.sortTime);
  }, [allActions]);

  const handleToggleMonth = (key: string, isCtrl: boolean) => {
    if (key === "todos") {
      setSelectedMonths([]);
      return;
    }

    setSelectedMonths(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      } else {
        return [...prev, key];
      }
    });
  };

  // 2. Ações filtradas por papel e por meses selecionados
  const filteredActions = useMemo(() => {
    return allActions.filter((action: ParticipantAction) => {
      if (selectedRole !== "todos" && action.role !== selectedRole) return false;
      if (selectedMonths.length > 0) {
        const info = getMonthInfo(action.dueAt);
        if (!selectedMonths.includes(info.key)) return false;
      }
      return true;
    });
  }, [allActions, selectedRole, selectedMonths]);

  // 3. Estrutura cronológica em blocos mensais para renderização
  const chronologicalMonthGroups = useMemo(() => {
    const groupsMap = new Map<string, { info: MonthGroupInfo; actions: ParticipantAction[] }>();

    for (const action of filteredActions) {
      const info = getMonthInfo(action.dueAt);
      if (!groupsMap.has(info.key)) {
        groupsMap.set(info.key, { info, actions: [] });
      }
      groupsMap.get(info.key)!.actions.push(action);
    }

    // Ordenar ações dentro de cada mês por dueAt ascendente
    const result = Array.from(groupsMap.values()).map(group => {
      const sortedActions = [...group.actions].sort((a, b) => {
        if (a.dueAt === null || a.dueAt === undefined) return 1;
        if (b.dueAt === null || b.dueAt === undefined) return -1;
        return a.dueAt - b.dueAt;
      });
      return {
        ...group,
        actions: sortedActions,
      };
    });

    // Ordenar blocos mensais cronologicamente
    return result.sort((a, b) => a.info.sortTime - b.info.sortTime);
  }, [filteredActions]);

  const summary = (data?.summary as any) ?? {
    total: 0,
    executorCount: 0,
    reviewerCount: 0,
    coordinatorCount: 0,
    interfaceCount: 0,
  };

  const monthFilterTriggerLabel = useMemo(() => {
    if (selectedMonths.length === 0) {
      return `Todos os Meses (${summary.total})`;
    }
    if (selectedMonths.length === 1) {
      const m = availableMonths.find(item => item.info.key === selectedMonths[0]);
      const count = selectedRole === "todos" ? m?.totalCount : (m?.roleCounts[selectedRole] ?? 0);
      return `${m ? m.info.shortLabel : "1 mês"} (${count ?? 0})`;
    }
    const tags = availableMonths
      .filter(item => selectedMonths.includes(item.info.key))
      .map(item => item.info.monthTag ?? item.info.shortLabel);
    const totalCount = availableMonths
      .filter(item => selectedMonths.includes(item.info.key))
      .reduce((sum, item) => sum + (selectedRole === "todos" ? item.totalCount : (item.roleCounts[selectedRole] ?? 0)), 0);
    return `${tags.join(", ")} (${totalCount})`;
  }, [selectedMonths, availableMonths, summary.total, selectedRole]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border/60 bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    );
  }

  const isAdmin = Boolean(data?.isAdmin);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "executor":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            <FileEdit className="h-3 w-3" />
            Elaboração
          </span>
        );
      case "revisor":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 border border-amber-500/20">
            <UserCheck className="h-3 w-3" />
            Revisão Técnica
          </span>
        );
      case "coordenador":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:text-sky-300 border border-sky-500/20">
            <Users className="h-3 w-3" />
            Homologação
          </span>
        );
      case "interfaces":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-teal-500/10 px-2 py-0.5 text-[11px] font-semibold text-teal-700 dark:text-teal-300 border border-teal-500/20">
            <GitMerge className="h-3 w-3" />
            Interface
          </span>
        );
      default:
        return null;
    }
  };

  const getUrgencyBadge = (actionType: string) => {
    switch (actionType) {
      case "interface_bloqueante":
        return (
          <Badge variant="destructive" className="text-[10px] font-medium h-5 px-1.5">
            Bloqueante
          </Badge>
        );
      case "interface_pendente":
        return (
          <Badge className="bg-teal-600 text-white hover:bg-teal-600 text-[10px] font-medium h-5 px-1.5">
            Alinhamento
          </Badge>
        );
      case "ajustes_solicitados":
        return (
          <Badge variant="destructive" className="text-[10px] font-medium h-5 px-1.5">
            Ajustes Necessários
          </Badge>
        );
      case "validacao_ajustes":
        return (
          <Badge className="bg-purple-600/90 text-white hover:bg-purple-600 text-[10px] font-medium h-5 px-1.5">
            Validar Apontamentos
          </Badge>
        );
      case "revisao_pendente":
        return (
          <Badge className="bg-amber-600 text-white hover:bg-amber-600 text-[10px] font-medium h-5 px-1.5">
            Análise Técnica
          </Badge>
        );
      case "sem_revisores":
        return (
          <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-300 text-[10px] font-medium h-5 px-1.5">
            Sem Revisores
          </Badge>
        );
      case "homologar_capitulo":
        return (
          <Badge className="bg-teal-600 text-white hover:bg-teal-600 text-[10px] font-medium h-5 px-1.5">
            Pronto p/ Homologação
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-[10px] font-medium h-5 px-1.5">
            Elaboração
          </Badge>
        );
    }
  };

  const handleCtaClick = (action: ParticipantAction) => {
    if (action.role === "interfaces") {
      window.location.href = `/interfaces${action.interfaceId ? `?interfaceId=${action.interfaceId}` : ""}`;
      return;
    }
    if (action.actionType === "sem_revisores" && onAssignReviewers) {
      onAssignReviewers(action.activityId);
      return;
    }
    onSelectActivity(action.activityId);
  };

  return (
    <section className="rounded-xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/20 p-4 sm:p-5 shadow-xs transition-all space-y-4">
      {/* 1. Header com título e seletor de visão (Governança/Pessoal) */}
      <div className="flex flex-col gap-3 pb-3 border-b border-border/50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <CalendarClock className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground tracking-tight">
                  Minhas Ações no Estudo
                </h2>
                <Badge variant="outline" className="font-mono text-xs shrink-0">
                  {summary.total} pendente{summary.total !== 1 ? "s" : ""}
                </Badge>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-1 rounded-md border border-border/80 bg-background/80 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setViewMode("my_actions")}
                className={`rounded px-2 py-0.5 font-medium transition-all ${
                  viewMode === "my_actions"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Minhas Ações
              </button>
              <button
                type="button"
                onClick={() => setViewMode("all_pending")}
                className={`rounded px-2 py-0.5 font-medium transition-all ${
                  viewMode === "all_pending"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Visão Geral da Equipe (Admin)
              </button>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {viewMode === "all_pending"
            ? "Visão de governança: Todas as pendências e entregas organizadas pelo cronograma mensal do Estudo BNDES."
            : "Suas pendências organizadas por mês de término no cronograma oficial. Execute as ações na sequência temporal estabelecida."}
        </p>
      </div>

      {/* 2. Barra Unificada de Filtros: Dropdown de Mês + Filtros de Fluxo/Papel */}
      <div className="flex flex-wrap items-center gap-3 pt-0.5">
        {/* Seletor Dropdown de Meses com Suporte a Multi-seleção e Ctrl */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            Mês:
          </span>

          <Popover open={isMonthPopoverOpen} onOpenChange={setIsMonthPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Selecionar meses do cronograma"
                className={`inline-flex items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-all shadow-2xs cursor-pointer ${
                  selectedMonths.length > 0
                    ? "border-primary/50 bg-primary/10 text-primary font-semibold"
                    : "border-border/70 bg-background text-foreground hover:bg-muted/60"
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate max-w-[220px]">{monthFilterTriggerLabel}</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 opacity-60 shrink-0" />
              </button>
            </PopoverTrigger>

            <PopoverContent align="start" className="w-80 p-3 shadow-xl border-border bg-card">
              <div className="space-y-2.5">
                <div className="border-b pb-2">
                  <p className="text-xs font-semibold text-foreground">Selecionar Meses de Término</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Clique nas caixas ou segure <kbd className="font-mono bg-muted px-1 py-0.2 rounded text-[9px] border">Ctrl</kbd> para selecionar múltiplos meses.
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-0.5 pb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMonths([]);
                      setIsMonthPopoverOpen(false);
                    }}
                    className={`text-[11px] font-medium px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      selectedMonths.length === 0
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    Todos os Meses ({summary.total})
                  </button>

                  {selectedMonths.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedMonths([])}
                      className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                    >
                      Limpar seleção
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                  {availableMonths.map(({ info, totalCount, roleCounts }) => {
                    const countForActiveFilter = selectedRole === "todos" ? totalCount : roleCounts[selectedRole];
                    const isSelected = selectedMonths.includes(info.key);

                    return (
                      <div
                        key={info.key}
                        onClick={(e) => handleToggleMonth(info.key, e.ctrlKey || e.metaKey)}
                        className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs cursor-pointer select-none transition-colors ${
                          isSelected
                            ? "bg-primary/10 text-primary font-semibold"
                            : "hover:bg-muted/60 text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleMonth(info.key, false)}
                            className="h-4 w-4"
                            onClick={(e) => e.stopPropagation()}
                          />
                          {info.monthTag && (
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-muted text-foreground shrink-0">
                              {info.monthTag}
                            </span>
                          )}
                          <span className="truncate">{info.label}</span>
                        </div>
                        <Badge
                          variant={isSelected ? "default" : "secondary"}
                          className="font-mono text-[10px] px-1.5 py-0 shrink-0"
                        >
                          {countForActiveFilter}
                        </Badge>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t flex justify-end">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => setIsMonthPopoverOpen(false)}
                    className="h-7 text-xs px-3"
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {selectedMonths.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedMonths([])}
              title="Limpar seleção de meses"
              className="inline-flex items-center gap-1 rounded bg-muted/60 hover:bg-muted px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="h-3 w-3" />
              Limpar ({selectedMonths.length})
            </button>
          )}
        </div>

        <div className="h-4 w-px bg-border/60 hidden md:block" />

        {/* 3. Filtros Rápidos por Papel / Fluxo (Ordem: Elaboração, Homologação, Revisão, Interface, Todos) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-foreground/80 uppercase tracking-wider flex items-center gap-1.5 mr-0.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            Fluxo:
          </span>
          <button
            type="button"
            onClick={() => setSelectedRole("executor")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
              selectedRole === "executor"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            📝 Elaboração ({summary.executorCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole("coordenador")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
              selectedRole === "coordenador"
                ? "bg-sky-600 text-white shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            🏛️ Homologação ({summary.coordinatorCount})
          </button>
          {summary.reviewerCount > 0 && (
            <button
              type="button"
              onClick={() => setSelectedRole("revisor")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                selectedRole === "revisor"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              🔍 Revisão Técnica ({summary.reviewerCount})
            </button>
          )}
          {summary.interfaceCount && summary.interfaceCount > 0 ? (
            <button
              type="button"
              onClick={() => setSelectedRole("interfaces")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                selectedRole === "interfaces"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              🔗 Interfaces ({summary.interfaceCount})
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setSelectedRole("todos")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
              selectedRole === "todos"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Todos os Fluxos ({summary.total})
          </button>
        </div>
      </div>

      {/* 4. Distribuição Cronológica de Ações em Blocos Mensais */}
      {chronologicalMonthGroups.length === 0 ? (
        <div className="py-8 text-center rounded-lg border border-dashed border-border/70 bg-card/50">
          <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Tudo em dia para estes filtros!
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
            Não há pendências de elaboração, revisão técnica ou homologação para o mês e perfil selecionados.
          </p>
          {(selectedRole !== "todos" || selectedMonths.length > 0) && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedRole("todos");
                  setSelectedMonths([]);
                }}
                className="h-7 text-xs"
              >
                Limpar filtros e exibir todas
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 pt-1">
          {chronologicalMonthGroups.map(group => (
            <div key={group.info.key} className="space-y-3">
              {/* Header do Mês de Cronograma */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary font-bold text-xs">
                    {group.info.monthTag ?? "🗓️"}
                  </div>
                  <h3 className="text-sm font-bold text-foreground tracking-tight">
                    {group.info.fullTitle}
                  </h3>
                  <Badge variant="secondary" className="font-mono text-[11px] px-2 py-0">
                    {group.actions.length} {group.actions.length === 1 ? "ação" : "ações"}
                  </Badge>
                </div>

                <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Ordem cronológica de execução</span>
                </div>
              </div>

              {/* Grid de Cards de Ação do Mês */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.actions.map((action: ParticipantAction) => {
                  const deadline = formatDeadlineDisplay(action.dueAt);

                  return (
                    <div
                      key={action.id}
                      className="group relative flex flex-col justify-between rounded-lg border border-border/70 bg-card p-4 transition-all hover:border-primary/50 hover:shadow-xs h-full"
                    >
                      <div className="flex-1">
                        {/* Top bar do card: Badges de Papel, Urgência e Código */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {getRoleBadge(action.role)}
                            {getUrgencyBadge(action.actionType)}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                            {action.sectionCode && (
                              <span className="font-semibold text-foreground/90">{action.sectionCode}</span>
                            )}
                            <span className="text-[10px] text-muted-foreground/80">#{action.activityId}</span>
                          </div>
                        </div>

                        {/* Indicador Cronológico do Card */}
                        <div className="mb-2">
                          <div
                            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] ${deadline.badgeClass}`}
                          >
                            <Clock className="h-3 w-3 shrink-0" />
                            <span>
                              {group.info.monthTag ? `[${group.info.monthTag}] ` : ""}
                              {deadline.text}
                            </span>
                          </div>
                        </div>

                        {/* Conteúdo textual do card */}
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors leading-snug break-words">
                            {action.activityTitle}
                          </h4>

                          <p className="text-[11px] text-muted-foreground leading-relaxed pt-0.5 break-words">
                            {action.actionDescription}
                          </p>

                          {/* Informações complementares diretas */}
                          <div className="mt-2.5 rounded-md border border-border/50 bg-muted/30 p-2 space-y-1 text-[11px]">
                            {action.actionTitle && action.actionTitle !== action.activityTitle && (
                              <div className="flex items-start gap-1.5 text-foreground text-[11px]">
                                <span className="font-semibold text-muted-foreground shrink-0">Ação:</span>
                                <span className="font-medium break-words">{action.actionTitle}</span>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-muted-foreground text-[10px] font-mono pt-0.5">
                              <span>Item #{action.activityId}</span>
                              {action.materialId && (
                                <span className="inline-flex items-center gap-1 text-sky-700 dark:text-sky-300">
                                  <FileText className="h-3 w-3" />
                                  Material #{action.materialId}
                                </span>
                              )}
                              {action.interfaceId && (
                                <span className="inline-flex items-center gap-1 text-teal-700 dark:text-teal-300">
                                  <GitMerge className="h-3 w-3" />
                                  Interface #{action.interfaceId}
                                </span>
                              )}
                            </div>

                            {typeof action.pendingCommentCount === "number" && action.pendingCommentCount > 0 && (
                              <div className="pt-0.5">
                                <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                                  <MessageSquare className="h-3 w-3" />
                                  {action.pendingCommentCount} apontamento{action.pendingCommentCount !== 1 ? "s" : ""} pendente{action.pendingCommentCount !== 1 ? "s" : ""}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Rodapé do card: Prazo e Botão de Ação Direta com alinhamento perfeito */}
                      <div className="mt-3.5 pt-3 border-t border-border/40 space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3 shrink-0" />
                            Cronograma: {deadline.formattedDate !== "—" ? deadline.formattedDate : "Sem data"}
                          </span>
                          {action.sectionCode && (
                            <span className="font-semibold text-foreground/70">{action.sectionCode}</span>
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCtaClick(action)}
                          className="w-full h-8 text-xs font-semibold px-3 rounded-md hover:bg-primary hover:text-primary-foreground transition-colors group-hover:border-primary/60 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <span>{action.ctaLabel}</span>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
