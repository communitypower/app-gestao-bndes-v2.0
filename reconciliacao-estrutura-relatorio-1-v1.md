# Reconciliação canônica — Estrutura do Relatório 1 — V1

## Finalidade e precedência

Esta revisão confronta o catálogo existente do Portal Naval, com **29 frentes oficiais** e **36 itens de execução**, com o anexo `Estrutura-Relatorio_1-V1.docx`. O anexo V1 passa a prevalecer para título, estrutura, delimitação temática e descrição oficial. A matriz de atividades já cadastrada permanece como referência dos metadados de execução — responsáveis funcionais, apoios, entregas, dependências, critérios de aceite e cronograma — salvo quando a V1 altera diretamente o escopo da frente.

O arquivo XLSX modificado pelo usuário não é regenerado nem alterado nesta etapa. Portanto, a revisão não depende de regravar a planilha; se uma nova versão Office for solicitada, as alterações feitas pelo usuário deverão ser confirmadas antes da geração.

## Resultado do confronto

| Elemento | Situação anterior | Estrutura V1 | Decisão canônica |
|---|---:|---:|---|
| Frentes oficiais | 29 | 30 | Acrescentar `IV.2 — Cenários para a indústria naval brasileira` e deslocar as conclusões para `IV.3`. |
| Itens de execução | 36 | 37 | Incluir `D02` para a nova frente `IV.2` e renomear o atual `D02` para `D03`. |
| Tomos | 4 + Apresentação | 4 + Apresentação | Manter a estrutura de tomos e sua ordem. |
| Grupos e coordenação | 9 grupos | Sem alteração explícita | Preservar grupos, coordenadores formais e regras de delegação. |
| Títulos e descrições | Baseados no anexo anterior | Revisados e ampliados | Atualizar títulos canônicos e descrições oficiais conforme V1. |

## Alterações de títulos e estrutura

| Código V1 | Situação no portal antes da V1 | Título/estrutura V1 | Tratamento |
|---|---|---|---|
| `I.6` | “Indústria de Óleo e Gás e Energia Eólica Offshore” | “Indústria de Óleo e Gás e **de** Energia Eólica Offshore” | Ajuste editorial do título e ampliação da descrição sobre instalações eólicas. |
| `I.7` | “Defesa Naval” | “Construção naval militar” | Renomear a frente e o item `A10`; preservar responsável, datas, histórico e metadados. |
| `III.1` | “Fundamentos e tendências da política industrial marítima” | “Fundamentos e tendências” | Renomear a frente e `C01`; a descrição preserva a especificação de política industrial e marítima. |
| `III.7` | “Os ciclos de expansão e queda da indústria naval — Diagnóstico de sucessos e falhas” | “Ciclos de expansão e queda da indústria naval brasileira: diagnóstico de sucessos e falhas” | Renomear a frente e `C07`; ampliar o texto com objetivos, instrumentos, resultados, continuidade institucional e financiamento. |
| `III.8` | Título com “retomada” | “Fatores geopolíticos e ambientais críticos para a **reestruturação** da indústria naval brasileira” | Renomear a frente e `C08`; atualizar descrição com segurança econômica, cadeias, tecnologias, mercados e parcerias. |
| `III.9` | “Cenários econômicos e institucionais...” | “Ambiente econômico e institucional da indústria marítima brasileira” | Renomear a frente e `C09`; conservar no escopo os riscos, cenários e interfaces setoriais. |
| `IV.1` | “Cenários de demanda para a indústria naval brasileira” | “Diagnóstico integrado da competitividade da indústria naval brasileira” | Reposicionar `D01` como integração diagnóstica dos Tomos I–III. A expressão é normalizada a partir do aparente erro tipográfico do anexo V1 (“competividaindústria”). |
| `IV.2` | “Conclusões do Relatório 1” | “Cenários para a indústria naval brasileira” | Criar nova frente e novo item `D02`, com responsável, período e referências herdados de `D01`. |
| `IV.3` | Não existia | “Conclusões do Relatório 1” | Reclassificar a frente e o item atual de conclusões de `IV.2`/`D02` para `IV.3`/`D03`, sem criar cópia ou perder vínculos. |

## Desdobramento do Tomo IV

O Tomo IV da V1 separa explicitamente três entregas que estavam condensadas em duas frentes: diagnóstico integrado, construção de cenários e conclusões. O portal passa a representar esta sequência sem remover registros existentes.

| Ordem | Frente | Item de execução | Regra de histórico |
|---:|---|---|---|
| 28 | `IV.1 — Diagnóstico integrado da competitividade da indústria naval brasileira` | `D01` | Mantém o ID, as datas, os marcos, as alocações, revisões, materiais, comentários e interfaces existentes. |
| 29 | `IV.2 — Cenários para a indústria naval brasileira` | `D02` | Novo item; herda apenas responsável formal, período e campos de planejamento necessários a partir de `D01`. Não recebe indevidamente histórico de `D01` ou `D03`. |
| 30 | `IV.3 — Conclusões do Relatório 1` | `D03` | O registro atual `IV.2`/`D02` é renomeado e mantém seu mesmo ID e todos os vínculos operacionais. |

## Regras de preservação e execução idempotente

Antes de qualquer atualização, a migração registra snapshots das seções e atividades afetadas em `scope_migration_history`, com uma chave própria para a revisão V1. A migração não exclui registros e não remapeia atividades por afinidade quando o identificador do item já existe.

As regras a seguir são obrigatórias:

1. Os coordenadores formais continuam sendo os responsáveis das frentes. Delegações continuam limitadas aos integrantes do mesmo grupo e não substituem a coordenação.
2. Horas, alocações vigentes e históricas, datas, marcos, estado, progresso, revisores, materiais, versões, comentários, pareceres, interfaces, atividades de campo e evidências permanecem ligados aos mesmos IDs de atividade já existentes.
3. Apenas títulos, descrições oficiais e metadados canônicos de planejamento são atualizados. Uma nota operacional personalizada nunca é sobrescrita pela sincronização automática.
4. O novo `D02` é inserido como novo registro, sem reciclar nem dividir o histórico de `D01` ou `D03`.
5. A sincronização deve poder ser executada novamente sem duplicar seções, itens de plano, marcos ou histórico de migração.

## Atualizações de conteúdo decorrentes da V1

Além dos títulos, as descrições oficiais serão atualizadas para registrar, entre outros, audiovisual e sumário executivo na apresentação; o papel complementar dos quatro tomos; enquadramento do apoio marítimo como segmento da navegação brasileira; construção de instalações eólicas offshore; capacitação tecnológica e inovação na construção naval militar; P&D, formação e relações com a base produtiva; instrumentos de política, BR do Mar, FMM e conteúdo local; e a integração entre demanda, capacidade, custos, prazos, qualidade, financiamento e transição energética no Tomo IV.

## Fora do escopo desta revisão

Esta revisão não ativa a integração WhatsApp, não retoma a conexão OAuth com o Google Drive e não cria ou atualiza arquivos Office. A planilha XLSX alterada pelo usuário só será usada para uma nova geração de documento caso suas modificações sejam descritas e confirmadas previamente.

## Execução e validação

A migração `2026-08-25-relatorio-1-estrutura-v1` foi executada com snapshot das seções e atividades afetadas. O item histórico de conclusões preservou seu identificador de atividade e foi reclassificado de `D02` para `D03`; o novo `D02` foi inserido separadamente para os cenários. Um registro automático sem alocações, marcos, revisores, materiais, submissões, interfaces ou atividades de campo foi removido após seu snapshot, evitando uma duplicação técnica de `D03` sem eliminar evidência operacional.

Após a reconciliação, o banco contém **30 seções distintas** e **37 itens de planejamento distintos**. A suíte automatizada aprovou **96 testes em 25 arquivos**, a verificação TypeScript foi concluída sem erros e o build de produção foi concluído. As páginas de Visão geral, Gestão de atividades e Cronograma foram verificadas em desktop e em tela móvel; os cabeçalhos, filtros e indicadores mostram 30 frentes e 37 itens.
