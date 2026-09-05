import AdminGate from "@/components/AdminGate";
import { PageHeader, PageLoading } from "@/components/EditorialUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/format";
import { APP_ROLES, type AppRole } from "@shared/domain";
import {
  Briefcase,
  Check,
  Copy,
  Crown,
  ExternalLink,
  Mail,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserRoundCog,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

function roleBadgeConfig(role: AppRole) {
  switch (role) {
    case "administrador":
      return {
        label: "Administrador",
        icon: Crown,
        className: "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300",
      };
    case "coordenador":
      return {
        label: "Coordenador",
        icon: ShieldCheck,
        className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
      };
    case "executor":
    default:
      return {
        label: "Executor",
        icon: Briefcase,
        className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
      };
  }
}

function UserAccessContent() {
  const { data, isLoading, refetch } = trpc.administration.accessDirectory.useQuery();
  const updateAccess = trpc.administration.updateUserAccess.useMutation();
  const sendInvitation = trpc.administration.sendFirstAccessInvitation.useMutation();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("todos");
  const [invitationModalOpen, setInvitationModalOpen] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sentInvitationData, setSentInvitationData] = useState<{
    count: number;
    invitations: Array<{
      userId: number;
      name: string;
      email: string;
      appRole: string;
      groupName: string;
      institution: string;
      subject: string;
      messageBody: string;
      loginUrl: string;
      sentAt: Date;
    }>;
    latestInvitation: {
      userId: number;
      name: string;
      email: string;
      appRole: string;
      groupName: string;
      institution: string;
      subject: string;
      messageBody: string;
      loginUrl: string;
      sentAt: Date;
    } | null;
  } | null>(null);

  const handleSendInvitation = async (userId?: number, email?: string, all?: boolean) => {
    try {
      const res = await sendInvitation.mutateAsync({ userId, email, all });
      setSentInvitationData(res as any);
      setInvitationModalOpen(true);
      if (all) {
        toast.success(`Instruções de primeiro acesso enviadas para ${res.count} participantes!`);
      } else {
        toast.success(`Instruções de primeiro acesso enviadas para ${res.latestInvitation?.email || "o participante"}!`);
      }
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar instruções de primeiro acesso.");
    }
  };

  const copyToClipboard = (text: string, type: "text" | "link") => {
    navigator.clipboard.writeText(text);
    if (type === "text") {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
      toast.success("Texto das instruções copiado!");
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success("Link de primeiro acesso copiado!");
    }
  };

  const entries = useMemo(() => {
    return (data?.entries ?? []).filter(entry => {
      const matchesSearch = `${entry.name} ${entry.email} ${entry.appRole} ${entry.status}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesRole = roleFilter === "todos" || entry.appRole === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [data, search, roleFilter]);

  const counts = useMemo(() => {
    const all = data?.entries ?? [];
    return {
      total: all.length,
      admin: all.filter(e => e.appRole === "administrador").length,
      coordenador: all.filter(e => e.appRole === "coordenador").length,
      executor: all.filter(e => e.appRole === "executor").length,
    };
  }, [data]);

  if (isLoading || !data) return <PageLoading />;

  const save = async (
    entry: typeof data.entries[number],
    appRole: AppRole,
    status: "ativo" | "revogado" | "pendente" | "ativado"
  ) => {
    try {
      await updateAccess.mutateAsync({ target: entry.kind, id: entry.id, appRole, status });
      await refetch();
      toast.success("Acesso e perfil atualizados com sucesso.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o acesso.");
    }
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Controle de acesso e governança"
        title="Usuários e Perfis do Estudo"
        description="Gestão centralizada de contas e permissões distribuídas em 3 perfis operacionais: Administradores (coordenação geral/TI), Coordenadores de Grupos Temáticos (G1–G11) e Executores Técnicos."
        index="09 — Acessos"
      />

      {/* Summary KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="technical-panel p-4">
          <div className="flex items-center justify-between">
            <p className="data-label text-muted-foreground">Total de Usuários</p>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p className="font-mono mt-2 text-3xl font-semibold">{counts.total}</p>
          <p className="mt-1 text-xs text-muted-foreground">Integrantes e contas registradas</p>
        </div>

        <div className="technical-panel p-4">
          <div className="flex items-center justify-between">
            <p className="data-label text-purple-600 dark:text-purple-400">Administradores</p>
            <Crown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="font-mono mt-2 text-3xl font-semibold text-purple-700 dark:text-purple-300">{counts.admin}</p>
          <p className="mt-1 text-xs text-muted-foreground">Coordenação geral, TI e gestão</p>
        </div>

        <div className="technical-panel p-4">
          <div className="flex items-center justify-between">
            <p className="data-label text-amber-600 dark:text-amber-400">Coordenadores</p>
            <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="font-mono mt-2 text-3xl font-semibold text-amber-700 dark:text-amber-300">{counts.coordenador}</p>
          <p className="mt-1 text-xs text-muted-foreground">Coordenadores de grupos G1–G11</p>
        </div>

        <div className="technical-panel p-4">
          <div className="flex items-center justify-between">
            <p className="data-label text-emerald-600 dark:text-emerald-400">Executores</p>
            <Briefcase className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="font-mono mt-2 text-3xl font-semibold text-emerald-700 dark:text-emerald-300">{counts.executor}</p>
          <p className="mt-1 text-xs text-muted-foreground">Pesquisadores e consultores</p>
        </div>
      </section>

      {/* Directory Table */}
      <section className="technical-panel overflow-hidden">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-muted/30 p-5">
          <div>
            <p className="data-label text-primary">Diretório de Acessos</p>
            <h2 className="font-display mt-1 text-2xl font-semibold">Participantes e Perfis Atribuídos</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 rounded-lg border bg-background p-1 text-xs">
              {[
                { id: "todos", label: "Todos" },
                { id: "administrador", label: "Admin" },
                { id: "coordenador", label: "Coord." },
                { id: "executor", label: "Exec." },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setRoleFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    roleFilter === tab.id
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9 h-9 text-sm"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Buscar por nome, e-mail ou perfil..."
              />
            </div>
          </div>
        </header>

        <div className="data-label hidden grid-cols-[minmax(0,1fr)_180px_140px_100px] gap-3 border-b bg-muted/55 px-5 py-3 md:grid">
          <span>Participante</span>
          <span>Perfil Operacional</span>
          <span>Status</span>
          <span className="text-right">Ação</span>
        </div>

        <div className="divide-y paper-rule">
          {entries.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum participante encontrado para os filtros selecionados.
            </div>
          ) : (
            entries.map(entry => {
              const currentBadge = roleBadgeConfig(entry.appRole as AppRole);
              const Icon = currentBadge.icon;

              return (
                <div
                  key={`${entry.kind}-${entry.id}`}
                  className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1fr)_180px_140px_100px] md:items-center hover:bg-muted/20 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{entry.name}</p>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 font-normal gap-1 ${currentBadge.className}`}>
                        <Icon className="h-2.5 w-2.5" />
                        {currentBadge.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{entry.email || "E-mail indisponível"}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {entry.kind === "pre-cadastro"
                        ? "Aguardando primeiro acesso"
                        : `Último acesso: ${entry.lastSignedIn ? formatDate(entry.lastSignedIn) : "Sem registro"}`}
                    </p>
                  </div>

                  <div>
                    <Select
                      defaultValue={entry.appRole}
                      onValueChange={value => save(entry, value as AppRole, entry.status)}
                    >
                      <SelectTrigger className="h-8 text-xs font-medium">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {APP_ROLES.map(role => {
                          const config = roleBadgeConfig(role);
                          const RoleIcon = config.icon;
                          return (
                            <SelectItem key={role} value={role} className="text-xs">
                              <div className="flex items-center gap-2">
                                <RoleIcon className="h-3 w-3" />
                                <span>{config.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Select
                      defaultValue={entry.status}
                      onValueChange={value =>
                        save(entry, entry.appRole as AppRole, value as "ativo" | "revogado" | "pendente" | "ativado")
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {entry.kind === "conta" ? (
                          <>
                            <SelectItem value="ativo" className="text-xs">Ativo</SelectItem>
                            <SelectItem value="revogado" className="text-xs">Revogado</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="pendente" className="text-xs">Pendente</SelectItem>
                            <SelectItem value="ativado" className="text-xs">Ativado</SelectItem>
                            <SelectItem value="revogado" className="text-xs">Revogado</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-medium"
                        onClick={() => handleSendInvitation(entry.kind === "conta" ? entry.id : undefined, entry.email || undefined)}
                        disabled={sendInvitation.isPending || !entry.email}
                        title={entry.email ? `Enviar instruções de primeiro acesso para ${entry.email}` : "Sem e-mail cadastrado"}
                      >
                        <Send className="mr-1.5 h-3.5 w-3.5 text-primary" />
                        Instruções
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="h-8 text-xs font-medium"
                        onClick={() => save(entry, entry.appRole as AppRole, entry.status)}
                        disabled={updateAccess.isPending}
                      >
                        Salvar
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

      {/* Modal de Confirmação e Pré-visualização do Convite Enviado */}
      <Dialog
        open={invitationModalOpen}
        onOpenChange={open => setInvitationModalOpen(open)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Sparkles className="h-5 w-5" />
              <span>Instruções de Primeiro Acesso Encaminhadas</span>
            </div>
            <DialogTitle className="text-xl">
              Mensagem Automática de Primeiro Acesso
            </DialogTitle>
            <DialogDescription className="text-xs">
              A mensagem institucional com as orientações de registro e link de acesso foi gerada e registrada com sucesso.
            </DialogDescription>
          </DialogHeader>

          {sentInvitationData?.latestInvitation && (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1.5">
                <p>
                  <strong>Destinatário:</strong> {sentInvitationData.latestInvitation.name} &lt;
                  <span className="text-primary font-mono font-medium">
                    {sentInvitationData.latestInvitation.email}
                  </span>
                  &gt;
                </p>
                <p>
                  <strong>Perfil:</strong> {sentInvitationData.latestInvitation.appRole.toUpperCase()} ·{" "}
                  <strong>Grupo:</strong> {sentInvitationData.latestInvitation.groupName}
                </p>
                <p>
                  <strong>Assunto:</strong> {sentInvitationData.latestInvitation.subject}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Conteúdo do E-mail Enviado
                </p>
                <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-md border bg-card p-3 font-mono text-xs leading-relaxed text-foreground/90">
                  {sentInvitationData.latestInvitation.messageBody}
                </pre>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    copyToClipboard(
                      sentInvitationData.latestInvitation!.messageBody,
                      "text"
                    )
                  }
                  className="text-xs"
                >
                  {copiedText ? (
                    <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {copiedText ? "Texto Copiado!" : "Copiar Texto da Mensagem"}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    copyToClipboard(
                      sentInvitationData.latestInvitation!.loginUrl,
                      "link"
                    )
                  }
                  className="text-xs"
                >
                  {copiedLink ? (
                    <Check className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {copiedLink ? "Link Copiado!" : "Copiar Link de Acesso"}
                </Button>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button onClick={() => setInvitationModalOpen(false)}>
              Concluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function UserAccessPage() {
  return (
    <AdminGate>
      <UserAccessContent />
    </AdminGate>
  );
}
