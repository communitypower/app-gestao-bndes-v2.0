import { PageLoading } from "@/components/EditorialUI";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { GitMerge, LockKeyhole } from "lucide-react";
import { useLocation } from "wouter";

export function InterfacesAccessGate({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = trpc.administration.status.useQuery();
  const [, setLocation] = useLocation();

  if (isLoading || !data) return <PageLoading />;
  if (data.canAccessInterfaces) return <>{children}</>;

  return (
    <div className="mx-auto flex min-h-[65vh] max-w-3xl items-center justify-center">
      <div className="w-full border-y paper-rule py-14 text-center">
        <LockKeyhole className="mx-auto h-8 w-8 text-primary" />
        <p className="editorial-kicker mt-5 text-primary">Acesso por vínculo</p>
        <h1 className="font-display mt-4 text-5xl tracking-[-.05em]">
          Interfaces dos grupos
        </h1>
        <p className="font-editorial mx-auto mt-5 max-w-xl text-xl leading-relaxed text-muted-foreground">
          Esta área é visível para administradores e integrantes vinculados à
          equipe técnica. Solicite ao administrador o vínculo da sua conta.
        </p>
        <Button
          onClick={() => setLocation("/producao")}
          variant="outline"
          className="mt-8 rounded-none uppercase tracking-[.12em]"
        >
          <GitMerge className="mr-2 h-4 w-4" /> Ir para produção
        </Button>
      </div>
    </div>
  );
}
