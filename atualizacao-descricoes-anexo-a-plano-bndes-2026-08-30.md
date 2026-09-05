# Atualização exclusiva das descrições pelo Anexo A do Plano de Trabalho BNDES

**Data de execução:** 30 de agosto de 2026  
**Fonte aplicada:** `Plano_de_Trabalho-UFRJ_26_agosto.pdf` — **Anexo A, Estrutura do Relatório 1**.

## Escopo autorizado e aplicado

Conforme a orientação da coordenação, esta atualização foi limitada à substituição dos textos de descrição das fichas dos 30 capítulos. As descrições resumidas anteriormente registradas foram substituídas pelos textos completos extraídos do Anexo A. Nenhuma alteração foi realizada na estrutura de tomos, capítulos ou seções.

| Elemento | Resultado |
|---|---|
| Descrições de capítulos atualizadas | 30 de 30 |
| Capítulos canônicos preservados | 30 de 30 |
| Seções, títulos e códigos alterados | 0 |
| Alocações, revisores, materiais, submissões, interfaces e evidências alterados | 0 |
| Snapshots auditáveis criados | 30 |

O script `scripts/extract-plan-annex-a-descriptions.mjs` extrai a matriz de textos diretamente da transcrição do plano. O sincronizador `scripts/sync-v1-activity-descriptions.mjs` foi atualizado para utilizar exclusivamente essa matriz e registra, para cada ficha modificada, o texto anterior, o novo texto e a referência documental.

## Verificação de compatibilidade das descrições

A auditoria reproduzível confirmou **zero divergências** entre as 30 descrições gravadas nas fichas e os textos extraídos do Anexo A. A estrutura permanece com 30 capítulos e 252 seções ativas, pois a diferença de uma seção no Capítulo II.2 pertence a uma decisão editorial anterior e não foi alterada nesta atualização, conforme o escopo autorizado.

> Esta atualização não revoga, reordena ou restaura nenhuma seção. Ela apenas faz as fichas exibirem o conteúdo integral do Anexo A solicitado pela coordenação.

## Validação técnica

| Verificação | Resultado |
|---|---|
| Auditoria das descrições do Anexo A | 30 correspondências; 0 divergências |
| Integridade dos vínculos existentes | Preservada |
| Testes automatizados | 29 arquivos e 108 testes aprovados |
| TypeScript e build | `pnpm check` e `pnpm build` aprovados |

Os artefatos de evidência estão em `docs/source/descricoes-anexo-a-plano-bndes-26-agosto.json` e `docs/source/resultado-descricoes-anexo-a-plano-bndes-26-agosto.json`.
