import type { ReactNode } from "react";
import { Link } from "wouter";
import { LockKeyhole } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageLoading } from "./EditorialUI";

export default function ActivityAccessGate({
  children,
}: {
  children: ReactNode;
}) {
  const { data, isLoading } = trpc.administration.status.useQuery();
  if (isLoading || !data) return <PageLoading />;
  if (!data.canAccessActivities) {
    return (
      <div className="editorial-enter flex min-h-[70vh] items-center justify-center">
        <div className="max-w-xl border-y paper-rule py-12 text-center">
          <LockKeyhole className="mx-auto h-7 w-7 text-primary" />
          <p className="editorial-kicker mt-6 text-primary">Acesso por perfil</p>
          <h1 className="font-display mt-4 text-5xl font-medium tracking-[-.05em]">
            Acesso às atividades
          </h1>
          <p className="font-editorial mt-4 text-2xl text-muted-foreground">
            Esta área exige vínculo ativo com a equipe do estudo. As ações de
            alteração permanecem condicionadas à responsabilidade designada.
          </p>
          <div className="mt-8 flex justify-center gap-5 text-xs font-semibold uppercase tracking-[.12em]">
            <Link href="/biblioteca" className="border-b border-primary pb-1 text-primary">
              Biblioteca
            </Link>
            <Link href="/producao" className="border-b border-primary pb-1 text-primary">
              Produção
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
