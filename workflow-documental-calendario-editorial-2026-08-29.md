# Workflow documental e calendário editorial do Estudo BNDES — Indústria Naval

**Data de implantação:** 29 de agosto de 2026  
**Decisões de governança registradas:** Professor Floriano Carlos Martins Pires Jr. como coordenador editorial do projeto e Engenheiro Cassiano Marins de Souza como substituto.

## Calendário editorial

O cronograma oficial de cada capítulo permanece a referência para o mês de entrega. A entrega interna passa a ocorrer no dia 15 desse mês e a data de entrega ao BNDES no dia 30. Quando o mês não possui dia 30, o portal utiliza seu último dia calendário. O período entre os dias 16 e 29 é reservado para recebimento, consolidação do documento, editoração e conferência dos requisitos contratuais.

| Marco | Regra aplicada |
|---|---|
| Entrega interna do capítulo ou seção consolidada | Dia 15 do mês definido no cronograma oficial. |
| Recebimento, consolidação e editoração final | Dias 16 a 29 do mesmo mês. |
| Entrega contratual ao BNDES | Dia 30; ou último dia do mês quando não houver dia 30. |
| Checklist de seção e capítulo | Antecipado em 21, 14, 10, 7 e 2 dias em relação à entrega interna do dia 15, respeitando o início oficial do capítulo. |

As 283 atividades canônicas receberam as duas datas editoriais. Os 30 checklists, que totalizam 150 itens, foram recalculados e tiveram evento de auditoria adicionado para registrar o realinhamento ao dia 15.

## Workflow documental

O fluxo agora é exibido nas fichas de atividade com estado atual, entrega interna, entrega ao BNDES e a próxima decisão permitida. As transições são auditadas com autor, data, situação anterior e posterior.

> **Planejada → Em elaboração → Submetida à revisão da seção → Em revisão da seção → Ajustes solicitados / Revisada pela seção → Consolidada no capítulo → Em revisão do tomo → Aprovada no tomo → Em revisão do projeto → Aprovada para documentação final.**

| Decisão | Quem pode registrar | Pré-condições |
|---|---|---|
| Elaboração e submissão da seção | Executor designado ou coordenador do capítulo. | Para submeter, ao menos um revisor deve estar indicado. |
| Revisão, ajustes e aprovação da seção | Revisor indicado. | Todos os revisores precisam ter aprovado antes de concluir a revisão da seção. |
| Consolidação e encaminhamento do capítulo | Coordenador designado do capítulo. | Para consolidar, os itens do checklist devem estar concluídos e não pode haver interface prioritária aberta. |
| Aprovação do tomo | Coordenador ou substituto designado do tomo. | A atividade-mãe deve estar em revisão do tomo e sem interface prioritária aberta. |
| Aprovação final | Coordenador editorial do projeto ou substituto. | A atividade-mãe deve estar em revisão do projeto e sem interface prioritária aberta. |

O executor designado também passou a poder submeter a versão de material à revisão, sem confundir autoria com aprovação. A decisão de revisão permanece humana e separada da elaboração.

## Interfaces prioritárias

As cinco interfaces abertas existentes foram classificadas como **prioritárias** por apresentarem prioridade alta ou crítica. O formulário agora permite indicar expressamente se a interface é prioritária, caso em que ela bloqueia a consolidação ou aprovação até ser resolvida; ou não prioritária, caso em que ela permanece visível, mas não impede a progressão documental.

## Validação

| Verificação | Resultado |
|---|---|
| Atividades com entrega interna no dia 15 | 283 de 283 |
| Atividades com entrega ao BNDES no dia 30 ou último dia | 283 de 283 |
| Governança editorial | Floriano Pires e Cassiano Marins registrados no banco com evento auditável. |
| Interfaces classificadas | 5 prioritárias; nenhuma foi removida ou encerrada automaticamente. |
| Testes automatizados | 29 arquivos e 107 testes aprovados. |
| Tipagem e build | `pnpm check` e `pnpm build` aprovados. |

## Pendência de governança

Os coordenadores e substitutos dos tomos deverão ser designados pelo Professor Floriano na Administração da plataforma. Sem essa designação, a aprovação de tomo permanece bloqueada pelo controle de elegibilidade.
