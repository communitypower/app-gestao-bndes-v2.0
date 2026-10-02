import { useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatDate, fileSize } from "@/lib/format";
import { studyTomeFromCode } from "@shared/domain";
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
  SectionMark,
  StatusBadge,
} from "@/components/EditorialUI";
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Clock3,
  Download,
  FileCheck,
  FileCheck2,
  FileClock,
  FileText,
  FileUp,
  History,
  Layers,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  ShieldCheck,
  Upload,
  User,
  UserCheck,
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
  const reviewDecisionFileInputRef = useRef<HTMLInputElement>(null);
  const hasTriggeredInitialActionRef = useRef<boolean>(false);

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
  const [reviewDecision, setReviewDecision] = useState<"aprovado" | "ajustes solicitados">("aprovado");
  const [reviewDecisionNote, setReviewDecisionNote] = useState("");
  const [reviewDecisionFile, setReviewDecisionFile] = useState<File | null>(null);

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
    isAdmin ||
    access?.isAdmin ||
    access?.isGeneralCoordinator ||
    data?.isCoordinator ||
    data?.isExecutor ||
    (access?.teamMembership?.groupId && data?.responsibleGroupId === access.teamMembership.groupId) ||
    (currentMaterial?.authorId && access?.user?.id && currentMaterial.authorId === access.user.id) ||
    (data?.responsibleId && access?.teamMembership?.id && data.responsibleId === access.teamMembership.id)
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

  const handleTriggerReviewDecisionFileInput = () => {
    reviewDecisionFileInputRef.current?.click();
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
    e.target.value = "";
  };

  const handleRevisionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRevisionFile(file);
      setIsAddingRevision(true);
      toast.success(`Arquivo "${file.name}" selecionado para a nova versão.`);
    }
    e.target.value = "";
  };

  const handleReviewDecisionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReviewDecisionFile(file);
      toast.success(`Arquivo "${file.name}" anexado ao parecer.`);
    }
    e.target.value = "";
  };

  // Auto-open file picker when requested from action center CTA (apenas uma única vez ao abrir o modal)
  useEffect(() => {
    if (!activityId) {
      hasTriggeredInitialActionRef.current = false;
      return;
    }
    if (hasTriggeredInitialActionRef.current) return;

    if (initialAction === "upload_minuta" && !currentMaterial) {
      hasTriggeredInitialActionRef.current = true;
      setIsUploadingMinuta(true);
      if (data?.title && !uploadTitle) {
        setUploadTitle(data.title);
      }
      const timer = setTimeout(() => {
        initialFileInputRef.current?.click();
      }, 250);
      return () => clearTimeout(timer);
    } else if (initialAction === "upload_revision") {
      hasTriggeredInitialActionRef.current = true;
      setIsAddingRevision(true);
      const timer = setTimeout(() => {
        revisionFileInputRef.current?.click();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [activityId, initialAction, currentMaterial, data?.title]);

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
      setReviewDecisionFile(null);
      setIsAddingComment(false);
      hasTriggeredInitialActionRef.current = false;
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
      let filePayload: { fileName: string; mimeType: string; fileSize: number; base64: string } | undefined = undefined;
      if (reviewDecisionFile) {
        const base64 = await fileToBase64(reviewDecisionFile);
        filePayload = {
          fileName: reviewDecisionFile.name,
          mimeType: reviewDecisionFile.type || "application/octet-stream",
          fileSize: reviewDecisionFile.size,
          base64,
        };
      }

      await registerDecision.mutateAsync({
        submissionId: currentMaterial.activeSubmission?.id ?? null,
        materialId: currentMaterial.id,
        activityId: currentMaterial.activityId ?? null,
        decision: reviewDecision,
        note: reviewDecisionNote.trim() || null,
        file: filePayload,
      });
      toast.success(
        reviewDecision === "aprovado"
          ? "Minuta aprovada com parecer técnico favorável!"
          : "Comentários e arquivo de revisão enviados ao autor do grupo."
      );
      setReviewDecisionNote("");
      setReviewDecisionFile(null);
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
        <input
          type="file"
          ref={reviewDecisionFileInputRef}
          accept=".pdf,.doc,.docx,.rtf"
          className="hidden"
          onChange={handleReviewDecisionFileChange}
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

            {/* Abas da Ficha Simplificadas */}
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
                              className="h-9 text-xs cursor-pointer"
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
                              {createMaterial.isPending ? "Submetendo Documento..." : "✅ Submeter Minuta Inicial (R01)"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PASSO 2: PAINEL DE INDICAÇÃO DE REVISOR (Prof. Floriano) */}
                {currentMaterial && (data.reviewers ?? []).length === 0 && (
                  <div className={`rounded-xl border-2 ${isGeneralCoord ? "border-amber-500/40 bg-amber-500/5" : "border-blue-500/30 bg-blue-500/5"} p-5 space-y-4 shadow-sm animate-in fade-in`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/40 pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isGeneralCoord ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"} shrink-0`}>
                          <UserCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="editorial-kicker text-muted-foreground font-bold text-[10px]">Passo 2 do Ciclo Editorial</span>
                          <h4 className="font-bold text-base text-foreground">
                            Passo 2: Indicação de Revisor Técnico Independente
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {isGeneralCoord
                              ? "Como Coordenador Geral, selecione um pesquisador qualificado de outro grupo temático para revisar esta seção."
                              : "Minuta submetida com sucesso. Encaminhada para a Coordenação Geral (Prof. Floriano) designar o revisor técnico independente."}
                          </p>
                        </div>
                      </div>

                      {isGeneralCoord && !isAssigningReviewer && (
                        <Button
                          size="sm"
                          onClick={() => setIsAssigningReviewer(true)}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer shrink-0"
                        >
                          <UserCheck className="mr-1.5 h-4 w-4" /> Selecionar Revisor
                        </Button>
                      )}
                    </div>

                    {/* Documento Submetido */}
                    {currentMaterial.revisions?.[0] && (
                      <div className="rounded-lg border border-border/70 bg-card p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <div className="min-w-0">
                            <span className="font-semibold text-foreground">Minuta Submetida (R0{currentMaterial.currentRevision}): </span>
                            <span className="font-mono text-muted-foreground">{currentMaterial.revisions[0].fileName || `Minuta_R0${currentMaterial.currentRevision}.docx`}</span>
                            {currentMaterial.revisions[0].fileSize && (
                              <span className="text-[11px] text-muted-foreground ml-2">
                                ({fileSize(currentMaterial.revisions[0].fileSize)})
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadRevision(currentMaterial.revisions[0].id)}
                          className="h-7 text-xs gap-1.5 shrink-0 cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" /> Baixar Minuta
                        </Button>
                      </div>
                    )}

                    {isAssigningReviewer && isGeneralCoord && (
                      <div className="space-y-3 pt-1">
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
                            className="h-8 text-xs cursor-pointer"
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleAssignReviewer}
                            disabled={!selectedReviewerId || updateReviewers.isPending}
                            className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer"
                          >
                            {updateReviewers.isPending ? "Indicando..." : "Confirmar Indicação de Revisor"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PASSO 3: PARECER DE REVISÃO TÉCNICA INDEPENDENTE (Área Unificada e Clara) */}
                {currentMaterial && (data.reviewers ?? []).length > 0 && currentMaterial.reviewStatus === "em revisão" && (
                  <div className="rounded-xl border-2 border-amber-500/40 bg-card p-5 sm:p-6 space-y-5 shadow-sm animate-in fade-in">
                    <div className="border-b pb-3">
                      <span className="editorial-kicker text-amber-600 font-bold text-[10px]">Passo 3 do Ciclo Editorial</span>
                      <h4 className="font-bold text-lg text-foreground flex items-center gap-2">
                        <Pencil className="h-5 w-5 text-amber-600" /> Parecer de Revisão & Encaminhamento ao Autor
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isDesignatedReviewer || isGeneralCoord
                          ? "Baixe a minuta técnica submetida abaixo, emita sua decisão editorial, insira seus apontamentos e anexe o arquivo com as alterações controladas."
                          : `A minuta está em análise técnica com o revisor designado (${data.reviewers.map((r: any) => r.name).join(", ")}).`}
                      </p>
                    </div>

                    {/* 1. DOCUMENTO SUBMETIDO PARA REVISÃO (Botão Único e Destaque Visual) */}
                    {currentMaterial.revisions?.[0] && (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-foreground">
                                Documento Submetido para Revisão (Versão R0{currentMaterial.currentRevision})
                              </span>
                              {currentMaterial.revisions[0].fileSize && (
                                <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
                                  {fileSize(currentMaterial.revisions[0].fileSize)}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs font-mono text-muted-foreground truncate mt-0.5">
                              {currentMaterial.revisions[0].fileName || `Minuta_R0${currentMaterial.currentRevision}.docx`}
                            </p>
                          </div>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleDownloadRevision(currentMaterial.revisions[0].id)}
                          className="h-9 px-4 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shrink-0 cursor-pointer shadow-xs"
                        >
                          <Download className="h-4 w-4" /> Baixar Minuta para Revisão
                        </Button>
                      </div>
                    )}

                    {/* Formulário de Parecer Aberto para o Revisor / Coordenação Geral */}
                    {(isDesignatedReviewer || isGeneralCoord) && (
                      <div className="space-y-4 pt-1">
                        {/* 2. DECISÃO EDITORIAL */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-foreground">Decisão Editorial</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setReviewDecision("aprovado")}
                              className={`p-3.5 rounded-lg border text-left flex items-start gap-3 transition-all cursor-pointer ${
                                reviewDecision === "aprovado"
                                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/30 font-semibold"
                                  : "border-border bg-card hover:bg-muted/30 text-muted-foreground"
                              }`}
                            >
                              <div className={`flex h-6 w-6 items-center justify-center rounded-full shrink-0 mt-0.5 ${reviewDecision === "aprovado" ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}>
                                <Check className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold">✅ Aprovar Minuta</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Parecer favorável sem restrições. Libera o capítulo para consolidação.</p>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setReviewDecision("ajustes solicitados")}
                              className={`p-3.5 rounded-lg border text-left flex items-start gap-3 transition-all cursor-pointer ${
                                reviewDecision === "ajustes solicitados"
                                  ? "border-amber-500 bg-amber-500/10 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500/30 font-semibold"
                                  : "border-border bg-card hover:bg-muted/30 text-muted-foreground"
                              }`}
                            >
                              <div className={`flex h-6 w-6 items-center justify-center rounded-full shrink-0 mt-0.5 ${reviewDecision === "ajustes solicitados" ? "bg-amber-600 text-white" : "bg-muted text-muted-foreground"}`}>
                                <AlertCircle className="h-3.5 w-3.5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold">⚠️ Solicitar Ajustes / Comentários</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Devolve ao autor para atendimento aos apontamentos e envio de nova versão R0X.</p>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* 3. JUSTIFICATIVA E APONTAMENTOS */}
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-foreground">Justificativa e Apontamentos do Parecer</Label>
                          <Textarea
                            value={reviewDecisionNote}
                            onChange={e => setReviewDecisionNote(e.target.value)}
                            placeholder="Insira as observações técnicas, comentários parágrafo a parágrafo ou orientações ao autor do grupo..."
                            className="min-h-[90px] text-xs bg-card leading-relaxed"
                          />
                        </div>

                        {/* 4. UPLOAD DE ARQUIVO PELO REVISOR COM A REVISÃO PRETENDIDA */}
                        <div className="rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-4 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Paperclip className="h-4 w-4 text-amber-600" />
                              <span className="text-xs font-bold text-foreground">
                                Anexar Arquivo com Comentários / Alterações Controladas (Opcional)
                              </span>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={handleTriggerReviewDecisionFileInput}
                              className="h-8 text-xs gap-1.5 font-semibold cursor-pointer bg-background"
                            >
                              <Upload className="h-3.5 w-3.5" />
                              {reviewDecisionFile ? "Trocar Arquivo Anotado" : "Selecionar Arquivo no Computador"}
                            </Button>
                          </div>

                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Anexe a minuta com alterações controladas no Word (.docx), PDF com anotações ou nota técnica complementar. O arquivo será encaminhado diretamente ao autor para download no Passo 4.
                          </p>

                          {reviewDecisionFile && (
                            <div className="flex items-center justify-between gap-2 p-3 bg-background border border-emerald-500/30 rounded-lg text-xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <FileCheck2 className="h-5 w-5 text-emerald-600 shrink-0" />
                                <div className="min-w-0">
                                  <p className="font-mono font-bold text-foreground truncate">{reviewDecisionFile.name}</p>
                                  <p className="text-[10px] text-muted-foreground">{fileSize(reviewDecisionFile.size)}</p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setReviewDecisionFile(null)}
                                className="h-7 text-xs text-destructive hover:bg-destructive/10 cursor-pointer"
                              >
                                Remover
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* 5. BOTÃO DE ENVIO DO PARECER */}
                        <div className="flex justify-end pt-3 border-t">
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleRegisterReviewDecision}
                            disabled={registerDecision.isPending}
                            className="h-10 px-5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer gap-2"
                          >
                            {registerDecision.isPending ? "Registrando Parecer..." : "Confirmar Parecer e Encaminhar ao Autor"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PASSO 4: IMPLEMENTAÇÃO DE AJUSTES & ENVIO DE NOVA VERSÃO (R02, R03...) */}
                {currentMaterial && (isAddingRevision || currentStage === "implementacao_ajustes" || data.documentStatus === "ajustes solicitados" || currentMaterial.reviewStatus === "ajustes solicitados" || currentMaterial.openCommentCount > 0) && (
                  <div className="rounded-xl border-2 border-primary/40 bg-card p-5 space-y-4 shadow-sm animate-in fade-in">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                      <div>
                        <span className="editorial-kicker text-primary font-bold text-[10px]">Passo 4 do Ciclo Editorial</span>
                        <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                          <FileClock className="h-5 w-5 text-primary" /> Envio de Nova Revisão (R0{currentMaterial.currentRevision + 1}) — Atendimento aos Apontamentos
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Consulte os comentários e arquivos anotados pelo revisor técnico abaixo, implemente as correções e submeta a nova versão.
                        </p>
                      </div>
                      {isAddingRevision && currentStage !== "implementacao_ajustes" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsAddingRevision(false)}
                          className="h-7 text-xs cursor-pointer"
                        >
                          Fechar
                        </Button>
                      )}
                    </div>

                    {/* Destaque do Parecer e Arquivo Anexado pelo Revisor */}
                    {currentMaterial.submissions?.length > 0 && currentMaterial.submissions[0]?.decisions?.length > 0 && (
                      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-xs text-amber-800 dark:text-amber-300">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <span>Parecer e Arquivo Anexado pelo Revisor Técnico:</span>
                        </div>
                        {currentMaterial.submissions[0].decisions.map((d: any) => (
                          <div key={d.id} className="text-xs space-y-2 pt-1">
                            <p className="font-semibold text-muted-foreground">
                              Parecer emitido por <strong className="text-foreground">{d.reviewerName}</strong> em {formatDate(d.decidedAt)}:
                            </p>
                            {d.note && (
                              <div className="bg-background/80 p-2.5 rounded border border-border/50 text-foreground/90 space-y-2">
                                <p className="whitespace-pre-line leading-relaxed">{d.note}</p>
                                {d.note.includes("http") && (
                                  <div className="pt-2 border-t border-border/40 flex flex-wrap gap-2">
                                    {Array.from(d.note.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g)).map((match: any, i: number) => (
                                      <a
                                        key={i}
                                        href={match[2]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                                      >
                                        <Download className="h-3.5 w-3.5" />
                                        <span>Baixar {match[1]}</span>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

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
                              className="h-9 text-xs cursor-pointer"
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

                {/* PASSO 5 & 6: CONSOLIDAÇÃO NO CAPÍTULO & HOMOLOGAÇÃO NO TOMO */}
                {currentMaterial && (currentMaterial.reviewStatus === "aprovado" || data.documentStatus === "consolidada no capítulo" || isGeneralCoord) && (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3">
                      <div>
                        <span className="editorial-kicker text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">Passos 5 e 6 do Ciclo Editorial</span>
                        <h4 className="font-bold text-base text-foreground flex items-center gap-2">
                          <ShieldCheck className="h-5 w-5 text-emerald-600" /> Consolidação no Capítulo & Homologação no Tomo
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5 break-words">
                          {data.documentStatus === "consolidada no capítulo"
                            ? "✅ Esta seção já foi homologada e incorporada ao capítulo e relatório oficial do Estudo BNDES."
                            : "Minuta aprovada pela revisão técnica independente. Pronta para consolidação pelo coordenador do capítulo e homologação no tomo."}
                        </p>
                      </div>

                      {data.documentStatus !== "consolidada no capítulo" && (isAuthorCoordinator || isGeneralCoord) && (
                        <Button
                          size="sm"
                          onClick={handleHomologateInChapter}
                          disabled={consolidateInChapter.isPending}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shrink-0 shadow-xs"
                        >
                          <CheckCircle2 className="mr-1.5 h-4 w-4" /> Consolidar Seção no Capítulo
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Histórico de Versões e Arquivos (apenas versões anteriores se houver mais de 1) */}
                {currentMaterial && currentMaterial.revisions?.length > 1 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                        <History className="h-4 w-4 text-primary" /> Histórico de Versões Submetidas ({currentMaterial.revisions.length})
                      </h4>
                    </div>

                    <div className="space-y-2">
                      {currentMaterial.revisions.slice(1).map((rev: any) => (
                        <div
                          key={rev.id}
                          className="rounded-md border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card hover:bg-muted/20 transition-colors text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary" className="font-mono text-xs font-semibold shrink-0">
                                Versão {rev.revisionNumber}
                              </Badge>
                              <span className="font-medium text-foreground break-words break-all">
                                {rev.fileName || `Minuta_R0${rev.revisionNumber}`}
                              </span>
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

                {/* Apontamentos e Decisões Anteriores */}
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
                          <Button size="sm" variant="ghost" onClick={() => setIsAddingComment(false)} className="h-7 text-xs cursor-pointer">
                            Cancelar
                          </Button>
                          <Button size="sm" onClick={handleAddComment} disabled={!commentContent.trim() || addComment.isPending} className="h-7 text-xs cursor-pointer">
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
                            <div key={d.id} className="border-t pt-2 mt-1.5 text-muted-foreground space-y-1.5">
                              <p className="font-medium text-foreground">
                                Decisão: <span className="uppercase font-bold text-primary">{d.decision}</span> · Por: {d.reviewerName} ({formatDate(d.decidedAt)})
                              </p>
                              {d.note && (
                                <div className="leading-relaxed break-words bg-background/60 p-2.5 rounded border border-border/40 text-foreground/90 space-y-2">
                                  <p className="whitespace-pre-line">{d.note}</p>
                                  {d.note.includes("http") && (
                                    <div className="pt-2 border-t border-border/40 flex flex-wrap gap-2">
                                      {Array.from(d.note.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g)).map((match: any, i: number) => (
                                        <a
                                          key={i}
                                          href={match[2]}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                                        >
                                          <Download className="h-3.5 w-3.5" />
                                          <span>Baixar {match[1]}</span>
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
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
