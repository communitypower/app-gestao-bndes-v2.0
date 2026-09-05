-- Interfaces críticas identificadas no plano de atividades.
INSERT INTO coordination_interfaces (title, description, interfaceType, responsibleId, priority, status, dueAt, resolution, createdBy)
SELECT 'Demanda e oferta naval', 'Compatibilizar classes de embarcações, volumes, prazos, capacidade produtiva e segmentos prioritários entre os diagnósticos de demanda e oferta naval.', 'dependência', 1, 'alta', 'identificada', NULL, NULL, 1
WHERE NOT EXISTS (SELECT 1 FROM coordination_interfaces WHERE title = 'Demanda e oferta naval');
INSERT INTO coordination_interfaces (title, description, interfaceType, responsibleId, priority, status, dueAt, resolution, createdBy)
SELECT 'Descarbonização e base produtiva', 'Compatibilizar tecnologias, competências, combustíveis, infraestrutura, regulação e conteúdo nacional entre descarbonização e capacidade produtiva.', 'dependência', 5, 'alta', 'identificada', NULL, NULL, 1
WHERE NOT EXISTS (SELECT 1 FROM coordination_interfaces WHERE title = 'Descarbonização e base produtiva');
INSERT INTO coordination_interfaces (title, description, interfaceType, responsibleId, priority, status, dueAt, resolution, createdBy)
SELECT 'Política e financiamento', 'Compatibilizar instrumentos, FMM/AFRMM, riscos, metas, governança e recomendações para o Relatório 2.', 'interface', 3, 'crítica', 'identificada', NULL, NULL, 1
WHERE NOT EXISTS (SELECT 1 FROM coordination_interfaces WHERE title = 'Política e financiamento');
INSERT INTO coordination_interfaces (title, description, interfaceType, responsibleId, priority, status, dueAt, resolution, createdBy)
SELECT 'Experiências internacionais e lições brasileiras', 'Garantir comparabilidade de casos, evidências de missões internacionais e aplicabilidade ao contexto brasileiro.', 'interface', 1, 'alta', 'identificada', NULL, NULL, 1
WHERE NOT EXISTS (SELECT 1 FROM coordination_interfaces WHERE title = 'Experiências internacionais e lições brasileiras');
INSERT INTO coordination_interfaces (title, description, interfaceType, responsibleId, priority, status, dueAt, resolution, createdBy)
SELECT 'Cadastro de estaleiros e cadeia produtiva', 'Compatibilizar instalações, fornecedores, competências, produtividade e oportunidades de reativação.', 'escopo sobreposto', 7, 'alta', 'identificada', NULL, NULL, 1
WHERE NOT EXISTS (SELECT 1 FROM coordination_interfaces WHERE title = 'Cadastro de estaleiros e cadeia produtiva');

-- Itens diretamente relacionados a cada interface.
INSERT IGNORE INTO interface_activities (interfaceId, activityId, role)
SELECT ci.id, a.id, CASE WHEN a.planCode = 'A03' THEN 'origem' ELSE 'relacionada' END FROM coordination_interfaces ci JOIN activities a ON a.planCode IN ('A03','A04','A05','A06','A07','A08','A09','B01','B03','B04','B05','B06','D01') WHERE ci.title = 'Demanda e oferta naval';
INSERT IGNORE INTO interface_activities (interfaceId, activityId, role)
SELECT ci.id, a.id, CASE WHEN a.planCode = 'A11' THEN 'origem' ELSE 'relacionada' END FROM coordination_interfaces ci JOIN activities a ON a.planCode IN ('A11','A12','A13','A14','B08','B09','B10','C01','C04','C06') WHERE ci.title = 'Descarbonização e base produtiva';
INSERT IGNORE INTO interface_activities (interfaceId, activityId, role)
SELECT ci.id, a.id, CASE WHEN a.planCode = 'C01' THEN 'origem' ELSE 'relacionada' END FROM coordination_interfaces ci JOIN activities a ON a.planCode IN ('C01','C02','C03','C04','C05','C06','C09','D01','D02') WHERE ci.title = 'Política e financiamento';
INSERT IGNORE INTO interface_activities (interfaceId, activityId, role)
SELECT ci.id, a.id, CASE WHEN a.planCode = 'B02' THEN 'origem' ELSE 'relacionada' END FROM coordination_interfaces ci JOIN activities a ON a.planCode IN ('B02','B03','C02','C03','C07','C08') WHERE ci.title = 'Experiências internacionais e lições brasileiras';
INSERT IGNORE INTO interface_activities (interfaceId, activityId, role)
SELECT ci.id, a.id, CASE WHEN a.planCode = 'B04' THEN 'origem' ELSE 'relacionada' END FROM coordination_interfaces ci JOIN activities a ON a.planCode IN ('B04','B05','B06','B07','B09','B10') WHERE ci.title = 'Cadastro de estaleiros e cadeia produtiva';

-- As seções e grupos são derivados dos itens diretamente vinculados.
INSERT IGNORE INTO interface_sections (interfaceId, sectionId, role)
SELECT ia.interfaceId, a.sectionId, CASE WHEN MIN(a.planSortOrder) IS NULL THEN 'relacionada' ELSE 'relacionada' END
FROM interface_activities ia JOIN activities a ON a.id = ia.activityId
GROUP BY ia.interfaceId, a.sectionId;
UPDATE interface_sections isec JOIN (
  SELECT ia.interfaceId, MIN(a.sectionId) AS sectionId
  FROM interface_activities ia JOIN activities a ON a.id = ia.activityId
  GROUP BY ia.interfaceId
) origin ON origin.interfaceId = isec.interfaceId AND origin.sectionId = isec.sectionId
SET isec.role = 'origem';
INSERT IGNORE INTO interface_groups (interfaceId, groupId, role)
SELECT ia.interfaceId, tm.groupId, 'envolvido'
FROM interface_activities ia JOIN activities a ON a.id = ia.activityId JOIN team_members tm ON tm.id = a.responsibleId
WHERE tm.groupId IS NOT NULL
GROUP BY ia.interfaceId, tm.groupId;
UPDATE interface_groups ig JOIN coordination_interfaces ci ON ci.id = ig.interfaceId JOIN team_members tm ON tm.id = ci.responsibleId
SET ig.role = 'responsável' WHERE ig.groupId = tm.groupId;

-- Registro inicial de auditoria das interfaces importadas.
INSERT INTO interface_events (interfaceId, actorId, eventType, summary)
SELECT ci.id, 1, 'criada', 'Interface identificada e importada a partir do plano de atividades anexado.'
FROM coordination_interfaces ci
WHERE ci.title IN ('Demanda e oferta naval','Descarbonização e base produtiva','Política e financiamento','Experiências internacionais e lições brasileiras','Cadastro de estaleiros e cadeia produtiva')
AND NOT EXISTS (SELECT 1 FROM interface_events ie WHERE ie.interfaceId = ci.id AND ie.summary = 'Interface identificada e importada a partir do plano de atividades anexado.');

-- Atividades complementares de campo e divulgação. Datas e responsáveis nominais permanecem a definir.
INSERT INTO fieldwork_activities (code, title, description, category, country, location, relatedActivityId, responsibleId, groupId, startAt, dueAt, status, createdBy)
SELECT 'CAMPO-01','Visita técnica a estaleiros brasileiros','Realizar visitas técnicas a estaleiros no Brasil para coleta de dados em fontes primárias, observação de instalações e registro de evidências.','visita a estaleiro','Brasil',NULL,a.id,NULL,NULL,NULL,NULL,'pendente',1 FROM activities a WHERE a.planCode='B04'
ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description), relatedActivityId=VALUES(relatedActivityId);
INSERT INTO fieldwork_activities (code, title, description, category, country, location, relatedActivityId, responsibleId, groupId, startAt, dueAt, status, createdBy)
SELECT 'CAMPO-02','Visita técnica a estaleiros na China','Realizar visitas técnicas a estaleiros na China para coleta de fontes primárias, evidências comparativas e lições de desenvolvimento industrial.','visita a estaleiro','China',NULL,a.id,NULL,NULL,NULL,NULL,'pendente',1 FROM activities a WHERE a.planCode='B02'
ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description), relatedActivityId=VALUES(relatedActivityId);
INSERT INTO fieldwork_activities (code, title, description, category, country, location, relatedActivityId, responsibleId, groupId, startAt, dueAt, status, createdBy)
SELECT 'CAMPO-03','Visita técnica a estaleiros na Índia','Realizar visitas técnicas a estaleiros na Índia para coleta de fontes primárias, evidências comparativas e lições de desenvolvimento industrial.','visita a estaleiro','Índia',NULL,a.id,NULL,NULL,NULL,NULL,'pendente',1 FROM activities a WHERE a.planCode='B02'
ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description), relatedActivityId=VALUES(relatedActivityId);
INSERT INTO fieldwork_activities (code, title, description, category, country, location, relatedActivityId, responsibleId, groupId, startAt, dueAt, status, createdBy)
SELECT 'CAMPO-04','Visita técnica a estaleiros na Coreia do Sul','Realizar visitas técnicas a estaleiros na Coreia do Sul para coleta de fontes primárias, evidências comparativas e lições de desenvolvimento industrial.','visita a estaleiro','Coreia do Sul',NULL,a.id,NULL,NULL,NULL,NULL,'pendente',1 FROM activities a WHERE a.planCode='B02'
ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description), relatedActivityId=VALUES(relatedActivityId);
INSERT INTO fieldwork_activities (code, title, description, category, country, location, relatedActivityId, responsibleId, groupId, startAt, dueAt, status, createdBy)
SELECT 'CAMPO-05','Coleta de dados em fontes primárias','Coletar dados, documentos, registros operacionais e evidências em fontes primárias para os diagnósticos de instalações e capacidade produtiva.','coleta de fonte primária','Brasil',NULL,a.id,NULL,NULL,NULL,NULL,'pendente',1 FROM activities a WHERE a.planCode='B04'
ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description), relatedActivityId=VALUES(relatedActivityId);
INSERT INTO fieldwork_activities (code, title, description, category, country, location, relatedActivityId, responsibleId, groupId, startAt, dueAt, status, createdBy)
SELECT 'CAMPO-06','Entrevistas estruturadas com atores do setor','Conduzir entrevistas estruturadas com estaleiros, fornecedores, entidades e demais atores para validar diagnósticos e registrar evidências qualitativas.','entrevista estruturada','Brasil',NULL,a.id,NULL,NULL,NULL,NULL,'pendente',1 FROM activities a WHERE a.planCode='B04'
ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description), relatedActivityId=VALUES(relatedActivityId);
INSERT INTO fieldwork_activities (code, title, description, category, country, location, relatedActivityId, responsibleId, groupId, startAt, dueAt, status, createdBy)
SELECT 'COM-01','Apresentações de relatórios','Preparar e realizar apresentações dos relatórios para registro de resultados, validação de encaminhamentos e divulgação institucional.','apresentação de relatório',NULL,NULL,a.id,NULL,NULL,NULL,NULL,'pendente',1 FROM activities a WHERE a.planCode='A00'
ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description), relatedActivityId=VALUES(relatedActivityId);
INSERT INTO fieldwork_activities (code, title, description, category, country, location, relatedActivityId, responsibleId, groupId, startAt, dueAt, status, createdBy)
SELECT 'COM-02','Apresentações para a equipe','Realizar apresentações internas para alinhamento de escopo, evidências, interfaces, entregas e decisões de execução.','apresentação para equipe',NULL,NULL,a.id,NULL,NULL,NULL,NULL,'pendente',1 FROM activities a WHERE a.planCode='A00'
ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description), relatedActivityId=VALUES(relatedActivityId);
INSERT INTO fieldwork_activities (code, title, description, category, country, location, relatedActivityId, responsibleId, groupId, startAt, dueAt, status, createdBy)
SELECT 'COM-03','Audiências públicas','Planejar e registrar audiências públicas para apresentação de resultados, recebimento de contribuições e transparência do estudo.','audiência pública','Brasil',NULL,a.id,NULL,NULL,NULL,NULL,'pendente',1 FROM activities a WHERE a.planCode='D01'
ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description), relatedActivityId=VALUES(relatedActivityId);
