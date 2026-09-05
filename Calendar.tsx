import { useEffect, useMemo, useRef, useState } from "react";
import ActivityAccessGate from "@/components/ActivityAccessGate";
import {
  PageHeader,
  PageLoading,
  SectionMark,
  StatusBadge,
} from "@/components/EditorialUI";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { dueTone, formatDate } from "@/lib/format";
import { groupDisplayName } from "../../../shared/groupDisplay";
import { STUDY_TOMES, studyTomeFromCode } from "@shared/domain";
import { PDF_ANALYTIC_SECTIONS } from "@shared/pdfAnalyticIndex";
import {
  CalendarClock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  ExternalLink,
  Eye,
  FileDown,
  Filter,
  Flag,
  ImageDown,
  Layers,
  ListTodo,
  Plus,
  RefreshCcw,
  Route,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

const DAY = 24 * 60 * 60 * 1000;
const TIMELINE_GRID_LAYOUT = "grid-cols-[76px_minmax(280px,1.4fr)_135px_minmax(460px,1.9fr)]";

type TimelinePeriod = {
  start: number;
  end: number;
};

type MilestoneDraft = {
  id?: number;
  title: string;
  description: string;
  dueDate: string;
  status: "planejado" | "concluído";
};

function inputDate(value: number | null | undefined) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function timestampAtNoon(value: string) {
  return Date.parse(`${value}T12:00:00.000Z`);
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

function periodLabel(period: TimelinePeriod) {
  const formatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
  return `${formatter.format(new Date(period.start))} — ${formatter.format(new Date(period.end))}`;
}

/** Divide a linha do tempo em janelas mensais contínuas a partir do início do intervalo exibido. */
function timelinePeriods(rangeStart: number, rangeEnd: number): TimelinePeriod[] {
  const periods: TimelinePeriod[] = [];
  let periodStart = rangeStart;

  while (periodStart <= rangeEnd) {
    const start = new Date(periodStart);
    const nextPeriodStart = Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth() + 1,
      start.getUTCDate(),
      start.getUTCHours(),
      start.getUTCMinutes(),
      start.getUTCSeconds(),
      start.getUTCMilliseconds()
    );
    periods.push({ start: periodStart, end: Math.min(nextPeriodStart - 1, rangeEnd) });
    if (nextPeriodStart > rangeEnd) break;
    periodStart = nextPeriodStart;
  }

  return periods;
}

function statusColor(status: string) {
  if (status === "atrasado") return "bg-[#B44232]";
  if (status === "concluído") return "bg-[#27745B]";
  if (status === "em andamento") return "bg-[#2D6E79]";
  return "bg-[#7B8A87]";
}

function TimelineRow({
  item,
  rangeStart,
  rangeEnd,
  periodGridTemplate,
  hasOverlap,
  hasNearDue,
  onSchedule,
}: {
  item: {
    id: number;
    planCode: string | null;
    sectionCode: string;
    title: string;
    groupName: string | null;
    responsibleName: string;
    startAt: number | null;
    dueAt: number;
    progress: number;
    status: "pendente" | "em andamento" | "concluído" | "atrasado";
    milestones: Array<{
      id: number;
      title: string;
      dueAt: number;
      status: "planejado" | "concluído";
    }>;
  };
  rangeStart: number;
  rangeEnd: number;
  periodGridTemplate: string;
  hasOverlap: boolean;
  hasNearDue: boolean;
  onSchedule: (id: number) => void;
}) {
  const rangeDuration = Math.max(rangeEnd - rangeStart, 1);
  const periodStart = item.startAt ?? item.dueAt;
  const itemStart = Math.max(periodStart, rangeStart);
  const itemEnd = Math.min(item.dueAt, rangeEnd);
  const visible = itemEnd >= rangeStart && itemStart <= rangeEnd;
  const left = Math.max(0, ((itemStart - rangeStart) / rangeDuration) * 100);
  const width = item.startAt
    ? Math.max(1.2, (Math.max(itemEnd - itemStart, DAY) / rangeDuration) * 100)
    : 1.2;
  const milestone = !item.startAt;
  const itemMilestones = item.milestones ?? [];
  const overdue = dueTone(item.dueAt, item.status) === "danger";
  const barColor = overdue
    ? "bg-[#B44232]"
    : hasOverlap
      ? "bg-[#B8791C]"
      : hasNearDue
        ? "bg-[#A95D22]"
        : statusColor(item.status);

  return (
    <div
      className={`grid min-w-[1040px] ${TIMELINE_GRID_LAYOUT} border-b border-border/50 bg-background/50 hover:bg-muted/30 transition-colors last:border-b-0 items-center`}
    >
      {/* Coluna 1: Código / Identificador */}
      <div className="flex items-center justify-center border-r border-border/50 px-2.5 py-1.5">
        <SectionMark code={item.planCode ?? item.sectionCode} />
      </div>

      {/* Coluna 2: Título Clicável & Responsável */}
      <div className="border-r border-border/50 px-3.5 py-1.5 min-w-0">
        <a
          href={`/atividades?ficha=${item.id}`}
          className="font-semibold text-xs text-foreground hover:text-primary hover:underline transition-colors line-clamp-1 inline-flex items-center gap-1.5 group max-w-full"
          title={`Abrir ficha em Atividades: ${item.title}`}
        >
          <span className="truncate">{item.title}</span>
          <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </a>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
          {item.groupName ? groupDisplayName(item.groupName) : "Grupo não informado"} · {item.responsibleName}
        </p>
      </div>

      {/* Coluna 3: Estado & Barra de Progresso */}
      <div className="border-r border-border/50 px-3 py-1.5 flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <StatusBadge status={item.status} />
        </div>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full ${
                item.status === "concluído"
                  ? "bg-[#27745B]"
                  : item.status === "atrasado"
                  ? "bg-[#B44232]"
                  : "bg-primary"
              }`}
              style={{ width: `${item.progress}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground shrink-0">{item.progress}%</span>
        </div>
      </div>

      {/* Coluna 4: Barra Temporal M1–M6 */}
      <div className="relative h-11 flex items-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 grid"
          style={{ gridTemplateColumns: periodGridTemplate }}
        >
          {periodGridTemplate.split(" ").map((_, index) => (
            <div key={index} className={index ? "border-l border-border/40" : ""} />
          ))}
        </div>

        {visible ? (
          <button
            type="button"
            onClick={() => onSchedule(item.id)}
            aria-label={`Definir período de ${item.title}`}
            title={`Clique para ajustar o período: ${
              milestone
                ? `Marco em ${formatDate(item.dueAt)}`
                : `${formatDate(item.startAt!)} a ${formatDate(item.dueAt)}`
            }`}
            className={`absolute z-10 top-3 h-4 rounded-sm ${barColor} shadow-sm transition-all hover:opacity-90 hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              milestone ? "w-3 -translate-x-1/2" : ""
            } ${hasOverlap ? "ring-2 ring-[#E5B64A] ring-offset-1" : ""}`}
            style={{ left: `${left}%`, width: milestone ? undefined : `${width}%` }}
          >
            <span className="sr-only">
              {milestone
                ? `Marco de entrega em ${formatDate(item.dueAt)}`
                : `Período de ${formatDate(item.startAt!)} a ${formatDate(item.dueAt)}`}
            </span>
          </button>
        ) : null}

        {itemMilestones.map(milestoneItem => {
          const visibleMilestone =
            milestoneItem.dueAt >= rangeStart && milestoneItem.dueAt <= rangeEnd;
          if (!visibleMilestone) return null;
          const milestoneLeft = Math.max(0, ((milestoneItem.dueAt - rangeStart) / rangeDuration) * 100);
          return (
            <button
              key={milestoneItem.id}
              type="button"
              onClick={() => onSchedule(item.id)}
              aria-label={`Editar marco ${milestoneItem.title} de ${item.title}`}
              title={`${milestoneItem.title} — ${formatDate(milestoneItem.dueAt)}`}
              className={`absolute top-[14px] z-20 h-3.5 w-3.5 -translate-x-1/2 rotate-45 border-2 border-card ${
                milestoneItem.status === "concluído" ? "bg-[#27745B]" : "bg-[#163C40]"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-transform hover:scale-125`}
              style={{ left: `${milestoneLeft}%` }}
            >
              <span className="sr-only">Marco {milestoneItem.title}</span>
            </button>
          );
        })}

        {milestone ? (
          <span className="absolute bottom-0.5 left-3 text-[9px] text-muted-foreground/80">
            início a definir · término {formatDate(item.dueAt)}
          </span>
        ) : null}

        {overdue || hasOverlap || hasNearDue ? (
          <span className="absolute bottom-0.5 right-3 flex items-center gap-1 text-[9px] font-medium text-muted-foreground">
            <AlertTriangle
              className={`h-2.5 w-2.5 ${
                overdue ? "text-[#B44232]" : hasOverlap ? "text-[#B8791C]" : "text-[#A95D22]"
              }`}
            />
            {overdue ? "atrasado" : hasOverlap ? "sobreposição" : "prazo próximo"}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ScheduleDialog({
  activityId,
  onOpenChange,
}: {
  activityId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const detail = trpc.activities.detail.useQuery(
    { id: activityId ?? 0 },
    { enabled: activityId !== null }
  );
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([]);
  const [executorId, setExecutorId] = useState("");
  const [leadershipNote, setLeadershipNote] = useState("");

  useEffect(() => {
    if (detail.data) {
      setStartDate(inputDate(detail.data.startAt));
      setDueDate(inputDate(detail.data.dueAt));
      setExecutorId(
        String(
          detail.data.allocations.find(allocation => allocation.isExecutionLead)?.teamMemberId ?? ""
        )
      );
      setLeadershipNote("");
      setMilestones(
        (detail.data.milestones ?? []).map(milestone => ({
          id: milestone.id,
          title: milestone.title,
          description: milestone.description ?? "",
          dueDate: inputDate(milestone.dueAt),
          status: milestone.status,
        }))
      );
    }
  }, [detail.data]);

  const updateSchedule = trpc.activities.updateSchedule.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.activities.list.invalidate(),
        utils.activities.detail.invalidate(),
        utils.dashboard.overview.invalidate(),
      ]);
      toast.success("Período atualizado.");
      onOpenChange(false);
    },
    onError: error => toast.error(error.message),
  });
  const updateMilestones = trpc.activities.updateMilestones.useMutation({
    onError: error => toast.error(error.message),
  });
  const updateAllocations = trpc.activities.updateAllocations.useMutation({
    onError: error => toast.error(error.message),
  });

  const save = () => {
    if (!activityId || !dueDate) return;
    const startAt = startDate ? timestampAtNoon(startDate) : null;
    const dueAt = timestampAtNoon(dueDate);
    if (startAt && startAt > dueAt) {
      toast.error("A data inicial não pode ser posterior à data de término.");
      return;
    }
    if (milestones.some(milestone => !milestone.title.trim() || !milestone.dueDate)) {
      toast.error("Informe título e data para cada marco intermediário.");
      return;
    }
    if (
      milestones.some(milestone => {
        const milestoneAt = timestampAtNoon(milestone.dueDate);
        return milestoneAt > dueAt || (startAt !== null && milestoneAt < startAt);
      })
    ) {
      toast.error("Os marcos devem ficar dentro do período da atividade.");
      return;
    }
    const currentLeadId = item?.allocations.find(allocation => allocation.isExecutionLead)?.teamMemberId;
    const nextLeadId = executorId ? Number(executorId) : undefined;
    if (currentLeadId && nextLeadId && currentLeadId !== nextLeadId && leadershipNote.trim().length < 10) {
      toast.error("Informe uma justificativa de pelo menos 10 caracteres para transferir a liderança.");
      return;
    }
    void (async () => {
      try {
        await updateSchedule.mutateAsync({ id: activityId, startAt, dueAt });
        await updateMilestones.mutateAsync({
          id: activityId,
          milestones: milestones.map((milestone, index) => ({
            id: milestone.id,
            title: milestone.title.trim(),
            description: milestone.description.trim() || null,
            dueAt: timestampAtNoon(milestone.dueDate),
            status: milestone.status,
            sortOrder: index,
          })),
        });
        if (nextLeadId && item) {
          const existing = item.allocations.find(allocation => allocation.teamMemberId === nextLeadId);
          const allocations = [
            ...item.allocations.filter(allocation => allocation.teamMemberId !== nextLeadId),
            {
              teamMemberId: nextLeadId,
              allocatedHours: existing?.allocatedHours ?? 1,
              responsibility: existing?.responsibility ?? "Execução da etapa",
              isExecutionLead: true,
            },
          ].map(allocation => ({
            teamMemberId: allocation.teamMemberId,
            allocatedHours: allocation.allocatedHours,
            responsibility: allocation.responsibility ?? "Execução da etapa",
            isExecutionLead: allocation.teamMemberId === nextLeadId,
          }));
          await updateAllocations.mutateAsync({
            id: activityId,
            allocations,
            leadershipChangeJustification: leadershipNote.trim() || undefined,
          });
        }
        await Promise.all([
          utils.activities.list.invalidate(),
          utils.activities.detail.invalidate(),
          utils.dashboard.overview.invalidate(),
        ]);
        toast.success("Período e marcos atualizados.");
        onOpenChange(false);
      } catch {
        // As mutações já comunicam o erro pertinente.
      }
    })();
  };

  const item = detail.data;
  return (
    <Dialog open={activityId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-semibold tracking-tight">
            Definição de período
          </DialogTitle>
          <DialogDescription>
            {item ? `${item.planCode ?? item.sectionCode} — ${item.title}` : "Carregando atividade."}
          </DialogDescription>
        </DialogHeader>
        {detail.isLoading || !item ? (
          <p className="py-8 text-sm text-muted-foreground">Carregando dados do item.</p>
        ) : (
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div>
              <Label htmlFor="schedule-start">Data inicial</Label>
              <Input
                id="schedule-start"
                className="mt-1.5 rounded-md h-9"
                type="date"
                value={startDate}
                disabled={!item.canManageAllocations}
                onChange={event => setStartDate(event.target.value)}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Opcional. Sem data inicial, o item é exibido como marco de entrega.
              </p>
            </div>
            <div>
              <Label htmlFor="schedule-due">Data de término</Label>
              <Input
                id="schedule-due"
                className="mt-1.5 rounded-md h-9"
                type="date"
                value={dueDate}
                disabled={!item.canManageAllocations}
                onChange={event => setDueDate(event.target.value)}
              />
            </div>
            <div className="sm:col-span-2 border-t pt-4">
              <Label>Responsável de execução</Label>
              <Select
                value={executorId || "nenhum"}
                disabled={!item.canManageAllocations}
                onValueChange={value => setExecutorId(value === "nenhum" ? "" : value)}
              >
                <SelectTrigger className="mt-1.5 h-9">
                  <SelectValue placeholder="Atribuição pendente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhum">Manter atribuição pendente</SelectItem>
                  {item.eligibleParticipants.map(member => (
                    <SelectItem key={member.id} value={String(member.id)}>
                      {member.name} · {member.currentAllocatedHours}h / {member.currentActivityCount}{" "}
                      atividades
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {item.allocations.find(allocation => allocation.isExecutionLead)?.teamMemberId &&
              executorId &&
              Number(executorId) !==
                item.allocations.find(allocation => allocation.isExecutionLead)?.teamMemberId ? (
                <Textarea
                  className="mt-2.5 min-h-16 text-xs"
                  value={leadershipNote}
                  onChange={event => setLeadershipNote(event.target.value)}
                  placeholder="Justificativa obrigatória para a mudança de liderança"
                />
              ) : null}
              <p className="mt-1 text-[11px] text-muted-foreground">
                Atribuição rápida da etapa. A coordenação formal da atividade-mãe é preservada.
              </p>
            </div>
            <section className="border-t pt-4 sm:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label>Marcos intermediários</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Registre entregas parciais ou validações dentro do período.
                  </p>
                </div>
                {item.canManageAllocations ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() =>
                      setMilestones([
                        ...milestones,
                        {
                          title: "",
                          description: "",
                          dueDate: dueDate || inputDate(item.dueAt),
                          status: "planejado",
                        },
                      ])
                    }
                  >
                    <Plus className="mr-1 h-3 w-3" /> Adicionar marco
                  </Button>
                ) : null}
              </div>
              <div className="mt-3 space-y-2.5">
                {milestones.map((milestone, index) => (
                  <div
                    key={milestone.id ?? `novo-${index}`}
                    className="grid gap-2 rounded-md border bg-muted/20 p-2.5 sm:grid-cols-[1.2fr_140px_140px_auto]"
                  >
                    <Input
                      aria-label={`Título do marco ${index + 1}`}
                      disabled={!item.canManageAllocations}
                      value={milestone.title}
                      placeholder="Marco de controle"
                      className="h-8 text-xs"
                      onChange={event =>
                        setMilestones(
                          milestones.map((current, currentIndex) =>
                            currentIndex === index ? { ...current, title: event.target.value } : current
                          )
                        )
                      }
                    />
                    <Input
                      aria-label={`Data do marco ${index + 1}`}
                      disabled={!item.canManageAllocations}
                      type="date"
                      value={milestone.dueDate}
                      className="h-8 text-xs"
                      onChange={event =>
                        setMilestones(
                          milestones.map((current, currentIndex) =>
                            currentIndex === index ? { ...current, dueDate: event.target.value } : current
                          )
                        )
                      }
                    />
                    <Select
                      disabled={!item.canManageAllocations}
                      value={milestone.status}
                      onValueChange={value =>
                        setMilestones(
                          milestones.map((current, currentIndex) =>
                            currentIndex === index
                              ? { ...current, status: value as MilestoneDraft["status"] }
                              : current
                          )
                        )
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planejado">Planejado</SelectItem>
                        <SelectItem value="concluído">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                    {item.canManageAllocations ? (
                      <Button
                        type="button"
                        aria-label={`Excluir marco ${index + 1}`}
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() =>
                          setMilestones(milestones.filter((_, currentIndex) => currentIndex !== index))
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
                ))}
                {!milestones.length ? (
                  <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                    Nenhum marco intermediário registrado.
                  </p>
                ) : null}
              </div>
            </section>
            {!item.canManageAllocations ? (
              <p className="border-l-2 border-primary pl-3 text-xs leading-5 text-muted-foreground sm:col-span-2">
                Somente o coordenador designado ou um administrador pode alterar este período.
              </p>
            ) : null}
          </div>
        )}
        <DialogFooter className="gap-2 sm:justify-between">
          <a
            href={`/atividades?ficha=${activityId ?? ""}`}
            className="inline-flex h-9 items-center text-xs font-semibold text-primary underline-offset-4 hover:underline"
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" /> Abrir ficha em Atividades
          </a>
          {item?.canManageAllocations ? (
            <Button
              onClick={save}
              disabled={updateSchedule.isPending || updateMilestones.isPending || !dueDate}
              className="rounded-md h-9"
            >
              {updateSchedule.isPending || updateMilestones.isPending
                ? "Salvando…"
                : "Salvar período e marcos"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Diálogo detalhado exibindo os entregáveis planejados para um determinado mês (M1 a M6) */
function MonthDeliverablesDialog({
  monthIndex,
  period,
  items,
  onOpenChange,
  onSelectActivity,
}: {
  monthIndex: number | null;
  period: TimelinePeriod | null;
  items: Array<{
    id: number;
    planCode: string | null;
    sectionCode: string;
    title: string;
    groupName: string | null;
    responsibleName: string;
    startAt: number | null;
    dueAt: number;
    progress: number;
    status: "pendente" | "em andamento" | "concluído" | "atrasado";
    parentActivityId: number | null;
  }>;
  onOpenChange: (open: boolean) => void;
  onSelectActivity: (id: number) => void;
}) {
  if (monthIndex === null || !period) return null;

  const monthDeliverables = items.filter(
    item => item.dueAt >= period.start && item.dueAt <= period.end
  );

  const completed = monthDeliverables.filter(i => i.status === "concluído").length;
  const inProgress = monthDeliverables.filter(i => i.status === "em andamento").length;
  const overdue = monthDeliverables.filter(i => i.status === "atrasado").length;
  const pending = monthDeliverables.filter(i => i.status === "pendente").length;

  return (
    <Dialog open={monthIndex !== null} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary text-primary-foreground">
              M{monthIndex + 1}
            </span>
            <DialogTitle className="font-display text-xl font-semibold">
              Entregáveis Planejados — {monthLabel(new Date(period.start))}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Período: <strong>{periodLabel(period)}</strong> · Total de{" "}
            <strong>{monthDeliverables.length}</strong> entregáveis com conclusão neste mês.
          </DialogDescription>

          {/* Badges de Resumo */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Badge variant="outline" className="text-[11px] font-mono">
              {monthDeliverables.length} entregáveis
            </Badge>
            <Badge className="bg-[#27745B] text-[11px] font-mono">
              {completed} concluídos
            </Badge>
            <Badge className="bg-[#2D6E79] text-[11px] font-mono">
              {inProgress} em andamento
            </Badge>
            {overdue > 0 && (
              <Badge className="bg-[#B44232] text-[11px] font-mono">
                {overdue} atrasados
              </Badge>
            )}
            {pending > 0 && (
              <Badge variant="secondary" className="text-[11px] font-mono">
                {pending} pendentes
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Lista Rolável de Entregáveis */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
          {monthDeliverables.map(item => (
            <div
              key={item.id}
              className="p-3 rounded-md border bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <SectionMark code={item.planCode ?? item.sectionCode} />
                  <a
                    href={`/atividades?ficha=${item.id}`}
                    className="font-semibold text-xs text-foreground hover:text-primary hover:underline line-clamp-1 inline-flex items-center gap-1 group"
                  >
                    <span className="truncate">{item.title}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span>{item.groupName ? groupDisplayName(item.groupName) : "Grupo não informado"}</span>
                  <span>·</span>
                  <span>{item.responsibleName}</span>
                  <span>·</span>
                  <span className="font-mono font-medium text-foreground">
                    Prazo: {formatDate(item.dueAt)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <StatusBadge status={item.status} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => {
                    onOpenChange(false);
                    onSelectActivity(item.id);
                  }}
                >
                  <CalendarClock className="mr-1 h-3 w-3" /> Período
                </Button>
                <a
                  href={`/atividades?ficha=${item.id}`}
                  className="inline-flex h-7 items-center justify-center rounded-md border border-input bg-background px-2.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
                >
                  <Eye className="mr-1 h-3 w-3" /> Ficha
                </a>
              </div>
            </div>
          ))}

          {!monthDeliverables.length && (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Nenhum entregável principal ou etapa com término previsto para este mês.
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CalendarContent() {
  const { data, isLoading } = trpc.activities.list.useQuery();
  const { data: overview } = trpc.dashboard.overview.useQuery();
  const [tome, setTome] = useState("todos");
  const [group, setGroup] = useState("todos");
  const [functionalResponsible, setFunctionalResponsible] = useState("todos");
  const [status, setStatus] = useState("todos");
  const [periodScope, setPeriodScope] = useState("todos");
  const [startFilter, setStartFilter] = useState("");
  const [endFilter, setEndFilter] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState<"image" | "pdf" | null>(null);

  // Month dialog state
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);

  // Show / Hide filter controls panel
  const [showFilters, setShowFilters] = useState(false);

  // Expanded sections state: ALL COMPACT / COLLAPSED BY DEFAULT
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const projectStart = overview?.settings.projectStartAt
    ? new Date(overview.settings.projectStartAt).getTime()
    : Date.UTC(2026, 7, 1);
  const projectEnd = overview?.settings.projectEndAt
    ? new Date(overview.settings.projectEndAt).getTime()
    : Date.UTC(2027, 1, 1);
  const rangeStart = startFilter ? timestampAtNoon(startFilter) : projectStart;
  const rangeEnd = endFilter ? timestampAtNoon(endFilter) : projectEnd;
  const safeRangeEnd = Math.max(rangeStart + DAY, rangeEnd);

  const groups = useMemo(() => {
    if (!data) return [];
    return Array.from(
      new Set(
        data
          .map(item => item.groupName)
          .filter((value): value is string => Boolean(value))
      )
    );
  }, [data]);

  const functionalResponsibles = useMemo(() => {
    if (!data) return [];
    return Array.from(
      new Set(
        data
          .map(item => item.planningResponsible)
          .filter((value): value is string => Boolean(value))
      )
    );
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter(item => {
      const itemTome = studyTomeFromCode(item.sectionCode);
      const itemStart = item.startAt ?? item.dueAt;
      const overlapsRange = item.dueAt >= rangeStart && itemStart <= safeRangeEnd;
      return (
        (tome === "todos" || itemTome === tome) &&
        (group === "todos" || item.groupName === group) &&
        (functionalResponsible === "todos" || item.planningResponsible === functionalResponsible) &&
        (status === "todos" || item.status === status) &&
        (periodScope !== "sem_periodo" || (item.parentActivityId !== null && !item.startAt)) &&
        overlapsRange
      );
    });
  }, [data, tome, group, functionalResponsible, status, periodScope, rangeStart, safeRangeEnd]);

  // Group filtered items by Section
  const sectionGroups = useMemo(() => {
    const groupMap = new Map<
      string,
      {
        sectionCode: string;
        sectionTitle: string;
        tome: string;
        groupName: string | null;
        items: typeof filtered;
        sortOrder: number;
      }
    >();

    filtered.forEach(item => {
      const code = item.sectionCode;
      const def = PDF_ANALYTIC_SECTIONS.find(s => s.code === code);
      const tomeName = def?.tome || studyTomeFromCode(code);
      const title = def?.title || (item.parentActivityId === null ? item.title : `Seção ${code}`);
      const sortOrder = def?.sortOrder ?? 999;

      if (!groupMap.has(code)) {
        groupMap.set(code, {
          sectionCode: code,
          sectionTitle: title,
          tome: tomeName,
          groupName: item.groupName,
          items: [],
          sortOrder,
        });
      }
      groupMap.get(code)!.items.push(item);
    });

    return Array.from(groupMap.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [filtered]);

  const periods = useMemo(() => {
    return timelinePeriods(rangeStart, safeRangeEnd);
  }, [rangeStart, safeRangeEnd]);

  const totalRangeDuration = Math.max(safeRangeEnd - rangeStart + 1, 1);
  const periodGridTemplate = periods
    .map(period => `${((period.end - period.start + 1) / totalRangeDuration) * 100}%`)
    .join(" ");

  const noStart = filtered.filter(item => !item.startAt).length;
  const overdue = filtered.filter(item => dueTone(item.dueAt, item.status) === "danger").length;
  const nearDueIds = useMemo(() => {
    return new Set(
      filtered
        .filter(
          item => item.status !== "concluído" && item.dueAt >= Date.now() && item.dueAt - Date.now() <= 7 * DAY
        )
        .map(item => item.id)
    );
  }, [filtered]);

  const overlapIds = useMemo(() => {
    const ids = new Set<number>();
    const byGroup = new Map<string, typeof filtered>();
    filtered
      .filter(item => item.startAt)
      .forEach(item => {
        const key = item.groupName ?? "Grupo não informado";
        byGroup.set(key, [...(byGroup.get(key) ?? []), item]);
      });
    byGroup.forEach(items => {
      items.forEach((item, index) => {
        items.slice(index + 1).forEach(other => {
          if (
            (item.startAt ?? item.dueAt) <= other.dueAt &&
            (other.startAt ?? other.dueAt) <= item.dueAt
          ) {
            ids.add(item.id);
            ids.add(other.id);
          }
        });
      });
    });
    return ids;
  }, [filtered]);

  const monthlyDeliverables = useMemo(() => {
    return periods.map(
      period =>
        filtered.filter(
          item =>
            item.parentActivityId === null && item.dueAt >= period.start && item.dueAt <= period.end
        ).length
    );
  }, [periods, filtered]);

  const transverseItems = useMemo(() => {
    if (!data) return [];
    return data.filter(
      item =>
        /portal|banco de dados|sumário executivo/i.test(item.title) &&
        item.dueAt >= Date.UTC(2027, 0, 1)
    );
  }, [data]);

  // Section expand / collapse helpers: COMPACTED BY DEFAULT (false)
  const isSectionExpanded = (code: string) => {
    return Boolean(expandedSections[code]);
  };

  const toggleSection = (code: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  const expandAll = () => {
    const updated: Record<string, boolean> = {};
    sectionGroups.forEach(g => {
      updated[g.sectionCode] = true;
    });
    setExpandedSections(updated);
    toast.success("Todas as seções foram expandidas.");
  };

  const collapseAll = () => {
    setExpandedSections({});
    toast.success("Todas as seções foram compactadas.");
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (tome !== "todos") count++;
    if (group !== "todos") count++;
    if (functionalResponsible !== "todos") count++;
    if (status !== "todos") count++;
    if (periodScope !== "todos") count++;
    if (startFilter) count++;
    if (endFilter) count++;
    return count;
  }, [tome, group, functionalResponsible, status, periodScope, startFilter, endFilter]);

  const clearAllFilters = () => {
    setTome("todos");
    setGroup("todos");
    setFunctionalResponsible("todos");
    setStatus("todos");
    setPeriodScope("todos");
    setStartFilter("");
    setEndFilter("");
  };

  const exportTimeline = async (format: "image" | "pdf") => {
    if (!timelineRef.current) return;
    setExporting(format);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(timelineRef.current, {
        backgroundColor: "#f8f8f5",
        scale: 2,
        useCORS: true,
      });
      const filename = `cronograma-itens-${new Date().toISOString().slice(0, 10)}`;
      if (format === "image") {
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `${filename}.png`;
        link.click();
      } else {
        const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
        const width = 792 - 48;
        const height = (canvas.height * width) / canvas.width;
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 24, 24, width, Math.min(height, 564));
        pdf.save(`${filename}.pdf`);
      }
      toast.success(
        format === "image" ? "Imagem do cronograma exportada." : "PDF do cronograma exportado."
      );
    } catch {
      toast.error("Não foi possível exportar o cronograma.");
    } finally {
      setExporting(null);
    }
  };

  if (isLoading || !data || !overview) return <PageLoading />;

  return (
    <div className="space-y-3">
      {/* Cabeçalho Formal e Ações */}
      <PageHeader
        eyebrow="03 — Cronograma"
        title="Execução por item"
        description="Acompanhamento temporal por seções, capítulos e entregáveis mensais do estudo."
        index="M1–M6"
        action={
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {/* Alternar Expandir / Compactar Listas */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={expandAll}
              className="h-8 text-xs font-medium"
              title="Expandir todas as seções e sub-itens"
            >
              <ChevronsUpDown className="mr-1 h-3.5 w-3.5 text-primary" />
              Expandir Tudo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={collapseAll}
              className="h-8 text-xs font-medium"
              title="Compactar todas as seções (apresentação recolhida)"
            >
              <ChevronsDownUp className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
              Compactar Tudo
            </Button>

            {/* Botão de Filtros com Contador */}
            <Button
              type="button"
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-8 text-xs font-medium gap-1.5"
              title="Exibir ou ocultar filtros de pesquisa"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="ml-0.5 rounded-full bg-primary-foreground text-primary px-1.5 py-0.2 text-[10px] font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </Button>

            <div className="h-4 w-[1px] bg-border/60 mx-0.5 hidden sm:block" />

            {/* Exportação */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs px-2.5"
              onClick={() => exportTimeline("image")}
              disabled={exporting !== null}
            >
              <ImageDown className="mr-1 h-3.5 w-3.5" />
              {exporting === "image" ? "…" : "Imagem"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs px-2.5"
              onClick={() => exportTimeline("pdf")}
              disabled={exporting !== null}
            >
              <FileDown className="mr-1 h-3.5 w-3.5" />
              {exporting === "pdf" ? "…" : "PDF"}
            </Button>
          </div>
        }
      />

      {/* Painel de Filtros Ultra-Compacto e Recolhível */}
      {showFilters && (
        <section className="technical-panel p-3 bg-card border rounded-md shadow-xs animate-in fade-in-50 duration-150">
          <div className="flex items-center justify-between gap-2 border-b pb-2 mb-2.5">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-primary" />
              Filtragem do Cronograma
            </p>
            {activeFiltersCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-6 text-[11px] text-muted-foreground hover:text-foreground px-2"
              >
                <X className="mr-1 h-3 w-3" /> Limpar filtros
              </Button>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
            <Select value={tome} onValueChange={setTome}>
              <SelectTrigger className="h-8 rounded-md text-xs">
                <SelectValue placeholder="Todos os Tomos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Tomos</SelectItem>
                {STUDY_TOMES.map(item => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={group} onValueChange={setGroup}>
              <SelectTrigger className="h-8 rounded-md text-xs">
                <SelectValue placeholder="Todos os grupos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os grupos</SelectItem>
                {groups.map(item => (
                  <SelectItem key={item} value={item}>
                    {groupDisplayName(item)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={functionalResponsible} onValueChange={setFunctionalResponsible}>
              <SelectTrigger className="h-8 rounded-md text-xs">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os responsáveis</SelectItem>
                {functionalResponsibles.map(item => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 rounded-md text-xs">
                <SelectValue placeholder="Todos os estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os estados</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em andamento">Em andamento</SelectItem>
                <SelectItem value="concluído">Concluído</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={periodScope} onValueChange={setPeriodScope}>
              <SelectTrigger className="h-8 rounded-md text-xs">
                <SelectValue placeholder="Escopo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os períodos</SelectItem>
                <SelectItem value="sem_periodo">Sem início oficial</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              aria-label="Início do intervalo"
              className="h-8 rounded-md text-xs"
              value={startFilter}
              onChange={event => setStartFilter(event.target.value)}
            />

            <div className="flex gap-1.5">
              <Input
                type="date"
                aria-label="Término do intervalo"
                className="h-8 rounded-md text-xs"
                value={endFilter}
                onChange={event => setEndFilter(event.target.value)}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md shrink-0"
                aria-label="Restaurar intervalo do projeto"
                onClick={() => {
                  setStartFilter("");
                  setEndFilter("");
                }}
              >
                <RefreshCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Barra de Status Compacta e Alertas */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="rounded-sm font-mono text-[10px] h-5.5">
            {sectionGroups.length} seções
          </Badge>
          <Badge variant="outline" className="rounded-sm font-mono text-[10px] h-5.5">
            {filtered.length} itens
          </Badge>
          {noStart > 0 && (
            <Badge variant="outline" className="rounded-sm font-mono text-[10px] h-5.5">
              {noStart} sem início
            </Badge>
          )}
          {overdue > 0 && (
            <Badge className="rounded-sm bg-[#B44232] font-mono text-[10px] h-5.5">
              {overdue} atrasados
            </Badge>
          )}
          {overlapIds.size > 0 && (
            <Badge className="rounded-sm bg-[#B8791C] font-mono text-[10px] h-5.5">
              {overlapIds.size} sobrepostos
            </Badge>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground hidden sm:block">
          💡 Clique nos meses <strong>M1 a M6</strong> no cabeçalho para ver os entregáveis planejados de cada mês.
        </p>
      </div>

      {/* Grid Principal do Cronograma Alinhado, Compacto & com Meses Clicáveis */}
      <div ref={timelineRef} className="bg-[#f8f8f5] dark:bg-card/40 rounded-lg">
        <section className="hidden overflow-hidden rounded-md border bg-card lg:block shadow-xs">
          {/* Cabeçalho da Tabela Alinhado às Colunas com Colunas de Meses Interativas */}
          <div
            className={`grid min-w-[1040px] ${TIMELINE_GRID_LAYOUT} border-b bg-muted/70 text-foreground items-stretch`}
          >
            <div className="data-label border-r border-border/60 px-3 py-2 text-center font-bold flex items-center justify-center">
              Item
            </div>
            <div className="data-label border-r border-border/60 px-4 py-2 font-bold flex items-center">
              Título da Atividade e Equipe
            </div>
            <div className="data-label border-r border-border/60 px-3 py-2 font-bold flex items-center">
              Estado e Progresso
            </div>

            {/* Meses Clicáveis */}
            <div className="grid" style={{ gridTemplateColumns: periodGridTemplate }}>
              {periods.map((period, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedMonthIndex(index)}
                  aria-label={`M${index + 1}: ${periodLabel(period)}`}
                  title={`Clique para ver os entregáveis planejados para M${index + 1} (${monthLabel(new Date(period.start))})`}
                  className="border-r border-border/60 px-2 py-1.5 text-center last:border-r-0 hover:bg-primary/10 hover:border-primary/40 transition-colors cursor-pointer group flex flex-col justify-center select-none"
                >
                  <div className="flex items-center justify-center gap-1">
                    <p className="data-label text-primary font-bold text-[10px] group-hover:underline">
                      M{index + 1}
                    </p>
                    <ListTodo className="h-2.5 w-2.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs font-semibold leading-tight">{monthLabel(new Date(period.start))}</p>
                  <p className="font-mono text-[9px] text-muted-foreground">{periodLabel(period)}</p>
                  <p
                    className="font-mono text-[9px] text-primary font-semibold mt-0.5"
                  >
                    {monthlyDeliverables[index]} {monthlyDeliverables[index] === 1 ? "entregável" : "entregáveis"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Seções com Acordeão (Tudo Compactado por Padrão) */}
          <div className="max-h-[75vh] overflow-y-auto overflow-x-auto divide-y divide-border/60">
            {sectionGroups.map(section => {
              const expanded = isSectionExpanded(section.sectionCode);
              const completedCount = section.items.filter(i => i.status === "concluído").length;
              const delayedCount = section.items.filter(i => i.status === "atrasado").length;
              const avgProgress = Math.round(
                section.items.reduce((acc, i) => acc + i.progress, 0) / Math.max(1, section.items.length)
              );

              return (
                <div key={section.sectionCode} className="divide-y divide-border/40">
                  {/* Cabeçalho da Seção / Capítulo Compacto */}
                  <div
                    onClick={() => toggleSection(section.sectionCode)}
                    className="flex items-center justify-between gap-3 bg-muted/40 hover:bg-muted/70 px-3.5 py-2 cursor-pointer transition-colors select-none sticky top-0 z-20 backdrop-blur-sm border-y border-border/60"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 shrink-0 p-0 text-muted-foreground hover:text-foreground"
                        aria-label={expanded ? `Recolher seção ${section.sectionCode}` : `Expandir seção ${section.sectionCode}`}
                      >
                        {expanded ? (
                          <ChevronDown className="h-3.5 w-3.5 transition-transform text-primary" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 transition-transform" />
                        )}
                      </Button>

                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-xs font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                          {section.sectionCode}
                        </span>
                        <h3 className="font-semibold text-xs text-foreground truncate">
                          {section.sectionTitle}
                        </h3>
                      </div>

                      <Badge variant="outline" className="text-[9px] h-4.5 font-normal px-1.5 shrink-0 hidden sm:inline-flex">
                        {section.tome}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="hidden md:flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="font-mono font-medium text-foreground">
                          {section.items.length} {section.items.length === 1 ? "item" : "itens"}
                        </span>
                        <span>·</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                          {completedCount} concluídos
                        </span>
                        {delayedCount > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-red-700 dark:text-red-400 font-medium">
                              {delayedCount} atrasados
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 w-24">
                        <div className="h-1.5 flex-1 rounded-full bg-muted-foreground/20 overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${avgProgress}%` }}
                          />
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                          {avgProgress}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sub-itens da Seção (renderizados apenas quando expandido) */}
                  {expanded && (
                    <div className="divide-y divide-border/40 bg-background">
                      {section.items.map(item => (
                        <TimelineRow
                          key={item.id}
                          item={item}
                          rangeStart={rangeStart}
                          rangeEnd={safeRangeEnd}
                          periodGridTemplate={periodGridTemplate}
                          hasOverlap={overlapIds.has(item.id)}
                          hasNearDue={nearDueIds.has(item.id)}
                          onSchedule={setSelectedId}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {!filtered.length && (
              <p className="p-10 text-center text-xs text-muted-foreground">
                Nenhum item corresponde aos filtros selecionados.
              </p>
            )}
          </div>
        </section>

        {/* Visualização Responsiva Mobile */}
        <section className="space-y-3 lg:hidden">
          {/* Seletor Rápido de Meses em Mobile */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {periods.map((period, index) => (
              <Button
                key={index}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedMonthIndex(index)}
                className="h-8 text-xs shrink-0 px-2.5 font-medium"
              >
                M{index + 1}: {monthlyDeliverables[index]} entregáveis
              </Button>
            ))}
          </div>

          {sectionGroups.map(section => {
            const expanded = isSectionExpanded(section.sectionCode);

            return (
              <div key={section.sectionCode} className="technical-panel overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection(section.sectionCode)}
                  className="flex w-full items-center justify-between border-b bg-muted/30 p-3 text-left font-medium"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs font-bold text-primary">
                      {section.sectionCode}
                    </span>
                    <span className="text-xs font-semibold truncate">{section.sectionTitle}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[9px]">
                      {section.items.length} itens
                    </Badge>
                    {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </div>
                </button>

                {expanded && (
                  <div className="p-2.5 space-y-2.5">
                    {section.items.map(item => (
                      <article
                        key={item.id}
                        className={`rounded-md border border-l-4 p-3 bg-card ${
                          dueTone(item.dueAt, item.status) === "danger"
                            ? "border-l-[#B44232]"
                            : overlapIds.has(item.id)
                            ? "border-l-[#B8791C]"
                            : nearDueIds.has(item.id)
                            ? "border-l-[#A95D22]"
                            : "border-l-primary"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <SectionMark code={item.planCode ?? item.sectionCode} />
                            <a
                              href={`/atividades?ficha=${item.id}`}
                              className="mt-1.5 block text-xs font-semibold leading-snug text-foreground hover:text-primary hover:underline"
                            >
                              {item.title}
                            </a>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {item.groupName ? groupDisplayName(item.groupName) : "Grupo não informado"} ·{" "}
                              {item.responsibleName}
                            </p>
                          </div>
                          <StatusBadge status={item.status} />
                        </div>

                        <div className="mt-2.5 grid grid-cols-2 gap-2 border-y py-1.5 text-[11px]">
                          <div>
                            <p className="data-label text-muted-foreground">Início</p>
                            <p className="font-medium">
                              {item.startAt ? formatDate(item.startAt) : "A definir"}
                            </p>
                          </div>
                          <div>
                            <p className="data-label text-muted-foreground">Término</p>
                            <p className="font-medium">{formatDate(item.dueAt)}</p>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {item.progress}% concluído
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs rounded-md"
                            onClick={() => setSelectedId(item.id)}
                          >
                            <CalendarClock className="mr-1 h-3 w-3" /> Período
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {!filtered.length && (
            <div className="technical-panel p-8 text-center text-xs text-muted-foreground">
              Nenhum item corresponde aos filtros selecionados.
            </div>
          )}
        </section>
      </div>

      {/* Diálogo do Mês Selecionado (Entregáveis Planejados) */}
      <MonthDeliverablesDialog
        monthIndex={selectedMonthIndex}
        period={selectedMonthIndex !== null && periods[selectedMonthIndex] ? periods[selectedMonthIndex] : null}
        items={filtered}
        onOpenChange={open => !open && setSelectedMonthIndex(null)}
        onSelectActivity={id => {
          setSelectedMonthIndex(null);
          setSelectedId(id);
        }}
      />

      {/* Diálogo de Edição de Período e Marcos */}
      <ScheduleDialog activityId={selectedId} onOpenChange={open => !open && setSelectedId(null)} />
    </div>
  );
}

export default function CalendarPage() {
  return (
    <ActivityAccessGate>
      <CalendarContent />
    </ActivityAccessGate>
  );
}
