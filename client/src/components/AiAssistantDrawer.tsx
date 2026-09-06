import { useEffect, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  Bot,
  Send,
  Sparkles,
  Maximize2,
  RotateCcw,
  BookOpen,
  ClipboardList,
  Layers,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

type DrawerMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  references?: Array<{ id: number; title: string; url?: string | null }>;
  activities?: Array<{ code: string; title: string }>;
};

const DRAWER_SUGGESTIONS = [
  {
    id: "d1",
    category: "Estrutura",
    label: "O que aborda o Tomo I.1 e o escopo do Relatório 1?",
  },
  {
    id: "d2",
    category: "FMM",
    label: "Como funciona o Fundo da Marinha Mercante no Tomo III.5?",
  },
  {
    id: "d3",
    category: "Offshore",
    label: "Quais são as perspectivas para FPSOs e OSVs no Tomo I.6?",
  },
  {
    id: "d4",
    category: "Grupos",
    label: "Quais capítulos estão sob coordenação do Grupo 2?",
  },
];

export function AiAssistantDrawer({
  isOpen,
  onOpenChange,
}: {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [location] = useLocation();

  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: serverPrompts } = trpc.assistant.getSuggestedPrompts.useQuery(undefined, {
    enabled: open,
  });

  const prompts = (serverPrompts && serverPrompts.length > 0) ? serverPrompts : DRAWER_SUGGESTIONS;

  const [messages, setMessages] = useState<DrawerMessage[]>([
    {
      id: "drawer-welcome",
      role: "assistant",
      content: `Olá! Sou o **Assistente Técnico de IA** do Estudo BNDES da Indústria Naval.\n\nComo posso ajudar na sua análise técnica ou atividade agora?`,
      timestamp: new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
    },
  ]);

  const askMutation = trpc.assistant.ask.useMutation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open) {
      setTimeout(scrollToBottom, 100);
    }
  }, [open, messages, askMutation.isPending]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || askMutation.isPending) return;

    const userMsg: DrawerMessage = {
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
        .filter(m => m.id !== "drawer-welcome")
        .slice(-4)
        .map(m => ({ role: m.role, content: m.content }));

      const result = await askMutation.mutateAsync({
        message: text,
        scope: "all",
        history: historyForApi,
      });

      const assistantMsg: DrawerMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: result.content,
        references: result.references,
        activities: result.activities,
        timestamp: new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível processar a consulta.");
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: "drawer-welcome",
        role: "assistant",
        content: `Sessão reiniciada. Base do Estudo BNDES pronta para consultas.`,
        timestamp: new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
      },
    ]);
  };

  // Se o usuário já está na página dedicada /assistente, não exibe o botão flutuante para evitar redundância
  const isAssistantPage = location === "/assistente";

  return (
    <>
      {!isAssistantPage && isOpen === undefined && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Abrir Assistente Técnico IA"
          title="Assistente Técnico IA do Estudo BNDES"
        >
          <Sparkles className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
        </button>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col h-full bg-background border-l paper-rule"
        >
          <SheetHeader className="p-4 border-b paper-rule bg-muted/20 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <SheetTitle className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <span>Assistente Técnico IA</span>
                  <Badge variant="outline" className="text-[9px] font-mono uppercase bg-background text-primary">
                    BNDES
                  </Badge>
                </SheetTitle>
                <SheetDescription className="text-[11px] text-muted-foreground">
                  Grounding oficial nos 14 Tomos e 253 Atividades
                </SheetDescription>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Reiniciar conversa"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Link href="/assistente">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  title="Abrir tela cheia"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </SheetHeader>

          {/* Sugestões Rápidas */}
          {messages.length <= 2 && (
            <div className="p-3 bg-muted/10 border-b border-border/40 space-y-1.5">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" /> Consultas Rápidas Sugeridas:
              </p>
              <div className="flex flex-col gap-1">
                {prompts.slice(0, 4).map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleSend(p.label)}
                    className="text-left text-[11px] text-foreground hover:text-primary bg-background hover:bg-muted p-2 rounded border border-border/40 transition-colors flex items-center justify-between group cursor-pointer"
                  >
                    <span className="truncate pr-2 font-medium">{p.label}</span>
                    <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => {
              const isAssistant = msg.role === "assistant";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isAssistant ? "items-start" : "items-start flex-row-reverse"}`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-medium ${
                      isAssistant
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {isAssistant ? <Bot className="h-3.5 w-3.5" /> : "EU"}
                  </div>

                  <div className={`flex flex-col gap-1 max-w-[85%] ${!isAssistant ? "items-end" : ""}`}>
                    <div
                      className={`rounded-lg p-3 text-xs leading-relaxed ${
                        isAssistant
                          ? "bg-muted/40 border border-border/60 text-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans space-y-1.5">{msg.content}</div>

                      {/* Referências de Apoio */}
                      {isAssistant && msg.references && msg.references.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-border/40 space-y-1">
                          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Referências:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {msg.references.slice(0, 3).map(r => (
                              <Link key={r.id} href="/biblioteca">
                                <span className="inline-flex items-center gap-0.5 rounded bg-background px-1.5 py-0.5 text-[10px] text-foreground border border-border/40 hover:text-primary">
                                  <span className="truncate max-w-[120px]">{r.title}</span>
                                </span>
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-muted-foreground px-1">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}

            {askMutation.isPending && (
              <div className="flex gap-2.5 items-start">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground animate-pulse">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span>Analisando base do estudo...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Rodapé e Input */}
          <div className="p-3 border-t paper-rule bg-background">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2 items-end"
            >
              <Textarea
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Pergunte sobre tomos, atividades ou referências..."
                rows={2}
                className="resize-none text-xs font-sans focus-visible:ring-primary min-h-[48px]"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputMessage.trim() || askMutation.isPending}
                className="h-9 w-9 shrink-0 rounded-md"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
