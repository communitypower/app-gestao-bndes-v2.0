# Auditoria de compatibilidade com o Plano de Trabalho BNDES de 26 de agosto

**Documento canônico:** `Plano_de_Trabalho-UFRJ_26_agosto.pdf`  
**Estrutura:** Anexo B — Índice Analítico do Relatório 1  
**Descrições:** Anexo A — Estrutura do Relatório 1

## Resultado executivo

O portal possui os **30 capítulos** do Anexo B, sem capítulos canônicos ausentes, excedentes ou com título divergente. Contudo, a estrutura ainda **não está integralmente compatível** por duas razões: a exceção editorial anteriormente aplicada ao Capítulo II.2 removeu a seção II.2.11 e deslocou os títulos das seções II.2.1 a II.2.10; e as descrições nas fichas usam uma versão resumida anterior em vez do texto integral do Anexo A.

| Elemento auditado | Plano BNDES | Portal atual | Situação |
|---|---:|---:|---|
| Capítulos | 30 | 30 | Compatível |
| Seções de trabalho | 253 | 252 | Divergência: falta II.2.11 |
| Títulos de capítulos | 30 | 30 | Compatível |
| Descrições do Anexo A, correspondência literal | 30 | 0 | Divergência: todas as fichas usam redação resumida anterior |

## Divergência estrutural concentrada no Capítulo II.2

O Anexo B determina que **II.2.1** seja “Dimensões de análise das experiências nacionais...” e que **II.2.2** seja “Japão”, em sequência até **II.2.11** “Outros produtores emergentes”. No portal, uma regra editorial anterior transferiu as dimensões para a descrição do capítulo, fez II.2.1 corresponder a Japão e deixou de manter II.2.11 como seção ativa.

| Código do Anexo B | Título previsto | Situação atual no portal |
|---|---|---|
| II.2.1 | Dimensões de análise das experiências nacionais | Substituído por Japão |
| II.2.2–II.2.10 | Japão até Indonésia | Todos deslocados uma posição |
| II.2.11 | Outros produtores emergentes | Ausente |

## Divergência nas descrições

O extrator reproduzível do Anexo A identificou os 30 textos completos, com extensão de 188 a 1.670 caracteres. As fichas atualmente armazenam descrições de 195 a 513 caracteres, provenientes de uma matriz anterior resumida. O conteúdo substantivo está relacionado, porém não constitui a transcrição completa do Anexo A.

## Preservação e correção proposta

Para compatibilização integral, a correção deve restaurar a seção II.2.1 de dimensões, deslocar as demais seções de volta aos códigos do Anexo B e criar ou reativar a II.2.11. A descrição do capítulo II.2 deve voltar ao texto integral do Anexo A. As 30 descrições devem então ser substituídas pelos textos extraídos do Anexo A. A operação pode preservar atividades, alocações, materiais, revisões, interfaces, marcos e histórico, com snapshots antes/depois de cada atualização.

> A auditoria não aplicou essas alterações, pois a restauração da seção II.2.1 e a reordenação subsequente revertem uma orientação editorial anterior. A confirmação da coordenação é necessária antes da reconciliação.

## Artefatos de evidência

| Arquivo | Conteúdo |
|---|---|
| `docs/source/indice-analitico-plano-ufrj-26-agosto.json` | Estrutura extraída do Anexo B |
| `docs/source/descricoes-anexo-a-plano-bndes-26-agosto.json` | Descrições extraídas do Anexo A |
| `docs/source/auditoria-compatibilidade-plano-bndes-26-agosto.json` | Diferenças encontradas na auditoria |
| `scripts/audit-plano-bndes-26-agosto.mjs` | Auditoria reproduzível |
