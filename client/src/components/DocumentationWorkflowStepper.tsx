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
    label: "1. Minuta Inicial",
    shortLabel: "1. Minuta",
    role: "Autor / Grupo",
    description: "Elaboração e upload da minuta inicial no sistema (R01).",
    criteria: [
      "Minuta carregada no sistema",
      "Mapeamento do escopo do Anexo B",
    ],
  },
  {
    key: "indicacao_revisor",
    label: "2. Indicação de Revisor",
    shortLabel: "2. Revisor",
    role: "Prof. Floriano (Coord. Geral)",
    description: "O Prof. Floriano indica o revisor técnico independente.",
    criteria: [
      "Revisor independente indicado",
      "Revisor notificado no sistema",
    ],
  },
  {
    key: "revisao_apontamentos",
    label: "3. Revisão & Apontamentos",
    shortLabel: "3. Apontamentos",
    role: "Revisor Técnico",
    description: "Análise técnica detalhada e registro de comentários e apontamentos.",
    criteria: [
      "Análise técnica realizada",
      "Comentários e apontamentos registrados",
    ],
  },
  {
    key: "implementacao_ajustes",
    label: "4. Implementação de Ajustes",
    shortLabel: "4. Ajustes",
    role: "Autor / Grupo",
    description: "Implementação dos comentários pelo autor e envio de nova versão (R02...).",
    criteria: [
      "Atendimento aos comentários do revisor",
      "Upload da nova versão revisada",
    ],
  },
  {
    key: "aprovacao_revisor",
    label: "5. Aprovação Técnica",
    shortLabel: "5. Aprovação",
    role: "Revisor Técnico",
    description: "Validação do atendimento aos comentários e aprovação técnica.",
    criteria: [
      "Validação das respostas do autor",
      "Emissão de parecer favorável / aprovação",
    ],
  },
  {
    key: "homologacao_geral",
    label: "6. Homologação do Capítulo",
    shortLabel: "6. Homologação",
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
    <div className={cn("rounded-md border bg-card p-4 shadow-xs", className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div>
          <span className="editorial-kicker text-primary font-semibold">
            Fluxo Oficial de Gestão de Documentos
          </span>
          <p className="text-xs text-muted-foreground mt-0.5">
            Minuta inicial do autor → Indicação de revisor pelo Prof. Floriano → Comentários do revisor → Implementação pelo autor → Aprovação do revisor → Homologação pela Coordenação Geral.
          </p>
        </div>

        {(openCommentCount > 0 || implementedCommentCount > 0 || resolvedCommentCount > 0) && (
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded bg-amber-500/10 px-2 py-0.5 font-medium text-amber-700 dark:text-amber-300">
              {openCommentCount} comentário(s) aberto(s)
            </span>
            <span className="rounded bg-sky-500/10 px-2 py-0.5 font-medium text-sky-700 dark:text-sky-300">
              {implementedCommentCount} implementado(s)
            </span>
            <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-300">
              {resolvedCommentCount} aprovado(s)
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
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
                    Passo 0{stepNum}
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

                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground line-clamp-3">
                  {stage.description}
                </p>

                {showCriteria && stage.criteria && stage.criteria.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-border/50 space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Critérios:
                    </p>
                    <ul className="space-y-0.5">
                      {stage.criteria.map((crit, cIdx) => (
                        <li key={cIdx} className="text-[10px] text-muted-foreground/90 flex items-start gap-1">
                          <span className={cn("inline-block h-1.5 w-1.5 rounded-full mt-1 shrink-0", isPassed ? "bg-emerald-500" : isCurrent ? "bg-primary" : "bg-muted-foreground/40")} />
                          <span className="leading-tight">{crit}</span>
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
