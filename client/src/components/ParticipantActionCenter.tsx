import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileEdit,
  FileText,
  Filter,
  GitMerge,
  Layers,
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
  const [selectedRole, setSelectedRole] = useState<RoleFilter>("todos");

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
    <section className="rounded-xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/20 p-5 shadow-xs transition-all">
      {/* Header com título e filtros por papel */}
      <div className="flex flex-col gap-3 pb-4 md:flex-row md:items-center md:justify-between border-b border-border/50">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              Minhas Ações no Estudo
            </h2>
            <Badge variant="outline" className="font-mono text-xs ml-1">
              {summary.total} pendente{summary.total !== 1 ? "s" : ""}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ações e obrigações imediatas atribuídas ao seu usuário de acordo com suas responsabilidades no fluxo.
          </p>
        </div>

        {/* Botões de Filtro */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
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
      </div>

      {/* Grid de Ações Pendentes ou Estado Vazio */}
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
          {filteredActions.map((action: ParticipantAction) => (
            <div
              key={action.id}
              className="group relative flex flex-col justify-between rounded-lg border border-border/70 bg-card p-4 hover:border-primary/50 hover:shadow-xs transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  {getRoleBadge(action.role)}
                  {getUrgencyBadge(action.actionType)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
                    {action.sectionCode && <span>{action.sectionCode}</span>}
                  </div>
                  <h4 className="text-xs font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {action.activityTitle}
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed pt-1">
                    {action.actionDescription}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {action.dueAt
                    ? new Date(action.dueAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                      })
                    : "Sem prazo"}
                </span>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCtaClick(action)}
                  className="h-7 text-xs font-medium px-2.5 rounded-md hover:bg-primary hover:text-primary-foreground transition-colors group-hover:border-primary/50"
                >
                  {action.ctaLabel}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
