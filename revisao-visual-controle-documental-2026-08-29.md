# Revisão visual do controle documental

**Data:** 29 de agosto de 2026  
**Objetivo:** tornar explícito que o Portal Naval é um sistema de controle documental organizado por tomo, capítulo e seção de trabalho, e reduzir duplicações na Gestão de Atividades.

## Ajustes realizados

| Área | Alteração |
|---|---|
| Tomo II | Incluído o subtítulo **Indústria Naval: Base Produtiva, Tecnologia e Competitividade** nos cartões de acompanhamento. |
| Visão Geral | O cabeçalho e os indicadores passaram a destacar **5 tomos**, **30 capítulos** e **253 seções de trabalho**, em lugar da nomenclatura anterior de frentes, atividades-mãe e itens analíticos. |
| Modelo operacional | Incluído resumo explícito: **Seção → capítulo → tomo → projeto**, com acesso direto ao fluxo documental. |
| Lista de atividades | Removidos cabeçalhos repetidos de capítulo e a repetição de descrição de planejamento. A lista passa a identificar o nível apenas uma vez: capítulo ou seção de trabalho. |
| Ficha de atividade | Eliminada a repetição da descrição no cabeçalho, removido o cartão duplicado de frente e ocultado o planejamento funcional sem conteúdo operacional. A ficha prioriza estado documental, entregas, descrição, executores, revisores, interfaces, checklist e decisões. |
| Acesso | A Visão Geral passa a utilizar a mesma condição de participante ativo da Gestão de Atividades; decisões administrativas continuam protegidas. |

## Modelo de controle documental exibido

> O executor trabalha na seção, submete aos revisores e resolve as interfaces da seção. O coordenador do capítulo consolida as seções e trata interfaces intercapítulos remanescentes. O coordenador do tomo aprova a consolidação; o coordenador do projeto revisa a documentação final antes da entrega ao BNDES.

## Validação

| Verificação | Resultado |
|---|---|
| Subtítulo do Tomo II | Obtido por convenção editorial complementar, sem alterar a estrutura canônica do Anexo B. |
| Testes automatizados | 29 arquivos e 106 testes aprovados. |
| Tipagem e build | `pnpm check` e `pnpm build` aprovados. |
| Dados | Nenhuma atividade, seção, prazo, responsável, revisão, interface ou histórico foi removido ou alterado. |
