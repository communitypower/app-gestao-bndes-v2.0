import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import ActivityAccessGate from "@/components/ActivityAccessGate";
import {
  PageHeader,
  SectionMark,
  StatusBadge,
} from "@/components/EditorialUI";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { formatDate, fileSize } from "@/lib/format";
import { fileToBase64 } from "@/lib/files";
import {
  ACTIVITY_STATUSES,
  studyTomeFromCode,
  type ActivityStatus,
} from "@shared/domain";
import { ParticipantActionCenter } from "@/components/ParticipantActionCenter";
import {
  AlertTriangle,
  Bot,
  BrainCircuit,
  Briefcase,
  CalendarDays,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Crown,
  Download,
  FileText,
  FileUp,
  GitMerge,
  History,
  Layers,
  Lightbulb,
  Lock,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserRoundCheck,
  Users,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

type ActivityItem = inferRouterOutputs<AppRouter>["activities"]["list"][number];

const DOCUMENT_STATUS_LABELS = {
  "planejada": "Planejada",
  "em elaboração": "Em elaboração",
  "submetida à revisão da seção": "Submetida à revisão da seção",
  "em revisão da seção": "Em revisão da seção",
  "ajustes solicitados": "Ajustes solicitados",
  "revisada pela seção": "Revisada pela seção",
  "consolidada no capítulo": "Consolidada no capítulo",
  "em revisão do tomo": "Em revisão do tomo",
  "aprovada no tomo": "Aprovada no tomo",
  "em revisão do projeto": "Em revisão do projeto",
  "aprovada para documentação final": "Aprovada para documentação final",
} as const;

const DOCUMENT_NEXT_STATUSES = {
  "planejada": ["em elaboração"],
  "em elaboração": ["submetida à revisão da seção"],
  "submetida à revisão da seção": ["em revisão da seção", "em elaboração"],
  "em revisão da seção": ["ajustes solicitados", "revisada pela seção"],
  "ajustes solicitados": ["em elaboração"],
  "revisada pela seção": ["consolidada no capítulo"],
  "consolidada no capítulo": ["em revisão do tomo"],
  "em revisão do tomo": ["aprovada no tomo", "ajustes solicitados"],
  "aprovada no tomo": ["em revisão do projeto"],
  "em revisão do projeto": ["aprovada para documentação final", "ajustes solicitados"],
  "aprovada para documentação final": [],
} as const;

const acceptedFileExtensions =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.odt,.ods,.odp";

function toDateInputValue(value: number | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function parseDateInput(value: string): number | null {
  if (!value) return null;
  const parts = value.split("-");
  if (parts.length !== 3) return null;
  return new Date(`${value}T12:00:00Z`).getTime();
}

/**
 * Ficha da Atividade (ActivityDetailDialog)
 * Hub unificado e definitivo do capítulo para controle documental, prazos e workflow.
 */
function ActivityDetailDialog({
  activityId,
  onOpenChange,
  isAdmin,
  startInEditMode = false,
}: {
  activityId: number | null;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
  startInEditMode?: boolean;
}) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.activities.detail.useQuery(
    { id: activityId ?? 1 },
    { enabled: activityId !== null }
  );

  // Mutações de controle
  const updateQuickInfo = trpc.activities.updateQuickInfo.useMutation();
  const updateDocumentStatus = trpc.activities.updateDocumentStatus.useMutation();
  const updateReviewChecklistItem = trpc.activities.updateReviewChecklistItem.useMutation();
  const initializeReviewChecklist = trpc.activities.initializeReviewChecklist.useMutation();
  const updateReviewers = trpc.activities.updateReviewers.useMutation();
  const applyAIChecklist = trpc.activities.applyAIChecklistSuggestions.useMutation();
  const createMaterial = trpc.production.create.useMutation();
  const addRevision = trpc.production.addRevision.useMutation();
  const submitForReview = trpc.production.submitForReview.useMutation();
  const addComment = trpc.production.addComment.useMutation();
  const registerReviewDecision = trpc.production?.reviewDecision?.useMutation
    ? trpc.production.reviewDecision.useMutation()
    : ({ mutateAsync: async () => {}, isPending: false } as any);

  // Estados de IA para Avaliação do Workflow e Checklist de Revisão
  const [aiEvaluation, setAiEvaluation] = useState<any | null>(null);
  const [isEvaluatingAI, setIsEvaluatingAI] = useState(false);
  const [expandedDiagnosticKey, setExpandedDiagnosticKey] = useState<string | null>(null);
  const [showAICriteria, setShowAICriteria] = useState(false);
  const [isDraftingParecerAI, setIsDraftingParecerAI] = useState(false);

  // Estados de Edição Rápida
  const [isEditingInfo, setIsEditingInfo] = useState(startInEditMode);
  const [draftStatus, setDraftStatus] = useState<ActivityStatus>("pendente");
  const [draftStartDate, setDraftStartDate] = useState("");
  const [draftDueDate, setDraftDueDate] = useState("");
  const [draftActualStartDate, setDraftActualStartDate] = useState("");
  const [draftActualDueDate, setDraftActualDueDate] = useState("");
  const [draftNextStep, setDraftNextStep] = useState("");
  const [draftDescription, setDraftDescription] = useState("");

  const updateAllocations = trpc.activities.updateAllocations.useMutation();
  const decideCrossGroupAllocation = trpc.activities.decideCrossGroupAllocation.useMutation();

  // Estados de Gestão de Executores (Atribuição e Alteração pelo Coordenador da Seção)
  const [allocModalOpen, setAllocModalOpen] = useState(false);
  const [allocTargetId, setAllocTargetId] = useState<number | null>(null);
  const [allocTargetTitle, setAllocTargetTitle] = useState("");
  const [currentAllocationsDraft, setCurrentAllocationsDraft] = useState<
    Array<{
      teamMemberId: number;
      memberName?: string;
      memberTitle?: string;
      institution?: string;
      allocatedHours: number;
      responsibility: string;
      isExecutionLead: boolean;
    }>
  >([]);
  const [newAllocMemberId, setNewAllocMemberId] = useState("");
  const [newAllocHours, setNewAllocHours] = useState("20");
  const [newAllocResponsibility, setNewAllocResponsibility] = useState("Elaboração técnica e condução da etapa");
  const [newAllocIsLead, setNewAllocIsLead] = useState(false);
  const [leadershipChangeJustification, setLeadershipChangeJustification] = useState("");

  // Estados de Upload de Material (Primeira Versão R01)
  const [uploadOpen, setUploadOpen] = useState(false);
  const [materialTitle, setMaterialTitle] = useState("");
  const [materialDescription, setMaterialDescription] = useState("");
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [materialNotes, setMaterialNotes] = useState("");

  // Estados de Carregamento de Nova Revisão (R02, R03...)
  const [revisionModalMaterial, setRevisionModalMaterial] = useState<any | null>(null);
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [revisionAutoSubmit, setRevisionAutoSubmit] = useState(true);
  const [expandedHistoryMaterialId, setExpandedHistoryMaterialId] = useState<number | null>(null);

  // Estados de Apontamento / Comentário e Decisão de Revisão
  const [commentingMaterialId, setCommentingMaterialId] = useState<number | null>(null);
  const [commentContent, setCommentContent] = useState("");
  const [commentType, setCommentType] = useState<"comentário" | "solicitação de ajuste">("comentário");
  const [reviewDecisionMaterialId, setReviewDecisionMaterialId] = useState<number | null>(null);
  const [reviewDecisionNote, setReviewDecisionNote] = useState("");

  // Estados de Workflow
  const [nextDocumentStatus, setNextDocumentStatus] = useState<keyof typeof DOCUMENT_STATUS_LABELS | "">("");

  // Sincronizar dados ao abrir/carregar
  useEffect(() => {
    if (!data) return;
    setDraftStatus(data.status);
    setDraftStartDate(toDateInputValue(data.startAt));
    setDraftDueDate(toDateInputValue(data.dueAt));
    setDraftActualStartDate(toDateInputValue(data.actualStartAt));
    setDraftActualDueDate(toDateInputValue(data.actualEndAt));
    setDraftNextStep(data.nextStep ?? "");
    setDraftDescription(data.description ?? "");
    setNextDocumentStatus(DOCUMENT_NEXT_STATUSES[data.documentStatus]?.[0] ?? "");
    setIsEditingInfo(startInEditMode);
  }, [data?.id, startInEditMode]);

  const canManage = Boolean(isAdmin || data?.canManageAllocations || data?.isCoordinator);

  // Abrir Modal de Gestão de Executores
  const handleOpenAllocModal = (targetId: number, targetTitle: string, existingAllocations?: any[]) => {
    setAllocTargetId(targetId);
    setAllocTargetTitle(targetTitle);
    const existing = (existingAllocations ?? []).map(a => ({
      teamMemberId: a.teamMemberId,
      memberName: a.memberName,
      memberTitle: a.memberTitle,
      institution: a.institution,
      allocatedHours: a.allocatedHours || 20,
      responsibility: a.responsibility || "Elaboração técnica e condução da etapa",
      isExecutionLead: Boolean(a.isExecutionLead),
    }));
    setCurrentAllocationsDraft(existing);
    setNewAllocMemberId("");
    setNewAllocHours("20");
    setNewAllocResponsibility("Elaboração técnica e condução da etapa");
    setNewAllocIsLead(existing.length === 0);
    setLeadershipChangeJustification("");
    setAllocModalOpen(true);
  };

  // Adicionar ou Atualizar Executor no Rascunho
  const handleAddOrUpdateDraftAllocation = () => {
    if (!newAllocMemberId) {
      toast.error("Selecione um integrante da equipe para associar.");
      return;
    }
    const memberId = Number(newAllocMemberId);
    const hours = Math.max(1, Number(newAllocHours) || 1);
    const memberObj =
      (data?.thematicMembers ?? []).find((m: any) => m.id === memberId) ||
      (data?.eligibleParticipants ?? []).find((m: any) => m.id === memberId);

    const isFirst = currentAllocationsDraft.length === 0;
    const shouldBeLead = newAllocIsLead || isFirst;

    const updated = currentAllocationsDraft
      .filter(a => a.teamMemberId !== memberId)
      .map(a => (shouldBeLead ? { ...a, isExecutionLead: false } : a));

    updated.push({
      teamMemberId: memberId,
      memberName: memberObj?.name || `Integrante ${memberId}`,
      memberTitle: memberObj?.title || "",
      institution: memberObj?.institution || "",
      allocatedHours: hours,
      responsibility: newAllocResponsibility.trim() || "Elaboração técnica e condução da etapa",
      isExecutionLead: shouldBeLead,
    });

    setCurrentAllocationsDraft(updated);
    setNewAllocMemberId("");
    setNewAllocHours("20");
    setNewAllocResponsibility("Elaboração técnica e condução da etapa");
    setNewAllocIsLead(false);
  };

  // Remover Executor do Rascunho
  const handleRemoveDraftAllocation = (memberId: number) => {
    const nextDraft = currentAllocationsDraft.filter(a => a.teamMemberId !== memberId);
    if (nextDraft.length > 0 && !nextDraft.some(a => a.isExecutionLead)) {
      nextDraft[0].isExecutionLead = true;
    }
    setCurrentAllocationsDraft(nextDraft);
  };

  // Alternar Líder no Rascunho
  const handleSetLeadInDraft = (memberId: number) => {
    setCurrentAllocationsDraft(prev =>
      prev.map(a => ({
        ...a,
        isExecutionLead: a.teamMemberId === memberId,
      }))
    );
  };

  // Salvar Alocações de Execução no Servidor
  const handleSaveAllocations = async () => {
    if (!allocTargetId) return;
    try {
      await updateAllocations.mutateAsync({
        id: allocTargetId,
        allocations: currentAllocationsDraft.map(a => ({
          teamMemberId: a.teamMemberId,
          allocatedHours: a.allocatedHours,
          responsibility: a.responsibility,
          isExecutionLead: a.isExecutionLead,
        })),
        leadershipChangeJustification: leadershipChangeJustification.trim() || undefined,
      });
      await Promise.all([
        utils.activities.detail.invalidate({ id: activityId ?? 1 }),
        utils.activities.list.invalidate(),
        utils.activities.myWorkloadActions.invalidate(),
        utils.dashboard.overview.invalidate(),
      ]);
      setAllocModalOpen(false);
      toast.success("✅ Atribuição de executores atualizada com sucesso pelo coordenador da seção.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar atribuição de executores.");
    }
  };

  // Decidir Autorização de Alocação Intergrupos (Prof. Floriano / Coordenação Geral / Admin)
  const handleDecideCrossGroupAllocation = async (allocationId: number, decision: "aprovar" | "rejeitar", memberName?: string) => {
    try {
      await decideCrossGroupAllocation.mutateAsync({
        allocationId,
        decision,
      });
      await Promise.all([
        utils.activities.detail.invalidate({ id: activityId ?? 1 }),
        utils.activities.list.invalidate(),
        utils.activities.myWorkloadActions.invalidate(),
        utils.dashboard.overview.invalidate(),
      ]);
      toast.success(
        decision === "aprovar"
          ? `✅ Alocação de ${memberName || "integrante"} autorizada com sucesso pela Coordenação Geral (Prof. Floriano).`
          : `⚠️ Alocação de ${memberName || "integrante"} recusada.`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao processar decisão de autorização.");
    }
  };

  // Salvar Informações Básicas
  const handleSaveQuickInfo = async () => {
    if (!activityId) return;
    try {
      await updateQuickInfo.mutateAsync({
        id: activityId,
        status: draftStatus,
        startAt: parseDateInput(draftStartDate),
        dueAt: parseDateInput(draftDueDate) ?? data?.dueAt ?? Date.now(),
        actualStartAt: parseDateInput(draftActualStartDate),
        actualEndAt: parseDateInput(draftActualDueDate),
        nextStep: draftNextStep,
        description: draftDescription.trim().length >= 3 ? draftDescription.trim() : undefined,
      });
      await Promise.all([
        utils.activities.detail.invalidate({ id: activityId }),
        utils.activities.list.invalidate(),
        utils.dashboard.overview.invalidate(),
      ]);
      setIsEditingInfo(false);
      toast.success("Informações do capítulo atualizadas com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar informações.");
    }
  };

  // Upload de Primeiro Documento (R01)
  const handleUploadMaterial = async () => {
    if (!activityId || !data || !materialTitle || !materialFile) {
      toast.error("Informe o título e selecione o arquivo do documento.");
      return;
    }
    try {
      await createMaterial.mutateAsync({
        title: materialTitle,
        description: materialDescription || null,
        activityId: data.id,
        sectionId: data.sectionId,
        notes: materialNotes || null,
        file: {
          fileName: materialFile.name,
          mimeType: materialFile.type || "application/octet-stream",
          fileSize: materialFile.size,
          base64: await fileToBase64(materialFile),
        },
      });
      await Promise.all([
        utils.activities.detail.invalidate({ id: activityId }),
        utils.production.list.invalidate(),
        utils.activities.list.invalidate(),
      ]);
      setUploadOpen(false);
      setMaterialTitle("");
      setMaterialDescription("");
      setMaterialNotes("");
      setMaterialFile(null);
      toast.success("Documento anexado com sucesso e disponibilizado para a equipe.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar documento.");
    }
  };

  // Upload de Nova Revisão (R02, R03...)
  const handleUploadRevision = async () => {
    if (!revisionModalMaterial || !revisionFile) {
      toast.error("Selecione o arquivo da nova revisão.");
      return;
    }
    try {
      await addRevision.mutateAsync({
        materialId: revisionModalMaterial.id,
        notes: revisionNotes || null,
        autoSubmit: revisionAutoSubmit,
        file: {
          fileName: revisionFile.name,
          mimeType: revisionFile.type || "application/octet-stream",
          fileSize: revisionFile.size,
          base64: await fileToBase64(revisionFile),
        },
      });
      await Promise.all([
        utils.activities.detail.invalidate({ id: activityId ?? 1 }),
        utils.production.list.invalidate(),
        utils.activities.list.invalidate(),
        utils.activities.myWorkloadActions.invalidate(),
      ]);
      const nextRevNum = revisionModalMaterial.currentRevision + 1;
      setRevisionModalMaterial(null);
      setRevisionFile(null);
      setRevisionNotes("");
      setRevisionAutoSubmit(true);
      toast.success(
        `Nova Revisão R0${nextRevNum} anexada com sucesso${
          revisionAutoSubmit ? " e submetida para avaliação dos revisores" : ""
        }.`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar nova revisão.");
    }
  };

  // Submissão para Revisão
  const handleSubmitReview = async (materialId: number) => {
    try {
      await submitForReview.mutateAsync({
        materialId,
        message: "Versão submetida para revisão técnica da coordenação e pares.",
      });
      await Promise.all([
        utils.activities.detail.invalidate({ id: activityId ?? 1 }),
        utils.production.list.invalidate(),
      ]);
      toast.success("Documento submetido para a etapa de revisão.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao submeter para revisão.");
    }
  };

  // Enviar Comentário / Apontamento
  const handleSendComment = async (materialId: number) => {
    if (!commentContent.trim()) return;
    try {
      await addComment.mutateAsync({
        materialId,
        submissionId: null,
        content: commentContent.trim(),
        commentType,
      });
      await Promise.all([
        utils.activities.detail.invalidate({ id: activityId ?? 1 }),
        utils.production.list.invalidate(),
      ]);
      setCommentContent("");
      setCommentingMaterialId(null);
      toast.success("Apontamento registrado com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar apontamento.");
    }
  };

  // Emitir Parecer do Revisor Técnico
  const handleReviewDecision = async (
    materialId: number,
    decision: "aprovado" | "ajustes solicitados",
    note?: string
  ) => {
    try {
      await registerReviewDecision.mutateAsync({
        materialId,
        activityId: data?.id,
        decision,
        note: note || (decision === "aprovado" ? "Minuta técnica aprovada." : "Ajustes necessários."),
      });
      await Promise.all([
        utils.activities.detail.invalidate({ id: activityId ?? 1 }),
        utils.activities.list.invalidate(),
        utils.activities.myWorkloadActions.invalidate(),
        utils.production.list.invalidate(),
        utils.dashboard.overview.invalidate(),
      ]);
      setReviewDecisionMaterialId(null);
      setReviewDecisionNote("");
      toast.success(
        decision === "aprovado"
          ? "✅ Parecer favorável registrado! Minuta técnica aprovada com sucesso."
          : "✏️ Solicitação de ajustes registrada e notificada ao autor."
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao registrar parecer.");
    }
  };

  // Avançar Workflow Documental
  const handleAdvanceWorkflow = async () => {
    if (!activityId || !nextDocumentStatus) return;
    try {
      await updateDocumentStatus.mutateAsync({
        id: activityId,
        nextStatus: nextDocumentStatus,
      });
      await Promise.all([
        utils.activities.detail.invalidate({ id: activityId }),
        utils.activities.list.invalidate(),
        utils.dashboard.overview.invalidate(),
      ]);
      toast.success(`Workflow atualizado para "${DOCUMENT_STATUS_LABELS[nextDocumentStatus]}".`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar workflow.");
    }
  };

  // Atualizar Item do Checklist
  const handleChecklistStatus = async (
    itemId: number,
    status: "pendente" | "em andamento" | "concluído" | "bloqueado"
  ) => {
    if (!activityId) return;
    try {
      await updateReviewChecklistItem.mutateAsync({ id: itemId, status });
      await utils.activities.detail.invalidate({ id: activityId });
      toast.success("Status do checklist atualizado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar checklist.");
    }
  };

  // Designar / Alternar Revisor Técnico
  const handleToggleReviewer = async (memberId: number, memberName: string) => {
    if (!activityId || !data) return;
    if (memberId === data.responsibleId) {
      toast.error("O autor / coordenador responsável não pode ser o revisor do próprio capítulo.");
      return;
    }
    const currentReviewerIds: number[] = data.reviewers?.map((r: any) => r.teamMemberId) ?? [];
    const isAlreadyReviewer = currentReviewerIds.includes(memberId);
    const newReviewerIds = isAlreadyReviewer
      ? currentReviewerIds.filter((id: number) => id !== memberId)
      : [...currentReviewerIds, memberId];

    try {
      await updateReviewers.mutateAsync({
        id: activityId,
        reviewerIds: newReviewerIds,
      });
      await Promise.all([
        utils.activities.detail.invalidate({ id: activityId }),
        utils.activities.list.invalidate(),
        utils.activities.myWorkloadActions.invalidate(),
        utils.production.list.invalidate(),
      ]);
      toast.success(
        isAlreadyReviewer
          ? `${memberName} removido dos revisores técnicos.`
          : `🔍 ${memberName} apontado como revisor técnico do material.`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar revisores.");
    }
  };

  // Executar Avaliação Técnica com Inteligência Artificial
  const handleRunAIEvaluation = async () => {
    if (!activityId) return;
    setIsEvaluatingAI(true);
    try {
      const result = await utils.activities.aiReviewEvaluation.fetch({
        activityId,
        materialId: data?.productionMaterials?.[0]?.id ?? null,
      });
      setAiEvaluation(result);
      setShowAICriteria(true);
      toast.success("🤖 Avaliação técnica com IA concluída com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao executar avaliação com IA.");
    } finally {
      setIsEvaluatingAI(false);
    }
  };

  // Aplicar Sugestões da IA nos Itens do Checklist
  const handleApplyAISuggestions = async () => {
    if (!activityId || !aiEvaluation?.checklistDiagnostics) return;
    try {
      const itemsToApply = aiEvaluation.checklistDiagnostics.map((d: any) => ({
        itemKey: d.itemKey,
        status: d.recommendedStatus,
        reason: d.analysis,
      }));
      await applyAIChecklist.mutateAsync({
        activityId,
        items: itemsToApply,
      });
      await utils.activities.detail.invalidate({ id: activityId });
      toast.success("✨ Checklist de revisão atualizado com base nas recomendações da IA.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao aplicar sugestões da IA.");
    }
  };

  // Gerar Minuta de Parecer Técnico com IA
  const handleGenerateAIParecerDraft = async (
    materialId: number,
    decisionType: "aprovado" | "ajustes solicitados" = "aprovado"
  ) => {
    if (!activityId) return;
    setIsDraftingParecerAI(true);
    try {
      const draft = await utils.activities.generateAIParecerDraft.fetch({
        activityId,
        materialId,
        decisionType,
      });
      setReviewDecisionMaterialId(materialId);
      setReviewDecisionNote(draft.text);
      toast.success("🤖 Minuta de parecer técnico gerada pela IA.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao gerar parecer com IA.");
    } finally {
      setIsDraftingParecerAI(false);
    }
  };

  return (
    <Dialog open={activityId !== null} onOpenChange={open => onOpenChange(open)}>
      <DialogContent className="max-h-[92vh] overflow-y-auto bg-card sm:max-w-4xl p-6 sm:p-8">
        {/* 1. Cabeçalho Executivo e Identificação */}
        <DialogHeader className="border-b paper-rule pb-5 text-left">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                Ficha da Atividade
              </span>
              {data && (
                <>
                  <SectionMark code={data.planCode ?? data.sectionCode} />
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                    {studyTomeFromCode(data.sectionCode)}
                  </span>
                  <StatusBadge status={data.status} />
                </>
              )}
            </div>
            {canManage && !isEditingInfo && data && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditingInfo(true)}
                className="h-8 gap-1.5 text-xs"
              >
                <Pencil className="h-3.5 w-3.5 text-primary" />
                Editar Informações
              </Button>
            )}
          </div>

          <DialogTitle className="font-display mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {data ? data.title : "Ficha da Atividade"}
          </DialogTitle>

          {data && (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5" title="O autor formal no sistema é o coordenador do grupo. A gestão interna de tarefas é conduzida por cada grupo.">
                <UserRoundCheck className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">Autor / Coordenador: {data.responsibleName}</span>
                <span>({data.responsibleTitle} · {data.institution})</span>
              </div>
              {data.groupName && (
                <div className="flex items-center gap-1.5 border-l pl-3">
                  <span className="font-medium text-foreground">Grupo: {data.groupName}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 border-l pl-3">
                {isAdmin ? (
                  <Badge variant="outline" className="border-purple-500/40 bg-purple-500/10 text-purple-800 dark:text-purple-200 text-[10px] font-semibold">
                    🛡️ Administrador do Sistema
                  </Badge>
                ) : data.isCoordinator ? (
                  <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-[10px] font-semibold">
                    👑 Seu papel: Autor / Coordenador Responsável
                  </Badge>
                ) : data.isReviewer ? (
                  <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold shadow-2xs">
                    🔍 Seu papel: Revisor Técnico Designado
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">
                    👥 Participante da Equipe
                  </Badge>
                )}
              </div>
            </div>
          )}
        </DialogHeader>

        {isLoading || !data ? (
          <div className="py-20 text-center text-sm text-muted-foreground animate-pulse">
            Carregando Ficha da Atividade…
          </div>
        ) : (
          <div className="space-y-6">

            {/* PAINEL EXCLUSIVO DO REVISOR TÉCNICO DESIGNADO */}
            {data.isReviewer && (() => {
              const activeReviewMaterial =
                data.productionMaterials?.find(
                  (m: any) =>
                    m.reviewStatus === "em revisão" ||
                    m.activeSubmission?.status === "em revisão"
                ) ?? data.productionMaterials?.[0];
              const activeLatestRevision =
                activeReviewMaterial?.revisions?.[
                  activeReviewMaterial.revisions.length - 1
                ];

              return (
                <section className="rounded-xl border-2 border-primary/40 bg-gradient-to-br from-primary/10 via-primary/5 to-card p-5 space-y-4 shadow-sm animate-in fade-in-50">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-primary/20 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-2xs">
                        <UserRoundCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-foreground">
                            Painel do Revisor Técnico Designado
                          </h3>
                          <Badge className="bg-primary text-primary-foreground text-[10px] font-bold">
                            🔍 Sua Revisão
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Você foi apontado para realizar a avaliação técnica independente deste capítulo e emitir seu parecer.
                        </p>
                      </div>
                    </div>

                    {/* Botão de Auditoria Técnica com IA */}
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleRunAIEvaluation}
                      disabled={isEvaluatingAI}
                      className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground font-semibold shadow-xs"
                    >
                      {isEvaluatingAI ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Executando Auditoria com IA…
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                          {aiEvaluation ? "Reavaliar Minuta com IA" : "Auditar Minuta com IA"}
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Card do Documento Sob Revisão */}
                  {activeReviewMaterial ? (
                    <div className="rounded-lg border border-primary/30 bg-card/90 p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Documento a ser Revisado:
                            </span>
                            <span className="font-bold text-sm text-foreground">
                              {activeReviewMaterial.title}
                            </span>
                            <Badge variant="outline" className="font-mono text-[10px] font-bold border-primary/50 bg-primary/10 text-primary">
                              Revisão R0{activeReviewMaterial.currentRevision}
                            </Badge>
                            {activeReviewMaterial.reviewStatus === "em revisão" ? (
                              <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-[10px] font-semibold">
                                ⏳ Aguardando Seu Parecer
                              </Badge>
                            ) : activeReviewMaterial.reviewStatus === "aprovado" ? (
                              <Badge className="bg-emerald-600 text-white text-[10px] font-semibold">
                                ✅ Minuta Aprovada
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-[10px] font-semibold">
                                ✏️ Ajustes Solicitados
                              </Badge>
                            )}
                          </div>

                          {activeLatestRevision && (
                            <p className="text-[11px] text-muted-foreground">
                              Arquivo: <strong>{activeLatestRevision.fileName}</strong> ({fileSize(activeLatestRevision.fileSize)})
                              {activeLatestRevision.notes && (
                                <span className="italic"> — Notas do autor: "{activeLatestRevision.notes}"</span>
                              )}
                            </p>
                          )}
                        </div>

                        {/* Botão de Download Direto do Arquivo */}
                        {activeLatestRevision?.storageUrl && (
                          <a
                            href={activeLatestRevision.storageUrl}
                            target="_blank"
                            rel="noreferrer"
                            download={activeLatestRevision.fileName}
                            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors shrink-0"
                          >
                            <Download className="h-4 w-4" />
                            Baixar R0{activeReviewMaterial.currentRevision} para Análise
                          </a>
                        )}
                      </div>

                      {/* Bloco de Decisão do Revisor no Painel */}
                      <div className="pt-2 border-t border-border/60 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                            Registrar Decisão da Revisão Técnica:
                          </span>
                        </div>

                        {/* Formulário de Parecer / Ajustes com Suporte a IA */}
                        {reviewDecisionMaterialId === activeReviewMaterial.id ? (
                          <div className="space-y-2.5 rounded-md border border-primary/30 bg-primary/5 p-3.5 animate-in fade-in-50">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <Label className="text-xs font-semibold text-foreground">
                                Parecer Técnico / Observações da Minuta:
                              </Label>
                              <div className="flex items-center gap-1.5">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleGenerateAIParecerDraft(activeReviewMaterial.id, "aprovado")}
                                  disabled={isDraftingParecerAI}
                                  className="h-6 text-[10px] border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/20 font-semibold gap-1"
                                >
                                  <Sparkles className="h-3 w-3 text-emerald-600 animate-pulse" />
                                  Minuta Favorável (IA)
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleGenerateAIParecerDraft(activeReviewMaterial.id, "ajustes solicitados")}
                                  disabled={isDraftingParecerAI}
                                  className="h-6 text-[10px] border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200 hover:bg-amber-500/20 font-semibold gap-1"
                                >
                                  <Pencil className="h-3 w-3 text-amber-600" />
                                  Minuta de Ajustes (IA)
                                </Button>
                              </div>
                            </div>
                            <Textarea
                              value={reviewDecisionNote}
                              onChange={e => setReviewDecisionNote(e.target.value)}
                              placeholder="Redija o parecer técnico ou utilize os botões de IA acima para preenchimento automático..."
                              rows={3}
                              className="bg-background text-xs"
                            />
                            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setReviewDecisionMaterialId(null);
                                  setReviewDecisionNote("");
                                }}
                                className="h-8 text-xs"
                              >
                                Cancelar
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleReviewDecision(activeReviewMaterial.id, "ajustes solicitados", reviewDecisionNote)}
                                disabled={registerReviewDecision.isPending || !reviewDecisionNote.trim()}
                                className="h-8 text-xs font-semibold border-amber-500/50 hover:bg-amber-500/10 text-amber-800 dark:text-amber-200 gap-1.5"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Confirmar Solicitação de Ajustes
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleReviewDecision(activeReviewMaterial.id, "aprovado", reviewDecisionNote)}
                                disabled={registerReviewDecision.isPending}
                                className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1.5"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Confirmar Aprovação
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2.5">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleReviewDecision(activeReviewMaterial.id, "aprovado")}
                              disabled={registerReviewDecision.isPending}
                              className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1.5"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Aprovar Minuta Técnica
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReviewDecisionMaterialId(activeReviewMaterial.id);
                                if (!reviewDecisionNote) {
                                  setReviewDecisionNote("Ajustes necessários na metodologia e consistência das fontes de dados.");
                                }
                              }}
                              disabled={registerReviewDecision.isPending}
                              className="h-8 text-xs font-semibold border-amber-500/50 hover:bg-amber-500/10 text-amber-800 dark:text-amber-200 gap-1.5"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Solicitar Ajustes na Minuta
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateAIParecerDraft(activeReviewMaterial.id, "aprovado")}
                              disabled={isDraftingParecerAI}
                              className="h-8 text-xs font-semibold border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary gap-1.5"
                            >
                              <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                              {isDraftingParecerAI ? "Gerando com IA..." : "Minuta de Parecer com IA"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed border-primary/30 p-4 text-center text-xs text-muted-foreground">
                      Nenhum documento ou minuta foi anexado ainda pelo autor para este capítulo.
                    </div>
                  )}
                </section>
              );
            })()}

            {/* 2. Painel de Prazos, Status e Próximo Passo (Visualização ou Edição Rápida) */}
            <section className="rounded-lg border border-border/80 bg-muted/25 p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                    Prazos, Status e Próximo Passo
                  </h3>
                </div>
                {isEditingInfo && (
                  <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">
                    Modo de Edição Ativo
                  </Badge>
                )}
              </div>

              {isEditingInfo ? (
                /* Formulário Direto de Edição Rápida */
                <div className="space-y-4 pt-1">
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                    <div>
                      <Label htmlFor="quick-status" className="text-xs font-semibold">Status</Label>
                      <Select
                        value={draftStatus}
                        onValueChange={val => setDraftStatus(val as ActivityStatus)}
                      >
                        <SelectTrigger id="quick-status" className="mt-1 h-9 bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTIVITY_STATUSES.map(st => (
                            <SelectItem key={st} value={st}>
                              {st.charAt(0).toUpperCase() + st.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="quick-start-date" className="text-xs font-semibold">Início Planejado</Label>
                      <Input
                        id="quick-start-date"
                        type="date"
                        value={draftStartDate}
                        onChange={e => setDraftStartDate(e.target.value)}
                        className="mt-1 h-9 bg-background"
                      />
                    </div>

                    <div>
                      <Label htmlFor="quick-due-date" className="text-xs font-semibold">Término Planejado</Label>
                      <Input
                        id="quick-due-date"
                        type="date"
                        value={draftDueDate}
                        onChange={e => setDraftDueDate(e.target.value)}
                        className="mt-1 h-9 bg-background"
                      />
                    </div>

                    <div>
                      <Label htmlFor="quick-actual-start-date" className="text-xs font-semibold">Início Realizado</Label>
                      <Input
                        id="quick-actual-start-date"
                        type="date"
                        value={draftActualStartDate}
                        onChange={e => setDraftActualStartDate(e.target.value)}
                        className="mt-1 h-9 bg-background"
                        placeholder="Não iniciado"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="quick-actual-due-date" className="text-xs font-semibold">Término Realizado</Label>
                      <Input
                        id="quick-actual-due-date"
                        type="date"
                        value={draftActualDueDate}
                        onChange={e => setDraftActualDueDate(e.target.value)}
                        className="mt-1 h-9 bg-background"
                        placeholder="Não finalizado"
                      />
                    </div>

                    <div>
                      <Label htmlFor="quick-next-step" className="text-xs font-semibold">Próximo Passo Imediato</Label>
                      <Input
                        id="quick-next-step"
                        value={draftNextStep}
                        onChange={e => setDraftNextStep(e.target.value)}
                        placeholder="Ex: Concluir coleta de dados preliminares"
                        className="mt-1 h-9 bg-background"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="quick-description" className="text-xs font-semibold">Descrição Operacional da Atividade</Label>
                    <Textarea
                      id="quick-description"
                      value={draftDescription}
                      onChange={e => setDraftDescription(e.target.value)}
                      rows={3}
                      className="mt-1 bg-background text-xs"
                      placeholder="Descrição detalhada do escopo e objetivos deste capítulo..."
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingInfo(false)}
                      disabled={updateQuickInfo.isPending}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveQuickInfo}
                      disabled={updateQuickInfo.isPending}
                    >
                      {updateQuickInfo.isPending ? "Salvando…" : "Salvar Alterações"}
                    </Button>
                  </div>
                </div>
              ) : (
                /* Visualização Clara e Direta */
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 text-xs">
                    <div className="rounded border bg-card p-3">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">Início Planejado</span>
                      <p className="mt-1 font-semibold text-foreground">
                        {data.startAt ? formatDate(data.startAt) : "A definir"}
                      </p>
                    </div>

                    <div className="rounded border bg-card p-3">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">Término Planejado</span>
                      <p className="mt-1 font-semibold text-foreground">
                        {formatDate(data.dueAt)}
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        (Interna: 15 / BNDES: 30)
                      </span>
                    </div>

                    <div className="rounded border bg-card p-3">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">Início Realizado</span>
                      <p className={`mt-1 font-semibold ${data.actualStartAt ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"}`}>
                        {data.actualStartAt ? formatDate(data.actualStartAt) : "Não iniciado"}
                      </p>
                    </div>

                    <div className="rounded border bg-card p-3">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">Término Realizado</span>
                      <p className={`mt-1 font-semibold ${data.actualEndAt ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"}`}>
                        {data.actualEndAt ? formatDate(data.actualEndAt) : "Em andamento"}
                      </p>
                    </div>
                  </div>

                  {/* Próximo Passo Destacado */}
                  <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-xs">
                    <span className="font-semibold text-primary uppercase text-[10px] tracking-wider block">
                      Próximo Passo
                    </span>
                    <p className="mt-1 font-medium text-foreground leading-relaxed">
                      {data.nextStep || "Nenhum próximo passo específico registrado no momento."}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* 3. Escopo Oficial do Anexo B e Descrição */}
            {data.officialDescription && (
              <section className="rounded-md border border-border/70 bg-card p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Escopo Oficial do Capítulo (Anexo B — Plano de Trabalho)
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {data.officialDescription}
                </p>
              </section>
            )}

            {/* 4. Repositório Integrado de Documentos (Troca de Documentos entre Equipe e BNDES) */}
            <section className="space-y-3 rounded-lg border border-border/80 bg-card p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b paper-rule pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Documentos, Textos Intermediários e Minutas
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Repositório oficial para troca de versões até a consolidação do texto final. Quando carregado algum material, todos os participantes dos grupos envolvidos têm acesso para visualização e download.
                    </p>
                  </div>
                </div>
                {canManage && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setUploadOpen(prev => !prev)}
                    className="h-8 gap-1 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {uploadOpen ? "Cancelar Envio" : "Anexar Documento / Versão"}
                  </Button>
                )}
              </div>

              {/* Formulário de Upload de Documento para o Coordenador */}
              {uploadOpen && (
                <div className="rounded-md border border-primary/30 bg-muted/40 p-4 space-y-3 text-xs animate-in fade-in-50">
                  <p className="font-semibold text-primary">Novo Documento Técnico para este Capítulo</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Título do Documento *</Label>
                      <Input
                        value={materialTitle}
                        onChange={e => setMaterialTitle(e.target.value)}
                        placeholder="Ex: Minuta Técnica Intermediária - Diagnóstico"
                        className="mt-1 h-8 bg-background"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Notas da Versão Inicial (R01)</Label>
                      <Input
                        value={materialNotes}
                        onChange={e => setMaterialNotes(e.target.value)}
                        placeholder="Ex: Primeira consolidação com dados de campo"
                        className="mt-1 h-8 bg-background"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="upload-file" className="text-xs">Arquivo (docx, pdf, xlsx, pptx) *</Label>
                    <Input
                      id="upload-file"
                      type="file"
                      accept={acceptedFileExtensions}
                      onChange={e => setMaterialFile(e.target.files?.[0] ?? null)}
                      className="mt-1 bg-background text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadOpen(false)}
                      disabled={createMaterial.isPending}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleUploadMaterial}
                      disabled={createMaterial.isPending || !materialTitle || !materialFile}
                    >
                      {createMaterial.isPending ? "Enviando…" : "Salvar e Disponibilizar (R01)"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Lista de Documentos Disponíveis */}
              {data.productionMaterials && data.productionMaterials.length > 0 ? (
                <div className="divide-y rounded-md border bg-background/60">
                  {data.productionMaterials.map((mat: any) => {
                    const latestRevision = mat.revisions?.[mat.revisions.length - 1];
                    const isCommenting = commentingMaterialId === mat.id;
                    const isHistoryOpen = expandedHistoryMaterialId === mat.id || (mat.revisions && mat.revisions.length > 1);
                    const isUnderActiveReview = mat.reviewStatus === "em revisão";
                    const hasAdjustmentsRequested =
                      mat.reviewStatus === "ajustes solicitados" ||
                      data.documentStatus === "ajustes solicitados" ||
                      mat.activeSubmission?.status === "ajustes solicitados";
                    const isApproved =
                      mat.reviewStatus === "aprovado" || mat.activeSubmission?.status === "aprovado";
                    const isDraft = mat.reviewStatus === "em elaboração";

                    return (
                      <div key={mat.id} className="p-4 space-y-3 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-sm text-foreground">{mat.title}</span>
                              <Badge variant="outline" className="font-mono text-[10px] font-bold border-primary/40 bg-primary/10 text-primary">
                                Revisão R0{mat.currentRevision}
                              </Badge>
                              {isUnderActiveReview ? (
                                <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-[10px] font-semibold">
                                  ⏳ Em Revisão Técnica
                                </Badge>
                              ) : hasAdjustmentsRequested ? (
                                <Badge variant="destructive" className="text-[10px] font-semibold">
                                  ✏️ Ajustes Solicitados
                                </Badge>
                              ) : isApproved ? (
                                <Badge className="bg-emerald-600 text-white text-[10px] font-semibold">
                                  ✅ Aprovado na Revisão
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] font-medium">
                                  📝 Em Elaboração (R0{mat.currentRevision})
                                </Badge>
                              )}
                            </div>
                            {mat.description && (
                              <p className="mt-1 text-muted-foreground text-[11px]">{mat.description}</p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {latestRevision?.storageUrl && (
                              <a
                                href={latestRevision.storageUrl}
                                target="_blank"
                                rel="noreferrer"
                                download={latestRevision.fileName}
                                className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors shadow-2xs"
                              >
                                <Download className="h-3.5 w-3.5" />
                                Baixar R0{mat.currentRevision} ({fileSize(latestRevision.fileSize)})
                              </a>
                            )}

                            {canManage && isDraft && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleSubmitReview(mat.id)}
                                disabled={submitForReview.isPending}
                                className="h-7 text-xs border-primary/50 text-primary hover:bg-primary/10 font-semibold"
                              >
                                Submeter à Revisão (R0{mat.currentRevision})
                              </Button>
                            )}

                            {canManage && (hasAdjustmentsRequested || isApproved) && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => setRevisionModalMaterial(mat)}
                                className="h-7 text-xs bg-primary text-primary-foreground font-semibold gap-1"
                              >
                                <FileUp className="h-3.5 w-3.5" />
                                Carregar Nova Revisão (R0{mat.currentRevision + 1})
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Banner Informativo do Ciclo da Revisão Atual */}
                        {isUnderActiveReview && (
                          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs flex items-center gap-2 text-amber-900 dark:text-amber-200">
                            <Lock className="h-4 w-4 shrink-0 text-amber-600" />
                            <span>
                              A <strong>Revisão R0{mat.currentRevision}</strong> está em processo ativo de avaliação técnica pelos revisores. Aguarde a conclusão do parecer para carregar uma nova revisão caso sejam solicitados ajustes.
                            </span>
                          </div>
                        )}

                        {hasAdjustmentsRequested && (
                          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2.5 text-xs flex flex-wrap items-center justify-between gap-2 text-red-900 dark:text-red-200">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                              <span>
                                Foram solicitados ajustes na <strong>Revisão R0{mat.currentRevision}</strong>. Implemente os apontamentos e anexe a <strong>Revisão R0{mat.currentRevision + 1}</strong>.
                              </span>
                            </div>
                            {canManage && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => setRevisionModalMaterial(mat)}
                                className="h-6 text-[11px] bg-red-600 hover:bg-red-700 text-white font-semibold shrink-0 gap-1"
                              >
                                <FileUp className="h-3 w-3" /> Anexar R0{mat.currentRevision + 1}
                              </Button>
                            )}
                          </div>
                        )}

                        {isApproved && (
                          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                            <span>
                              A <strong>Revisão R0{mat.currentRevision}</strong> foi aprovada pela equipe de revisão técnica e está habilitada para consolidação no capítulo.
                            </span>
                          </div>
                        )}

                        {/* Histórico Completo de Revisões (R01, R02...) */}
                        {mat.revisions && mat.revisions.length > 0 && (
                          <div className="rounded-md border border-border/70 bg-muted/20 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[11px] text-foreground flex items-center gap-1.5">
                                <History className="h-3.5 w-3.5 text-primary" />
                                Histórico de Revisões do Documento ({mat.revisions.length} {mat.revisions.length === 1 ? "versão" : "versões"})
                              </span>
                              <button
                                type="button"
                                onClick={() => setExpandedHistoryMaterialId(expandedHistoryMaterialId === mat.id ? null : mat.id)}
                                className="text-[10px] font-medium text-primary hover:underline"
                              >
                                {expandedHistoryMaterialId === mat.id ? "Recolher Histórico" : "Ver Todas as Versões"}
                              </button>
                            </div>

                            {(expandedHistoryMaterialId === mat.id || mat.revisions.length <= 2) && (
                              <div className="divide-y divide-border/50 pt-1">
                                {mat.revisions.map((rev: any) => {
                                  const isCurrent = rev.revisionNumber === mat.currentRevision;
                                  return (
                                    <div key={rev.id || rev.revisionNumber} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                      <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className={`font-mono text-[10px] font-bold ${isCurrent ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                                            {rev.revisionLabel || `R0${rev.revisionNumber}`}
                                          </Badge>
                                          <span className="font-medium text-foreground">{rev.fileName}</span>
                                          <span className="text-[10px] text-muted-foreground">({fileSize(rev.fileSize)})</span>
                                          {isCurrent && (
                                            <span className="text-[10px] font-semibold text-primary">(Versão Vigente)</span>
                                          )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                                          {rev.createdAt ? <span>Carregado em {formatDate(new Date(rev.createdAt).getTime())}</span> : null}
                                          {rev.uploadedByName && <span>por {rev.uploadedByName}</span>}
                                          {rev.notes && <span className="text-foreground/80 italic">— "{rev.notes}"</span>}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0">
                                        {rev.submissionStatus === "aprovado" && (
                                          <Badge className="bg-emerald-600 text-white text-[10px]">Aprovada</Badge>
                                        )}
                                        {rev.submissionStatus === "ajustes solicitados" && (
                                          <Badge variant="destructive" className="text-[10px]">Ajustes Solicitados</Badge>
                                        )}
                                        {rev.submissionStatus === "em revisão" && (
                                          <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-300 text-[10px]">Em Revisão</Badge>
                                        )}
                                        {rev.submissionStatus === "substituído" && (
                                          <Badge variant="secondary" className="text-[10px] opacity-70">Substituída</Badge>
                                        )}
                                        {rev.storageUrl && (
                                          <a
                                            href={rev.storageUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            download={rev.fileName}
                                            className="inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted"
                                          >
                                            <Download className="h-3 w-3" /> Baixar
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Apontamentos e Comentários do Documento */}
                        <div className="rounded bg-muted/40 p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[11px] text-muted-foreground flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              Apontamentos e Pareceres ({mat.comments?.length || 0})
                            </span>
                            <button
                              type="button"
                              onClick={() => setCommentingMaterialId(isCommenting ? null : mat.id)}
                              className="text-[11px] font-medium text-primary hover:underline"
                            >
                              {isCommenting ? "Fechar" : "+ Novo Apontamento"}
                            </button>
                          </div>

                          {/* Lista de Comentários */}
                          {mat.comments && mat.comments.length > 0 ? (
                            <div className="space-y-1.5 pt-1">
                              {mat.comments.map((comm: any) => (
                                <div key={comm.id} className="rounded border bg-background p-2 text-[11px]">
                                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                    <span className="font-semibold text-foreground">{comm.authorName ?? "Participante"}</span>
                                    <span>{comm.createdAt ? formatDate(new Date(comm.createdAt).getTime()) : ""}</span>
                                  </div>
                                  <p className="mt-1 text-foreground/90">{comm.content}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-muted-foreground">Nenhum apontamento registrado.</p>
                          )}

                          {/* Caixa para Adicionar Apontamento */}
                          {isCommenting && (
                            <div className="pt-2 space-y-2 border-t border-border/50">
                              <Textarea
                                value={commentContent}
                                onChange={e => setCommentContent(e.target.value)}
                                placeholder="Escreva seu apontamento, parecer ou observação técnica..."
                                rows={2}
                                className="bg-background text-xs"
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleSendComment(mat.id)}
                                  disabled={addComment.isPending || !commentContent.trim()}
                                  className="h-7 text-xs"
                                >
                                  Registrar Apontamento
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Parecer do Revisor Técnico — 1 Clique para Solução Rápida */}
                        {mat.reviewStatus === "em revisão" && (
                          <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-3.5 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <UserRoundCheck className="h-4 w-4 text-primary" />
                                <span className="font-bold text-xs text-foreground uppercase tracking-wider">
                                  Parecer da Revisão Técnica
                                </span>
                              </div>
                              <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-[10px] font-semibold">
                                ⏳ Aguardando Avaliação
                              </Badge>
                            </div>

                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              Analise o documento e registre sua decisão técnica diretamente com um clique:
                            </p>

                            {/* Roster de Revisores e seus Status Atuais */}
                            {data.reviewers && data.reviewers.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-0.5">
                                {data.reviewers.map((rev: any) => (
                                  <span
                                    key={rev.id || rev.teamMemberId}
                                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium ${
                                      rev.status === "aprovado"
                                        ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30"
                                        : rev.status === "ajustes solicitados"
                                        ? "bg-red-500/15 text-red-800 dark:text-red-200 border border-red-500/30"
                                        : "bg-muted text-muted-foreground border border-border/60"
                                    }`}
                                  >
                                    {rev.status === "aprovado" ? "✅" : rev.status === "ajustes solicitados" ? "✏️" : "⏳"} {rev.reviewerName || rev.name || "Revisor Designado"}
                                    <span className="opacity-80">({rev.status || "em análise"})</span>
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Caixa de Parecer / Ajustes (quando aberta) */}
                            {reviewDecisionMaterialId === mat.id ? (
                              <div className="pt-2 space-y-2.5 border-t border-primary/20">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <Label className="text-xs font-semibold text-foreground">
                                    Parecer Técnico / Observações da Minuta:
                                  </Label>
                                  <div className="flex items-center gap-1.5">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleGenerateAIParecerDraft(mat.id, "aprovado")}
                                      disabled={isDraftingParecerAI}
                                      className="h-6 text-[10px] border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/20 font-semibold gap-1"
                                    >
                                      <Sparkles className="h-3 w-3 text-emerald-600 animate-pulse" />
                                      Minuta Favorável (IA)
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleGenerateAIParecerDraft(mat.id, "ajustes solicitados")}
                                      disabled={isDraftingParecerAI}
                                      className="h-6 text-[10px] border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200 hover:bg-amber-500/20 font-semibold gap-1"
                                    >
                                      <Pencil className="h-3 w-3 text-amber-600" />
                                      Minuta de Ajustes (IA)
                                    </Button>
                                  </div>
                                </div>
                                <Textarea
                                  value={reviewDecisionNote}
                                  onChange={e => setReviewDecisionNote(e.target.value)}
                                  placeholder="Redija o parecer técnico ou utilize os botões de IA acima para preenchimento automático..."
                                  rows={3}
                                  className="bg-background text-xs"
                                />
                                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setReviewDecisionMaterialId(null);
                                      setReviewDecisionNote("");
                                    }}
                                    className="h-8 text-xs"
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReviewDecision(mat.id, "ajustes solicitados", reviewDecisionNote)}
                                    disabled={registerReviewDecision.isPending || !reviewDecisionNote.trim()}
                                    className="h-8 text-xs font-semibold border-amber-500/50 hover:bg-amber-500/10 text-amber-800 dark:text-amber-200 gap-1.5"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Confirmar Solicitação de Ajustes
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => handleReviewDecision(mat.id, "aprovado", reviewDecisionNote)}
                                    disabled={registerReviewDecision.isPending}
                                    className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1.5"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Confirmar Aprovação
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              /* Botões de Ação de 1 Clique */
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleReviewDecision(mat.id, "aprovado")}
                                  disabled={registerReviewDecision.isPending}
                                  className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1.5"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  Aprovar Minuta Técnica
                                </Button>

                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setReviewDecisionMaterialId(mat.id);
                                    if (!reviewDecisionNote) {
                                      setReviewDecisionNote("Ajustes necessários na metodologia e consistência das fontes de dados.");
                                    }
                                  }}
                                  disabled={registerReviewDecision.isPending}
                                  className="h-8 text-xs font-semibold border-amber-500/50 hover:bg-amber-500/10 text-amber-800 dark:text-amber-200 gap-1.5"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Solicitar Ajustes
                                </Button>

                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleGenerateAIParecerDraft(mat.id, "aprovado")}
                                  disabled={isDraftingParecerAI}
                                  className="h-8 text-xs font-semibold border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary gap-1.5"
                                >
                                  <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                                  {isDraftingParecerAI ? "Gerando com IA..." : "Minuta de Parecer com IA"}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded border border-dashed p-6 text-center text-xs text-muted-foreground">
                  Ainda não há arquivos ou minutas anexados a este capítulo.
                  {canManage && " Utilize o botão acima para anexar a primeira versão."}
                </div>
              )}
            </section>

            {/* 5. Workflow Editorial & Checklist de Revisão com Inteligência Artificial */}
            <section className="space-y-4 rounded-lg border border-border/80 bg-card p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b paper-rule pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ClipboardCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground">
                        Etapa do Workflow e Checklist de Revisão
                      </h3>
                      <Badge variant="outline" className="text-[10px] font-mono border-primary/30 bg-primary/5 text-primary">
                        🤖 Suporte com IA
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Status documental: <strong className="text-foreground">{DOCUMENT_STATUS_LABELS[data.documentStatus]}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleRunAIEvaluation}
                    disabled={isEvaluatingAI}
                    className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground font-semibold shadow-xs"
                  >
                    {isEvaluatingAI ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Avaliando com IA…
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                        {aiEvaluation ? "Reavaliar com IA" : "Executar Análise com IA"}
                      </>
                    )}
                  </Button>

                  {canManage && DOCUMENT_NEXT_STATUSES[data.documentStatus]?.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Select
                        value={nextDocumentStatus}
                        onValueChange={val => setNextDocumentStatus(val as keyof typeof DOCUMENT_STATUS_LABELS)}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background w-44">
                          <SelectValue placeholder="Avançar etapa" />
                        </SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_NEXT_STATUSES[data.documentStatus].map(st => (
                            <SelectItem key={st} value={st}>
                              {DOCUMENT_STATUS_LABELS[st]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAdvanceWorkflow}
                        disabled={!nextDocumentStatus || updateDocumentStatus.isPending}
                        className="h-8 text-xs"
                      >
                        Avançar
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Painel de Resultados da Avaliação Técnica com IA */}
              {aiEvaluation && (
                <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/5 via-card to-background p-4 space-y-3.5 animate-in fade-in-50 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-primary/15 pb-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                          <BrainCircuit className="h-4 w-4 text-primary" />
                          Diagnóstico Técnico por Inteligência Artificial
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${
                            aiEvaluation.verdict === "pronto_para_aprovacao"
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                              : aiEvaluation.verdict === "ajustes_necessarios"
                              ? "border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                              : "border-primary bg-primary/10 text-primary"
                          }`}
                        >
                          {aiEvaluation.verdictLabel}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          (Modo: {aiEvaluation.evaluationMode === "generative_llm" ? "✨ IA Generativa LLM" : "🏛️ Regras Canônicas Fundamentadas"})
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {aiEvaluation.verdictSummary}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Conformidade Geral</span>
                        <span className="text-lg font-bold text-primary font-mono">{aiEvaluation.overallScore}%</span>
                      </div>
                      {canManage && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleApplyAISuggestions}
                          disabled={applyAIChecklist.isPending}
                          className="h-8 text-xs bg-primary text-primary-foreground font-semibold gap-1.5 shadow-xs"
                        >
                          <CheckCheck className="h-3.5 w-3.5" />
                          {applyAIChecklist.isPending ? "Aplicando..." : "Aplicar Sugestões no Checklist"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* 5 Critérios da Etapa do Workflow */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowAICriteria(prev => !prev)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline"
                    >
                      {showAICriteria ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      {showAICriteria ? "Ocultar Critérios da Etapa do Workflow" : "Ver 5 Critérios da Etapa do Workflow (Aderência, Metodologia, Fontes, Interfaces, Governança)"}
                    </button>

                    {showAICriteria && (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 pt-2.5">
                        {aiEvaluation.stageCriteria?.map((crit: any) => (
                          <div key={crit.id} className="rounded-md border border-border/80 bg-background/80 p-2.5 space-y-1 text-[11px]">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-semibold text-foreground truncate">{crit.name}</span>
                              <Badge
                                variant="outline"
                                className={`text-[9px] shrink-0 font-bold ${
                                  crit.status === "atendido"
                                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                    : crit.status === "em_andamento"
                                    ? "border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                                    : "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                                }`}
                              >
                                {crit.status === "atendido" ? "✅ Atendido" : crit.status === "em_andamento" ? "⏳ Em curso" : "⚠️ Atenção"}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground leading-tight text-[10px]">{crit.observation}</p>
                            {crit.recommendation && (
                              <p className="text-primary/90 text-[10px] italic">💡 {crit.recommendation}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Itens do Checklist de Revisão com Recomendações Integradas de IA */}
              {data.reviewChecklist?.items && data.reviewChecklist.items.length > 0 ? (
                <div className="divide-y rounded-md border bg-background/50">
                  {data.reviewChecklist.items.map((item: any) => {
                    const aiDiag = aiEvaluation?.checklistDiagnostics?.find(
                      (d: any) => d.itemKey === item.itemKey
                    );
                    const isExpanded = expandedDiagnosticKey === item.itemKey;

                    return (
                      <div key={item.id} className="p-3 space-y-2 text-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-foreground">{item.title}</span>
                              <span className="text-[10px] text-muted-foreground uppercase font-mono">({item.scope})</span>
                              {aiDiag && (
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] font-bold ${
                                    aiDiag.recommendedStatus === "concluído"
                                      ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                                      : "border-amber-500/60 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                                  }`}
                                >
                                  ✨ Sugestão da IA: {aiDiag.recommendedStatus}
                                </Badge>
                              )}
                            </div>
                            {item.dueAt && (
                              <p className="text-[10px] text-muted-foreground">Prazo oficial: {formatDate(item.dueAt)}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {aiDiag && (
                              <button
                                type="button"
                                onClick={() => setExpandedDiagnosticKey(isExpanded ? null : item.itemKey)}
                                className="text-[10px] font-medium text-primary hover:underline flex items-center gap-1"
                              >
                                <Lightbulb className="h-3 w-3" />
                                {isExpanded ? "Ocultar Análise" : "Ver Análise da IA"}
                              </button>
                            )}

                            {canManage ? (
                              <Select
                                value={item.status}
                                onValueChange={val => handleChecklistStatus(item.id, val as any)}
                              >
                                <SelectTrigger className="h-7 text-xs w-32 bg-background">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pendente">Pendente</SelectItem>
                                  <SelectItem value="em andamento">Em andamento</SelectItem>
                                  <SelectItem value="bloqueado">Bloqueado</SelectItem>
                                  <SelectItem value="concluído">Concluído</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <StatusBadge status={item.status === "concluído" ? "concluído" : "pendente"} />
                            )}
                          </div>
                        </div>

                        {/* Card Expansível de Diagnóstico da IA por Item */}
                        {isExpanded && aiDiag && (
                          <div className="rounded-md border border-primary/20 bg-muted/40 p-3 space-y-1.5 text-[11px] animate-in fade-in-50">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-primary flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                Parecer Automatizado da IA ({aiDiag.score}% de conformidade)
                              </span>
                              {canManage && item.status !== aiDiag.recommendedStatus && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleChecklistStatus(item.id, aiDiag.recommendedStatus)}
                                  className="h-6 text-[10px] border-primary/40 text-primary font-semibold"
                                >
                                  Mudar para "{aiDiag.recommendedStatus}"
                                </Button>
                              )}
                            </div>
                            <p className="text-foreground/90 leading-relaxed">{aiDiag.analysis}</p>
                            {aiDiag.recommendations && aiDiag.recommendations.length > 0 && (
                              <div className="pt-1">
                                <span className="font-semibold text-[10px] text-muted-foreground uppercase">Recomendações Técnicas:</span>
                                <ul className="list-disc list-inside space-y-0.5 text-muted-foreground text-[10px] mt-0.5">
                                  {aiDiag.recommendations.map((rec: string, idx: number) => (
                                    <li key={idx}>{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                canManage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await initializeReviewChecklist.mutateAsync({ id: data.id });
                        await utils.activities.detail.invalidate({ id: data.id });
                        toast.success("Checklist inicializado.");
                      } catch {
                        toast.error("Erro ao inicializar checklist.");
                      }
                    }}
                    className="text-xs"
                  >
                    Inicializar Checklist de Revisão Padrão
                  </Button>
                )
              )}
            </section>

            {/* 6. Atribuição de Execução e Responsáveis da Seção */}
            {data && (
              <section className="space-y-4 rounded-lg border border-primary/30 bg-card p-4 sm:p-5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b paper-rule pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">
                          Atribuição de Execução e Responsáveis da Seção
                        </h3>
                        {data.allocations && data.allocations.length > 0 ? (
                          <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold">
                            {data.allocations.length} {data.allocations.length === 1 ? "executor ativo" : "executores ativos"}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-300 bg-amber-500/10 text-[10px] font-semibold">
                            Atribuição Pendente
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        A atribuição de execução desta seção é de responsabilidade do coordenador correspondente (<strong>{data.responsibleName}</strong>). O coordenador tem a autonomia para associar executores às atividades ou alterá-los.
                      </p>
                    </div>
                  </div>

                  {canManage && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleOpenAllocModal(data.id, data.title, data.allocations)}
                      className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground font-semibold shadow-xs"
                    >
                      <Briefcase className="h-3.5 w-3.5" />
                      {data.allocations && data.allocations.length > 0
                        ? "Gerenciar / Alterar Executores"
                        : "+ Associar Executores"}
                    </Button>
                  )}
                </div>

                {/* Estrutura de Liderança e Executores */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Card do Coordenador da Seção */}
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider">
                        Coordenação da Seção / Capítulo
                      </span>
                      <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-[10px] font-bold">
                        👑 Coordenador Responsável
                      </Badge>
                    </div>
                    <p className="font-bold text-sm text-foreground">{data.responsibleName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {data.responsibleTitle} · {data.institution}
                    </p>
                    <p className="text-[10px] text-muted-foreground pt-1 border-t border-amber-500/20">
                      Responsável formal pela entrega e governança do capítulo perante o estudo e pelo direcionamento da equipe.
                    </p>
                  </div>

                  {/* Card Resumo de Execução */}
                  <div className="rounded-lg border border-border/70 bg-muted/20 p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Status da Execução
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-primary">
                        {data.totalAllocatedHours || 0}h alocadas
                      </span>
                    </div>

                    {data.allocations && data.allocations.length > 0 ? (
                      <div className="space-y-1.5 pt-0.5">
                        {data.allocations.map((alloc: any) => (
                          <div
                            key={alloc.id || alloc.teamMemberId}
                            className="flex items-start justify-between gap-2 rounded border border-border/60 bg-background p-2"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-foreground text-xs truncate">
                                  {alloc.memberName || `Integrante ${alloc.teamMemberId}`}
                                </span>
                                {alloc.isExecutionLead && (
                                  <Badge variant="default" className="bg-primary text-primary-foreground text-[9px] font-bold py-0 h-4">
                                    ⭐ Líder de Execução
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                                {alloc.responsibility}
                              </p>
                            </div>
                            <span className="font-mono text-[11px] font-semibold text-foreground shrink-0">
                              {alloc.allocatedHours}h
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-xs text-muted-foreground italic border border-dashed rounded">
                        Nenhum executor associado diretamente a este nível.
                        {canManage && " Clique em '+ Associar Executores' para designar os autores da etapa."}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-atividades / Etapas de Execução do Capítulo com Ações Rápidas de Atribuição */}
                {data.executionSteps && data.executionSteps.length > 0 && (
                  <div className="space-y-2.5 pt-2 border-t border-border/60">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-foreground uppercase tracking-wider">
                        Etapas e Sub-atividades do Capítulo ({data.executionSteps.length})
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Atribuição individual por etapa do índice analítico
                      </span>
                    </div>

                    <div className="divide-y divide-border/60 rounded-md border bg-background/80">
                      {data.executionSteps.map((step: any) => {
                        const stepExecutors = step.allocations ?? [];
                        const stepLead = stepExecutors.find((a: any) => a.isExecutionLead) || stepExecutors[0];

                        return (
                          <div
                            key={step.id}
                            className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-muted/30 transition-colors"
                          >
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-xs text-primary">
                                  {step.detailCode || step.planCode || step.sectionCode}
                                </span>
                                <span className="font-medium text-foreground text-xs truncate">
                                  {step.title}
                                </span>
                                <StatusBadge status={step.status} />
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                                {stepLead ? (
                                  <span className="font-medium text-foreground flex items-center gap-1">
                                    <UserRoundCheck className="h-3 w-3 text-primary" />
                                    Executor: <strong>{stepLead.memberName}</strong> ({stepLead.allocatedHours}h)
                                  </span>
                                ) : (
                                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                                    ⚠️ Executor não associado
                                  </span>
                                )}
                                {step.dueAt && <span>Prazo: {formatDate(step.dueAt)}</span>}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {canManage && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenAllocModal(step.id, `${step.detailCode ? `${step.detailCode} — ` : ""}${step.title}`, step.allocations)}
                                  className="h-7 text-[11px] gap-1 font-semibold hover:border-primary"
                                >
                                  <Pencil className="h-3 w-3 text-primary" />
                                  {stepExecutors.length > 0 ? "Alterar Executor" : "Associar Executor"}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* 7. Equipe Temática de Apoio ao Capítulo e Designação de Revisores */}
            {data && (
              <section className="space-y-3 rounded-lg border border-border/80 bg-muted/20 p-4 sm:p-5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b paper-rule pb-2.5">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <div>
                      <span className="font-bold text-foreground text-xs uppercase tracking-wider block">
                        Equipe Temática de Apoio ao Capítulo ({data.groupName ?? "Grupo"})
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {canManage
                          ? "Clique nos nomes dos integrantes para apontar ou desmarcar o revisor técnico do material a ser encaminhado."
                          : "Integrantes e pesquisadores da equipe temática e revisores técnicos designados."}
                      </p>
                    </div>
                  </div>
                  {data.reviewers && data.reviewers.length > 0 && (
                    <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary text-[10px] font-semibold gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {data.reviewers.length} {data.reviewers.length === 1 ? "revisor apontado" : "revisores apontados"}
                    </Badge>
                  )}
                </div>

                {/* Grid de Integrantes da Equipe Temática */}
                {(() => {
                  const thematicList = data.thematicMembers && data.thematicMembers.length > 0
                    ? data.thematicMembers
                    : (data.eligibleParticipants ?? []);
                  const otherDesignatedReviewers = (data.reviewers ?? []).filter(
                    (rev: any) => !thematicList.some((m: any) => m.id === rev.teamMemberId)
                  );
                  const otherEligibleReviewers = (data.eligibleReviewers ?? []).filter(
                    (el: any) => !thematicList.some((m: any) => m.id === el.id) && !data.reviewers?.some((r: any) => r.teamMemberId === el.id)
                  );

                  return (
                    <div className="space-y-3">
                      <div className="grid gap-2 sm:grid-cols-2 pt-1">
                        {thematicList.map((mem: any) => {
                          const isAuthor = mem.id === data.responsibleId;
                          const isReviewer = data.reviewers?.some((r: any) => r.teamMemberId === mem.id);

                          if (isAuthor) {
                            return (
                              <div
                                key={mem.id}
                                className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs"
                                title="Autor e Coordenador responsável pela elaboração do capítulo (não pode revisar o próprio trabalho)."
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-foreground truncate">{mem.name}</span>
                                    <span className="text-[10px] text-muted-foreground shrink-0">({mem.institution})</span>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground block mt-0.5">{mem.title}</span>
                                </div>
                                <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-[10px] shrink-0 font-medium">
                                  👑 Autor / Coordenação
                                </Badge>
                              </div>
                            );
                          }

                          return (
                            <button
                              key={mem.id}
                              type="button"
                              onClick={() => canManage && handleToggleReviewer(mem.id, mem.name)}
                              disabled={!canManage || updateReviewers.isPending}
                              className={`flex items-center justify-between rounded-lg border p-3 text-xs text-left transition-all ${
                                isReviewer
                                  ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40 shadow-xs"
                                  : "border-border/80 bg-card text-foreground hover:border-primary/60 hover:bg-muted/60"
                              } ${canManage ? "cursor-pointer" : "cursor-default"}`}
                              title={
                                canManage
                                  ? isReviewer
                                    ? "Clique para remover a designação de revisor"
                                    : "Clique para apontar como revisor técnico deste capítulo"
                                  : isReviewer
                                  ? "Revisor técnico designado"
                                  : "Integrante da equipe temática"
                              }
                            >
                              <div className="min-w-0 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-foreground truncate">{mem.name}</span>
                                  <span className="text-[10px] text-muted-foreground shrink-0">({mem.institution})</span>
                                </div>
                                <span className="text-[10px] text-muted-foreground block mt-0.5">{mem.title}</span>
                              </div>

                              <div className="shrink-0 flex items-center gap-1.5">
                                {isReviewer ? (
                                  <Badge variant="default" className="bg-primary text-primary-foreground text-[10px] font-semibold flex items-center gap-1">
                                    <UserCheck className="h-3 w-3" />
                                    Revisor Designado
                                  </Badge>
                                ) : canManage ? (
                                  <span className="text-[10px] text-primary/80 font-medium hover:underline flex items-center gap-0.5">
                                    <Plus className="h-3 w-3" /> Apontar Revisor
                                  </span>
                                ) : null}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Revisores Designados de Outros Grupos */}
                      {otherDesignatedReviewers.length > 0 && (
                        <div className="pt-2 space-y-2 border-t border-border/50">
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                            Revisores Designados de Outros Grupos / Coordenação
                          </span>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {otherDesignatedReviewers.map((rev: any) => (
                              <div
                                key={rev.id || rev.teamMemberId}
                                className="flex items-center justify-between rounded-lg border border-primary/40 bg-primary/10 p-3 text-xs"
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-foreground truncate">{rev.name}</span>
                                    <span className="text-[10px] text-muted-foreground shrink-0">({rev.institution})</span>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground block mt-0.5">{rev.title}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="default" className="bg-primary text-primary-foreground text-[10px] font-semibold">
                                    🔍 Revisor Designado
                                  </Badge>
                                  {canManage && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleToggleReviewer(rev.teamMemberId, rev.name)}
                                      disabled={updateReviewers.isPending}
                                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                      title="Remover revisor"
                                    >
                                      ✕
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Selecionar Revisor Adicional de Outro Grupo */}
                      {canManage && otherEligibleReviewers.length > 0 && (
                        <div className="pt-2 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] text-muted-foreground">
                            Apontar revisor de outro grupo temático:
                          </span>
                          <Select
                            onValueChange={val => {
                              const target = otherEligibleReviewers.find(m => String(m.id) === val);
                              if (target) {
                                handleToggleReviewer(target.id, target.name);
                              }
                            }}
                          >
                            <SelectTrigger className="h-7 text-xs w-64 bg-background">
                              <SelectValue placeholder="+ Selecionar outro integrante..." />
                            </SelectTrigger>
                            <SelectContent>
                              {otherEligibleReviewers.map((el: any) => (
                                <SelectItem key={el.id} value={String(el.id)}>
                                  {el.name} ({el.institution})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </section>
            )}

            {/* 7. Interfaces Interdisciplinares Vinculadas */}
            {data.relatedInterfaces && data.relatedInterfaces.length > 0 && (
              <section className="space-y-2 rounded-lg border border-teal-500/30 bg-teal-500/5 p-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                    <GitMerge className="h-4 w-4 text-teal-600" />
                    Interfaces de Coordenação Interdisciplinar ({data.relatedInterfaces.length})
                  </span>
                  <Link href="/interfaces" className="text-teal-700 dark:text-teal-300 font-medium hover:underline text-[11px]">
                    Ver no Módulo de Interfaces →
                  </Link>
                </div>
                <div className="divide-y divide-teal-500/20 rounded border border-teal-500/20 bg-background/70">
                  {data.relatedInterfaces.map((iface: any) => (
                    <div key={iface.id} className="p-2.5 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-foreground">{iface.title}</span>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{iface.description}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {iface.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Rodapé da Ficha */}
            <DialogFooter className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {data.updatedAt ? `Atualizado em ${formatDate(new Date(data.updatedAt).getTime())}` : "Atualizado recentemente"}
              </span>
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Fechar Ficha
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Modal Dedicado para Carregar Nova Revisão (R02, R03...) */}
        <Dialog open={revisionModalMaterial !== null} onOpenChange={open => !open && setRevisionModalMaterial(null)}>
          <DialogContent className="sm:max-w-lg bg-card p-6">
            <DialogHeader className="border-b paper-rule pb-3 text-left">
              <div className="flex items-center gap-2">
                <FileUp className="h-5 w-5 text-primary" />
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Carregar Nova Revisão (R0{(revisionModalMaterial?.currentRevision || 0) + 1})
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {revisionModalMaterial?.title}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-1">
                <span className="font-semibold text-primary block">
                  Regra do Fluxo de Múltiplas Revisões:
                </span>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Esta nova revisão <strong>R0{(revisionModalMaterial?.currentRevision || 0) + 1}</strong> substituirá a versão vigente e registrará o atendimento aos apontamentos da equipe de revisão.
                </p>
              </div>

              <div>
                <Label className="text-xs font-semibold">Notas das Modificações / Resposta aos Apontamentos *</Label>
                <Textarea
                  value={revisionNotes}
                  onChange={e => setRevisionNotes(e.target.value)}
                  placeholder="Descreva detalhadamente as alterações realizadas no texto, fontes adicionadas ou tabelas corrigidas..."
                  rows={3}
                  className="mt-1 bg-background text-xs"
                />
              </div>

              <div>
                <Label htmlFor="upload-revision-file" className="text-xs font-semibold">
                  Arquivo da Nova Revisão (docx, pdf, xlsx, pptx) *
                </Label>
                <Input
                  id="upload-revision-file"
                  type="file"
                  accept={acceptedFileExtensions}
                  onChange={e => setRevisionFile(e.target.files?.[0] ?? null)}
                  className="mt-1 bg-background text-xs"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="auto-submit-review"
                  checked={revisionAutoSubmit}
                  onChange={e => setRevisionAutoSubmit(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="auto-submit-review" className="text-xs text-foreground cursor-pointer font-medium">
                  Submeter imediatamente para nova rodada de revisão técnica pelos pares
                </Label>
              </div>
            </div>

            <DialogFooter className="border-t pt-3 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setRevisionModalMaterial(null);
                  setRevisionFile(null);
                  setRevisionNotes("");
                }}
                disabled={addRevision.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleUploadRevision}
                disabled={addRevision.isPending || !revisionFile || !revisionNotes.trim()}
                className="gap-1.5"
              >
                <FileUp className="h-4 w-4" />
                {addRevision.isPending ? "Enviando…" : `Salvar e Disponibilizar R0${(revisionModalMaterial?.currentRevision || 0) + 1}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Dedicado para Gestão e Atribuição de Executores pelo Coordenador */}
        <Dialog open={allocModalOpen} onOpenChange={open => !open && setAllocModalOpen(false)}>
          <DialogContent className="sm:max-w-xl bg-card p-6 max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b paper-rule pb-3 text-left">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Atribuição e Gestão de Executores
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {allocTargetTitle}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-1">
                <span className="font-semibold text-primary block">
                  Regra de Governança e Atribuição:
                </span>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  A atribuição de execução de determinada seção é de responsabilidade do <strong>coordenador da seção correspondente</strong>. Associe integrantes para conduzir a elaboração técnica da atividade, definindo horas alocadas, escopo específico e liderança de execução.
                </p>
              </div>

              {/* Lista Atual de Executores no Rascunho */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Executores Associados ({currentAllocationsDraft.length})
                  </Label>
                  <span className="font-mono text-[11px] font-semibold text-primary">
                    Total: {currentAllocationsDraft.reduce((sum, a) => sum + a.allocatedHours, 0)}h
                  </span>
                </div>

                {currentAllocationsDraft.length > 0 ? (
                  <div className="divide-y rounded-md border bg-background/60">
                    {currentAllocationsDraft.map((alloc) => (
                      <div key={alloc.teamMemberId} className="p-3 flex items-start justify-between gap-2 text-xs">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{alloc.memberName}</span>
                            {alloc.memberTitle && (
                              <span className="text-[10px] text-muted-foreground">({alloc.memberTitle})</span>
                            )}
                            {alloc.isExecutionLead ? (
                              <Badge className="bg-primary text-primary-foreground text-[9px] font-bold py-0 h-4">
                                ⭐ Líder de Execução
                              </Badge>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetLeadInDraft(alloc.teamMemberId)}
                                className="text-[10px] text-primary hover:underline font-medium"
                              >
                                Tornar Líder
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {alloc.responsibility}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-bold text-xs text-foreground bg-muted px-2 py-0.5 rounded">
                            {alloc.allocatedHours}h
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDraftAllocation(alloc.teamMemberId)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            title="Remover executor"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded border border-dashed p-4 text-center text-xs text-muted-foreground">
                    Nenhum executor associado ainda. Utilize o formulário abaixo para associar.
                  </div>
                )}
              </div>

              {/* Formulário para Adicionar / Associar Novo Executor */}
              <div className="rounded-lg border border-border/80 bg-muted/20 p-3.5 space-y-3">
                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-primary" />
                  Associar ou Atualizar Integrante na Equipe de Execução
                </span>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs font-semibold">Integrante da Equipe *</Label>
                    <Select
                      value={newAllocMemberId}
                      onValueChange={val => setNewAllocMemberId(val)}
                    >
                      <SelectTrigger className="mt-1 h-8 text-xs bg-background">
                        <SelectValue placeholder="Selecione o pesquisador..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {(() => {
                          const allParticipants = data?.eligibleParticipants && data.eligibleParticipants.length > 0
                            ? data.eligibleParticipants
                            : (data?.thematicMembers ?? []);

                          // Ordena: integrantes do mesmo grupo temático primeiro, depois em ordem alfabética
                          const sortedList = [...allParticipants].sort((a: any, b: any) => {
                            if (a.isSameGroup && !b.isSameGroup) return -1;
                            if (!a.isSameGroup && b.isSameGroup) return 1;
                            return (a.name || "").localeCompare(b.name || "", "pt-BR");
                          });

                          return sortedList.map((m: any) => (
                            <SelectItem key={m.id} value={String(m.id)}>
                              {m.name} ({m.groupName ? `${m.groupName} · ` : ""}{m.institution} · {m.title})
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Horas Estimadas Alocadas (h) *</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10000}
                      value={newAllocHours}
                      onChange={e => setNewAllocHours(e.target.value)}
                      placeholder="Ex: 20"
                      className="mt-1 h-8 bg-background text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Atribuição / Responsabilidade Específica *</Label>
                  <Input
                    value={newAllocResponsibility}
                    onChange={e => setNewAllocResponsibility(e.target.value)}
                    placeholder="Ex: Elaboração técnica da seção e levantamento de dados setoriais"
                    className="mt-1 h-8 bg-background text-xs"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="new-alloc-is-lead"
                      checked={newAllocIsLead}
                      onChange={e => setNewAllocIsLead(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="new-alloc-is-lead" className="text-xs text-foreground cursor-pointer font-medium">
                      Designar como Líder de Execução desta atividade
                    </Label>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddOrUpdateDraftAllocation}
                    className="h-7 text-xs font-semibold gap-1 bg-primary text-primary-foreground shadow-2xs"
                  >
                    <Plus className="h-3 w-3" /> Incluir na Lista
                  </Button>
                </div>
              </div>

              {/* Justificativa de Mudança de Liderança (se aplicável) */}
              {(() => {
                const initialLeadId = data?.allocations?.find((a: any) => a.isExecutionLead)?.teamMemberId;
                const currentLeadId = currentAllocationsDraft.find(a => a.isExecutionLead)?.teamMemberId;
                const leadershipChanged = initialLeadId !== undefined && currentLeadId !== undefined && initialLeadId !== currentLeadId;

                if (!leadershipChanged) return null;

                return (
                  <div className="space-y-1.5 rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
                    <Label className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                      Justificativa Obrigatória para Alteração do Líder de Execução *
                    </Label>
                    <Textarea
                      value={leadershipChangeJustification}
                      onChange={e => setLeadershipChangeJustification(e.target.value)}
                      placeholder="Descreva a razão técnica/operacional para a transferência da liderança de execução da atividade..."
                      rows={2}
                      className="bg-background text-xs"
                    />
                  </div>
                );
              })()}
            </div>

            <DialogFooter className="border-t pt-3 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAllocModalOpen(false)}
                disabled={updateAllocations.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSaveAllocations}
                disabled={updateAllocations.isPending}
                className="gap-1.5 bg-primary text-primary-foreground font-semibold shadow-xs"
              >
                <CheckCircle2 className="h-4 w-4" />
                {updateAllocations.isPending ? "Salvando…" : "Confirmar Atribuição de Executores"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Página Principal: Minhas Ações
 */
function ActivitiesContent() {
  const { data: access } = trpc.administration.status.useQuery();
  const searchParams = useSearch();

  // Estado da Ficha Aberta
  const [detailId, setDetailId] = useState<number | null>(null);
  const [openInEdit, setOpenInEdit] = useState(false);

  // Abrir Ficha automaticamente se query param `ficha` estiver presente
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const fichaId = params.get("ficha");
    if (fichaId) {
      setDetailId(Number(fichaId));
    }
  }, [searchParams]);

  const isAdmin = Boolean(access?.isAdmin);

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <PageHeader
        eyebrow="Painel Pessoal e Produtividade"
        title="Minhas ações"
        description="Acompanhamento centralizado das suas obrigações imediatas, revisão de minutas e acesso direto às fichas dos capítulos."
      />

      {/* Central de Ações e Pendências do Participante */}
      <div className="technical-panel p-4 sm:p-5">
        <ParticipantActionCenter
          onSelectActivity={id => {
            setOpenInEdit(false);
            setDetailId(id);
          }}
        />
      </div>

      {/* Ficha da Atividade Unificada */}
      <ActivityDetailDialog
        activityId={detailId}
        onOpenChange={open => {
          if (!open) setDetailId(null);
        }}
        isAdmin={isAdmin}
        startInEditMode={openInEdit}
      />
    </div>
  );
}

export default function ActivitiesPage() {
  return (
    <ActivityAccessGate>
      <ActivitiesContent />
    </ActivityAccessGate>
  );
}
