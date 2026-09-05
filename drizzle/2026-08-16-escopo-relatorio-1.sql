START TRANSACTION;

SET @migration_key = '2026-08-16-relatorio-1-scope-team-v1';

INSERT IGNORE INTO scope_migration_history (migrationKey, entityType, entityId, action, snapshot)
SELECT @migration_key, 'study_section', id, 'remapeado', JSON_OBJECT(
  'code', code,
  'title', title,
  'sortOrder', sortOrder
)
FROM study_sections;

INSERT IGNORE INTO scope_migration_history (migrationKey, entityType, entityId, action, snapshot)
SELECT @migration_key, 'activity', id, 'remapeada', JSON_OBJECT(
  'title', title,
  'description', description,
  'sectionId', sectionId,
  'responsibleId', responsibleId,
  'dueAt', dueAt,
  'status', status,
  'progress', progress
)
FROM activities;

INSERT IGNORE INTO scope_migration_history (migrationKey, entityType, entityId, action, snapshot)
SELECT @migration_key, 'team_group', id, 'renomeado', JSON_OBJECT(
  'name', name,
  'institution', institution,
  'active', active
)
FROM team_groups;

INSERT IGNORE INTO scope_migration_history (migrationKey, entityType, entityId, action, snapshot)
SELECT @migration_key, 'team_member', id, 'reorganizado', JSON_OBJECT(
  'userId', userId,
  'groupId', groupId,
  'groupRole', groupRole,
  'name', name,
  'title', title,
  'institution', institution,
  'active', active
)
FROM team_members;

INSERT IGNORE INTO scope_migration_history (migrationKey, entityType, entityId, action, snapshot)
SELECT @migration_key, 'activity_allocation', id, 'revalidada', JSON_OBJECT(
  'activityId', activityId,
  'teamMemberId', teamMemberId,
  'allocatedHours', allocatedHours
)
FROM activity_allocations;

INSERT IGNORE INTO scope_migration_history (migrationKey, entityType, entityId, action, snapshot)
SELECT @migration_key, 'production_material', id, 'preservado', JSON_OBJECT(
  'title', title,
  'description', description,
  'activityId', activityId,
  'sectionId', sectionId,
  'reviewStatus', reviewStatus,
  'currentRevision', currentRevision
)
FROM production_materials;

UPDATE project_settings
SET name = 'Relatório 1 — Ambiente Econômico, Tecnológico e Institucional da Indústria Naval';

UPDATE team_groups SET name = 'Núcleo', institution = 'Interinstitucional', active = 1 WHERE name = 'Grupo UFRJ';
UPDATE team_groups SET name = 'AQUAPAR', institution = 'AQUAPAR', active = 1 WHERE name = 'Grupo FURG';
UPDATE team_groups SET name = 'IE-UFRJ', institution = 'IE-UFRJ', active = 1 WHERE name = 'Grupo UFPE';
UPDATE team_groups SET name = 'FMM', institution = 'Consultoria', active = 1 WHERE name = 'Grupo IPT';
UPDATE team_groups SET name = 'Fluvial', institution = 'IPT / UFPA', active = 1 WHERE name = 'Grupo UFPA';
UPDATE team_groups SET name = 'CN Brasil / Estaleiros', institution = 'UFRJ / UFPE', active = 1 WHERE name = 'Grupo UFU';
UPDATE team_groups SET name = 'Defesa e CN Militar', institution = 'UFRJ', active = 1 WHERE name = 'Grupo FACAMP';
UPDATE team_groups SET name = 'Offshore', institution = 'UFRJ', active = 1 WHERE name = 'Grupo Consultoria';
UPDATE team_groups SET name = 'Descarbonização', institution = 'UFRJ', active = 1 WHERE name = 'Grupo UCL';

UPDATE team_members SET groupId = NULL, groupRole = 'participante', active = 0;

UPDATE team_members
SET groupId = (SELECT id FROM team_groups WHERE name = 'Núcleo' LIMIT 1), groupRole = 'participante', active = 1
WHERE name IN ('Floriano Carlos Martins Pires Jr.', 'Luiz Felipe Assis', 'Cassiano Marins de Souza');
UPDATE team_members SET groupRole = 'coordenador' WHERE name = 'Floriano Carlos Martins Pires Jr.';

UPDATE team_members
SET groupId = (SELECT id FROM team_groups WHERE name = 'AQUAPAR' LIMIT 1), groupRole = 'participante', active = 1
WHERE name IN ('Armando Freigedo Rodrigues Filho', 'Paulo Octavio de Paiva Almeida');
UPDATE team_members SET groupRole = 'coordenador' WHERE name = 'Armando Freigedo Rodrigues Filho';

UPDATE team_members
SET groupId = (SELECT id FROM team_groups WHERE name = 'IE-UFRJ' LIMIT 1), groupRole = 'participante', active = 1
WHERE name IN ('Carlos Frederico Leão Rocha', 'Marcelo Colomer Ferraro', 'Helder Queiroz Pinto Junior');
UPDATE team_members SET groupRole = 'coordenador' WHERE name = 'Carlos Frederico Leão Rocha';

UPDATE team_members
SET groupId = (SELECT id FROM team_groups WHERE name = 'FMM' LIMIT 1), groupRole = 'coordenador', active = 1
WHERE name = 'Marcos B. Cozzolino do Nascimento';

UPDATE team_members
SET groupId = (SELECT id FROM team_groups WHERE name = 'Fluvial' LIMIT 1), groupRole = 'participante', active = 1
WHERE name IN ('Carlos Daher Padovezi', 'Pedro Igor Dias Lameira');
UPDATE team_members SET groupRole = 'coordenador' WHERE name = 'Carlos Daher Padovezi';

UPDATE team_members
SET groupId = (SELECT id FROM team_groups WHERE name = 'CN Brasil / Estaleiros' LIMIT 1), groupRole = 'participante', active = 1
WHERE name IN ('Marta Cecilia Tapia Reyes', 'Marcos Pereira');
UPDATE team_members SET groupRole = 'coordenador' WHERE name = 'Marta Cecilia Tapia Reyes';

UPDATE team_members
SET groupId = (SELECT id FROM team_groups WHERE name = 'Defesa e CN Militar' LIMIT 1), groupRole = 'coordenador', active = 1
WHERE name = 'Andre Ricardo Mendonça Pinheiro';

UPDATE team_members
SET groupId = (SELECT id FROM team_groups WHERE name = 'Offshore' LIMIT 1), groupRole = 'coordenador', active = 1
WHERE name = 'Marcelo Igor Lourenço de Souza';

UPDATE team_members
SET groupId = (SELECT id FROM team_groups WHERE name = 'Descarbonização' LIMIT 1), groupRole = 'coordenador', active = 1
WHERE name = 'Jean David J. E. Marie Caprace';

UPDATE study_sections SET code = 'II.2', title = 'Experiências nacionais de desenvolvimento da construção naval', sortOrder = 11 WHERE code = '5.1';
UPDATE study_sections SET code = 'III.1', title = 'Fundamentos e tendências da política industrial marítima', sortOrder = 19 WHERE code = '5.2';
UPDATE study_sections SET code = 'I.3', title = 'Transporte Marítimo Mundial', sortOrder = 4 WHERE code = '5.3';
UPDATE study_sections SET code = 'I.6', title = 'Indústria de Óleo e Gás e Energia Eólica Offshore', sortOrder = 7 WHERE code = '5.4';
UPDATE study_sections SET code = 'II.1', title = 'Construção Naval Mundial', sortOrder = 10 WHERE code = '5.5';
UPDATE study_sections SET code = 'I.4', title = 'Transporte Marítimo no Brasil', sortOrder = 5 WHERE code = '5.6';
UPDATE study_sections SET code = 'I.5', title = 'Transporte Hidroviário Interior', sortOrder = 6 WHERE code = '5.7';
UPDATE study_sections SET code = 'II.9', title = 'Descarbonização: oportunidades e desafios para a indústria naval', sortOrder = 18 WHERE code = '5.8';
UPDATE study_sections SET code = 'I.8', title = 'Descarbonização na Indústria Marítima', sortOrder = 9 WHERE code = '5.9';
UPDATE study_sections SET code = 'II.3', title = 'Construção naval e offshore no Brasil', sortOrder = 12 WHERE code = '5.10';
UPDATE study_sections SET code = 'I.7', title = 'Defesa Naval', sortOrder = 8 WHERE code = '5.11';
UPDATE study_sections SET code = 'II.4', title = 'Estrutura atual e capacidade dos estaleiros brasileiros', sortOrder = 13 WHERE code = '5.12';
UPDATE study_sections SET code = 'II.5', title = 'Reparo, conversão, desmantelamento e descomissionamento', sortOrder = 14 WHERE code = '5.13';
UPDATE study_sections SET code = 'II.6', title = 'Cadeia produtiva da indústria de construção naval', sortOrder = 15 WHERE code = '5.14';
UPDATE study_sections SET code = 'II.8', title = 'Produtividade e competitividade', sortOrder = 17 WHERE code = '5.15';
UPDATE study_sections SET code = 'III.2', title = 'Políticas de marinha mercante no mundo', sortOrder = 20 WHERE code = '5.16';
UPDATE study_sections SET code = 'III.3', title = 'Políticas de construção naval no mundo', sortOrder = 21 WHERE code = '5.17';
UPDATE study_sections SET code = 'III.4', title = 'Políticas brasileiras de marinha mercante e construção naval', sortOrder = 22 WHERE code = '5.18';
UPDATE study_sections SET code = 'III.5', title = 'O Fundo da Marinha Mercante', sortOrder = 23 WHERE code = '5.19';
UPDATE study_sections SET code = 'III.8', title = 'Fatores geopolíticos e ambientais críticos para a retomada da indústria naval brasileira', sortOrder = 26 WHERE code = '5.20';
UPDATE study_sections SET code = 'III.9', title = 'Cenários econômicos e institucionais para a indústria marítima brasileira', sortOrder = 27 WHERE code = '5.21';

INSERT INTO study_sections (code, title, sortOrder) VALUES
  ('AP', 'Apresentação do Relatório 1', 1),
  ('I.1', 'Introdução', 2),
  ('I.2', 'Economia Marítima', 3),
  ('II.7', 'Padrão tecnológico e recursos humanos', 16),
  ('III.6', 'Setores críticos da cadeia de suprimentos: siderurgia e materiais e equipamentos navais', 24),
  ('III.7', 'Os ciclos de expansão e queda da indústria naval — Diagnóstico de sucessos e falhas', 25),
  ('IV.1', 'Cenários de demanda para a indústria naval brasileira', 28),
  ('IV.2', 'Conclusões do Relatório 1', 29)
ON DUPLICATE KEY UPDATE title = VALUES(title), sortOrder = VALUES(sortOrder);

UPDATE activities a JOIN study_sections s ON s.id = a.sectionId
SET a.title = s.title,
    a.description = CASE WHEN a.description LIKE 'Consolidar referências, evidências, análise e conclusões para %' THEN CONCAT('Consolidar referências, evidências, análise e conclusões para ', s.title, ', conforme o escopo oficial do Relatório 1.') ELSE a.description END,
    a.responsibleId = (SELECT id FROM team_members WHERE name = 'Floriano Carlos Martins Pires Jr.' LIMIT 1)
WHERE s.code IN ('II.2', 'I.3', 'II.1', 'II.3', 'II.8');

UPDATE activities a JOIN study_sections s ON s.id = a.sectionId
SET a.title = s.title,
    a.description = CASE WHEN a.description LIKE 'Consolidar referências, evidências, análise e conclusões para %' THEN CONCAT('Consolidar referências, evidências, análise e conclusões para ', s.title, ', conforme o escopo oficial do Relatório 1.') ELSE a.description END,
    a.responsibleId = (SELECT id FROM team_members WHERE name = 'Armando Freigedo Rodrigues Filho' LIMIT 1)
WHERE s.code IN ('I.4', 'III.2', 'III.3', 'III.4');

UPDATE activities a JOIN study_sections s ON s.id = a.sectionId
SET a.title = s.title,
    a.description = CASE WHEN a.description LIKE 'Consolidar referências, evidências, análise e conclusões para %' THEN CONCAT('Consolidar referências, evidências, análise e conclusões para ', s.title, ', conforme o escopo oficial do Relatório 1.') ELSE a.description END,
    a.responsibleId = (SELECT id FROM team_members WHERE name = 'Carlos Frederico Leão Rocha' LIMIT 1)
WHERE s.code IN ('III.1', 'II.6', 'III.8', 'III.9');

UPDATE activities a JOIN study_sections s ON s.id = a.sectionId
SET a.title = s.title,
    a.description = CASE WHEN a.description LIKE 'Consolidar referências, evidências, análise e conclusões para %' THEN CONCAT('Consolidar referências, evidências, análise e conclusões para ', s.title, ', conforme o escopo oficial do Relatório 1.') ELSE a.description END,
    a.responsibleId = (SELECT id FROM team_members WHERE name = 'Marcos B. Cozzolino do Nascimento' LIMIT 1)
WHERE s.code = 'III.5';

UPDATE activities a JOIN study_sections s ON s.id = a.sectionId
SET a.title = s.title,
    a.description = CASE WHEN a.description LIKE 'Consolidar referências, evidências, análise e conclusões para %' THEN CONCAT('Consolidar referências, evidências, análise e conclusões para ', s.title, ', conforme o escopo oficial do Relatório 1.') ELSE a.description END,
    a.responsibleId = (SELECT id FROM team_members WHERE name = 'Carlos Daher Padovezi' LIMIT 1)
WHERE s.code = 'I.5';

UPDATE activities a JOIN study_sections s ON s.id = a.sectionId
SET a.title = s.title,
    a.description = CASE WHEN a.description LIKE 'Consolidar referências, evidências, análise e conclusões para %' THEN CONCAT('Consolidar referências, evidências, análise e conclusões para ', s.title, ', conforme o escopo oficial do Relatório 1.') ELSE a.description END,
    a.responsibleId = (SELECT id FROM team_members WHERE name = 'Marta Cecilia Tapia Reyes' LIMIT 1)
WHERE s.code = 'II.4';

UPDATE activities a JOIN study_sections s ON s.id = a.sectionId
SET a.title = s.title,
    a.description = CASE WHEN a.description LIKE 'Consolidar referências, evidências, análise e conclusões para %' THEN CONCAT('Consolidar referências, evidências, análise e conclusões para ', s.title, ', conforme o escopo oficial do Relatório 1.') ELSE a.description END,
    a.responsibleId = (SELECT id FROM team_members WHERE name = 'Andre Ricardo Mendonça Pinheiro' LIMIT 1)
WHERE s.code = 'I.7';

UPDATE activities a JOIN study_sections s ON s.id = a.sectionId
SET a.title = s.title,
    a.description = CASE WHEN a.description LIKE 'Consolidar referências, evidências, análise e conclusões para %' THEN CONCAT('Consolidar referências, evidências, análise e conclusões para ', s.title, ', conforme o escopo oficial do Relatório 1.') ELSE a.description END,
    a.responsibleId = (SELECT id FROM team_members WHERE name = 'Marcelo Igor Lourenço de Souza' LIMIT 1)
WHERE s.code IN ('I.6', 'II.5');

UPDATE activities a JOIN study_sections s ON s.id = a.sectionId
SET a.title = s.title,
    a.description = CASE WHEN a.description LIKE 'Consolidar referências, evidências, análise e conclusões para %' THEN CONCAT('Consolidar referências, evidências, análise e conclusões para ', s.title, ', conforme o escopo oficial do Relatório 1.') ELSE a.description END,
    a.responsibleId = (SELECT id FROM team_members WHERE name = 'Jean David J. E. Marie Caprace' LIMIT 1)
WHERE s.code IN ('I.8', 'II.9');

INSERT INTO activities (title, description, sectionId, responsibleId, dueAt, status, progress)
SELECT s.title, CONCAT('Consolidar referências, evidências, análise e conclusões para ', s.title, ', conforme o escopo oficial do Relatório 1.'), s.id, m.id, 1787677200000, 'pendente', 0
FROM study_sections s JOIN team_members m ON m.name = 'Floriano Carlos Martins Pires Jr.'
WHERE s.code = 'AP' AND NOT EXISTS (SELECT 1 FROM activities a WHERE a.sectionId = s.id);
INSERT INTO activities (title, description, sectionId, responsibleId, dueAt, status, progress)
SELECT s.title, CONCAT('Consolidar referências, evidências, análise e conclusões para ', s.title, ', conforme o escopo oficial do Relatório 1.'), s.id, m.id, 1787677200000, 'pendente', 0
FROM study_sections s JOIN team_members m ON m.name = 'Floriano Carlos Martins Pires Jr.'
WHERE s.code = 'I.1' AND NOT EXISTS (SELECT 1 FROM activities a WHERE a.sectionId = s.id);
INSERT INTO activities (title, description, sectionId, responsibleId, dueAt, status, progress)
SELECT s.title, CONCAT('Consolidar referências, evidências, análise e conclusões para ', s.title, ', conforme o escopo oficial do Relatório 1.'), s.id, m.id, 1787677200000, 'pendente', 0
FROM study_sections s JOIN team_members m ON m.name = 'Floriano Carlos Martins Pires Jr.'
WHERE s.code = 'I.2' AND NOT EXISTS (SELECT 1 FROM activities a WHERE a.sectionId = s.id);
INSERT INTO activities (title, description, sectionId, responsibleId, dueAt, status, progress)
SELECT s.title, CONCAT('Consolidar referências, evidências, análise e conclusões para ', s.title, ', conforme o escopo oficial do Relatório 1.'), s.id, m.id, 1795626000000, 'pendente', 0
FROM study_sections s JOIN team_members m ON m.name = 'Floriano Carlos Martins Pires Jr.'
WHERE s.code = 'II.7' AND NOT EXISTS (SELECT 1 FROM activities a WHERE a.sectionId = s.id);
INSERT INTO activities (title, description, sectionId, responsibleId, dueAt, status, progress)
SELECT s.title, CONCAT('Consolidar referências, evidências, análise e conclusões para ', s.title, ', conforme o escopo oficial do Relatório 1.'), s.id, m.id, 1798218000000, 'pendente', 0
FROM study_sections s JOIN team_members m ON m.name = 'Carlos Frederico Leão Rocha'
WHERE s.code = 'III.6' AND NOT EXISTS (SELECT 1 FROM activities a WHERE a.sectionId = s.id);
INSERT INTO activities (title, description, sectionId, responsibleId, dueAt, status, progress)
SELECT s.title, CONCAT('Consolidar referências, evidências, análise e conclusões para ', s.title, ', conforme o escopo oficial do Relatório 1.'), s.id, m.id, 1798218000000, 'pendente', 0
FROM study_sections s JOIN team_members m ON m.name = 'Floriano Carlos Martins Pires Jr.'
WHERE s.code = 'III.7' AND NOT EXISTS (SELECT 1 FROM activities a WHERE a.sectionId = s.id);
INSERT INTO activities (title, description, sectionId, responsibleId, dueAt, status, progress)
SELECT s.title, CONCAT('Consolidar referências, evidências, análise e conclusões para ', s.title, ', conforme o escopo oficial do Relatório 1.'), s.id, m.id, 1800896400000, 'pendente', 0
FROM study_sections s JOIN team_members m ON m.name = 'Floriano Carlos Martins Pires Jr.'
WHERE s.code = 'IV.1' AND NOT EXISTS (SELECT 1 FROM activities a WHERE a.sectionId = s.id);
INSERT INTO activities (title, description, sectionId, responsibleId, dueAt, status, progress)
SELECT s.title, CONCAT('Consolidar referências, evidências, análise e conclusões para ', s.title, ', conforme o escopo oficial do Relatório 1.'), s.id, m.id, 1800896400000, 'pendente', 0
FROM study_sections s JOIN team_members m ON m.name = 'Floriano Carlos Martins Pires Jr.'
WHERE s.code = 'IV.2' AND NOT EXISTS (SELECT 1 FROM activities a WHERE a.sectionId = s.id);

UPDATE activity_allocations aa
JOIN activities a ON a.id = aa.activityId
JOIN team_members member ON member.id = aa.teamMemberId
JOIN team_members responsible ON responsible.id = a.responsibleId
SET aa.allocationType = 'histórica',
    aa.note = 'Alocação preservada da estrutura anterior à reorganização do escopo e da equipe em 16/08/2026.'
WHERE member.active = 0
   OR member.groupRole <> 'participante'
   OR member.groupId IS NULL
   OR member.groupId <> responsible.groupId;

COMMIT;
