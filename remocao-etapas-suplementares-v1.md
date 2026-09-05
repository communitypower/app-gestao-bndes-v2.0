# Remoção das etapas suplementares após autorização

## Decisão registrada

Em **27 de agosto de 2026**, foi autorizada a remoção das 44 etapas adicionadas posteriormente ao catálogo analítico da Estrutura do Relatório 1 — V1. A decisão mantém a itemização do Portal Naval restrita aos **286 subitens analíticos** extraídos do documento V1.

## Salvaguardas

A remoção é executada somente após auditoria dos 44 registros, validação de inexistência de alocações, revisores, marcos, materiais, evidências, interfaces, notificações ou eventos de liderança dependentes e criação de snapshot individual em `scope_migration_history`.

O snapshot preserva o código, título, atividade-mãe, capítulo, responsável, período, estado e progresso existentes em cada etapa removida. A operação é transacional: qualquer dependência inesperada interrompe a remoção integralmente.

## Execução e validação

A auditoria identificou **44 etapas suplementares** dentre 330 etapas cadastradas. Nenhuma delas possuía alocações, revisores, marcos, links de evidência, vínculos de interface, materiais de produção, submissões de revisão, eventos de liderança ou notificações dependentes.

A remoção transacional foi concluída com 44 snapshots em `scope_migration_history`, sob a chave `2026-08-27-remocao-etapas-suplementares-autorizada`. Após a operação, o portal mantém 47 atividades-mãe e **286 etapas analíticas**, correspondentes ao catálogo canônico da Estrutura V1.

Após a remoção, títulos, capítulos e ordenação das etapas remanescentes são reconciliados pelo catálogo analítico V1. A reconciliação não altera responsáveis, períodos, estados, progresso, materiais, evidências, revisões, interfaces ou demais vínculos operacionais das etapas.
