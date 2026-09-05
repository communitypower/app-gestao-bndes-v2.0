import { readFile, writeFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const migrationKey = "2026-08-30-reorganizacao-editorial-ii2-ii4";
const sourceDocument = "Orientação da coordenação de 30/08/2026, complementar ao Plano de Trabalho BNDES de 26 de agosto";
const descriptionPath = "/home/ubuntu/estudo-bndes-gestao/docs/source/descricoes-anexo-a-plano-bndes-26-agosto.json";
const outputPath = "/home/ubuntu/estudo-bndes-gestao/docs/source/resultado-reorganizacao-ii2-ii4-2026-08-30.json";

const annexADescriptions = JSON.parse(await readFile(descriptionPath, "utf8")).descriptions;
const overrides = {
  "II.2": {
    dimensions: "Dimensões de análise das experiências nacionais: protecionismo; evolução da indústria; estrutura empresarial; especialização; qualificação tecnológica; recursos humanos; cadeia de fornecedores; inserção internacional; evolução da produtividade; competitividade; resultados produtivos; estratégias de desenvolvimento tecnológico e catching-up.",
    sections: ["Japão", "Coreia do Sul", "China", "Singapura", "Estados Unidos", "Países europeus selecionados", "Índia", "Vietnã", "Indonésia", "Outros produtores emergentes"],
  },
  "II.4": {
    dimensions: "Dimensões de análise dos estaleiros e instalações: evolução das instalações, organização corporativa, capacidade, produção e desempenho; estrutura e situação atuais; segmentos de atuação; carteiras de encomendas; engenharia de projeto e de processos; infraestrutura industrial; processos produtivos; organização e gestão; potencial de reativação, modernização e adaptação.",
    sections: ["Estaleiros de construção de navios e embarcações", "Estaleiros de construção de embarcações fluviais", "Estaleiros e instalações para construção de unidades offshore, fabricação e integração de módulos", "Estaleiros de construção naval militar", "Cadeia produtiva, por tipo de produto e região", "Economias e deseconomias de localização e os polos navais"],
  },
};

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const result = { migrationKey, sourceDocument, updatedParents: [], updatedSections: [], archivedSections: [], preservedLinks: [] };

try {
  await connection.beginTransaction();
  for (const [chapterCode, override] of Object.entries(overrides)) {
    const [parents] = await connection.execute(
      "SELECT id, sectionId, title, description FROM activities WHERE parentActivityId IS NULL AND planCode = ? AND structureStatus = 'canonica' LIMIT 1",
      [chapterCode]
    );
    const parent = parents[0];
    if (!parent) throw new Error(`Capítulo canônico ${chapterCode} não encontrado.`);

    const expectedDescription = [annexADescriptions[chapterCode], override.dimensions].filter(Boolean).join("\n\n");
    if (parent.description !== expectedDescription) {
      await connection.execute(
        "INSERT INTO scope_migration_history (migrationKey, entityType, entityId, action, snapshot) VALUES (?, 'activity', ?, 'descricao_capitulo_reorganizada', ?)",
        [migrationKey, parent.id, JSON.stringify({ before: { description: parent.description }, after: { description: expectedDescription }, sourceDocument })]
      );
      await connection.execute("UPDATE activities SET description = ?, planningSummary = ? WHERE id = ?", [expectedDescription, expectedDescription, parent.id]);
      await connection.execute("UPDATE study_sections SET officialDescription = ? WHERE id = ?", [expectedDescription, parent.sectionId]);
      result.updatedParents.push({ id: parent.id, code: chapterCode });
    }

    const [children] = await connection.execute(
      "SELECT id, detailCode, detailSortOrder, title, description, structureStatus FROM activities WHERE parentActivityId = ? ORDER BY detailSortOrder, id",
      [parent.id]
    );
    const activeChildren = children.filter(child => child.structureStatus === "canonica");
    const exactSequence = activeChildren.length === override.sections.length && activeChildren.every((child, index) => child.title === override.sections[index] && child.detailCode === `${chapterCode}.${index + 1}` && child.detailSortOrder === index + 1);
    if (exactSequence) continue;

    const dimensionIndex = activeChildren.findIndex(child => child.title.startsWith("Dimensões de análise"));
    if (dimensionIndex >= 0) {
      const dimension = activeChildren[dimensionIndex];
      const [links] = await connection.execute(
        `SELECT
          (SELECT COUNT(*) FROM activity_allocations WHERE activityId = ?) AS allocations,
          (SELECT COUNT(*) FROM activity_reviewers WHERE activityId = ?) AS reviewers,
          (SELECT COUNT(*) FROM production_materials WHERE activityId = ?) AS materials,
          (SELECT COUNT(*) FROM review_submissions WHERE activityId = ?) AS submissions,
          (SELECT COUNT(*) FROM interface_activities WHERE activityId = ?) AS interfaces`,
        [dimension.id, dimension.id, dimension.id, dimension.id, dimension.id]
      );
      await connection.execute(
        "INSERT INTO scope_migration_history (migrationKey, entityType, entityId, action, snapshot) VALUES (?, 'activity', ?, 'secao_dimensoes_arquivada_em_descricao', ?)",
        [migrationKey, dimension.id, JSON.stringify({ before: dimension, after: { structureStatus: "arquivada", detailCode: null, parentActivityId: parent.id }, links: links[0], sourceDocument })]
      );
      await connection.execute("UPDATE activities SET structureStatus = 'arquivada', detailCode = NULL, detailSortOrder = NULL WHERE id = ?", [dimension.id]);
      result.archivedSections.push({ id: dimension.id, chapterCode, title: dimension.title, links: links[0] });
    }

    const [rowsAfterDimension] = await connection.execute(
      "SELECT id, title, description, detailCode, detailSortOrder FROM activities WHERE parentActivityId = ? AND structureStatus = 'canonica' ORDER BY detailSortOrder, id",
      [parent.id]
    );
    const surplusRows = rowsAfterDimension.slice(override.sections.length);
    for (const surplus of surplusRows) {
      const [links] = await connection.execute(
        `SELECT
          (SELECT COUNT(*) FROM activity_allocations WHERE activityId = ?) AS allocations,
          (SELECT COUNT(*) FROM activity_reviewers WHERE activityId = ?) AS reviewers,
          (SELECT COUNT(*) FROM production_materials WHERE activityId = ?) AS materials,
          (SELECT COUNT(*) FROM review_submissions WHERE activityId = ?) AS submissions,
          (SELECT COUNT(*) FROM interface_activities WHERE activityId = ?) AS interfaces`,
        [surplus.id, surplus.id, surplus.id, surplus.id, surplus.id]
      );
      await connection.execute(
        "INSERT INTO scope_migration_history (migrationKey, entityType, entityId, action, snapshot) VALUES (?, 'activity', ?, 'secao_duplicada_arquivada_apos_reorganizacao', ?)",
        [migrationKey, surplus.id, JSON.stringify({ before: surplus, after: { structureStatus: "arquivada", detailCode: null, parentActivityId: parent.id }, links: links[0], sourceDocument })]
      );
      await connection.execute("UPDATE activities SET structureStatus = 'arquivada', detailCode = NULL, detailSortOrder = NULL WHERE id = ?", [surplus.id]);
      result.archivedSections.push({ id: surplus.id, chapterCode, title: surplus.title, links: links[0] });
    }

    const [remainingRows] = await connection.execute(
      "SELECT id, title, description, detailCode, detailSortOrder FROM activities WHERE parentActivityId = ? AND structureStatus = 'canonica' ORDER BY detailSortOrder, id",
      [parent.id]
    );
    if (remainingRows.length !== override.sections.length) {
      throw new Error(`${chapterCode} possui ${remainingRows.length} seções operacionais após arquivamento; esperadas ${override.sections.length}.`);
    }

    for (const [index, section] of override.sections.entries()) {
      const current = remainingRows[index];
      const targetCode = `${chapterCode}.${index + 1}`;
      if (current.detailCode === targetCode && current.title === section && current.detailSortOrder === index + 1) continue;
      await connection.execute(
        "INSERT INTO scope_migration_history (migrationKey, entityType, entityId, action, snapshot) VALUES (?, 'activity', ?, 'secao_reordenada_apos_transferencia_de_dimensoes', ?)",
        [migrationKey, current.id, JSON.stringify({ before: current, after: { detailCode: targetCode, detailSortOrder: index + 1, title: section, description: section }, sourceDocument })]
      );
      await connection.execute(
        "UPDATE activities SET detailCode = ?, detailSortOrder = ?, title = ?, description = ?, planningSummary = ? WHERE id = ?",
        [targetCode, index + 1, section, section, section, current.id]
      );
      result.updatedSections.push({ id: current.id, chapterCode, detailCode: targetCode, title: section });
    }
  }
  await connection.commit();
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ updatedParents: result.updatedParents.length, updatedSections: result.updatedSections.length, archivedSections: result.archivedSections.length }, null, 2));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
