# Alinhamento entre cabeçalho e barras do cronograma

**Data:** 30 de agosto de 2026.  
**Referência:** `Cronograma-R1-e-R2-26_agosto.xlsm`, encaminhado ao BNDES em 26 de agosto de 2026.

## Correção aplicada

O cronograma utilizava a escala completa das barras, mas o cabeçalho adotava meses civis e o período padrão do projeto terminava em maio de 2027. Isso fazia com que os rótulos M1–M6 e a contagem de entregáveis não representassem as mesmas janelas temporais das atividades.

O período padrão passou a terminar em **20/02/2027**, que é o fim da sexta janela oficial. O cabeçalho, as divisões verticais de cada linha e a posição das barras agora usam as mesmas seis janelas consecutivas iniciadas em 21/08/2026.

| Elemento | Regra atual |
|---|---|
| M1 | 21/08/2026 a 20/09/2026 |
| M2 | 21/09/2026 a 20/10/2026 |
| M3 | 21/10/2026 a 20/11/2026 |
| M4 | 21/11/2026 a 20/12/2026 |
| M5 | 21/12/2026 a 20/01/2027 |
| M6 | 21/01/2027 a 20/02/2027 |

Os entregáveis indicados no cabeçalho são agora exclusivamente as **atividades-mãe com término na janela respectiva**. Etapas-filhas deixam de ser contadas como entregáveis independentes, evitando duplicidade entre o número exibido e a programação das barras.

## Preservação e validação

O ajuste de período padrão foi registrado em `scope_migration_history`, com o valor anterior, o valor atualizado e a referência do XLSM. Não foram alterados períodos das seções, alocações, materiais, revisões, interfaces ou estados do workflow.

O teste do cronograma verifica a primeira janela oficial, sua identificação acessível e a contagem de um entregável. A suíte completa, a checagem de tipos e o build de produção foram aprovados.
