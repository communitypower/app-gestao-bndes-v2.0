# Auditoria de visibilidade do workflow documental

**Data:** 29 de agosto de 2026  
**Motivo:** verificação relatada pela coordenação de que as alterações previstas nos prompts não estavam claramente identificáveis na versão publicada.

## Diagnóstico

A auditoria encontrou dois fatores distintos. A página pública do domínio publicado apresenta corretamente a tela de autenticação; os controles de workflow são visíveis somente após entrada na plataforma. Além disso, a Visão Geral e a leitura da governança estavam restringidas por uma verificação administrativa, enquanto parte dos integrantes autenticados aparecia no portal com perfil colaborador. Isso impedia a leitura dos novos indicadores e mantinha a tela em estado de carregamento quando a consulta era recusada.

## Correções aplicadas

| Ponto | Ajuste |
|---|---|
| Visão Geral | A consulta de leitura do painel passou a estar disponível a qualquer usuário autenticado. |
| Governança | A consulta do estado do workflow editorial passou a estar disponível a qualquer usuário autenticado. |
| Gestão de Atividades | Integrantes ativos vinculados à equipe passam a visualizar o módulo e seus controles de acompanhamento. |
| Decisões administrativas | Permanecem restritas: aprovação do P0, configuração, alterações de governança e decisões finais não foram liberadas aos colaboradores. |
| Identificação visual | Foi acrescentado um painel explícito **Controle documental — Seção → capítulo → tomo → projeto** na Visão Geral, com acesso direto às fichas. |

## Resultado esperado por perfil

| Perfil | Visualização | Ações permitidas |
|---|---|---|
| Integrante ativo | Visão Geral, cronograma, atividades, interfaces e etapa atual do fluxo documental. | Executar e submeter apenas o que lhe for designado; revisar quando indicado. |
| Coordenador designado | Mesma visão, com controles da atividade ou tomo sob sua responsabilidade. | Consolidar, encaminhar e decidir dentro de sua alçada. |
| Administrador | Visão integral do portal e governança. | Gerir integrantes, prazos, regras e decisões administrativas. |

## Validação

`pnpm check`, `pnpm test` e `pnpm build` foram executados após a correção, com **106 testes aprovados**. A visualização automatizada utiliza um perfil de prévia separado, identificado como colaborador, e por isso não reproduz os controles administrativos da conta real de Cassiano, que permanece registrada no banco como administrador ativo.
