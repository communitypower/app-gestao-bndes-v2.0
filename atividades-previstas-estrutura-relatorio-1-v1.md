# Atividades previstas na Estrutura do Relatório 1 — V1

## Critério de classificação

A Estrutura do Relatório 1 — V1 contém dois níveis de trabalho. O primeiro corresponde às **30 frentes temáticas** e aos **37 itens de execução** já cadastrados no Portal Naval. O segundo reúne ações operacionais explicitamente indicadas no texto, tais como estruturação do Portal, banco de dados, audiovisual, sumário executivo, metodologias, simulações e consolidação de evidências de campo.

As ações do segundo nível serão cadastradas como itens complementares do plano, com código `P01` a `P10`. Elas não substituirão os itens canônicos `A00` a `D03`, nem os nove registros de campo e divulgação já existentes. A coordenação formal permanecerá vinculada ao coordenador do grupo da frente de origem.

## Atividades complementares a cadastrar

| Código | Atividade prevista | Frente vinculada | Grupo responsável | Evidência esperada |
|---|---|---|---|---|
| P01 | Estruturação do Portal e da arquitetura de publicação do Estudo | AP | Núcleo | Mapa de conteúdos, estrutura de publicação e critérios de atualização do Portal. |
| P02 | Organização do banco de dados documental e temático | AP | Núcleo | Estrutura de dados, campos de classificação e registro de fontes. |
| P03 | Produção audiovisual do Estudo | AP | Núcleo | Plano audiovisual, roteiro, peças em desenvolvimento e registro de aprovação. |
| P04 | Elaboração do Sumário Executivo do Relatório 1 | AP | Núcleo | Sumário executivo consolidado, revisado e pronto para publicação. |
| P05 | Delimitação de conteúdo e transição entre os Relatórios 1 e 2 | AP | Núcleo | Matriz de escopo, lacunas, questões de continuidade e agenda do Relatório 2. |
| P06 | Desenvolvimento da metodologia de análise de políticas setoriais | III.1 | IE-UFRJ | Protocolo metodológico para análise das políticas industrial, marítima e naval. |
| P07 | Metodologia, indicadores e benchmarking de produtividade de estaleiros | II.8 | Núcleo | Método de avaliação, indicadores simplificados e matriz comparativa de benchmarking. |
| P08 | Modelagem e simulações do FMM e das contas vinculadas | III.5 | FMM | Hipóteses, cenários de simulação e resultados sobre custo de capital, riscos e efeitos distributivos. |
| P09 | Consolidação das evidências das visitas internacionais | II.2 | Núcleo | Roteiros, registros de visitas na China, Coreia do Sul e Índia, fichas de evidência e síntese comparativa. |
| P10 | Consolidação do levantamento de campo dos estaleiros brasileiros | II.4 | CN Brasil / Estaleiros | Fichas de instalações, evidências de campo, cadastro de capacidade e validação do levantamento. |

## Itens já cobertos pelo plano vigente

As visitas internacionais, visitas nacionais, coleta de fontes primárias, entrevistas estruturadas, apresentações de relatório, apresentações para a equipe e audiências públicas permanecem registradas na área **Campo e divulgação**. A inclusão de `P09` e `P10` não duplica esses eventos: estabelece somente os itens de consolidação e entrega das respectivas evidências.

As projeções, hipóteses, cenários alternativos, simulações de competitividade, requisitos tecnológicos, recursos humanos e investimentos já constituem o escopo do item `D02 — Cenários para a indústria naval brasileira`. Por esse motivo, não será criado um novo item paralelo para essas ações.

## Regras de preservação

Os itens `P01` a `P10` serão adicionados de forma idempotente. Nenhuma atividade existente será removida, renumerada ou terá responsável formal, horas, delegações, materiais, revisões, comentários, interfaces, marcos, datas ou evidências substituídos. Os novos itens serão vinculados às frentes correspondentes e receberão datas de término inicialmente alinhadas à frente de origem, até que o coordenador responsável defina o cronograma próprio.

## Execução e validação

A migração `2026-08-25-atividades-previstas-estrutura-v1` incluiu os dez itens complementares e gravou snapshot auditável de cada registro em `scope_migration_history`. Após a inclusão, o Portal Naval reúne **47 itens**: 37 itens de execução e 10 atividades complementares vinculadas às 30 frentes oficiais.

A suíte automatizada aprovou **99 testes em 25 arquivos**, a verificação TypeScript foi concluída sem erros e o build de produção foi concluído. As páginas de Visão geral, Gestão de atividades e Cronograma foram verificadas em desktop e tela móvel, incluindo a exibição dos códigos `P01` a `P10` e dos novos quantitativos.
