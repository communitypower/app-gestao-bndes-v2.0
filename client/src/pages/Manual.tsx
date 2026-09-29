import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Copy,
  Download,
  Eye,
  FileCheck,
  FileCheck2,
  FileEdit,
  FileStack,
  FileText,
  FileUp,
  FolderSync,
  HelpCircle,
  History,
  Layers,
  LayoutDashboard,
  Lock,
  MessageSquare,
  Milestone,
  Pencil,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  Workflow,
  Bell,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    const text = `Manual de Procedimentos — Estudo BNDES Indústria Naval\n\n1. Central de Ações (/atividades): Consulte diariamente suas pendências em caixas organizadas pelo fluxo de 6 passos.\n2. Passo 1 (Autor): Redação e upload da minuta inicial (R01).\n3. Passo 2 (Prof. Floriano): Indicação do revisor técnico independente.\n4. Passo 3 (Revisor): Análise crítica e registro de apontamentos formais.\n5. Passo 4 (Autor): Implementação dos comentários e envio de nova versão (R02+).\n6. Passo 5 (Revisor): Validação do atendimento e parecer de aprovação técnica.\n7. Passo 6 (Coord. Geral): Homologação definitiva do capítulo no Tomo oficial.`;
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
              e Coordenação Geral do Estudo Técnico da Indústria Naval Brasileira.
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
            <p className="text-xl font-bold text-foreground">11 Grupos Temáticos</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Governança</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Fluxo Linear 6 Passos</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Alertas Ativos</p>
            <p className="text-xl font-bold text-primary">Notificações em Tempo Real</p>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="papeis" className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1.5 bg-muted/60 p-1 sm:grid-cols-3 lg:grid-cols-5 rounded-lg">
          <TabsTrigger value="papeis" className="gap-2 py-2 text-xs font-medium">
            <Users className="h-3.5 w-3.5 text-primary" />
            Por Papel
          </TabsTrigger>
          <TabsTrigger value="acoes" className="gap-2 py-2 text-xs font-medium">
            <Bell className="h-3.5 w-3.5 text-amber-500" />
            Caixas de Ação
          </TabsTrigger>
          <TabsTrigger value="fluxo" className="gap-2 py-2 text-xs font-medium">
            <Workflow className="h-3.5 w-3.5 text-indigo-500" />
            Fluxo de 6 Passos
          </TabsTrigger>
          <TabsTrigger value="visao-geral" className="gap-2 py-2 text-xs font-medium">
            <ClipboardList className="h-3.5 w-3.5 text-sky-500" />
            Módulos do Sistema
          </TabsTrigger>
          <TabsTrigger value="faq" className="gap-2 py-2 text-xs font-medium">
            <HelpCircle className="h-3.5 w-3.5 text-rose-500" />
            FAQ & Dúvidas
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PROCEDIMENTOS POR PAPEL */}
        <TabsContent value="papeis" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Card Autor / Grupo */}
            <Card className="border-t-4 border-t-emerald-600 shadow-sm flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                    Passos 1 e 4
                  </Badge>
                  <FileEdit className="h-5 w-5 text-emerald-600" />
                </div>
                <CardTitle className="text-base pt-2">Autor / Grupo Temático</CardTitle>
                <CardDescription className="text-xs">
                  Pesquisador ou grupo responsável pela redação e produção técnica do capítulo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-2">
                  <p className="font-semibold text-foreground text-[11px] uppercase tracking-wider">Principais Obrigações:</p>
                  <ul className="list-disc list-inside space-y-1.5 text-muted-foreground leading-relaxed">
                    <li>Redigir o texto técnico conforme os requisitos do Anexo B.</li>
                    <li>Fazer o upload da minuta inicial (R01) no sistema.</li>
                    <li>Aguardar apontamentos do revisor técnico designado pelo Prof. Floriano.</li>
                    <li>Implementar os comentários recebidos e enviar nova versão (R02...) com notas explicativas.</li>
                  </ul>
                </div>
                <div className="rounded-md bg-emerald-500/5 p-2.5 border border-emerald-500/20 text-[11px] text-muted-foreground">
                  <strong className="text-emerald-700 dark:text-emerald-300">Dica:</strong> Acompanhe suas pendências de redação na caixa <em>"1. Minutas Iniciais"</em> e de correções na caixa <em>"4. Implementação de Ajustes"</em>.
                </div>
              </CardContent>
            </Card>

            {/* Card Prof. Floriano (Coordenação Geral) */}
            <Card className="border-t-4 border-t-amber-600 shadow-sm flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-amber-600/10 text-amber-700 dark:text-amber-300 border-amber-500/30">
                    Passos 2 e 6
                  </Badge>
                  <Users className="h-5 w-5 text-amber-600" />
                </div>
                <CardTitle className="text-base pt-2">Prof. Floriano (Coord. Geral)</CardTitle>
                <CardDescription className="text-xs">
                  Única autoridade para apontamento de revisores e homologação final nos Tomos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-2">
                  <p className="font-semibold text-foreground text-[11px] uppercase tracking-wider">Principais Obrigações:</p>
                  <ul className="list-disc list-inside space-y-1.5 text-muted-foreground leading-relaxed">
                    <li>Indicar com exclusividade o revisor técnico independente para cada seção entregue.</li>
                    <li>Supervisionar prazos e fluxo de atendimento entre autores e revisores.</li>
                    <li>Receber as seções aprovadas na revisão editorial.</li>
                    <li>Homologar oficialmente o capítulo e consolidar no Tomo do Estudo BNDES.</li>
                  </ul>
                </div>
                <div className="rounded-md bg-amber-500/5 p-2.5 border border-amber-500/20 text-[11px] text-muted-foreground">
                  <strong className="text-amber-700 dark:text-amber-300">Exclusividade:</strong> Apenas o Prof. Floriano pode indicar revisores no sistema, garantindo total independência na revisão por pares.
                </div>
              </CardContent>
            </Card>

            {/* Card Revisor Técnico */}
            <Card className="border-t-4 border-t-blue-600 shadow-sm flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-blue-600/10 text-blue-700 dark:text-blue-300 border-blue-500/30">
                    Passos 3 e 5
                  </Badge>
                  <UserCheck className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-base pt-2">Revisor Técnico Designado</CardTitle>
                <CardDescription className="text-xs">
                  Especialista independente apontado pelo Prof. Floriano para validação técnica.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-2">
                  <p className="font-semibold text-foreground text-[11px] uppercase tracking-wider">Principais Obrigações:</p>
                  <ul className="list-disc list-inside space-y-1.5 text-muted-foreground leading-relaxed">
                    <li>Acessar a minuta submetida e realizar leitura crítica e conceitual minuciosa.</li>
                    <li>Registrar formalmente os apontamentos e solicitações de ajuste na ficha.</li>
                    <li>Reavaliar a nova versão entregue pelo autor para checar o atendimento.</li>
                    <li>Emitir o parecer formal de aprovação técnica para liberar a homologação.</li>
                  </ul>
                </div>
                <div className="rounded-md bg-blue-500/5 p-2.5 border border-blue-500/20 text-[11px] text-muted-foreground">
                  <strong className="text-blue-700 dark:text-blue-300">Critério:</strong> Avaliar aderência ao Anexo B, consistência das fontes estatísticas e clareza da redação antes de aprovar.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: CAIXAS DE AÇÃO */}
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
                    Organização das pendências de trabalho do usuário em 6 caixas operacionais distintas e claras.
                  </CardDescription>
                </div>
                <Link href="/">
                  <Button size="sm" className="gap-1.5 text-xs">
                    Ir para Minhas Ações <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ao entrar no sistema, o painel <strong>"Minhas Ações no Estudo"</strong> identifica automaticamente o seu perfil e separa as obrigações a executar nas seguintes caixas:
              </p>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-1.5">
                  <Badge className="bg-emerald-600 text-white text-[10px]">Caixa 1</Badge>
                  <p className="font-semibold text-foreground text-xs">Minutas Iniciais a Elaborar / Subir</p>
                  <p className="text-[11px] text-muted-foreground">Atividades em fase de redação que necessitam do envio da versão inicial R01 pelo autor.</p>
                </div>

                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-1.5">
                  <Badge className="bg-amber-600 text-white text-[10px]">Caixa 2</Badge>
                  <p className="font-semibold text-foreground text-xs">Indicação de Revisores Pendente</p>
                  <p className="text-[11px] text-muted-foreground">Exclusiva do Prof. Floriano para apontar o revisor técnico independente da seção.</p>
                </div>

                <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3.5 space-y-1.5">
                  <Badge className="bg-blue-600 text-white text-[10px]">Caixa 3</Badge>
                  <p className="font-semibold text-foreground text-xs">Revisão Técnica & Comentários</p>
                  <p className="text-[11px] text-muted-foreground">Minutas submetidas aguardando primeira análise crítica e apontamentos do revisor.</p>
                </div>

                <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3.5 space-y-1.5">
                  <Badge className="bg-rose-600 text-white text-[10px]">Caixa 4</Badge>
                  <p className="font-semibold text-foreground text-xs">Implementação de Ajustes pelo Autor</p>
                  <p className="text-[11px] text-muted-foreground">Capítulos devolvidos com comentários para atendimento e envio de nova versão (R02+).</p>
                </div>

                <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3.5 space-y-1.5">
                  <Badge className="bg-purple-600 text-white text-[10px]">Caixa 5</Badge>
                  <p className="font-semibold text-foreground text-xs">Validação & Aprovação Técnica</p>
                  <p className="text-[11px] text-muted-foreground">Retorno ao revisor para checar as alterações e emitir parecer formal de aprovação.</p>
                </div>

                <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-3.5 space-y-1.5">
                  <Badge className="bg-sky-600 text-white text-[10px]">Caixa 6</Badge>
                  <p className="font-semibold text-foreground text-xs">Homologação no Tomo Oficial</p>
                  <p className="text-[11px] text-muted-foreground">Coordenação Geral homologa o capítulo aprovado e consolida a entrega final do Tomo.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: FLUXO DE 6 PASSOS */}
        <TabsContent value="fluxo" className="space-y-6">
          <Card className="border border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Workflow className="h-5 w-5 text-indigo-500" />
                Fluxo Sequencial de Gestão Documental (6 Passos)
              </CardTitle>
              <CardDescription>
                Ciclo completo de vida de um capítulo: da redação inicial até a homologação final no Tomo oficial.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-lg border border-emerald-500/40 bg-card p-3.5 space-y-2">
                  <span className="font-mono text-xs font-bold text-emerald-600">Passo 1</span>
                  <p className="text-xs font-semibold text-foreground">Elaboração & Upload R01</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Autor redige o capítulo e sobe a minuta inicial (R01) no sistema.
                  </p>
                  <Badge variant="outline" className="text-[10px]">Autor / Grupo</Badge>
                </div>

                <div className="rounded-lg border border-amber-500/40 bg-card p-3.5 space-y-2">
                  <span className="font-mono text-xs font-bold text-amber-600">Passo 2</span>
                  <p className="text-xs font-semibold text-foreground">Indicação de Revisor</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Prof. Floriano designa o revisor técnico independente para a seção.
                  </p>
                  <Badge variant="outline" className="text-[10px]">Prof. Floriano</Badge>
                </div>

                <div className="rounded-lg border border-blue-500/40 bg-card p-3.5 space-y-2">
                  <span className="font-mono text-xs font-bold text-blue-600">Passo 3</span>
                  <p className="text-xs font-semibold text-foreground">Revisão Técnica</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Revisor analisa o documento e faz os comentários formais na ficha.
                  </p>
                  <Badge variant="outline" className="text-[10px]">Revisor Técnico</Badge>
                </div>

                <div className="rounded-lg border border-rose-500/40 bg-card p-3.5 space-y-2">
                  <span className="font-mono text-xs font-bold text-rose-600">Passo 4</span>
                  <p className="text-xs font-semibold text-foreground">Ajustes & Nova Versão</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Autor implementa correções e anexa nova versão (R02+) com nota de atendimento.
                  </p>
                  <Badge variant="outline" className="text-[10px]">Autor / Grupo</Badge>
                </div>

                <div className="rounded-lg border border-purple-500/40 bg-card p-3.5 space-y-2">
                  <span className="font-mono text-xs font-bold text-purple-600">Passo 5</span>
                  <p className="text-xs font-semibold text-foreground">Aprovação Técnica</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Revisor confere atendimento e emite parecer formal de aprovação.
                  </p>
                  <Badge variant="outline" className="text-[10px]">Revisor Técnico</Badge>
                </div>

                <div className="rounded-lg border border-sky-500/40 bg-card p-3.5 space-y-2">
                  <span className="font-mono text-xs font-bold text-sky-600">Passo 6</span>
                  <p className="text-xs font-semibold text-foreground">Homologação no Tomo</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Coordenação Geral homologa o capítulo e consolida a entrega institucional.
                  </p>
                  <Badge variant="outline" className="text-[10px]">Coord. Geral</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: MÓDULOS DO SISTEMA */}
        <TabsContent value="visao-geral" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border border-border/70">
              <CardHeader className="pb-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-sm pt-2">Documentos & Ações (`/`)</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>Central de trabalho do estudo. Acompanhe suas obrigações, faça upload de minutas, responda comentários e acesse as fichas detalhadas dos capítulos.</p>
                <Link href="/" className="inline-flex items-center gap-1 text-primary font-medium hover:underline pt-1">
                  Acessar Documentos <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>

            <Card className="border border-border/70">
              <CardHeader className="pb-2">
                <Calendar className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-sm pt-2">Cronograma de Entregas (`/cronograma`)</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>Linha do tempo oficial com distribuição mensal de entregáveis, marcos intermediários e exportação em PDF e imagem.</p>
                <Link href="/cronograma" className="inline-flex items-center gap-1 text-primary font-medium hover:underline pt-1">
                  Acessar Cronograma <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>

            <Card className="border border-border/70">
              <CardHeader className="pb-2">
                <ShieldCheck className="h-5 w-5 text-sky-500" />
                <CardTitle className="text-sm pt-2">Homologação dos Capítulos (`/homologacao`)</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>Módulo de consolidação e controle de qualidade para a Coordenação Geral homologar capítulos aprovados.</p>
                <Link href="/homologacao" className="inline-flex items-center gap-1 text-primary font-medium hover:underline pt-1">
                  Acessar Homologação <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>

            <Card className="border border-border/70">
              <CardHeader className="pb-2">
                <Users className="h-5 w-5 text-emerald-500" />
                <CardTitle className="text-sm pt-2">Administração (`/administracao`)</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>Gestão de acessos, integrantes dos 11 grupos temáticos, auditoria de eventos e configurações institucionais.</p>
                <Link href="/administracao" className="inline-flex items-center gap-1 text-primary font-medium hover:underline pt-1">
                  Acessar Administração <ArrowRight className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 5: FAQ & DÚVIDAS */}
        <TabsContent value="faq" className="space-y-6">
          <Card className="border border-border/70">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-rose-500" />
                Perguntas Frequentes (FAQ)
              </CardTitle>
              <CardDescription>
                Respostas diretas para as principais dúvidas operacionais da equipe de pesquisa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-xs font-semibold text-foreground">
                    Quem pode indicar os revisores técnicos independentes de cada seção?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    A indicação de revisores técnicos é de competência exclusiva do <strong>Prof. Floriano (Coordenação Geral)</strong>. Assim que a minuta inicial R01 é submetida pelo autor, o Prof. Floriano recebe a notificação e seleciona o revisor independente qualificado para a avaliação.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-xs font-semibold text-foreground">
                    Como o autor sabe quais ajustes precisa implementar?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    Quando o revisor técnico conclui a análise, os apontamentos aparecem diretamente no card da seção na caixa <strong>"4. Implementação de Ajustes pelo Autor"</strong>. O autor pode abrir a ficha, visualizar cada comentário, anexar a versão revisada (R02...) e registrar as respostas de atendimento.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-xs font-semibold text-foreground">
                    O que acontece após o revisor técnico aprovar a minuta?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    Com o parecer de aprovação emitido pelo revisor técnico no Passo 5, a seção é transferida para a caixa <strong>"6. Homologação & Consolidação no Tomo"</strong> da Coordenação Geral, que procede à homologação definitiva e consolidação no Tomo oficial do Estudo BNDES.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-xs font-semibold text-foreground">
                    Como acompanho os prazos das minhas entregas?
                  </AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground leading-relaxed">
                    Você pode acompanhar pelo filtro de meses no topo da Central de Ações ou acessar o módulo <strong>Cronograma de Entregas (`/cronograma`)</strong> para visualizar a linha do tempo completa do estudo dividida pelos meses de execução (M1 a M12).
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
