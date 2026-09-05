import { useMemo, useState } from "react";
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
  CheckCircle2,
  KeyRound,
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
  const [search, setSearch] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<
    "todos" | "administrador" | "coordenador" | "executor"
  >("todos");
  const [customEmail, setCustomEmail] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const utils = trpc.useUtils();
  const { data: usersDirectory, isLoading } = trpc.auth.loginList.useQuery(
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
      toast.success(`Bem-vindo(a), ${data.user.name || "Usuário"}!`);
      // Redirect to dashboard
      window.location.href = "/";
    },
    onError: error => {
      setIsLoggingIn(false);
      toast.error(error.message || "Erro ao autenticar.");
    },
  });

  const handleLoginUser = async (user: {
    kind?: "conta" | "pre-cadastro";
    id: number;
    openId?: string | null;
    email?: string | null;
    name?: string | null;
  }) => {
    setIsLoggingIn(true);
    try {
      if (user.kind === "conta") {
        await loginAsMutation.mutateAsync({
          userId: user.id,
          openId: user.openId || undefined,
          email: user.email || undefined,
        });
      } else {
        await loginAsMutation.mutateAsync({
          email: user.email || undefined,
        });
      }
    } catch {
      setIsLoggingIn(false);
    }
  };

  const handleCustomEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    setIsLoggingIn(true);
    try {
      await loginAsMutation.mutateAsync({
        email: customEmail.trim(),
      });
    } catch {
      setIsLoggingIn(false);
    }
  };

  const allUsers = usersDirectory?.entries ?? [];

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      const query = search.toLowerCase();
      const matchesSearch =
        !search ||
        (u.name && u.name.toLowerCase().includes(query)) ||
        (u.email && u.email.toLowerCase().includes(query)) ||
        (u.groupName && u.groupName.toLowerCase().includes(query)) ||
        (u.institution && u.institution.toLowerCase().includes(query));

      const matchesRole =
        selectedRoleFilter === "todos" || u.appRole === selectedRoleFilter;

      return matchesSearch && matchesRole;
    });
  }, [allUsers, search, selectedRoleFilter]);

  const counts = useMemo(() => {
    return {
      total: allUsers.length,
      administradores: allUsers.filter(u => u.appRole === "administrador").length,
      coordenadores: allUsers.filter(u => u.appRole === "coordenador").length,
      executores: allUsers.filter(u => u.appRole === "executor").length,
    };
  }, [allUsers]);

  return (
    <div className="min-h-screen bg-muted/20 px-4 py-8 md:py-12">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header Institucional */}
        <header className="border-b paper-rule pb-6 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary">
              Estudo Estratégico BNDES · Indústria Naval
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="font-mono text-xs text-muted-foreground">
              UFRJ · COPPE · Instituto de Economia
            </span>
          </div>
          <h1 className="font-display mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Acesso ao Portal de Gestão
          </h1>
          <p className="mt-2 text-sm text-muted-foreground md:text-base">
            Selecione seu perfil de participante do estudo para autenticar com as permissões correspondentes.
          </p>
        </header>

        {/* Login com E-mail Direto (Alternativa Rápida) */}
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Mail className="h-4 w-4 text-primary" /> Entrada por E-mail Institucional
            </CardTitle>
            <CardDescription className="text-xs">
              Caso prefira, digite diretamente o seu e-mail institucional cadastrado na equipe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleCustomEmailLogin}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <Input
                type="email"
                placeholder="exemplo@poli.ufrj.br ou seu e-mail cadastrado"
                value={customEmail}
                onChange={e => setCustomEmail(e.target.value)}
                className="bg-background"
                disabled={isLoggingIn}
              />
              <Button
                type="submit"
                disabled={isLoggingIn || !customEmail.trim()}
                className="shrink-0"
              >
                <LogIn className="mr-2 h-4 w-4" />
                {isLoggingIn ? "Autenticando…" : "Entrar com E-mail"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Seleção de Participante / Perfil */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Participantes e Perfis do Estudo
              </h2>
              <p className="text-xs text-muted-foreground">
                Clique em "Acessar" no seu nome para carregar sua sessão e permissões.
              </p>
            </div>
            {/* Filtros de Perfil */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant={selectedRoleFilter === "todos" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedRoleFilter("todos")}
                className="rounded-full text-xs"
              >
                Todos ({counts.total})
              </Button>
              <Button
                variant={
                  selectedRoleFilter === "administrador" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedRoleFilter("administrador")}
                className="rounded-full text-xs"
              >
                Administradores ({counts.administradores})
              </Button>
              <Button
                variant={
                  selectedRoleFilter === "coordenador" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedRoleFilter("coordenador")}
                className="rounded-full text-xs"
              >
                Coordenadores ({counts.coordenadores})
              </Button>
              <Button
                variant={
                  selectedRoleFilter === "executor" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedRoleFilter("executor")}
                className="rounded-full text-xs"
              >
                Executores ({counts.executores})
              </Button>
            </div>
          </div>

          {/* Barra de Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome, e-mail, grupo (ex.: G3, G7) ou instituição..."
              className="bg-background pl-10"
            />
          </div>

          {/* Grid de Usuários */}
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-lg border bg-muted/40 p-4"
                />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
              <p className="mt-2 text-sm font-medium text-foreground">
                Nenhum participante encontrado
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tente ajustar os termos da busca ou o filtro de perfil.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredUsers.map(user => {
                const isCoordinator = user.appRole === "coordenador";
                const isAdmin = user.appRole === "administrador";

                return (
                  <Card
                    key={user.id}
                    className="flex flex-col justify-between transition-all hover:border-primary/40 hover:shadow-sm"
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-border">
                            <AvatarFallback className="text-xs font-semibold">
                              {user.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {user.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {user.email || "Sem e-mail"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-1">
                      <div className="mb-3 flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant={
                            isAdmin
                              ? "default"
                              : isCoordinator
                              ? "secondary"
                              : "outline"
                          }
                          className="text-[10px] font-semibold"
                        >
                          {isAdmin ? (
                            <ShieldCheck className="mr-1 h-3 w-3" />
                          ) : isCoordinator ? (
                            <UserCheck className="mr-1 h-3 w-3" />
                          ) : (
                            <Users className="mr-1 h-3 w-3" />
                          )}
                          {user.appRole}
                        </Badge>
                        {user.groupName && (
                          <span className="inline-flex items-center rounded border border-muted-foreground/20 bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {groupDisplayName(user.groupName)}
                          </span>
                        )}
                        {user.institution && (
                          <span className="text-[10px] text-muted-foreground">
                            · {user.institution}
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={isAdmin ? "default" : "outline"}
                        className="w-full text-xs font-medium"
                        disabled={isLoggingIn}
                        onClick={() => handleLoginUser(user)}
                      >
                        <LogIn className="mr-1.5 h-3.5 w-3.5" />
                        Acessar como {user.name?.split(" ")[0]}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
