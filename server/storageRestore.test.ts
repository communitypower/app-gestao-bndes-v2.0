import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { requireDb } from "./db";
import { LOCAL_STORAGE_DIR } from "./storage";
import { listReferencedStorageFiles, restoreStorageFile } from "./storageRestore";

describe("reposição de arquivos perdidos", () => {
  it("só grava em chaves referenciadas e atualiza o tamanho da versão", async () => {
    const db = await requireDb();
    const act: any = await db.execute(sql`SELECT id, "sectionId" FROM activities ORDER BY id LIMIT 1`);
    const a = (act.rows ?? act)[0];
    const usr: any = await db.execute(sql`SELECT id FROM users ORDER BY id LIMIT 1`);
    const u = (usr.rows ?? usr)[0];
    const key = `production/TEST/${Date.now()}-teste.docx`;
    const mat: any = await db.execute(sql`INSERT INTO production_materials (title,"activityId","sectionId","createdBy") VALUES ('t', ${a.id}, ${a.sectionId}, ${u.id}) RETURNING id`);
    const m = (mat.rows ?? mat)[0];
    await db.execute(sql`INSERT INTO material_revisions ("materialId","revisionNumber","fileName","mimeType","fileSize","storageKey","storageUrl","uploadedBy") VALUES (${m.id}, 1, 'teste.docx', 'x', 0, ${key}, ${"/manus-storage/" + key}, ${u.id})`);

    const before = await listReferencedStorageFiles(db);
    expect(before.find(i => i.key === key)?.exists).toBe(false);

    await expect(restoreStorageFile(db, { key: "production/outra.docx", fileBase64: "YQ==" })).rejects.toThrow();
    const res = await restoreStorageFile(db, { key, fileBase64: Buffer.from("conteudo").toString("base64") });
    expect(res.bytes).toBe(8);
    expect(fs.readFileSync(path.resolve(LOCAL_STORAGE_DIR, key), "utf8")).toBe("conteudo");
    await expect(restoreStorageFile(db, { key, fileBase64: "YQ==" })).rejects.toThrow();

    const size: any = await db.execute(sql`SELECT "fileSize" FROM material_revisions WHERE "storageKey" = ${key}`);
    expect((size.rows ?? size)[0].fileSize).toBe(8);
    fs.rmSync(path.resolve(LOCAL_STORAGE_DIR, "production/TEST"), { recursive: true, force: true });
  });
});
