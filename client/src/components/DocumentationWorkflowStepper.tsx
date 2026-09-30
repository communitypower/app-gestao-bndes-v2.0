import React from "react";
import { CheckCircle2, CircleDot, Clock, FileEdit, FileCheck2, Send, AlertCircle, ArrowRight, UserCheck, ShieldCheck, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export type WorkflowStage =
  | "minuta"
  | "indicacao_revisor"
  | "revisao_apontamentos"
  | "implementacao_ajustes"
  | "aprovacao_revisor"
  | "homologacao_geral"
  | "concluido";

export interface WorkflowStageInfo {
  key: WorkflowStage;
  label: string;
  shortLabel: string;
  role: string;
  description: string;
  criteria?: string[];
}

export const WORKFLOW_STAGES: WorkflowStageInfo[] = [
  {
    key: "minuta",
    label: "Minuta Inicial",
    shortLabel: "Minuta",
    role: "Autor / Grupo",
    description: "Elaboração e upload da minuta inicial no sistema (R01).",
    criteria: [
      "Minuta carregada no sistema",
      "Mapeamento do escopo do Anexo B",
    ],
  },
  {
    key: "indicacao_revisor",
    label: "Indicação de Revisor",
    shortLabel: "Revisor",
    role: "Prof. Floriano (Coord. Geral)",
    description: "O Prof. Floriano indica o revisor técnico independente.",
    criteria: [
      "Revisor independente indicado",
      "Revisor notificado no sistema",
    ],
  },
  {
    key: "revisao_apontamentos",
    label: "Revisão & Apontamentos",
    shortLabel: "Apontamentos",
    role: "Revisor Técnico",
    description: "Análise técnica detalhada e registro de comentários e apontamentos.",
    criteria: [
      "Análise técnica realizada",
      "Comentários e apontamentos registrados",
    ],
  },
  {
    key: "implementacao_ajustes",
    label: "Implementação de Ajustes",
    shortLabel: "Ajustes",
    role: "Autor / Grupo",
    description: "Implementação dos comentários pelo autor e envio de nova versão (R02...).",
    criteria: [
      "Atendimento aos comentários do revisor",
      "Upload da nova versão revisada",
    ],
  },
  {
    key: "aprovacao_revisor",
    label: "Aprovação Técnica",
    shortLabel: "Aprovação",
    role: "Revisor Técnico",
    description: "Validação do atendimento aos comentários e aprovação técnica.",
    criteria: [
      "Validação das respostas do autor",
      "Emissão de parecer favorável / aprovação",
    ],
  },
  {
    key: "homologacao_geral",
    label: "Homologação do Capítulo",
    shortLabel: "Homologação",
    role: "Coordenação Geral",
    description: "Homologação final pela Coordenação Geral e consolidação no Tomo.",
    criteria: [
      "Homologação formal pela Coordenação Geral",
      "Consolidação no Tomo oficial do Estudo",
    ],
  },
];

export function getWorkflowStage(
  documentStatus?: string | null,
  reviewStatus?: string | null,
  pendingCommentCount = 0,
  hasSubmissions = false,
  allApproved = false,
  hasReviewers = false,
  implementedCommentCount = 0
): WorkflowStage {
  if (
    documentStatus === "consolidada no capítulo" ||
    documentStatus === "em revisão do tomo" ||
    documentStatus === "aprovada no tomo" ||
    documentStatus === "aprovada para documentação final"
  ) {
    return "concluido";
  }

  // Passo 6: Homologação do Capítulo (Coordenação Geral)
  if (documentStatus === "revisada pela seção" || allApproved || reviewStatus === "aprovado") {
    return "homologacao_geral";
  }

  // Passo 5: Aprovação Técnica (Revisor Técnico)
  if (
    (documentStatus === "submetida à revisão da seção" || documentStatus === "em revisão da seção" || reviewStatus === "em revisão") &&
    implementedCommentCount > 0
  ) {
    return "aprovacao_revisor";
  }

  // Passo 4: Implementação dos Comentários (Autor / Grupo)
  if (
    documentStatus === "ajustes solicitados" ||
    (reviewStatus === "em elaboração" && pendingCommentCount > 0) ||
    pendingCommentCount > 0
  ) {
    return "implementacao_ajustes";
  }

  // Passo 3: Revisão & Apontamentos (Revisor Técnico)
  if (
    hasReviewers &&
    (documentStatus === "submetida à revisão da seção" ||
      documentStatus === "em revisão da seção" ||
      reviewStatus === "em revisão")
  ) {
    return "revisao_apontamentos";
  }

  // Passo 2: Indicação de Revisor pelo Prof. Floriano
  if (hasSubmissions || reviewStatus === "em elaboração" || documentStatus === "submetida à revisão da seção") {
    if (!hasReviewers) {
      return "indicacao_revisor";
    }
  }

  // Passo 1: Minuta Inicial (Autor / Grupo)
  return "minuta";
}

interface DocumentationWorkflowStepperProps {
  currentStage: WorkflowStage;
  compact?: boolean;
  className?: string;
  openCommentCount?: number;
  implementedCommentCount?: number;
  resolvedCommentCount?: number;
  showCriteria?: boolean;
  onStageClick?: (stage: WorkflowStage) => void;
}

export function DocumentationWorkflowStepper({
  currentStage,
  compact = false,
  className,
  openCommentCount = 0,
  implementedCommentCount = 0,
  resolvedCommentCount = 0,
  showCriteria = false,
  onStageClick,
}: DocumentationWorkflowStepperProps) {
  const stageOrder: Record<WorkflowStage, number> = {
    minuta: 1,
    indicacao_revisor: 2,
    revisao_apontamentos: 3,
    implementacao_ajustes: 4,
    aprovacao_revisor: 5,
    homologacao_geral: 6,
    concluido: 7,
  };

  const currentIndex = stageOrder[currentStage] ?? 1;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1.5 overflow-x-auto py-1 text-xs", className)}>
        {WORKFLOW_STAGES.map((stage, idx) => {
          const stepNum = idx + 1;
          const isCurrent = currentStage === stage.key;
          const isPassed = currentIndex > stepNum;

          return (
            <React.Fragment key={stage.key}>
              <div
                onClick={() => onStageClick?.(stage.key)}
                className={cn(
                  "flex items-center gap-1 rounded-sm px-2 py-1 font-medium transition-colors shrink-0",
                  isCurrent && "bg-primary text-primary-foreground font-semibold shadow-xs",
                  isPassed && "bg-primary/15 text-primary",
                  !isCurrent && !isPassed && "bg-muted/70 text-muted-foreground"
                )}
              >
                {isPassed ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : isCurrent ? (
                  <CircleDot className="h-3 w-3 animate-pulse" />
                ) : (
                  <span className="font-mono text-[10px]">{stepNum}</span>
                )}
                <span>{stage.shortLabel}</span>
              </div>
              {idx < WORKFLOW_STAGES.length - 1 && (
                <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/50 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border bg-card/60 p-4 sm:p-5 shadow-xs space-y-4", className)}>
      {/* Top Header: Título e Badges de Comentários */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div>
          <span className="editorial-kicker text-primary font-bold tracking-wider text-[11px] uppercase">
            Fluxo Oficial de Gestão Documental
          </span>
          <p className="text-xs text-muted-foreground mt-0.5">
            Minuta inicial (R01) → Indicação de revisor (Prof. Floriano) → Parecer técnico → Ajustes (R02+) → Aprovação → Homologação no Tomo.
          </p>
        </div>

        {(openCommentCount > 0 || implementedCommentCount > 0 || resolvedCommentCount > 0) && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {openCommentCount > 0 && (
              <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 font-semibold text-amber-700 dark:text-amber-300">
                {openCommentCount} apontamento(s) pendente(s)
              </span>
            )}
            {implementedCommentCount > 0 && (
              <span className="rounded-full bg-sky-500/15 border border-sky-500/30 px-2.5 py-0.5 font-semibold text-sky-700 dark:text-sky-300">
                {implementedCommentCount} ajustado(s)
              </span>
            )}
            {resolvedCommentCount > 0 && (
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 font-semibold text-emerald-700 dark:text-emerald-300">
                {resolvedCommentCount} aprovado(s)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Barra de Progresso Horizontal Conectada */}
      <div className="hidden sm:flex items-center justify-between gap-1 overflow-x-auto py-1 px-1">
        {WORKFLOW_STAGES.map((stage, idx) => {
          const stepNum = idx + 1;
          const isCurrent = currentStage === stage.key;
          const isPassed = currentIndex > stepNum;

          return (
            <React.Fragment key={stage.key}>
              <button
                type="button"
                onClick={() => onStageClick?.(stage.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all shrink-0 cursor-pointer text-left",
                  isCurrent && "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary",
                  isPassed && "bg-primary/10 text-primary hover:bg-primary/20",
                  !isCurrent && !isPassed && "bg-muted/40 text-muted-foreground/70 hover:bg-muted/70"
                )}
              >
                {isPassed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                ) : isCurrent ? (
                  <CircleDot className="h-3.5 w-3.5 text-primary-foreground animate-pulse shrink-0" />
                ) : (
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-muted-foreground/20 text-[10px] font-mono font-bold shrink-0">
                    {stepNum}
                  </span>
                )}
                <span className="truncate">{stage.shortLabel}</span>
              </button>
              {idx < WORKFLOW_STAGES.length - 1 && (
                <div className={cn(
                  "h-[2px] flex-1 min-w-[12px] transition-colors",
                  isPassed ? "bg-primary/40" : "bg-muted"
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Grid de 6 Caixas em 3 Colunas (com espaço folgado para os textos) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {WORKFLOW_STAGES.map((stage, idx) => {
          const stepNum = idx + 1;
          const isCurrent = currentStage === stage.key;
          const isPassed = currentIndex > stepNum;

          return (
            <div
              key={stage.key}
              onClick={() => onStageClick?.(stage.key)}
              className={cn(
                "relative flex flex-col justify-between rounded-lg border p-3.5 transition-all cursor-pointer",
                isCurrent && "border-primary bg-primary/5 ring-1.5 ring-primary/40 shadow-sm",
                isPassed && "border-border/70 bg-muted/20 opacity-90 hover:opacity-100",
                !isCurrent && !isPassed && "border-border/50 bg-card/30 opacity-70 hover:opacity-90"
              )}
            >
              <div>
                {/* Header do Passo */}
                <div className="flex items-center justify-between gap-2">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider",
                    isCurrent ? "text-primary" : isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                  )}>
                    {isPassed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    ) : isCurrent ? (
                      <CircleDot className="h-3.5 w-3.5 text-primary animate-pulse shrink-0" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    Passo 0{stepNum}
                  </span>

                  {isCurrent ? (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-xs">
                      Em curso
                    </span>
                  ) : isPassed ? (
                    <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold">
                      Concluído
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[10px] font-medium">
                      Pendente
                    </span>
                  )}
                </div>

                {/* Título do Passo */}
                <p className="mt-2 text-sm font-bold text-foreground leading-snug break-words">
                  {stage.label}
                </p>

                {/* Papel / Responsável */}
                <div className="mt-1 flex items-center gap-1">
                  <span className="inline-block rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary break-words">
                    {stage.role}
                  </span>
                </div>

                {/* Descrição Completa (Sem corte/clamp) */}
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground break-words">
                  {stage.description}
                </p>

                {showCriteria && stage.criteria && stage.criteria.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-border/50 space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Critérios:
                    </p>
                    <ul className="space-y-1">
                      {stage.criteria.map((crit, cIdx) => (
                        <li key={cIdx} className="text-[11px] text-muted-foreground/90 flex items-start gap-1.5">
                          <span className={cn("inline-block h-1.5 w-1.5 rounded-full mt-1.5 shrink-0", isPassed ? "bg-emerald-500" : isCurrent ? "bg-primary" : "bg-muted-foreground/40")} />
                          <span className="leading-tight break-words">{crit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
