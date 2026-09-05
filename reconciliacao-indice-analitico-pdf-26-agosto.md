# Reconciliação da estrutura do estudo pelo índice analítico do PDF

**Data de execução:** 28 de agosto de 2026  
**Fonte estrutural exclusiva:** `Plano_de_Trabalho-UFRJ_26_agosto.pdf`, Anexo B — Índice Analítico do Relatório 1.

## Decisão de referência

O portal passa a utilizar exclusivamente o índice analítico do PDF de 26 de agosto para definir a hierarquia ativa do estudo. O catálogo canônico é extraído por script reproduzível e alimenta diretamente o domínio e a sincronização de seções do portal. Referências anteriores ao índice V1 ou a catálogos paralelos foram retiradas do fluxo ativo de sincronização e da nomenclatura visível das telas.

## Resultado da reconciliação

| Situação | Capítulos / atividades-mãe | Itens analíticos | Total |
|---|---:|---:|---:|
| Estrutura ativa canônica | 30 | 253 | 283 |
| Registros fora do índice, preservados como arquivados | 17 | 77 | 94 |
| Registros excluídos | 0 | 0 | 0 |

Os 94 registros fora da fonte exclusiva foram preservados no banco, porém deixaram de compor as consultas operacionais, o cronograma e a visão de grupos. Para cada registro, foi gravado snapshot auditável com seus vínculos de alocações, revisores, materiais, submissões, marcos, evidências, interfaces, campo e histórico de liderança. Portanto, não houve remoção de dados operacionais.

## Regra de papéis ampliados

| Papel | Elegibilidade implementada | Salvaguarda preservada |
|---|---|---|
| Coordenador de atividade | Qualquer integrante ativo pode ser designado pelo administrador. | A mudança continua explícita, rastreável e não altera a organização de grupos. |
| Executor e líder de execução | Qualquer integrante ativo pode ser alocado, inclusive quem coordena a atividade. | Permanece obrigatória uma liderança de execução quando houver alocações. |
| Autor de versão | Qualquer integrante ativo pode produzir nova versão de material. | A decisão de revisão continua separada da autoria. |
| Revisor | Qualquer integrante ativo com conta vinculada pode ser apontado. | O coordenador responsável não pode revisar material da própria atividade. |
| Responsável por interface e campo | Qualquer integrante ativo pode ser designado. | Resolução final de interface permanece exclusiva ao responsável designado ou ao administrador. |
| Coordenador e substituto de tomo | Qualquer integrante ativo pode ser indicado pela Administração. | A designação exige justificativa e impede a mesma pessoa nos dois papéis. |

> A alteração flexibiliza a designação de funções, mas não autoriza autoaprovação documental nem substitui deliberação humana por análise automatizada.

## Validações realizadas

| Verificação | Resultado |
|---|---|
| Integridade da estrutura ativa | 30 capítulos, 253 códigos analíticos únicos e zero itens canônicos com fonte divergente. |
| Integridade de responsáveis | Zero atividades canônicas coordenadas por integrante inativo. |
| Histórico auditável | 94 registros de preservação gerados para itens fora da fonte exclusiva. |
| Testes automatizados | 28 arquivos e 99 testes aprovados. |
| Tipagem e build | `pnpm check` e `pnpm build` aprovados. |
| Código ativo | Auditoria sem referências estruturais concorrentes ao PDF de 26 de agosto. |

## Artefatos reproduzíveis

O extrator está em `scripts/extract-pdf-analytic-index.mjs`, o catálogo estruturado em `docs/source/indice-analitico-plano-ufrj-26-agosto.json` e a reconciliação transacional em `scripts/reconcile-to-pdf-analytic-index.mjs`. O resultado da execução foi registrado em `docs/source/resultado-reconciliacao-indice-pdf-26-agosto.json`.
