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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { formatDate, initials } from "@/lib/format";
import { groupDisplayName } from "@shared/groupDisplay";
import { TEAM_SEED, type TeamGroupRole, type AppRole } from "@shared/domain";
import {
  parseSpreadsheetMatrix,
  DEFAULT_SPREADSHEET_CSV_TEMPLATE,
  type ParsedSpreadsheetResult,
} from "@shared/matrixParser";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Building2,
  BookMarked,
  CheckCircle2,
  ChevronDown,
  Crown,
  FileSpreadsheet,
  FileText,
  Layers,
  Mail,
  MessageCircle,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Upload,
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

function getMemberAppRoleBadge(name: string, isCoordinator = false) {
  const seed = TEAM_SEED.find(m => m.name.toLowerCase() === name.toLowerCase());
  const role: AppRole = seed?.appRole || (isCoordinator ? "coordenador" : "executor");

  if (role === "administrador") {
    return (
      <Badge
        variant="outline"
        className="h-5 gap-1 border-purple-200 bg-purple-50 px-1.5 py-0 text-[10px] font-medium text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
      >
        <Crown className="h-3 w-3 text-purple-600 dark:text-purple-400" />
        Administrador
      </Badge>
    );
  }
  if (role === "coordenador" || isCoordinator) {
    return (
      <Badge
        variant="outline"
        className="h-5 gap-1 border-amber-200 bg-amber-50 px-1.5 py-0 text-[10px] font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
      >
        <ShieldCheck className="h-3 w-3 text-amber-600 dark:text-amber-400" />
        Coordenador
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="h-5 gap-1 border-emerald-200 bg-emerald-50 px-1.5 py-0 text-[10px] font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
    >
      <Briefcase className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
      Executor
    </Badge>
  );
}

function TeamContent() {
  const { data, isLoading } = trpc.team.hierarchy.useQuery();
  const { data: access } = trpc.administration.status.useQuery();
  const utils = trpc.useUtils();
  const create = trpc.team.create.useMutation();
  const update = trpc.team.update.useMutation();
  const importSpreadsheet = trpc.team.importSpreadsheetMatrix.useMutation();

  const [search, setSearch] = useState("");
  const [openGroupIds, setOpenGroupIds] = useState<number[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<MemberForm>(emptyMember);

  // Estado do Modal de Carga de Planilha
  const [openSpreadsheetDialog, setOpenSpreadsheetDialog] = useState(false);
  const [spreadsheetCsv, setSpreadsheetCsv] = useState(DEFAULT_SPREADSHEET_CSV_TEMPLATE);
  const [syncActivitiesWithSpreadsheet, setSyncActivitiesWithSpreadsheet] = useState(true);

  const canManage = Boolean(access?.isAdmin || access?.isGeneralCoordinator || access?.canManageTeam);

  const parsedPreview: ParsedSpreadsheetResult | null = useMemo(() => {
    try {
      if (!spreadsheetCsv.trim()) return null;
      return parseSpreadsheetMatrix(spreadsheetCsv);
    } catch {
      return null;
    }
  }, [spreadsheetCsv]);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const text = evt.target?.result;
      if (typeof text === "string") {
        setSpreadsheetCsv(text);
        toast.info(`Arquivo "${file.name}" carregado. Revise o preview antes de confirmar.`);
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleApplySpreadsheet = async () => {
    if (!spreadsheetCsv.trim()) {
      toast.error("O conteúdo da planilha está vazio.");
      return;
    }
    try {
      const res = await importSpreadsheet.mutateAsync({
        csvContent: spreadsheetCsv,
        syncActivities: syncActivitiesWithSpreadsheet,
      });
      await Promise.all([
        utils.team.hierarchy.invalidate(),
        utils.team.list.invalidate(),
        utils.activities.list.invalidate(),
        utils.administration.status.invalidate(),
      ]);
      toast.success(
        `Revisão aplicada! ${res.groupsCount} grupos processados, ${res.totalMembersCount} participantes (${res.addedMembersCount} novos, ${res.updatedMembersCount} atualizados).`
      );
      setOpenSpreadsheetDialog(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao processar planilha.");
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
        index="06 — Equipe"
        action={
          canManage ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setOpenSpreadsheetDialog(true)}
                className="rounded-md border-primary/30 text-primary hover:bg-primary/5"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Carregar revisão da planilha
              </Button>
              <Button onClick={openCreate} className="rounded-md">
                <Plus className="mr-2 h-4 w-4" /> Incluir integrante
              </Button>
            </div>
          ) : undefined
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="Grupos" value={data.length} note="Matriz funcional G1–G11" />
        <Metric label="Coordenadores" value={coordinatorCount} note="Responsáveis pelas frentes" />
        <Metric label="Integrantes ativos" value={activeMembers} note="Coordenadores e participantes" accent />
      </section>

      {/* Seção Executiva de Coordenação Geral, Administrativa e Técnica */}
      <section className="technical-panel overflow-hidden border-t-[3px] border-t-purple-600 dark:border-t-purple-400">
        <header className="border-b bg-purple-50/50 dark:bg-purple-950/20 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="data-label flex items-center gap-1.5 font-semibold text-purple-700 dark:text-purple-300">
                <Crown className="h-4 w-4" /> Governança e Coordenação do Estudo BNDES
              </p>
              <h2 className="font-display mt-1 text-2xl font-semibold tracking-[-.025em]">
                Coordenação Geral, Administrativa, Técnica e Gestão
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Estrutura diretiva do projeto responsável pela liderança metodológica, gestão institucional, validação técnica e governança editorial.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-purple-300 bg-purple-100/60 font-mono text-xs text-purple-800 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                Coordenação Geral & Administrativa
              </Badge>
              {canManage && (
                <Badge variant="secondary" className="gap-1 text-[11px] font-medium">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" /> Acesso de Gestão Ativo
                </Badge>
              )}
            </div>
          </div>
        </header>

        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Floriano Carlos Martins Pires Jr. - Coordenação Geral */}
          <div className="space-y-2.5 rounded-lg border border-purple-200/80 bg-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 border border-purple-300">
                <AvatarFallback className="bg-purple-100 text-xs font-semibold text-purple-800">
                  FP
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold leading-5">
                  Prof. Floriano Carlos Martins Pires Jr.
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="h-4 border-purple-300 bg-purple-50 px-1.5 py-0 text-[10px] font-medium text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
                    Coordenação Geral
                  </Badge>
                  <Badge variant="outline" className="h-4 border-amber-300 bg-amber-50 px-1.5 py-0 text-[10px] font-medium text-amber-700">
                    Coordenação Técnica
                  </Badge>
                </div>
                <p className="mt-1.5 text-xs font-medium text-foreground">
                  Coordenador Geral do Projeto (UFRJ · FEP/BNDES)
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Coord. G1 (Sistematização) · Membro G4 e G10
                </p>
                <p className="mt-2 flex items-center gap-1.5 truncate text-[11px] text-primary">
                  <Mail className="h-3 w-3 shrink-0" /> floriano@poli.ufrj.br
                </p>
              </div>
            </div>
          </div>

          {/* Denise Cunha - Coordenação Administrativa */}
          <div className="space-y-2.5 rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 border border-purple-200">
                <AvatarFallback className="bg-purple-100 text-xs font-semibold text-purple-800">
                  DC
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold leading-5">
                  Denise Cunha
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="h-4 border-purple-200 bg-purple-50 px-1.5 py-0 text-[10px] font-medium text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300">
                    Coordenação Administrativa
                  </Badge>
                </div>
                <p className="mt-1.5 text-xs font-medium text-foreground">
                  Administradora Executiva do Projeto (UFRJ)
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Gestão Administrativa, Executiva e Financeira do Estudo
                </p>
                <p className="mt-2 flex items-center gap-1.5 truncate text-[11px] text-primary">
                  <Mail className="h-3 w-3 shrink-0" /> denisecunha@poli.ufrj.br
                </p>
              </div>
            </div>
          </div>

          {/* Prof. Luiz Felipe Assis - Coord. Administrativa & Técnica */}
          <div className="space-y-2.5 rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 border border-purple-200">
                <AvatarFallback className="bg-purple-100 text-xs font-semibold text-purple-800">
                  LA
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold leading-5">
                  Prof. Luiz Felipe Assis
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="h-4 border-purple-200 bg-purple-50 px-1.5 py-0 text-[10px] font-medium text-purple-700">
                    Coordenação Administrativa
                  </Badge>
                  <Badge variant="outline" className="h-4 border-amber-200 bg-amber-50 px-1.5 py-0 text-[10px] font-medium text-amber-700">
                    Coordenação Técnica
                  </Badge>
                </div>
                <p className="mt-1.5 text-xs font-medium text-foreground">
                  Coordenador do Grupo G4 e Membro do G1 (UFRJ)
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Coord. G4 (Transporte Marítimo Mundial) · Membro G1
                </p>
                <p className="mt-2 flex items-center gap-1.5 truncate text-[11px] text-primary">
                  <Mail className="h-3 w-3 shrink-0" /> lfelipe@oceanica.ufrj.br
                </p>
              </div>
            </div>
          </div>

          {/* Cassiano Marins de Souza - Coordenação Técnica */}
          <div className="space-y-2.5 rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 border border-amber-200">
                <AvatarFallback className="bg-amber-100 text-xs font-semibold text-amber-800">
                  CS
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold leading-5">
                  Cassiano Marins de Souza
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="h-4 border-amber-200 bg-amber-50 px-1.5 py-0 text-[10px] font-medium text-amber-700">
                    Coordenação Técnica
                  </Badge>
                </div>
                <p className="mt-1.5 text-xs font-medium text-foreground">
                  Substituto Editorial da Coordenação do Projeto
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Coord. G10 (Construção Naval Mundial) · Membro G1
                </p>
                <p className="mt-2 flex items-center gap-1.5 truncate text-[11px] text-primary">
                  <Mail className="h-3 w-3 shrink-0" /> cassianomarins@gmail.com
                </p>
              </div>
            </div>
          </div>

          {/* Carlos Frederico Leão Rocha - Coordenação Técnica */}
          <div className="space-y-2.5 rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 border border-amber-200">
                <AvatarFallback className="bg-amber-100 text-xs font-semibold text-amber-800">
                  CR
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold leading-5">
                  Prof. Carlos Frederico Leão Rocha
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="h-4 border-amber-200 bg-amber-50 px-1.5 py-0 text-[10px] font-medium text-amber-700">
                    Coordenação Técnica
                  </Badge>
                </div>
                <p className="mt-1.5 text-xs font-medium text-foreground">
                  Coordenador do Grupo G2 e Membro do G1 (IE-UFRJ)
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Coord. G2 (Política Industrial) · Membro G1
                </p>
                <p className="mt-2 flex items-center gap-1.5 truncate text-[11px] text-primary">
                  <Mail className="h-3 w-3 shrink-0" /> carlos.rocha@ie.ufrj.br
                </p>
              </div>
            </div>
          </div>

          {/* Segen Farid Estefen - Coordenação Técnica */}
          <div className="space-y-2.5 rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 border border-amber-200">
                <AvatarFallback className="bg-amber-100 text-xs font-semibold text-amber-800">
                  SE
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold leading-5">
                  Prof. Segen Farid Estefen
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="h-4 border-amber-200 bg-amber-50 px-1.5 py-0 text-[10px] font-medium text-amber-700">
                    Coordenação Técnica
                  </Badge>
                </div>
                <p className="mt-1.5 text-xs font-medium text-foreground">
                  Membro da Coordenação Técnica e do Grupo G1 (UFRJ)
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Coordenação Técnica e Metodológica do Estudo
                </p>
                <p className="mt-2 flex items-center gap-1.5 truncate text-[11px] text-primary">
                  <Mail className="h-3 w-3 shrink-0" /> segen@oceanica.ufrj.br
                </p>
              </div>
            </div>
          </div>
        </div>
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
                <p className="mt-1 text-xs text-muted-foreground">Composição confirmada e revisada na matriz funcional</p>
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold leading-5">
                          {group.coordinator.name}
                        </h3>
                        {getMemberAppRoleBadge(group.coordinator.name, true)}
                      </div>
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
                    {canManage && <Button
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
                    A coordenação operacional deste grupo permanece a definir.
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
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-semibold leading-5">
                              {member.name}
                            </p>
                            {getMemberAppRoleBadge(member.name, false)}
                          </div>
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
                    Nenhum participante indicado para este grupo.
                  </p>
                )}
              </section>
              <section className="rounded-md border border-border bg-muted/20 p-4 lg:col-span-2">
                <p className="data-label text-muted-foreground">Regra de gestão</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">A matriz de grupos orienta a distribuição temática do estudo. O Prof. Floriano (Coordenação Geral) e Administradores podem atualizar as atribuições de equipe e carregar revisões da planilha sempre que necessário.</p>
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
                      <p className="mt-3 text-[11px] text-muted-foreground">{Number.isFinite(section.dueAt) ? `Cronograma: Término em ${formatDate(section.dueAt!)}` : "Prazo a definir no Cronograma"} · Abrir ficha completa</p>
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

      {/* Diálogo de Carga / Revisão da Planilha Matriz */}
      <Dialog open={openSpreadsheetDialog} onOpenChange={setOpenSpreadsheetDialog}>
        <DialogContent className="max-h-[92vh] overflow-y-auto bg-card sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2 text-2xl font-semibold tracking-[-.03em]">
              <FileSpreadsheet className="h-6 w-6 text-primary" /> Carregar Revisão da Planilha (Atividades e Grupos)
            </DialogTitle>
            <DialogDescription>
              Cole o conteúdo CSV ou selecione um arquivo de revisão com a matriz de grupos (G1–G11), participantes e coordenações. O Prof. Floriano e Administradores possuem credenciais para processar a sincronização.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/20 p-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="mr-1.5 h-4 w-4" /> Selecionar arquivo (.csv / .txt)
                    </span>
                  </Button>
                </Label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv,.txt,.xlsx,.xlsm"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSpreadsheetCsv(DEFAULT_SPREADSHEET_CSV_TEMPLATE)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restaurar modelo canônico
              </Button>
            </div>

            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Conteúdo da Planilha (Formato CSV com Grupos G1–G11 e Coordenações)
              </Label>
              <Textarea
                className="mt-2 font-mono text-xs leading-relaxed"
                rows={10}
                value={spreadsheetCsv}
                onChange={e => setSpreadsheetCsv(e.target.value)}
                placeholder="Cole o CSV da planilha aqui..."
              />
            </div>

            {/* Painel de Pré-visualização do Parser */}
            {parsedPreview ? (
              <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
                <p className="data-label flex items-center gap-1.5 font-semibold text-primary">
                  <CheckCircle2 className="h-4 w-4" /> Pré-visualização da Estrutura Identificada
                </p>
                <div className="mt-2.5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded bg-background p-2.5 shadow-sm">
                    <p className="text-[11px] font-medium text-muted-foreground">Grupos Detectados</p>
                    <p className="font-mono text-lg font-bold text-foreground">
                      {parsedPreview.groups.length} / 11
                    </p>
                  </div>
                  <div className="rounded bg-background p-2.5 shadow-sm">
                    <p className="text-[11px] font-medium text-muted-foreground">Participantes Totais</p>
                    <p className="font-mono text-lg font-bold text-foreground">
                      {parsedPreview.allMemberNames.length}
                    </p>
                  </div>
                  <div className="rounded bg-background p-2.5 shadow-sm">
                    <p className="text-[11px] font-medium text-muted-foreground">Coordenação Geral</p>
                    <p className="truncate text-xs font-semibold text-foreground">
                      {parsedPreview.governance.geral.join(", ") || "Prof. Floriano"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 max-h-48 overflow-y-auto rounded border bg-background p-2.5">
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Resumo dos Grupos & Coordenadores:</p>
                  <div className="space-y-1.5 text-xs">
                    {parsedPreview.groups.map(g => (
                      <div key={g.groupCode} className="flex items-start justify-between gap-2 border-b pb-1 last:border-0">
                        <span className="font-semibold text-primary">{g.fullName}:</span>
                        <span className="text-right text-muted-foreground">
                          Coord: <strong className="text-foreground">{g.coordinatorName ?? "A definir"}</strong> ({g.members.length} membros)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                <p className="flex items-center gap-1.5 font-semibold">
                  <ShieldAlert className="h-4 w-4" /> Formato não reconhecido
                </p>
                <p className="mt-1">Verifique se as linhas contêm as marcações G1, G2, etc., e os nomes dos integrantes.</p>
              </div>
            )}

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label className="text-xs font-semibold">Sincronizar Atividades Canônicas</Label>
                <p className="text-[11px] text-muted-foreground">
                  Reatribui a responsabilidade das atividades canônicas aos coordenadores designados.
                </p>
              </div>
              <Switch
                checked={syncActivitiesWithSpreadsheet}
                onCheckedChange={setSyncActivitiesWithSpreadsheet}
              />
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setOpenSpreadsheetDialog(false)}
              disabled={importSpreadsheet.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleApplySpreadsheet}
              disabled={importSpreadsheet.isPending || !parsedPreview || parsedPreview.groups.length === 0}
            >
              {importSpreadsheet.isPending ? "Processando e Atualizando…" : "Confirmar e Aplicar Revisão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Cadastro / Edição Manual de Integrante */}
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
                atividades e coordenar as entregas do grupo.
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
    <AdminGate allowGeneralCoordinator>
      <TeamContent />
    </AdminGate>
  );
}
