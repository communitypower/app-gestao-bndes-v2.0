import React from "react";
import { CheckCircle2, CircleDot, Clock, FileEdit, FileCheck2, Send, AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type WorkflowStage =
  | "minuta"
  | "revisao"
  | "ajustes"
  | "reavaliacao"
  | "remissao"
  | "concluido";

export interface WorkflowStageInfo {
  key: WorkflowStage;
  label: string;
  shortLabel: string;
  role: string;
  description: string;
}

export const WORKFLOW_STAGES: WorkflowStageInfo[] = [
  {
    key: "minuta",
    label: "1. Minuta Inicial",
    shortLabel: "Minuta",
    role: "Autor / Executor",
    description: "Elaboração da minuta técnica e carga do arquivo no portal.",
  },
  {
    key: "revisao",
    label: "2. Revisão Técnica",
    shortLabel: "Revisão",
    role: "Revisor Técnico",
    description: "Análise técnica detalhada e registro de apontamentos.",
  },
  {
    key: "ajustes",
    label: "3. Ajustes do Autor",
    shortLabel: "Ajustes",
    role: "Autor / Executor",
    description: "Implementação das alterações e documentação das respostas.",
  },
  {
    key: "reavaliacao",
    label: "4. Validação & Parecer",
    shortLabel: "Parecer",
    role: "Revisor Técnico",
    description: "Verificação dos apontamentos atendidos e emissão de parecer favorável.",
  },
  {
    key: "remissao",
    label: "5. Remissão de Capítulo",
    shortLabel: "Remissão",
    role: "Coordenador de Capítulo",
    description: "Consolidação e homologação editorial no capítulo e tomo.",
  },
];

export function getWorkflowStage(
  documentStatus?: string | null,
  reviewStatus?: string | null,
  pendingCommentCount = 0,
  hasSubmissions = false,
  allApproved = false
): WorkflowStage {
  if (
    documentStatus === "consolidada no capítulo" ||
    documentStatus === "em revisão do tomo" ||
    documentStatus === "aprovada no tomo" ||
    documentStatus === "aprovada para documentação final"
  ) {
    return "concluido";
  }

  if (documentStatus === "revisada pela seção" || allApproved) {
    return "remissao";
  }

  if (documentStatus === "ajustes solicitados" || reviewStatus === "em elaboração" && pendingCommentCount > 0) {
    return "ajustes";
  }

  if (
    documentStatus === "submetida à revisão da seção" ||
    documentStatus === "em revisão da seção" ||
    reviewStatus === "em revisão"
  ) {
    if (pendingCommentCount > 0) {
      return "reavaliacao";
    }
    return "revisao";
  }

  if (documentStatus === "em elaboração" || hasSubmissions) {
    return "minuta";
  }

  return "minuta";
}

interface DocumentationWorkflowStepperProps {
  currentStage: WorkflowStage;
  compact?: boolean;
  className?: string;
  openCommentCount?: number;
  implementedCommentCount?: number;
  resolvedCommentCount?: number;
  onStageClick?: (stage: WorkflowStage) => void;
}

export function DocumentationWorkflowStepper({
  currentStage,
  compact = false,
  className,
  openCommentCount = 0,
  implementedCommentCount = 0,
  resolvedCommentCount = 0,
  onStageClick,
}: DocumentationWorkflowStepperProps) {
  const stageOrder: Record<WorkflowStage, number> = {
    minuta: 1,
    revisao: 2,
    ajustes: 3,
    reavaliacao: 4,
    remissao: 5,
    concluido: 6,
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
    <div className={cn("rounded-md border bg-card p-4 shadow-xs", className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div>
          <span className="editorial-kicker text-primary font-semibold">
            Ciclo de Produção & Revisão Editorial
          </span>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fluxo iterativo do autor aos revisores até a resolução completa dos apontamentos e remissão.
          </p>
        </div>

        {(openCommentCount > 0 || implementedCommentCount > 0 || resolvedCommentCount > 0) && (
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded bg-amber-500/10 px-2 py-0.5 font-medium text-amber-700 dark:text-amber-300">
              {openCommentCount} aberto(s)
            </span>
            <span className="rounded bg-sky-500/10 px-2 py-0.5 font-medium text-sky-700 dark:text-sky-300">
              {implementedCommentCount} implementado(s)
            </span>
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-300">
              {resolvedCommentCount} resolvido(s)
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {WORKFLOW_STAGES.map((stage, idx) => {
          const stepNum = idx + 1;
          const isCurrent = currentStage === stage.key;
          const isPassed = currentIndex > stepNum;

          return (
            <div
              key={stage.key}
              onClick={() => onStageClick?.(stage.key)}
              className={cn(
                "relative flex flex-col justify-between rounded-md border p-3 transition-all",
                isCurrent && "border-primary bg-primary/5 ring-1 ring-primary shadow-xs",
                isPassed && "border-muted bg-muted/30 opacity-90",
                !isCurrent && !isPassed && "border-border/60 bg-card/40 opacity-70"
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className={cn(
                    "inline-flex items-center gap-1 font-mono text-xs font-semibold uppercase tracking-wider",
                    isCurrent ? "text-primary" : isPassed ? "text-primary/70" : "text-muted-foreground"
                  )}>
                    {isPassed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : isCurrent ? (
                      <CircleDot className="h-3.5 w-3.5 text-primary animate-pulse" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    Etapa 0{stepNum}
                  </span>
                  {isCurrent && (
                    <span className="rounded-full bg-primary px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
                      Em curso
                    </span>
                  )}
                </div>

                <p className="font-editorial mt-2 text-sm font-semibold leading-tight text-foreground">
                  {stage.label.split(". ")[1]}
                </p>

                <p className="mt-1 text-[11px] font-medium text-primary/80">
                  {stage.role}
                </p>

                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                  {stage.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
