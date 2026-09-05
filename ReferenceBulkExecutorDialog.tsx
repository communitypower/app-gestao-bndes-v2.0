import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const DOCUMENT_STATUS_LABELS: Record<string, string> = {
  "planejada": "Planejada",
  "em elaboração": "Em elaboração",
  "submetida à revisão da seção": "Submetida à revisão",
  "em revisão da seção": "Em revisão",
  "ajustes solicitados": "Ajustes solicitados",
  "revisada pela seção": "Revisada pela seção",
};

export function ReferenceBulkExecutorDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const [groupCode, setGroupCode] = useState<"G4" | "G10">("G4");
  const [teamMemberId, setTeamMemberId] = useState("");
  const [allocatedHours, setAllocatedHours] = useState("8");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const { data, isLoading } = trpc.activities.bulkAssignmentTargets.useQuery(
    { groupCode },
    { enabled: open }
  );
  const bulkAssign = trpc.activities.bulkAssignReferenceExecutor.useMutation();

  useEffect(() => {
    setSelectedIds([]);
    setTeamMemberId("");
    setConfirmed(false);
  }, [groupCode, open]);

  const toggleTarget = (id: number, checked: boolean) => {
    setSelectedIds(current =>
      checked ? Array.from(new Set([...current, id])) : current.filter(item => item !== id)
    );
  };

  const save = async () => {
    const hours = Number(allocatedHours);
    if (!teamMemberId || !selectedIds.length || !Number.isFinite(hours) || hours <= 0 || !confirmed) return;
    try {
      const result = await bulkAssign.mutateAsync({
        groupCode,
        teamMemberId: Number(teamMemberId),
        activityIds: selectedIds,
        allocatedHours: hours,
      });
      await Promise.all([
        utils.activities.list.invalidate(),
        utils.activities.statusReport.invalidate(),
        utils.activities.bulkAssignmentTargets.invalidate(),
      ]);
      toast.success(`${result.updated} seção(ões) receberam executor de ${groupCode}.`);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível concluir a atribuição em lote.");
    }
  };

  const targetCount = data?.targets.length ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto bg-card sm:max-w-3xl">
        <DialogHeader>
          <p className="editorial-kicker text-primary">Matriz de referência XLSM</p>
          <DialogTitle className="font-display text-3xl font-semibold tracking-[-.03em]">
            Atribuir executores em lote
          </DialogTitle>
          <DialogDescription>
            Selecione seções ainda sem executor nos grupos G4 ou G10. A designação registra horas previstas, liderança de execução e referência à matriz Atividades-Grupos.xlsm.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-5 grid gap-4 border-y paper-rule py-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="bulk-reference-group">Grupo funcional</Label>
            <Select value={groupCode} onValueChange={value => setGroupCode(value as "G4" | "G10")}>
              <SelectTrigger id="bulk-reference-group" className="mt-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="G4">G4 — Transporte Marítimo Mundial</SelectItem>
                <SelectItem value="G10">G10 — Construção Naval Mundial e Análise Econômica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="bulk-executor">Executor</Label>
            <Select value={teamMemberId} onValueChange={setTeamMemberId}>
              <SelectTrigger id="bulk-executor" className="mt-2"><SelectValue placeholder="Selecionar integrante ativo" /></SelectTrigger>
              <SelectContent>
                {(data?.eligibleMembers ?? []).map(member => <SelectItem key={member.id} value={String(member.id)}>{member.name} · {member.institution}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="bulk-hours">Horas previstas por seção</Label>
            <Input id="bulk-hours" className="mt-2" type="number" min="0.5" step="0.5" value={allocatedHours} onChange={event => setAllocatedHours(event.target.value)} />
          </div>
          <p className="self-end text-xs leading-5 text-muted-foreground">A atribuição não substitui executores já vigentes e só alcança as seções pendentes da matriz de referência.</p>
        </div>

        {isLoading ? <p className="py-10 text-center text-sm text-muted-foreground">Carregando seções pendentes…</p> : (
          <div className="mt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="font-editorial text-lg font-semibold">Seções pendentes</p><p className="text-xs text-muted-foreground">{data?.groupLabel} · {targetCount} sem executor</p></div>
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedIds(selectedIds.length === targetCount ? [] : (data?.targets.map(item => item.id) ?? []))}>{selectedIds.length === targetCount ? "Limpar seleção" : "Selecionar todas"}</Button>
            </div>
            <div className="mt-3 max-h-72 divide-y paper-rule overflow-y-auto border-y paper-rule">
              {(data?.targets ?? []).map(item => <label key={item.id} className="flex cursor-pointer items-start gap-3 py-3"><Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={value => toggleTarget(item.id, value === true)} className="mt-1 rounded-none" /><span className="min-w-0"><span className="block text-sm font-semibold">{item.planCode} · {item.title}</span><span className="mt-1 block text-xs text-muted-foreground">Entrega: {formatDate(item.dueAt)} · {DOCUMENT_STATUS_LABELS[item.documentStatus] ?? item.documentStatus}</span></span></label>)}
              {!targetCount && <p className="py-8 text-center text-sm text-muted-foreground">Não há seções pendentes para este grupo de referência.</p>}
            </div>
          </div>
        )}

        <label className="mt-5 flex cursor-pointer items-start gap-3 border-y paper-rule py-4 text-sm">
          <Checkbox checked={confirmed} onCheckedChange={value => setConfirmed(value === true)} className="mt-0.5 rounded-none" />
          <span>Confirmo a atribuição de {selectedIds.length} seção(ões) com {allocatedHours || "0"} hora(s) previstas por seção e referência ao grupo {groupCode}.</span>
        </label>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => void save()} disabled={bulkAssign.isPending || !confirmed || !selectedIds.length || !teamMemberId || Number(allocatedHours) <= 0}>{bulkAssign.isPending ? "Atribuindo…" : `Atribuir ${selectedIds.length} executor(es)`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
