# Revisão independente, navegação por grupos e atualização editorial do Tomo II

**Data:** 29 de agosto de 2026  
**Escopo:** independência entre execução e revisão, apresentação da equipe e reordenação autorizada das seções do Tomo II, Capítulo 2.

## Revisão independente

O portal passa a impedir que um integrante alocado como executor da atividade seja incluído como revisor do mesmo trabalho. A exclusão é aplicada tanto no seletor da ficha quanto na validação do servidor. A emissão de parecer também é bloqueada para executores em registros legados de revisão, impedindo que uma designação anterior seja usada para aprovar o próprio trabalho.

Foi identificado um registro legado na atividade **Transporte Marítimo Mundial**, no qual Cassiano Marins de Souza era simultaneamente executor e revisor. Esse registro foi preservado para auditoria, mas foi excluído das listas operacionais de revisores e não autoriza emissão de parecer.

## Equipe e grupos

A tela **Equipe e grupos** agora abre no nível dos nove grupos, em cartões recolhidos. Cada cartão informa instituição e número de pessoas. Ao selecionar o cartão, são exibidos o coordenador, os participantes, as atividades sob coordenação e as informações já disponíveis na tela anterior. A busca mantém os grupos encontrados expandidos para não ocultar o resultado.

## Tomos e Capítulo II.2

Os subtítulos editoriais foram revisados e padronizados na Visão Geral:

| Tomo | Subtítulo |
|---|---|
| Apresentação | Objetivos, metodologia e produtos do Estudo |
| Tomo I | Economia Marítima, Mercados e Demanda para a Indústria Naval |
| Tomo II | Indústria Naval: Base Produtiva, Tecnologia e Competitividade |
| Tomo III | Política Industrial e Política Marítima |
| Tomo IV | Diagnóstico Integrado e Cenários |

No **Tomo II, Capítulo 2 — Experiências nacionais de desenvolvimento da indústria naval**, o texto sobre as dimensões de análise foi transferido para a descrição do capítulo. As seções de trabalho foram reordenadas como solicitado:

| Código | Seção |
|---|---|
| II.2.1 | Japão |
| II.2.2 | Coreia do Sul |
| II.2.3 | China |
| II.2.4 | Singapura |
| II.2.5 | Estados Unidos |
| II.2.6 | Países europeus selecionados |
| II.2.7 | Índia |
| II.2.8 | Vietnã |
| II.2.9 | Indonésia |
| II.2.10 | Outros produtores emergentes |

A seção anterior de dimensões deixou de existir como atividade separada e o registro excedente foi arquivado de forma auditável. A estrutura ativa passa a conter **30 capítulos e 252 seções de trabalho**. Não houve exclusão de vínculos, materiais, prazos, responsáveis ou históricos.

## Validação

| Verificação | Resultado |
|---|---|
| Seções ativas em II.2 | 10, de II.2.1 a II.2.10, iniciando por Japão. |
| Auto-revisões permitidas na interface e API | 0; a validação e a decisão de parecer bloqueiam o executor. |
| Testes automatizados | 29 arquivos e 108 testes aprovados. |
| TypeScript e build | `pnpm check` e `pnpm build` aprovados. |
