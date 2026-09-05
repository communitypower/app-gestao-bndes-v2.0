# Governança operacional do workflow documental

**Data:** 28 de agosto de 2026  
**Escopo:** decisão P0, checklist de revisão por seção e capítulo e atribuição de coordenadores de tomo.

## Entregas implementadas

| Área | Implementação | Regra de governança |
|---|---|---|
| Visão Geral | Botão **Aprovar implementação do P0** e estado visual subsequente. | Exclusivo do administrador; a primeira decisão cria um registro imutável com autor, data e observação. |
| Ficha da atividade-mãe | Checklist inicializável com cinco itens para seção e capítulo, prazo, responsável, estado e última movimentação. | Apenas administrador ou coordenador formal da atividade-mãe cria ou altera o checklist. |
| Administração | Seção **Coordenação e substituição por tomo** para Apresentação e Tomos I–IV. | Designação exige justificativa mínima, não permite a mesma pessoa como coordenador e substituto e mantém histórico. |
| Banco de dados | Cinco tabelas aditivas de decisões, checklist, eventos, atribuições e eventos de tomo. | Não houve exclusão ou remapeamento de atividades, materiais, revisões, alocações, evidências, interfaces ou históricos existentes. |

## Checklist padrão

O botão de criação da ficha-mãe adiciona os itens abaixo. Os prazos são inicialmente copiados da data de término da atividade, podendo ser refinados pela coordenação durante a preparação da revisão.

| Escopo | Item |
|---|---|
| Seção | Texto, fontes e referências da seção verificados. |
| Seção | Banco de dados e evidências da seção conferidos. |
| Seção | Interfaces e escopos sobrepostos da seção tratados. |
| Capítulo | Coerência, integração e aderência ao escopo do capítulo verificadas. |
| Capítulo | Encaminhamento ao coordenador do tomo preparado. |

## Salvaguardas

O registro de P0 não ocorre automaticamente e não pode ser duplicado. A definição de tomo começa sem nomes pré-preenchidos, pois a coordenação e os substitutos formais ainda dependem de indicação administrativa. O portal aceita apenas integrantes ativos e diferentes entre si para esses dois papéis. A IA continua fora das decisões de aprovação: toda alteração registrada é humana e auditável.

## Validações realizadas

| Verificação | Resultado |
|---|---|
| Migração de banco | Cinco tabelas e seus índices criados de forma aditiva; nenhuma linha foi pré-criada. |
| Testes automatizados | 28 arquivos e 106 testes aprovados, incluindo autorização, não duplicação de P0, bloqueio de papéis iguais e presença dos novos controles de interface. |
| TypeScript | `pnpm check` aprovado. |
| Build de produção | `pnpm build` aprovado. |
| Inspeção visual | Controle P0 confirmado na Visão Geral autenticada; as telas de checklist e administração contam com testes de interface e exigem sessão administrativa para manipulação. |

## Uso recomendado

Primeiro, o administrador registra a aprovação P0 na Visão Geral. Em seguida, abre cada atividade-mãe prioritária, cria o checklist e ajusta seus prazos. Por fim, em Administração, nomeia coordenador e substituto para cada tomo, informando uma justificativa institucional para cada designação.
