import { useMemo, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  PageHeader,
  PageLoading,
  SectionMark,
  StatusBadge,
} from "@/components/EditorialUI";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { studyTomeFromCode } from "@shared/domain";
import { groupDisplayName } from "../../../shared/groupDisplay";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Layers,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";

export default function HomologacaoPage() {
  const { data: materials, isLoading } = trpc.production.list.useQuery();
  const { data: access } = trpc.administration.status.useQuery();
  const consolidateInChapter = trpc.production.consolidateInChapter.useMutation();
  const utils = trpc.useUtils();

  const [tomoFilter, setTomoFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [homologationNotes, setHomologationNotes] = useState("");

  const selectedMaterial = useMemo(
    () => (materials ?? []).find(m => m.id === selectedMaterialId) ?? null,
    [materials, selectedMaterialId]
  );

  // Group materials by Tomo
  const filteredMaterials = useMemo(() => {
    return (materials ?? []).filter(m => {
      const tomo = studyTomeFromCode(m.sectionCode);
      if (tomoFilter !== "todos" && !tomo.toLowerCase().includes(tomoFilter.toLowerCase())) {
        return false;
      }
      if (statusFilter === "homologado") {
        return m.activityDocumentStatus === "consolidada no capítulo";
      }
      if (statusFilter === "pronto") {
        return (
          m.reviewStatus === "aprovado" ||
          m.activityDocumentStatus === "revisada pela seção" ||
          m.activeSubmission?.status === "aprovado"
        ) && m.activityDocumentStatus !== "consolidada no capítulo";
      }
      if (statusFilter === "em_andamento") {
        return m.activityDocumentStatus !== "consolidada no capítulo" && m.reviewStatus !== "aprovado";
      }
      return true;
    });
  }, [materials, tomoFilter, statusFilter]);

  const stats = useMemo(() => {
    const list = materials ?? [];
    const total = list.length;
    const homologados = list.filter(m => m.activityDocumentStatus === "consolidada no capítulo").length;
    const prontos = list.filter(
      m =>
        (m.reviewStatus === "aprovado" || m.activityDocumentStatus === "revisada pela seção") &&
        m.activityDocumentStatus !== "consolidada no capítulo"
    ).length;
    const emRevisao = list.filter(m => m.reviewStatus === "em revisão" || m.activeSubmission?.status === "em revisão").length;

    return { total, homologados, prontos, emRevisao };
  }, [materials]);

  const handleConfirmHomologation = async () => {
    if (!selectedMaterialId) return;
    try {
      await consolidateInChapter.mutateAsync({
        materialId: selectedMaterialId,
        note: homologationNotes.trim() || undefined,
      });
      toast.success("Capítulo homologado no relatório com sucesso!");
      setSelectedMaterialId(null);
      setHomologationNotes("");
      utils.production.list.invalidate();
      utils.activities.invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao homologar capítulo.");
    }
  };

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sistematização & Relatório Oficial"
        title="Homologação dos Capítulos"
        description="Acompanhamento editorial e homologação técnica de cada seção aprovada pelos grupos temáticos (G1 a G11) para incorporação ao documento final do Estudo BNDES."
      />

      {/* KPI Cards Rápidos */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="technical-panel border-t-[3px] border-t-primary p-4">
          <p className="data-label text-primary">Total de Seções</p>
          <p className="font-mono mt-1 text-2xl font-bold">{stats.total}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Estrutura oficial do Estudo</p>
        </div>
        <div className="technical-panel border-t-[3px] border-t-emerald-600 p-4">
          <p className="data-label text-emerald-600">Homologados no Relatório</p>
          <p className="font-mono mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {stats.homologados}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Validados pelo G1 / Coord Geral</p>
        </div>
        <div className="technical-panel border-t-[3px] border-t-sky-600 p-4">
          <p className="data-label text-sky-600">Prontos para Homologar</p>
          <p className="font-mono mt-1 text-2xl font-bold text-sky-700 dark:text-sky-400">
            {stats.prontos}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Aprovados aguardando fechamento</p>
        </div>
        <div className="technical-panel border-t-[3px] border-t-amber-600 p-4">
          <p className="data-label text-amber-600">Em Elaboração / Revisão</p>
          <p className="font-mono mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400">
            {stats.emRevisao}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Com os grupos temáticos</p>
        </div>
      </div>

      {/* Barra de Filtros por Tomo e Status */}
      <div className="technical-panel p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Filtro por Tomo */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mr-1">
            <Layers className="h-3.5 w-3.5" /> Tomo:
          </span>
          {[
            { id: "todos", label: "Todos os Tomos" },
            { id: "tomo i", label: "Tomo I" },
            { id: "tomo ii", label: "Tomo II" },
            { id: "tomo iii", label: "Tomo III" },
            { id: "tomo iv", label: "Tomo IV" },
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTomoFilter(t.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                tomoFilter === t.id
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Filtro por Status */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mr-1">
            <Filter className="h-3.5 w-3.5" /> Status:
          </span>
          {[
            { id: "todos", label: "Todos" },
            { id: "pronto", label: "Prontos para Homologar" },
            { id: "homologado", label: "Homologados" },
            { id: "em_andamento", label: "Em Elaboração/Revisão" },
          ].map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStatusFilter(s.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                statusFilter === s.id
                  ? "bg-foreground text-background shadow-xs font-semibold"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Capítulos e Seções */}
      {filteredMaterials.length === 0 ? (
        <div className="technical-panel p-12 text-center text-muted-foreground">
          <p className="text-sm font-semibold">Nenhuma seção encontrada para os filtros selecionados.</p>
        </div>
      ) : (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map(m => {
            const isHomologated = m.activityDocumentStatus === "consolidada no capítulo";
            const isApproved =
              m.reviewStatus === "aprovado" ||
              m.activityDocumentStatus === "revisada pela seção" ||
              m.activeSubmission?.status === "aprovado";
            const latestRevision = m.revisions?.[m.revisions.length - 1];

            return (
              <div
                key={m.id}
                className={`group relative flex flex-col justify-between rounded-lg border p-4 transition-all ${
                  isHomologated
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : isApproved
                    ? "border-sky-500/40 bg-sky-500/5 shadow-2xs"
                    : "border-border/70 bg-card hover:border-primary/40"
                }`}
              >
                <div className="space-y-3">
                  {/* Top bar: Tomo, Section Code e Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-bold font-mono text-foreground/80">
                        {studyTomeFromCode(m.sectionCode)}
                      </span>
                      {m.sectionCode && (
                        <span className="font-mono text-xs font-bold text-primary">
                          {m.sectionCode}
                        </span>
                      )}
                    </div>
                    {isHomologated ? (
                      <Badge className="bg-emerald-600 text-white text-[10px] font-semibold gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Homologado
                      </Badge>
                    ) : isApproved ? (
                      <Badge className="bg-sky-600 text-white text-[10px] font-semibold gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        Pronto p/ Homologar
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        {m.reviewStatus === "em revisão" ? "Em Revisão" : "Em Elaboração"}
                      </Badge>
                    )}
                  </div>

                  {/* Título do Capítulo */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground leading-snug break-words">
                      {m.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {m.description ?? m.sectionTitle}
                    </p>
                  </div>

                  {/* Informações do Grupo e Responsável */}
                  <div className="rounded border border-border/50 bg-background/80 p-2.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Grupo:</span>
                      <span className="font-semibold text-foreground">
                        {m.responsibleGroupName ?? (m.responsibleGroupId ? `G0${m.responsibleGroupId}` : "—")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Responsável / Autor:</span>
                      <span className="font-medium text-foreground">{m.authorName ?? "—"}</span>
                    </div>
                    {latestRevision && (
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/40 font-mono">
                        <span className="text-muted-foreground">Última Versão:</span>
                        <span className="font-semibold text-primary">R0{latestRevision.revisionNumber} ({latestRevision.fileName})</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rodapé e Ações de Homologação */}
                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                  <Link
                    href={`/?material=${m.id}`}
                    className="text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1"
                  >
                    <Eye className="h-3.5 w-3.5" /> Ver Detalhes
                  </Link>

                  {isHomologated ? (
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Incorporado
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant={isApproved ? "default" : "outline"}
                      onClick={() => {
                        setSelectedMaterialId(m.id);
                        setHomologationNotes("");
                      }}
                      className="h-8 text-xs font-semibold px-3 gap-1.5"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Homologar Capítulo
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Confirmação de Homologação */}
      <Dialog open={selectedMaterialId !== null} onOpenChange={open => !open && setSelectedMaterialId(null)}>
        <DialogContent className="sm:max-w-lg bg-card p-6">
          <DialogHeader className="border-b paper-rule pb-3 text-left">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Confirmar Homologação no Relatório
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {selectedMaterial?.sectionCode ? `${selectedMaterial.sectionCode} — ` : ""}
                  {selectedMaterial?.title}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-3 text-xs">
            <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1">
              <span className="font-semibold text-emerald-800 dark:text-emerald-300 block">
                Efeito da Homologação no Estudo:
              </span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Ao homologar, esta seção será oficialmente marcada como <strong>Consolidada no Capítulo</strong> e incorporada ao relatório final do Estudo BNDES. Os autores e a coordenação geral serão notificados.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground text-xs block">
                Observações de Homologação / Parecer Final (Opcional):
              </label>
              <Textarea
                rows={3}
                value={homologationNotes}
                onChange={e => setHomologationNotes(e.target.value)}
                placeholder="Ex.: Capítulo formatado e integrado às diretrizes editoriais do Tomo..."
                className="text-xs resize-none"
              />
            </div>
          </div>

          <DialogFooter className="border-t pt-3 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedMaterialId(null)}
              disabled={consolidateInChapter.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmHomologation}
              disabled={consolidateInChapter.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
            >
              {consolidateInChapter.isPending ? "Homologando..." : "Confirmar Homologação"}
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
