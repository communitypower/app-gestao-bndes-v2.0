# Descrições das atividades conforme a Estrutura do Relatório 1 — V1

**Data de execução:** 28 de agosto de 2026  
**Fonte descritiva:** `Estrutura-Relatorio_1.docx`  
**Referência estrutural preservada:** Anexo B do `Plano_de_Trabalho-UFRJ_26_agosto.pdf`.

## Escopo da atualização

Foram preenchidos os campos `description` das 30 atividades-mãe canônicas com os textos descritivos correspondentes da Estrutura do Relatório 1 — V1. A atualização abrange Apresentação, oito capítulos do Tomo I, nove capítulos do Tomo II, nove capítulos do Tomo III e três capítulos do Tomo IV.

> A Estrutura do Relatório 1 — V1 foi utilizada apenas como fonte dos textos descritivos. A hierarquia ativa — capítulos, ordem e 253 itens analíticos — continua sendo determinada exclusivamente pelo Anexo B do Plano de Trabalho de 26 de agosto.

## Preservação e auditoria

| Elemento | Tratamento |
|---|---|
| Hierarquia de capítulos e itens | Não alterada: 30 atividades-mãe e 253 itens analíticos permanecem ativos. |
| Títulos, códigos e ordenação | Não alterados. |
| Prazos, responsáveis, alocações, revisores, materiais, evidências, interfaces e histórico | Não alterados. |
| Campo atualizado | Somente `activities.description` nas 30 atividades-mãe canônicas. |
| Auditoria | Um snapshot de antes/depois foi gravado para cada atividade alterada. |

O script reproduzível `scripts/sync-v1-activity-descriptions.mjs` valida os 30 códigos canônicos, aplica a mudança em transação e emite o registro `docs/source/resultado-descricoes-atividades-v1.json`. A sincronização estrutural pelo PDF foi ajustada para não substituir essas descrições V1 em carregamentos posteriores.

## Validações

| Verificação | Resultado |
|---|---|
| Atividades-mãe canônicas | 30 registros, todos com descrição V1 detalhada. |
| Tamanho dos textos armazenados | Entre 195 e 513 caracteres. |
| Histórico da atualização | 30 snapshots auditáveis registrados. |
| Estrutura analítica ativa | 253 itens preservados. |
| Testes e TypeScript | 28 arquivos, 100 testes e `pnpm check` aprovados. |
| Build de produção | `pnpm build` aprovado. |
