# Preenchimento das descrições completas nas fichas de capítulo

**Data de execução:** 30 de agosto de 2026  
**Fonte:** Estrutura do Relatório 1 — V1, extração integral registrada em `docs/source/estrutura-relatorio-1-v1-paragrafos.txt`.

## Diagnóstico corrigido

Embora a matriz de descrições V1 já estivesse presente no código do portal, a maior parte dos campos `description` das atividades-mãe no banco ainda continha somente o título do capítulo. Isso fazia com que a seção **Descrição da atividade** nas fichas exibisse textos muito curtos, em vez da descrição analítica prevista no documento de referência.

A sincronização auditável foi reaplicada especificamente aos campos de descrição das atividades-mãe canônicas. Foram atualizados 29 capítulos; o Capítulo II.2 já continha a descrição correta das dimensões de análise definida anteriormente.

## Resultado

| Verificação | Resultado |
|---|---|
| Fichas de capítulo canônicas | 30 |
| Descrições completas gravadas | 30 de 30 |
| Menor tamanho de descrição | 195 caracteres |
| Maior tamanho de descrição | 513 caracteres |
| Campos estruturais e operacionais alterados | 0 |
| Atualizações registradas em histórico | 29 |

Os textos passam a aparecer integralmente na seção **Descrição da atividade** de cada ficha, com preservação de quebras de linha e acesso ao modo de edição rápida, quando autorizado. O texto do Capítulo III.3, por exemplo, abrange políticas de construção naval no mundo, sua relação com o transporte marítimo, justificativas econômicas, estratégicas e geopolíticas, instrumentos de política, casos nacionais e resultados observados.

## Salvaguardas

A atualização alterou somente `activities.description` para os capítulos canônicos. Não foram modificados códigos, títulos, tomos, seções, prazos, entregas editoriais, responsáveis, revisores, materiais, interfaces, checklists ou estados documentais. O script `scripts/sync-v1-activity-descriptions.mjs` preserva um snapshot de antes/depois em `scope_migration_history` para cada alteração.

## Validação

| Verificação | Resultado |
|---|---|
| Integridade das descrições no banco | 30 de 30 descrições com pelo menos 150 caracteres. |
| Renderização da ficha | A ficha utiliza diretamente `data.description` na seção descritiva. |
| Testes automatizados | 29 arquivos e 108 testes aprovados. |
| Tipagem e build | `pnpm check` e `pnpm build` aprovados. |
