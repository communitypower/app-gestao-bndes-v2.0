# Dashboard de KPIs do workflow documental

**Data de implantação:** 30 de agosto de 2026  
**Rota:** `/kpis`  
**Acesso:** integrantes ativos vinculados à equipe, com a mesma regra de leitura da Gestão de Atividades.

## Objetivo

O dashboard apresenta o número de documentos da estrutura canônica em cada fase do workflow de conclusão do projeto. Cada capítulo e cada seção de trabalho é contado uma única vez, no estado documental em que se encontra no momento da consulta. Itens arquivados não compõem os indicadores.

## Indicadores exibidos

| Indicador | Regra de contagem |
|---|---|
| Documentos acompanhados | Soma dos capítulos e seções canônicas ativas. |
| Capítulos | Atividades-mãe sem atividade-pai. |
| Seções de trabalho | Atividades-filhas vinculadas aos capítulos. |
| Interfaces prioritárias | Interfaces com classificação prioritária e sem resolução, que bloqueiam consolidações e aprovações. |
| Documentos por fase | Quantidade de capítulos e seções em cada um dos 11 estados documentais. |

As etapas exibidas são: Planejada; Em elaboração; Submetida à revisão; Em revisão da seção; Ajustes solicitados; Revisada pela seção; Consolidada no capítulo; Em revisão do tomo; Aprovada no tomo; Em revisão do projeto; e Aprovada para documentação final.

## Leitura do indicador

O funil mostra o avanço desde a preparação da seção até a aprovação para inclusão na documentação final. Apenas documentos no estado **Aprovada para documentação final** são tratados como concluídos. As interfaces prioritárias abertas permanecem visíveis como risco de bloqueio e devem ser resolvidas antes de consolidações posteriores.

## Validação

| Verificação | Resultado |
|---|---|
| Estrutura canônica de referência | 30 capítulos, 251 seções e 281 documentos acompanhados. |
| Estado inicial observado | 281 documentos na fase Planejada; nenhum documento concluído. |
| Interfaces prioritárias abertas | 5. |
| Acesso | Consulta protegida para usuário autenticado e interface protegida para integrante ativo. |
| Testes automatizados | 31 arquivos e 111 testes aprovados. |
| TypeScript e build | `pnpm check` e `pnpm build` aprovados. |

O dashboard é alimentado por `dashboard.documentKpis`, que consulta diretamente os estados registrados no banco a cada carregamento, sem dados simulados.
