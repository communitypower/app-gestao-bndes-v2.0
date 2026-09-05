import { useMemo, useState } from "react";
import AdminGate from "@/components/AdminGate";
import { Metric, PageHeader, PageLoading } from "@/components/EditorialUI";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { formatDate, initials } from "@/lib/format";
import { groupDisplayName } from "./shared/groupDisplay";
import type { TeamGroupRole } from "@shared/domain";
import {
  Building2,
  BookMarked,
  ChevronDown,
  Crown,
  Mail,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  UserRound,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

type MemberForm = {
  id?: number;
  userId: string;
  name: string;
  title: string;
  institution: string;
  email: string;
  groupId: string;
  groupRole: TeamGroupRole;
  whatsappPhone: string;
  whatsappOptIn: boolean;
  active: boolean;
};

const emptyMember: MemberForm = {
  userId: "none",
  name: "",
  title: "",
  institution: "",
  email: "",
  groupId: "",
  groupRole: "participante",
  whatsappPhone: "",
  whatsappOptIn: false,
  active: true,
};

function TeamContent() {
  const { data, isLoading } = trpc.team.hierarchy.useQuery();
  const { data: access } = trpc.administration.status.useQuery();
  const utils = trpc.useUtils();
  const create = trpc.team.create.useMutation();
  const update = trpc.team.update.useMutation();
  const [search, setSearch] = useState("");
  const [openGroupIds, setOpenGroupIds] = useState<number[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MemberForm>(emptyMember);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data ?? [];
    return (data ?? []).filter(group => {
      const members = [group.coordinator, ...group.participants, ...group.kickoffParticipants].filter(Boolean);
      return (
        `${group.name} ${group.institution}`.toLowerCase().includes(term) ||
        members.some(member =>
          `${member?.name} ${member?.title} ${member?.institution} ${member?.email ?? ""}`
            .toLowerCase()
            .includes(term)
        )
      );
    });
  }, [data, search]);

  if (isLoading || !data) return <PageLoading />;

  type Member = NonNullable<(typeof data)[number]["coordinator"]>;
  const allMembers = Array.from(
    new Map(data.flatMap(group => group.kickoffParticipants.map(member => [member.id, member]))).values()
  );
  const coordinatorCount = data.filter(group => group.coordinator).length;
  const activeMembers = allMembers.filter(member => member.active).length;
  const deadlineStatus = (activity: { status: string; dueAt?: number | null }) => {
    const now = Date.now();
    const dueAt = activity.dueAt;
    if (typeof dueAt !== "number") return { label: "Atenção", className: "border-amber-300 bg-amber-50 text-amber-800" };
    if (activity.status === "atrasado" || (activity.status !== "concluído" && dueAt < now)) return { label: "Atrasada", className: "border-red-300 bg-red-50 text-red-800" };
    if (activity.status !== "concluído" && dueAt - now <= 14 * 24 * 60 * 60 * 1000) return { label: "Atenção", className: "border-amber-300 bg-amber-50 text-amber-800" };
    return { label: "Dentro do prazo", className: "border-emerald-300 bg-emerald-50 text-emerald-800" };
  };

  const openCreate = () => {
    const firstGroup = data.find(group => group.active);
    setForm({
      ...emptyMember,
      groupId: firstGroup ? String(firstGroup.id) : "",
      institution: firstGroup?.institution ?? "",
      email: "",
    });
    setOpen(true);
  };

  const openEdit = (member: Member) => {
    setForm({
      id: member.id,
      userId: member.userId ? String(member.userId) : "none",
      name: member.name,
      title: member.title,
      institution: member.institution,
      email: member.email ?? "",
      groupId: member.groupId ? String(member.groupId) : "",
      groupRole: member.groupRole,
      whatsappPhone: member.whatsappPhone ?? "",
      whatsappOptIn: member.whatsappOptIn,
      active: member.active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name || !form.title || !form.institution || !form.groupId) {
      toast.error("Preencha nome, função, instituição e grupo.");
      return;
    }
    const payload = {
      userId: form.userId === "none" ? null : Number(form.userId),
      name: form.name,
      title: form.title,
      institution: form.institution,
      email: form.email.trim() || null,
      groupId: Number(form.groupId),
      groupRole: form.groupRole,
      whatsappPhone: form.whatsappPhone || null,
      whatsappOptIn: form.whatsappOptIn,
      active: form.active,
    };
    try {
      if (form.id) await update.mutateAsync({ id: form.id, ...payload });
      else await create.mutateAsync(payload);
      await Promise.all([
        utils.team.hierarchy.invalidate(),
        utils.team.list.invalidate(),
        utils.activities.list.invalidate(),
        utils.administration.status.invalidate(),
      ]);
      toast.success("Estrutura da equipe atualizada.");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível salvar."
      );
    }
  };

  const isEditingCoordinator =
    Boolean(form.id) && form.groupRole === "coordenador";

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Organização da equipe"
        title="Estrutura de grupos e responsabilidades"
        description="Matriz funcional G1–G11 do Plano de Trabalho, com vínculos ativos, referências de composição e frentes atribuídas."
        index="04 — Equipe"
        action={access?.isAdmin ? (
          <Button
            onClick={openCreate}
            className="rounded-md"
          >
            <Plus className="mr-2 h-4 w-4" /> Incluir integrante
          </Button>
        ) : undefined}
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="Grupos" value={data.length} note="Matriz funcional G1–G11" />
        <Metric label="Coordenadores" value={coordinatorCount} note="Responsáveis pelas frentes" />
        <Metric label="Integrantes ativos" value={activeMembers} note="Coordenadores e participantes" accent />
      </section>

      <div className="technical-panel max-w-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Buscar grupo, participante ou instituição"
            className="bg-background pl-10"
          />
        </div>
      </div>

      <div className="space-y-5">
        {filtered.map((group, groupIndex) => {
          const isOpen = search.trim().length > 0 || openGroupIds.includes(group.id);
          return (
          <Collapsible
            key={group.id}
            open={isOpen}
            onOpenChange={open => setOpenGroupIds(current => open ? Array.from(new Set([...current, group.id])) : current.filter(id => id !== group.id))}
            className="technical-panel overflow-hidden"
          >
            <article>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="grid w-full gap-3 border-b bg-muted/30 px-5 py-4 text-left md:grid-cols-[44px_1fr_auto] md:items-center"
                aria-label={`${isOpen ? "Recolher" : "Expandir"} informações do grupo ${groupDisplayName(group.name)}`}
              >
              <span className="font-mono text-xs text-muted-foreground">
                {String(groupIndex + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="data-label text-primary">
                  Grupo participante
                </p>
                <h2 className="font-display mt-1 text-2xl font-semibold tracking-[-.025em]">
                  <span title={group.name}>{groupDisplayName(group.name)}</span>
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">Composição confirmada na reunião de kick-off</p>
              </div>
              <p className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" /> {group.institution}
                <span className="font-mono text-xs">{group.kickoffParticipants.length} participantes</span>
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </p>
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
            <div className="grid gap-5 p-5 lg:grid-cols-[minmax(280px,.8fr)_minmax(0,1.8fr)]">
              <section className="rounded-md border border-primary/20 border-l-4 border-l-primary bg-primary/5 p-4">
                <p className="data-label flex items-center gap-2 text-primary">
                  <Crown className="h-4 w-4" /> Coordenador responsável
                </p>
                {group.coordinator ? (
                  <div className="mt-4 flex items-start gap-3">
                    <Avatar className="h-11 w-11 border">
                      <AvatarFallback className="bg-background text-sm font-semibold">
                        {initials(group.coordinator.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold leading-5">
                        {group.coordinator.name}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {group.coordinator.title} · {group.coordinator.institution}
                      </p>
                      {group.coordinator.email && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <a
                            href={`mailto:${group.coordinator.email}`}
                            className="truncate font-mono text-[11px] text-primary hover:underline"
                            title={`Enviar e-mail para ${group.coordinator.email}`}
                          >
                            {group.coordinator.email}
                          </a>
                        </p>
                      )}
                      <p className="mt-2.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {group.coordinator.whatsappOptIn
                          ? "Alertas autorizados"
                          : "Alertas não autorizados"}
                      </p>
                    </div>
                    {access?.isAdmin && <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(group.coordinator!)}
                      aria-label={`Editar coordenador ${group.coordinator.name}`}
                    >
                      <Pencil className="mr-1.5 h-4 w-4" /> Editar ficha
                    </Button>}
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-muted-foreground">
                    A reunião de kick-off identifica os participantes; a coordenação operacional deste grupo permanece a definir.
                  </p>
                )}
              </section>

              <section>
                <div className="flex items-center justify-between border-b pb-3">
                  <p className="data-label flex items-center gap-2">
                    <UsersRound className="h-4 w-4" /> Participantes indicados no kick-off
                  </p>
                  <span className="font-mono text-xs font-semibold">
                    {group.kickoffParticipants.length}
                  </span>
                </div>
                {group.kickoffParticipants.length ? (
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {group.kickoffParticipants.map(member => (
                      <div
                        key={member.id}
                        className={`flex items-start gap-3 rounded-md border bg-card p-3 ${
                          member.active ? "" : "opacity-55"
                        }`}
                      >
                        <UserRound className="mt-1 h-4 w-4 shrink-0 text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold leading-5">
                            {member.name}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {member.title} · {member.institution}
                          </p>
                          {member.email && (
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Mail className="h-3.5 w-3.5 shrink-0 text-primary" />
                              <a
                                href={`mailto:${member.email}`}
                                className="truncate font-mono text-[11px] text-primary hover:underline"
                                title={`Enviar e-mail para ${member.email}`}
                              >
                                {member.email}
                              </a>
                            </p>
                          )}
                          {member.primaryGroupId !== group.id && (
                            <p className="mt-2 text-[11px] text-muted-foreground">
                              Participação temática adicional
                            </p>
                          )}
                          {!member.active && (
                            <p className="editorial-kicker mt-2 text-primary">
                              Inativo
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-sm text-muted-foreground">
                    Nenhum participante indicado para este grupo na reunião de kick-off.
                  </p>
                )}
              </section>
              <section className="rounded-md border border-border bg-muted/20 p-4 lg:col-span-2">
                <p className="data-label text-muted-foreground">Regra de gestão</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">A composição temática do kick-off orienta a participação nos grupos. O vínculo primário, os papéis de executor, revisor e as responsabilidades de cada seção continuam registrados e auditados nas fichas de atividade.</p>
              </section>
            </div>
            <section className="border-t bg-muted/15 px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <p className="data-label flex items-center gap-2">
                  <BookMarked className="h-4 w-4" /> Itens sob coordenação
                </p>
                <span className="font-mono text-xs font-semibold">
                  {group.assignedSections.length} item
                  {group.assignedSections.length === 1 ? "" : "s"}
                </span>
              </div>
              {group.assignedSections.length ? (
                <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {group.assignedSections.map(section => {
                    const deadline = deadlineStatus(section);
                    return (
                    <a key={section.activityId} href={`/atividades?ficha=${section.activityId}`} className={`block rounded-md border p-3.5 transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${deadline.className}`} aria-label={`Abrir ficha de ${section.activityTitle}. Situação: ${deadline.label}`}>
                      <p className="font-mono text-[11px] font-semibold text-primary">
                        {section.planCode ?? section.sectionCode}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2"><p className="text-sm font-semibold leading-5">
                        {section.activityTitle}
                      </p><span className="shrink-0 rounded-full border border-current px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">{deadline.label}</span></div>
                      <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                        {section.planningSummary ?? section.officialDescription}
                      </p>
                      <p className="mt-3 text-[11px] text-muted-foreground">{Number.isFinite(section.dueAt) ? `Prazo: ${formatDate(section.dueAt!)}` : "Prazo a definir"} · Abrir ficha completa</p>
                    </a>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  Nenhum item atribuído a este grupo.
                </p>
              )}
            </section>
            </CollapsibleContent>
            </article>
          </Collapsible>
        )})}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto bg-card sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl font-semibold tracking-[-.03em]">
              {form.id ? "Editar integrante" : "Novo participante"}
            </DialogTitle>
            <DialogDescription>
              Definição do grupo, da função e da conta de acesso vinculada ao
              integrante.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Nome</Label>
              <Input
                className="mt-2 rounded-none"
                value={form.name}
                onChange={event => setForm({ ...form, name: event.target.value })}
              />
            </div>
            <div>
              <Label>Função técnica</Label>
              <Input
                className="mt-2 rounded-none"
                value={form.title}
                onChange={event => setForm({ ...form, title: event.target.value })}
              />
            </div>
            <div>
              <Label>Instituição</Label>
              <Input
                className="mt-2 rounded-none"
                value={form.institution}
                onChange={event =>
                  setForm({ ...form, institution: event.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Label>E-mail institucional / de contato</Label>
              <Input
                className="mt-2 rounded-none"
                type="email"
                placeholder="nome@instituicao.br"
                value={form.email}
                onChange={event => setForm({ ...form, email: event.target.value })}
              />
            </div>
            <div>
              <Label>Grupo participante</Label>
              <Select
                value={form.groupId}
                disabled={isEditingCoordinator}
                onValueChange={value => {
                  const group = data.find(item => item.id === Number(value));
                  setForm({
                    ...form,
                    groupId: value,
                    institution: group?.institution ?? form.institution,
                  });
                }}
              >
                <SelectTrigger className="mt-2 w-full rounded-none">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {data
                    .filter(group => group.active)
                    .map(group => (
                      <SelectItem key={group.id} value={String(group.id)}>
                        <span title={group.name}>{groupDisplayName(group.name)}</span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Papel no grupo</Label>
              <Select
                value={form.groupRole}
                disabled={isEditingCoordinator}
                onValueChange={value =>
                  setForm({ ...form, groupRole: value as TeamGroupRole })
                }
              >
                <SelectTrigger className="mt-2 w-full rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="participante">Participante</SelectItem>
                  <SelectItem value="coordenador">Coordenador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.groupRole === "coordenador" && !isEditingCoordinator && (
              <p className="border-l-2 border-primary pl-3 text-xs text-muted-foreground sm:col-span-2">
                Ao promover este integrante, ele se torna o único coordenador do
                grupo e assume as atividades do coordenador anterior.
              </p>
            )}
            <div className="sm:col-span-2">
              <Label>Conta de acesso vinculada</Label>
              <Select
                value={form.userId}
                onValueChange={value => setForm({ ...form, userId: value })}
              >
                <SelectTrigger className="mt-2 w-full rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem conta vinculada</SelectItem>
                  {(access?.users ?? [])
                    .filter(user => {
                      const linkedToAnotherMember = allMembers.some(
                        member =>
                          member.userId === user.id && member.id !== form.id
                      );
                      return !linkedToAnotherMember;
                    })
                    .map(user => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {user.name ?? user.email ?? `Usuário ${user.id}`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-muted-foreground">
                O coordenador precisa deste vínculo para consultar suas
                atividades e preencher as horas do grupo.
              </p>
            </div>
            <div className="sm:col-span-2">
              <Label>WhatsApp com código do país</Label>
              <Input
                className="mt-2 rounded-none"
                placeholder="+55 21 99999-9999"
                value={form.whatsappPhone}
                onChange={event =>
                  setForm({ ...form, whatsappPhone: event.target.value })
                }
              />
            </div>
            <div className="flex items-center justify-between border-y paper-rule py-3 sm:col-span-2">
              <Label>Consentimento para alertas</Label>
              <Switch
                checked={form.whatsappOptIn}
                onCheckedChange={value =>
                  setForm({ ...form, whatsappOptIn: value })
                }
              />
            </div>
            <div className="flex items-center justify-between border-b paper-rule pb-3 sm:col-span-2">
              <div>
                <Label>Integrante ativo</Label>
                {isEditingCoordinator && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Promova outro participante antes de desativar o coordenador.
                  </p>
                )}
              </div>
              <Switch
                checked={form.active}
                disabled={isEditingCoordinator}
                onCheckedChange={value => setForm({ ...form, active: value })}
              />
            </div>
          </div>
          <Button
            onClick={save}
            disabled={create.isPending || update.isPending}
            className="mt-4 w-full"
          >
            {create.isPending || update.isPending
              ? "Salvando…"
              : "Salvar cadastro"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TeamPage() {
  return (
    <AdminGate>
      <TeamContent />
    </AdminGate>
  );
}
