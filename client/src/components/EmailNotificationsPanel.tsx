import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function formatDate(ms: number) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date(ms));
}

export default function EmailNotificationsPanel() {
  const { data, isLoading, refetch } = trpc.administration.emailNotificationsStatus.useQuery();
  const runNow = trpc.administration.runDeadlineRemindersNow.useMutation();
  if (isLoading || !data) return null;

  const totalItems = data.pending.reduce((sum, g) => sum + g.items.length, 0);

  const handleRun = async () => {
    try {
      const res: any = await runNow.mutateAsync();
      if (!res.enabled) toast.error(`Envio desativado: ${res.reason}`);
      else toast.success(`${res.sent} e-mail(s) enviado(s)${res.failed ? `, ${res.failed} com falha` : ""}.`);
      await refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Falha ao enviar os lembretes.");
    }
  };

  return (
    <section className="technical-panel overflow-hidden" data-testid="email-notifications-panel">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">Avisos por e-mail</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Revisor: aviso quando é indicado ou quando recebe nova versão. Autores: lembrete único quando a entrega fica a
            menos de {data.windowDays} dias.
          </p>
          <p className="mt-2 text-sm">
            Situação:{" "}
            {data.enabled ? (
              <strong className="text-emerald-700">ativo</strong>
            ) : (
              <strong className="text-amber-700">desativado ({data.reason})</strong>
            )}
            {data.provider && <span className="text-muted-foreground"> · serviço: {data.provider}</span>}
            {data.fromEmail && <span className="text-muted-foreground"> · remetente: {data.fromEmail}</span>}
            {data.redirectTo && <span className="text-amber-700"> · modo de teste: tudo vai para {data.redirectTo}</span>}
          </p>
        </div>
        <Button size="sm" onClick={handleRun} disabled={!data.enabled || runNow.isPending || totalItems === 0}>
          {runNow.isPending ? "Enviando…" : "Enviar lembretes agora"}
        </Button>
      </div>
      <div className="px-5 py-3 text-sm">
        <p className="font-medium">
          Lembretes de prazo pendentes: {totalItems} seção(ões) para {data.pending.length} autor(es)
        </p>
        {data.pending.length > 0 && (
          <ul className="mt-2 space-y-2 text-xs">
            {data.pending.map(group => (
              <li key={`${group.name}-${group.email}`}>
                <span className="font-semibold">{group.name}</span>{" "}
                <span className="text-muted-foreground">{group.email ?? "sem e-mail cadastrado"}</span>
                <ul className="ml-4 list-disc">
                  {group.items.map(item => (
                    <li key={item.activityId}>
                      {item.code} — {item.title} · entrega {formatDate(item.dueAt)} ({item.daysLeft} dias) · {item.status}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
