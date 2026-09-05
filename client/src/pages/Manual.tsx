import React, { useState } from "react";
import { Link } from "wouter";
import {
  BookOpen,
  ClipboardList,
  FileCheck2,
  Bell,
  Users,
  GitMerge,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Download,
  Copy,
  Check,
  HelpCircle,
  FileText,
  Workflow,
  Sparkles,
  Search,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";

export default function ManualPage() {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCopySummary = () => {
    const text = `Manual de Procedimentos — Estudo BNDES Indústria Naval\n\n1. Central de Ações (/atividades): Consulte diariamente suas pendências como Autor, Revisor ou Coordenação.\n2. Notificações: Verifique o sino no cabeçalho para alertas de revisões atribuídas e pareceres emitidos.\n3. Atualização de Etapas: Executores e coordenadores podem atualizar status e percentual concluído na Ficha da Atividade.\n4. Revisão Independente: Coordenadores designam revisores independentes; revisores avaliam pelo checklist em /producao.\n5. Interfaces: Registre demandas e insumos interdisciplinares em /interfaces.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    window.open("/MANUAL_DE_INSTRUCOES_EQUIPE.md", "_blank");
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner / Header */}
      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-gradient-to-br from-card via-card/95 to-primary/5 p-6 md:p-10 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-medium">
                BNDES · FEP (2026—2027)
              </Badge>
              <Badge variant="secondary" className="font-mono text-xs">
                Guia da Equipe Participante v2.0
              </Badge>
            </div>
            <h1 className="font-editorial text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Manual de Instruções e Procedimentos da Equipe
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Orientações operacionais passo a passo para pesquisadores autores, revisores técnicos independentes
              e coordenadores de frentes do Estudo Técnico da Indústria Naval Brasileira.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 pt-2 md:pt-0">
            <Button variant="outline" size="sm" onClick={handleCopySummary} className="gap-2 bg-background">
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied ? "Resumo copiado!" : "Copiar resumo rápido"}
            </Button>
            <Button size="sm" onClick={handleDownloadMarkdown} className="gap-2">
              <Download className="h-4 w-4" />
              Manual completo (.md)
            </Button>
          </div>
        </div>

        {/* Quick KPI Badges */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-border/60 pt-6">
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Escopo Analítico</p>
            <p className="text-xl font-bold text-foreground">30 Capítulos <span className="text-xs font-normal text-muted-foreground">(4 Tomos)</span></p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Equipe Ativa</p>
            <p className="text-xl font-bold text-foreground">8 Grupos Temáticos</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Governança</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Revisão por Pares</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Alertas Ativos</p>
            <p className="text-xl font-bold text-primary">Notificações em Tempo Real</p>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="papeis" className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1.5 bg-muted/60 p-1 sm:grid-cols-3 lg:grid-cols-6 rounded-lg">
          <TabsTrigger value="papeis" className="gap-2 py-2 text-xs font-medium">
            <Users className="h-3.5 w-3.5 text-primary" />
            Por Papel
          </TabsTrigger>
          <TabsTrigger value="acoes" className="gap-2 py-2 text-xs font-medium">
            <Bell className="h-3.5 w-3.5 text-amber-500" />
            Ações & Alertas
          </TabsTrigger>
          <TabsTrigger value="fluxo" className="gap-2 py-2 text-xs font-medium">
            <Workflow className="h-3.5 w-3.5 text-indigo-500" />
            Fluxo Editorial
          </TabsTrigger>
          <TabsTrigger value="visao-geral" className="gap-2 py-2 text-xs font-medium">
            <ClipboardList className="h-3.5 w-3.5 text-sky-500" />
            Módulos do Sistema
          </TabsTrigger>
          <TabsTrigger value="interfaces" className="gap-2 py-2 text-xs font-medium">
            <GitMerge className="h-3.5 w-3.5 text-teal-500" />
            Interfaces & Acervo
          </TabsTrigger>
          <TabsTrigger value="faq" className="gap-2 py-2 text-xs font-medium">
            <HelpCircle className="h-3.5 w-3.5 text-rose-500" />
            FAQ & Dúvidas
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PROCEDIMENTOS POR PAPEL */}
        <TabsContent value="papeis" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Card Coordenador */}
            <Card className="border-t-4 border-t-primary shadow-sm flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-primary/30 text-primary font-mono text-[11px]">
                    Liderança Técnica
                  </Badge>
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl">Coordenador de Grupo</CardTitle>
                <CardDescription>
                  Responsável pela integridade e entregas dos capítulos da sua frente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs leading-relaxed text-muted-foreground flex-1">
                <div className="space-y-2 rounded-md bg-muted/40 p-3 border border-border/50">
                  <p className="font-semibold text-foreground">Principais Tarefas:</p>
                  <ul className="list-inside list-disc space-y-1.5 text-foreground/80">
                    <li>Conferir o escopo oficial do capítulo (Anexo B).</li>
                    <li>Mapear e pactuar interfaces interdisciplinares com outros grupos temáticos.</li>
                    <li>Designar revisores técnicos independentes para cada seção.</li>
                    <li>Acompanhar e atualizar o status/progresso das etapas.</li>
                    <li>Homologar minutas após aprovação técnica dos revisores.</li>
                  </ul>
                </div>
                <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-2.5 text-[11px] text-amber-800 dark:text-amber-300">
                  <strong>Regra de Ouro:</strong> Os revisores devem pertencer preferencialmente a grupos distintos para assegurar avaliação isenta por pares.
                </div>
              </CardContent>
              <div className="p-6 pt-0">
                <Link href="/atividades">
                  <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                    Abrir Gestão de Atividades <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Card Autor / Executor */}
            <Card className="border-t-4 border-t-indigo-500 shadow-sm flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-indigo-500/30 text-indigo-500 font-mono text-[11px]">
                    Pesquisa & Redação
                  </Badge>
                  <FileText className="h-5 w-5 text-indigo-500" />
                </div>
                <CardTitle className="text-xl">Autor / Executor</CardTitle>
                <CardDescription>
                  Pesquisador encarregado da elaboração do texto e das análises empíricas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs leading-relaxed text-muted-foreground flex-1">
                <div className="space-y-2 rounded-md bg-muted/40 p-3 border border-border/50">
                  <p className="font-semibold text-foreground">Principais Tarefas:</p>
                  <ul className="list-inside list-disc space-y-1.5 text-foreground/80">
                    <li>Consultar pendências nas abas "Como Autor" e "Interfaces" na Central de Ações.</li>
                    <li>Conferir interfaces interdisciplinares vinculadas ao capítulo na Ficha da Atividade.</li>
                    <li>Atualizar progresso percentual (0 a 100%) da etapa na Ficha.</li>
                    <li>Submeter minutas na Estação de Revisão (upload ou link na nuvem).</li>
                    <li>Implementar os ajustes apontados pelos revisores e responder.</li>
                  </ul>
                </div>
                <div className="rounded-md border border-indigo-500/20 bg-indigo-500/5 p-2.5 text-[11px] text-indigo-800 dark:text-indigo-300">
                  <strong>Dica Prática:</strong> Sempre informe nas "Notas da Versão" o resumo das novidades e fontes utilizadas ao submeter nova minuta.
                </div>
              </CardContent>
              <div className="p-6 pt-0">
                <Link href="/producao">
                  <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                    Abrir Estação de Produção <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Card Revisor Técnico */}
            <Card className="border-t-4 border-t-emerald-500 shadow-sm flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                    Validação por Pares
                  </Badge>
                  <FileCheck2 className="h-5 w-5 text-emerald-500" />
                </div>
                <CardTitle className="text-xl">Revisor Técnico</CardTitle>
                <CardDescription>
                  Especialista independente responsável pela avaliação da qualidade.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs leading-relaxed text-muted-foreground flex-1">
                <div className="space-y-2 rounded-md bg-muted/40 p-3 border border-border/50">
                  <p className="font-semibold text-foreground">Principais Tarefas:</p>
                  <ul className="list-inside list-disc space-y-1.5 text-foreground/80">
                    <li>Acessar minutas sob avaliação via notificação ou Central de Ações.</li>
                    <li>Preencher o checklist de qualidade, consistência e interfaces interdisciplinares.</li>
                    <li>Registrar apontamentos específicos (página, dado, conceito).</li>
                    <li>Emitir parecer formal: Aprovado, Ajustes Solicitados ou Bloqueado.</li>
                  </ul>
                </div>
                <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-[11px] text-emerald-800 dark:text-emerald-300">
                  <strong>Critério:</strong> Avaliar aderência ao Anexo B, robustez das fontes estatísticas, coerência com as interfaces pactuadas e clareza da redação.
                </div>
              </CardContent>
              <div className="p-6 pt-0">
                <Link href="/atividades">
                  <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                    Ver Ações de Revisor <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>

          {/* Detailed Step-by-Step Walkthrough */}
          <Card className="border border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Ciclo de Trabalho Completo de um Capítulo
              </CardTitle>
              <CardDescription>
                Linha do tempo operacional integrada: do planejamento e pactuação de interfaces até a homologação final.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="relative rounded-lg border border-border/60 bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-primary">01. Planejamento & Interfaces</span>
                    <Badge variant="outline" className="text-[10px]">Coordenação</Badge>
                  </div>
                  <p className="text-xs font-semibold text-foreground">Atribuição, Escopo & Interfaces</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    O coordenador confere o Anexo B, designa revisores e mapeia interfaces interdisciplinares em <code>/interfaces</code> ou na Ficha da Atividade.
                  </p>
                </div>

                <div className="relative rounded-lg border border-border/60 bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-500">02. Execução & Alinhamento</span>
                    <Badge variant="outline" className="text-[10px]">Autor</Badge>
                  </div>
                  <p className="text-xs font-semibold text-foreground">Redação, Dados & Minuta</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    O autor consulta insumos de interfaces acordadas, redige o texto, atualiza o percentual concluído e submete na Estação de Revisão.
                  </p>
                </div>

                <div className="relative rounded-lg border border-border/60 bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-500">03. Avaliação Independente</span>
                    <Badge variant="outline" className="text-[10px]">Revisor</Badge>
                  </div>
                  <p className="text-xs font-semibold text-foreground">Checklist & Consistência</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    O revisor avalia rigor metodológico, fontes e aderência aos dados compartilhados entre frentes, emitindo parecer conclusivo.
                  </p>
                </div>

                <div className="relative rounded-lg border border-border/60 bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-teal-600">04. Homologação & Entrega</span>
                    <Badge variant="outline" className="text-[10px]">Coord. Geral</Badge>
                  </div>
                  <p className="text-xs font-semibold text-foreground">Consolidação & BNDES</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Aprovada e harmonizada com todas as interfaces, a seção é consolidada no Tomo e enviada institucionalmente ao BNDES.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: CENTRAL DE AÇÕES & NOTIFICAÇÕES */}
        <TabsContent value="acoes" className="space-y-6">
          <Card className="border border-border/70">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="h-5 w-5 text-amber-500" />
                    Central de Ações do Participante (`ParticipantActionCenter`)
                  </CardTitle>
                  <CardDescription>
                    Painel inteligente no topo da página de Atividades que consolida todas as suas pendências operacionais em 4 abas.
                  </CardDescription>
                </div>
                <Link href="/atividades">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                    Ver Minha Central de Ações <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-border/60 bg-card/60 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                    <FileText className="h-4 w-4" /> Aba "Como Autor"
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Exibe minutas que precisam ser redigidas e apontamentos de revisores que foram devolvidos para você com solicitação de ajustes.
                  </p>
                </div>

                <div className="rounded-lg border border-border/60 bg-card/60 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                    <FileCheck2 className="h-4 w-4" /> Aba "Como Revisor"
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Lista seções que foram atribuídas a você para revisão técnica e minutas que os autores acabaram de submeter para seu parecer.
                  </p>
                </div>

                <div className="rounded-lg border border-border/60 bg-card/60 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs">
                    <Users className="h-4 w-4" /> Aba "Como Coordenação"
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Sinaliza seções do seu grupo que ainda estão sem revisores técnicos independentes designados ou prontas para consolidação.
                  </p>
                </div>

                <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-semibold text-xs">
                    <GitMerge className="h-4 w-4" /> Aba "Interfaces"
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Destaca interfaces prioritárias e em discussão envolvendo seu grupo de trabalho, com botão de atalho para negociação e pactuação em <code>/interfaces</code>.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border/70 bg-muted/30 p-4 space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Como funcionam as notificações em tempo real (Sino Superior)
                </h4>
                <div className="grid gap-3 sm:grid-cols-2 text-xs text-muted-foreground leading-relaxed">
                  <div className="flex items-start gap-2.5">
                    <div className="rounded bg-primary/10 p-1 text-primary shrink-0">🔔</div>
                    <div>
                      <strong className="text-foreground">Revisão Atribuída:</strong> Notifica o pesquisador no exato momento em que o coordenador o designa como revisor.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="rounded bg-primary/10 p-1 text-primary shrink-0">📄</div>
                    <div>
                      <strong className="text-foreground">Versão Submetida:</strong> Avisa aos revisores que o autor enviou uma nova minuta para análise.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="rounded bg-primary/10 p-1 text-primary shrink-0">✏️</div>
                    <div>
                      <strong className="text-foreground">Ajustes Solicitados:</strong> Alerta o autor que o revisor finalizou a análise e registrou apontamentos.
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="rounded bg-primary/10 p-1 text-primary shrink-0">✅</div>
                    <div>
                      <strong className="text-foreground">Ajustes Implementados:</strong> Informa ao revisor que o autor concluiu as alterações pedidas.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: FLUXO EDITORIAL E DOCUMENTAL */}
        <TabsContent value="fluxo" className="space-y-6">
          <Card className="border border-border/70">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Workflow className="h-5 w-5 text-indigo-500" />
                Ciclo de Vida Documental e Decisões de Governança
              </CardTitle>
              <CardDescription>
                Cada capítulo e seção transita por estados documentais formais rastreados no banco de dados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border border-border/60 p-4 space-y-1.5 bg-card">
                  <Badge variant="outline" className="bg-muted text-[10px]">1. Não Iniciada</Badge>
                  <p className="text-xs font-semibold text-foreground">Planejamento Preliminar</p>
                  <p className="text-[11px] text-muted-foreground">Levantamento de fontes e organização da estrutura inicial de tópicos.</p>
                </div>
                <div className="rounded-lg border border-border/60 p-4 space-y-1.5 bg-card">
                  <Badge variant="outline" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 text-[10px]">2. Em Elaboração</Badge>
                  <p className="text-xs font-semibold text-foreground">Redação da Minuta</p>
                  <p className="text-[11px] text-muted-foreground">Autores redigem o texto e tabulam os dados quantitativos.</p>
                </div>
                <div className="rounded-lg border border-border/60 p-4 space-y-1.5 bg-card">
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]">3. Em Revisão Técnica</Badge>
                  <p className="text-xs font-semibold text-foreground">Avaliação por Pares</p>
                  <p className="text-[11px] text-muted-foreground">Revisores independentes conferem metodologia, dados e clareza textual.</p>
                </div>
                <div className="rounded-lg border border-border/60 p-4 space-y-1.5 bg-card">
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30 text-[10px]">4. Em Ajustes</Badge>
                  <p className="text-xs font-semibold text-foreground">Atendimento a Pareceres</p>
                  <p className="text-[11px] text-muted-foreground">Autores incorporam sugestões e esclarecem dúvidas apontadas.</p>
                </div>
                <div className="rounded-lg border border-border/60 p-4 space-y-1.5 bg-card">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">5. Aprovada</Badge>
                  <p className="text-xs font-semibold text-foreground">Validação Concluída</p>
                  <p className="text-[11px] text-muted-foreground">Revisores emitem parecer favorável formal e liberam o texto.</p>
                </div>
                <div className="rounded-lg border border-border/60 p-4 space-y-1.5 bg-card">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px]">6. Entregue BNDES</Badge>
                  <p className="text-xs font-semibold text-foreground">Homologação Oficial</p>
                  <p className="text-[11px] text-muted-foreground">Capítulo consolidado e submetido formalmente ao cliente.</p>
                </div>
              </div>

              <div className="border-t border-border/60 pt-4 space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Prazos Editoriais vs. Prazos Contratuais</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Para garantir que o relatório chegue ao BNDES com qualidade e tempo hábil para consolidação, cada atividade possui dois marcos temporais:
                </p>
                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="rounded-md bg-muted/40 p-3 border border-border/50">
                    <strong className="text-foreground">Entrega Editorial Interna:</strong> Data limite para os autores submeterem a versão preliminar para revisão independente e ajustes.
                  </div>
                  <div className="rounded-md bg-muted/40 p-3 border border-border/50">
                    <strong className="text-foreground">Entrega Contratual ao BNDES:</strong> Data de fechamento oficial do Tomo e remessa institucional ao banco.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: MÓDULOS DO SISTEMA */}
        <TabsContent value="visao-geral" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Gestão de Atividades (`/atividades`)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>Lista oficial dos 30 capítulos analíticos com seus tópicos de detalhamento, coordenadores responsáveis, prazos e barra de progresso ponderada.</p>
                <Link href="/atividades" className="inline-flex items-center gap-1 text-primary font-medium hover:underline pt-1">
                  Acessar atividades <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-emerald-500" />
                  Produção e Revisão (`/producao`)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>Estação de trabalho editorial para controle de minutas, checklist técnico, apontamentos específicos e homologação de versões.</p>
                <Link href="/producao" className="inline-flex items-center gap-1 text-primary font-medium hover:underline pt-1">
                  Acessar produção <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Cronograma & Tomos (`/calendario`)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>Visão temporal e linha do tempo dos 4 Tomos do Estudo, com filtros por mês, identificação de gargalos e entregas contratuais.</p>
                <Link href="/calendario" className="inline-flex items-center gap-1 text-primary font-medium hover:underline pt-1">
                  Ver cronograma <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <GitMerge className="h-4 w-4 text-teal-500" />
                  Interfaces entre Frentes (`/interfaces`)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>Mapeamento de trocas interdisciplinares, demandas de insumos e dependências críticas entre grupos temáticos.</p>
                <Link href="/interfaces" className="inline-flex items-center gap-1 text-primary font-medium hover:underline pt-1">
                  Ver interfaces <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-500" />
                  Biblioteca de Referências (`/biblioteca`)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>Acervo consolidado com mais de 300 publicações, artigos acadêmicos, anuários e relatórios setoriais associados aos capítulos.</p>
                <Link href="/biblioteca" className="inline-flex items-center gap-1 text-primary font-medium hover:underline pt-1">
                  Consultar acervo <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-rose-500" />
                  Equipe e Grupos (`/equipe`)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>Matriz de responsabilidades, pesquisadores participantes, instituições parceiras, cargas horárias e frentes de atuação.</p>
                <Link href="/equipe" className="inline-flex items-center gap-1 text-primary font-medium hover:underline pt-1">
                  Ver equipe <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 5: INTERFACES & ACERVO */}
        <TabsContent value="interfaces" className="space-y-6">
          <Card className="border border-border/70">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GitMerge className="h-5 w-5 text-teal-500" />
                    Interfaces de Coordenação Interdisciplinares no Fluxo do Estudo
                  </CardTitle>
                  <CardDescription>
                    Mecanismo central de governança para convergência analítica, troca de insumos empíricos e eliminação de sobreposições entre frentes.
                  </CardDescription>
                </div>
                <Link href="/interfaces">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                    Abrir Matriz de Interfaces <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 text-xs leading-relaxed text-muted-foreground">
              {/* 4-Step Lifecycle of an Interface */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Ciclo de Vida de uma Interface (4 Fases)</h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-border/60 bg-card p-3.5 space-y-1.5">
                    <Badge variant="outline" className="bg-sky-500/10 text-sky-600 border-sky-500/30 text-[10px]">1. Identificação</Badge>
                    <p className="font-semibold text-foreground text-xs">Mapeamento da Demanda</p>
                    <p className="text-[11px] text-muted-foreground">Um grupo identifica que precisa de insumo de outro (ex: projeção de frota de apoio offshore para calcular demanda de estaleiros).</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-card p-3.5 space-y-1.5">
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]">2. Alinhamento</Badge>
                    <p className="font-semibold text-foreground text-xs">Classificação e Escopo</p>
                    <p className="text-[11px] text-muted-foreground">Define-se se a interface é <em>Prioritária</em> (bloqueante para a redação) ou <em>Não prioritária</em>, pactuando granularidade e prazo.</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-card p-3.5 space-y-1.5">
                    <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/30 text-[10px]">3. Negociação</Badge>
                    <p className="font-semibold text-foreground text-xs">Compartilhamento de Insumos</p>
                    <p className="text-[11px] text-muted-foreground">Os grupos trocam bases de dados preliminares, premissas metodológicas e notas técnicas em <code>/interfaces</code>.</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-card p-3.5 space-y-1.5">
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">4. Acordo / Resolvida</Badge>
                    <p className="font-semibold text-foreground text-xs">Pactuação e Encerramento</p>
                    <p className="text-[11px] text-muted-foreground">Ambas as frentes validam que o insumo foi incorporado harmonicamente aos respectivos capítulos, marcando a interface como resolvida.</p>
                  </div>
                </div>
              </div>

              {/* Where interfaces appear in daily workflow */}
              <div className="rounded-lg border border-teal-500/30 bg-teal-500/5 p-4 space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <GitMerge className="h-4 w-4 text-teal-600" />
                  Onde as interfaces aparecem na sua rotina diária?
                </h4>
                <div className="grid gap-3 sm:grid-cols-2 text-xs text-muted-foreground">
                  <div className="rounded-md bg-card/80 p-3 border border-border/50 space-y-1">
                    <strong className="text-foreground">1. Na Ficha da Atividade (`/atividades`):</strong>
                    <p>Ao abrir a Ficha de qualquer capítulo, o card <strong>"Interfaces de Coordenação Interdisciplinares"</strong> exibe as interfaces vinculadas, nível de criticidade (Prioritária/Não prioritária), grupos contrapartes e atalho direto para pactuação.</p>
                  </div>
                  <div className="rounded-md bg-card/80 p-3 border border-border/50 space-y-1">
                    <strong className="text-foreground">2. Na Central de Ações (`ParticipantActionCenter`):</strong>
                    <p>A aba <strong>"Interfaces"</strong> destaca pendências não resolvidas envolvendo o seu grupo de pesquisa, com crachás de urgência ("Bloqueante" ou "Alinhamento") e contagem no resumo diário.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 6: PERGUNTAS FREQUENTES (FAQ) */}
        <TabsContent value="faq" className="space-y-6">
          <Card className="border border-border/70">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-rose-500" />
                Perguntas Frequentes (FAQ)
              </CardTitle>
              <CardDescription>
                Respostas diretas para as dúvidas mais comuns na rotina dos participantes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-sm font-semibold text-foreground">
                    Onde vejo o que preciso fazer hoje na plataforma?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    Acesse <strong>Gestão de Atividades (`/atividades`)</strong>. O primeiro bloco no topo da página é a <strong>Central de Ações do Participante</strong>. Ela analisa seu login e filtra tudo o que está pendente para você: minutas que você precisa redigir (aba <em>Como Autor</em>), pareceres técnicos que você precisa emitir (aba <em>Como Revisor</em>), revisores que faltam designar (aba <em>Como Coordenação</em>) e pendências interdisciplinares (aba <em>Interfaces</em>).
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-sm font-semibold text-foreground">
                    Sou pesquisador executor. Como atualizo o progresso e o status da minha etapa?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    Abra a Ficha da Atividade do seu capítulo em <code>/atividades</code>. Na lista de etapas de execução, localize a etapa sob sua responsabilidade e clique no botão <strong>"Atualizar etapa"</strong>. Você poderá ajustar o percentual de avanço (0% a 100%), o status operacional e inserir notas de acompanhamento.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-sm font-semibold text-foreground">
                    Onde encontro o texto oficial que descreve o que deve constar no meu capítulo?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    A descrição oficial do escopo contratual (Anexo B) está visível em dois locais:
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Nos cards da lista de atividades em <code>/atividades</code>, logo abaixo do título do capítulo.</li>
                      <li>Na <strong>Ficha da Atividade (modal de detalhes)</strong>, no quadro destacado com a etiqueta <strong>"Escopo e descrição oficial do capítulo — Anexo B"</strong>.</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-sm font-semibold text-foreground">
                    Como sei se meu capítulo possui interfaces ou dependências com outros grupos?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    Você pode checar as interfaces de duas formas:
                    <ol className="list-decimal list-inside mt-2 space-y-1.5">
                      <li><strong>Na Ficha da Atividade:</strong> Na parte inferior do modal de detalhes do capítulo, o bloco <strong>"Interfaces de Coordenação Interdisciplinares"</strong> exibe todas as conexões mapeadas, identificando o grupo parceiro, se a interface é <em>Prioritária</em> e um link direto para negociação.</li>
                      <li><strong>Na Central de Ações:</strong> No topo de <code>/atividades</code>, clique na aba <strong>"Interfaces"</strong> para visualizar todas as trocas pendentes envolvendo seu grupo.</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-sm font-semibold text-foreground">
                    Minha minuta está salva no Google Drive ou no OneDrive. Posso submeter apenas o link?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    Sim. Na Estação de Revisão (ou na Ficha da Atividade), você pode informar o link compartilhável do Google Drive, OneDrive, Teams ou Dropbox, além de anexar arquivos PDF/Word se desejar. Certifique-se de que as permissões de acesso do link permitam leitura pelos revisores e pela coordenação.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger className="text-sm font-semibold text-foreground">
                    Quem pode alterar as datas de entrega e os coordenadores responsáveis?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    Para assegurar a integridade do cronograma mestre acordado com o BNDES, a alteração de coordenadores responsáveis e datas de entrega contratual é reservada aos <strong>Coordenadores de Capítulo/Grupo e Administradores</strong>. Os executores podem atualizar datas operacionais e progresso de suas respectivas etapas.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7">
                  <AccordionTrigger className="text-sm font-semibold text-foreground">
                    O que fazer se eu identificar que outro grupo está pesquisando o mesmo tema?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    Acesse o módulo <strong>Interfaces entre Seções (`/interfaces`)</strong> e registre uma nova interface indicando o capítulo correlato e o grupo parceiro. Isso notificará os coordenadores das duas frentes para harmonizarem os insumos e pactuarem o escopo, evitando retrabalho.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
