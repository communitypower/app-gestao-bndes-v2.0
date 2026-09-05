import { readFile, writeFile } from "node:fs/promises";
import mysql from "mysql2/promise";

const sourceFile = "Plano_de_Trabalho-UFRJ_26_agosto.pdf";
const sourceReference = `${sourceFile} — Anexo B, Índice Analítico do Relatório 1`;
const archiveReference = `Arquivada pela reconciliação ao ${sourceFile}`;
const inputPath = "/home/ubuntu/estudo-bndes-gestao/docs/source/indice-analitico-plano-ufrj-26-agosto.json";
const annexADescriptionsPath = "/home/ubuntu/estudo-bndes-gestao/docs/source/descricoes-anexo-a-plano-bndes-26-agosto.json";
const reportPath = "/home/ubuntu/estudo-bndes-gestao/docs/source/resultado-reconciliacao-indice-pdf-26-agosto.json";
const raw = JSON.parse(await readFile(inputPath, "utf8"));
const annexADescriptions = JSON.parse(await readFile(annexADescriptionsPath, "utf8")).descriptions;

/** Ajustes editoriais autorizados pela coordenação, sem criar itens fora do índice. */
const editorialOverrides = {
  "II.2": {
    descriptionAddendum: "Dimensões de análise das experiências nacionais: protecionismo; evolução da indústria; estrutura empresarial; especialização; qualificação tecnológica; recursos humanos; cadeia de fornecedores; inserção internacional; evolução da produtividade; competitividade; resultados produtivos; estratégias de desenvolvimento tecnológico e catching-up.",
    items: ["Japão", "Coreia do Sul", "China", "Singapura", "Estados Unidos", "Países europeus selecionados", "Índia", "Vietnã", "Indonésia", "Outros produtores emergentes"],
  },
  "II.4": {
    descriptionAddendum: "Dimensões de análise dos estaleiros e instalações: evolução das instalações, organização corporativa, capacidade, produção e desempenho; estrutura e situação atuais; segmentos de atuação; carteiras de encomendas; engenharia de projeto e de processos; infraestrutura industrial; processos produtivos; organização e gestão; potencial de reativação, modernização e adaptação.",
    items: ["Estaleiros de construção de navios e embarcações", "Estaleiros de construção de embarcações fluviais", "Estaleiros e instalações para construção de unidades offshore, fabricação e integração de módulos", "Estaleiros de construção naval militar", "Cadeia produtiva, por tipo de produto e região", "Economias e deseconomias de localização e os polos navais"],
  },
};

const sections = [
  {
    code: "AP",
    tome: "Apresentação",
    title: "Apresentação",
    description: "Apresentação geral do Estudo. Descrição do objetivo, metodologia, equipe, estrutura do Portal e do Relatório, banco de dados, audiovisual, sumário executivo e conteúdo dos Relatórios 1 e 2.",
    sortOrder: 1,
  },
  ...raw.tomes
    .filter(tome => tome.code !== "AP")
    .flatMap((tome, tomeIndex) => tome.chapters.map((chapter, chapterIndex) => ({
      code: chapter.code,
      tome: tome.code,
      title: chapter.title,
      description: annexADescriptions[chapter.code] ?? chapter.title,
      sortOrder: 2 + raw.tomes.slice(1, tomeIndex + 1).reduce((count, current) => count + current.chapters.length, 0) + chapterIndex,
    }))),
];
const canonicalItems = raw.tomes
  .filter(tome => tome.code !== "AP")
  .flatMap(tome => tome.chapters.flatMap(chapter => {
    const override = editorialOverrides[chapter.code];
    const items = override
      ? override.items.map((title, index) => ({ code: `${chapter.code}.${index + 1}`, title }))
      : chapter.items;
    return items.map((item, index) => ({
      sectionCode: chapter.code,
      detailCode: item.code,
      detailSortOrder: index + 1,
      title: item.title,
    }));
  }));

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const report = {
  source: sourceReference,
  executedAt: new Date().toISOString(),
  preserved: "Nenhuma atividade, alocação, material, revisão, comentário, interface, marco, evidência ou histórico foi excluído.",
  canonicalParents: [],
  canonicalItemsUpdated: 0,
  canonicalItemsCreated: 0,
  archivedParents: [],
  archivedItems: [],
};

try {
  await connection.beginTransaction();
  const [sectionRows] = await connection.query("SELECT id, code FROM study_sections ORDER BY sortOrder");
  const sectionByCode = new Map(sectionRows.map(section => [section.code, section]));
  const [activeMembers] = await connection.query("SELECT id FROM team_members WHERE active = 1 ORDER BY id LIMIT 1");
  const fallbackResponsibleId = activeMembers[0]?.id;
  if (!fallbackResponsibleId) throw new Error("Não existe integrante ativo para inicializar capítulos canônicos ausentes.");

  for (const section of sections) {
    const stored = sectionByCode.get(section.code);
    if (!stored) throw new Error(`Seção ${section.code} não encontrada.`);
    const description = [section.description, editorialOverrides[section.code]?.descriptionAddendum]
      .filter(Boolean)
      .join("\n\n");
    await connection.execute(
      "UPDATE study_sections SET title = ?, officialDescription = ?, sortOrder = ? WHERE id = ?",
      [section.title, description, section.sortOrder, stored.id]
    );
  }

  const [activityRows] = await connection.query("SELECT * FROM activities ORDER BY sectionId, planSortOrder, id");
  const parentRows = activityRows.filter(activity => activity.parentActivityId === null);
  const canonicalParentBySectionId = new Map();
  for (const section of sections) {
    const stored = sectionByCode.get(section.code);
    const candidates = parentRows
      .filter(activity => activity.sectionId === stored.id)
      .sort((left, right) => (left.planSortOrder ?? Number.MAX_SAFE_INTEGER) - (right.planSortOrder ?? Number.MAX_SAFE_INTEGER) || left.id - right.id);
    const canonical = candidates[0];
    if (canonical) {
      await connection.execute(
        `UPDATE activities SET planCode = ?, planSortOrder = ?, title = ?, description = ?, planningSummary = ?, planningResponsible = NULL, planningSupport = NULL, portalDeliverable = NULL, dependencies = NULL, keywords = NULL, planningStatus = 'Planejada', contentType = 'Capítulo do índice analítico', visibility = 'Interno com publicação após aprovação', acceptanceCriteria = NULL, sourceBase = ?, structureStatus = 'canonica' WHERE id = ?`,
        [section.code, section.sortOrder, section.title, description, description, sourceFile, canonical.id]
      );
      canonicalParentBySectionId.set(stored.id, canonical);
      report.canonicalParents.push({ id: canonical.id, sectionCode: section.code, title: section.title });
      continue;
    }
    const [result] = await connection.execute(
      `INSERT INTO activities (planCode, planSortOrder, title, description, planningSummary, planningStatus, contentType, visibility, sourceBase, structureStatus, sectionId, responsibleId, dueAt, status, progress) VALUES (?, ?, ?, ?, ?, 'Planejada', 'Capítulo do índice analítico', 'Interno com publicação após aprovação', ?, 'canonica', ?, ?, ?, 'pendente', 0)`,
      [section.code, section.sortOrder, section.title, description, description, sourceFile, stored.id, fallbackResponsibleId, Date.UTC(2027, 3, 20, 12, 0, 0)]
    );
    const created = { id: result.insertId, sectionId: stored.id, responsibleId: fallbackResponsibleId, startAt: null, dueAt: Date.UTC(2027, 3, 20, 12, 0, 0) };
    canonicalParentBySectionId.set(stored.id, created);
    report.canonicalParents.push({ id: created.id, sectionCode: section.code, title: section.title });
  }

  const [allRowsAfterParents] = await connection.query("SELECT * FROM activities ORDER BY id");
  const detailByCode = new Map(allRowsAfterParents.filter(activity => activity.detailCode).map(activity => [activity.detailCode, activity]));
  for (const item of canonicalItems) {
    const storedSection = sectionByCode.get(item.sectionCode);
    const parent = canonicalParentBySectionId.get(storedSection.id);
    const existing = detailByCode.get(item.detailCode);
    if (existing) {
      await connection.execute(
        `UPDATE activities SET parentActivityId = ?, detailSortOrder = ?, title = ?, description = ?, planningSummary = ?, planningStatus = 'Planejada', contentType = 'Item do índice analítico', visibility = 'Interno com publicação após aprovação', sourceBase = ?, structureStatus = 'canonica', sectionId = ? WHERE id = ?`,
        [parent.id, item.detailSortOrder, item.title, item.title, item.title, sourceFile, storedSection.id, existing.id]
      );
      report.canonicalItemsUpdated += 1;
    } else {
      await connection.execute(
        `INSERT INTO activities (parentActivityId, detailCode, detailSortOrder, title, description, planningSummary, planningStatus, contentType, visibility, sourceBase, structureStatus, sectionId, responsibleId, startAt, dueAt, status, progress) VALUES (?, ?, ?, ?, ?, ?, 'Planejada', 'Item do índice analítico', 'Interno com publicação após aprovação', ?, 'canonica', ?, ?, ?, ?, 'pendente', 0)`,
        [parent.id, item.detailCode, item.detailSortOrder, item.title, item.title, item.title, sourceFile, storedSection.id, parent.responsibleId, parent.startAt, parent.dueAt]
      );
      report.canonicalItemsCreated += 1;
    }
  }

  const canonicalDetailCodes = new Set(canonicalItems.map(item => item.detailCode));
  const canonicalParentIds = new Set([...canonicalParentBySectionId.values()].map(parent => Number(parent.id)));
  const [allRows] = await connection.query("SELECT * FROM activities ORDER BY id");
  const archivedItems = allRows.filter(activity => activity.parentActivityId !== null && (!activity.detailCode || !canonicalDetailCodes.has(activity.detailCode)));
  const archivedParents = allRows.filter(activity => activity.parentActivityId === null && !canonicalParentIds.has(Number(activity.id)));

  for (const activity of [...archivedItems, ...archivedParents]) {
    const [links] = await connection.query(
      `SELECT
        (SELECT COUNT(*) FROM activity_allocations WHERE activityId = ?) AS allocations,
        (SELECT COUNT(*) FROM activity_reviewers WHERE activityId = ?) AS reviewers,
        (SELECT COUNT(*) FROM production_materials WHERE activityId = ?) AS materials,
        (SELECT COUNT(*) FROM review_submissions WHERE activityId = ?) AS submissions,
        (SELECT COUNT(*) FROM activity_milestones WHERE activityId = ?) AS milestones,
        (SELECT COUNT(*) FROM activity_evidence_links WHERE activityId = ?) AS evidenceLinks,
        (SELECT COUNT(*) FROM interface_activities WHERE activityId = ?) AS interfaces,
        (SELECT COUNT(*) FROM fieldwork_activities WHERE relatedActivityId = ?) AS fieldwork,
        (SELECT COUNT(*) FROM review_checklist_items WHERE activityId = ?) AS reviewChecklistItems,
        (SELECT COUNT(*) FROM activity_leadership_events WHERE activityId = ?) AS leadershipEvents`,
      Array(10).fill(activity.id)
    );
    const target = canonicalParentBySectionId.get(activity.sectionId);
    const snapshot = JSON.stringify({ activity, links: links[0] });
    const action = activity.parentActivityId === null ? "arquivada" : "arquivada";
    await connection.execute(
      `INSERT IGNORE INTO activity_structure_reconciliations (supersededActivityId, canonicalActivityId, action, sourceReference, snapshot, reason, performedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [activity.id, target?.id ?? null, action, sourceReference, snapshot, "Item fora do Anexo B do Plano de Trabalho de 26 de agosto; mantido apenas no histórico auditável.", Date.now()]
    );
    await connection.execute(
      "UPDATE activities SET structureStatus = 'arquivada', sourceBase = ? WHERE id = ?",
      [archiveReference, activity.id]
    );
    const entry = { id: activity.id, code: activity.detailCode ?? activity.planCode, title: activity.title, links: links[0] };
    if (activity.parentActivityId === null) report.archivedParents.push(entry);
    else report.archivedItems.push(entry);
  }
  await connection.commit();
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({
    canonicalParents: report.canonicalParents.length,
    canonicalItemsUpdated: report.canonicalItemsUpdated,
    canonicalItemsCreated: report.canonicalItemsCreated,
    archivedParents: report.archivedParents.length,
    archivedItems: report.archivedItems.length,
  }));
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
