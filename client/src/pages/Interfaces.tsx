import { useMemo, useState } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";
import { InterfacesAccessGate } from "@/components/InterfacesAccessGate";
import {
  EmptyEditorial,
  PageHeader,
  PageLoading,
  SectionMark,
  StatusBadge,
} from "@/components/EditorialUI";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { formatDate, initials } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { groupDisplayName } from "../../../shared/groupDisplay";
import {
  CalendarDays,
  CheckCircle2,
  Eye,
  Filter,
  GitMerge,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

type InterfaceItem = inferRouterOutputs<AppRouter>["interfaces"]["list"][number];
type InterfaceType = "interface" | "escopo sobreposto" | "dependência";
type InterfacePriority = "baixa" | "média" | "alta" | "crítica";
type InterfaceStatus = "identificada" | "em discussão" | "encaminhada" | "resolvida";
type InterfaceBlockingClass = "prioritária" | "não prioritária";

type InterfaceForm = {
  id?: number;
  title: string;
  description: string;
  interfaceType: InterfaceType;
  responsibleId: string;
  priority: InterfacePriority;
  blockingClass: InterfaceBlockingClass;
  status: InterfaceStatus;
  dueDate: string;
  resolution: string;
  sectionIds: number[];
  groupIds: number[];
  activityIds: number[];
};

const emptyForm: InterfaceForm = {
  title: "",
  description: "",
  interfaceType: "interface",
  responsibleId: "",
  priority: "média",
  blockingClass: "não prioritária",
  status: "identificada",
  dueDate: "",
  resolution: "",
  sectionIds: [],
  groupIds: [],
  activityIds: [],
};

function toggleId(current: number[], id: number, checked: boolean) {
  return checked
    ? Array.from(new Set([...current, id]))
    : current.filter(item => item !== id);
}

function representsSameSection(
  section: { code: string; title: string },
  activity: { planCode: string | null; title: string }
) {
  const sameCode = activity.planCode?.trim() === section.code.trim();
  const sameTitle = activity.title.trim().toLocaleLowerCase("pt-BR") === section.title.trim().toLocaleLowerCase("pt-BR");
  return sameCode || sameTitle;
}

function isInterfaceBlocked(item: Pick<InterfaceItem, "status" | "blockingClass">) {
  return item.status !== "resolvida" && item.blockingClass === "prioritária";
}

function InterfaceDetail({
  item,
  open,
  setOpen,
  onEdit,
}: {
  item: InterfaceItem | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  onEdit: (item: InterfaceItem) => void;
}) {
  const [comment, setComment] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceActivityId, setEvidenceActivityId] = useState("nenhuma");
  const addComment = trpc.interfaces.addComment.useMutation();
  const preAnalyze = trpc.interfaces.preAnalyze.useMutation();
  const uploadEvidence = trpc.interfaces.uploadEvidence.useMutation();
  const utils = trpc.useUtils();

  if (!item) return null;
  const specificPlanItems = item.activities.filter(activity =>
    !item.sections.some(section => representsSameSection(section, activity))
  );

  const saveComment = async () => {
    if (!comment.trim()) return;
    try {
      await addComment.mutateAsync({ interfaceId: item.id, content: comment });
      setComment("");
      await utils.interfaces.list.invalidate();
      toast.success("Comentário incluído no histórico da interface.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível comentar."
      );
    }
  };

  const runPreAnalysis = async () => {
    try {
      await preAnalyze.mutateAsync({ interfaceId: item.id });
      await utils.interfaces.list.invalidate();
      toast.success("Pré-análise concluída. Os achados requerem deliberação humana.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível executar a pré-análise.");
    }
  };

  const sendEvidence = async () => {
    if (!evidenceFile) {
      toast.error("Selecione um arquivo para anexar.");
      return;
    }
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
        reader.readAsDataURL(evidenceFile);
      });
      await uploadEvidence.mutateAsync({
        interfaceId: item.id,
        activityId: evidenceActivityId === "nenhuma" ? null : Number(evidenceActivityId),
        file: { fileName: evidenceFile.name, mimeType: evidenceFile.type || "application/octet-stream", fileSize: evidenceFile.size, base64 },
      });
      setEvidenceFile(null);
      setEvidenceActivityId("nenhuma");
      await utils.interfaces.list.invalidate();
      toast.success("Evidência vinculada à interface.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a evidência.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[94vh] overflow-y-auto bg-card sm:max-w-6xl">
        <DialogHeader className="border-b paper-rule pb-6 text-left">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={item.status} />
            <span className="editorial-kicker text-primary">{item.interfaceType}</span>
            <span className="editorial-kicker text-muted-foreground">
              Prioridade {item.priority}
            </span>
          </div>
          <DialogTitle className="font-display mt-3 text-3xl font-semibold tracking-[-.03em] md:text-4xl">
            {item.title}
          </DialogTitle>
          <DialogDescription className="font-editorial mt-3 max-w-4xl text-lg leading-relaxed text-foreground/70">
            {item.description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
          <div className="space-y-8">
            <section className="grid gap-5 sm:grid-cols-2">
              <div className="border-y paper-rule py-4">
                <p className="editorial-kicker text-muted-foreground">Responsável</p>
                <p className="font-editorial mt-2 text-xl font-semibold">
                  {item.responsibleName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {groupDisplayName(item.responsibleGroupName)}
                </p>
              </div>
              <div className="border-y paper-rule py-4">
                <p className="editorial-kicker text-muted-foreground">Prazo</p>
                <p className="font-editorial mt-2 text-xl">
                  {item.dueAt ? formatDate(item.dueAt) : "Sem prazo definido"}
                </p>
              </div>
            </section>

            <section>
              <p className="editorial-kicker text-primary">Capítulos e fichas relacionadas</p>
              <div className="mt-4 grid gap-px bg-foreground/20 sm:grid-cols-2">
                {item.sections.map(section => {
                  const activity = item.activities.find(candidate => representsSameSection(section, candidate));
                  const content = <><SectionMark code={section.code} /><div className="min-w-0"><p className="font-editorial font-semibold">{section.title}</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-muted-foreground">{section.role}{activity ? " · abrir ficha" : ""}</p></div></>;
                  return activity ? <a key={section.id} href={`/atividades?ficha=${activity.activityId}`} className="flex items-center gap-3 bg-background p-4 hover:bg-muted/35">{content}</a> : <div key={section.id} className="flex items-center gap-3 bg-background p-4">{content}</div>;
                })}
              </div>
            </section>

            {specificPlanItems.length ? (
              <section>
                <p className="editorial-kicker text-primary">Itens específicos vinculados</p>
                <div className="mt-4 divide-y border-y">
                  {specificPlanItems.map(activity => (
                    <a
                      key={activity.id}
                      href={`/atividades?ficha=${activity.activityId}`}
                      className="flex items-center gap-3 py-3 text-sm hover:text-primary"
                    >
                      <SectionMark code={activity.planCode ?? String(activity.activityId)} />
                      <span className="min-w-0 flex-1 font-medium">{activity.title}</span>
                      <span className="text-[10px] uppercase tracking-[.1em] text-muted-foreground">{activity.role}</span>
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            <section>
              <p className="editorial-kicker flex items-center gap-2 text-primary">
                <UsersRound className="h-4 w-4" /> Grupos envolvidos
              </p>
              <div className="mt-4 divide-y paper-rule border-y paper-rule">
                {item.groups.map(group => (
                  <div key={group.id} className="flex items-center justify-between gap-3 py-4">
                    <p className="font-editorial text-lg font-semibold" title={group.name}>{groupDisplayName(group.name)}</p>
                    <span className="text-[10px] font-semibold uppercase tracking-[.12em] text-muted-foreground">{group.role}</span>
                  </div>
                ))}
              </div>
            </section>

            {item.resolution && (
              <section className="border-l-4 border-[#3c5a43] bg-card/60 p-5">
                <p className="editorial-kicker text-[#3c5a43]">Solução registrada</p>
                <p className="font-editorial mt-3 text-xl leading-relaxed">{item.resolution}</p>
              </section>
            )}

            <section>
              <div className="flex items-center justify-between border-b paper-rule pb-3">
                <p className="editorial-kicker text-primary">Evidências para pré-análise</p>
                <span className="font-editorial text-xl">{item.evidenceFiles.length}</span>
              </div>
              {item.evidenceFiles.length ? (
                <div className="divide-y paper-rule">
                  {item.evidenceFiles.map(file => (
                    <a key={file.id} href={file.storageUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 py-3 text-sm hover:text-primary">
                      <span className="min-w-0 truncate font-medium">{file.fileName}</span>
                      <span className="text-[10px] uppercase tracking-[.1em] text-muted-foreground">{file.uploadedBy}</span>
                    </a>
                  ))}
                </div>
              ) : <p className="py-5 text-sm text-muted-foreground">Anexe os materiais dos capítulos envolvidos para comparar conceitos, dados e escopo.</p>}
              {item.permissions.canUploadEvidence && (
                <div className="mt-4 grid gap-3 border-t paper-rule pt-4 sm:grid-cols-[1fr_220px_auto]">
                  <Input type="file" onChange={event => setEvidenceFile(event.target.files?.[0] ?? null)} />
                  <Select value={evidenceActivityId} onValueChange={setEvidenceActivityId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nenhuma">Sem atividade específica</SelectItem>
                      {item.activities.map(activity => (
                        <SelectItem key={activity.activityId} value={String(activity.activityId)}>
                          {activity.planCode ?? activity.activityId} · {activity.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={sendEvidence} disabled={uploadEvidence.isPending}>Anexar evidência</Button>
                </div>
              )}
              {item.permissions.canManage && (
                <Button variant="outline" className="mt-4" disabled={preAnalyze.isPending || item.evidenceFiles.length < 2} onClick={runPreAnalysis}>
                  Pré-analisar inconsistências por IA
                </Button>
              )}
              {item.aiAnalyses.length > 0 && (
                <div className="mt-5 border-l-4 border-primary bg-card/55 p-4">
                  <p className="editorial-kicker text-primary">Última pré-análise</p>
                  <pre className="mt-3 whitespace-pre-wrap font-sans text-xs leading-relaxed text-foreground/80">{item.aiAnalyses[0].resultJson ?? item.aiAnalyses[0].errorMessage}</pre>
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between border-b paper-rule pb-3">
                <p className="editorial-kicker text-primary">Histórico auditável</p>
                <span className="font-editorial text-xl">{item.events.length}</span>
              </div>
              <div className="divide-y paper-rule">
                {item.events.map(event => (
                  <div key={event.id} className="grid gap-2 py-4 sm:grid-cols-[140px_1fr]">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[.1em]">{event.eventType}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(event.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm leading-relaxed">{event.summary}</p>
                      <p className="mt-1 text-xs text-muted-foreground">por {event.actorName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="border-l-0 paper-rule lg:border-l lg:pl-8">
            <div className="flex items-center justify-between border-b paper-rule pb-3">
              <p className="editorial-kicker flex items-center gap-2 text-primary">
                <MessageSquare className="h-4 w-4" /> Discussão entre grupos
              </p>
              <span className="font-editorial text-xl">{item.comments.length}</span>
            </div>
            <div className="mt-4 space-y-5">
              {item.comments.map(commentItem => (
                <div key={commentItem.id} className="border-b paper-rule pb-5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 rounded-none">
                      <AvatarFallback className="rounded-none text-xs">
                        {initials(commentItem.authorName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{commentItem.authorName}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDate(commentItem.createdAt)}</p>
                    </div>
                  </div>
                  <p className="font-editorial mt-3 text-lg leading-relaxed">{commentItem.content}</p>
                </div>
              ))}
              {!item.comments.length && (
                <p className="py-8 text-sm text-muted-foreground">A discussão ainda não foi iniciada.</p>
              )}
            </div>
            {item.permissions.canManage && (
              <div className="mt-6 border-t-2 border-foreground pt-5">
                <Label>Registrar encaminhamento</Label>
                <Textarea
                  value={comment}
                  onChange={event => setComment(event.target.value)}
                  placeholder="Registre decisões, dependências ou próximos passos."
                  className="mt-2 min-h-28 rounded-none"
                />
                <Button
                  onClick={saveComment}
                  disabled={addComment.isPending}
                  className="mt-3 w-full"
                >
                  <MessageSquare className="mr-2 h-4 w-4" /> Comentar
                </Button>
              </div>
            )}
            {item.permissions.canManage && (
              <Button
                variant="outline"
                onClick={() => onEdit(item)}
                className="mt-4 w-full"
              >
                <Pencil className="mr-2 h-4 w-4" /> Gerenciar interface
              </Button>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InterfaceEditor({
  open,
  setOpen,
  initial,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  initial: InterfaceForm;
}) {
  const { data: options, isLoading } = trpc.interfaces.options.useQuery(undefined, {
    enabled: open,
  });
  const [form, setForm] = useState(initial);
  const create = trpc.interfaces.create.useMutation();
  const update = trpc.interfaces.update.useMutation();
  const utils = trpc.useUtils();
  const busy = create.isPending || update.isPending;

  const save = async () => {
    if (!options) return;
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Informe título e descrição.");
      return;
    }
    if (form.sectionIds.length < 2 || form.groupIds.length < 2) {
      toast.error("Selecione ao menos duas seções e dois grupos envolvidos.");
      return;
    }
    if (!form.responsibleId) {
      toast.error("Selecione o responsável pela interface.");
      return;
    }
    if (form.status === "resolvida" && !form.resolution.trim()) {
      toast.error("Registre a solução antes de resolver a interface.");
      return;
    }
    const payload = {
      title: form.title,
      description: form.description,
      interfaceType: form.interfaceType,
      responsibleId: Number(form.responsibleId),
      priority: form.priority,
      blockingClass: form.blockingClass,
      status: form.status,
      dueAt: form.dueDate
        ? new Date(`${form.dueDate}T12:00:00`).getTime()
        : null,
      resolution: form.resolution.trim() || null,
      sectionIds: form.sectionIds,
      groupIds: form.groupIds,
      activityIds: form.activityIds,
    };
    try {
      if (form.id) await update.mutateAsync({ id: form.id, ...payload });
      else await create.mutateAsync(payload);
      await Promise.all([
        utils.interfaces.list.invalidate(),
        utils.activities.list.invalidate(),
        utils.activities.detail.invalidate(),
      ]);
      toast.success(form.id ? "Interface atualizada." : "Interface registrada.");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[94vh] overflow-y-auto bg-card sm:max-w-5xl">
        {isLoading || !options ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Carregando opções…</div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-3xl font-semibold tracking-[-.03em]">
                {form.id ? "Gerenciar interface" : "Nova interface"}
              </DialogTitle>
              <DialogDescription>
                Registro da sobreposição, dos grupos envolvidos e dos
                encaminhamentos associados.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Título</Label>
                <Input className="mt-2 rounded-none" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Descrição do ponto de interface</Label>
                <Textarea className="mt-2 min-h-28 rounded-none" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} />
              </div>
              <div>
                <Label>Natureza</Label>
                <Select value={form.interfaceType} onValueChange={value => setForm({ ...form, interfaceType: value as InterfaceType })}>
                  <SelectTrigger className="mt-2 w-full rounded-none"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interface">Interface</SelectItem>
                    <SelectItem value="escopo sobreposto">Escopo sobreposto</SelectItem>
                    <SelectItem value="dependência">Dependência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={value => setForm({ ...form, priority: value as InterfacePriority })}>
                  <SelectTrigger className="mt-2 w-full rounded-none"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="média">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="crítica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={value => setForm({ ...form, status: value as InterfaceStatus })}>
                  <SelectTrigger className="mt-2 w-full rounded-none"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="identificada">Identificada</SelectItem>
                    <SelectItem value="em discussão">Em discussão</SelectItem>
                    <SelectItem value="encaminhada">Encaminhada</SelectItem>
                    <SelectItem value="resolvida">Resolvida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Classificação de aprovação</Label>
                <Select value={form.blockingClass} onValueChange={value => setForm({ ...form, blockingClass: value as InterfaceBlockingClass })}>
                  <SelectTrigger className="mt-2 w-full rounded-none"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prioritária">Prioritária — bloqueia aprovações</SelectItem>
                    <SelectItem value="não prioritária">Não prioritária — não bloqueia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prazo de encaminhamento</Label>
                <Input type="date" className="mt-2 rounded-none" value={form.dueDate} onChange={event => setForm({ ...form, dueDate: event.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>Responsável pela interface</Label>
                <Select
                  value={form.responsibleId}
                  onValueChange={value => {
                    const coordinator = options.coordinators.find(item => item.id === Number(value));
                    setForm({
                      ...form,
                      responsibleId: value,
                      groupIds: coordinator?.groupId
                        ? Array.from(new Set([...form.groupIds, coordinator.groupId]))
                        : form.groupIds,
                    });
                  }}
                >
                  <SelectTrigger className="mt-2 w-full rounded-none"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {options.coordinators.filter(item => options.isAdmin || item.id === options.currentMember?.id).map(item => (
                      <SelectItem key={item.id} value={String(item.id)}>{item.name} — {groupDisplayName(item.groupName)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <section className="border-t-2 border-foreground pt-4">
                <p className="editorial-kicker text-primary">Seções envolvidas</p>
                <p className="mt-2 text-xs text-muted-foreground">A primeira seleção será registrada como origem.</p>
                <div className="mt-4 max-h-64 overflow-y-auto divide-y paper-rule border-y paper-rule pr-2">
                  {options.sections.map(section => (
                    <label key={section.id} className="flex cursor-pointer items-start gap-3 py-3">
                      <Checkbox
                        checked={form.sectionIds.includes(section.id)}
                        onCheckedChange={value => setForm({ ...form, sectionIds: toggleId(form.sectionIds, section.id, value === true) })}
                        className="mt-1 rounded-none"
                      />
                      <span className="min-w-0">
                        <span className="font-editorial block font-semibold">{section.code} — {section.title}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="border-t-2 border-foreground pt-4">
                <p className="editorial-kicker text-primary">Grupos envolvidos</p>
                <p className="mt-2 text-xs text-muted-foreground">Inclua todos os grupos que precisam pactuar a solução.</p>
                <div className="mt-4 max-h-64 overflow-y-auto divide-y paper-rule border-y paper-rule pr-2">
                  {options.groups.map(group => (
                    <label key={group.id} className="flex cursor-pointer items-start gap-3 py-3">
                      <Checkbox
                        checked={form.groupIds.includes(group.id)}
                        onCheckedChange={value => setForm({ ...form, groupIds: toggleId(form.groupIds, group.id, value === true) })}
                        className="mt-1 rounded-none"
                      />
                      <span className="min-w-0">
                        <span className="font-editorial block font-semibold" title={group.name}>{groupDisplayName(group.name)}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">{group.institution}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="border-t-2 border-foreground pt-4 md:col-span-2">
                <p className="editorial-kicker text-primary">Itens do plano relacionados</p>
                <p className="mt-2 text-xs text-muted-foreground">Selecione os itens que materializam esta interface. Eles devem pertencer às seções e grupos já selecionados.</p>
                <div className="mt-4 grid max-h-64 gap-1 overflow-y-auto border-y pr-2 sm:grid-cols-2">
                  {options.activities
                    .filter(item => form.sectionIds.includes(item.sectionId) && form.groupIds.includes(item.responsibleGroupId ?? -1))
                    .map(item => (
                      <label key={item.id} className="flex cursor-pointer items-start gap-3 border-b p-3 last:border-b-0">
                        <Checkbox
                          checked={form.activityIds.includes(item.id)}
                          onCheckedChange={value => setForm({ ...form, activityIds: toggleId(form.activityIds, item.id, value === true) })}
                          className="mt-1 rounded-none"
                        />
                        <span className="min-w-0 text-sm">
                          <span className="font-mono text-[10px] text-primary">{item.planCode ?? "SEM CÓDIGO"}</span>
                          <span className="mt-1 block font-medium leading-5">{item.title}</span>
                        </span>
                      </label>
                    ))}
                </div>
              </section>

              {form.status === "resolvida" && (
                <div className="md:col-span-2">
                  <Label>Solução pactuada</Label>
                  <Textarea
                    value={form.resolution}
                    onChange={event => setForm({ ...form, resolution: event.target.value })}
                    placeholder="Descreva a decisão, os limites de escopo e as responsabilidades acordadas."
                    className="mt-2 min-h-28 rounded-none"
                  />
                </div>
              )}
            </div>
            <Button onClick={save} disabled={busy} className="mt-6 w-full">
              {busy ? "Salvando…" : form.status === "resolvida" ? "Registrar solução" : "Salvar interface"}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InterfacesContent() {
  const { data, isLoading } = trpc.interfaces.list.useQuery();
  const { data: access } = trpc.administration.status.useQuery();
  const { data: options } = trpc.interfaces.options.useQuery(undefined, {
    enabled: Boolean(access?.isAdmin || access?.isCoordinator),
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [priority, setPriority] = useState("todas");
  const [sectionId, setSectionId] = useState("todas");
  const [groupId, setGroupId] = useState("todos");
  const [detailId, setDetailId] = useState<number | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [form, setForm] = useState<InterfaceForm>(emptyForm);

  const filtered = useMemo(
    () =>
      (data ?? []).filter(item => {
        const text = `${item.title} ${item.description} ${item.responsibleName} ${item.sections.map(section => `${section.code} ${section.title}`).join(" ")} ${item.groups.map(group => group.name).join(" ")} ${item.activities.map(activity => `${activity.planCode} ${activity.title}`).join(" ")}`.toLowerCase();
        return (
          text.includes(search.toLowerCase()) &&
          (status === "todos" || item.status === status) &&
          (priority === "todas" || item.priority === priority) &&
          (sectionId === "todas" || item.sections.some(section => section.sectionId === Number(sectionId))) &&
          (groupId === "todos" || item.groups.some(group => group.groupId === Number(groupId)))
        );
      }),
    [data, groupId, priority, search, sectionId, status]
  );

  if (isLoading || !data || !access) return <PageLoading />;
  const selected = data.find(item => item.id === detailId) ?? null;
  const canCreate = access.isAdmin || access.isCoordinator;
  const visibleSections = Array.from(
    new Map(data.flatMap(item => item.sections).map(section => [section.sectionId, section])).values()
  );
  const visibleGroups = Array.from(
    new Map(data.flatMap(item => item.groups).map(group => [group.groupId, group])).values()
  );
  const blockedCount = data.filter(isInterfaceBlocked).length;

  const createNew = () => {
    const responsibleId = options?.isAdmin
      ? ""
      : String(options?.currentMember?.id ?? "");
    const ownGroupId = options?.currentMember?.groupId;
    setForm({
      ...emptyForm,
      responsibleId,
      groupIds: ownGroupId ? [ownGroupId] : [],
    });
    setEditorKey(value => value + 1);
    setEditorOpen(true);
  };

  const edit = (item: InterfaceItem) => {
    setDetailId(null);
    setForm({
      id: item.id,
      title: item.title,
      description: item.description,
      interfaceType: item.interfaceType,
      responsibleId: String(item.responsibleId),
      priority: item.priority,
      blockingClass: item.blockingClass,
      status: item.status,
      dueDate: item.dueAt ? new Date(item.dueAt).toISOString().slice(0, 10) : "",
      resolution: item.resolution ?? "",
      sectionIds: item.sections.map(section => section.sectionId),
      groupIds: item.groups.map(group => group.groupId),
      activityIds: item.activities.map(activity => activity.activityId),
    });
    setEditorKey(value => value + 1);
    setEditorOpen(true);
  };

  const totalCount = data.length;
  const identifiedCount = data.filter(i => i.status === "identificada").length;
  const inDiscussionCount = data.filter(i => i.status === "em discussão").length;
  const forwardedCount = data.filter(i => i.status === "encaminhada").length;
  const resolvedCount = data.filter(i => i.status === "resolvida").length;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Coordenação entre grupos"
        title="Gestão de interfaces entre seções"
        description="Registro e acompanhamento de dependências e escopos sobrepostos mapeados no plano de trabalho, grupos envolvidos, encaminhamentos e resolução."
        index="07 — Interfaces"
        action={canCreate ? (
          <Button onClick={createNew} className="rounded-md">
            <Plus className="mr-2 h-4 w-4" /> Nova interface
          </Button>
        ) : undefined}
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total de Interfaces</p>
          <p className="font-display mt-2 text-3xl font-bold text-foreground">{totalCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Catalogadas na matriz de atividades</p>
        </div>
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-700 dark:text-blue-300">Identificadas no Plano</p>
          <p className="font-display mt-2 text-3xl font-bold text-blue-700 dark:text-blue-300">{identifiedCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Aguardando pactuação inicial</p>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-700 dark:text-amber-300">Em Discussão / Encaminhadas</p>
          <p className="font-display mt-2 text-3xl font-bold text-amber-700 dark:text-amber-300">{inDiscussionCount + forwardedCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">{inDiscussionCount} em debate · {forwardedCount} encaminhadas</p>
        </div>
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Resolvidas / Pactuadas</p>
          <p className="font-display mt-2 text-3xl font-bold text-emerald-700 dark:text-emerald-300">{resolvedCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">Escopos delimitados e acordados</p>
        </div>
      </div>

      {/* Quick Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-3">
        <Button
          variant={status === "todos" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatus("todos")}
          className="rounded-full"
        >
          Todas ({totalCount})
        </Button>
        <Button
          variant={status === "identificada" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatus("identificada")}
          className="rounded-full"
        >
          Identificadas ({identifiedCount})
        </Button>
        <Button
          variant={status === "em discussão" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatus("em discussão")}
          className="rounded-full"
        >
          Em Discussão ({inDiscussionCount})
        </Button>
        <Button
          variant={status === "encaminhada" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatus("encaminhada")}
          className="rounded-full"
        >
          Encaminhadas ({forwardedCount})
        </Button>
        <Button
          variant={status === "resolvida" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatus("resolvida")}
          className="rounded-full"
        >
          Resolvidas ({resolvedCount})
        </Button>
      </div>

      <div className="technical-panel grid gap-3 p-4 lg:grid-cols-[1fr_repeat(3,200px)]">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por título, capítulo, seção ou grupo (ex.: G7, G1, Fluvial...)" className="bg-background pl-10" />
        </div>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="bg-background"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as prioridades</SelectItem>
            <SelectItem value="baixa">Baixa</SelectItem>
            <SelectItem value="média">Média</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="crítica">Crítica</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sectionId} onValueChange={setSectionId}>
          <SelectTrigger className="bg-background"><SelectValue placeholder="Seções" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as seções</SelectItem>
            {visibleSections.map(section => <SelectItem key={section.sectionId} value={String(section.sectionId)}>{section.code} — {section.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={groupId} onValueChange={setGroupId}>
          <SelectTrigger className="bg-background"><SelectValue placeholder="Grupos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os grupos</SelectItem>
            {visibleGroups.map(group => <SelectItem key={group.groupId} value={String(group.groupId)}>{groupDisplayName(group.name)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {blockedCount > 0 && (
        <div className="border-l-4 border-[#B5482D] bg-[#B5482D]/10 px-4 py-3 text-sm text-[#7D2D1D]">
          <span className="font-semibold">{blockedCount} interface{blockedCount === 1 ? " bloqueada" : "s bloqueadas"}</span> requer{blockedCount === 1 ? " " : "em "}encaminhamento prioritário: prazo vencido ou discussão de prioridade alta/crítica.
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyEditorial title="Nenhuma interface encontrada" text="Registre a primeira dependência entre seções ou ajuste os filtros aplicados." />
      ) : (
        <div className="technical-panel overflow-hidden">
          <div className="data-label hidden grid-cols-[40px_minmax(0,1.4fr)_minmax(240px,.9fr)_180px_160px] gap-5 border-b bg-muted/55 px-4 py-3 lg:grid">
            <span>Nº</span><span>Interface, Capítulo e Seções</span><span>Grupos Envolvidos</span><span>Liderança / Origem</span><span className="text-right">Ações</span>
          </div>
          <div className="divide-y paper-rule">
            {filtered.map((item, index) => (
              <article key={item.id} className={`grid gap-4 px-4 py-4 hover:bg-muted/35 lg:grid-cols-[40px_minmax(0,1.4fr)_minmax(240px,.9fr)_180px_160px] lg:items-center ${isInterfaceBlocked(item) ? "border-l-4 border-[#B5482D] bg-[#B5482D]/5" : ""}`}>
                <span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.status} />
                    <span className="data-label text-primary">{item.priority}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{item.interfaceType}</span>
                    {isInterfaceBlocked(item) && <span className="data-label text-[#B5482D]">Bloqueada</span>}
                  </div>
                  <h2 className="mt-1.5 text-[15px] font-semibold leading-5 text-foreground">{item.title}</h2>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {item.sections.map(section => (
                      <span key={section.id} className="font-mono rounded border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        Capítulo {section.code} — {section.title}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="data-label lg:hidden">Grupos envolvidos</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 lg:mt-0">
                    {item.groups.map(group => {
                      const isLeader = group.role === "responsável";
                      return (
                        <span
                          key={group.id}
                          className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold ${
                            isLeader
                              ? "border border-amber-500/40 bg-amber-500/15 text-amber-950 dark:text-amber-200"
                              : "border border-sky-500/30 bg-sky-500/10 text-sky-950 dark:text-sky-200"
                          }`}
                          title={`${group.name} (${group.role})`}
                        >
                          {isLeader ? "👑" : "🔗"} {groupDisplayName(group.name)}
                          <span className="text-[10px] font-normal opacity-80">({group.role})</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="data-label lg:hidden">Responsável</p>
                  <p className="mt-1 text-sm font-medium lg:mt-0">{item.responsibleName}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{groupDisplayName(item.responsibleGroupName)}</p>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button variant="outline" size="sm" onClick={() => setDetailId(item.id)} className="rounded-md">
                    <Eye className="mr-1.5 h-3.5 w-3.5" /> Detalhes
                  </Button>
                  {item.permissions.canManage && (
                    <Button variant="ghost" size="icon" onClick={() => edit(item)} aria-label={`Editar ${item.title}`}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {item.status === "resolvida" && <CheckCircle2 className="h-5 w-5 self-center text-[#2F6B4F]" />}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      <InterfaceDetail item={selected} open={detailId !== null} setOpen={open => !open && setDetailId(null)} onEdit={edit} />
      {canCreate && (
        <InterfaceEditor key={editorKey} open={editorOpen} setOpen={setEditorOpen} initial={form} />
      )}
    </div>
  );
}

export default function InterfacesPage() {
  return (
    <InterfacesAccessGate>
      <InterfacesContent />
    </InterfacesAccessGate>
  );
}
