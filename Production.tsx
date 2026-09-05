import { useMemo, useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import {
  EmptyEditorial,
  PageHeader,
  PageLoading,
  SectionMark,
  StatusBadge,
} from "@/components/EditorialUI";
import {
  DocumentationWorkflowStepper,
  getWorkflowStage,
  WORKFLOW_STAGES,
  type WorkflowStage,
} from "@/components/DocumentationWorkflowStepper";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { fileToBase64 } from "@/lib/files";
import { fileSize, formatDate, initials } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { groupDisplayName } from "../../../shared/groupDisplay";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  Clock,
  Download,
  Eye,
  FileCheck2,
  FileClock,
  FileEdit,
  FolderCheck,
  HelpCircle,
  MessageSquare,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  UploadCloud,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

type ProductionMaterial =
  inferRouterOutputs<AppRouter>["production"]["list"][number];
type ReviewDecision = "em revisão" | "ajustes solicitados" | "aprovado";
type CommentType = "comentário" | "solicitação de ajuste" | "resposta";

const acceptedFiles =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.odt,.ods,.odp";

function FilePicker({
  file,
  onChange,
  label,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  label: string;
}) {
  return (
    <label className="mt-4 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-muted/35 px-4 text-center hover:bg-muted/50 transition-colors">
      <UploadCloud className="h-6 w-6 text-primary" />
      <span className="mt-2 text-sm font-semibold">{file?.name || label}</span>
      <span className="mt-1 text-xs text-muted-foreground">
        documentos técnicos de até 20 MB (.docx, .pdf, .xlsx, .pptx, etc.)
      </span>
      <input
        className="sr-only"
        type="file"
        accept={acceptedFiles}
        onChange={event => onChange(event.target.files?.[0] ?? null)}
      />
    </label>
  );
}

function ReviewerRoster({ material }: { material: ProductionMaterial }) {
  return (
    <div className="divide-y paper-rule rounded-md border">
      {material.reviewers.map(reviewer => (
        <div
          key={reviewer.id}
          className="flex items-start justify-between gap-4 px-3 py-3"
        >
          <div>
            <p className="text-sm font-semibold">
              {reviewer.reviewerName}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {reviewer.groupName ?? reviewer.institution}
            </p>
          </div>
          <span className="rounded-sm border bg-muted px-2 py-1 text-[10px] font-semibold uppercase tracking-[.08em]">
            {reviewer.status}
          </span>
        </div>
      ))}
      {!material.reviewers.length && (
        <p className="px-3 py-7 text-sm text-muted-foreground">
          O coordenador designado ainda não alocou revisores à atividade.
        </p>
      )}
    </div>
  );
}

export default function ProductionPage() {
  const { data, isLoading } = trpc.production.list.useQuery();
  const { data: access } = trpc.administration.status.useQuery();
  const { data: allocatedActivities, isLoading: isLoadingActivities } =
    trpc.production.allocatedActivities.useQuery(undefined, {
      enabled: Boolean(access?.canAccessActivities),
    });
  const utils = trpc.useUtils();
  const create = trpc.production.create.useMutation();
  const addRevision = trpc.production.addRevision.useMutation();
  const addComment = trpc.production.addComment.useMutation();
  const implementComment = trpc.production.implementComment.useMutation();
  const resolveComment = trpc.production.resolveComment.useMutation();
  const setStatus = trpc.production.setReviewStatus.useMutation();
  const submitForReview = trpc.production.submitForReview.useMutation();
  const registerDecision = trpc.production.reviewDecision.useMutation();
  const consolidateInChapter = trpc.production.consolidateInChapter.useMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [revisionMaterialId, setRevisionMaterialId] = useState<number | null>(null);
  const [detailMaterialId, setDetailMaterialId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activityId, setActivityId] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [comment, setComment] = useState("");
  const [commentType, setCommentType] = useState<CommentType>("comentário");
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [decision, setDecision] = useState<ReviewDecision>("em revisão");
  const [decisionNote, setDecisionNote] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [sectionFilter, setSectionFilter] = useState("todas");
  const [activeTab, setActiveTab] = useState<"todos" | "minhas_acoes" | "minuta" | "revisao" | "homologacao">("todos");

  // Comment implementation & Chapter consolidation state
  const [implementingCommentId, setImplementingCommentId] = useState<number | null>(null);
  const [implementationNote, setImplementationNote] = useState("");
  const [consolidationNotes, setConsolidationNotes] = useState("");

  const selected = data?.find(item => item.id === detailMaterialId) ?? null;
  const revisionMaterial =
    data?.find(item => item.id === revisionMaterialId) ?? null;
  const selectedActivity = allocatedActivities?.find(
    item => item.id === Number(activityId)
  );

  const availableSections = useMemo(() => {
    const map = new Map<string, { code: string; title: string }>();
    (data ?? []).forEach(m => {
      if (m.sectionCode) {
        map.set(m.sectionCode, {
          code: m.sectionCode,
          title: m.sectionTitle,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.code.localeCompare(b.code, undefined, { numeric: true })
    );
  }, [data]);

  const pendingActionsCount = useMemo(() => {
    return (data ?? []).filter(item => {
      const isAuthorAction =
        item.permissions.canDevelop &&
        (item.reviewStatus === "em elaboração" ||
          item.activeSubmission?.status === "ajustes solicitados" ||
          item.activityDocumentStatus === "ajustes solicitados" ||
          item.openCommentCount > 0);
      const isReviewerAction =
        item.permissions.canReview &&
        (item.reviewStatus === "em revisão" || item.implementedCommentCount > 0);
      const isCoordinatorAction =
        (access?.isAdmin || item.permissions.canManageReview) &&
        item.reviewStatus === "aprovado" &&
        item.activityDocumentStatus === "revisada pela seção";

      return isAuthorAction || isReviewerAction || isCoordinatorAction;
    }).length;
  }, [data, access]);

  const filtered = useMemo(() => {
    return (data ?? []).filter(item => {
      // Tab filter
      if (activeTab === "minhas_acoes") {
        const isAuthorAction =
          item.permissions.canDevelop &&
          (item.reviewStatus === "em elaboração" ||
            item.activeSubmission?.status === "ajustes solicitados" ||
            item.activityDocumentStatus === "ajustes solicitados" ||
            item.openCommentCount > 0);
        const isReviewerAction =
          item.permissions.canReview &&
          (item.reviewStatus === "em revisão" || item.implementedCommentCount > 0);
        const isCoordinatorAction =
          (access?.isAdmin || item.permissions.canManageReview) &&
          item.reviewStatus === "aprovado" &&
          item.activityDocumentStatus === "revisada pela seção";

        if (!isAuthorAction && !isReviewerAction && !isCoordinatorAction) {
          return false;
        }
      } else if (activeTab === "minuta") {
        if (
          item.reviewStatus !== "em elaboração" &&
          item.activeSubmission?.status !== "ajustes solicitados" &&
          item.activityDocumentStatus !== "ajustes solicitados"
        ) {
          return false;
        }
      } else if (activeTab === "revisao") {
        if (item.reviewStatus !== "em revisão") {
          return false;
        }
      } else if (activeTab === "homologacao") {
        if (
          item.reviewStatus !== "aprovado" &&
          item.activityDocumentStatus !== "consolidada no capítulo"
        ) {
          return false;
        }
      }

      // Dropdown filters
      const matchesStatus =
        statusFilter === "todos" || item.reviewStatus === statusFilter;
      const matchesSection =
        sectionFilter === "todas" || item.sectionCode === sectionFilter;
      return matchesStatus && matchesSection;
    });
  }, [data, activeTab, statusFilter, sectionFilter, access]);

  const refresh = () => utils.production.list.invalidate();

  const resetUpload = () => {
    setNotes("");
    setFile(null);
  };

  const saveMaterial = async () => {
    if (!title || !selectedActivity || !file) {
      toast.error("Informe título, atividade e arquivo.");
      return;
    }
    try {
      await create.mutateAsync({
        title,
        description: description || null,
        activityId: selectedActivity.id,
        sectionId: selectedActivity.sectionId,
        notes: notes || null,
        file: {
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
          base64: await fileToBase64(file),
        },
      });
      await refresh();
      toast.success("Material criado e compartilhado com o grupo responsável.");
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      setActivityId("");
      resetUpload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha no envio.");
    }
  };

  const saveRevision = async () => {
    if (!revisionMaterialId || !file) {
      toast.error("Selecione um arquivo.");
      return;
    }
    try {
      await addRevision.mutateAsync({
        materialId: revisionMaterialId,
        notes: notes || null,
        file: {
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          fileSize: file.size,
          base64: await fileToBase64(file),
        },
      });
      await refresh();
      toast.success("Nova versão registrada com sucesso; pareceres anteriores foram preservados.");
      setRevisionMaterialId(null);
      resetUpload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha no envio.");
    }
  };

  const downloadRevision = async (revisionId: number) => {
    try {
      const result = await utils.client.production.accessRevision.query({
        revisionId,
      });
      window.open(result.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível abrir o arquivo."
      );
    }
  };

  const submit = async (material: ProductionMaterial) => {
    try {
      await submitForReview.mutateAsync({
        materialId: material.id,
        message: submissionMessage || null,
      });
      await refresh();
      setSubmissionMessage("");
      toast.success("Versão atual disponibilizada aos revisores apontados.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível submeter."
      );
    }
  };

  const commentOnSubmission = async (material: ProductionMaterial) => {
    if (!comment.trim()) return;
    try {
      await addComment.mutateAsync({
        materialId: material.id,
        submissionId: material.activeSubmission?.id ?? null,
        content: comment,
        commentType,
      });
      setComment("");
      await refresh();
      toast.success("Comentário registrado no histórico da revisão.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível comentar."
      );
    }
  };

  const handleImplementComment = async (commentId: number) => {
    if (!implementationNote.trim()) {
      toast.error("Descreva como o apontamento foi atendido.");
      return;
    }
    try {
      await implementComment.mutateAsync({
        commentId,
        implementationNote: implementationNote.trim(),
      });
      setImplementingCommentId(null);
      setImplementationNote("");
      await refresh();
      toast.success("Implementação do autor registrada no apontamento.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível registrar a implementação."
      );
    }
  };

  const handleResolveComment = async (commentId: number, resolved: boolean) => {
    try {
      await resolveComment.mutateAsync({
        commentId,
        resolved,
      });
      await refresh();
      toast.success(
        resolved
          ? "Apontamento aceito e marcado como resolvido!"
          : "Apontamento reaberto para novos ajustes."
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível alterar o estado do apontamento."
      );
    }
  };

  const decide = async (material: ProductionMaterial) => {
    if (!material.activeSubmission) return;
    try {
      await registerDecision.mutateAsync({
        submissionId: material.activeSubmission.id,
        decision,
        note: decisionNote || null,
      });
      setDecisionNote("");
      await refresh();
      toast.success("Parecer registrado para esta submissão.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível registrar o parecer."
      );
    }
  };

  const handleConsolidateInChapter = async () => {
    if (!selected?.activityId) return;
    try {
      await consolidateInChapter.mutateAsync({
        materialId: selected.id,
        note: consolidationNotes.trim() || undefined,
      });
      setConsolidationNotes("");
      await refresh();
      toast.success("Seção homologada e consolidada com sucesso no capítulo do estudo!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível consolidar a seção no capítulo."
      );
    }
  };

  if (isLoading || !data || !access) return <PageLoading />;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Elaboração e Revisão Editorial"
        title="Produção e revisão de materiais"
        description="Fluxo integrado de elaboração, envio de minutas, apontamentos de revisão técnica, atendimento de ajustes e homologação de capítulos."
        index="06 — Produção"
        action={
          access.canAccessActivities ? (
            <Button
              onClick={() => setCreateOpen(true)}
              className="rounded-md shadow-xs"
            >
              <Plus className="mr-2 h-4 w-4" /> Novo material
            </Button>
          ) : undefined
        }
      />

      {/* Global workflow stepper summary */}
      <div className="technical-panel p-5 bg-card/80">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-4">
          <div>
            <h3 className="font-editorial text-lg font-semibold flex items-center gap-2 text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Pipeline Editorial de Documentação (5 Etapas)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Acompanhe as fases formais do estudo: Minuta Inicial → Revisão Técnica → Ajustes do Autor → Validação & Parecer → Remissão de Capítulo.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              Regra de Integridade: Aprovação bloqueada se houver apontamentos não resolvidos
            </span>
          </div>
        </div>

        <DocumentationWorkflowStepper
          currentStage="revisao"
          className="border-0 shadow-none p-0 bg-transparent"
        />
      </div>

      {/* Workflow Tabs & Filter Controls */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 border-b pb-2">
          <Button
            variant={activeTab === "todos" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("todos")}
            className="rounded-full text-xs font-medium"
          >
            Todos os materiais ({data.length})
          </Button>
          <Button
            variant={activeTab === "minhas_acoes" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("minhas_acoes")}
            className="rounded-full text-xs font-medium relative"
          >
            Minhas ações pendentes
            {pendingActionsCount > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-white">
                {pendingActionsCount}
              </span>
            )}
          </Button>
          <Button
            variant={activeTab === "minuta" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("minuta")}
            className="rounded-full text-xs font-medium"
          >
            1 & 3. Minuta & Ajustes
          </Button>
          <Button
            variant={activeTab === "revisao" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("revisao")}
            className="rounded-full text-xs font-medium"
          >
            2 & 4. Em Revisão Técnica
          </Button>
          <Button
            variant={activeTab === "homologacao" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("homologacao")}
            className="rounded-full text-xs font-medium"
          >
            5. Homologação & Capítulo
          </Button>
        </div>

        <div className="technical-panel flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="data-label">
            {filtered.length} {filtered.length === 1 ? "material listado" : "materiais listados"}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {availableSections.length > 1 && (
              <Select value={sectionFilter} onValueChange={setSectionFilter}>
                <SelectTrigger className="w-56 bg-background text-xs">
                  <SelectValue placeholder="Filtrar por seção" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="todas">Todas as seções</SelectItem>
                  {availableSections.map(sec => (
                    <SelectItem key={sec.code} value={sec.code}>
                      {sec.code} — {sec.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-background text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os estados</SelectItem>
                <SelectItem value="em elaboração">Em elaboração</SelectItem>
                <SelectItem value="em revisão">Em revisão</SelectItem>
                <SelectItem value="ajustes solicitados">Ajustes solicitados</SelectItem>
                <SelectItem value="aprovado">Aprovados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyEditorial
          title="Nenhum material encontrado no filtro atual"
          text="Não há materiais correspondentes à aba ou aos filtros de seção e estado selecionados."
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {filtered.map(item => {
            const currentStage = getWorkflowStage(
              item.activityDocumentStatus,
              item.reviewStatus,
              item.openCommentCount + item.implementedCommentCount,
              item.revisions.length > 0,
              item.reviewStatus === "aprovado"
            );

            return (
              <article
                key={item.id}
                className="technical-panel border-t-[3px] border-t-primary p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <SectionMark code={item.sectionCode} />
                        <StatusBadge status={item.reviewStatus} />
                        {item.activityDocumentStatus && (
                          <span className="rounded bg-muted/80 px-2 py-0.5 text-[11px] font-medium text-foreground/80">
                            {item.activityDocumentStatus}
                          </span>
                        )}
                      </div>
                      <h2 className="mt-3 text-lg font-semibold leading-6">
                        {item.title}
                      </h2>
                    </div>
                    <span className="font-mono text-xl font-semibold text-muted-foreground/50">
                      v{String(item.currentRevision).padStart(2, "0")}
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description || "Material técnico em elaboração."}
                  </p>

                  <div className="mt-3 rounded-md border-l-4 border-primary bg-primary/5 px-4 py-2.5">
                    <p className="data-label">Atividade e grupo</p>
                    <p className="mt-1 text-sm font-semibold">
                      {item.activityTitle ?? "Material legado sem atividade"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {groupDisplayName(item.responsibleGroupName)}
                    </p>
                  </div>

                  {/* Compact Stepper on Card */}
                  <div className="mt-4 pt-3 border-t">
                    <DocumentationWorkflowStepper
                      compact
                      currentStage={currentStage}
                      openCommentCount={item.openCommentCount}
                      implementedCommentCount={item.implementedCommentCount}
                      resolvedCommentCount={item.resolvedCommentCount}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-md border text-center">
                    <div>
                      <p className="data-label bg-muted/55 px-2 py-1.5">Versões</p>
                      <p className="font-mono py-1.5 text-base font-semibold">{item.revisions.length}</p>
                    </div>
                    <div className="border-x">
                      <p className="data-label bg-muted/55 px-2 py-1.5">Revisores</p>
                      <p className="font-mono py-1.5 text-base font-semibold">{item.reviewers.length}</p>
                    </div>
                    <div>
                      <p className="data-label bg-muted/55 px-2 py-1.5">Apontamentos</p>
                      <p className="font-mono py-1.5 text-base font-semibold flex items-center justify-center gap-1">
                        <span>{item.resolvedCommentCount}</span>
                        <span className="text-muted-foreground text-xs font-normal">/ {item.totalAdjustmentComments}</span>
                        {item.openCommentCount > 0 && (
                          <span className="ml-1 h-2 w-2 rounded-full bg-amber-500" title={`${item.openCommentCount} aberto(s)`} />
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 border-t pt-3">
                  <Button
                    variant="default"
                    className="rounded-md shadow-xs"
                    onClick={() => setDetailMaterialId(item.id)}
                  >
                    <Eye className="mr-2 h-4 w-4" /> Estação de Revisão
                  </Button>
                  {item.permissions.canDevelop && (
                    <Button
                      variant="outline"
                      className="rounded-md"
                      onClick={() => {
                        setRevisionMaterialId(item.id);
                        resetUpload();
                      }}
                    >
                      <FileClock className="mr-2 h-4 w-4" /> Nova versão
                    </Button>
                  )}
                  {!item.activityId && access.isAdmin && (
                    <Select
                      value={item.reviewStatus}
                      onValueChange={async value => {
                        await setStatus.mutateAsync({
                          materialId: item.id,
                          reviewStatus: value as
                            | "em elaboração"
                            | "em revisão"
                            | "aprovado",
                        });
                        await refresh();
                      }}
                    >
                      <SelectTrigger className="w-40 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="em elaboração">em elaboração</SelectItem>
                        <SelectItem value="em revisão">em revisão</SelectItem>
                        <SelectItem value="aprovado">aprovado</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* DIALOG: NOVO MATERIAL */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto bg-card sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-semibold tracking-[-.03em]">
              Novo material técnico
            </DialogTitle>
            <DialogDescription>
              {access?.isAdmin
                ? "Como administrador, você pode carregar materiais para qualquer atividade ou seção do projeto."
                : "Carregamento restrito às seções e atividades alocadas ao seu perfil (coordenação, execução ou revisão)."}
            </DialogDescription>
          </DialogHeader>

          {!allocatedActivities || allocatedActivities.length === 0 ? (
            <div className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200">
              <p className="font-semibold">Nenhuma atividade ou seção alocada</p>
              <p className="mt-1 text-xs opacity-90 leading-relaxed">
                Seu usuário não possui atividades atribuídas como coordenador, executor ou revisor para carregar material. Se precisar de alocação nesta frente, solicite à coordenação do estudo.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label>Atividade / Seção alocada</Label>
                  <span className="text-[11px] text-muted-foreground">
                    {allocatedActivities.length}{" "}
                    {allocatedActivities.length === 1
                      ? "item alocado"
                      : "itens alocados"}
                  </span>
                </div>
                <Select value={activityId} onValueChange={setActivityId}>
                  <SelectTrigger className="mt-2 w-full">
                    <SelectValue placeholder="Selecione a atividade alocada" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {allocatedActivities.map(activity => (
                      <SelectItem key={activity.id} value={String(activity.id)}>
                        <span className="font-mono text-xs font-semibold mr-1.5 text-primary">
                          {activity.sectionCode}
                        </span>
                        <span>— {activity.title}</span>
                        <span className="ml-2 rounded px-1.5 py-0.5 text-[10px] uppercase font-medium tracking-wide bg-primary/10 text-primary">
                          {activity.allocationLabel}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label>Título do material</Label>
                <Input
                  className="mt-2"
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                  placeholder="Ex.: Relatório preliminar de premissas técnicas"
                />
              </div>
              <div>
                <Label>Seção vinculada</Label>
                <Input
                  className="mt-2"
                  value={
                    selectedActivity
                      ? `${selectedActivity.sectionCode} — ${selectedActivity.sectionTitle}`
                      : "Definida pela atividade selecionada"
                  }
                  disabled
                />
              </div>
              <div>
                <Label>Nota da versão</Label>
                <Input
                  className="mt-2"
                  value={notes}
                  onChange={event => setNotes(event.target.value)}
                  placeholder="Ex.: Minuta inicial para revisão"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  className="mt-2"
                  value={description}
                  onChange={event => setDescription(event.target.value)}
                  placeholder="Contexto, objetivo ou observações técnicas sobre o material."
                />
              </div>
            </div>
          )}
          <FilePicker file={file} onChange={setFile} label="Selecionar material técnico" />
          <Button
            onClick={saveMaterial}
            disabled={create.isPending || !allocatedActivities || allocatedActivities.length === 0}
            className="mt-4 w-full"
          >
            {create.isPending ? "Enviando…" : "Criar material e iniciar fluxo"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* DIALOG: NOVA VERSÃO */}
      <Dialog
        open={revisionMaterialId !== null}
        onOpenChange={open => !open && setRevisionMaterialId(null)}
      >
        <DialogContent className="bg-card sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-semibold tracking-[-.03em]">
              Registrar nova versão
            </DialogTitle>
            <DialogDescription>
              {revisionMaterial?.title}. O envio de uma nova versão avança o fluxo documental e permite que os revisores reavaliem o documento com base nas respostas aos apontamentos.
            </DialogDescription>
          </DialogHeader>
          <Label className="mt-3">Nota da nova versão</Label>
          <Textarea
            value={notes}
            onChange={event => setNotes(event.target.value)}
            placeholder="Ex.: Versão 2 contendo ajustes solicitados pelos revisores..."
          />
          <FilePicker file={file} onChange={setFile} label="Selecionar arquivo da nova versão" />
          <Button
            onClick={saveRevision}
            disabled={addRevision.isPending}
            className="mt-3 w-full"
          >
            {addRevision.isPending ? "Enviando…" : "Registrar versão"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* DIALOG: ESTAÇÃO COMPLETA DE REVISÃO EDITORIAL */}
      <Dialog
        open={detailMaterialId !== null}
        onOpenChange={open => !open && setDetailMaterialId(null)}
      >
        <DialogContent className="max-h-[94vh] overflow-y-auto bg-card sm:max-w-6xl">
          {selected && (() => {
            const currentStage = getWorkflowStage(
              selected.activityDocumentStatus,
              selected.reviewStatus,
              selected.openCommentCount + selected.implementedCommentCount,
              selected.revisions.length > 0,
              selected.reviewStatus === "aprovado"
            );

            const hasPendingAdjustments =
              selected.openCommentCount > 0 || selected.implementedCommentCount > 0;

            return (
              <>
                <DialogHeader className="border-b paper-rule pb-4 text-left">
                  <div className="flex flex-wrap items-center gap-3">
                    <SectionMark code={selected.sectionCode} />
                    <StatusBadge status={selected.reviewStatus} />
                    {selected.activityDocumentStatus && (
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        Doc: {selected.activityDocumentStatus}
                      </span>
                    )}
                    <span className="editorial-kicker text-muted-foreground ml-auto">
                      {selected.permissions.isGroupViewer
                        ? "Visão do grupo"
                        : selected.permissions.canReview
                          ? "Revisão atribuída"
                          : "Gestão da revisão"}
                    </span>
                  </div>
                  <DialogTitle className="font-display mt-2 text-2xl font-semibold tracking-[-.03em] md:text-3xl">
                    {selected.title}
                  </DialogTitle>
                  <DialogDescription className="font-editorial mt-1 text-base text-foreground/70">
                    {selected.activityTitle} · {groupDisplayName(selected.responsibleGroupName)}
                  </DialogDescription>
                </DialogHeader>

                {/* Workflow Stepper in Modal */}
                <div className="mt-2">
                  <DocumentationWorkflowStepper
                    currentStage={currentStage}
                    openCommentCount={selected.openCommentCount}
                    implementedCommentCount={selected.implementedCommentCount}
                    resolvedCommentCount={selected.resolvedCommentCount}
                  />
                </div>

                {/* Contextual Action Guide ("O que fazer agora") */}
                <div className="rounded-md border border-primary/20 bg-primary/5 p-4 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-primary">
                    <HelpCircle className="h-4 w-4" />
                    <span>Guia de Ação para seu Perfil ({selected.permissions.canDevelop ? "Autor / Executor" : selected.permissions.canReview ? "Revisor Técnico" : "Coordenador / Visualizador"})</span>
                  </div>
                  <div className="mt-1.5 text-foreground/80 leading-relaxed">
                    {selected.permissions.canDevelop && (
                      <>
                        {selected.reviewStatus === "em elaboração" && (
                          <p>
                            <strong>Fase 1 (Minuta):</strong> Sua minuta está em elaboração. Certifique-se de que o arquivo anexado está completo e clique em <em>"Submeter versão atual"</em> abaixo para disponibilizá-la aos revisores da seção.
                          </p>
                        )}
                        {(selected.activeSubmission?.status === "ajustes solicitados" || selected.activityDocumentStatus === "ajustes solicitados" || hasPendingAdjustments) && (
                          <p>
                            <strong>Fase 3 (Ajustes):</strong> Os revisores solicitaram alterações.
                            Verifique os apontamentos na coluna à direita, clique em <em>"Registrar implementação"</em> em cada um para documentar as soluções, anexe a <em>"Nova versão"</em> corrigida e submeta novamente para validação dos revisores.
                          </p>
                        )}
                        {selected.reviewStatus === "em revisão" && !hasPendingAdjustments && (
                          <p>
                            <strong>Fase 2 (Em Revisão):</strong> O documento foi submetido e está sendo analisado pelos revisores da seção. Você será notificado caso haja apontamentos ou quando o parecer for emitido.
                          </p>
                        )}
                        {selected.reviewStatus === "aprovado" && (
                          <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                            <strong>Aprovado na Seção!</strong> A documentação atendeu a todos os critérios dos revisores e todos os apontamentos foram solucionados. O Coordenador do Capítulo pode agora efetuar a remissão e consolidação no capítulo.
                          </p>
                        )}
                      </>
                    )}

                    {selected.permissions.canReview && (
                      <>
                        {selected.reviewStatus === "em revisão" && (
                          <p>
                            <strong>Fase 2 & 4 (Revisão & Parecer):</strong> Analise o arquivo técnico da versão submetida. Para cada ajuste necessário, registre um comentário como <em>"Solicitação de ajuste"</em>.
                            Para aprovar formalmente a versão, <strong>todos os apontamentos devem ser validados e marcados como "Resolvido"</strong>.
                          </p>
                        )}
                        {(selected.activeSubmission?.status === "ajustes solicitados" || selected.activityDocumentStatus === "ajustes solicitados") && (
                          <p>
                            <strong>Fase 3 (Aguardando Autor):</strong> Ajustes foram solicitados. Aguarde o autor implementar as correções, registrar as notas de atendimento e disponibilizar a nova versão.
                          </p>
                        )}
                        {selected.reviewStatus === "aprovado" && (
                          <p className="text-emerald-700 dark:text-emerald-300 font-medium">
                            <strong>Revisão Concluída:</strong> Você e a equipe revisora aprovaram a versão sem pendências remanescentes.
                          </p>
                        )}
                      </>
                    )}

                    {!selected.permissions.canDevelop && !selected.permissions.canReview && (
                      <p>
                        Acompanhe o andamento das submissões e resoluções de comentários entre os autores e os revisores designados.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
                  {/* Left Column: Submissions, Versions & Decision */}
                  <div className="space-y-6">
                    {/* Active Submission */}
                    <section>
                      <p className="editorial-kicker text-primary">Versão submetida para revisão</p>
                      {selected.activeSubmission ? (
                        <div className="mt-3 border-l-4 border-primary bg-card/60 p-5 rounded-r-md border">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-editorial text-xl font-semibold">
                                Versão {selected.activeSubmission.revisionNumber}
                              </p>
                              <p className="mt-1 text-xs uppercase tracking-[.12em] text-muted-foreground">
                                {selected.activeSubmission.status} · submetida em {formatDate(selected.activeSubmission.submittedAt)}
                              </p>
                            </div>
                            <StatusBadge status={selected.activeSubmission.status} />
                          </div>
                          {selected.activeSubmission.message && (
                            <p className="mt-3 text-sm leading-relaxed text-foreground/85 bg-muted/40 p-3 rounded">
                              <strong>Mensagem da submissão:</strong> {selected.activeSubmission.message}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="mt-3 border rounded-md p-4 text-center text-sm text-muted-foreground bg-muted/20">
                          A versão atual ainda não foi formalmente submetida aos revisores.
                        </div>
                      )}
                    </section>

                    {/* Submit for Review Action */}
                    {selected.permissions.canManageReview && (
                      <section className="rounded-md border p-4 bg-muted/20">
                        <p className="editorial-kicker text-primary">Disponibilizar versão atual aos revisores</p>
                        <Textarea
                          value={submissionMessage}
                          onChange={event => setSubmissionMessage(event.target.value)}
                          placeholder="Contextualize os pontos alterados, melhorias ou itens que merecem atenção dos revisores..."
                          className="mt-2 text-xs"
                        />
                        <Button
                          onClick={() => submit(selected)}
                          disabled={submitForReview.isPending || !selected.reviewers.length}
                          className="mt-3 w-full shadow-xs"
                        >
                          <Send className="mr-2 h-4 w-4" />
                          {submitForReview.isPending ? "Submetendo…" : "Submeter versão atual para revisão"}
                        </Button>
                        {!selected.reviewers.length && (
                          <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                            Atenção: Aloque ao menos um revisor na ficha da atividade antes de submeter.
                          </p>
                        )}
                      </section>
                    )}

                    {/* Version History */}
                    <section>
                      <p className="editorial-kicker text-primary">Histórico de versões ({selected.revisions.length})</p>
                      <div className="mt-3 divide-y paper-rule border rounded-md">
                        {selected.revisions.map(revision => (
                          <div key={revision.id} className="p-3.5 flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-editorial text-base font-semibold">
                                  Versão {revision.revisionNumber}
                                </p>
                                <span className="text-[11px] text-muted-foreground">
                                  {fileSize(revision.fileSize)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-sm">
                                {revision.fileName}
                              </p>
                              {revision.notes && (
                                <p className="mt-1.5 text-xs text-foreground/80 bg-muted/30 px-2 py-1 rounded">
                                  {revision.notes}
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadRevision(revision.id)}
                              aria-label={`Baixar versão ${revision.revisionNumber}`}
                              className="shrink-0 text-xs"
                            >
                              <Download className="mr-1.5 h-3.5 w-3.5" /> Baixar
                            </Button>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Reviewers Roster */}
                    <section>
                      <p className="editorial-kicker flex items-center gap-2 text-primary">
                        <ClipboardCheck className="h-4 w-4" /> Revisores técnicos designados
                      </p>
                      <div className="mt-3">
                        <ReviewerRoster material={selected} />
                      </div>
                    </section>

                    {/* Reviewer Decision Form (Strict enforcement of comment resolution) */}
                    {selected.permissions.canReview && selected.activeSubmission && (
                      <section className="rounded-md border-2 border-primary/40 bg-card p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="editorial-kicker text-primary font-bold">
                            Fase 4: Registrar Parecer Técnico
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {hasPendingAdjustments
                              ? `${selected.openCommentCount + selected.implementedCommentCount} pendência(s)`
                              : "Sem pendências"}
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
                          <Select
                            value={decision}
                            onValueChange={value => setDecision(value as ReviewDecision)}
                          >
                            <SelectTrigger className="text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="em revisão">Em revisão</SelectItem>
                              <SelectItem value="ajustes solicitados">Solicitar ajustes</SelectItem>
                              <SelectItem value="aprovado">Aprovar versão</SelectItem>
                            </SelectContent>
                          </Select>
                          <Textarea
                            value={decisionNote}
                            onChange={event => setDecisionNote(event.target.value)}
                            placeholder="Fundamente seu parecer técnico..."
                            className="min-h-16 text-xs"
                          />
                        </div>

                        {/* Strict Precondition Alert */}
                        {decision === "aprovado" && hasPendingAdjustments && (
                          <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-900 dark:text-red-200 flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                            <div>
                              <p className="font-semibold">Aprovação bloqueada por apontamentos pendentes</p>
                              <p className="mt-0.5 opacity-90 leading-relaxed">
                                Ainda existem <strong>{selected.openCommentCount} apontamento(s) em aberto</strong> e <strong>{selected.implementedCommentCount} em implementação</strong>.
                                Para aprovar a versão, aceite e marque como <em>"Resolvido"</em> cada um dos apontamentos atendidos na coluna ao lado.
                              </p>
                            </div>
                          </div>
                        )}

                        <Button
                          onClick={() => decide(selected)}
                          disabled={registerDecision.isPending || (decision === "aprovado" && hasPendingAdjustments)}
                          className="w-full shadow-xs"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          {registerDecision.isPending ? "Registrando…" : "Confirmar Parecer Técnico"}
                        </Button>
                      </section>
                    )}

                    {/* Chapter Consolidation Stage (Phase 5) */}
                    {(selected.reviewStatus === "aprovado" ||
                      selected.activityDocumentStatus === "revisada pela seção" ||
                      selected.activityDocumentStatus === "consolidada no capítulo") && (
                      <section className="rounded-md border-2 border-primary/30 bg-primary/5 p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FolderCheck className="h-5 w-5 text-primary" />
                            <h4 className="font-editorial text-base font-semibold">
                              Etapa 5: Remissão & Consolidação no Capítulo
                            </h4>
                          </div>
                          {selected.activityDocumentStatus === "consolidada no capítulo" ? (
                            <span className="rounded bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                              Consolidada no Capítulo
                            </span>
                          ) : (
                            <span className="rounded bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                              Pronta para Consolidação
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {selected.activityDocumentStatus === "consolidada no capítulo"
                            ? "Esta seção já foi homologada e integrada editorialmente ao capítulo correspondente do estudo pelo Coordenador do Capítulo."
                            : "Com a aprovação de todos os revisores e a resolução integral dos apontamentos, a seção está apta para homologação editorial e integração ao capítulo."}
                        </p>

                        {selected.activityDocumentStatus !== "consolidada no capítulo" &&
                          (access.isAdmin || selected.permissions.canManageReview) && (
                            <div className="mt-3 space-y-3 pt-2 border-t border-primary/20">
                              <Textarea
                                value={consolidationNotes}
                                onChange={e => setConsolidationNotes(e.target.value)}
                                placeholder="Notas ou parecer editorial de consolidação no capítulo..."
                                className="text-xs bg-background"
                              />
                              <Button
                                onClick={handleConsolidateInChapter}
                                disabled={consolidateInChapter.isPending || !selected.activityId}
                                className="w-full sm:w-auto"
                              >
                                <FolderCheck className="mr-2 h-4 w-4" />
                                {consolidateInChapter.isPending
                                  ? "Homologando…"
                                  : "Homologar e consolidar seção no capítulo"}
                              </Button>
                            </div>
                          )}
                      </section>
                    )}
                  </div>

                  {/* Right Column: Interactive Comments & Adjustments Lifecycle */}
                  <section className="border-l-0 paper-rule lg:border-l lg:pl-8 space-y-6">
                    <div className="flex items-center justify-between border-b paper-rule pb-3">
                      <div>
                        <p className="editorial-kicker flex items-center gap-2 text-primary font-bold">
                          <MessageSquare className="h-4 w-4" /> Apontamentos e Comentários ({selected.comments.length})
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {selected.resolvedCommentCount} resolvidos · {selected.implementedCommentCount} implementados · {selected.openCommentCount} abertos
                        </p>
                      </div>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                      {selected.comments.map(item => {
                        const isAdjustment = item.commentType === "solicitação de ajuste";
                        const isResolved = item.status === "resolvido" || Boolean(item.resolvedAt);
                        const isImplemented = item.status === "implementado";
                        const isOpen = !isResolved && !isImplemented;

                        return (
                          <div
                            key={item.id}
                            className={`rounded-md border p-4 transition-colors ${
                              isResolved
                                ? "bg-emerald-500/5 border-emerald-500/20"
                                : isImplemented
                                  ? "bg-sky-500/5 border-sky-500/20"
                                  : isAdjustment
                                    ? "bg-amber-500/5 border-amber-500/30"
                                    : "bg-muted/20 border-border"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <Avatar className="h-7 w-7 rounded-none">
                                  <AvatarFallback className="rounded-none text-xs">
                                    {initials(item.authorName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-xs font-semibold">{item.authorName}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {formatDate(item.createdAt)} · {item.commentType}
                                  </p>
                                </div>
                              </div>

                              {/* Comment Status Badge */}
                              {isAdjustment ? (
                                isResolved ? (
                                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                                    <CheckCircle2 className="h-3 w-3" /> Resolvido
                                  </span>
                                ) : isImplemented ? (
                                  <span className="inline-flex items-center gap-1 rounded bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:text-sky-300">
                                    <Clock className="h-3 w-3" /> Implementado
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                                    <AlertCircle className="h-3 w-3" /> Aberto
                                  </span>
                                )
                              ) : null}
                            </div>

                            {/* Comment Text */}
                            <p className="mt-2.5 text-sm leading-relaxed text-foreground/90 font-serif">
                              {item.content}
                            </p>

                            {/* Author's Implementation Note Box */}
                            {item.implementationNote && (
                              <div className="mt-3 rounded border border-sky-500/20 bg-sky-500/10 p-2.5 text-xs text-sky-950 dark:text-sky-200">
                                <div className="flex items-center justify-between font-semibold">
                                  <span>Nota de Implementação do Autor:</span>
                                  <span className="text-[10px] font-normal opacity-80">
                                    {item.implementedByName ? `${item.implementedByName} · ` : ""}
                                    {item.implementedAt ? formatDate(item.implementedAt) : ""}
                                  </span>
                                </div>
                                <p className="mt-1 leading-relaxed opacity-95">
                                  {item.implementationNote}
                                </p>
                              </div>
                            )}

                            {/* Action Buttons for Author & Reviewer */}
                            <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-2 text-xs">
                              {/* Author Implementation Trigger */}
                              {selected.permissions.canDevelop && isAdjustment && !isResolved && (
                                <>
                                  {implementingCommentId === item.id ? (
                                    <div className="w-full space-y-2 mt-1">
                                      <Textarea
                                        value={implementationNote}
                                        onChange={e => setImplementationNote(e.target.value)}
                                        placeholder="Descreva detalhadamente como o apontamento foi atendido nesta versão..."
                                        className="text-xs min-h-16"
                                      />
                                      <div className="flex items-center gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => handleImplementComment(item.id)}
                                          disabled={implementComment.isPending}
                                          className="text-xs"
                                        >
                                          Confirmar implementação
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            setImplementingCommentId(null);
                                            setImplementationNote("");
                                          }}
                                          className="text-xs"
                                        >
                                          Cancelar
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs h-7"
                                      onClick={() => {
                                        setImplementingCommentId(item.id);
                                        setImplementationNote(item.implementationNote || "");
                                      }}
                                    >
                                      <FileEdit className="mr-1 h-3 w-3" />
                                      {item.implementationNote ? "Editar implementação" : "Registrar implementação"}
                                    </Button>
                                  )}
                                </>
                              )}

                              {/* Reviewer / Coordinator Resolution Buttons */}
                              {(selected.permissions.canReview || selected.permissions.canManageReview) && isAdjustment && (
                                <>
                                  {!isResolved ? (
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 ml-auto"
                                      onClick={() => handleResolveComment(item.id, true)}
                                      disabled={resolveComment.isPending}
                                    >
                                      <CheckCircle2 className="mr-1 h-3 w-3" /> Aceitar e Marcar Resolvido
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-muted-foreground hover:text-foreground text-xs h-7 ml-auto"
                                      onClick={() => handleResolveComment(item.id, false)}
                                      disabled={resolveComment.isPending}
                                    >
                                      <RotateCcw className="mr-1 h-3 w-3" /> Reabrir apontamento
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {!selected.comments.length && (
                        <p className="py-7 text-center text-sm text-muted-foreground">
                          Nenhum comentário ou apontamento registrado nesta revisão.
                        </p>
                      )}
                    </div>

                    {/* New Comment Form */}
                    {(selected.permissions.canReview || selected.permissions.canManageReview) &&
                      selected.activeSubmission && (
                        <div className="rounded-md border p-4 bg-muted/20 space-y-3">
                          <Label className="text-xs font-semibold">Adicionar apontamento ou comentário</Label>
                          <Select
                            value={commentType}
                            onValueChange={value => setCommentType(value as CommentType)}
                          >
                            <SelectTrigger className="w-full text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="comentário">Comentário geral</SelectItem>
                              {selected.permissions.canReview && (
                                <SelectItem value="solicitação de ajuste">Solicitação de ajuste (Gera pendência formal)</SelectItem>
                              )}
                              {selected.permissions.canManageReview && (
                                <SelectItem value="resposta">Resposta formal da equipe</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <Textarea
                            value={comment}
                            onChange={event => setComment(event.target.value)}
                            placeholder={
                              commentType === "solicitação de ajuste"
                                ? "Descreva o ajuste técnico necessário de forma clara e acionável..."
                                : "Comentário técnico sobre a submissão..."
                            }
                            className="text-xs min-h-16"
                          />
                          <Button
                            className="w-full text-xs"
                            onClick={() => commentOnSubmission(selected)}
                            disabled={addComment.isPending || !comment.trim()}
                          >
                            <MessageSquare className="mr-2 h-4 w-4" /> Registrar apontamento
                          </Button>
                        </div>
                      )}
                  </section>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
