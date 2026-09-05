import { useEffect, useState } from "react";
import AdminGate from "@/components/AdminGate";
import { PageHeader, PageLoading, StatusBadge } from "@/components/EditorialUI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
import { APP_ROLES } from "@shared/domain";
import {
  BellRing,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  FileCheck2,
  Mail,
  MessageCircle,
  Play,
  Send,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UserRoundCheck,
} from "lucide-react";
import { toast } from "sonner";

function AdministrationContent() {
  const { data, isLoading, refetch } = trpc.administration.status.useQuery();
  const { data: governance, isLoading: governanceLoading, refetch: refetchGovernance } = trpc.governance.overview.useQuery();
  const updateWhatsApp = trpc.administration.updateWhatsApp.useMutation();
  const configureSchedule = trpc.administration.configureSchedule.useMutation();
  const processNow = trpc.administration.processAlertsNow.useMutation();
  const setRole = trpc.administration.setUserRole.useMutation();
  const updateTomeAssignment = trpc.governance.updateTomeAssignment.useMutation();
  const sendInvitation = trpc.administration.sendFirstAccessInvitation.useMutation();

  const [enabled, setEnabled] = useState(false);
  const [template, setTemplate] = useState("estudo_bndes_alerta_atividade");
  const [language, setLanguage] = useState("pt_BR");
  const [tomeDrafts, setTomeDrafts] = useState<Record<string, { coordinatorId: string; substituteId: string; justification: string }>>({});
  
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

  useEffect(() => {
    if (data?.settings) {
      setEnabled(data.settings.whatsappEnabled);
      setTemplate(data.settings.whatsappTemplateName);
      setLanguage(data.settings.whatsappLanguageCode);
    }
  }, [data]);

  if (isLoading || governanceLoading || !data || !data.settings || !governance) return <PageLoading />;

  const draftForTome = (tome: string, coordinatorId: number | null, substituteId: number | null) => tomeDrafts[tome] ?? { coordinatorId: coordinatorId ? String(coordinatorId) : "none", substituteId: substituteId ? String(substituteId) : "none", justification: "" };
  const updateTomeDraft = (tome: string, currentCoordinatorId: number | null, currentSubstituteId: number | null, changes: Partial<{ coordinatorId: string; substituteId: string; justification: string }>) => {
    const current = draftForTome(tome, currentCoordinatorId, currentSubstituteId);
    setTomeDrafts(drafts => ({ ...drafts, [tome]: { ...current, ...changes } }));
  };
  const saveTomeAssignment = async (tome: string, coordinatorId: number | null, substituteId: number | null) => {
    const draft = draftForTome(tome, coordinatorId, substituteId);
    if (draft.justification.trim().length < 10) {
      toast.error("Informe uma justificativa de pelo menos 10 caracteres para a designação do tomo.");
      return;
    }
    try {
      await updateTomeAssignment.mutateAsync({ tome: tome as "Apresentação" | "Tomo I" | "Tomo II" | "Tomo III" | "Tomo IV", coordinatorId: draft.coordinatorId === "none" ? null : Number(draft.coordinatorId), substituteId: draft.substituteId === "none" ? null : Number(draft.substituteId), justification: draft.justification.trim() });
      await refetchGovernance();
      setTomeDrafts(drafts => ({ ...drafts, [tome]: { coordinatorId: draft.coordinatorId, substituteId: draft.substituteId, justification: "" } }));
      toast.success(`Governança de ${tome} atualizada.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a governança do tomo.");
    }
  };

  const saveWhatsApp = async () => { try { await updateWhatsApp.mutateAsync({ whatsappEnabled: enabled, whatsappTemplateName: template, whatsappLanguageCode: language }); await refetch(); toast.success("Configuração de WhatsApp atualizada."); } catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao salvar."); } };
  const toggleSchedule = async () => { try { await configureSchedule.mutateAsync({ enabled: !data.settings.scheduleCronTaskUid }); await refetch(); toast.success(data.settings.scheduleCronTaskUid ? "Rotina pausada." : "Rotina diária ativada."); } catch (error) { toast.error(error instanceof Error ? error.message : "A rotina só pode ser ativada após a publicação."); } };

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
      toast.success("Texto das instruções copiado para a área de transferência!");
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      toast.success("Link de primeiro acesso copiado!");
    }
  };

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Configuração e controle" title="Administração da plataforma" description="Gestão de perfis de acesso, integração com WhatsApp, rotinas de prazo e histórico operacional." index="08 — Administração" />

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="technical-panel border-t-[3px] border-t-primary p-4">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <p className="data-label mt-4">Perfis cadastrados</p>
          <p className="font-mono mt-2 text-3xl font-semibold">{data.users.length}</p>
        </div>
        <div className="technical-panel border-t-[3px] border-t-foreground/50 p-4">
          {data.whatsappConfigured ? <CheckCircle2 className="h-5 w-5 text-[#2F6B4F]" /> : <TriangleAlert className="h-5 w-5 text-[#B7791F]" />}
          <p className="data-label mt-4">API WhatsApp</p>
          <p className="mt-2 text-sm font-semibold">{data.whatsappConfigured ? "Credenciais conectadas" : "Credenciais pendentes"}</p>
        </div>
        <div className="technical-panel border-t-[3px] border-t-primary p-4">
          <Clock3 className="h-5 w-5 text-primary" />
          <p className="data-label mt-4">Rotina automática</p>
          <p className="mt-2 text-sm font-semibold">{data.settings.scheduleCronTaskUid ? "Ativa diariamente" : "Aguardando ativação"}</p>
        </div>
      </section>

      <section className="technical-panel overflow-hidden">
        <header className="border-b bg-muted/30 p-5">
          <p className="data-label text-primary">Workflow documental</p>
          <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-.025em]">Coordenação e substituição por tomo</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Defina os responsáveis pela aprovação ao nível do tomo e os substitutos autorizados. Toda alteração exige justificativa e gera registro de histórico; nenhuma designação é criada automaticamente.</p>
        </header>
        <div className="divide-y paper-rule">
          {governance.tomeAssignments.map(assignment => {
            const draft = draftForTome(assignment.tome, assignment.coordinatorId, assignment.substituteId);
            const lastEvent = assignment.history[0];
            return (
              <div key={assignment.tome} className="grid gap-4 p-5 xl:grid-cols-[170px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.15fr)_auto] xl:items-end">
                <div>
                  <p className="data-label text-primary">{assignment.tome}</p>
                  <p className="mt-2 text-sm font-semibold">{assignment.coordinatorName ?? "Coordenação pendente"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Substituto: {assignment.substituteName ?? "Não designado"}</p>
                </div>
                <div>
                  <Label htmlFor={`tome-coordinator-${assignment.tome}`}>Coordenador do tomo</Label>
                  <Select value={draft.coordinatorId} onValueChange={value => updateTomeDraft(assignment.tome, assignment.coordinatorId, assignment.substituteId, { coordinatorId: value })}>
                    <SelectTrigger id={`tome-coordinator-${assignment.tome}`} className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não definido</SelectItem>
                      {governance.activeMembers.map(member => <SelectItem key={member.id} value={String(member.id)}>{member.name} · {member.groupName ?? member.institution}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`tome-substitute-${assignment.tome}`}>Substituto autorizado</Label>
                  <Select value={draft.substituteId} onValueChange={value => updateTomeDraft(assignment.tome, assignment.coordinatorId, assignment.substituteId, { substituteId: value })}>
                    <SelectTrigger id={`tome-substitute-${assignment.tome}`} className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não definido</SelectItem>
                      {governance.activeMembers.map(member => <SelectItem key={member.id} value={String(member.id)}>{member.name} · {member.groupName ?? member.institution}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`tome-note-${assignment.tome}`}>Justificativa da designação</Label>
                  <Input id={`tome-note-${assignment.tome}`} value={draft.justification} onChange={event => updateTomeDraft(assignment.tome, assignment.coordinatorId, assignment.substituteId, { justification: event.target.value })} placeholder="Obrigatória para registrar a alteração" className="mt-2" />
                  {lastEvent && <p className="mt-2 text-[11px] leading-4 text-muted-foreground">Último registro: {lastEvent.justification}</p>}
                </div>
                <Button size="sm" onClick={() => void saveTomeAssignment(assignment.tome, assignment.coordinatorId, assignment.substituteId)} disabled={updateTomeAssignment.isPending}><UserRoundCheck className="mr-2 h-4 w-4" /> Registrar</Button>
              </div>
            );
          })}
        </div>
        <footer className="flex items-center gap-2 border-t bg-muted/20 px-5 py-3 text-xs text-muted-foreground"><FileCheck2 className="h-4 w-4 text-primary" /> {governance.p0Approval ? "Aprovação do P0 registrada; a designação dos tomos permanece sob validação da administração." : "Aprovação do P0 ainda pendente na Visão Geral."}</footer>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="technical-panel overflow-hidden">
          <header className="border-b bg-muted/30 p-5">
            <p className="data-label text-primary">WhatsApp Business Platform</p>
            <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-.025em]">Mensagens utilitárias</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Somente atribuição, três dias antes e marcação de atraso. O destinatário precisa ter consentido.</p>
          </header>
          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between rounded-md border bg-muted/25 p-3"><div><Label>Habilitar envios</Label><p className="mt-1 text-xs text-muted-foreground">Exige credenciais e modelo aprovado.</p></div><Switch checked={enabled} onCheckedChange={setEnabled} /></div>
            <div><Label>Nome do modelo aprovado</Label><Input value={template} onChange={e => setTemplate(e.target.value)} className="mt-2" /></div>
            <div><Label>Idioma do modelo</Label><Input value={language} onChange={e => setLanguage(e.target.value)} className="mt-2" /></div>
            <Button onClick={saveWhatsApp} disabled={updateWhatsApp.isPending} className="w-full"><MessageCircle className="mr-2 h-4 w-4" /> Salvar integração</Button>
          </div>
        </div>

        <div className="technical-panel overflow-hidden">
          <header className="border-b bg-muted/30 p-5">
            <p className="data-label text-primary">Automação de prazo</p>
            <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-.025em]">Verificação diária</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Execução às 12:00 UTC, com deduplicação por atividade e evento, fila e até três tentativas controladas.</p>
          </header>
          <div className="space-y-3 p-5">
            <div className="flex items-center justify-between rounded-md border bg-muted/25 p-3"><span className="text-sm font-medium">Estado da rotina</span><StatusBadge status={data.settings.scheduleCronTaskUid ? "concluído" : "pendente"} /></div>
            <Button variant="outline" className="w-full" onClick={toggleSchedule} disabled={configureSchedule.isPending}><BellRing className="mr-2 h-4 w-4" />{data.settings.scheduleCronTaskUid ? "Pausar rotina" : "Ativar após publicação"}</Button>
            <Button variant="outline" className="w-full" onClick={async () => { try { const result = await processNow.mutateAsync(); await refetch(); toast.success(`${result.deadlineAlerts} alertas de prazo; ${result.markedDelayed} atrasos.`); } catch (error) { toast.error(error instanceof Error ? error.message : "Falha no processamento."); } }} disabled={processNow.isPending}><Play className="mr-2 h-4 w-4" /> Processar agora</Button>
          </div>
        </div>
      </section>

      {/* Controle de acesso / Participantes autenticados */}
      <section className="technical-panel overflow-hidden">
        <header className="flex flex-col gap-4 border-b bg-muted/30 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="data-label text-primary">Controle de acesso</p>
            <h2 className="font-display mt-1 text-2xl font-semibold tracking-[-.025em]">
              Participantes autenticados
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Gerencie permissões e envie mensagens automáticas com instruções de primeiro acesso e confirmação de registro.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => handleSendInvitation(undefined, undefined, true)}
            disabled={sendInvitation.isPending}
            className="shrink-0"
          >
            <Mail className="mr-2 h-4 w-4" />
            Enviar Instruções a Todos
          </Button>
        </header>

        <div className="data-label hidden grid-cols-[1fr_200px_130px_180px] gap-3 border-b bg-muted/55 px-4 py-3 md:grid">
          <span>Participante e E-mail</span>
          <span>Perfil Atribuído</span>
          <span>Último acesso</span>
          <span className="text-right">Instruções de Acesso</span>
        </div>

        <div className="divide-y paper-rule">
          {data.users.map(user => (
            <div
              key={user.id}
              className="grid gap-3 px-4 py-3.5 md:grid-cols-[1fr_200px_130px_180px] md:items-center"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {user.name || "Participante"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user.email || "E-mail não informado"}
                </p>
              </div>

              <Select
                value={user.appRole}
                onValueChange={async value => {
                  await setRole.mutateAsync({
                    userId: user.id,
                    appRole: value as (typeof APP_ROLES)[number],
                  });
                  await refetch();
                  toast.success("Perfil atualizado.");
                }}
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APP_ROLES.map(role => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <p className="font-mono text-[11px] text-muted-foreground">
                {formatDate(user.lastSignedIn)}
              </p>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs font-medium md:w-auto"
                  disabled={sendInvitation.isPending || !user.email}
                  onClick={() =>
                    handleSendInvitation(user.id, user.email || undefined)
                  }
                  title={
                    user.email
                      ? `Enviar instruções de primeiro acesso para ${user.email}`
                      : "Participante sem e-mail cadastrado"
                  }
                >
                  <Send className="mr-1.5 h-3.5 w-3.5 text-primary" />
                  Enviar Instruções
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Histórico operacional */}
      <section className="technical-panel overflow-hidden">
        <header className="border-b bg-muted/30 p-5">
          <p className="data-label">Histórico operacional</p>
          <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-.025em]">
            Notificações recentes
          </h2>
        </header>
        {data.notificationLogs.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">
            Nenhuma notificação registrada até o momento.
          </p>
        ) : (
          <div className="divide-y paper-rule">
            {data.notificationLogs.map(log => (
              <div
                key={log.id}
                className="grid gap-3 px-4 py-3.5 md:grid-cols-[130px_1fr_180px_100px] md:items-center"
              >
                <span className="data-label text-primary">
                  {log.event.replaceAll("_", " ")}
                </span>
                <div>
                  <p className="text-sm font-semibold">{log.activityTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {log.responsibleName}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {log.attempts} tentativa(s)
                  {log.errorMessage ? (
                    <>
                      <br />
                      {log.errorMessage}
                    </>
                  ) : null}
                </p>
                <StatusBadge
                  status={
                    log.status === "enviado"
                      ? "concluído"
                      : log.status === "falhou"
                      ? "atrasado"
                      : "pendente"
                  }
                />
              </div>
            ))}
          </div>
        )}
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
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Conteúdo do E-mail Enviado
                </Label>
                <pre className="mt-1.5 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-md border bg-card p-3 font-mono text-xs leading-relaxed text-foreground/90">
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

export default function AdministrationPage() {
  return (
    <AdminGate>
      <AdministrationContent />
    </AdminGate>
  );
}
