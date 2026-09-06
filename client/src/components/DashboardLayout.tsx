import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { useIsMobile } from "@/hooks/useMobile";
import {
  BookOpen,
  CalendarDays,
  MapPinned,
  ClipboardList,
  ChartNoAxesCombined,
  FilePenLine,
  GitMerge,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Settings,
  Users,
  Bot,
  Sparkles,
} from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { AiAssistantDrawer } from "./AiAssistantDrawer";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Visão geral", path: "/", admin: false },
  { icon: ChartNoAxesCombined, label: "KPIs documentais", path: "/kpis", admin: true, coordinator: true },
  { icon: ClipboardList, label: "Gestão de atividades", path: "/atividades", admin: true, coordinator: true },
  { icon: CalendarDays, label: "Cronograma", path: "/calendario", admin: true, coordinator: true },
  { icon: Users, label: "Equipe e grupos", path: "/equipe", admin: true },
  { icon: BookOpen, label: "Biblioteca de referências", path: "/biblioteca", admin: false },
  { icon: FilePenLine, label: "Produção e revisão", path: "/producao", admin: false },
  { icon: GitMerge, label: "Interfaces entre seções", path: "/interfaces", admin: true, interfaces: true },
  { icon: MapPinned, label: "Campo e divulgação", path: "/campo-divulgacao", admin: false },
  { icon: Bot, label: "Assistente de IA", path: "/assistente", admin: false },
  { icon: HelpCircle, label: "Manual da equipe", path: "/manual", admin: false },
  { icon: Settings, label: "Administração", path: "/administracao", admin: true },
  { icon: Users, label: "Usuários e permissões", path: "/usuarios-permissoes", admin: true },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 272;
const MIN_WIDTH = 220;
const MAX_WIDTH = 360;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F4F6F5] text-[#17211F] md:grid md:grid-cols-[1.04fr_.96fr]">
        <div className="flex min-h-[52vh] flex-col justify-between bg-[#103638] p-8 text-white md:min-h-screen md:p-14 lg:p-16">
          <div className="flex items-center justify-between">
            <span className="editorial-kicker text-white/80">BNDES · FEP</span>
            <span className="font-mono text-xs text-white/55">2026—2027</span>
          </div>
          <div>
            <div className="mb-7 h-1 w-16 bg-[#7DB8BC]" />
            <p className="editorial-kicker mb-4 text-[#A8CED1]">Estudo técnico</p>
            <h1 className="font-display max-w-xl text-[clamp(3.5rem,7vw,6.5rem)] font-semibold leading-[.9] tracking-[-.045em]">
              Indústria Naval
            </h1>
          </div>
          <p className="max-w-md text-sm leading-6 text-white/65">Diagnósticos e políticas públicas para o desenvolvimento industrial e tecnológico.</p>
        </div>
        <div className="flex items-center p-8 md:p-14 lg:p-16">
          <div className="technical-panel w-full max-w-lg border-t-4 border-t-primary p-7 md:p-9">
            <p className="editorial-kicker text-primary">Acesso reservado</p>
            <h2 className="font-display mt-4 text-4xl font-semibold tracking-[-.035em]">Plataforma de gestão do estudo</h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">Acesso ao cronograma, às atividades, às referências e às revisões.</p>
          <Button
            onClick={() => startLogin()}
            size="lg"
              className="mt-7 h-11 w-full rounded-md uppercase tracking-[.09em]"
          >
              Entrar na plataforma
          </Button>
        </div>
      </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const { data: adminStatus } = trpc.administration.status.useQuery();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const [isAssistantDrawerOpen, setIsAssistantDrawerOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const visibleItems = menuItems.filter(
    item =>
      !item.admin ||
      (item.interfaces && adminStatus?.canAccessInterfaces) ||
      adminStatus?.isAdmin ||
      (item.coordinator && adminStatus?.canAccessActivities)
  );
  const activeMenuItem = visibleItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-sidebar-border"
          disableTransition={isResizing}
        >
          <SidebarHeader className="min-h-24 justify-center border-b border-sidebar-border p-4">
            <div className="flex items-start gap-3 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
                aria-label="Alternar navegação"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
              {!isCollapsed ? (
                <div className="min-w-0 pt-0.5">
                  <span className="editorial-kicker block text-sidebar-primary">BNDES · FEP</span>
                  <span className="mt-2 block text-sm font-semibold leading-none text-sidebar-foreground">Estudo da Indústria Naval</span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <div className="px-4 pb-2 pt-7 group-data-[collapsible=icon]:hidden">
              <p className="editorial-kicker text-sidebar-foreground/40">Módulos</p>
            </div>
            <SidebarMenu className="px-2 py-1">
              {visibleItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-10 rounded-md border border-transparent px-3 text-[13px] font-medium text-sidebar-foreground/72 data-[active=true]:border-sidebar-border data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground"
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-sidebar-primary" : ""}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-md px-1 py-1 text-left hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
                  <Avatar className="h-9 w-9 shrink-0 border border-sidebar-border">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="truncate text-sm font-medium leading-none text-sidebar-foreground">
                      {user?.name || "-"}
                    </p>
                    <p className="mt-1.5 truncate text-[10px] uppercase tracking-[.12em] text-sidebar-foreground/45">
                      {user?.appRole === "administrador" || adminStatus?.isAdmin
                        ? "administrador"
                        : user?.appRole === "coordenador" || adminStatus?.isCoordinator
                          ? "coordenador"
                          : "executor"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none">{user?.name || "Usuário"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email || "Sessão Ativa"}</p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-primary pt-1">
                      Perfil: {user?.appRole === "administrador" || adminStatus?.isAdmin ? "Administrador" : user?.appRole === "coordenador" || adminStatus?.isCoordinator ? "Coordenador" : "Executor"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    window.location.href = "/login";
                  }}
                  className="cursor-pointer"
                >
                  <Users className="mr-2 h-4 w-4 text-primary" />
                  <span>Trocar Perfil / Usuário</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair da Sessão</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-4 sm:px-6 md:px-8 xl:px-10 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
          <div className="flex items-center gap-3">
            {isMobile && <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />}
            <span className="editorial-kicker text-muted-foreground hidden sm:inline-block">
              BNDES · FEP | Estudo Técnico da Indústria Naval
            </span>
            <span className="text-sm font-semibold text-foreground sm:hidden">
              {activeMenuItem?.label ?? "Painel"}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAssistantDrawerOpen(true)}
              className="h-8 gap-1.5 px-2 text-xs text-primary hover:bg-primary/10 hover:text-primary"
              title="Abrir Assistente Técnico de Inteligência Artificial"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden md:inline font-medium">Assistente IA</span>
            </Button>
            <Link href="/manual">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                title="Manual de Procedimentos da Equipe"
              >
                <HelpCircle className="h-4 w-4 text-primary" />
                <span className="hidden md:inline font-medium">Manual da Equipe</span>
              </Button>
            </Link>
            <NotificationBell />
          </div>
        </header>
        <main className="page-grid flex-1 overflow-x-hidden px-4 py-6 sm:px-6 md:px-8 md:py-8 xl:px-10 xl:py-10"><div className="mx-auto w-full max-w-[1560px]">{children}</div></main>
      </SidebarInset>
      <AiAssistantDrawer isOpen={isAssistantDrawerOpen} onOpenChange={setIsAssistantDrawerOpen} />
    </>
  );
}
