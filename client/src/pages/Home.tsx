import { Metric, PageHeader, PageLoading, SectionMark, StatusBadge } from "@/components/EditorialUI";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/format";
import { BookOpen, FilePenLine, GitMerge, Users } from "lucide-react";

export default function Home() {
  const { data, isLoading } = trpc.dashboard.overview.useQuery();
  const { data: governance, isLoading: governanceLoading } = trpc.governance.overview.useQuery();
  const { data: interfaces, isLoading: interfacesLoading } = trpc.interfaces.list.useQuery();

  if (isLoading || governanceLoading || interfacesLoading || !data || !interfaces || !governance) {
    return <PageLoading />;
  }

  const start = new Date(data.settings.projectStartAt);
  const end = new Date(data.settings.projectEndAt);
  const months = Array.from({ length: 6 }, (_, index) => {
    const monthStart = new Date(start.getFullYear(), start.getMonth() + index, 1);
    return {
      label: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(monthStart).replace(".", ""),
      monthNum: index + 1,
    };
  });

  const blockedInterfaces = interfaces.filter(item => {
    return item.status !== "resolvida" && item.blockingClass === "prioritária";
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gestão da execução"
        title="Visão geral do projeto"
        description={`Controle documental do Estudo, no período de ${formatDate(start)} a ${formatDate(end)}. A estrutura reúne 5 tomos, ${data.hierarchy.parentCount} capítulos e ${data.hierarchy.stepCount} seções de trabalho, conforme o Anexo B do Plano de Trabalho — UFRJ, 26 de agosto.`}
        index="01 — Visão geral"
        action={<span className="font-mono text-xs text-muted-foreground">Implementação do pacote P0</span>}
      />

      {/* Métricas consolidadas */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Tomos" value="5" note="Apresentação e Tomos I–IV" accent />
        <Metric label="Capítulos" value={data.hierarchy.parentCount} note="Coordenação e consolidação editorial" />
        <Metric label="Seções / atividades" value={data.hierarchy.stepCount} note="Execução, revisão e interfaces" />
        <Metric label="Progresso geral" value={`${data.overallProgress}%`} note={`${data.counts.concluded} de ${data.counts.total} capítulos concluídos`} />
        <Metric label="Atrasadas" value={data.counts.delayed} note="Monitoramento diário de prazo" />
      </section>

      {/* Execução por tomo (Estático / Somente Leitura) */}
      <section className="technical-panel overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b bg-muted/30 p-5">
          <div>
            <p className="data-label">Acompanhamento consolidado</p>
            <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-.025em]">Execução por tomo</h2>
          </div>
          <span className="font-mono text-xs text-muted-foreground">5 tomos estruturados</span>
        </div>
        <div className="grid divide-y paper-rule sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-5">
          {data.byTome.map(tome => (
            <div key={tome.tome} className="min-w-0 p-4">
              <p className="data-label text-primary">{tome.tome}</p>
              <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5">{tome.title}</p>
              <div className="mt-4 flex items-end justify-between gap-3">
                <span className="font-mono text-2xl font-semibold">{tome.progress}%</span>
                <span className="text-[11px] text-muted-foreground">{tome.chapterCount} capítulo{tome.chapterCount === 1 ? "" : "s"}</span>
              </div>
              <Progress value={tome.progress} className="mt-2 h-1.5 bg-muted" />
              <p className="mt-3 text-[11px] leading-4 text-muted-foreground">
                {tome.delayed ? `${tome.delayed} atraso${tome.delayed === 1 ? "" : "s"}` : `${tome.open} em acompanhamento`}
                {tome.nextDueAt ? ` · próximo: ${formatDate(tome.nextDueAt)}` : ""}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Cronograma mestre e Próximas entregas (Estático / Somente Leitura) */}
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
            {months.map((month) => (
              <div className="border-r paper-rule px-2 py-3 text-center last:border-r-0" key={month.label}>
                <p className="data-label">M{month.monthNum}</p>
                <p className="mt-1 text-sm font-medium capitalize">{month.label}</p>
              </div>
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
                    <div className="mb-1.5 flex justify-between gap-3 text-xs">
                      <span className="truncate font-semibold text-foreground">{section.title}</span>
                      <span className="font-mono font-medium">{section.progress}%</span>
                    </div>
                    <p className="mb-2 line-clamp-1 text-xs leading-5 text-muted-foreground">{section.officialDescription}</p>
                    <p className="text-[11px] leading-4 text-muted-foreground">
                      {section.total} atividade{section.total === 1 ? "" : "s"}-mãe · {section.subitemCount} etapa{section.subitemCount === 1 ? "" : "s"} de execução
                    </p>
                    <Progress value={section.progress} className="mt-2 h-1.5 bg-muted" />
                  </div>
                  <span className="data-label text-right">
                    {openInterfaces} interface{openInterfaces === 1 ? "" : "s"} aberta{openInterfaces === 1 ? "" : "s"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="technical-panel overflow-hidden">
          <div className="border-b bg-muted/30 p-5">
            <p className="data-label">Próximas entregas</p>
            <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-.025em]">Prazos e responsáveis</h2>
          </div>
          <div className="divide-y paper-rule">
            {data.upcoming.map((item, index) => (
              <div className="grid grid-cols-[28px_1fr] gap-3 px-4 py-4" key={item.id}>
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Indicadores gerais (Estático / Somente Leitura) */}
      <section className="technical-panel grid overflow-hidden md:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-4 border-b p-4 md:border-r xl:border-b-0">
          <Users className="h-5 w-5 text-primary" />
          <div>
            <p className="data-label">Equipe</p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">{data.teamCount} participantes ativos</p>
          </div>
        </div>
        <div className="flex items-center gap-4 border-b p-4 xl:border-b-0 xl:border-r">
          <BookOpen className="h-5 w-5 text-primary" />
          <div>
            <p className="data-label">Biblioteca</p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">{data.libraryCount} referências organizadas</p>
          </div>
        </div>
        <div className="flex items-center gap-4 border-b p-4 md:border-r md:border-b-0">
          <FilePenLine className="h-5 w-5 text-primary" />
          <div>
            <p className="data-label">Produção</p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">{data.materialCount} materiais em elaboração</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-4">
          <GitMerge className={`h-5 w-5 ${blockedInterfaces.length ? "text-[#B5482D]" : "text-primary"}`} />
          <div>
            <p className="data-label">Interfaces</p>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {blockedInterfaces.length
                ? `${blockedInterfaces.length} bloqueio${blockedInterfaces.length === 1 ? "" : "s"} prioritário${blockedInterfaces.length === 1 ? "" : "s"}`
                : `${interfaces.filter(item => item.status !== "resolvida").length} pontos abertos`}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
