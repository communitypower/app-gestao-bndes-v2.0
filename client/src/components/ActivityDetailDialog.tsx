import { useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatDate, fileSize, dueTone } from "@/lib/format";
import { studyTomeFromCode, type ActivityStatus } from "@shared/domain";
import { groupDisplayName } from "../../../shared/groupDisplay";
import { OFFICIAL_MONTH_MILESTONES } from "@shared/officialScheduleMes3";
import {
  DocumentationWorkflowStepper,
  getWorkflowStage,
  type WorkflowStage,
} from "./DocumentationWorkflowStepper";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PageLoading,
  SectionMark,
  StatusBadge,
} from "@/components/EditorialUI";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Clock3,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileCheck2,
  FileClock,
  FileDown,
  FileText,
  FileUp,
  History,
  Layers,
  Link as LinkIcon,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
  UserCheck,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

interface ActivityDetailDialogProps {
  activityId: number | null;
  onOpenChange: (open: boolean) => void;
  isAdmin?: boolean;
  initialAction?: "upload_minuta" | "upload_revision" | null;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ActivityDetailDialog({
  activityId,
  onOpenChange,
  isAdmin = false,
  initialAction,
}: ActivityDetailDialogProps) {
  const utils = trpc.useUtils();
  const { data: access } = trpc.administration?.status?.useQuery
    ? trpc.administration.status.useQuery()
    : ({ data: null } as any);

  const { data, isLoading } = trpc.activities?.detail?.useQuery
    ? trpc.activities.detail.useQuery(
        { id: activityId ?? 0 },
        { enabled: activityId !== null && activityId > 0 }
      )
    : ({ data: null, isLoading: false } as any);

  const { data: materials } = trpc.production?.list?.useQuery
    ? trpc.production.list.useQuery(undefined, {
        enabled: activityId !== null && activityId > 0,
      })
    : ({ data: [] } as any);

  // Hidden native file input refs for immediate Explorer activation
  const initialFileInputRef = useRef<HTMLInputElement>(null);
  const revisionFileInputRef = useRef<HTMLInputElement>(null);

  // Mutations
  const createMaterial = trpc.production?.create?.useMutation
    ? trpc.production.create.useMutation()
    : ({ mutateAsync: async () => {}, isPending: false } as any);
  const addRevision = trpc.production?.addRevision?.useMutation
    ? trpc.production.addRevision.useMutation()
    : ({ mutateAsync: async () => {}, isPending: false } as any);
  const registerDecision = trpc.production?.reviewDecision?.useMutation
    ? trpc.production.reviewDecision.useMutation()
    : ({ mutateAsync: async () => {}, isPending: false } as any);
  const consolidateInChapter = trpc.production?.consolidateInChapter?.useMutation
    ? trpc.production.consolidateInChapter.useMutation()
    : ({ mutateAsync: async () => {}, isPending: false } as any);
  const addComment = trpc.production?.addComment?.useMutation
    ? trpc.production.addComment.useMutation()
    : ({ mutateAsync: async () => {}, isPending: false } as any);
  const updateReviewers = trpc.activities?.updateReviewers?.useMutation
    ? trpc.activities.updateReviewers.useMutation()
    : ({ mutateAsync: async () => {}, isPending: false } as any);

  // Active Tab inside modal
  const [activeTab, setActiveTab] = useState<"documento" | "escopo">("documento");

  // Form states for uploading Initial Minuta
  const [isUploadingMinuta, setIsUploadingMinuta] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadNotes, setUploadNotes] = useState("");

  // Form state for designating reviewer (Prof. Floriano)
  const [isAssigningReviewer, setIsAssigningReviewer] = useState(false);
  const [selectedReviewerId, setSelectedReviewerId] = useState<string>("");

  // Form states for adding new revision (R02, R03...)
  const [isAddingRevision, setIsAddingRevision] = useState(false);
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [revisionNotes, setRevisionNotes] = useState("");

  // Form states for Review Decision (Revisor Técnico)
  const [isDecidingReview, setIsDecidingReview] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<"aprovado" | "ajustes solicitados">("aprovado");
  const [reviewDecisionNote, setReviewDecisionNote] = useState("");

  // Form state for Comment
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [commentContent, setCommentContent] = useState("");

  // Form state for Homologation
  const [homologationNote, setHomologationNote] = useState("");

  // Match corresponding production material
  const currentMaterial = useMemo(() => {
    if (!activityId) return null;
    if (materials && materials.length > 0) {
      const found = materials.find((m: any) => m.activityId === activityId);
      if (found) return found;
    }
    if (data?.productionMaterials && data.productionMaterials.length > 0) {
      return data.productionMaterials[0];
    }
    return null;
  }, [activityId, materials, data?.productionMaterials]);

  // Compute current workflow stage (6 sequential steps)
  const currentStage: WorkflowStage = useMemo(() => {
    return getWorkflowStage(
      data?.documentStatus,
      currentMaterial?.reviewStatus,
      currentMaterial?.openCommentCount ?? 0,
      Boolean(currentMaterial),
      currentMaterial?.reviewStatus === "aprovado",
      (data?.reviewers?.length ?? 0) > 0,
      currentMaterial?.implementedCommentCount ?? 0
    );
  }, [data, currentMaterial]);

  // Compute official Wave
  const officialMilestone = useMemo(() => {
    if (!data?.dueAt) return null;
    return (
      OFFICIAL_MONTH_MILESTONES.find(
        m => Math.abs(m.dueAt - data.dueAt) < 15 * 24 * 60 * 60 * 1000
      ) ?? null
    );
  }, [data?.dueAt]);

  const isGeneralCoord = Boolean(
    access?.isAdmin ||
    access?.isGeneralCoordinator ||
    data?.canAssignReviewers ||
    data?.isGeneralCoordinator
  );
  const isAuthorCoordinator = Boolean(
    data?.isCoordinator ||
    data?.isExecutor ||
    (access?.teamMembership?.groupId && data?.responsibleGroupId === access.teamMembership.groupId)
  );
  const isDesignatedReviewer = Boolean(
    data?.isReviewer ||
    (data?.reviewers && data.reviewers.some((r: any) => r.teamMemberId === access?.teamMembership?.id))
  );

  const refreshAll = async () => {
    await Promise.all([
      utils.activities.detail.invalidate(),
      utils.activities.list.invalidate(),
      utils.production.list.invalidate(),
      utils.activities.myWorkloadActions.invalidate(),
      utils.governance.overview.invalidate(),
    ]);
  };

  // Handlers for triggering native OS file explorer immediately
  const handleTriggerInitialFileInput = () => {
    if (data?.title && !uploadTitle) {
      setUploadTitle(data.title);
    }
    setIsUploadingMinuta(true);
    initialFileInputRef.current?.click();
  };

  const handleTriggerRevisionFileInput = () => {
    setIsAddingRevision(true);
    revisionFileInputRef.current?.click();
  };

  const handleInitialFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!uploadTitle && data?.title) {
        setUploadTitle(data.title);
      }
      setIsUploadingMinuta(true);
      toast.success(`Arquivo "${file.name}" selecionado! Confirme o envio da minuta abaixo.`);
    }
  };

  const handleRevisionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRevisionFile(file);
      setIsAddingRevision(true);
      toast.success(`Arquivo "${file.name}" selecionado para a nova versão.`);
    }
  };

  // Auto-open file picker when requested from action center CTA
  useEffect(() => {
    if (activityId && initialAction === "upload_minuta") {
      setIsUploadingMinuta(true);
      if (data?.title && !uploadTitle) {
        setUploadTitle(data.title);
      }
      const timer = setTimeout(() => {
        initialFileInputRef.current?.click();
      }, 200);
      return () => clearTimeout(timer);
    } else if (activityId && initialAction === "upload_revision") {
      setIsAddingRevision(true);
      const timer = setTimeout(() => {
        revisionFileInputRef.current?.click();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [activityId, initialAction, data?.title]);

  // Reset states when dialog closes
  useEffect(() => {
    if (!activityId) {
      setIsUploadingMinuta(false);
      setUploadFile(null);
      setUploadTitle("");
      setUploadDescription("");
      setUploadNotes("");
      setIsAddingRevision(false);
      setRevisionFile(null);
      setRevisionNotes("");
      setIsAssigningReviewer(false);
      setIsDecidingReview(false);
      setIsAddingComment(false);
    }
  }, [activityId]);

  // Download revision file
  const handleDownloadRevision = async (revisionId: number) => {
    try {
      const result = await utils.production.accessRevision.fetch({ revisionId });
      if (result?.url) {
        window.open(result.url, "_blank", "noopener,noreferrer");
      }
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível baixar o arquivo da revisão.");
    }
  };

  // Assign Reviewer (Prof. Floriano)
  const handleAssignReviewer = async () => {
    if (!data || !selectedReviewerId) {
      toast.error("Selecione o revisor técnico independente.");
      return;
    }
    try {
      await updateReviewers.mutateAsync({
        id: data.id,
        reviewerIds: [Number(selectedReviewerId)],
      });
      toast.success("Revisor técnico independente indicado pelo Prof. Floriano com sucesso!");
      setIsAssigningReviewer(false);
      setSelectedReviewerId("");
      await refreshAll();
    } catch (err: any) {
      toast.error(err?.message || "Falha ao indicar revisor.");
    }
  };

  // Upload Initial Minuta
  const handleUploadInitialMinuta = async () => {
    if (!data || !uploadFile) {
      toast.error("Selecione um arquivo de minuta (Word ou PDF).");
      return;
    }
    try {
      const base64 = await fileToBase64(uploadFile);
      await createMaterial.mutateAsync({
        title: uploadTitle.trim() || data.title,
        description: uploadDescription.trim() || data.description || null,
        activityId: data.id,
        sectionId: data.sectionId,
        notes: uploadNotes.trim() || null,
        file: {
          fileName: uploadFile.name,
          mimeType: uploadFile.type || "application/octet-stream",
          fileSize: uploadFile.size,
          base64,
        },
      });
      toast.success("Minuta inicial enviada com sucesso para a Coordenação Geral!");
      setIsUploadingMinuta(false);
      setUploadFile(null);
      setUploadNotes("");
      await refreshAll();
    } catch (err: any) {
      toast.error(err?.message || "Falha ao enviar minuta.");
    }
  };

  // Upload New Revision
  const handleUploadNewRevision = async () => {
    if (!currentMaterial || !revisionFile) {
      toast.error("Selecione o arquivo da nova revisão.");
      return;
    }
    try {
      const base64 = await fileToBase64(revisionFile);
      await addRevision.mutateAsync({
        materialId: currentMaterial.id,
        notes: revisionNotes.trim() || null,
        file: {
          fileName: revisionFile.name,
          mimeType: revisionFile.type || "application/octet-stream",
          fileSize: revisionFile.size,
          base64,
        },
      });
      toast.success(`Nova versão (R0${currentMaterial.currentRevision + 1}) enviada com sucesso para revisão!`);
      setIsAddingRevision(false);
      setRevisionFile(null);
      setRevisionNotes("");
      await refreshAll();
    } catch (err: any) {
      toast.error(err?.message || "Falha ao enviar revisão.");
    }
  };

  // Register Review Decision (Revisor Técnico)
  const handleRegisterReviewDecision = async () => {
    if (!currentMaterial) return;
    try {
      await registerDecision.mutateAsync({
        submissionId: currentMaterial.activeSubmission?.id ?? null,
        materialId: currentMaterial.id,
        activityId: currentMaterial.activityId ?? null,
        decision: reviewDecision,
        note: reviewDecisionNote.trim() || null,
      });
      toast.success(
        reviewDecision === "aprovado"
          ? "Minuta aprovada com parecer técnico favorável!"
          : "Comentários e solicitação de ajustes enviados ao autor do grupo."
      );
      setIsDecidingReview(false);
      setReviewDecisionNote("");
      await refreshAll();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao registrar decisão de revisão.");
    }
  };

  // Consolidate in Chapter (Homologação)
  const handleHomologateInChapter = async () => {
    if (!currentMaterial) return;
    try {
      await consolidateInChapter.mutateAsync({
        materialId: currentMaterial.id,
        note: homologationNote.trim() || undefined,
      });
      toast.success("Capítulo homologado e consolidado no relatório final com sucesso!");
      setHomologationNote("");
      await refreshAll();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao homologar capítulo.");
    }
  };

  // Add Comment
  const handleAddComment = async () => {
    if (!currentMaterial || !commentContent.trim()) return;
    try {
      await addComment.mutateAsync({
        materialId: currentMaterial.id,
        content: commentContent.trim(),
        commentType: "comentário",
      });
      toast.success("Comentário registrado no histórico.");
      setIsAddingComment(false);
      setCommentContent("");
      await refreshAll();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao adicionar comentário.");
    }
  };

  return (
    <Dialog open={activityId !== null && activityId > 0} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto bg-card w-[96vw] sm:max-w-[94vw] lg:max-w-[1240px] xl:max-w-[1380px] p-6 sm:p-8">
        {/* Hidden inputs directly connected to native file explorer */}
        <input
          type="file"
          ref={initialFileInputRef}
          accept=".pdf,.doc,.docx,.rtf"
          className="hidden"
          onChange={handleInitialFileChange}
        />
        <input
          type="file"
          ref={revisionFileInputRef}
          accept=".pdf,.doc,.docx,.rtf"
          className="hidden"
          onChange={handleRevisionFileChange}
        />

        {isLoading || !data ? (
          <div className="py-20 text-center text-sm text-muted-foreground animate-pulse">
            Carregando Ficha da Atividade…
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header da Ficha */}
            <DialogHeader className="border-b paper-rule pb-4 text-left">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                    Ficha da Atividade
                  </span>
                  <SectionMark code={data.planCode ?? data.sectionCode} />
                  <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                    {studyTomeFromCode(data.sectionCode)}
                  </span>
                  {officialMilestone && (
                    <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                      {officialMilestone.label}
                    </span>
                  )}
                  <StatusBadge status={data.status} />
                </div>
              </div>

              <DialogTitle className="font-display mt-2 text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug break-words">
                {data.title}
              </DialogTitle>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold text-foreground">Coordenador / Autor: {data.responsibleName}</span>
                </div>
                {data.groupName && (
                  <div className="flex items-center gap-1.5 border-l pl-3 font-medium text-foreground">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <span>{groupDisplayName(data.groupName)}</span>
                  </div>
                )}
                {data.dueAt && (
                  <div className="flex items-center gap-1.5 border-l pl-3">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" />
                    <span>Prazo oficial: {formatDate(data.dueAt)}</span>
                  </div>
                )}
                {data.reviewers && data.reviewers.length > 0 && (
                  <div className="flex items-center gap-1.5 border-l pl-3 text-amber-700 dark:text-amber-300 font-semibold">
                    <UserCheck className="h-3.5 w-3.5 text-amber-600" />
                    <span>Revisor: {data.reviewers.map((r: any) => r.name).join(", ")}</span>
                  </div>
                )}
              </div>
            </DialogHeader>

            {/* Stepper Oficial do Ciclo de 6 Passos */}
            <DocumentationWorkflowStepper
              currentStage={currentStage}
              openCommentCount={currentMaterial?.openCommentCount ?? 0}
              implementedCommentCount={currentMaterial?.implementedCommentCount ?? 0}
              resolvedCommentCount={currentMaterial?.resolvedCommentCount ?? 0}
            />

            {/* Abas da Ficha */}
            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} className="w-full">
              <TabsList className="grid grid-cols-2 w-full max-w-sm mb-4">
                <TabsTrigger value="documento" className="text-xs font-medium gap-1.5 cursor-pointer">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Fluxo Documental</span>
                </TabsTrigger>
                <TabsTrigger value="escopo" className="text-xs font-medium gap-1.5 cursor-pointer">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Escopo Oficial</span>
                </TabsTrigger>
              </TabsList>

              {/* ABA 1: FLUXO DOCUMENTAL */}
              <TabsContent value="documento" className="space-y-5">
                {/* 1. Status Documental Geral */}
                <div className="rounded-lg border bg-muted/25 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="editorial-kicker text-muted-foreground text-[10px]">Situação do Documento</span>
                    <h4 className="font-semibold text-foreground mt-0.5 flex items-center gap-2">
                      {currentMaterial ? (
                        <>
                          <FileCheck className="h-4 w-4 text-primary" />
                          <span>Versão R0{currentMaterial.currentRevision}</span>
                          <Badge variant="outline" className="text-xs font-semibold">
                            {currentMaterial.reviewStatus}
                          </Badge>
                        </>
                      ) : (
                        <>
                          <Clock3 className="h-4 w-4 text-amber-500" />
                          <span className="text-amber-700 dark:text-amber-400">Minuta Inicial Pendente de Carga</span>
                        </>
                      )}
                    </h4>
                  </div>

                  {/* Ações Diretas por Etapa */}
                  <div className="flex flex-wrap items-center gap-2">
                    {!currentMaterial ? (
                      <Button
                        size="sm"
                        onClick={handleTriggerInitialFileInput}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer shadow-xs"
                      >
                        <FileUp className="mr-1.5 h-4 w-4" /> Subir Minuta Inicial (R01)
                      </Button>
                    ) : (
                      <>
                        {/* Se não tem revisores e é Prof. Floriano / Admin */}
                        {data.reviewers.length === 0 && isGeneralCoord && (
                          <Button
                            size="sm"
                            onClick={() => setIsAssigningReviewer(true)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer"
                          >
                            <UserCheck className="mr-1.5 h-4 w-4" /> Indicar Revisor (Prof. Floriano)
                          </Button>
                        )}
                        {/* Autor subindo nova revisão R02+ */}
                        {isAuthorCoordinator && currentMaterial.reviewStatus !== "em revisão" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleTriggerRevisionFileInput}
                            className="font-medium cursor-pointer"
                          >
                            <FileClock className="mr-1.5 h-4 w-4 text-primary" /> Subir Nova Versão (R0{currentMaterial.currentRevision + 1})
                          </Button>
                        )}
                        {/* Revisor emitindo parecer */}
                        {(isDesignatedReviewer || isGeneralCoord) && currentMaterial.reviewStatus === "em revisão" && (
                          <Button
                            size="sm"
                            onClick={() => setIsDecidingReview(true)}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer"
                          >
                            <Pencil className="mr-1.5 h-4 w-4" /> Emitir Comentários / Parecer
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* PASSO 1: CARGA DA MINUTA INICIAL (Área de Upload Interativa e Imediata) */}
                {!currentMaterial && (
                  <div className="rounded-xl border-2 border-primary/40 bg-card p-5 space-y-4 shadow-sm animate-in fade-in">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                      <div>
                        <span className="editorial-kicker text-primary font-bold text-[10px]">Passo 1 do Ciclo Editorial</span>
                        <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                          <FileUp className="h-5 w-5 text-primary" /> Carga da Minuta Inicial (R01)
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Faça o upload do documento da minuta inicial para abrir o fluxo de revisão independente da Coordenação Geral.
                        </p>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        onClick={handleTriggerInitialFileInput}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer shadow-xs"
                      >
                        <Upload className="mr-1.5 h-4 w-4" />
                        {uploadFile ? "Trocar Arquivo no Explorer" : "Abrir Explorer para Selecionar"}
                      </Button>
                    </div>

                    {/* Dropzone / Área de Arquivo Selecionado */}
                    {!uploadFile ? (
                      <div
                        onClick={handleTriggerInitialFileInput}
                        className="group flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary p-6 text-center cursor-pointer transition-all"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform mb-2.5">
                          <FileUp className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          Clique aqui para abrir o Explorer do seu computador
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Selecione o arquivo da Minuta Técnica (Word <span className="font-mono font-semibold">.docx</span> ou <span className="font-mono font-semibold">.pdf</span>)
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-3 text-xs font-semibold bg-background pointer-events-none"
                        >
                          📂 Selecionar Documento
                        </Button>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                              <FileCheck2 className="h-6 w-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                  Arquivo selecionado com sucesso
                                </span>
                                <Badge className="bg-emerald-600 text-white font-mono text-[10px] px-1.5 py-0">
                                  {fileSize(uploadFile.size)}
                                </Badge>
                              </div>
                              <p className="text-xs font-mono font-semibold text-foreground mt-0.5 break-all">
                                {uploadFile.name}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={handleTriggerInitialFileInput}
                              className="h-8 text-xs cursor-pointer"
                            >
                              Trocar Arquivo
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setUploadFile(null)}
                              className="h-8 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                            >
                              Remover
                            </Button>
                          </div>
                        </div>

                        {/* Campos complementares */}
                        <div className="space-y-3 pt-1">
                          <div>
                            <Label className="text-xs font-semibold">Título do Documento</Label>
                            <Input
                              value={uploadTitle || data.title}
                              onChange={e => setUploadTitle(e.target.value)}
                              placeholder="Título da Minuta Técnica..."
                              className="mt-1 h-9 text-xs bg-card"
                            />
                          </div>

                          <div>
                            <Label className="text-xs font-semibold">Observações para a Coordenação Geral (Opcional)</Label>
                            <Textarea
                              value={uploadNotes}
                              onChange={e => setUploadNotes(e.target.value)}
                              placeholder="Informe os destaques desta versão, metodologia aplicada ou orientações aos revisores..."
                              className="mt-1 min-h-[70px] text-xs bg-card"
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-emerald-500/20">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setUploadFile(null)}
                              className="h-9 text-xs"
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleUploadInitialMinuta}
                              disabled={createMaterial.isPending}
                              className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                            >
                              {createMaterial.isPending ? "Enviando Documento..." : "✅ Confirmar Envio da Minuta Inicial (R01)"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PASSO 2: PAINEL DE INDICAÇÃO DE REVISOR (Prof. Floriano) */}
                {(data.reviewers ?? []).length === 0 && (
                  <div className={`rounded-lg border ${!currentMaterial ? "border-border/60 bg-muted/20 opacity-75" : "border-amber-500/40 bg-amber-500/5"} p-4 space-y-3`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                          <UserCheck className={`h-4 w-4 ${!currentMaterial ? "text-muted-foreground" : "text-amber-600"}`} /> Passo 2: Indicação de Revisor Técnico Independente
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {!currentMaterial
                            ? "A indicação do revisor técnico independente pelo Prof. Floriano será liberada assim que a minuta inicial (R01) for enviada no Passo 1."
                            : isGeneralCoord
                            ? "Como Coordenador Geral, o Prof. Floriano deve selecionar o revisor técnico independente para esta seção."
                            : "Minuta inicial no sistema. Aguardando a indicação do revisor técnico independente pelo Prof. Floriano."}
                        </p>
                      </div>
                      {currentMaterial && isGeneralCoord && !isAssigningReviewer && (
                        <Button
                          size="sm"
                          onClick={() => setIsAssigningReviewer(true)}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer shrink-0"
                        >
                          <UserCheck className="mr-1.5 h-4 w-4" /> Selecionar Revisor
                        </Button>
                      )}
                    </div>

                    {isAssigningReviewer && isGeneralCoord && currentMaterial && (
                      <div className="mt-3 pt-3 border-t border-amber-500/20 space-y-3">
                        <div>
                          <Label className="text-xs font-semibold">Selecione o Revisor Independente (Prof. Floriano)</Label>
                          <Select
                            value={selectedReviewerId}
                            onValueChange={setSelectedReviewerId}
                          >
                            <SelectTrigger className="mt-1 h-9 text-xs bg-card">
                              <SelectValue placeholder="Escolha um pesquisador qualificado de outro grupo..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-72">
                              {data.eligibleReviewers?.map((rev: any) => (
                                <SelectItem key={rev.id} value={String(rev.id)}>
                                  {rev.name} — {rev.institution || "UFRJ"} {rev.groupName ? `(${rev.groupName})` : ""} {rev.currentReviewCount > 0 ? `[${rev.currentReviewCount} revisão em curso]` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsAssigningReviewer(false)}
                            className="h-8 text-xs"
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleAssignReviewer}
                            disabled={!selectedReviewerId || updateReviewers.isPending}
                            className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                          >
                            {updateReviewers.isPending ? "Indicando..." : "Confirmar Indicação de Revisor"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* MODAL / FORMULÁRIO DE NOVA REVISÃO (R02, R03...) */}
                {isAddingRevision && currentMaterial && (
                  <div className="rounded-xl border-2 border-primary/40 bg-card p-5 space-y-4 shadow-sm animate-in fade-in">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                      <div>
                        <span className="editorial-kicker text-primary font-bold text-[10px]">Passo 4 do Ciclo Editorial</span>
                        <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                          <FileClock className="h-5 w-5 text-primary" /> Envio de Nova Revisão (R0{currentMaterial.currentRevision + 1})
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Envie o documento revisado com a implementação dos comentários da Coordenação Geral / Revisor Técnico.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsAddingRevision(false)}
                        className="h-7 text-xs cursor-pointer"
                      >
                        Fechar
                      </Button>
                    </div>

                    {!revisionFile ? (
                      <div
                        onClick={handleTriggerRevisionFileInput}
                        className="group flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary p-6 text-center cursor-pointer transition-all"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform mb-2.5">
                          <FileClock className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          Clique aqui para abrir o Explorer e selecionar o arquivo revisado (R0{currentMaterial.currentRevision + 1})
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Selecione o arquivo com as alterações implementadas (Word <span className="font-mono font-semibold">.docx</span> ou <span className="font-mono font-semibold">.pdf</span>)
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-3 text-xs font-semibold bg-background pointer-events-none"
                        >
                          📂 Selecionar Documento Revisado
                        </Button>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                              <FileCheck2 className="h-6 w-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                  Arquivo revisado selecionado
                                </span>
                                <Badge className="bg-emerald-600 text-white font-mono text-[10px] px-1.5 py-0">
                                  {fileSize(revisionFile.size)}
                                </Badge>
                              </div>
                              <p className="text-xs font-mono font-semibold text-foreground mt-0.5 break-all">
                                {revisionFile.name}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={handleTriggerRevisionFileInput}
                              className="h-8 text-xs cursor-pointer"
                            >
                              Trocar Arquivo
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setRevisionFile(null)}
                              className="h-8 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                            >
                              Remover
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-3 pt-1">
                          <div>
                            <Label className="text-xs font-semibold">Resumo das Alterações / Resposta aos Apontamentos *</Label>
                            <Textarea
                              value={revisionNotes}
                              onChange={e => setRevisionNotes(e.target.value)}
                              placeholder="Descreva as modificações efetuadas nesta versão em resposta aos apontamentos da revisão técnica..."
                              className="mt-1 min-h-[80px] text-xs bg-card"
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-emerald-500/20">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setIsAddingRevision(false)}
                              className="h-9 text-xs"
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleUploadNewRevision}
                              disabled={addRevision.isPending}
                              className="h-9 px-4 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                            >
                              {addRevision.isPending ? "Enviando Revisão..." : `✅ Submeter Versão R0${currentMaterial.currentRevision + 1} para Revisão`}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* MODAL / FORMULÁRIO DE EMISSÃO DE PARECER (Coordenação Geral) */}
                {isDecidingReview && currentMaterial && (
                  <div className="rounded-lg border border-primary/40 bg-card p-5 space-y-4 shadow-sm animate-in fade-in">
                    <div className="flex items-center justify-between border-b pb-3">
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        <Pencil className="h-4 w-4 text-primary" /> Parecer de Revisão da Coordenação Geral
                      </h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsDecidingReview(false)}
                        className="h-7 text-xs"
                      >
                        Cancelar
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Decisão Editorial</Label>
                        <Select
                          value={reviewDecision}
                          onValueChange={(val: any) => setReviewDecision(val)}
                        >
                          <SelectTrigger className="mt-1 h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aprovado">✅ Aprovar Minuta (Parecer Favorável)</SelectItem>
                            <SelectItem value="ajustes solicitados">⚠️ Solicitar Ajustes ao Autor / Grupo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Justificativa e Apontamentos do Parecer</Label>
                        <Textarea
                          value={reviewDecisionNote}
                          onChange={e => setReviewDecisionNote(e.target.value)}
                          placeholder="Insira as observações técnicas, comentários ou instruções de ajuste para o autor..."
                          className="mt-1 min-h-[80px] text-xs"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsDecidingReview(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleRegisterReviewDecision}
                          disabled={registerDecision.isPending}
                        >
                          {registerDecision.isPending ? "Registrando..." : "Registrar Parecer"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Histórico de Versões e Arquivos */}
                {currentMaterial && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                        <History className="h-4 w-4 text-primary" /> Versões e Arquivos Submetidos ({currentMaterial.revisions.length})
                      </h4>
                    </div>

                    <div className="space-y-2">
                      {currentMaterial.revisions.map((rev: any, index: number) => (
                        <div
                          key={rev.id}
                          className="rounded-md border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card hover:bg-muted/20 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary" className="font-mono text-xs font-semibold shrink-0">
                                Versão {rev.revisionNumber}
                              </Badge>
                              <span className="text-xs font-medium text-foreground break-words break-all">
                                {rev.fileName || `Minuta_R0${rev.revisionNumber}`}
                              </span>
                              {index === 0 && (
                                <Badge variant="outline" className="text-[10px] text-primary border-primary/30 shrink-0">
                                  Mais Recente
                                </Badge>
                              )}
                            </div>
                            {rev.fileSize && (
                              <div className="text-[11px] text-muted-foreground mt-1">
                                {fileSize(rev.fileSize)}
                              </div>
                            )}
                            {rev.notes && (
                              <p className="mt-1.5 text-xs text-muted-foreground/90 bg-muted/30 rounded p-2 leading-relaxed break-words">
                                {rev.notes}
                              </p>
                            )}
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadRevision(rev.id)}
                            className="h-8 gap-1.5 text-xs shrink-0 cursor-pointer self-start sm:self-center"
                          >
                            <Download className="h-3.5 w-3.5" /> Baixar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Apontamentos e Decisões Anteriores */}
                {currentMaterial && (currentMaterial.submissions?.length > 0 || currentMaterial.comments?.length > 0) && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" /> Apontamentos e Pareceres Registrados
                      </h4>
                      {!isAddingComment && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsAddingComment(true)}
                          className="h-7 text-xs gap-1 text-primary cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" /> Adicionar Observação
                        </Button>
                      )}
                    </div>

                    {isAddingComment && (
                      <div className="rounded border p-3 space-y-2 bg-muted/20">
                        <Textarea
                          value={commentContent}
                          onChange={e => setCommentContent(e.target.value)}
                          placeholder="Digite seu comentário ou apontamento técnico..."
                          className="text-xs min-h-[60px]"
                        />
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setIsAddingComment(false)} className="h-7 text-xs">
                            Cancelar
                          </Button>
                          <Button size="sm" onClick={handleAddComment} disabled={!commentContent.trim() || addComment.isPending} className="h-7 text-xs">
                            Salvar
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {currentMaterial.submissions?.map((sub: any) => (
                        <div key={sub.id} className="rounded border bg-muted/15 p-3 text-xs space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-foreground">
                              Parecer da Submissão (R0{sub.revisionNumber})
                            </span>
                            <StatusBadge status={sub.status} />
                          </div>
                          {sub.decisions?.map((d: any) => (
                            <div key={d.id} className="border-t pt-2 mt-1.5 text-muted-foreground space-y-1">
                              <p className="font-medium text-foreground">
                                Decisão: <span className="uppercase">{d.decision}</span> · Por: {d.reviewerName} ({formatDate(d.decidedAt)})
                              </p>
                              {d.note && <p className="leading-relaxed break-words bg-background/50 p-2 rounded border border-border/40 text-foreground/90">{d.note}</p>}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Homologação no Capítulo */}
                {currentMaterial && (currentMaterial.reviewStatus === "aprovado" || isGeneralCoord) && (
                  <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-600" /> Homologação no Capítulo Oficial
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 break-words">
                          {data.documentStatus === "consolidada no capítulo"
                            ? "✅ Esta seção já foi homologada e incorporada ao documento final do Estudo BNDES."
                            : "A minuta aprovada pode ser homologada e consolidada no relatório oficial do Estudo."}
                        </p>
                      </div>
                      {data.documentStatus !== "consolidada no capítulo" && (
                        <Button
                          size="sm"
                          onClick={handleHomologateInChapter}
                          disabled={consolidateInChapter.isPending}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shrink-0"
                        >
                          <CheckCircle2 className="mr-1.5 h-4 w-4" /> Homologar Capítulo
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ABA 2: ESCOPO OFICIAL */}
              <TabsContent value="escopo" className="space-y-4">
                {/* Descrição Anexo B */}
                <div className="rounded-lg border bg-card p-4 space-y-2">
                  <span className="editorial-kicker text-primary text-[10px]">
                    Escopo Oficial do Capítulo (Anexo B)
                  </span>
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed break-words">
                    {data.description || "Escopo conforme índice analítico e plano de trabalho oficial do Estudo BNDES."}
                  </p>
                </div>

                {/* Marco de Entrega e Responsável */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-muted/20 p-4 space-y-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Marco de Entrega</span>
                    <p className="text-base font-bold text-foreground">
                      {officialMilestone?.label ?? "Onda M1"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Data limite oficial: <strong className="text-foreground">{formatDate(data.dueAt)}</strong>
                    </p>
                  </div>

                  <div className="rounded-lg border bg-muted/20 p-4 space-y-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Grupo Responsável</span>
                    <p className="text-base font-bold text-foreground break-words">
                      {groupDisplayName(data.groupName || data.responsibleName)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Coordenador: <strong className="text-foreground">{data.responsibleName}</strong>
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
