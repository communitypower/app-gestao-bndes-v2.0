import { useMemo, useState } from "react";
import ActivityAccessGate from "@/components/ActivityAccessGate";
import { Metric, PageHeader, PageLoading, SectionMark, StatusBadge } from "@/components/EditorialUI";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/format";
import { groupDisplayName } from "../../../shared/groupDisplay";
import { ArrowUpRight, BookOpen, CheckCircle2, FilePenLine, GitMerge, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

function DashboardContent() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.dashboard.overview.useQuery();
  const { data: governance, isLoading: governanceLoading } = trpc.governance.overview.useQuery();
  const { data: accessStatus } = trpc.administration.status.useQuery();
  const { data: activities = [] } = trpc.activities.list.useQuery();
  const { data: interfaces, isLoading: interfacesLoading } =
    trpc.interfaces.list.useQuery();
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const approveP0 = trpc.governance.approveP0.useMutation();
  const monthlyActivities = useMemo(() => {
    if (!data || selectedMonth === null) return [];
    const monthStart = new Date(new Date(data.settings.projectStartAt).getFullYear(), new Date(data.settings.projectStartAt).getMonth() + selectedMonth, 1).getTime();
    const monthEnd = new Date(new Date(data.settings.projectStartAt).getFullYear(), new Date(data.settings.projectStartAt).getMonth() + selectedMonth + 1, 1).getTime();
    return activities.filter(activity => activity.parentActivityId === null && activity.dueAt >= monthStart && activity.dueAt < monthEnd);
  }, [activities, data, selectedMonth]);
  if (isLoading || governanceLoading || interfacesLoading || !data || !interfaces || !governance) return <PageLoading />;
  const start = new Date(data.settings.projectStartAt);
  const end = new Date(data.settings.projectEndAt);
  const months = Array.from({ length: 6 }, (_, index) => {
    const monthStart = new Date(start.getFullYear(), start.getMonth() + index, 1);
    const monthEnd = new Date(start.getFullYear(), start.getMonth() + index + 1, 1);
    return { label: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(monthStart).replace(".", ""), startAt: monthStart.getTime(), endAt: monthEnd.getTime() };
  });
  const selectedMonthData = selectedMonth === null ? null : months[selectedMonth];
  const blockedInterfaces = interfaces.filter(item => {
    return item.status !== "resolvida" && item.blockingClass === "prioritária";
  });

  const registerP0Approval = async () => {
    try {
      await approveP0.mutateAsync({});
      await Promise.all([
        utils.governance.overview.invalidate(),
        utils.dashboard.overview.invalidate(),
      ]);
      toast.success("A autorização para implementação do P0 foi registrada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível registrar a aprovação do P0.");
    }
  };

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Gestão da execução"
        title="Visão geral do projeto"
        description={`Controle documental do Estudo, no período de ${formatDate(start)} a ${formatDate(end)}. A estrutura reúne 5 tomos, ${data.hierarchy.parentCount} capítulos e ${data.hierarchy.stepCount} seções de trabalho, conforme o Anexo B do Plano de Trabalho — UFRJ, 26 de agosto.`}
        index="01 — Visão geral"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Tomos" value="5" note="Apresentação e Tomos I–IV" accent />
        <Metric label="Capítulos" value={data.hierarchy.parentCount} note="Coordenação e consolidação editorial" />
        <Metric label="Seções / atividades" value={data.hierarchy.stepCount} note="Execução, revisão e interfaces" />
        <Metric label="Progresso geral" value={`${data.overallProgress}%`} note={`${data.counts.concluded} de ${data.counts.total} capítulos concluídos`} />
        <Metric label="Atrasadas" value={data.counts.delayed} note="Monitoramento diário de prazo" />
      </section>

      <section className="technical-panel overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b bg-muted/30 p-5">
          <div>
            <p className="data-label">Acompanhamento consolidado</p>
            <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-.025em]">Execução por tomo</h2>
          </div>
          <Link href="/atividades" className="text-xs font-semibold text-primary hover:underline">Abrir atividades por tomo <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></Link>
        </div>
        <div className="grid divide-y paper-rule sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-5">
          {data.byTome.map(tome => (
            <Link href="/atividades" key={tome.tome} className="group min-w-0 p-4 hover:bg-muted/35">
              <p className="data-label text-primary">{tome.tome}</p>
              <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5">{tome.title}</p>
              <div className="mt-4 flex items-end justify-between gap-3"><span className="font-mono text-2xl font-semibold">{tome.progress}%</span><span className="text-[11px] text-muted-foreground">{tome.chapterCount} capítulo{tome.chapterCount === 1 ? "" : "s"}</span></div>
              <Progress value={tome.progress} className="mt-2 h-1.5 bg-muted" />
              <p className="mt-3 text-[11px] leading-4 text-muted-foreground">{tome.delayed ? `${tome.delayed} atraso${tome.delayed === 1 ? "" : "s"}` : `${tome.open} em acompanhamento`}{tome.nextDueAt ? ` · próximo: ${formatDate(tome.nextDueAt)}` : ""}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="technical-panel overflow-hidden">
        <div className="grid gap-5 p-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
          <div className={`flex h-11 w-11 items-center justify-center rounded-md ${governance.p0Approval ? "bg-[#2F6B4F]/10 text-[#2F6B4F]" : "bg-primary/10 text-primary"}`}>
            {governance.p0Approval ? <CheckCircle2 className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          </div>
          <div>
            <p className="data-label text-primary">Governança do plano de revisão</p>
            <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-.025em]">Implementação do pacote P0</h2>
            {governance.p0Approval ? (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Aprovada por {governance.p0Approval.decidedByName} em {formatDate(governance.p0Approval.decidedAt)}. O registro é mantido como decisão de governança.</p>
            ) : (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Aguardando aprovação administrativa para iniciar workflow documental, revisor obrigatório e painel de bloqueios.</p>
            )}
          </div>
          {governance.p0Approval ? (
            <StatusBadge status="concluído" />
          ) : accessStatus?.isAdmin ? (
            <Button onClick={registerP0Approval} disabled={approveP0.isPending}>
              <ShieldCheck className="mr-2 h-4 w-4" /> {approveP0.isPending ? "Registrando…" : "Aprovar implementação do P0"}
            </Button>
          ) : (
            <span className="text-xs leading-5 text-muted-foreground">Aprovação disponível ao perfil administrativo.</span>
          )}
        </div>
      </section>

      {governance.projectEditorial && (
        <section className="grid gap-4 border-y paper-rule bg-muted/20 p-5 md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] md:items-center">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <div>
            <p className="data-label text-primary">Coordenação editorial do projeto</p>
            <p className="mt-2 text-sm font-semibold">{governance.projectEditorial.coordinatorName}</p>
            <p className="mt-1 text-xs text-muted-foreground">Substituto: {governance.projectEditorial.substituteName}</p>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">A documentação recebida até o dia 15 segue para consolidação, recebimento técnico e editoração entre os dias 16 e 29, antes da entrega contratual ao BNDES.</p>
        </section>
      )}

      <section className="technical-panel grid gap-4 p-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
        <FilePenLine className="h-6 w-6 text-primary" />
        <div>
          <p className="data-label text-primary">Controle documental</p>
          <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-.025em]">Seção → capítulo → tomo → projeto</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">A ficha de cada atividade apresenta a entrega interna, a entrega ao BNDES, o checklist, as interfaces prioritárias e a próxima decisão humana permitida.</p>
        </div>
        <Link href="/atividades" className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline">Abrir fluxo documental <ArrowUpRight className="h-3.5 w-3.5" /></Link>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <div className="technical-panel overflow-hidden">
          <div className="flex items-end justify-between gap-5 border-b bg-muted/30 p-5">
            <div>
              <p className="data-label">Cronograma mestre</p>
              <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-.025em]">Execução por frente</h2>
            </div>
            <span className="font-mono text-xs text-muted-foreground">ago. 2026 — jan. 2027</span>
          </div>
          <div className="grid grid-cols-6 border-b bg-card">
            {months.map((month, index) => (
              <button type="button" onClick={() => setSelectedMonth(index)} className="border-r paper-rule px-2 py-3 text-center last:border-r-0 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" key={month.label} aria-label={`Listar atividades com entrega em ${month.label}`}>
                <p className="data-label">M{index + 1}</p>
                <p className="mt-1 text-sm font-medium capitalize">{month.label}</p>
              </button>
            ))}
          </div>
          <div className="divide-y paper-rule">
            {data.bySection.map(section => {
              const sectionInterfaces = interfaces.filter(
                item =>
                  item.status !== "resolvida" &&
                  item.sections.some(link => link.sectionId === section.id)
              );
              const openInterfaces = sectionInterfaces.length;
              return (
                <div className="grid items-center gap-3 px-4 py-3.5 sm:grid-cols-[58px_minmax(0,1fr)_110px]" key={section.id}>
                  <SectionMark code={section.code} />
                  <div>
                    {section.primaryActivityId ? <Link href={`/atividades?ficha=${section.primaryActivityId}`} className="block rounded-sm py-1 hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="group inline-flex min-w-0 items-center gap-1 truncate font-semibold text-foreground"><span className="truncate">{section.title}</span><ArrowUpRight className="h-3 w-3 shrink-0" /></span><span className="font-mono font-medium">{section.progress}%</span></div><p className="mb-2 line-clamp-1 text-xs leading-5 text-muted-foreground">{section.officialDescription}</p><p className="mb-2 text-[11px] leading-4 text-muted-foreground">{section.total} atividade{section.total === 1 ? "" : "s"}-mãe · {section.subitemCount} etapa{section.subitemCount === 1 ? "" : "s"} de execução</p><Progress value={section.progress} className="h-1.5 bg-muted" /></Link> : <><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="truncate font-semibold text-foreground">{section.title}</span><span className="font-mono font-medium">{section.progress}%</span></div><p className="mb-2 line-clamp-1 text-xs leading-5 text-muted-foreground">{section.officialDescription}</p><p className="mb-2 text-[11px] leading-4 text-muted-foreground">{section.total} atividade{section.total === 1 ? "" : "s"}-mãe · {section.subitemCount} etapa{section.subitemCount === 1 ? "" : "s"} de execução</p><Progress value={section.progress} className="h-1.5 bg-muted" /></>}
                    {sectionInterfaces.slice(0, 2).map(item => {
                      const latestEvent = item.events[item.events.length - 1];
                      const isBlocked = blockedInterfaces.some(blocked => blocked.id === item.id);
                      return (
                        <Link
                          key={item.id}
                          href="/interfaces"
                          className={`mt-2 block rounded-sm border-l-2 px-3 py-2 text-xs leading-5 ${isBlocked ? "border-[#B5482D] bg-[#B5482D]/10" : "border-primary bg-primary/5"}`}
                        >
                          <span className="font-semibold">{isBlocked ? "Bloqueada · " : ""}{item.title}</span>
                          <span className="text-muted-foreground"> · {item.status}</span>
                          <span className="mt-1 block text-muted-foreground">
                            {item.groups.map(group => groupDisplayName(group.name)).join(" · ")} · {item.responsibleName}
                          </span>
                          {latestEvent && (
                            <span className="mt-1 block text-muted-foreground">
                              Encaminhamento: {latestEvent.summary}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                  <span className="data-label text-right">
                    {openInterfaces} interface{openInterfaces === 1 ? "" : "s"} aberta{openInterfaces === 1 ? "" : "s"}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="border-t bg-muted/25 px-4 py-3">
            <Link href="/atividades" className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline">
              Ver atividades-mãe e etapas <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="technical-panel overflow-hidden">
          <div className="border-b bg-muted/30 p-5">
            <p className="data-label">Próximas entregas</p>
            <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-.025em]">Prazos e responsáveis</h2>
          </div>
          <div className="divide-y paper-rule">
            {data.upcoming.map((item, index) => (
              <Link href={`/atividades?ficha=${item.id}`} className="grid grid-cols-[28px_1fr] gap-3 px-4 py-4 hover:bg-muted/35" key={item.id}>
                <span className="font-mono text-[11px] text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold text-primary">{item.sectionCode}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-5">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {item.officialDescription}
                  </p>
                  <p className="font-mono mt-2 text-[10px] text-muted-foreground">{item.responsibleName} · {formatDate(item.dueAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="technical-panel grid overflow-hidden md:grid-cols-2 xl:grid-cols-4">
        <Link href="/equipe" className="group flex items-center gap-4 border-b p-4 hover:bg-muted/35 md:border-r xl:border-b-0">
          <Users className="h-5 w-5 text-primary" /><div><p className="data-label">Equipe</p><p className="mt-1 text-sm font-medium text-muted-foreground">{data.teamCount} participantes ativos</p></div>
        </Link>
        <Link href="/biblioteca" className="group flex items-center gap-4 border-b p-4 hover:bg-muted/35 xl:border-b-0 xl:border-r">
          <BookOpen className="h-5 w-5 text-primary" /><div><p className="data-label">Biblioteca</p><p className="mt-1 text-sm font-medium text-muted-foreground">{data.libraryCount} referências organizadas</p></div>
        </Link>
        <Link href="/producao" className="group flex items-center gap-4 border-b p-4 hover:bg-muted/35 md:border-r md:border-b-0">
          <FilePenLine className="h-5 w-5 text-primary" /><div><p className="data-label">Produção</p><p className="mt-1 text-sm font-medium text-muted-foreground">{data.materialCount} materiais em elaboração</p></div>
        </Link>
        <Link href="/interfaces" className="group flex items-center gap-4 p-4 hover:bg-muted/35">
          <GitMerge className={`h-5 w-5 ${blockedInterfaces.length ? "text-[#B5482D]" : "text-primary"}`} /><div><p className="data-label">Interfaces</p><p className="mt-1 text-sm font-medium text-muted-foreground">{blockedInterfaces.length ? `${blockedInterfaces.length} bloqueio${blockedInterfaces.length === 1 ? "" : "s"} prioritário${blockedInterfaces.length === 1 ? "" : "s"}` : `${interfaces.filter(item => item.status !== "resolvida").length} pontos abertos`}</p></div>
        </Link>
      </section>

      <Dialog open={selectedMonth !== null} onOpenChange={open => { if (!open) setSelectedMonth(null); }}>
        <DialogContent className="max-h-[80vh] overflow-y-auto bg-card sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl font-semibold">Atividades com entrega em {selectedMonthData?.label}</DialogTitle>
            <DialogDescription>Selecione uma atividade para abrir a ficha completa e revisar suas informações.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 divide-y border-y paper-rule">
            {monthlyActivities.length ? monthlyActivities.map(activity => <Link key={activity.id} href={`/atividades?ficha=${activity.id}`} onClick={() => setSelectedMonth(null)} className="block py-4 hover:text-primary"><div className="flex items-center justify-between gap-3"><span className="font-mono text-xs font-semibold text-primary">{activity.planCode ?? activity.sectionCode}</span><StatusBadge status={activity.status} /></div><p className="mt-2 text-sm font-semibold">{activity.title}</p><p className="mt-1 text-xs text-muted-foreground">Entrega: {formatDate(activity.dueAt)} · Abrir ficha completa</p></Link>) : <p className="py-8 text-center text-sm text-muted-foreground">Não há atividades-mãe com entrega prevista neste mês.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Home() {
  return <ActivityAccessGate><DashboardContent /></ActivityAccessGate>;
}
