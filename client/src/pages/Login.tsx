import { useMemo, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { COOKIE_NAME } from "@shared/const";
import { groupDisplayName } from "@shared/groupDisplay";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogIn,
  Mail,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dev mode state
  const [showDevDirectory, setShowDevDirectory] = useState(false);
  const [devSearch, setDevSearch] = useState("");
  const [devRoleFilter, setDevRoleFilter] = useState<
    "todos" | "administrador" | "coordenador" | "executor"
  >("todos");

  const utils = trpc.useUtils();

  // Parse URL query params for OAuth errors or messages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    const errorEmail = params.get("email");

    if (error === "unauthorized") {
      setErrorMessage(
        errorEmail
          ? `Acesso Não Autorizado: O e-mail "${errorEmail}" não consta na lista de participantes do Estudo BNDES. Solicite autorização à coordenação.`
          : "Acesso Não Autorizado: Sua conta não possui permissão para acessar o portal do Estudo BNDES."
      );
    } else if (error === "missing_google_config") {
      setErrorMessage(
        "A integração com o Google OAuth ainda não foi configurada no servidor (GOOGLE_CLIENT_ID ausente). Utilize a entrada por E-mail e Senha."
      );
    } else if (error === "auth_failed" || error === "google_failed") {
      setErrorMessage(
        "Falha na autenticação com o Google. Verifique sua conexão e tente novamente ou entre com sua Senha/Chave."
      );
    }
  }, []);

  // Secure login mutation (Email + Password/Master Key)
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: data => {
      if (data.token) {
        try {
          sessionStorage.setItem("manus-cookie", `${COOKIE_NAME}=${data.token}`);
          localStorage.setItem("manus-session-token", data.token);
        } catch {}
      }
      utils.auth.me.setData(undefined, data.user as any);
      toast.success(`Bem-vindo(a), ${data.user.name || "Usuário"}!`);
      window.location.href = "/";
    },
    onError: error => {
      setIsLoggingIn(false);
      setErrorMessage(error.message || "Erro ao realizar autenticação.");
      toast.error(error.message || "Credenciais inválidas.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.warning("Preencha o e-mail e a senha/chave de acesso.");
      return;
    }
    setErrorMessage(null);
    setIsLoggingIn(true);
    try {
      await loginMutation.mutateAsync({
        email: email.trim(),
        password: password.trim(),
      });
    } catch {
      setIsLoggingIn(false);
    }
  };

  // Dev directory query (only returned when not in production)
  const { data: usersDirectory, isLoading: isDevLoading } = trpc.auth.loginList.useQuery(
    undefined,
    {
      refetchOnWindowFocus: false,
    }
  );

  const loginAsMutation = trpc.auth.loginAs.useMutation({
    onSuccess: data => {
      if (data.token) {
        try {
          sessionStorage.setItem("manus-cookie", `${COOKIE_NAME}=${data.token}`);
          localStorage.setItem("manus-session-token", data.token);
        } catch {}
      }
      utils.auth.me.setData(undefined, data.user as any);
      toast.success(`Acessando como: ${data.user.name || "Usuário"}`);
      window.location.href = "/";
    },
    onError: error => {
      setIsLoggingIn(false);
      toast.error(error.message || "Acesso direto bloqueado.");
    },
  });

  const allDevUsers = usersDirectory?.entries ?? [];
  const isDevModeAvailable = allDevUsers.length > 0;

  const filteredDevUsers = useMemo(() => {
    return allDevUsers.filter(u => {
      const query = devSearch.toLowerCase();
      const matchesSearch =
        !devSearch ||
        (u.name && u.name.toLowerCase().includes(query)) ||
        (u.email && u.email.toLowerCase().includes(query)) ||
        (u.groupName && u.groupName.toLowerCase().includes(query)) ||
        (u.institution && u.institution.toLowerCase().includes(query));

      const matchesRole =
        devRoleFilter === "todos" || u.appRole === devRoleFilter;

      return matchesSearch && matchesRole;
    });
  }, [allDevUsers, devSearch, devRoleFilter]);

  return (
    <div className="min-h-screen bg-muted/20 px-4 py-8 md:py-16">
      <div className="mx-auto max-w-xl space-y-6">
        {/* Header Institucional */}
        <header className="text-center space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              Estudo Estratégico BNDES · Indústria Naval
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="font-mono text-xs text-muted-foreground">
              UFRJ · COPPE · IE
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Portal de Gestão do Estudo
          </h1>
          <p className="text-xs text-muted-foreground md:text-sm">
            Acesso restrito e exclusivo aos pesquisadores e membros autorizados da equipe.
          </p>
        </header>

        {/* Alerta de Erro */}
        {errorMessage && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-xs md:text-sm text-destructive flex items-start gap-3 animate-in fade-in">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Card Principal de Login */}
        <Card className="border-border/60 shadow-md">
          <CardHeader className="pb-4 text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Lock className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg font-semibold">Entrar com Credenciais</CardTitle>
            <CardDescription className="text-xs">
              Informe seu e-mail cadastrado e sua senha ou chave de acesso da equipe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> E-mail Institucional
                </label>
                <Input
                  type="email"
                  placeholder="exemplo@poli.ufrj.br, @ie.ufrj.br, etc."
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-background"
                  disabled={isLoggingIn}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-muted-foreground" /> Senha ou Chave de Acesso
                  </label>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha ou a chave da equipe"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="bg-background pr-10"
                    disabled={isLoggingIn}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                    title={showPassword ? "Ocultar senha" : "Ver senha"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Dica de Chave Inicial */}
              <div className="rounded-md border border-primary/20 bg-primary/[0.03] p-2.5 text-[11px] text-muted-foreground leading-relaxed">
                <p className="font-semibold text-primary mb-0.5">Primeiro acesso?</p>
                Utilize a Chave de Acesso da Equipe: <code className="rounded bg-muted px-1.5 py-0.5 font-mono font-semibold text-foreground">BNDES2026#Naval</code>. Você poderá cadastrar sua senha pessoal após entrar.
              </div>

              <Button
                type="submit"
                disabled={isLoggingIn || !email.trim() || !password.trim()}
                className="w-full text-xs font-semibold py-5"
              >
                <LogIn className="mr-2 h-4 w-4" />
                {isLoggingIn ? "Autenticando..." : "Entrar no Portal"}
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground text-[10px]">
                  Ou continue com
                </span>
              </div>
            </div>

            {/* Botão Google OAuth */}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                window.location.href = "/api/auth/google";
              }}
              className="w-full text-xs font-medium py-5 flex items-center justify-center gap-2 hover:bg-muted/50"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Entrar com Conta Google (Gmail / Workspace)
            </Button>
          </CardContent>
        </Card>

        {/* Seção Exclusiva de Desenvolvimento Local (Oculta em Produção) */}
        {isDevModeAvailable && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowDevDirectory(!showDevDirectory)}
              className="w-full flex items-center justify-between text-xs text-muted-foreground hover:text-foreground py-2 border-t border-dashed"
            >
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-500" />
                [Modo Dev Local] Alternar Usuários de Teste ({allDevUsers.length})
              </span>
              {showDevDirectory ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>

            {showDevDirectory && (
              <div className="mt-3 space-y-3 p-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.02]">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Input
                    placeholder="Filtrar participante de teste..."
                    value={devSearch}
                    onChange={e => setDevSearch(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>
                <div className="grid gap-2 max-h-60 overflow-y-auto pr-1 sm:grid-cols-2">
                  {filteredDevUsers.map(user => (
                    <div
                      key={user.id}
                      className="p-2 rounded border bg-background flex flex-col justify-between gap-1 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{user.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {user.email || user.groupName || user.appRole}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 text-[11px] w-full"
                        disabled={isLoggingIn}
                        onClick={() => {
                          setIsLoggingIn(true);
                          loginAsMutation.mutate({
                            userId: user.id,
                            openId: user.openId || undefined,
                            email: user.email || undefined,
                          });
                        }}
                      >
                        Acessar como {user.name?.split(" ")[0]}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
