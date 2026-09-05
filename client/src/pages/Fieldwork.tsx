import { useEffect, useMemo, useState } from "react";
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
import { formatDate } from "@/lib/format";
import { trpc } from "@/lib/trpc";
import { CalendarDays, MapPin, Pencil, Plus, Search, UsersRound } from "lucide-react";
import { toast } from "sonner";

const categories = [
  "visita a estaleiro",
  "coleta de fonte primária",
  "entrevista estruturada",
  "apresentação de relatório",
  "apresentação para equipe",
  "audiência pública",
] as const;

type FieldworkForm = {
  id?: number;
  code: string;
  title: string;
  description: string;
  category: (typeof categories)[number];
  country: string;
  location: string;
  relatedActivityId: string;
  responsibleId: string;
  groupId: string;
  startDate: string;
  dueDate: string;
  status: "pendente" | "em andamento" | "concluído" | "atrasado";
};

const blankForm: FieldworkForm = {
  code: "",
  title: "",
  description: "",
  category: "visita a estaleiro",
  country: "",
  location: "",
  relatedActivityId: "",
  responsibleId: "",
  groupId: "",
  startDate: "",
  dueDate: "",
  status: "pendente",
};

function inputDate(value: number | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function timestampAtNoon(value: string) {
  return Date.parse(`${value}T12:00:00.000Z`);
}

function FieldworkEditor({
  open,
  setOpen,
  form,
  setForm,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  form: FieldworkForm;
  setForm: (value: FieldworkForm) => void;
}) {
  const utils = trpc.useUtils();
  const { data: options } = trpc.fieldwork.options.useQuery(undefined, { enabled: open });
  const create = trpc.fieldwork.create.useMutation();
  const update = trpc.fieldwork.update.useMutation();
  const busy = create.isPending || update.isPending;

  const save = async () => {
    if (!form.code.trim() || !form.title.trim() || !form.description.trim()) {
      toast.error("Informe código, título e descrição.");
      return;
    }
    const startAt = form.startDate ? timestampAtNoon(form.startDate) : null;
    const dueAt = form.dueDate ? timestampAtNoon(form.dueDate) : null;
    if (startAt && dueAt && startAt > dueAt) {
      toast.error("A data inicial não pode ser posterior à data de término.");
      return;
    }
    const payload = {
      code: form.code.trim().toUpperCase(),
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      country: form.country.trim() || null,
      location: form.location.trim() || null,
      relatedActivityId: form.relatedActivityId ? Number(form.relatedActivityId) : null,
      responsibleId: form.responsibleId ? Number(form.responsibleId) : null,
      groupId: form.groupId ? Number(form.groupId) : null,
      startAt,
      dueAt,
      status: form.status,
    };
    try {
      if (form.id) await update.mutateAsync({ id: form.id, ...payload });
      else await create.mutateAsync(payload);
      await utils.fieldwork.list.invalidate();
      toast.success(form.id ? "Atividade atualizada." : "Atividade registrada.");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  };

  const selectedGroup = form.groupId ? Number(form.groupId) : null;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[94vh] overflow-y-auto bg-card sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-semibold tracking-[-.03em]">
            {form.id ? "Atualização de atividade" : "Nova atividade de campo ou divulgação"}
          </DialogTitle>
          <DialogDescription>
            Registre visitas, coleta de dados, entrevistas e atividades de apresentação vinculadas à execução do estudo.
          </DialogDescription>
        </DialogHeader>
        {!options ? <p className="py-10 text-sm text-muted-foreground">Carregando opções.</p> : (
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <div><Label>Código</Label><Input className="mt-2" value={form.code} onChange={event => setForm({ ...form, code: event.target.value })} placeholder="CAMPO-07" /></div>
            <div><Label>Categoria</Label><Select value={form.category} onValueChange={value => setForm({ ...form, category: value as FieldworkForm["category"] })}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{categories.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
            <div className="md:col-span-2"><Label>Título</Label><Input className="mt-2" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></div>
            <div className="md:col-span-2"><Label>Descrição</Label><Textarea className="mt-2 min-h-28" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} /></div>
            <div><Label>País</Label><Input className="mt-2" value={form.country} onChange={event => setForm({ ...form, country: event.target.value })} placeholder="Brasil" /></div>
            <div><Label>Local</Label><Input className="mt-2" value={form.location} onChange={event => setForm({ ...form, location: event.target.value })} placeholder="Cidade, instituição ou estaleiro" /></div>
            <div><Label>Item do plano relacionado</Label><Select value={form.relatedActivityId || "nenhum"} onValueChange={value => setForm({ ...form, relatedActivityId: value === "nenhum" ? "" : value })}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="nenhum">Sem vínculo direto</SelectItem>{options.activities.map(item => <SelectItem key={item.id} value={String(item.id)}>{item.planCode ?? "—"} · {item.title}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Grupo</Label><Select value={form.groupId || "nenhum"} onValueChange={value => setForm({ ...form, groupId: value === "nenhum" ? "" : value, responsibleId: "" })}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="nenhum">A definir</SelectItem>{options.groups.map(item => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Responsável</Label><Select value={form.responsibleId || "nenhum"} onValueChange={value => setForm({ ...form, responsibleId: value === "nenhum" ? "" : value })}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="nenhum">A definir</SelectItem>{options.members.filter(item => !selectedGroup || item.groupId === selectedGroup).map(item => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Status</Label><Select value={form.status} onValueChange={value => setForm({ ...form, status: value as FieldworkForm["status"] })}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="em andamento">Em andamento</SelectItem><SelectItem value="concluído">Concluído</SelectItem><SelectItem value="atrasado">Atrasado</SelectItem></SelectContent></Select></div>
            <div><Label>Data inicial</Label><Input type="date" className="mt-2" value={form.startDate} onChange={event => setForm({ ...form, startDate: event.target.value })} /></div>
            <div><Label>Data de término</Label><Input type="date" className="mt-2" value={form.dueDate} onChange={event => setForm({ ...form, dueDate: event.target.value })} /></div>
          </div>
        )}
        {options?.canManage ? <Button className="mt-6 w-full" disabled={busy} onClick={save}>{busy ? "Salvando…" : "Salvar atividade"}</Button> : null}
      </DialogContent>
    </Dialog>
  );
}

export default function FieldworkPage() {
  const { data, isLoading } = trpc.fieldwork.list.useQuery();
  const { data: options } = trpc.fieldwork.options.useQuery();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("todas");
  const [status, setStatus] = useState("todos");
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<FieldworkForm>(blankForm);
  const filtered = useMemo(() => (data ?? []).filter(item => {
    const text = `${item.code} ${item.title} ${item.description} ${item.country ?? ""} ${item.groupName ?? ""}`.toLowerCase();
    return text.includes(search.toLowerCase()) && (category === "todas" || item.category === category) && (status === "todos" || item.status === status);
  }), [category, data, search, status]);
  if (isLoading || !data) return <PageLoading />;
  const edit = (item: typeof data[number]) => {
    setForm({ id: item.id, code: item.code, title: item.title, description: item.description, category: item.category, country: item.country ?? "", location: item.location ?? "", relatedActivityId: item.relatedActivityId ? String(item.relatedActivityId) : "", responsibleId: item.responsibleId ? String(item.responsibleId) : "", groupId: item.groupId ? String(item.groupId) : "", startDate: inputDate(item.startAt), dueDate: inputDate(item.dueAt), status: item.status });
    setEditorOpen(true);
  };
  return <div className="space-y-7">
    <PageHeader eyebrow="Fontes primárias e divulgação" title="Atividades de campo e divulgação" description="Planejamento e acompanhamento de visitas técnicas, coleta de evidências, entrevistas estruturadas e atividades de apresentação do estudo." index="08 — Campo e divulgação" action={options?.canManage ? <Button onClick={() => { setForm(blankForm); setEditorOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Nova atividade</Button> : undefined} />
    <section className="technical-panel grid gap-3 p-4 lg:grid-cols-[1fr_240px_200px]"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-10" value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar código, país, atividade ou grupo" /></div><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todas">Todas as categorias</SelectItem>{categories.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos os status</SelectItem><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="em andamento">Em andamento</SelectItem><SelectItem value="concluído">Concluído</SelectItem><SelectItem value="atrasado">Atrasado</SelectItem></SelectContent></Select></section>
    <section className="hidden overflow-hidden rounded-md border bg-card lg:block"><div className="grid grid-cols-[100px_minmax(280px,1.5fr)_170px_190px_150px_110px] border-b bg-muted/45"><div className="data-label px-4 py-3">Código</div><div className="data-label border-l px-4 py-3">Atividade</div><div className="data-label border-l px-4 py-3">Vínculo</div><div className="data-label border-l px-4 py-3">Grupo e responsável</div><div className="data-label border-l px-4 py-3">Período</div><div className="data-label border-l px-4 py-3">Estado</div></div>{filtered.map(item => <div key={item.id} className="grid grid-cols-[100px_minmax(280px,1.5fr)_170px_190px_150px_110px] border-b last:border-b-0"><div className="px-4 py-4"><SectionMark code={item.code} /></div><div className="border-l px-4 py-4"><p className="font-semibold">{item.title}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p></div><div className="border-l px-4 py-4 text-xs"><p>{item.relatedPlanCode ?? "Sem item"}</p><p className="mt-1 line-clamp-2 text-muted-foreground">{item.relatedActivityTitle ?? ""}</p></div><div className="border-l px-4 py-4 text-xs"><p>{item.groupName ?? "A definir"}</p><p className="mt-1 text-muted-foreground">{item.responsibleName ?? "Sem responsável"}</p></div><div className="border-l px-4 py-4 text-xs"><p>{item.startAt ? formatDate(item.startAt) : "Início a definir"}</p><p className="mt-1 text-muted-foreground">{item.dueAt ? formatDate(item.dueAt) : "Término a definir"}</p></div><div className="flex items-center gap-2 border-l px-4 py-4"><StatusBadge status={item.status} />{options?.canManage ? <Button aria-label={`Editar ${item.title}`} variant="ghost" size="icon" onClick={() => edit(item)}><Pencil className="h-4 w-4" /></Button> : null}</div></div>)}{!filtered.length ? <p className="p-12 text-center text-sm text-muted-foreground">Nenhuma atividade corresponde aos filtros.</p> : null}</section>
    <section className="space-y-3 lg:hidden">{filtered.map(item => <article key={item.id} className="technical-panel p-4"><div className="flex items-start justify-between gap-3"><div><SectionMark code={item.code} /><h2 className="mt-3 text-sm font-semibold">{item.title}</h2><p className="mt-2 text-xs leading-5 text-muted-foreground">{item.description}</p></div><StatusBadge status={item.status} /></div><div className="mt-4 grid grid-cols-2 gap-3 border-y py-3 text-xs"><div><p className="data-label">Vínculo</p><p className="mt-1">{item.relatedPlanCode ?? "A definir"}</p></div><div><p className="data-label">Local</p><p className="mt-1">{item.country ?? item.location ?? "A definir"}</p></div><div><p className="data-label">Grupo</p><p className="mt-1">{item.groupName ?? "A definir"}</p></div><div><p className="data-label">Período</p><p className="mt-1">{item.startAt ? formatDate(item.startAt) : "Início a definir"}</p></div></div>{options?.canManage ? <Button className="mt-3 w-full" variant="outline" onClick={() => edit(item)}><Pencil className="mr-2 h-4 w-4" /> Editar</Button> : null}</article>)}{!filtered.length ? <p className="technical-panel p-10 text-center text-sm text-muted-foreground">Nenhuma atividade corresponde aos filtros.</p> : null}</section>
    <FieldworkEditor open={editorOpen} setOpen={setEditorOpen} form={form} setForm={setForm} />
  </div>;
}
