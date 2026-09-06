import { Metric, PageHeader, PageLoading, SectionMark, StatusBadge } from "@/components/EditorialUI";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/format";
import { groupDisplayName } from "../../../shared/groupDisplay";
import { BookOpen, Calendar, CheckCircle2, FilePenLine, GitMerge, Layers, ShieldCheck, Users } from "lucide-react";

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

  const activeInterfaces = interfaces.filter(item => item.status !== "resolvida");
  const blockedInterfaces = interfaces.filter(
    item => item.status !== "resolvida" && item.blockingClass === "prioritária"
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Painel executivo do estudo"
        title="Visão geral do projeto"
        description={`Controle executivo e documental do Relatório 1 — Indústria Naval: Diagnóstico e Perspectivas (${formatDate(start)} a ${formatDate(end)}). A estrutura técnica reúne 5 tomos, ${data.hierarchy.parentCount} capítulos e ${data.hierarchy.stepCount} seções de trabalho, conforme o Anexo B do Plano de Trabalho — UFRJ.`}
        index="01 — Visão geral"
      />

      {/* 1. Indicadores Executivos Consolidados */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric
          label="Progresso geral"
          value={`${data.overallProgress}%`}
          note={`${data.counts.concluded} de ${data.counts.total} capítulos concluídos`}
          accent
        />
        <Metric
          label="Estrutura analítica"
          value={`5 Tomos · ${data.hierarchy.parentCount} Cap.`}
          note={`${data.hierarchy.stepCount} seções analíticas`}
        />
        <Metric
          label="Prazos & entregas"
          value={data.counts.delayed > 0 ? `${data.counts.delayed} atraso${data.counts.delayed === 1 ? "" : "s"}` : "No prazo"}
          note={`${data.upcoming.length} entregas monitoradas`}
        />
        <Metric
          label="Governança & P0"
          value={governance.p0Approval ? "Homologada" : "Vigente"}
          note="Implementação do pacote P0"
        />
        <Metric
          label="Articulação & equipe"
          value={`${data.teamCount} membros`}
          note={`${activeInterfaces.length} interfaces em acompanhamento`}
        />
      </section>

      {/* 2. Matriz Executiva dos 5 Tomos */}
      <section className="technical-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Execução por tomo</h2>
          </div>
          <span className="font-mono text-xs text-muted-foreground">5 tomos estruturados · Anexo B</span>
        </div>
        <div className="grid divide-y paper-rule sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-5">
          {data.byTome.map(tome => (
            <div key={tome.tome} className="min-w-0 p-4 transition-colors hover:bg-muted/10">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">{tome.tome}</span>
                <span className="font-mono text-xs font-semibold">{tome.progress}%</span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-xs font-semibold leading-snug text-foreground">{tome.title}</p>
              <Progress value={tome.progress} className="mt-3 h-1.5 bg-muted" />
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{tome.chapterCount} cap. · {tome.stepCount} seções</span>
                <span>{tome.delayed ? `${tome.delayed} atr.` : `${tome.open} ativ.`}</span>
              </div>
              {tome.nextDueAt && (
                <p className="font-mono mt-1 text-[10px] text-muted-foreground">
                  Entrega: {formatDate(tome.nextDueAt)}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 3. Painel Operacional Dividido: Entregas x Interfaces e Governança */}
      <section className="grid gap-5 lg:grid-cols-12">
        {/* Coluna Esquerda: Próximas Entregas (7 colunas) */}
        <div className="technical-panel flex flex-col overflow-hidden lg:col-span-7">
          <div className="flex items-center justify-between border-b bg-muted/20 px-4 py-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold tracking-tight text-foreground">Próximas entregas e prazos</h2>
            </div>
            <span className="font-mono text-xs text-muted-foreground">{data.upcoming.length} marcos</span>
          </div>
          <div className="divide-y paper-rule">
            {data.upcoming.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Nenhuma entrega pendente registrada para os próximos períodos.
              </div>
            ) : (
              data.upcoming.slice(0, 6).map((item, index) => (
                <div key={item.id} className="flex items-start gap-3 p-3.5 transition-colors hover:bg-muted/10">
                  <span className="font-mono mt-0.5 text-xs font-medium text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <SectionMark code={item.sectionCode} />
                      <StatusBadge status={item.status} />
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {formatDate(item.dueAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs font-semibold text-foreground">{item.title}</p>
                    {item.officialDescription && (
                      <p className="mt-1 line-clamp-1 text-[11px] leading-relaxed text-muted-foreground">
                        {item.officialDescription}
                      </p>
                    )}
                    <p className="font-mono mt-1 text-[10px] text-muted-foreground">
                      Responsável: {item.responsibleName}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Coluna Direita: Interfaces Críticas & Síntese de Governança (5 colunas) */}
        <div className="space-y-5 lg:col-span-5">
          {/* Interfaces em Destaque */}
          <div className="technical-panel overflow-hidden">
            <div className="flex items-center justify-between border-b bg-muted/20 px-4 py-3">
              <div className="flex items-center gap-2">
                <GitMerge className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold tracking-tight text-foreground">Interfaces e articulações</h2>
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                {activeInterfaces.length} ativas
              </span>
            </div>
            <div className="divide-y paper-rule">
              {activeInterfaces.length === 0 ? (
                <div className="p-5 text-center text-xs text-muted-foreground">
                  Todas as interfaces técnicas foram alinhadas e resolvidas.
                </div>
              ) : (
                activeInterfaces.slice(0, 3).map(item => {
                  const isBlocked = item.blockingClass === "prioritária";
                  const latestEvent = item.events?.[item.events.length - 1];
                  return (
                    <div key={item.id} className="p-3 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground">
                          {isBlocked && <span className="text-[#B5482D]">[Bloqueio] </span>}
                          {item.title}
                        </span>
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {item.groups.map(g => groupDisplayName(g.name)).join(" ↔ ")}
                      </p>
                      {latestEvent && (
                        <p className="mt-1 text-[11px] italic text-muted-foreground">
                          Encaminhamento: {latestEvent.summary}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Síntese de Governança & Ciclo Editorial */}
          <div className="technical-panel p-4">
            <div className="flex items-center gap-2 text-primary">
              {governance.p0Approval ? <CheckCircle2 className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              <span className="text-xs font-semibold uppercase tracking-wider">Governança editorial & P0</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {governance.p0Approval
                ? `Pacote de governança P0 homologado por ${governance.p0Approval.decidedByName} em ${formatDate(governance.p0Approval.decidedAt)}.`
                : "Estrutura documental e matriz de interfaces ativas sob governança da Coordenação Geral (UFRJ)."}
            </p>
            {governance.projectEditorial && (
              <div className="mt-3 border-t pt-2.5 text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">Coordenação editorial: </span>
                {governance.projectEditorial.coordinatorName} (Substituto: {governance.projectEditorial.substituteName})
              </div>
            )}
            <div className="mt-2 rounded bg-muted/40 p-2 text-[10px] leading-tight text-muted-foreground">
              <span className="font-semibold text-foreground">Ciclo mensal: </span>
              Recebimento de seções até dia 15 · Editoração dias 16–29 · Envio BNDES dia 30.
            </div>
          </div>
        </div>
      </section>

      {/* 4. Cronograma Mestre e Panorama das Frentes */}
      <section className="technical-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/20 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Panorama das frentes de trabalho</h2>
            <p className="text-[11px] text-muted-foreground">30 capítulos analíticos e seções correspondentes</p>
          </div>
          {/* Marcadores de Meses Contratuais */}
          <div className="flex items-center gap-1.5">
            {months.map(month => (
              <div
                key={month.label}
                className="rounded border bg-card px-2 py-1 text-center"
              >
                <p className="data-label text-[9px]">M{month.monthNum}</p>
                <p className="font-mono text-[10px] font-medium capitalize text-foreground">{month.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid divide-y paper-rule md:grid-cols-2 md:divide-x md:divide-y-0">
          {data.bySection.slice(0, 10).map(section => (
            <div key={section.id} className="flex items-start gap-3 p-3.5 transition-colors hover:bg-muted/10">
              <SectionMark code={section.code} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-semibold text-foreground">{section.title}</span>
                  <span className="font-mono text-xs font-medium">{section.progress}%</span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-[11px] leading-relaxed text-muted-foreground">
                  {section.officialDescription}
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{section.total} atividade{section.total === 1 ? "" : "s"} · {section.subitemCount} subitens</span>
                  <span>{section.concluded} concluído(s)</span>
                </div>
                <Progress value={section.progress} className="mt-1.5 h-1 bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Rodapé Analítico: Indicadores Gerais */}
      <section className="technical-panel grid overflow-hidden sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3 border-b p-3.5 sm:border-r lg:border-b-0">
          <Users className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Equipe</p>
            <p className="text-xs font-semibold text-foreground">{data.teamCount} participantes ativos</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border-b p-3.5 lg:border-b-0 lg:border-r">
          <BookOpen className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Biblioteca</p>
            <p className="text-xs font-semibold text-foreground">{data.libraryCount} referências organizadas</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border-b p-3.5 sm:border-r sm:border-b-0">
          <FilePenLine className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Produção</p>
            <p className="text-xs font-semibold text-foreground">{data.materialCount} materiais em elaboração</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3.5">
          <GitMerge className={`h-4 w-4 shrink-0 ${blockedInterfaces.length ? "text-[#B5482D]" : "text-primary"}`} />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Interfaces</p>
            <p className="text-xs font-semibold text-foreground">
              {blockedInterfaces.length
                ? `${blockedInterfaces.length} bloqueio${blockedInterfaces.length === 1 ? "" : "s"} prioritário${blockedInterfaces.length === 1 ? "" : "s"}`
                : `${activeInterfaces.length} pontos abertos`}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
