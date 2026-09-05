# Reconciliação da composição da equipe — reunião de kick-off

**Data de execução:** 30 de agosto de 2026  
**Fonte:** lâmina de composição da reunião de kick-off encaminhada pela coordenação.

## Objetivo e resultado

A tela **Equipe e grupos** passou a apresentar a composição indicada no kick-off para os onze grupos funcionais G1–G11. Foram registrados **36 vínculos temáticos**, correspondentes a **29 participantes únicos**, sem substituir os vínculos primários de gestão, responsabilidades, revisões, materiais, interfaces ou histórico das atividades.

| Ajuste | Resultado |
|---|---:|
| Grupos contemplados | 11 |
| Participações registradas | 36 |
| Participantes únicos do kick-off | 29 |
| Registros existentes reativados e vinculados | 12 |
| Novo registro criado | 1 — Carolina Gonçalves dos Santos |
| Participantes do kick-off inativos após a atualização | 0 |
| Snapshots auditáveis da reconciliação | 49 |

## Tratamento dos vínculos

O portal preserva o **grupo primário operacional** de cada integrante, usado nas responsabilidades já existentes, e registra separadamente cada participação temática informada no kick-off. Assim, a presença de um integrante em mais de um grupo, como G1/G4/G10, pode ser exibida corretamente sem mover responsáveis, apagar alocações ou alterar a governança de capítulos e seções.

A tela de equipe agora exibe, dentro de cada grupo, a lista **Participantes indicados no kick-off**. Participações fora do grupo primário recebem a indicação de participação temática adicional. A coordenação operacional continua apresentada separadamente e não é inferida da lâmina quando esta não a define.

## Integridade e pendências

Os nomes abreviados que já existiam foram normalizados para a forma apresentada no kick-off, incluindo Jean David Job Emmanuel Marie Caprace e Marcos Bernardes Cozzolino do Nascimento. O registro de Carolina foi incluído com função **Integrante do projeto** e instituição **A confirmar**, pois esses dois dados não aparecem na lâmina e permanecem identificados para complementação administrativa.

O registro técnico `teste` não foi apagado nem desativado: ele possui uma revisão histórica vinculada e ficou fora da composição registrada do kick-off, preservando a trilha existente.

## Validação

| Verificação | Resultado |
|---|---|
| Migração de dados | Tabela não destrutiva de participações multi-grupo aplicada. |
| Composição da fonte | 11 grupos, 36 participações e 29 pessoas únicas confirmadas. |
| Estado dos participantes da fonte | Todos ativos. |
| Auditoria | Migração registrada em `scope_migration_history` com snapshots. |
| Testes automatizados | 32 arquivos e 114 testes aprovados. |
| TypeScript e build | `pnpm check` e `pnpm build` aprovados. |

> A captura automatizada da prévia permaneceu no estado de carregamento enquanto a consulta administrativa era concluída. A resposta do servidor para a hierarquia foi confirmada no log de rede e os dados foram validados diretamente no banco.
