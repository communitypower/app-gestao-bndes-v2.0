import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import ActivityAccessGate from "@/components/ActivityAccessGate";
import { PageHeader } from "@/components/EditorialUI";
import { trpc } from "@/lib/trpc";
import { ParticipantActionCenter } from "@/components/ParticipantActionCenter";
import { ActivityDetailDialog } from "@/components/ActivityDetailDialog";

/**
 * Página Principal: Minhas Ações no Estudo
 */
function ActivitiesContent() {
  const { data: access } = trpc.administration.status.useQuery();
  const searchParams = useSearch();

  // Estado da Ficha Aberta
  const [detailId, setDetailId] = useState<number | null>(null);

  // Abrir Ficha automaticamente se query param `ficha`, `activityId` ou `id` estiver presente
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const fichaId = params.get("ficha") || params.get("activityId") || params.get("id");
    if (fichaId) {
      setDetailId(Number(fichaId));
    }
  }, [searchParams]);

  const isAdmin = Boolean(access?.isAdmin);

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <PageHeader
        eyebrow="Painel Pessoal e Produtividade"
        title="Minhas ações"
        description="Acompanhamento centralizado das suas obrigações imediatas, envio de minutas, atendimento de revisões e acesso direto às fichas dos capítulos."
        index="02 — Minhas ações"
      />

      {/* Central de Ações e Pendências do Participante */}
      <div className="technical-panel p-4 sm:p-5">
        <ParticipantActionCenter
          onSelectActivity={id => {
            setDetailId(id);
          }}
        />
      </div>

      {/* Ficha da Atividade Unificada */}
      <ActivityDetailDialog
        activityId={detailId}
        onOpenChange={open => {
          if (!open) setDetailId(null);
        }}
        isAdmin={isAdmin}
      />
    </div>
  );
}

export default function ActivitiesPage() {
  return (
    <ActivityAccessGate>
      <ActivitiesContent />
    </ActivityAccessGate>
  );
}
