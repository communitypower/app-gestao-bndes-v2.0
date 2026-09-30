import { useState } from "react";
import { PageHeader, PageLoading } from "@/components/EditorialUI";
import { ActivityDetailDialog } from "@/components/ActivityDetailDialog";
import { ParticipantActionCenter } from "@/components/ParticipantActionCenter";
import { trpc } from "@/lib/trpc";

export default function ProductionPage() {
  const { data: access, isLoading } = trpc.administration.status.useQuery();
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);

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
          onSelectActivity={id => setSelectedActivityId(id)}
        />
      </div>

      {/* Ficha da Atividade Unificada com Fluxo Documental */}
      <ActivityDetailDialog
        activityId={selectedActivityId}
        onOpenChange={open => !open && setSelectedActivityId(null)}
        isAdmin={Boolean(access?.isAdmin)}
      />
    </div>
  );
}
