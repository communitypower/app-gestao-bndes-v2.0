import { readFile, writeFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const migrationKey = "2026-08-30-grupos-funcionais-g1-g11";
const sourceDocument = "Atividades-Grupos.xlsm, aba Grupos e aba Atividades, recebido em 30/08/2026";
const outputPath = "/home/ubuntu/estudo-bndes-gestao/docs/source/resultado-migracao-grupos-g1-g11-2026-08-30.json";
const groupDefinitions = [
  ["Núcleo", "G1 — Sistematização", "Interinstitucional"],
  ["IE-UFRJ", "G2 — Política Industrial e Cadeia de Suprimentos", "IE-UFRJ"],
  ["AQUAPAR", "G3 — Transporte Marítimo Brasil e Políticas Marítimas", "AQUAPAR"],
  [null, "G4 — Transporte Marítimo Mundial", "Interinstitucional"],
  ["FMM", "G5 — Fundo da Marinha Mercante", "Consultoria"],
  ["Offshore", "G6 — Offshore", "UFRJ"],
  ["Fluvial", "G7 — Fluvial: Transporte e Construção", "IPT / UFPA"],
  ["Descarbonização", "G8 — Descarbonização", "UFRJ"],
  ["Defesa e CN Militar", "G9 — Construção Militar", "UFRJ"],
  [null, "G10 — Construção Naval Mundial e Análise Econômica", "Interinstitucional"],
  ["CN Brasil / Estaleiros", "G11 — Construção Naval no Brasil", "UFRJ / UFPE"],
];

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const result = { migrationKey, sourceDocument, renamed: [], created: [], snapshots: [] };

try {
  await connection.beginTransaction();
  for (const [previousName, nextName, institution] of groupDefinitions) {
    const [existingByTarget] = await connection.execute("SELECT id, name, institution, active FROM team_groups WHERE name = ? LIMIT 1", [nextName]);
    if (existingByTarget[0]) continue;

    if (previousName) {
      const [previousRows] = await connection.execute("SELECT id, name, institution, active FROM team_groups WHERE name = ? LIMIT 1", [previousName]);
      const previous = previousRows[0];
      if (!previous) throw new Error(`Grupo de origem não encontrado: ${previousName}`);
      const [members] = await connection.execute("SELECT id, name, groupRole, active FROM team_members WHERE groupId = ?", [previous.id]);
      const snapshot = { before: previous, members, after: { name: nextName, institution } };
      await connection.execute(
        "INSERT INTO scope_migration_history (migrationKey, entityType, entityId, action, snapshot) VALUES (?, 'team_group', ?, 'grupo_funcional_renomeado', ?)",
        [migrationKey, previous.id, JSON.stringify(snapshot)]
      );
      await connection.execute("UPDATE team_groups SET name = ?, institution = ? WHERE id = ?", [nextName, institution, previous.id]);
      result.renamed.push({ id: previous.id, from: previousName, to: nextName, members: members.length });
      result.snapshots.push({ id: previous.id, action: "grupo_funcional_renomeado" });
    } else {
      const [insert] = await connection.execute("INSERT INTO team_groups (name, institution, active) VALUES (?, ?, true)", [nextName, institution]);
      const createdId = insert.insertId;
      await connection.execute(
        "INSERT INTO scope_migration_history (migrationKey, entityType, entityId, action, snapshot) VALUES (?, 'team_group', ?, 'grupo_funcional_criado_sem_vinculo_primario', ?)",
        [migrationKey, createdId, JSON.stringify({ after: { name: nextName, institution }, sourceDocument, note: "A participação prevista pelo XLSM é matriz de referência; vínculos primários de integrantes foram preservados." })]
      );
      result.created.push({ id: createdId, name: nextName });
      result.snapshots.push({ id: createdId, action: "grupo_funcional_criado_sem_vinculo_primario" });
    }
  }
  await connection.commit();
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ renamed: result.renamed.length, created: result.created.length }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
