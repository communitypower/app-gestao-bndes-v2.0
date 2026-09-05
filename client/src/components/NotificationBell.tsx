import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  CheckCheck,
  ClipboardCheck,
  FileCheck,
  FileEdit,
  FileText,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { useLocation } from "wouter";

function getNotificationIcon(type: string) {
  switch (type) {
    case "revisao_atribuida":
      return <ClipboardCheck className="h-4 w-4 text-amber-500 shrink-0" />;
    case "versao_submetida":
      return <FileText className="h-4 w-4 text-blue-500 shrink-0" />;
    case "ajustes_solicitados":
      return <FileEdit className="h-4 w-4 text-rose-500 shrink-0" />;
    case "ajustes_implementados":
      return <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />;
    case "secao_aprovada":
      return <FileCheck className="h-4 w-4 text-teal-600 shrink-0" />;
    case "capitulo_consolidado":
      return <Layers className="h-4 w-4 text-indigo-600 shrink-0" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground shrink-0" />;
  }
}

function formatRelativeTime(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffHours < 24) return `há ${diffHours} h`;
  if (diffDays === 1) return "ontem";
  if (diffDays < 7) return `há ${diffDays} dias`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  const utils = trpc.useUtils ? trpc.useUtils() : null;
  const countQuery = trpc.notifications?.unreadCount?.useQuery
    ? trpc.notifications.unreadCount.useQuery(undefined, { refetchInterval: 15_000 })
    : { data: undefined };
  const unreadCount = countQuery.data?.unreadCount ?? 0;

  const listQuery = trpc.notifications?.list?.useQuery
    ? trpc.notifications.list.useQuery({ limit: 20 }, { enabled: open })
    : { data: [], isLoading: false };
  const { data: notifications, isLoading } = listQuery;

  const markReadMutation = trpc.notifications?.markAsRead?.useMutation
    ? trpc.notifications.markAsRead.useMutation({
        onSuccess: () => {
          utils?.notifications?.unreadCount?.invalidate();
          utils?.notifications?.list?.invalidate();
        },
      })
    : { mutate: () => {} };

  const markAllReadMutation = trpc.notifications?.markAllAsRead?.useMutation
    ? trpc.notifications.markAllAsRead.useMutation({
        onSuccess: () => {
          utils?.notifications?.unreadCount?.invalidate();
          utils?.notifications?.list?.invalidate();
        },
      })
    : { mutate: () => {}, isPending: false };

  const handleNotificationClick = (notif: {
    id: number;
    read: boolean;
    actionUrl?: string | null;
  }) => {
    if (!notif.read) {
      markReadMutation.mutate({ id: notif.id });
    }
    setOpen(false);
    if (notif.actionUrl) {
      setLocation(notif.actionUrl);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-background/80 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Notificações (${unreadCount} não lidas)`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground shadow-sm animate-in zoom-in-50">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-96 p-0 shadow-lg border-border/60 bg-popover"
      >
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground">Notificações</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] font-medium h-5 px-1.5">
                {unreadCount} nova{unreadCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Marcar lidas
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[360px] divide-y divide-border/40">
          {isLoading ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              Carregando notificações…
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                <CheckCheck className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-foreground">Tudo em dia!</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Você não possui notificações pendentes.
              </p>
            </div>
          ) : (
            notifications.map((notif: any) => (
              <button
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors hover:bg-muted/50 ${
                  !notif.read ? "bg-primary/[0.03] border-l-2 border-l-primary" : "opacity-80"
                }`}
              >
                <div className="mt-0.5">{getNotificationIcon(notif.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                    {notif.message}
                  </p>
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
