import { useEffect, useRef, useState } from "react";
import { Metric, PageHeader, PageLoading } from "@/components/EditorialUI";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Bot,
  Send,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  BookOpen,
  ClipboardList,
  ExternalLink,
  BrainCircuit,
  ArrowRight,
  ShieldCheck,
  Flame,
  Ship,
  TrendingUp,
  Search,
  UserCheck,
  GitMerge,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: "generative_llm" | "deterministic_grounded";
  references?: Array<{ id: number; title: string; url?: string | null }>;
  activities?: Array<{ code: string; title: string }>;
  timestamp: string;
};

const THEMATIC_SUGGESTIONS = [
  {
    id: "p1",
    category: "Estrutura & Tomos",
    label: "O que aborda o Tomo I.1 e qual o escopo do Relatório 1?",
    icon: BookOpen,
  },
  {
    id: "p2",
    category: "Equipe & Governança",
    label: "Quem são os coordenadores e frentes dos 11 grupos temáticos?",
    icon: Users,
  },
  {
    id: "p3",
    category: "Biblioteca & Normas",
    label: "Quais referências temos cadastradas sobre o Fundo da Marinha Mercante (FMM) e BR do Mar?",
    icon: BookOpen,
  },
  {
    id: "p4",
    category: "Cronograma & Atividades",
    label: "Quais são as principais atividades analíticas ligadas ao segmento de Óleo e Gás (Tomo I.6)?",
    icon: ClipboardList,
  },
  {
    id: "p5",
    category: "Transição Energética",
    label: "Como a descarbonização e os combustíveis alternativos são abordados no Estudo (Tomo I.8 e II.9)?",
    icon: Flame,
  },
  {
    id: "p6",
    category: "Estaleiros & Base Produtiva",
    label: "Qual o diagnóstico e metodologia de benchmarking de estaleiros previstos no Tomo II.4 e II.8?",
    icon: Ship,
  },
  {
    id: "p7",
    category: "Políticas Públicas",
    label: "Quais são os eixos de análise de políticas industriais e conteúdo local no Tomo III?",
    icon: ShieldCheck,
  },
  {
    id: "p8",
    category: "Cenários Prospectivos",
    label: "Como o Tomo IV estrutura a simulação de cenários de demanda e o diagnóstico integrado?",
    icon: TrendingUp,
  },
  {
    id: "p9",
    category: "Interfaces Técnicas",
    label: "Como funciona a governança de interfaces e cruzamento de dados entre seções?",
    icon: GitMerge,
  },
];

export default function AssistantPage() {
  const [inputMessage, setInputMessage] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: metrics, isLoading: metricsLoading } = trpc.assistant.getKnowledgeMetrics.useQuery();
  const { data: serverSuggestedPrompts } = trpc.assistant.getSuggestedPrompts.useQuery();
  const { data: participantsList } = trpc.assistant.getParticipants.useQuery();

  const promptsToDisplay = (serverSuggestedPrompts && serverSuggestedPrompts.length > 0)
    ? serverSuggestedPrompts
    : THEMATIC_SUGGESTIONS;

  const sortedParticipants = (participantsList || []).slice().sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR")
  );

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: "welcome",
        role: "assistant",
        content: `### 🏛️ Assistente Técnico do Estudo BNDES — Indústria Naval\n\nOlá! Sou o assistente de inteligência artificial dedicado ao **Estudo Técnico da Indústria Naval** (BNDES · FEP / UFRJ).\n\nMinha base de conhecimento está totalmente calibrada com:\n- **14 Capítulos/Tomos Canônicos**: Apresentação, Tomos I (Mercados e Demandas), II (Estaleiros e Base Produtiva), III (Políticas Públicas) e IV (Cenários e Síntese).\n- **253 Atividades Analíticas Detalhadas**: Cronograma oficial do Anexo B de 26 de agosto com prazos e responsáveis.\n- **11 Grupos Temáticos de Pesquisa**: Integrantes, lideranças e atribuições.\n- **328 Referências Catalogadas**: Relatórios, normas da ANTAQ, FMM, BNDES, Marinha e estudos internacionais.\n\n*Utilize a **Consulta Guiada em 2 Etapas** para escolher um participante ou clique em uma das **Consultas Rápidas** abaixo para perguntar instantaneamente.*`,
        mode: "deterministic_grounded",
        timestamp: new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
      },
    ];
  });

  const askMutation = trpc.assistant.ask.useMutation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, askMutation.isPending]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || askMutation.isPending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage("");

    try {
      const historyForApi = newHistory
        .filter(m => m.id !== "welcome")
        .slice(-6)
        .map(m => ({ role: m.role, content: m.content }));

      const result = await askMutation.mutateAsync({
        message: text,
        scope: "all",
        history: historyForApi,
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: result.content,
        mode: result.mode,
        references: result.references,
        activities: result.activities,
        timestamp: new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      toast.error(err?.message || "Ocorreu um erro ao processar sua consulta.");
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Resposta copiada para a área de transferência.");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `### 🏛️ Nova Sessão de Consulta Iniciada\n\nA base de conhecimento do Estudo BNDES está pronta para novas perguntas. Selecione um participante na consulta em 2 etapas ou digite sua dúvida no campo abaixo.`,
        mode: "deterministic_grounded",
        timestamp: new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
      },
    ]);
    setSelectedParticipant(null);
    toast.info("Histórico de mensagens reiniciado.");
  };

  if (metricsLoading) return <PageLoading />;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Inteligência Artificial"
        title="Assistente técnico de inteligência artificial"
        description="Agente contextualizado com a estrutura canônica, o cronograma de 26 de agosto, a biblioteca de referências e a matriz de responsabilidades do Estudo BNDES da Indústria Naval."
        index="00"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Limpar Conversa</span>
            </Button>
          </div>
        }
      />

      {/* Métricas da Base de Conhecimento */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
        <Metric
          label="Capítulos Canônicos"
          value={metrics?.totalSections ?? 14}
          note="Tomos I a IV + AP"
          accent
        />
        <Metric
          label="Atividades Analíticas"
          value={metrics?.totalActivities ?? 253}
          note="Anexo B (26/08)"
        />
        <Metric
          label="Grupos de Pesquisa"
          value={metrics?.totalGroups ?? 11}
          note="Frentes de trabalho"
        />
        <Metric
          label="Referências Catalogadas"
          value={metrics?.totalLibraryItems ?? 328}
          note="Acervo documental"
        />
        <div className="technical-panel col-span-2 sm:col-span-4 lg:col-span-1 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="editorial-kicker text-primary">Motor IA</span>
            <BrainCircuit className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-semibold text-foreground">
                {metrics?.hasLlmKey ? "Generativo Conectado" : "RAG Factual Conectado"}
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Base canônica BNDES 100% indexada
            </p>
          </div>
        </div>
      </div>

      {/* Pergunta em Duas Etapas: Seleção por Lista Suspensa (Econômica em Espaço) */}
      <div className="technical-panel border-primary/20 bg-primary/[0.02] p-3.5 sm:p-4 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary/10 text-primary font-bold text-xs">
              1
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate">
                1. Qual é o papel de um determinado participante no grupo?
              </h3>
              <p className="text-[11px] text-muted-foreground">
                2. Selecione o participante na lista suspensa para consultar atribuições e atividades:
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <Select
              value={selectedParticipant || ""}
              onValueChange={(val) => {
                setSelectedParticipant(val);
                handleSend(`Qual é o papel de ${val} no grupo e no estudo?`);
              }}
            >
              <SelectTrigger className="w-full md:w-[320px] lg:w-[380px] h-9 text-xs bg-background">
                <SelectValue placeholder="Escolha um participante da equipe..." />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {sortedParticipants.map((participant) => (
                  <SelectItem
                    key={participant.name}
                    value={participant.name}
                    className="text-xs py-1.5 cursor-pointer"
                  >
                    <span className="font-medium text-foreground">{participant.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5">
                      ({participant.institution} · {participant.groupName || "Coordenação Geral"})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedParticipant && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSend(`Qual é o papel de ${selectedParticipant} no grupo e no estudo?`)}
                disabled={askMutation.isPending}
                className="h-9 px-3 text-xs shrink-0"
              >
                <Send className="h-3.5 w-3.5 mr-1 text-primary" /> Consultar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Consultas Rápidas Temáticas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="editorial-kicker text-foreground font-semibold">Consultas Rápidas Temáticas</p>
          </div>
          <span className="text-xs text-muted-foreground">Clique para executar imediatamente</span>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {promptsToDisplay.map(prompt => (
            <button
              key={prompt.id}
              onClick={() => handleSend(prompt.label)}
              className="technical-panel group flex flex-col justify-between p-3.5 text-left transition-all hover:border-primary hover:bg-primary/5 cursor-pointer shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] uppercase tracking-wider text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded">
                  {prompt.category}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <p className="mt-2.5 text-xs font-medium text-foreground leading-relaxed">
                {prompt.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Área Principal de Mensagens */}
      <div className="technical-panel flex flex-col min-h-[520px] max-h-[780px] overflow-hidden">
        <div className="border-b paper-rule px-4 py-3 flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Sessão Técnica de Orientação</p>
              <p className="text-[10px] text-muted-foreground">Base: Relatório 1 — Indústria Naval (BNDES / UFRJ)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-mono uppercase bg-background">
              {messages.length} {messages.length === 1 ? "mensagem" : "mensagens"}
            </Badge>
          </div>
        </div>

        {/* Lista de Mensagens */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.map(msg => {
            const isAssistant = msg.role === "assistant";
            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${isAssistant ? "items-start" : "items-start flex-row-reverse"}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md text-xs font-medium ${
                    isAssistant
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {isAssistant ? <Bot className="h-4 w-4" /> : "EU"}
                </div>

                <div className={`flex flex-col gap-1.5 max-w-[85%] sm:max-w-[78%] ${!isAssistant ? "items-end" : ""}`}>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[11px] font-semibold text-foreground">
                      {isAssistant ? "Assistente Técnico" : "Você"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                    {isAssistant && msg.mode && (
                      <span className="text-[9px] uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono">
                        {msg.mode === "generative_llm" ? "IA Generativa" : "RAG Factual"}
                      </span>
                    )}
                  </div>

                  <div
                    className={`rounded-lg p-4 text-xs sm:text-[13px] leading-relaxed relative group ${
                      isAssistant
                        ? "bg-background border border-border shadow-xs text-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <div
                      className={`prose prose-sm max-w-none dark:prose-invert ${
                        !isAssistant ? "prose-p:text-primary-foreground prose-headings:text-primary-foreground" : ""
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans space-y-2">{msg.content}</div>
                    </div>

                    {/* Referências de Apoio Clicáveis */}
                    {isAssistant && msg.references && msg.references.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-border/60 space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                          <BookOpen className="h-3 w-3 text-primary" /> Referências Catalogadas Relacionadas:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.references.map(ref => (
                            <Link key={ref.id} href="/biblioteca">
                              <span className="inline-flex items-center gap-1 rounded bg-muted/60 hover:bg-muted px-2 py-1 text-[11px] text-foreground transition-colors cursor-pointer border border-border/40">
                                <span>{ref.title}</span>
                                <ExternalLink className="h-2.5 w-2.5 text-muted-foreground" />
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Atividades Relacionadas Clicáveis */}
                    {isAssistant && msg.activities && msg.activities.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-border/60 space-y-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                          <ClipboardList className="h-3 w-3 text-primary" /> Atividades do Cronograma:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.activities.map(act => (
                            <Link key={act.code} href="/atividades">
                              <span className="inline-flex items-center gap-1 rounded bg-primary/5 hover:bg-primary/10 px-2 py-0.5 text-[11px] text-primary transition-colors cursor-pointer border border-primary/20 font-mono font-medium">
                                <span>{act.code}</span>
                                <span className="font-sans font-normal text-muted-foreground truncate max-w-[150px]">
                                  {act.title}
                                </span>
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Botão Copiar */}
                    {isAssistant && (
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Copiar texto"
                      >
                        {copiedId === msg.id ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {askMutation.isPending && (
            <div className="flex gap-3.5 items-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm animate-pulse">
                <Bot className="h-4 w-4" />
              </div>
              <div className="technical-panel p-3.5 rounded-lg flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-4 w-4 animate-spin text-primary" />
                <span>Consultando acervo técnico e estruturando resposta...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-background border-t border-border/40">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex flex-col gap-2"
          >
            <div className="relative">
              <Textarea
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Digite sua dúvida sobre o estudo, atividades, grupos, normas ou integrantes... (Pressione Enter para enviar)"
                rows={2}
                className="resize-none pr-12 text-xs sm:text-sm font-sans focus-visible:ring-primary"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputMessage.trim() || askMutation.isPending}
                className="absolute right-2 bottom-2 h-8 w-8 rounded-md"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
              <span>Shift + Enter para quebra de linha</span>
              <span>Estudo Técnico BNDES · UFRJ / FEP</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

