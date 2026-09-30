import { useState } from "react";
import { PageHeader, PageLoading } from "@/components/EditorialUI";
import { ActivityDetailDialog } from "@/components/ActivityDetailDialog";
import { ParticipantActionCenter } from "@/components/ParticipantActionCenter";
import { trpc } from "@/lib/trpc";

export default function ProductionPage() {
  const { data: access, isLoading } = trpc.administration.status.useQuery();
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [initialAction, setInitialAction] = useState<"upload_minuta" | "upload_revision" | undefined>(undefined);

  if (isLoading || !access) return <PageLoading />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fluxo Documental Direto · Estudo BNDES"
        title="Controle de Documentos & Minhas Ações"
        description="Acompanhamento centralizado das suas obrigações imediatas, envio de minutas, atendimento de revisões e acesso direto às fichas dos capítulos."
        index="01 — Controle de Documentos"
      />

      {/* Central de Ações e Pendências do Participante */}
      <div className="technical-panel p-4 sm:p-5">
        <ParticipantActionCenter
          onSelectActivity={(id, action) => {
            setSelectedActivityId(id);
            setInitialAction(action);
          }}
        />
      </div>

      {/* Ficha da Atividade Unificada com Fluxo Documental */}
      <ActivityDetailDialog
        activityId={selectedActivityId}
        initialAction={initialAction}
        onOpenChange={open => {
          if (!open) {
            setSelectedActivityId(null);
            setInitialAction(undefined);
          }
        }}
        isAdmin={Boolean(access?.isAdmin)}
      />
    </div>
  );
}
