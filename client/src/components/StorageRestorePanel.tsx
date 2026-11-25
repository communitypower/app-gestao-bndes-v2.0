import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function StorageRestorePanel() {
  const { data, isLoading, refetch } = trpc.administration.storageRestoreList.useQuery();
  const upload = trpc.administration.storageRestoreUpload.useMutation();
  const [busyKey, setBusyKey] = useState<string | null>(null);

  if (isLoading || !data) return null;
  const missing = data.filter(item => !item.exists);

  const handleFile = async (key: string, file: File | undefined) => {
    if (!file) return;
    setBusyKey(key);
    try {
      const res = await upload.mutateAsync({ key, fileBase64: await toBase64(file) });
      toast.success(`Arquivo reposto (${(res.bytes / 1024).toFixed(1)} KB).`);
      await refetch();
    } catch (err: any) {
      toast.error(err?.message ?? "Falha ao repor o arquivo.");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <section className="technical-panel overflow-hidden" data-testid="storage-restore-panel">
      <div className="border-b px-5 py-4">
        <h2 className="text-base font-semibold">Reposição de arquivos perdidos em 22/11/2026</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {missing.length} de {data.length} arquivos referenciados pelas versões e pareceres ainda não estão no
          armazenamento. O arquivo enviado aqui é gravado na chave original, sem criar nova versão, submissão ou parecer.
        </p>
      </div>
      {missing.length > 0 && (
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2">Seção</th>
              <th className="px-4 py-2">Origem</th>
              <th className="px-4 py-2">Arquivo esperado</th>
              <th className="px-4 py-2">Repor</th>
            </tr>
          </thead>
          <tbody>
            {missing.map(item => (
              <tr key={item.key} className="border-t align-top">
                <td className="px-4 py-2 font-mono text-xs">{item.section ?? "—"}</td>
                <td className="px-4 py-2 text-xs">{item.origin === "minuta" ? "Minuta" : "Revisor"}</td>
                <td className="px-4 py-2 text-xs break-all" title={item.key}>{item.label}</td>
                <td className="px-4 py-2">
                  <input
                    type="file"
                    aria-label={`Repor ${item.section ?? ""} ${item.label}`}
                    data-storage-key={item.key}
                    disabled={busyKey !== null}
                    onChange={event => handleFile(item.key, event.target.files?.[0])}
                    className="text-xs"
                  />
                  {busyKey === item.key && <span className="ml-2 text-xs">Enviando…</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
