import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown,
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
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";

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

export function ParticipantActionCenter({
  onSelectActivity,
  onAssignReviewers,
}: ParticipantActionCenterProps) {
  const [isSectionOpen, setIsSectionOpen] = useState(true);
  const [selectedRole, setSelectedRole] = useState<RoleFilter>("todos");
  const [expandedActionIds, setExpandedActionIds] = useState<string[]>([]);

  const queryResult = trpc.activities?.myWorkloadActions?.useQuery
    ? trpc.activities.myWorkloadActions.useQuery(undefined, { refetchInterval: 30_000 })
    : { data: undefined, isLoading: false };
  const { data, isLoading } = queryResult;

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

  const summary = (data?.summary as any) ?? {
    total: 0,
    executorCount: 0,
    reviewerCount: 0,
    coordinatorCount: 0,
    interfaceCount: 0,
  };

  const allActions: ParticipantAction[] = (data?.actions as any) ?? [];
  const filteredActions = allActions.filter((action: ParticipantAction) => {
    if (selectedRole === "todos") return true;
    return action.role === selectedRole;
  });

  const allFilteredExpanded =
    filteredActions.length > 0 &&
    filteredActions.every((action) => expandedActionIds.includes(action.id));

  const toggleActionExpand = (actionId: string) => {
    setExpandedActionIds((prev) =>
      prev.includes(actionId) ? prev.filter((id) => id !== actionId) : [...prev, actionId]
    );
  };

  const handleToggleAllActions = () => {
    if (allFilteredExpanded) {
      setExpandedActionIds((prev) =>
        prev.filter((id) => !filteredActions.some((action) => action.id === id))
      );
    } else {
      const visibleIds = filteredActions.map((a) => a.id);
      setExpandedActionIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "executor":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
            <FileEdit className="h-3 w-3" />
            Como Autor / Executor
          </span>
        );
      case "revisor":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
            <UserCheck className="h-3 w-3" />
            Como Revisor Técnico
          </span>
        );
      case "coordenador":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:text-sky-300">
            <Users className="h-3 w-3" />
            Como Coordenador
          </span>
        );
      case "interfaces":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-teal-500/10 px-2 py-0.5 text-[11px] font-semibold text-teal-700 dark:text-teal-300">
            <GitMerge className="h-3 w-3" />
            Interface Interdisciplinar
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
    <section className="rounded-xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/20 p-4 sm:p-5 shadow-xs transition-all">
      {/* Header com título, totalizadores e botão de expandir/recolher o painel */}
      <div className={`flex flex-col gap-3 ${isSectionOpen ? "pb-4 border-b border-border/50" : ""}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setIsSectionOpen((prev) => !prev)}
              className="flex items-center gap-2 text-left group focus:outline-hidden rounded-md"
              aria-expanded={isSectionOpen}
              title={isSectionOpen ? "Recolher painel de ações" : "Expandir painel de ações"}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <Sparkles className="h-4 w-4" />
              </div>
              <h2 className="text-base font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">
                Minhas Ações no Estudo
              </h2>
            </button>
            <Badge variant="outline" className="font-mono text-xs ml-0.5 shrink-0">
              {summary.total} pendente{summary.total !== 1 ? "s" : ""}
            </Badge>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isSectionOpen && filteredActions.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleToggleAllActions}
                className="h-8 text-xs font-medium px-2.5 rounded-md gap-1.5 hidden sm:inline-flex"
                title={allFilteredExpanded ? "Recolher detalhes de todos os itens" : "Expandir detalhes de todos os itens"}
              >
                {allFilteredExpanded ? (
                  <>
                    <ChevronsDownUp className="h-3.5 w-3.5 text-muted-foreground" />
                    Recolher todos os itens
                  </>
                ) : (
                  <>
                    <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                    Expandir todos os itens
                  </>
                )}
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsSectionOpen((prev) => !prev)}
              className="h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md gap-1"
              aria-label={isSectionOpen ? "Recolher painel" : "Expandir painel"}
              title={isSectionOpen ? "Recolher painel de ações" : "Expandir painel de ações"}
            >
              <span className="hidden md:inline">{isSectionOpen ? "Recolher painel" : "Expandir painel"}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${isSectionOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Subtítulo ou resumo compactado quando fechado */}
        {isSectionOpen ? (
          <p className="text-xs text-muted-foreground">
            Ações e obrigações imediatas atribuídas ao seu usuário de acordo com suas responsabilidades no fluxo.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
            <span>Clique para expandir e ver detalhes das ações imediatas.</span>
            {summary.executorCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 font-medium text-[11px] text-emerald-700 dark:text-emerald-300">
                Autor: {summary.executorCount}
              </span>
            )}
            {summary.reviewerCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 font-medium text-[11px] text-amber-700 dark:text-amber-300">
                Revisor: {summary.reviewerCount}
              </span>
            )}
            {summary.coordinatorCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded bg-sky-500/10 px-2 py-0.5 font-medium text-[11px] text-sky-700 dark:text-sky-300">
                Coordenação: {summary.coordinatorCount}
              </span>
            )}
            {summary.interfaceCount && summary.interfaceCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded bg-teal-500/10 px-2 py-0.5 font-medium text-[11px] text-teal-700 dark:text-teal-300">
                Interfaces: {summary.interfaceCount}
              </span>
            ) : null}
          </div>
        )}

        {/* Barra de Filtros e ações rápidas (quando aberto) */}
        {isSectionOpen && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedRole("todos")}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  selectedRole === "todos"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                Todas ({summary.total})
              </button>
              {summary.executorCount > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedRole("executor")}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    selectedRole === "executor"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  Autor ({summary.executorCount})
                </button>
              )}
              {summary.reviewerCount > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedRole("revisor")}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    selectedRole === "revisor"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  Revisor ({summary.reviewerCount})
                </button>
              )}
              {summary.coordinatorCount > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedRole("coordenador")}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    selectedRole === "coordenador"
                      ? "bg-sky-600 text-white shadow-xs"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  Coordenação ({summary.coordinatorCount})
                </button>
              )}
              {summary.interfaceCount && summary.interfaceCount > 0 ? (
                <button
                  type="button"
                  onClick={() => setSelectedRole("interfaces")}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    selectedRole === "interfaces"
                      ? "bg-teal-600 text-white shadow-xs"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  Interfaces ({summary.interfaceCount})
                </button>
              ) : null}
            </div>

            {/* Ação rápida para mobile */}
            {filteredActions.length > 0 && (
              <div className="sm:hidden w-full pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleToggleAllActions}
                  className="w-full h-7 text-xs font-medium rounded-md gap-1.5 justify-center"
                >
                  {allFilteredExpanded ? (
                    <>
                      <ChevronsDownUp className="h-3.5 w-3.5" />
                      Recolher todos os itens
                    </>
                  ) : (
                    <>
                      <ChevronsUpDown className="h-3.5 w-3.5" />
                      Expandir todos os itens
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Conteúdo do Painel: Grid de Ações Pendentes ou Estado Vazio */}
      {isSectionOpen && (
        <>
          {filteredActions.length === 0 ? (
            <div className="py-7 text-center">
              <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                Tudo em dia para este perfil!
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                Você não possui ações imediatas pendentes de elaboração, revisão ou homologação neste papel.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredActions.map((action: ParticipantAction) => {
                const isExpanded = expandedActionIds.includes(action.id);

                return (
                  <div
                    key={action.id}
                    className={`group relative flex flex-col justify-between rounded-lg border bg-card p-4 transition-all ${
                      isExpanded
                        ? "border-primary/60 shadow-xs ring-1 ring-primary/20"
                        : "border-border/70 hover:border-primary/50 hover:shadow-xs"
                    }`}
                  >
                    <div>
                      {/* Top bar do card: Badges e Botão de Expandir/Recolher item */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {getRoleBadge(action.role)}
                          {getUrgencyBadge(action.actionType)}
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActionExpand(action.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded"
                          aria-label={isExpanded ? "Recolher detalhes do item" : "Expandir detalhes do item"}
                          title={isExpanded ? "Recolher detalhes do item" : "Expandir detalhes do item"}
                        >
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform duration-200 ${
                              isExpanded ? "rotate-180 text-primary" : ""
                            }`}
                          />
                        </Button>
                      </div>

                      {/* Conteúdo textual do card */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-muted-foreground">
                          {action.sectionCode && (
                            <span className="font-semibold text-foreground/80">{action.sectionCode}</span>
                          )}
                          <span className="text-[10px] text-muted-foreground/80">#{action.activityId}</span>
                        </div>

                        <h4
                          className={`text-xs font-semibold text-foreground group-hover:text-primary transition-colors ${
                            isExpanded ? "line-clamp-none" : "line-clamp-1"
                          }`}
                        >
                          {action.activityTitle}
                        </h4>

                        <p
                          className={`text-[11px] text-muted-foreground leading-relaxed pt-0.5 ${
                            isExpanded ? "line-clamp-none whitespace-pre-line" : "line-clamp-2"
                          }`}
                        >
                          {action.actionDescription}
                        </p>

                        {/* Detalhes adicionais exibidos quando o item está expandido */}
                        {isExpanded && (
                          <div className="mt-3 rounded-md border border-border/60 bg-muted/40 p-2.5 space-y-1.5 text-[11px]">
                            {action.actionTitle && action.actionTitle !== action.activityTitle && (
                              <div className="flex items-start gap-1.5 text-foreground">
                                <span className="font-semibold text-muted-foreground shrink-0">Ação:</span>
                                <span>{action.actionTitle}</span>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-[10px] font-mono pt-0.5">
                              <span>Atividade #{action.activityId}</span>
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
                              <div className="pt-1">
                                <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                                  <MessageSquare className="h-3 w-3" />
                                  {action.pendingCommentCount} apontamento{action.pendingCommentCount !== 1 ? "s" : ""} pendente{action.pendingCommentCount !== 1 ? "s" : ""}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Rodapé do card: Prazo, Toggle de detalhes e CTA */}
                    <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                          <Clock className="h-3 w-3" />
                          {action.dueAt
                            ? new Date(action.dueAt).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                              })
                            : "Sem prazo"}
                        </span>

                        <button
                          type="button"
                          onClick={() => toggleActionExpand(action.id)}
                          className="text-[10px] font-medium text-muted-foreground hover:text-primary transition-colors underline-offset-2 hover:underline truncate"
                        >
                          {isExpanded ? "Menos detalhes" : "Mais detalhes"}
                        </button>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCtaClick(action)}
                        className="h-7 text-xs font-medium px-2.5 rounded-md hover:bg-primary hover:text-primary-foreground transition-colors group-hover:border-primary/50 shrink-0"
                      >
                        {action.ctaLabel}
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}

