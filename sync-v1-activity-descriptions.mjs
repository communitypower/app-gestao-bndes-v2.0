import fs from "node:fs";
import mysql from "mysql2/promise";

const migrationKey = "2026-08-30-descricoes-anexo-a-plano-bndes";
const sourceDocument = "Plano_de_Trabalho-UFRJ_26_agosto.pdf — Anexo A, Estrutura do Relatório 1";
const descriptionsPath = new URL("../docs/source/descricoes-anexo-a-plano-bndes-26-agosto.json", import.meta.url);
const auditPath = new URL("../docs/source/resultado-descricoes-anexo-a-plano-bndes-26-agosto.json", import.meta.url);

const source = JSON.parse(fs.readFileSync(descriptionsPath, "utf8"));
const descriptions = new Map(Object.entries(source.descriptions));

if (descriptions.size !== 30) {
  throw new Error(`Mapa do Anexo A inválido: esperadas 30 descrições, encontradas ${descriptions.size}.`);
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.beginTransaction();
  const [activities] = await connection.query(
    "SELECT id, planCode, description, sourceBase, structureStatus FROM activities WHERE parentActivityId IS NULL AND structureStatus = 'canonica' ORDER BY planSortOrder, id"
  );

  if (activities.length !== 30) {
    throw new Error(`Foram encontradas ${activities.length} atividades-mãe canônicas; esperadas 30.`);
  }

  const changes = [];
  for (const activity of activities) {
    const description = descriptions.get(activity.planCode);
    if (!description) {
      throw new Error(`Descrição do Anexo A ausente para a atividade canônica ${activity.planCode}.`);
    }
    if (activity.description === description) continue;

    await connection.query(
      "INSERT IGNORE INTO scope_migration_history (migrationKey, entityType, entityId, action, snapshot) VALUES (?, 'activity', ?, 'descricao_anexo_a_atualizada', ?)",
      [
        migrationKey,
        activity.id,
        JSON.stringify({
          before: { description: activity.description, sourceBase: activity.sourceBase, structureStatus: activity.structureStatus },
          after: { description },
          sourceDocument,
          note: "Atualização exclusiva do campo de descrição com o texto integral do Anexo A; hierarquia e campos operacionais preservados.",
        }),
      ]
    );
    await connection.query("UPDATE activities SET description = ? WHERE id = ?", [description, activity.id]);
    changes.push({ id: activity.id, planCode: activity.planCode, previousDescription: activity.description, description });
  }

  await connection.commit();
  const result = {
    migrationKey,
    sourceDocument,
    canonicalActivityCount: activities.length,
    descriptionCount: descriptions.size,
    updatedCount: changes.length,
    unchangedCount: activities.length - changes.length,
    changes,
  };
  fs.writeFileSync(auditPath, JSON.stringify(result, null, 2), "utf8");
  console.log(`Descrições do Anexo A sincronizadas: ${changes.length} atividades atualizadas; ${result.unchangedCount} já estavam atualizadas.`);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
