import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import ActivityAccessGate from "@/components/ActivityAccessGate";
import {
  PageHeader,
  PageLoading,
  SectionMark,
  StatusBadge,
} from "@/components/EditorialUI";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { formatDate } from "@/lib/format";
import { groupDisplayName } from "../../../shared/groupDisplay";
import { ReferenceBulkExecutorDialog } from "@/components/ReferenceBulkExecutorDialog";
import {
  ACTIVITY_STATUSES,
  STUDY_TOMES,
  studyTomeFromCode,
  type ActivityStatus,
} from "@shared/domain";
import {
  DocumentationWorkflowStepper,
  getWorkflowStage,
} from "@/components/DocumentationWorkflowStepper";
import { ParticipantActionCenter } from "@/components/ParticipantActionCenter";
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  Download,
  Eye,
  FileDown,
  Filter,
  GitMerge,
  History,
  Layers3,
  Pencil,
  Plus,
  Search,
  Sparkles,
  UploadCloud,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

type ActivityItem = inferRouterOutputs<AppRouter>["activities"]["list"][number];
type ActivityStatusReportItem = inferRouterOutputs<AppRouter>["activities"]["statusReport"][number];

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

type ExecutionAssignment = {
  teamMemberId: number;
  allocatedHours: number;
  responsibility: string;
  isExecutionLead: boolean;
};

type ActivityForm = {
  id?: number;
  parentActivityId?: number | null;
  title: string;
  description: string;
  sectionId: string;
  responsibleId: string;
  startDate: string;
  dueDate: string;
  status: ActivityStatus;
  progress: number;
  allocations: ExecutionAssignment[];
};

const emptyForm: ActivityForm = {
  parentActivityId: null,
  title: "",
  description: "",
  sectionId: "",
  responsibleId: "",
  startDate: "",
  dueDate: "",
  status: "pendente",
  progress: 0,
  allocations: [],
};

function formatHours(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
  }).format(value);
}

function toDateInputValue(value: number | null) {
  if (!value) return "";
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function ActivityDetailDialog({
  activityId,
  onOpenChange,
  onEdit,
  onEditHours,
  onEditReviewers,
  isAdmin,
}: {
  activityId: number | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (activity: ActivityItem) => void;
  onEditHours: (activityId: number) => void;
  onEditReviewers: (activityId: number) => void;
  isAdmin: boolean;
}) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.activities.detail.useQuery(
    { id: activityId ?? 1 },
    { enabled: activityId !== null }
  );
  const { data: fieldwork = [] } = trpc.fieldwork.list.useQuery(undefined, { enabled: activityId !== null });
  const addEvidenceLink = trpc.activities.addEvidenceLink.useMutation();
  const linkFieldwork = trpc.fieldwork.linkToActivity.useMutation();
  const initializeReviewChecklist = trpc.activities.initializeReviewChecklist.useMutation();
  const applyOfficialChecklistSchedule = trpc.activities.applyOfficialChecklistSchedule.useMutation();
  const updateReviewChecklistItem = trpc.activities.updateReviewChecklistItem.useMutation();
  const updateDescriptionQuickly = trpc.activities.updateDescriptionQuickly.useMutation();
  const updateDocumentStatus = trpc.activities.updateDocumentStatus.useMutation();
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkType, setLinkType] = useState<"material" | "evidência de campo">("material");
  const [seminarId, setSeminarId] = useState("");
  const [checklistDueDates, setChecklistDueDates] = useState<Record<number, string>>({});
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [nextDocumentStatus, setNextDocumentStatus] = useState<keyof typeof DOCUMENT_STATUS_LABELS | "">("");
  const executionSteps = data?.executionSteps ?? [];
  const availableSeminars = fieldwork.filter(item => /seminário/i.test(item.title) && !item.relatedActivityId);

  useEffect(() => {
    if (!data?.reviewChecklist) return;
    setChecklistDueDates(
      Object.fromEntries(
        data.reviewChecklist.items.map(item => [item.id, toDateInputValue(item.dueAt)])
      )
    );
  }, [data?.id, data?.reviewChecklist]);

  useEffect(() => {
    if (!data) return;
    setDescriptionDraft(data.description ?? "");
    setEditingDescription(false);
  }, [data?.id, data?.description]);

  useEffect(() => {
    if (!data) return;
    setNextDocumentStatus(DOCUMENT_NEXT_STATUSES[data.documentStatus][0] ?? "");
  }, [data?.id, data?.documentStatus]);

  const saveEvidenceLink = async () => {
    const label = linkLabel.trim();
    const url = linkUrl.trim();
    if (!activityId || !label || !url) {
      toast.error("Informe o nome e o endereço do link.");
      return;
    }
    if (label.length < 3) {
      toast.error("O nome do material ou da evidência deve ter pelo menos três caracteres.");
      return;
    }
    try {
      await addEvidenceLink.mutateAsync({ activityId, label, url, linkType });
      await Promise.all([utils.activities.detail.invalidate({ id: activityId }), utils.activities.list.invalidate()]);
      setLinkLabel("");
      setLinkUrl("");
      toast.success("Link vinculado à atividade.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível vincular o link.");
    }
  };

  const linkSeminar = async () => {
    if (!activityId || !seminarId) return;
    try {
      await linkFieldwork.mutateAsync({ id: Number(seminarId), relatedActivityId: activityId });
      await Promise.all([utils.activities.detail.invalidate({ id: activityId }), utils.fieldwork.list.invalidate()]);
      setSeminarId("");
      toast.success("Seminário vinculado à atividade-mãe.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível vincular o seminário.");
    }
  };

  const initializeChecklist = async () => {
    if (!activityId) return;
    try {
      await initializeReviewChecklist.mutateAsync({ id: activityId });
      await utils.activities.detail.invalidate({ id: activityId });
      toast.success("Checklist de revisão criado para a atividade-mãe.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o checklist.");
    }
  };

  const applyChecklistSchedule = async () => {
    if (!activityId) return;
    try {
      await applyOfficialChecklistSchedule.mutateAsync({ id: activityId });
      await utils.activities.detail.invalidate({ id: activityId });
      toast.success("Prazos do checklist configurados conforme o cronograma oficial.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível configurar os prazos do checklist.");
    }
  };

  const saveQuickDescription = async () => {
    if (!activityId || descriptionDraft.trim().length < 3) {
      toast.error("Informe uma descrição com pelo menos três caracteres.");
      return;
    }
    try {
      await updateDescriptionQuickly.mutateAsync({ id: activityId, description: descriptionDraft.trim() });
      await Promise.all([
        utils.activities.detail.invalidate({ id: activityId }),
        utils.activities.list.invalidate(),
      ]);
      setEditingDescription(false);
      toast.success("Descrição da atividade atualizada e registrada no histórico.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a descrição.");
    }
  };

  const advanceDocumentWorkflow = async () => {
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
      toast.success(`Fluxo documental atualizado para ${DOCUMENT_STATUS_LABELS[nextDocumentStatus]}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o fluxo documental.");
    }
  };

  const updateChecklistStatus = async (
    itemId: number,
    status: "pendente" | "em andamento" | "concluído" | "bloqueado"
  ) => {
    if (!activityId) return;
    try {
      await updateReviewChecklistItem.mutateAsync({ id: itemId, status });
      await utils.activities.detail.invalidate({ id: activityId });
      toast.success("Estado do checklist atualizado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o checklist.");
    }
  };

  const updateChecklistDeadline = async (itemId: number, value: string) => {
    if (!activityId) return;
    try {
      await updateReviewChecklistItem.mutateAsync({
        id: itemId,
        dueAt: value ? new Date(`${value}T12:00:00`).getTime() : null,
      });
      await utils.activities.detail.invalidate({ id: activityId });
      toast.success("Prazo do checklist atualizado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o prazo.");
    }
  };

  const updateChecklistResponsible = async (itemId: number, value: string) => {
    if (!activityId) return;
    try {
      await updateReviewChecklistItem.mutateAsync({
        id: itemId,
        responsibleId: value === "unassigned" ? null : Number(value),
      });
      await utils.activities.detail.invalidate({ id: activityId });
      toast.success("Responsável do checklist atualizado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o responsável.");
    }
  };

  return (
    <Dialog
      open={activityId !== null}
      onOpenChange={open => onOpenChange(open)}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto bg-card sm:max-w-4xl">
        {isLoading || !data ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>Ficha da atividade</DialogTitle>
              <DialogDescription>
                Carregando os dados completos da atividade.
              </DialogDescription>
            </DialogHeader>
            <div className="py-16 text-center text-sm text-muted-foreground">
              Carregando ficha da atividade…
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="border-b paper-rule pb-6 text-left">
              <div className="flex flex-wrap items-center gap-3">
                <SectionMark code={data.planCode ?? data.sectionCode} />
                <StatusBadge status={data.status} />
                <span className="editorial-kicker text-muted-foreground">
                  Ficha da atividade
                </span>
              </div>
              <DialogTitle className="font-display mt-3 text-3xl font-semibold leading-tight tracking-[-.03em] md:text-4xl">
                {data.title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Ficha documental com responsabilidades, revisão, interfaces, consolidação e aprovação da atividade.
              </DialogDescription>
              {data.canManageAllocations && (
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => { setLinkType("material"); document.getElementById("materiais-evidencias")?.scrollIntoView({ behavior: "smooth", block: "center" }); document.getElementById("evidence-link-label")?.focus(); }}>Anexar material</Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => { setLinkType("evidência de campo"); document.getElementById("materiais-evidencias")?.scrollIntoView({ behavior: "smooth", block: "center" }); document.getElementById("evidence-link-label")?.focus(); }}>Anexar evidência</Button>
                </div>
              )}
            </DialogHeader>

            <section className="grid gap-3 border-y paper-rule py-5 md:grid-cols-[minmax(0,1fr)_180px_180px] md:items-end">
              <div>
                <p className="editorial-kicker text-primary">Controle documental</p>
                <p className="font-editorial mt-2 text-xl font-semibold">{DOCUMENT_STATUS_LABELS[data.documentStatus]}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Entrega interna no dia 15; entrega ao BNDES no dia 30 ou no último dia do mês quando não houver dia 30.</p>
              </div>
              <div>
                <p className="editorial-kicker text-muted-foreground">Entrega interna</p>
                <p className="mt-2 text-sm font-semibold">{data.editorialDeliveryAt ? formatDate(data.editorialDeliveryAt) : "A configurar"}</p>
              </div>
              <div>
                <p className="editorial-kicker text-muted-foreground">Entrega ao BNDES</p>
                <p className="mt-2 text-sm font-semibold">{data.bndesDeliveryAt ? formatDate(data.bndesDeliveryAt) : "A configurar"}</p>
              </div>
              {DOCUMENT_NEXT_STATUSES[data.documentStatus].length > 0 && (
                <div className="flex flex-wrap items-center gap-2 border-t pt-4 md:col-span-3">
                  <Label htmlFor="next-document-status" className="text-xs">Próxima decisão</Label>
                  <Select value={nextDocumentStatus} onValueChange={value => setNextDocumentStatus(value as keyof typeof DOCUMENT_STATUS_LABELS)}>
                    <SelectTrigger id="next-document-status" className="w-full bg-background sm:w-80"><SelectValue placeholder="Selecione a decisão" /></SelectTrigger>
                    <SelectContent>{DOCUMENT_NEXT_STATUSES[data.documentStatus].map(status => <SelectItem key={status} value={status}>{DOCUMENT_STATUS_LABELS[status]}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button type="button" size="sm" onClick={advanceDocumentWorkflow} disabled={!nextDocumentStatus || updateDocumentStatus.isPending}>{updateDocumentStatus.isPending ? "Registrando…" : "Registrar decisão"}</Button>
                </div>
              )}
            </section>

            {data.officialDescription && (
              <section className="rounded-md border border-primary/20 bg-primary/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="editorial-kicker text-primary">Escopo e descrição oficial do capítulo</p>
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wider">
                    Anexo B — Plano de Trabalho
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85 font-normal">
                  {data.officialDescription}
                </p>
              </section>
            )}

            {((data.description && data.description !== data.officialDescription) || (data.canManageAllocations && editingDescription)) && (
              <section className="border-l-4 border-primary bg-card/55 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="editorial-kicker text-primary">
                    Descrição da atividade
                  </p>
                  {data.canManageAllocations && !editingDescription && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditingDescription(true)}>
                      <Pencil className="mr-2 h-4 w-4" /> Edição rápida
                    </Button>
                  )}
                </div>
                {editingDescription ? (
                  <div className="mt-3 space-y-3">
                    <Label htmlFor="quick-activity-description" className="sr-only">Descrição da atividade</Label>
                    <Textarea id="quick-activity-description" value={descriptionDraft} onChange={event => setDescriptionDraft(event.target.value)} className="min-h-36 bg-background" maxLength={10_000} />
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" onClick={saveQuickDescription} disabled={updateDescriptionQuickly.isPending}>{updateDescriptionQuickly.isPending ? "Salvando…" : "Salvar descrição"}</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => { setDescriptionDraft(data.description ?? ""); setEditingDescription(false); }}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/75">
                    {data.description}
                  </p>
                )}
              </section>
            )}

            {executionSteps.length > 0 && (
              <section>
                <div className="flex items-end justify-between gap-4 border-b paper-rule pb-3">
                  <div>
                    <p className="editorial-kicker text-primary">Etapas de execução</p>
                    <h3 className="font-editorial mt-2 text-2xl font-semibold">Acompanhamento por tópico do capítulo</h3>
                  </div>
                  <span className="font-display text-3xl text-primary">{executionSteps.length}</span>
                </div>
                <div className="mt-4 divide-y border-y paper-rule">
                  {executionSteps.map(step => (
                    <div key={step.id} className="grid gap-4 py-4 md:grid-cols-[minmax(0,1fr)_170px_130px] md:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <SectionMark code={step.detailCode ?? step.planCode ?? String(step.id)} />
                          <StatusBadge status={step.status} />
                        </div>
                        <p className="font-editorial mt-3 text-lg font-semibold leading-snug">{step.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Executor: {step.allocations.find(allocation => allocation.isExecutionLead)?.memberName ?? "Atribuição pendente"}</p>
                      </div>
                      <div>
                        <p className="editorial-kicker text-muted-foreground">Andamento</p>
                        <p className="font-display mt-2 text-2xl text-primary">{step.progress}%</p>
                        <div className="mt-2 h-1.5 bg-muted"><div className="h-full bg-primary" style={{ width: `${step.progress}%` }} /></div>
                      </div>
                      <div className="md:text-right">
                        <p className="text-xs text-muted-foreground">Prazo {formatDate(step.dueAt)}</p>
                        {(isAdmin || data.canManageAllocations || data.isCoordinator || data.isExecutor || (data.currentMemberId && step.allocations.some(a => a.teamMemberId === data.currentMemberId))) && (
                          <Button variant="outline" size="sm" className="mt-3" onClick={() => onEdit(step)}>Atualizar etapa</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {data.parentActivityId === null && (
              <section className="border-y paper-rule py-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="editorial-kicker text-primary">Seminários vinculados</p>
                    <h3 className="font-editorial mt-2 text-2xl font-semibold">Acompanhamento e divulgação do capítulo</h3>
                  </div>
                  {data.canManageAllocations && availableSeminars.length ? (
                    <div className="flex min-w-[280px] gap-2">
                      <Select value={seminarId} onValueChange={setSeminarId}>
                        <SelectTrigger><SelectValue placeholder="Selecionar seminário" /></SelectTrigger>
                        <SelectContent>{availableSeminars.map(item => <SelectItem key={item.id} value={String(item.id)}>{item.code} · {item.title}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button size="sm" disabled={!seminarId || linkFieldwork.isPending} onClick={linkSeminar}>Vincular</Button>
                    </div>
                  ) : null}
                </div>
                {data.relatedFieldwork?.length ? (
                  <div className="mt-4 divide-y border-y paper-rule">
                    {data.relatedFieldwork.map(item => <div key={item.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-semibold">{item.code} · {item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.dueAt ? `Data ${formatDate(item.dueAt)}` : "Data a definir"} · {item.status}</p></div><Badge variant="outline" className="rounded-sm">Seminário</Badge></div>)}
                  </div>
                ) : <p className="mt-4 text-sm text-muted-foreground">Nenhum seminário vinculado a esta atividade-mãe.</p>}
              </section>
            )}

            {data.relatedInterfaces && data.relatedInterfaces.length > 0 && (
              <section className="rounded-md border border-teal-500/30 bg-teal-500/5 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-teal-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <GitMerge className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                    <div>
                      <p className="editorial-kicker text-teal-800 dark:text-teal-300">
                        Interfaces de Coordenação Interdisciplinares ({data.relatedInterfaces.length})
                      </p>
                      <h4 className="font-editorial text-lg font-semibold text-foreground">
                        Insumos e Trocas com Outros Grupos de Trabalho
                      </h4>
                    </div>
                  </div>
                  <Link href="/interfaces">
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs border-teal-500/40 text-teal-800 dark:text-teal-300 hover:bg-teal-500/10">
                      Ver no Módulo de Interfaces <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
                <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
                  As interfaces conectam este capítulo às frentes parceiras, prevenindo sobreposições e garantindo o fornecimento de dados e análises essenciais:
                </p>
                <div className="mt-3 divide-y divide-border/60 rounded-md border border-border/60 bg-background/80">
                  {data.relatedInterfaces.map((interf: any) => (
                    <div key={interf.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between text-xs">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-foreground">{interf.title}</span>
                          <Badge variant="outline" className={`text-[10px] ${
                            interf.blockingClass === 'bloqueante' ? 'border-rose-500 text-rose-600 bg-rose-500/10' :
                            interf.blockingClass === 'prioritária' ? 'border-amber-500 text-amber-600 bg-amber-500/10' :
                            'border-border text-muted-foreground'
                          }`}>
                            {interf.blockingClass}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {interf.status}
                          </Badge>
                        </div>
                        <p className="line-clamp-1 text-[11px] text-muted-foreground">{interf.description}</p>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                          <span>Grupos: {interf.groups.map((g: any) => g.name).join(" ↔ ")}</span>
                          {interf.responsibleName && <span>· Resp.: {interf.responsibleName}</span>}
                        </div>
                      </div>
                      <Link href="/interfaces">
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-primary shrink-0 self-start sm:self-center">
                          Acessar interface
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="grid gap-px bg-foreground/20 md:grid-cols-4">
              <div className="bg-background p-4">
                <p className="editorial-kicker flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" /> Início
                </p>
                <p className="font-editorial mt-3 text-xl">
                  {data.startAt ? formatDate(data.startAt) : "A definir"}
                </p>
              </div>
              <div className="bg-background p-4">
                <p className="editorial-kicker flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" /> Término
                </p>
                <p className="font-editorial mt-3 text-xl">
                  {formatDate(data.dueAt)}
                </p>
              </div>
              <div className="bg-background p-4">
                <p className="editorial-kicker text-muted-foreground">
                  Progresso
                </p>
                <p className="font-display mt-3 text-3xl text-primary">
                  {data.progress}%
                </p>
              </div>
              <div className="bg-background p-4">
                <p className="editorial-kicker flex items-center gap-2 text-muted-foreground">
                  <Clock3 className="h-4 w-4" /> Horas vigentes
                </p>
                <p className="font-display mt-3 text-3xl text-primary">
                  {formatHours(data.totalAllocatedHours)}h
                </p>
              </div>
            </div>

            <section className="grid gap-px bg-foreground/20 md:grid-cols-2">
              <div className="bg-background p-5">
                <p className="editorial-kicker text-muted-foreground">Entrega para o Portal Naval</p>
                <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                  {data.portalDeliverable ?? "Não informada."}
                </p>
              </div>
              <div className="bg-background p-5">
                <p className="editorial-kicker text-muted-foreground">Dependências e aceite</p>
                <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                  {data.dependencies ?? "Dependências não informadas."}
                </p>
                <p className="mt-3 border-t paper-rule pt-3 text-xs leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">Aceite:</strong> {data.acceptanceCriteria ?? "Não informado."}
                </p>
              </div>
            </section>

            <section className="grid gap-6 border-y paper-rule py-6 md:grid-cols-[.8fr_1.2fr]">
              <div className="border-l-4 border-primary bg-card/55 p-5">
                <p className="editorial-kicker flex items-center gap-2 text-primary">
                  <UserRoundCheck className="h-4 w-4" /> Coordenador responsável
                </p>
                <h3 className="font-editorial mt-5 text-2xl font-semibold leading-tight">
                  {data.responsibleName}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {data.responsibleTitle} · {data.institution}
                </p>
                <p className="mt-5 border-t paper-rule pt-4 text-sm">
                  <span className="editorial-kicker text-muted-foreground">
                    Grupo
                  </span>
                  <span className="mt-2 block font-medium">
                    {data.groupName ?? "Grupo não identificado"}
                  </span>
                </p>
                {data.canManageAllocations && (
                  <Button type="button" variant="outline" size="sm" className="mt-5" onClick={() => onEditHours(data.id)}>
                    <UsersRound className="mr-2 h-4 w-4" /> Atribuir responsáveis
                  </Button>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between border-b paper-rule pb-3">
                  <p className="editorial-kicker flex items-center gap-2 text-muted-foreground">
                    <UsersRound className="h-4 w-4" /> Responsabilidades de execução
                  </p>
                  <span className="font-editorial text-lg">
                    {data.allocations.length}
                  </span>
                </div>
                {data.allocations.length ? (
                  <div className="divide-y paper-rule">
                    {data.allocations.map(allocation => (
                      <div
                        key={allocation.id}
                        className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-editorial text-lg font-semibold">
                              {allocation.memberName}
                            </p>
                            {allocation.isExecutionLead && (
                              <span className="rounded border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[.12em] text-primary">
                                Liderança de execução
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {allocation.memberTitle} · {allocation.institution}
                          </p>
                          <p className="mt-2 text-sm leading-5 text-foreground/80">
                            {allocation.responsibility ?? "Escopo não informado."}
                          </p>
                          <p className="mt-2 text-[11px] text-muted-foreground">
                            Atribuído por {allocation.assignedByName ?? "Registro histórico"}{allocation.createdAt ? ` em ${formatDate(allocation.createdAt)}` : ""}
                          </p>
                        </div>
                        <p className="font-display text-2xl text-primary">
                          {formatHours(allocation.allocatedHours)}h
                        </p>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t-2 border-foreground py-4">
                      <span className="editorial-kicker">Total alocado</span>
                      <strong className="font-display text-3xl">
                        {formatHours(data.totalAllocatedHours)}h
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-sm text-muted-foreground">
                    A coordenação ainda não distribuiu responsabilidades de execução
                    entre os participantes deste grupo.
                  </div>
                )}
                {data.historicalAllocations.length > 0 && (
                  <div className="mt-6 border-l-2 border-muted-foreground/40 bg-card/45 p-4">
                    <div className="flex items-center justify-between gap-4 border-b paper-rule pb-3">
                      <p className="editorial-kicker flex items-center gap-2 text-muted-foreground">
                        <History className="h-4 w-4" /> Registro histórico
                      </p>
                      <span className="font-editorial text-lg">
                        {formatHours(data.historicalAllocatedHours)}h
                      </span>
                    </div>
                    {data.historicalAllocations.map(allocation => (
                      <div key={allocation.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto]">
                        <div>
                          <p className="font-editorial text-lg font-semibold">
                            {allocation.memberName}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {allocation.note ?? "Alocação preservada de estrutura anterior."}
                          </p>
                        </div>
                        <p className="font-display text-2xl text-muted-foreground">
                          {formatHours(allocation.allocatedHours)}h
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {data.interfaces && data.interfaces.length > 0 && (
              <section className="border-b paper-rule pb-6">
                <div className="flex items-center justify-between border-b paper-rule pb-3">
                  <p className="editorial-kicker flex items-center gap-2 text-primary font-semibold">
                    <GitMerge className="h-4 w-4" /> Interfaces de Coordenação Identificadas
                  </p>
                  <span className="font-editorial text-lg">{data.interfaces.length}</span>
                </div>
                <div className="mt-4 space-y-3">
                  {data.interfaces.map(iface => (
                    <div
                      key={iface.id}
                      className="rounded border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={iface.status} />
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">{iface.interfaceType}</span>
                          <span className="text-[11px] text-muted-foreground">Prioridade {iface.priority}</span>
                        </div>
                        <p className="font-editorial text-base font-semibold mt-1 text-foreground">{iface.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{iface.description}</p>
                      </div>
                      <a
                        href="/interfaces"
                        className="inline-flex items-center justify-center rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 shrink-0"
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> Abrir no Controle
                      </a>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="border-b paper-rule pb-6">
              <div className="flex items-center justify-between border-b paper-rule pb-3">
                <p className="editorial-kicker flex items-center gap-2 text-muted-foreground"><History className="h-4 w-4" /> Histórico de transferências de liderança</p>
                <span className="font-editorial text-lg">{data.leadershipHistory?.length ?? 0}</span>
              </div>
              {data.leadershipHistory?.length ? (
                <div className="divide-y paper-rule">
                  {data.leadershipHistory.map(event => (
                    <div key={event.id} className="py-4">
                      <p className="font-editorial text-lg font-semibold">{event.previousLeaderName} → {event.nextLeaderName}</p>
                      <p className="mt-2 text-sm leading-5 text-foreground/80">{event.justification}</p>
                      <p className="mt-2 text-[11px] text-muted-foreground">Registrado por {event.assignedByName} em {formatDate(event.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-sm text-muted-foreground">Nenhuma transferência de liderança foi registrada para esta atividade.</p>
              )}
            </section>

            <section id="materiais-evidencias" className="border-b paper-rule pb-6">
              <div className="flex items-center justify-between border-b paper-rule pb-3">
                <p className="editorial-kicker text-muted-foreground">Materiais e evidências vinculados</p>
                <span className="font-editorial text-lg">{data.evidenceLinks.length}</span>
              </div>
              {data.evidenceLinks.length ? (
                <div className="divide-y paper-rule">
                  {data.evidenceLinks.map(link => (
                    <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-4 py-3 text-sm hover:text-primary">
                      <span className="min-w-0 truncate font-medium">{link.label}</span>
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground">{link.linkType}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-sm text-muted-foreground">Nenhum link de material ou evidência foi vinculado a esta atividade.</p>
              )}
              {data.canManageAllocations && (
                <div className="mt-4 grid gap-3 border-t paper-rule pt-4 md:grid-cols-[1fr_1.25fr_180px_auto]">
                  <Input id="evidence-link-label" value={linkLabel} onChange={event => setLinkLabel(event.target.value)} placeholder="Nome do material ou evidência (mín. 3 caracteres)" minLength={3} aria-invalid={linkLabel.trim().length > 0 && linkLabel.trim().length < 3} />
                  <Input value={linkUrl} onChange={event => setLinkUrl(event.target.value)} placeholder="https://..." type="url" />
                  <Select value={linkType} onValueChange={value => setLinkType(value as "material" | "evidência de campo")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="material">Material</SelectItem>
                      <SelectItem value="evidência de campo">Evidência de campo</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={saveEvidenceLink} disabled={addEvidenceLink.isPending || linkLabel.trim().length < 3 || !linkUrl.trim()}>Vincular</Button>
                </div>
              )}
            </section>

            {/* Pipeline Editorial de Documentação da Seção */}
            <section className="border-b paper-rule pb-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b paper-rule pb-3">
                <div>
                  <p className="editorial-kicker flex items-center gap-2 text-primary font-semibold">
                    <Sparkles className="h-4 w-4" /> Pipeline Editorial de Documentação
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Fluxo formal: Minuta → Revisão Técnica → Ajustes do Autor → Parecer & Validação → Remissão de Capítulo.
                  </p>
                </div>
                <a
                  href="/producao"
                  className="inline-flex items-center justify-center rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" /> Abrir Estação de Produção & Revisão
                </a>
              </div>
              <div className="mt-4">
                <DocumentationWorkflowStepper
                  currentStage={getWorkflowStage(
                    data.documentStatus,
                    data.activeSubmission?.status,
                    data.activeSubmission?.pendingCommentCount ?? 0,
                    Boolean(data.activeSubmission),
                    data.documentStatus === "revisada pela seção" ||
                      data.documentStatus === "consolidada no capítulo"
                  )}
                  openCommentCount={data.activeSubmission?.pendingCommentCount ?? 0}
                />
              </div>
            </section>

            <section className="grid gap-6 border-b paper-rule pb-6 md:grid-cols-2">
              <div>
                <div className="flex items-center justify-between border-b paper-rule pb-3">
                  <p className="editorial-kicker flex items-center gap-2 text-muted-foreground">
                    <ClipboardCheck className="h-4 w-4" /> Revisores apontados
                  </p>
                  <span className="font-editorial text-lg">{data.reviewers.length}</span>
                </div>
                {data.canManageAllocations && (
                  <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => onEditReviewers(data.id)}>
                    <ClipboardCheck className="mr-2 h-4 w-4" /> Atribuir revisores
                  </Button>
                )}
                {data.reviewers.length ? (
                  <div className="divide-y paper-rule">
                    {data.reviewers.map(reviewer => (
                      <div key={reviewer.id} className="flex items-start justify-between gap-4 py-4">
                        <div>
                          <p className="font-editorial text-lg font-semibold">{reviewer.reviewerName}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{reviewer.groupName ?? reviewer.institution}</p>
                          <p className="mt-2 text-[11px] text-muted-foreground">Indicado por {reviewer.assignedByName ?? "Registro histórico"}{reviewer.createdAt ? ` em ${formatDate(reviewer.createdAt)}` : ""}</p>
                        </div>
                        <span className="border border-foreground/25 px-2 py-1 text-[10px] font-semibold uppercase tracking-[.12em]">{reviewer.status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-sm text-muted-foreground">Nenhum revisor foi alocado a esta atividade.</p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between border-b paper-rule pb-3">
                  <p className="editorial-kicker text-muted-foreground">Material técnico em revisão</p>
                  <a href="/producao" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                    <Eye className="h-3 w-3" /> Ver na Produção
                  </a>
                </div>
                {data.activeSubmission ? (
                  <div className="mt-3 border-l-4 border-primary bg-card/55 p-4 rounded-r-md border">
                    <p className="font-editorial text-lg font-semibold">{data.activeSubmission.materialTitle}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Versão {data.activeSubmission.revisionNumber} · {data.activeSubmission.status} · {data.activeSubmission.pendingCommentCount} apontamento(s) pendente(s)
                    </p>
                    {data.activeSubmission.message && (
                      <p className="mt-2 text-xs leading-relaxed text-foreground/85 bg-muted/40 p-2.5 rounded">
                        {data.activeSubmission.message}
                      </p>
                    )}
                    <div className="mt-3">
                      <a
                        href="/producao"
                        className="inline-flex items-center justify-center rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" /> Acessar Pareceres e Apontamentos
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 border rounded-md p-5 text-center bg-muted/20">
                    <p className="text-sm text-muted-foreground">Ainda não há material formalmente submetido para esta atividade.</p>
                    <a
                      href="/producao"
                      className="mt-3 inline-flex items-center justify-center rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Subir Minuta Inicial no Portal
                    </a>
                  </div>
                )}
              </div>
            </section>

            {data.parentActivityId === null && (
              <section className="border-b paper-rule pb-6">
                <div className="flex flex-wrap items-end justify-between gap-4 border-b paper-rule pb-3">
                  <div>
                    <p className="editorial-kicker flex items-center gap-2 text-primary"><ClipboardCheck className="h-4 w-4" /> Revisão documental</p>
                    <h3 className="font-editorial mt-2 text-2xl font-semibold">Checklist por seção e capítulo</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Acompanhe texto, dados, interfaces, coerência do capítulo e encaminhamento ao tomo. Cada alteração permanece registrada no histórico da atividade.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {data.canManageAllocations && (
                      <Button type="button" size="sm" variant="outline" onClick={applyChecklistSchedule} disabled={applyOfficialChecklistSchedule.isPending}>
                        <CalendarDays className="mr-2 h-4 w-4" /> {applyOfficialChecklistSchedule.isPending ? "Configurando…" : "Aplicar cronograma oficial"}
                      </Button>
                    )}
                    <span className="font-display text-3xl text-primary">{data.reviewChecklist.items.filter(item => item.status === "concluído").length}/{data.reviewChecklist.items.length}</span>
                  </div>
                </div>
                {data.reviewChecklist.items.length === 0 ? (
                  <div className="mt-4 border-l-4 border-primary bg-card/55 p-5">
                    <p className="text-sm leading-6 text-foreground/80">O checklist ainda não foi iniciado. Os itens-padrão serão criados com o coordenador da atividade como responsável e o prazo da entrega como referência inicial.</p>
                    {data.canManageAllocations && <Button size="sm" className="mt-4" onClick={initializeChecklist} disabled={initializeReviewChecklist.isPending}><ClipboardCheck className="mr-2 h-4 w-4" /> Criar checklist de revisão</Button>}
                  </div>
                ) : (
                  <div className="mt-4 divide-y border-y paper-rule">
                    {data.reviewChecklist.items.map(item => (
                      <div key={item.id} className="grid gap-3 py-4 lg:grid-cols-[110px_minmax(0,1fr)_172px_155px] lg:items-center">
                        <span className="data-label text-primary">{item.scope}</span>
                        <div>
                          <p className="text-sm font-semibold leading-5">{item.title}</p>
                          {data.canManageAllocations ? (
                            <Select value={item.responsibleId ? String(item.responsibleId) : "unassigned"} onValueChange={value => void updateChecklistResponsible(item.id, value)} disabled={updateReviewChecklistItem.isPending}>
                              <SelectTrigger className="mt-2 h-8 text-xs" aria-label={`Responsável por ${item.title}`}><SelectValue placeholder="Responsável" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Responsável a definir</SelectItem>
                                {data.eligibleParticipants.map(member => <SelectItem key={member.id} value={String(member.id)}>{member.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : <p className="mt-1 text-xs text-muted-foreground">Responsável: {item.responsibleName ?? "A definir"}</p>}
                          {item.completedByName && <p className="mt-1 text-xs text-muted-foreground">Concluído por {item.completedByName}</p>}
                        </div>
                        <div>
                          <Label htmlFor={`review-deadline-${item.id}`} className="sr-only">Prazo de {item.title}</Label>
                          <Input id={`review-deadline-${item.id}`} type="date" value={checklistDueDates[item.id] ?? toDateInputValue(item.dueAt)} disabled={!data.canManageAllocations || updateReviewChecklistItem.isPending} onChange={event => setChecklistDueDates(current => ({ ...current, [item.id]: event.target.value }))} onBlur={event => { if (event.target.value !== toDateInputValue(item.dueAt)) void updateChecklistDeadline(item.id, event.target.value); }} />
                          <p className="mt-1 text-[10px] text-muted-foreground">{item.dueAt ? `Prazo: ${formatDate(item.dueAt)}` : "Prazo a definir"}</p>
                        </div>
                        {data.canManageAllocations ? (
                          <Select value={item.status} onValueChange={value => void updateChecklistStatus(item.id, value as "pendente" | "em andamento" | "concluído" | "bloqueado")} disabled={updateReviewChecklistItem.isPending}>
                            <SelectTrigger aria-label={`Estado do item ${item.title}`}><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendente">Pendente</SelectItem>
                              <SelectItem value="em andamento">Em andamento</SelectItem>
                              <SelectItem value="bloqueado">Bloqueado</SelectItem>
                              <SelectItem value="concluído">Concluído</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : <StatusBadge status={item.status === "concluído" ? "concluído" : item.status === "bloqueado" ? "atrasado" : item.status === "em andamento" ? "em andamento" : "pendente"} />}
                      </div>
                    ))}
                  </div>
                )}
                {data.reviewChecklist.events.length > 0 && <p className="mt-3 text-xs leading-5 text-muted-foreground">Última movimentação: {data.reviewChecklist.events[0]?.summary} Registrada por {data.reviewChecklist.events[0]?.actorName}.</p>}
              </section>
            )}

            {data.interfaces.length > 0 && (
              <section className="border-b paper-rule pb-6">
                <p className="editorial-kicker flex items-center gap-2 text-muted-foreground"><GitMerge className="h-4 w-4" /> Interfaces relacionadas</p>
                <div className="mt-4 grid gap-px bg-foreground/20 sm:grid-cols-2">
                  {data.interfaces.map(item => {
                    const latestEvent = item.events[item.events.length - 1];
                    return (
                      <div key={item.id} className="bg-background p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-editorial text-lg font-semibold">{item.title}</p>
                          <span className="text-[10px] font-semibold uppercase tracking-[.12em] text-primary">{item.priority}</span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">{item.status} · {item.interfaceType}</p>
                        <p className="mt-3 text-xs leading-relaxed">
                          <strong>Grupos:</strong> {item.groups.map(group => groupDisplayName(group.name)).join(" · ")}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed">
                          <strong>Responsável:</strong> {item.responsibleName}
                        </p>
                        {latestEvent && (
                          <p className="mt-3 border-t paper-rule pt-3 text-xs leading-relaxed text-muted-foreground">
                            <strong className="text-foreground">Último encaminhamento:</strong> {latestEvent.summary}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <DialogFooter className="gap-2 sm:justify-between">
              <p className="self-center text-xs text-muted-foreground">
                Última atualização: {formatDate(data.updatedAt.getTime())}
              </p>
              <div className="flex flex-wrap gap-2">
                {data.canManageAllocations && (
                  <>
                    <Button
                      variant={isAdmin ? "outline" : "default"}
                      onClick={() => onEditHours(data.id)}
                      className="rounded-md"
                    >
                      <UsersRound className="mr-2 h-4 w-4" /> Distribuir execução
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onEditReviewers(data.id)}
                      className="rounded-md"
                    >
                      <ClipboardCheck className="mr-2 h-4 w-4" /> Revisores
                    </Button>
                  </>
                )}
                {(isAdmin || data.canManageAllocations || data.isCoordinator) && (
                  <Button
                    onClick={() => onEdit(data)}
                    className="rounded-md"
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Editar atividade
                  </Button>
                )}
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AllocationEditor({
  activityId,
  open,
  setOpen,
}: {
  activityId: number | null;
  open: boolean;
  setOpen: (value: boolean) => void;
}) {
  const { data, isLoading } = trpc.activities.detail.useQuery(
    { id: activityId ?? 1 },
    { enabled: open && activityId !== null }
  );
  const updateAllocations = trpc.activities.updateAllocations.useMutation();
  const utils = trpc.useUtils();
  const [allocations, setAllocations] = useState<ExecutionAssignment[]>([]);
  const [executorChoice, setExecutorChoice] = useState<string | undefined>();
  const [executorSearch, setExecutorSearch] = useState("");
  const [leadershipChangeJustification, setLeadershipChangeJustification] = useState("");

  useEffect(() => {
    if (!open || !data) return;
    setAllocations(
      data.allocations.map(allocation => ({
        teamMemberId: allocation.teamMemberId,
        allocatedHours: allocation.allocatedHours,
        responsibility: allocation.responsibility ?? "",
        isExecutionLead: allocation.isExecutionLead,
      }))
    );
    setLeadershipChangeJustification("");
  }, [data, open]);

  const toggleAssignment = (teamMemberId: number, selected: boolean) => {
    if (!selected) {
      const remaining = allocations.filter(
        allocation => allocation.teamMemberId !== teamMemberId
      );
      if (remaining.length && !remaining.some(item => item.isExecutionLead)) {
        remaining[0] = { ...remaining[0], isExecutionLead: true };
      }
      setAllocations(remaining);
      return;
    }
    setAllocations([
      ...allocations,
      {
        teamMemberId,
        allocatedHours: 0,
        responsibility: "",
        isExecutionLead: allocations.length === 0,
      },
    ]);
  };

  const updateAssignment = (
    teamMemberId: number,
    changes: Partial<ExecutionAssignment>
  ) => {
    setAllocations(current =>
      current.map(allocation => {
        if (changes.isExecutionLead && allocation.teamMemberId !== teamMemberId) {
          return { ...allocation, isExecutionLead: false };
        }
        return allocation.teamMemberId === teamMemberId
          ? { ...allocation, ...changes }
          : allocation;
      })
    );
  };

  const save = async () => {
    if (!activityId) return;
    const priorLeadId = data?.allocations.find(allocation => allocation.isExecutionLead)?.teamMemberId;
    const nextLeadId = allocations.find(allocation => allocation.isExecutionLead)?.teamMemberId;
    if (priorLeadId && nextLeadId && priorLeadId !== nextLeadId && leadershipChangeJustification.trim().length < 10) {
      toast.error("Informe uma justificativa de pelo menos 10 caracteres para alterar a liderança de execução.");
      return;
    }
    const invalidAssignments = allocations.some(
      allocation =>
        allocation.allocatedHours <= 0 ||
        allocation.responsibility.trim().length < 3
    );
    const leadCount = allocations.filter(
      allocation => allocation.isExecutionLead
    ).length;
    if (invalidAssignments || (allocations.length > 0 && leadCount !== 1)) {
      toast.error(
        "Informe horas positivas, um escopo para cada integrante e exatamente um líder de execução."
      );
      return;
    }
    try {
      await updateAllocations.mutateAsync({
        id: activityId,
        leadershipChangeJustification: leadershipChangeJustification.trim() || undefined,
        allocations: allocations.map(allocation => ({
          ...allocation,
          responsibility: allocation.responsibility.trim(),
          allocatedHours: Number(allocation.allocatedHours.toFixed(2)),
        })),
      });
      await Promise.all([
        utils.activities.list.invalidate(),
        utils.activities.detail.invalidate(),
      ]);
      toast.success("Responsabilidades e horas atualizadas.");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar as responsabilidades."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[92vh] overflow-y-auto bg-card sm:max-w-2xl">
        {isLoading || !data ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>Distribuição da execução</DialogTitle>
              <DialogDescription>
                Carregando os participantes elegíveis para delegação.
              </DialogDescription>
            </DialogHeader>
            <div className="py-16 text-center text-sm text-muted-foreground">
              Carregando participantes do grupo…
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <p className="editorial-kicker text-primary">
                {data.sectionCode} · {data.groupName}
              </p>
              <DialogTitle className="font-display text-3xl font-semibold tracking-[-.03em]">
                Distribuição da execução
              </DialogTitle>
              <DialogDescription>
                {data.title}. Selecione os integrantes, descreva as responsabilidades,
                defina a liderança de execução e informe as horas previstas.
              </DialogDescription>
            </DialogHeader>
            {data.eligibleParticipants.length ? (
              <div className="mt-5">
                <Label>Adicionar executor</Label>
                <Input className="mt-2" value={executorSearch} onChange={event => setExecutorSearch(event.target.value)} placeholder="Buscar integrante" />
                <Select value={executorChoice} onValueChange={value => { toggleAssignment(Number(value), true); setExecutorChoice(undefined); }}>
                  <SelectTrigger className="mt-2"><SelectValue placeholder="Selecionar integrante elegível" /></SelectTrigger>
                  <SelectContent>{data.eligibleParticipants.filter(member => !allocations.some(item => item.teamMemberId === member.id) && `${member.name} ${member.groupName ?? ""} ${member.institution}`.toLowerCase().includes(executorSearch.toLowerCase())).map(member => <SelectItem key={member.id} value={String(member.id)} className={(member.currentAllocatedHours ?? 0) >= 80 ? "text-red-700" : (member.currentAllocatedHours ?? 0) >= 40 ? "text-amber-700" : "text-emerald-700"}>{(member.currentAllocatedHours ?? 0) >= 80 ? "● Sobrecarga" : (member.currentAllocatedHours ?? 0) >= 40 ? "● Atenção" : "● Disponível"} · {member.name} · {member.groupName ?? member.institution} · {member.currentAllocatedHours ?? 0}h em {member.currentActivityCount ?? 0} atividade(s)</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ) : null}
            {data.eligibleParticipants.length ? (
              <>
              <div className="mt-5 divide-y paper-rule border-y paper-rule">
                {data.eligibleParticipants.map(member => {
                  const allocation = allocations.find(
                    item => item.teamMemberId === member.id
                  );
                  return (
                    <div
                      key={member.id}
                      className="grid gap-3 py-4"
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`assignment-${member.id}`}
                          checked={Boolean(allocation)}
                          onCheckedChange={checked =>
                            toggleAssignment(member.id, checked === true)
                          }
                        />
                        <div>
                          <Label
                            htmlFor={`assignment-${member.id}`}
                            className="font-editorial text-lg font-semibold"
                          >
                            {member.name}
                          </Label>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {member.title} · {member.institution}
                          </p>
                        </div>
                      </div>
                      {allocation && (
                        <div className="grid gap-3 rounded-md border bg-muted/25 p-3 sm:grid-cols-[1fr_130px]">
                          <div>
                            <Label htmlFor={`responsibility-${member.id}`}>
                              Escopo da responsabilidade
                            </Label>
                            <Textarea
                              id={`responsibility-${member.id}`}
                              value={allocation.responsibility}
                              onChange={event =>
                                updateAssignment(member.id, {
                                  responsibility: event.target.value,
                                })
                              }
                              placeholder="Ex.: consolidar dados e redigir a subseção técnica"
                              className="mt-2 min-h-20"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`allocation-${member.id}`}>
                              Horas previstas
                            </Label>
                            <div className="relative mt-2">
                              <Input
                                id={`allocation-${member.id}`}
                                type="number"
                                min="0"
                                max="100000"
                                step="0.5"
                                placeholder="0"
                                value={allocation.allocatedHours || ""}
                                onChange={event =>
                                  updateAssignment(member.id, {
                                    allocatedHours: Number(event.target.value),
                                  })
                                }
                                className="pr-9 text-right"
                              />
                              <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                                h
                              </span>
                            </div>
                            <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs font-medium">
                              <Checkbox
                                checked={allocation.isExecutionLead}
                                onCheckedChange={checked =>
                                  updateAssignment(member.id, {
                                    isExecutionLead: checked === true,
                                  })
                                }
                              />
                              Líder da execução
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="flex items-center justify-between border-t-2 border-foreground py-4">
                  <span className="editorial-kicker">Total informado</span>
                  <strong className="font-display text-3xl">
                    {formatHours(
                      allocations.reduce(
                        (sum, allocation) => sum + allocation.allocatedHours,
                        0
                      )
                    )}
                    h
                  </strong>
                </div>
              </div>
              <div className="mt-5">
                <Label htmlFor="leadership-justification">Justificativa para mudança de liderança</Label>
                <Textarea id="leadership-justification" className="mt-2 min-h-20" value={leadershipChangeJustification} onChange={event => setLeadershipChangeJustification(event.target.value)} placeholder="Obrigatória quando o líder de execução for alterado." />
              </div>
              </>
            ) : (
              <p className="mt-5 border-y paper-rule py-8 text-sm text-muted-foreground">
                Este grupo não possui participantes ativos para alocação.
              </p>
            )}
            <Button
              onClick={save}
              disabled={updateAllocations.isPending}
              className="mt-5 w-full"
            >
              {updateAllocations.isPending
                ? "Salvando…"
                : "Salvar responsabilidades e horas"}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReviewerEditor({
  activityId,
  open,
  setOpen,
}: {
  activityId: number | null;
  open: boolean;
  setOpen: (value: boolean) => void;
}) {
  const { data, isLoading } = trpc.activities.detail.useQuery(
    { id: activityId ?? 1 },
    { enabled: open && activityId !== null }
  );
  const updateReviewers = trpc.activities.updateReviewers.useMutation();
  const utils = trpc.useUtils();
  const [reviewerIds, setReviewerIds] = useState<number[]>([]);
  const [reviewerSearch, setReviewerSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("todos");

  useEffect(() => {
    if (open && data) {
      setReviewerIds(data.reviewers.map(reviewer => reviewer.teamMemberId));
      setReviewerSearch("");
      setGroupFilter("todos");
    }
  }, [data, open]);

  const toggleReviewer = (id: number, checked: boolean) => {
    setReviewerIds(current =>
      checked
        ? Array.from(new Set([...current, id]))
        : current.filter(item => item !== id)
    );
  };

  const availableGroups = useMemo(() => {
    if (!data?.eligibleReviewers) return [];
    const groups = new Set<string>();
    data.eligibleReviewers.forEach(member => {
      if (member.groupName) groups.add(member.groupName);
    });
    return Array.from(groups).sort();
  }, [data?.eligibleReviewers]);

  const filteredMembers = useMemo(() => {
    if (!data?.eligibleReviewers) return [];
    const term = reviewerSearch.trim().toLowerCase();
    return data.eligibleReviewers.filter(member => {
      const matchesGroup = groupFilter === "todos" || member.groupName === groupFilter;
      if (!matchesGroup) return false;
      if (!term) return true;
      return `${member.name} ${member.title} ${member.institution} ${member.groupName ?? ""} ${member.email ?? ""}`
        .toLowerCase()
        .includes(term);
    });
  }, [data?.eligibleReviewers, reviewerSearch, groupFilter]);

  const save = async () => {
    if (!activityId) return;
    try {
      await updateReviewers.mutateAsync({ id: activityId, reviewerIds });
      await Promise.all([
        utils.activities.list.invalidate(),
        utils.activities.detail.invalidate(),
        utils.production.list.invalidate(),
      ]);
      toast.success("Revisores da atividade atualizados.");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar os revisores."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[92vh] overflow-y-auto bg-card sm:max-w-4xl">
        {isLoading || !data ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>Alocar revisores</DialogTitle>
              <DialogDescription>
                Carregando os integrantes elegíveis para a revisão por pares.
              </DialogDescription>
            </DialogHeader>
            <div className="py-16 text-center text-sm text-muted-foreground">
              Carregando revisores elegíveis…
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <p className="editorial-kicker text-primary">
                {data.sectionCode} · Revisão por pares
              </p>
              <DialogTitle className="font-display text-3xl font-semibold tracking-[-.03em]">
                Alocar revisores técnicos
              </DialogTitle>
              <DialogDescription>
                {data.title}. Selecione qualquer integrante ativo da equipe técnica (G1–G11) para emitir parecer na revisão por pares.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={reviewerSearch}
                    onChange={event => setReviewerSearch(event.target.value)}
                    placeholder="Buscar por nome, grupo, e-mail ou instituição..."
                    className="pl-9"
                  />
                </div>
                <div className="w-full sm:w-64">
                  <Select value={groupFilter} onValueChange={setGroupFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os grupos ({data.eligibleReviewers.length})</SelectItem>
                      {availableGroups.map(group => (
                        <SelectItem key={group} value={group}>
                          {groupDisplayName(group)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-y paper-rule py-2.5 text-xs text-muted-foreground">
                <span className="font-mono">
                  {reviewerIds.length} selecionado{reviewerIds.length === 1 ? "" : "s"} · {filteredMembers.length} exibido{filteredMembers.length === 1 ? "" : "s"} de {data.eligibleReviewers.length} elegíveis
                </span>
                <div className="flex items-center gap-2">
                  {reviewerIds.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setReviewerIds([])}
                      className="h-7 text-xs"
                    >
                      Limpar seleção
                    </Button>
                  )}
                  {filteredMembers.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newIds = Array.from(new Set([...reviewerIds, ...filteredMembers.map(m => m.id)]));
                        setReviewerIds(newIds);
                      }}
                      className="h-7 text-xs"
                    >
                      Selecionar visíveis
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {filteredMembers.map(member => {
                  const checked = reviewerIds.includes(member.id);
                  const reviewCount = member.currentReviewCount ?? 0;
                  const workloadBadge =
                    reviewCount >= 4
                      ? { label: `${reviewCount} revisões (Sobrecarga)`, cls: "border-red-300 bg-red-50 text-red-700" }
                      : reviewCount >= 2
                      ? { label: `${reviewCount} revisões (Atenção)`, cls: "border-amber-300 bg-amber-50 text-amber-700" }
                      : { label: reviewCount === 0 ? "Disponível" : "1 revisão (Disponível)", cls: "border-emerald-300 bg-emerald-50 text-emerald-700" };

                  return (
                    <div
                      key={member.id}
                      onClick={() => toggleReviewer(member.id, !checked)}
                      className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                        checked
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border bg-card hover:bg-muted/40"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={value =>
                          toggleReviewer(member.id, value === true)
                        }
                        onClick={event => event.stopPropagation()}
                        className="mt-1 rounded-none"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-display text-sm font-semibold leading-5 text-foreground">
                            {member.name}
                          </p>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${workloadBadge.cls}`}>
                            {workloadBadge.label}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {member.title} · {member.institution}
                        </p>
                        {member.groupName && (
                          <p className="mt-1 text-[11px] font-medium text-primary">
                            {groupDisplayName(member.groupName)}
                          </p>
                        )}
                        {member.email && (
                          <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                            {member.email}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {!filteredMembers.length && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">Nenhum integrante encontrado</p>
                  <p className="mt-1">Tente ajustar o termo da busca ou o filtro de grupo.</p>
                </div>
              )}
            </div>

            <DialogFooter className="mt-6 gap-2 sm:justify-between">
              <span className="self-center font-mono text-xs text-muted-foreground">
                {reviewerIds.length} revisor(es) selecionado(s)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={save}
                  disabled={updateReviewers.isPending}
                >
                  {updateReviewers.isPending
                    ? "Salvando…"
                    : `Salvar ${reviewerIds.length} revisor(es)`}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ActivityEditor({
  open,
  setOpen,
  initial,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  initial: ActivityForm;
}) {
  const [form, setForm] = useState(initial);
  const utils = trpc.useUtils();
  const { data: access } = trpc.administration.status.useQuery();
  const isAdmin = access?.isAdmin ?? false;
  const isCoordinator = Boolean(
    access?.isCoordinator ||
    access?.activityMembership?.accessMode === "coordenação" ||
    access?.teamMembership?.groupRole === "coordenador"
  );
  const isManager = isAdmin || isCoordinator;
  const { data: sections } = trpc.dashboard.sections.useQuery();
  const { data: team } = trpc.team.list.useQuery();
  const create = trpc.activities.create.useMutation();
  const update = trpc.activities.update.useMutation();
  const busy = create.isPending || update.isPending;

  const coordinators = useMemo(
    () =>
      (team ?? []).filter(
        member => member.active
      ),
    [team]
  );
  const isExecutionStep = form.parentActivityId != null;
  const selectedCoordinator = coordinators.find(
    member => member.id === Number(form.responsibleId)
  );
  const eligibleParticipants = useMemo(
    () => (team ?? []).filter(member => member.active),
    [team]
  );

  const toggleFormAssignment = (teamMemberId: number, selected: boolean) => {
    if (!selected) {
      const remaining = form.allocations.filter(
        allocation => allocation.teamMemberId !== teamMemberId
      );
      if (remaining.length && !remaining.some(item => item.isExecutionLead)) {
        remaining[0] = { ...remaining[0], isExecutionLead: true };
      }
      setForm({ ...form, allocations: remaining });
      return;
    }
    setForm({
      ...form,
      allocations: [
        ...form.allocations,
        {
          teamMemberId,
          allocatedHours: 0,
          responsibility: "",
          isExecutionLead: form.allocations.length === 0,
        },
      ],
    });
  };

  const updateFormAssignment = (
    teamMemberId: number,
    changes: Partial<ExecutionAssignment>
  ) => {
    setForm({
      ...form,
      allocations: form.allocations.map(allocation => {
        if (changes.isExecutionLead && allocation.teamMemberId !== teamMemberId) {
          return { ...allocation, isExecutionLead: false };
        }
        return allocation.teamMemberId === teamMemberId
          ? { ...allocation, ...changes }
          : allocation;
      }),
    });
  };

  const save = async () => {
    if (
      !form.title ||
      !form.description ||
      !form.sectionId ||
      !form.responsibleId ||
      !form.dueDate
    ) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    const shouldValidateAllocations = isManager && (
      !isExecutionStep
        ? form.allocations.length > 0
        : form.allocations.some(a => a.allocatedHours > 0 || a.responsibility.trim().length > 0)
    );
    if (shouldValidateAllocations) {
      const invalidAssignments = form.allocations.some(
        allocation =>
          allocation.allocatedHours <= 0 ||
          allocation.responsibility.trim().length < 3
      );
      const leadCount = form.allocations.filter(
        allocation => allocation.isExecutionLead
      ).length;
      if (
        invalidAssignments ||
        (form.allocations.length > 0 && leadCount !== 1)
      ) {
        toast.error(
          "Informe horas positivas, um escopo para cada integrante e exatamente um líder de execução."
        );
        return;
      }
    }
    const allocations = form.allocations.map(allocation => ({
      ...allocation,
      responsibility: allocation.responsibility.trim(),
      allocatedHours: Number(allocation.allocatedHours.toFixed(2)),
    }));
    const startAt = form.startDate
      ? new Date(`${form.startDate}T12:00:00`).getTime()
      : null;
    const dueAt = new Date(`${form.dueDate}T12:00:00`).getTime();
    if (startAt && startAt > dueAt) {
      toast.error("A data inicial não pode ser posterior à data de término.");
      return;
    }
    const payload = {
      title: form.title,
      description: form.description,
      sectionId: Number(form.sectionId),
      responsibleId: Number(form.responsibleId),
      startAt,
      dueAt,
      status: form.status,
      progress: form.status === "concluído" ? 100 : form.progress,
      ...(isManager && shouldValidateAllocations ? { allocations } : {}),
    };
    try {
      if (form.id) await update.mutateAsync({ id: form.id, ...payload });
      else await create.mutateAsync(payload);
      await Promise.all([
        utils.activities.list.invalidate(),
        utils.activities.detail.invalidate(),
        utils.dashboard.overview.invalidate(),
      ]);
      toast.success(
        form.id
          ? "Atividade e horas atualizadas."
          : "Atividade criada e atribuição registrada."
      );
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[92vh] overflow-y-auto bg-card sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-semibold tracking-[-.03em]">
            {form.id ? "Editar atividade" : "Nova atividade"}
          </DialogTitle>
          <DialogDescription>
            Definição da coordenação e distribuição da execução entre os
            participantes do grupo selecionado.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Título</Label>
            <Input
              value={form.title}
              onChange={event => setForm({ ...form, title: event.target.value })}
              className="mt-2 rounded-none"
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Notas de execução e complementos</Label>
            <Textarea
              value={form.description}
              onChange={event =>
                setForm({ ...form, description: event.target.value })
              }
              className="mt-2 min-h-24 rounded-none"
            />
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              A descrição oficial da frente vem do anexo e permanece preservada.
              Use este campo apenas para orientações e complementos operacionais.
            </p>
          </div>
          <div>
            <Label>Seção</Label>
            <Select
              disabled={!isManager}
              value={form.sectionId}
              onValueChange={value => setForm({ ...form, sectionId: value })}
            >
              <SelectTrigger className="mt-2 w-full rounded-none">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {sections?.map(section => (
                  <SelectItem key={section.id} value={String(section.id)}>
                    {section.code} — {section.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{isExecutionStep ? "Responsável de execução" : "Coordenador(a) da atividade"}</Label>
            <Select
              disabled={!isManager}
              value={form.responsibleId}
              onValueChange={value =>
                setForm({
                  ...form,
                  responsibleId: value,
                  allocations:
                    value === form.responsibleId ? form.allocations : [],
                })
              }
            >
              <SelectTrigger className="mt-2 w-full rounded-none">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {coordinators.map(member => (
                  <SelectItem key={member.id} value={String(member.id)}>
                    {member.name} — {member.groupName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Data inicial</Label>
            <Input
              type="date"
              value={form.startDate}
              onChange={event =>
                setForm({ ...form, startDate: event.target.value })
              }
              className="mt-2 rounded-none"
            />
          </div>
          <div>
            <Label>Data de término</Label>
            <Input
              type="date"
              value={form.dueDate}
              onChange={event =>
                setForm({ ...form, dueDate: event.target.value })
              }
              className="mt-2 rounded-none"
            />
          </div>
          <div>
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={value =>
                setForm({ ...form, status: value as ActivityStatus })
              }
            >
              <SelectTrigger className="mt-2 w-full rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_STATUSES.map(status => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label>Progresso</Label>
              <span className="text-sm font-semibold">
                {form.status === "concluído" ? 100 : form.progress}%
              </span>
            </div>
            <Input
              type="range"
              min="0"
              max="100"
              step="5"
              disabled={form.status === "concluído"}
              value={form.status === "concluído" ? 100 : form.progress}
              onChange={event =>
                setForm({ ...form, progress: Number(event.target.value) })
              }
              className="mt-2"
            />
          </div>

          {isManager ? (
            <section className="border-t-2 border-foreground pt-5 sm:col-span-2">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="editorial-kicker text-primary">
                    Distribuição da equipe
                  </p>
                  <h3 className="font-editorial mt-2 text-2xl font-semibold">
                    Responsabilidades e horas
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedCoordinator
                    ? `${selectedCoordinator.name} pode acumular funções ou distribuir responsabilidades a qualquer integrante ativo.`
                    : "Selecione primeiro o coordenador(a) da atividade"}
                </p>
              </div>
              {selectedCoordinator ? (
                eligibleParticipants.length ? (
                  <div className="mt-5 divide-y paper-rule border-y paper-rule">
                    {eligibleParticipants.map(member => {
                      const allocation = form.allocations.find(
                        item => item.teamMemberId === member.id
                      );
                      return (
                        <div
                          key={member.id}
                          className="grid gap-3 py-3"
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id={`form-assignment-${member.id}`}
                              checked={Boolean(allocation)}
                              onCheckedChange={checked =>
                                toggleFormAssignment(member.id, checked === true)
                              }
                            />
                            <div>
                              <Label htmlFor={`form-assignment-${member.id}`}>
                                {member.name}
                              </Label>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {member.title} · {member.institution}
                              </p>
                            </div>
                          </div>
                          {allocation && (
                            <div className="grid gap-3 rounded-md border bg-muted/25 p-3 sm:grid-cols-[1fr_130px]">
                              <div>
                                <Label htmlFor={`form-responsibility-${member.id}`}>
                                  Escopo da responsabilidade
                                </Label>
                                <Textarea
                                  id={`form-responsibility-${member.id}`}
                                  value={allocation.responsibility}
                                  onChange={event =>
                                    updateFormAssignment(member.id, {
                                      responsibility: event.target.value,
                                    })
                                  }
                                  placeholder="Ex.: organizar dados, elaborar análise e preparar a minuta"
                                  className="mt-2 min-h-20"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`hours-${member.id}`}>
                                  Horas previstas
                                </Label>
                                <div className="relative mt-2">
                                  <Input
                                    id={`hours-${member.id}`}
                                    type="number"
                                    min="0"
                                    max="100000"
                                    step="0.5"
                                    placeholder="0"
                                    value={allocation.allocatedHours || ""}
                                    onChange={event =>
                                      updateFormAssignment(member.id, {
                                        allocatedHours: Number(event.target.value),
                                      })
                                    }
                                    className="pr-9 text-right"
                                  />
                                  <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">
                                    h
                                  </span>
                                </div>
                                <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs font-medium">
                                  <Checkbox
                                    checked={allocation.isExecutionLead}
                                    onCheckedChange={checked =>
                                      updateFormAssignment(member.id, {
                                        isExecutionLead: checked === true,
                                      })
                                    }
                                  />
                                  Líder da execução
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between border-t-2 border-foreground py-4">
                      <span className="editorial-kicker">Total informado</span>
                      <strong className="font-display text-3xl">
                        {formatHours(
                          form.allocations.reduce(
                            (sum, allocation) =>
                              sum + allocation.allocatedHours,
                            0
                          )
                        )}
                        h
                      </strong>
                    </div>
                  </div>
                ) : (
                  <p className="mt-5 border-y paper-rule py-6 text-sm text-muted-foreground">
                    Este grupo não possui participantes ativos para alocação.
                  </p>
                )
              ) : (
                <p className="mt-5 border-y paper-rule py-6 text-sm text-muted-foreground">
                  Selecione o coordenador(a) da atividade para distribuir responsabilidades entre integrantes ativos.
                </p>
              )}
            </section>
          ) : (
            <section className="border-t-2 border-foreground pt-5 sm:col-span-2">
              <p className="editorial-kicker text-muted-foreground">Distribuição da equipe</p>
              <p className="mt-2 text-xs text-muted-foreground">
                A atribuição de integrantes e horas é gerenciada pela coordenação do capítulo e pela administração.
              </p>
            </section>
          )}
        </div>
        <Button
          onClick={save}
          disabled={busy}
          className="mt-5 h-11 w-full"
        >
          {busy ? "Salvando…" : "Salvar atividade e responsabilidades"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function ActivitiesContent() {
  const { data: access, isLoading: accessLoading } =
    trpc.administration.status.useQuery();
  const { data, isLoading } = trpc.activities.list.useQuery();
  const { data: statusReport } = trpc.activities.statusReport.useQuery();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [tome, setTome] = useState("todos");
  const [responsibleFilter, setResponsibleFilter] = useState("todos");
  const [reviewerFilter, setReviewerFilter] = useState("todos");
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [linkedDetailHandled, setLinkedDetailHandled] = useState(false);
  const [allocationId, setAllocationId] = useState<number | null>(null);
  const [reviewerActivityId, setReviewerActivityId] = useState<number | null>(null);
  const [bulkAssignmentOpen, setBulkAssignmentOpen] = useState(false);
  const [form, setForm] = useState<ActivityForm>(emptyForm);

  useEffect(() => {
    if (linkedDetailHandled || !data) return;
    const linkedId = Number(new URLSearchParams(window.location.search).get("ficha"));
    if (linkedId > 0 && data.some(item => item.id === linkedId)) {
      setDetailId(linkedId);
    }
    setLinkedDetailHandled(true);
  }, [data, linkedDetailHandled]);

  const assignmentPeople = useMemo(() => {
    const people = new Map<number, string>();
    (data ?? []).forEach(item => {
      people.set(item.responsibleId, item.responsibleName);
      item.allocations.forEach(allocation => people.set(allocation.teamMemberId, allocation.memberName));
      item.reviewers.forEach(reviewer => people.set(reviewer.teamMemberId, reviewer.reviewerName));
    });
    return Array.from(people, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }, [data]);

  const filtered = useMemo(
    () =>
      (data ?? []).filter(item => {
        if (item.parentActivityId != null) return false;
        const itemTome = studyTomeFromCode(item.sectionCode);
        const matchesText = `${item.detailCode} ${item.planCode} ${item.title} ${item.sectionCode} ${itemTome} ${item.planningSummary} ${item.officialDescription} ${item.description} ${item.planningResponsible} ${item.planningSupport} ${item.portalDeliverable} ${item.dependencies} ${item.keywords} ${item.responsibleName} ${item.groupName}`
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesResponsible = responsibleFilter === "todos" || item.responsibleId === Number(responsibleFilter) || item.allocations.some(allocation => allocation.teamMemberId === Number(responsibleFilter));
        const matchesReviewer = reviewerFilter === "todos" || item.reviewers.some(reviewer => reviewer.teamMemberId === Number(reviewerFilter));
        return (
          matchesText &&
          (status === "todos" || item.status === status) &&
          (tome === "todos" || itemTome === tome) &&
          matchesResponsible &&
          matchesReviewer
        );
      }),
    [data, search, status, tome, responsibleFilter, reviewerFilter]
  );

  const reportRows = useMemo(
    () =>
      (statusReport ?? []).filter(item => {
        const itemTome = studyTomeFromCode(item.sectionCode);
        const text = `${item.detailCode} ${item.planCode} ${item.title} ${item.sectionCode} ${item.sectionTitle} ${item.coordinator.name} ${item.executionResponsibles.map(person => person.name).join(" ")} ${item.reviewers.map(person => person.name).join(" ")}`.toLowerCase();
        const matchesResponsible = responsibleFilter === "todos" || item.coordinator.id === Number(responsibleFilter) || item.executionResponsibles.some(person => person.id === Number(responsibleFilter));
        const matchesReviewer = reviewerFilter === "todos" || item.reviewers.some(person => person.id === Number(reviewerFilter));
        return text.includes(search.toLowerCase()) &&
          (status === "todos" || item.status === status) &&
          (tome === "todos" || itemTome === tome) &&
          matchesResponsible &&
          matchesReviewer;
      }),
    [statusReport, search, status, tome, responsibleFilter, reviewerFilter]
  );

  if (isLoading || accessLoading || !data || !access) return <PageLoading />;
  const isAdmin = access.isAdmin;

  const exportStatus = async (format: "csv" | "pdf") => {
    if (!reportRows.length) {
      toast.error("Não há atividades para exportar com os filtros selecionados.");
      return;
    }
    setExporting(format);
    const filename = `status-atividades-${new Date().toISOString().slice(0, 10)}`;
    const describeRow = (item: ActivityStatusReportItem) => ({
      tomo: studyTomeFromCode(item.sectionCode),
      capitulo: `${item.sectionCode} — ${item.sectionTitle}`,
      codigo: item.detailCode ?? item.planCode ?? item.sectionCode,
      nivel: item.parentActivityId === null ? "Capítulo" : "Etapa de execução",
      atividade: item.title,
      status: item.status,
      progresso: `${item.progress}%`,
      coordenador: item.coordinator.name,
      responsaveis: item.executionResponsibles.map(person => `${person.name}${person.isExecutionLead ? " (líder)" : ""}`).join("; ") || "A definir",
      revisores: item.reviewers.map(person => `${person.name} (${person.status})`).join("; ") || "A definir",
      inicio: item.startAt ? formatDate(item.startAt) : "A definir",
      termino: formatDate(item.dueAt),
      horas: formatHours(item.totalAllocatedHours),
      checklist: item.checklist.total ? `${item.checklist.completed}/${item.checklist.total} concluídos; ${item.checklist.pending} em aberto; ${item.checklist.blocked} bloqueados` : "Não aplicável",
    });
    try {
      const rows = reportRows.map(describeRow);
      if (format === "csv") {
        const headers = ["Tomo", "Capítulo", "Código", "Nível", "Atividade", "Status", "Progresso", "Coordenador", "Responsáveis de execução", "Revisores", "Início", "Término", "Horas", "Checklist"];
        const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
        const csv = [headers, ...rows.map(row => [row.tomo, row.capitulo, row.codigo, row.nivel, row.atividade, row.status, row.progresso, row.coordenador, row.responsaveis, row.revisores, row.inicio, row.termino, row.horas, row.checklist])]
          .map(line => line.map(csvCell).join(";"))
          .join("\n");
        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
        link.download = `${filename}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
      } else {
        const { jsPDF } = await import("jspdf");
        const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
        const pageHeight = 595;
        const addHeader = (page: number) => {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(14);
          pdf.text("Portal Naval — Status de atividades", 28, 30);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
          pdf.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")} · página ${page}`, 28, 44);
          pdf.line(28, 50, 764, 50);
        };
        let page = 1;
        let y = 70;
        addHeader(page);
        rows.forEach(row => {
          const line = `${row.codigo} · ${row.nivel} · ${row.status} · ${row.progresso}\n${row.atividade}\nCoordenação: ${row.coordenador} | Execução: ${row.responsaveis} | Revisores: ${row.revisores}\nPeríodo: ${row.inicio} a ${row.termino} | Horas: ${row.horas} | Checklist: ${row.checklist}`;
          const lines = pdf.splitTextToSize(line, 730) as string[];
          const height = lines.length * 9 + 12;
          if (y + height > pageHeight - 28) {
            pdf.addPage();
            page += 1;
            addHeader(page);
            y = 70;
          }
          pdf.setFontSize(8);
          pdf.text(lines, 28, y);
          y += height;
          pdf.setDrawColor(188, 196, 194);
          pdf.line(28, y - 5, 764, y - 5);
        });
        pdf.save(`${filename}.pdf`);
      }
      toast.success(format === "csv" ? "Status exportado em CSV." : "Status exportado em PDF.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível exportar o status das atividades.");
    } finally {
      setExporting(null);
    }
  };

  const edit = (item: ActivityItem) => {
    setDetailId(null);
    setForm({
      id: item.id,
      parentActivityId: item.parentActivityId ?? null,
      title: item.title,
        description: item.description,
        sectionId: String(item.sectionId),
        responsibleId: String(item.responsibleId),
        startDate: item.startAt
          ? new Date(item.startAt).toISOString().slice(0, 10)
          : "",
        dueDate: new Date(item.dueAt).toISOString().slice(0, 10),
      status: item.status,
      progress: item.progress,
      allocations: item.allocations.map(allocation => ({
        teamMemberId: allocation.teamMemberId,
        allocatedHours: allocation.allocatedHours,
        responsibility: allocation.responsibility ?? "",
        isExecutionLead: allocation.isExecutionLead,
      })),
    });
    setEditorKey(value => value + 1);
    setEditorOpen(true);
  };

  const createNew = () => {
    setForm(emptyForm);
    setEditorKey(value => value + 1);
    setEditorOpen(true);
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Controle de atividades"
        title="Gestão de atividades"
        description="Controle documental de 30 capítulos e 250 seções de trabalho. Cada ficha concentra execução, revisão, interfaces, consolidação e aprovação; as seções são acompanhadas dentro do capítulo correspondente."
        index="02 — Atividades"
        action={isAdmin ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setBulkAssignmentOpen(true)} className="rounded-md">
              <UsersRound className="mr-2 h-4 w-4" /> Atribuir G4/G10 em lote
            </Button>
            <Button onClick={createNew} className="rounded-md">
              <Plus className="mr-2 h-4 w-4" /> Nova atividade
            </Button>
          </div>
        ) : undefined}
      />

      <ParticipantActionCenter
        onSelectActivity={id => setDetailId(id)}
        onAssignReviewers={id => setReviewerActivityId(id)}
      />

      <div className="technical-panel grid gap-3 p-4 lg:grid-cols-3 xl:grid-cols-[1fr_170px_170px_200px_200px_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Buscar item, frente, entrega, dependência, grupo ou coordenador"
            className="bg-background pl-10"
          />
        </div>
        <Select value={tome} onValueChange={setTome}>
          <SelectTrigger className="w-full bg-background">
            <Layers3 className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tomos</SelectItem>
            {STUDY_TOMES.map(item => (
              <SelectItem value={item} key={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full bg-background">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {ACTIVITY_STATUSES.map(item => (
              <SelectItem value={item} key={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
          <SelectTrigger className="w-full bg-background" aria-label="Filtrar por responsável"><UserRoundCheck className="mr-2 h-4 w-4" /><SelectValue placeholder="Responsável" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os responsáveis</SelectItem>
            {assignmentPeople.map(person => <SelectItem key={person.id} value={String(person.id)}>{person.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={reviewerFilter} onValueChange={setReviewerFilter}>
          <SelectTrigger className="w-full bg-background" aria-label="Filtrar por revisor"><ClipboardCheck className="mr-2 h-4 w-4" /><SelectValue placeholder="Revisor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os revisores</SelectItem>
            {assignmentPeople.map(person => <SelectItem key={person.id} value={String(person.id)}>{person.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <p className="data-label whitespace-nowrap">{filtered.length} capítulos</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void exportStatus("csv")} disabled={exporting !== null || !statusReport}><Download className="mr-1.5 h-3.5 w-3.5" />{exporting === "csv" ? "Exportando…" : "CSV"}</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => void exportStatus("pdf")} disabled={exporting !== null || !statusReport}><FileDown className="mr-1.5 h-3.5 w-3.5" />{exporting === "pdf" ? "Exportando…" : "PDF"}</Button>
        </div>
      </div>

      <div className="technical-panel overflow-hidden">
        <div className="data-label hidden grid-cols-[40px_70px_minmax(0,1fr)_180px_120px_230px] gap-4 border-b bg-muted/55 px-4 py-3 md:grid">
          <span>Nº</span>
          <span>Código</span>
          <span>Atividade e andamento</span>
          <span>Coordenação e execução</span>
          <span>Entrega</span>
          <span className="text-right">Ações</span>
        </div>
        <div className="divide-y paper-rule">
          {filtered.map((item, index) => {
            return (
            <div key={item.id}>
            <article
              className="grid gap-4 px-4 py-4 hover:bg-muted/35 md:grid-cols-[40px_70px_minmax(0,1fr)_180px_120px_230px] md:items-center"
            >
              <span className="font-mono text-xs text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <SectionMark code={item.detailCode ?? item.planCode ?? item.sectionCode} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="data-label text-primary">{item.detailCode ? "Seção de trabalho" : studyTomeFromCode(item.sectionCode)}</span>
                  <StatusBadge status={item.status} />
                </div>
                <h2 className="mt-1.5 text-[15px] font-semibold leading-5 text-foreground">
                  {item.title}
                </h2>
                {(item.officialDescription || item.description) && (
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {item.officialDescription || item.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] font-medium text-muted-foreground">
                    {item.progress}%
                  </span>
                </div>
              </div>
              <div>
                <p className="data-label md:hidden">Responsável</p>
                <p className="mt-1 text-sm font-medium md:mt-0">
                  {item.responsibleName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.groupName ?? item.institution}
                </p>
                {item.allocations.find(allocation => allocation.isExecutionLead) && (
                  <p className="mt-2 text-[11px] leading-4 text-primary">
                    Execução: {item.allocations.find(allocation => allocation.isExecutionLead)?.memberName}
                  </p>
                )}
              </div>
              <div>
                <p className="data-label md:hidden">Entrega</p>
                <p className="font-mono mt-1 text-xs font-medium md:mt-0">
                  {formatDate(item.dueAt)}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {formatHours(item.totalAllocatedHours)}h alocadas
                </p>
                {item.portalDeliverable && (
                  <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
                    Portal: {item.portalDeliverable}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 md:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDetailId(item.id)}
                  className="rounded-md"
                  aria-label={`Ver ficha de ${item.title}`}
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" /> Ficha
                </Button>
                {(isAdmin ||
                  (access.isCoordinator &&
                    access.teamMembership?.id === item.responsibleId)) && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAllocationId(item.id)}
                      className="rounded-md"
                    >
                      <UsersRound className="mr-1.5 h-3.5 w-3.5" /> Distribuir
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReviewerActivityId(item.id)}
                      className="rounded-md"
                      aria-label={`${item.reviewers.length} revisores de ${item.title}`}
                    >
                      <ClipboardCheck className="mr-1.5 h-3.5 w-3.5" /> {item.reviewers.length}
                    </Button>
                  </>
                )}
                {(isAdmin || (access.isCoordinator && (access.teamMembership?.id === item.responsibleId || access.teamMembership?.groupRole === "coordenador"))) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => edit(item)}
                    aria-label={`Editar ${item.title}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </article>
            </div>
            );
          })}
        </div>
      </div>

      <ActivityDetailDialog
        activityId={detailId}
        onOpenChange={open => {
          if (!open) setDetailId(null);
        }}
        onEdit={edit}
        onEditHours={id => {
          setDetailId(null);
          setAllocationId(id);
        }}
        onEditReviewers={id => {
          setDetailId(null);
          setReviewerActivityId(id);
        }}
        isAdmin={isAdmin}
      />
      <AllocationEditor
        activityId={allocationId}
        open={allocationId !== null}
        setOpen={open => {
          if (!open) setAllocationId(null);
        }}
      />
      <ReviewerEditor
        activityId={reviewerActivityId}
        open={reviewerActivityId !== null}
        setOpen={open => {
          if (!open) setReviewerActivityId(null);
        }}
      />
      {isAdmin && <ReferenceBulkExecutorDialog open={bulkAssignmentOpen} onOpenChange={setBulkAssignmentOpen} />}
      <ActivityEditor
        key={editorKey}
        open={editorOpen}
        setOpen={setEditorOpen}
        initial={form}
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
