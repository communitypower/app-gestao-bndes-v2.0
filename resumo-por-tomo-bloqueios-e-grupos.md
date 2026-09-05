# Resumo por tomo, bloqueios de interface e nomes concisos de grupos

**Data de execução:** 29 de agosto de 2026  
**Escopo:** melhoria da Visão Geral e das telas centrais de acompanhamento.

## Visão resumida por tomo

A página inicial passou a apresentar uma faixa de acompanhamento por tomo. A agregação é derivada dos capítulos canônicos do Anexo B do Plano de Trabalho e não altera a hierarquia registrada no banco.

| Tomo | Capítulos | Indicadores exibidos |
|---|---:|---|
| Apresentação | 1 | Progresso, capítulo, atividades em acompanhamento e próxima entrega. |
| Tomo I | 8 | Progresso, capítulos, atrasos, atividades em acompanhamento e próxima entrega. |
| Tomo II | 9 | Progresso, capítulos, atrasos, atividades em acompanhamento e próxima entrega. |
| Tomo III | 9 | Progresso, capítulos, atrasos, atividades em acompanhamento e próxima entrega. |
| Tomo IV | 3 | Progresso, capítulos, atrasos, atividades em acompanhamento e próxima entrega. |

Cada bloco remete à Gestão de Atividades, mantendo a navegação da síntese executiva para o detalhamento.

## Interfaces bloqueadas

Uma interface recebe sinalização visual de bloqueio quando permanece sem resolução e atende a uma das condições abaixo. A regra é calculada em tempo de leitura, sem alterar o status gravado da interface.

| Condição | Identificação visual |
|---|---|
| Prazo de encaminhamento vencido | Borda, fundo e rótulo em tom de atenção. |
| Status **em discussão** com prioridade **alta** ou **crítica** | Borda, fundo e rótulo em tom de atenção. |

O alerta mostra a quantidade de bloqueios na Gestão de Interfaces. Na Visão Geral, os cartões de interface vinculados ao capítulo recebem o prefixo **Bloqueada** e o indicador do módulo prioriza o total de bloqueios quando houver.

## Nomes curtos de grupos

Os dados institucionais completos não foram modificados. A simplificação ocorre somente em rótulos de leitura rápida, com o nome integral disponível no título do elemento.

| Nome registrado | Rótulo exibido |
|---|---|
| CN Brasil / Estaleiros | Estaleiros BR |
| Defesa e CN Militar | Defesa Naval |
| Demais grupos | Nome registrado, por já ser conciso. |

Os rótulos foram aplicados à Visão Geral, Gestão de Interfaces, Gestão de Atividades, Equipe e grupos, Cronograma e Produção e revisão.

## Validação

| Verificação | Resultado |
|---|---|
| Distribuição de capítulos | 1 na Apresentação, 8 no Tomo I, 9 no Tomo II, 9 no Tomo III e 3 no Tomo IV. |
| Testes automatizados | 29 arquivos e 105 testes aprovados. |
| TypeScript e build | `pnpm check` e `pnpm build` aprovados. |
| Dados operacionais | Nenhuma atividade, interface, grupo ou vínculo foi criado, removido ou alterado. |
