import type { ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import { PageLoading } from "./EditorialUI";
import { LockKeyhole } from "lucide-react";
import { Link } from "wouter";

export default function AdminGate({ children }: { children: ReactNode }) {
  const { data, isLoading } = trpc.administration.status.useQuery();
  if (isLoading || !data) return <PageLoading />;
  if (!data.isAdmin) {
    return (
      <div className="editorial-enter flex min-h-[70vh] items-center justify-center">
        <div className="max-w-xl border-y paper-rule py-12 text-center">
          <LockKeyhole className="mx-auto h-7 w-7 text-primary" />
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Acesso por perfil</p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground">Área do administrador</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {data.canAccessActivities
              ? "Como coordenador vinculado, você também pode consultar suas atividades e preencher as horas do grupo."
              : "Seu perfil de colaborador tem acesso à biblioteca de referências e à área de produção."}
          </p>
          <div className="mt-8 flex justify-center gap-5 text-xs font-semibold uppercase tracking-[.12em]">
            {data.canAccessActivities && (
              <Link href="/atividades" className="border-b border-primary pb-1 text-primary">Atividades</Link>
            )}
            <Link href="/biblioteca" className="border-b border-primary pb-1 text-primary">Biblioteca</Link>
            <Link href="/producao" className="border-b border-primary pb-1 text-primary">Produção</Link>
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
