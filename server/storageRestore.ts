import fs from "fs";
import path from "path";
import { sql } from "drizzle-orm";
import { LOCAL_STORAGE_DIR } from "./storage";

// Reposição de arquivos perdidos em 22/11/2026: os registros do banco foram
// restaurados, mas os .docx viviam no disco temporário do contêiner. Este módulo
// lista os arquivos referenciados pelo banco e grava, na chave original, o arquivo
// reenviado pelo administrador — sem criar revisão, submissão ou parecer novos.

export type ReferencedStorageFile = {
  key: string;
  label: string;
  section: string | null;
  origin: "minuta" | "revisor";
  exists: boolean;
};

const LINK_RE = /\[([^\]]+)\]\(\/manus-storage\/([^)\s]+)\)/g;

function resolveInStorage(key: string): string | null {
  const full = path.resolve(LOCAL_STORAGE_DIR, key);
  if (!full.startsWith(LOCAL_STORAGE_DIR + path.sep)) return null;
  return full;
}

export async function listReferencedStorageFiles(db: any): Promise<ReferencedStorageFile[]> {
  const revisions = await db.execute(sql`
    SELECT r."storageKey" AS key, r."fileName" AS label, a."detailCode" AS section, r."revisionNumber" AS rn
    FROM material_revisions r
    JOIN production_materials m ON m.id = r."materialId"
    LEFT JOIN activities a ON a.id = m."activityId"
    ORDER BY a."detailCode", r."revisionNumber"`);
  const notes = await db.execute(sql`
    SELECT d.note AS note, a."detailCode" AS section
    FROM review_decisions d
    JOIN review_submissions s ON s.id = d."submissionId"
    LEFT JOIN activities a ON a.id = s."activityId"
    WHERE d.note LIKE '%/manus-storage/%'
    UNION ALL
    SELECT c.content AS note, a."detailCode" AS section
    FROM material_comments c
    JOIN production_materials m ON m.id = c."materialId"
    LEFT JOIN activities a ON a.id = m."activityId"
    WHERE c.content LIKE '%/manus-storage/%'`);

  const rowsOf = (res: any) => (Array.isArray(res) ? res : res?.rows ?? []);
  const seen = new Map<string, ReferencedStorageFile>();
  for (const row of rowsOf(revisions)) {
    if (!row.key || seen.has(row.key)) continue;
    seen.set(row.key, {
      key: row.key,
      label: `R${String(row.rn).padStart(2, "0")} · ${row.label}`,
      section: row.section ?? null,
      origin: "minuta",
      exists: false,
    });
  }
  for (const row of rowsOf(notes)) {
    for (const match of String(row.note ?? "").matchAll(LINK_RE)) {
      const key = decodeURIComponent(match[2]);
      if (seen.has(key)) continue;
      seen.set(key, { key, label: match[1], section: row.section ?? null, origin: "revisor", exists: false });
    }
  }
  const list = Array.from(seen.values());
  for (const item of list) {
    const full = resolveInStorage(item.key);
    item.exists = Boolean(full && fs.existsSync(full));
  }
  return list.sort((a, b) =>
    (a.section ?? "").localeCompare(b.section ?? "", "pt-BR", { numeric: true }) || a.origin.localeCompare(b.origin)
  );
}

export async function restoreStorageFile(
  db: any,
  input: { key: string; fileBase64: string; overwrite?: boolean }
): Promise<{ key: string; bytes: number }> {
  const referenced = await listReferencedStorageFiles(db);
  const target = referenced.find(item => item.key === input.key);
  if (!target) throw new Error("Esta chave não é referenciada por nenhuma versão ou parecer do portal.");
  if (target.exists && !input.overwrite) throw new Error("O arquivo já existe no armazenamento.");
  const full = resolveInStorage(input.key);
  if (!full) throw new Error("Chave de armazenamento inválida.");

  const buffer = Buffer.from(input.fileBase64, "base64");
  if (buffer.length === 0) throw new Error("Arquivo vazio.");
  await fs.promises.mkdir(path.dirname(full), { recursive: true });
  await fs.promises.writeFile(full, buffer);

  await db.execute(sql`
    UPDATE material_revisions SET "fileSize" = ${buffer.length}
    WHERE "storageKey" = ${input.key} AND "fileSize" = 0`);
  return { key: input.key, bytes: buffer.length };
}
