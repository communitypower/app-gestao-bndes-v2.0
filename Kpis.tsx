import ActivityAccessGate from "@/components/ActivityAccessGate";
import { PageHeader, PageLoading, SectionMark } from "@/components/EditorialUI";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { BarChart3, ChevronRight, FileCheck2, FileStack, GitMerge, Layers3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "wouter";

const STAGE_COLORS: Record<string, string> = {
  "Preparação": "#99AAA7",
  "Execução": "#3F7774",
  "Revisão da seção": "#B68738",
  "Consolidação": "#267C9B",
  "Aprovação": "#7B5F9D",
  "Conclusão": "#1E5F52",
};

function KpiSummary({
  label,
  value,
  detail,
  icon: Icon,
  accent = "text-primary",
}: {
  label: string;
  value: number;
  detail: string;
  icon: typeof FileStack;
  accent?: string;
}) {
  return (
    <div className="technical-panel min-h-[142px] border-t-4 border-t-primary p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="editorial-kicker text-muted-foreground">{label}</p>
        <Icon className={`h-4 w-4 ${accent}`} />
      </div>
      <p className="font-display mt-4 text-5xl font-medium tracking-[-.055em]">{value}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}

export default function KpisPage() {
  const { data, isLoading, error } = trpc.dashboard.documentKpis.useQuery();

  if (isLoading) return <PageLoading />;

  return (
    <ActivityAccessGate>
      <div className="editorial-enter space-y-8 pb-12">
        <PageHeader
          eyebrow="Acompanhamento executivo"
          title="Indicadores do fluxo documental"
          description="Acompanhe quantos documentos estão em cada fase de preparação, execução, revisão, consolidação e aprovação do Estudo BNDES."
          action={
            <Link href="/atividades">
              <Button className="gap-2 rounded-md uppercase tracking-[.08em]">
                Consultar atividades <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          }
        />

        {error || !data ? (
          <div className="technical-panel border-t-4 border-t-destructive p-8">
            <p className="editorial-kicker text-destructive">Consulta indisponível</p>
            <p className="mt-3 text-sm text-muted-foreground">Não foi possível consolidar os indicadores documentais neste momento.</p>
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Síntese dos KPIs documentais">
              <KpiSummary label="Documentos acompanhados" value={data.totalDocuments} detail="Capítulos e seções da estrutura canônica ativa." icon={FileStack} />
              <KpiSummary label="Capítulos" value={data.chapters} detail="Unidades de consolidação editorial do estudo." icon={Layers3} />
              <KpiSummary label="Seções de trabalho" value={data.sections} detail="Unidades de execução, revisão e submissão." icon={BarChart3} />
              <KpiSummary label="Interfaces prioritárias" value={data.priorityInterfaceBlockers} detail="Pendências que bloqueiam consolidações e aprovações." icon={GitMerge} accent={data.priorityInterfaceBlockers > 0 ? "text-destructive" : "text-primary"} />
            </section>

            <section className="grid gap-7 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
              <div className="technical-panel border-t-4 border-t-primary p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <SectionMark code="Funil de conclusão" />
                    <h2 className="font-display mt-3 text-3xl font-medium tracking-[-.04em]">Documentos por fase</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">A contagem considera cada capítulo e cada seção ativa uma única vez, de acordo com seu estado documental atual.</p>
                  </div>
                  <Badge variant="outline" className="rounded-sm border-primary/30 bg-primary/5 px-3 py-1 text-primary">{data.concluded} concluídos</Badge>
                </div>
                <div className="mt-7 h-[390px]" aria-label="Gráfico de documentos por fase documental">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.stages} layout="vertical" margin={{ top: 0, right: 48, left: 10, bottom: 0 }}>
                      <CartesianGrid horizontal={false} stroke="#D9E3E1" />
                      <XAxis type="number" allowDecimals={false} tick={{ fill: "#55726E", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="label" type="category" width={165} tick={{ fill: "#244845", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: "#EEF3F1" }} contentStyle={{ borderRadius: 4, borderColor: "#B9CDCA", fontSize: 12 }} formatter={(value: number, _name, item) => [`${value} documentos · ${item.payload.chapters} capítulos · ${item.payload.sections} seções`, "Quantidade"]} />
                      <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={22}>
                        {data.stages.map(stage => <Cell key={stage.key} fill={STAGE_COLORS[stage.stage] ?? "#3F7774"} />)}
                        <LabelList dataKey="total" position="right" fill="#244845" fontSize={11} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="technical-panel border-t-4 border-t-[#B68738] p-6">
                <SectionMark code="Leitura para coordenação" />
                <h2 className="font-display mt-3 text-3xl font-medium tracking-[-.04em]">Como usar os KPIs</h2>
                <div className="mt-7 space-y-5">
                  {[
                    ["1", "Execução", "As seções saem de Planejada para Em elaboração quando o executor inicia o trabalho."],
                    ["2", "Revisão", "A submissão e o parecer do revisor deslocam o documento pela revisão da seção."],
                    ["3", "Consolidação", "O coordenador do capítulo consolida somente após checklist concluído e interfaces prioritárias resolvidas."],
                    ["4", "Aprovação", "Tomos e projeto registram as decisões finais até a documentação oficial."],
                  ].map(([number, title, description]) => (
                    <div key={number} className="grid grid-cols-[28px_1fr] gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
                      <span className="font-display text-2xl text-[#B68738]">{number}</span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{title}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-7 border-t border-border pt-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary"><FileCheck2 className="h-4 w-4" /> Documento concluído</div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">Somente a fase “Aprovada para documentação final” é contabilizada como conclusão do workflow.</p>
                </div>
              </div>
            </section>

            <section className="technical-panel border-t border-border p-6" aria-label="Tabela detalhada dos documentos por fase">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <SectionMark code="Detalhamento por fase" />
                  <h2 className="font-display mt-3 text-2xl font-medium tracking-[-.035em]">Capítulos e seções em cada etapa</h2>
                </div>
                <p className="text-xs text-muted-foreground">Atualizado na consulta: {new Date(data.updatedAt).toLocaleString("pt-BR")}</p>
              </div>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="border-y border-border bg-muted/45 text-xs uppercase tracking-[.08em] text-muted-foreground">
                    <tr><th className="px-4 py-3 font-semibold">Etapa</th><th className="px-4 py-3 font-semibold">Nível</th><th className="px-4 py-3 text-right font-semibold">Capítulos</th><th className="px-4 py-3 text-right font-semibold">Seções</th><th className="px-4 py-3 text-right font-semibold">Total</th></tr>
                  </thead>
                  <tbody>
                    {data.stages.map(stage => (
                      <tr key={stage.key} className="border-b border-border/70 last:border-b-0">
                        <td className="px-4 py-3 font-medium text-foreground">{stage.label}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className="rounded-sm text-[10px]">{stage.stage}</Badge></td>
                        <td className="px-4 py-3 text-right tabular-nums">{stage.chapters}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{stage.sections}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">{stage.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </ActivityAccessGate>
  );
}
