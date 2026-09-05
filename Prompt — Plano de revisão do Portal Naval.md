# Prompt — Plano de revisão do Portal Naval

> Use este prompt para produzir uma proposta implementável de simplificação do Portal Naval e de governança do fluxo documental do Estudo BNDES — Indústria Naval.

```text
Atue como arquiteto de produto, analista de processos e especialista em governança documental para o Portal Naval — Gestão do Estudo BNDES: Indústria Naval.

Sua tarefa é elaborar um plano de revisão funcional e de interface que simplifique o portal e institua um workflow formal para elaboração, revisão e aprovação de documentação técnica. A proposta deverá respeitar a estrutura canônica do estudo: Tomo → Capítulo → Atividade-mãe → Etapa de execução.

## Contexto obrigatório

O portal já possui fichas de atividades-mãe, etapas de execução, cronograma, equipe e grupos, interfaces entre seções, materiais, evidências, revisão colaborativa e perfis administrativos. A coordenação formal pertence ao coordenador do capítulo e não deve ser transferida às etapas. As etapas podem ser atribuídas a qualquer integrante ativo. O coordenador do capítulo deve obrigatoriamente coordenar a execução e as interfaces da atividade-mãe. Os materiais, comentários, evidências, revisões, alocações, marcos e trilhas históricas existentes não podem ser apagados, sobrescritos ou remapeados sem trilha auditável.

O grupo liderado pelo responsável do capítulo é a unidade de execução do trabalho. Sob coordenação do responsável pelo capítulo, o grupo deve realizar o levantamento, produzir e redigir o texto, revisar tecnicamente a redação, esclarecer interfaces com outros capítulos e preparar ou atualizar os bancos de dados necessários à entrega. O coordenador distribui etapas, acompanha prazos, resolve bloqueios e responde pelo encaminhamento formal do capítulo; os integrantes podem ser responsáveis pelas etapas, mas não substituem a responsabilidade de coordenação.

## Objetivo de simplificação

Reduza o número de telas e evite criar módulos independentes quando o fluxo puder ocorrer dentro de uma ficha já existente. Proponha uma experiência baseada em poucos pontos de entrada:

1. Visão Geral: indicadores, alertas e atalhos para fichas.
2. Gestão de Atividades: fichas de atividades-mãe com etapas, prazos, responsáveis, materiais, evidências e revisão.
3. Cronograma: prazos, marcos, pendências e filtros.
4. Equipe e grupos: capacidade, alocação e acesso às fichas.
5. Administração: usuários, permissões e parâmetros de governança.

Explique quais telas, abas, blocos ou diálogos devem ser consolidados, removidos, transformados em painéis contextuais ou substituídos por atalhos. Preserve navegação clara entre Visão Geral, Cronograma, Equipe e ficha da atividade-mãe.

## Workflow documental obrigatório

Modele o fluxo abaixo como uma máquina de estados, com regras de transição, responsáveis, evidências exigidas, prazos e registros de auditoria.

| Estado | Responsável primário | Ação e condição de saída |
|---|---|---|
| Planejada | Coordenador do capítulo | Define responsável, executor, prazo, etapas e critérios de aceite da seção. |
| Em elaboração | Grupo do capítulo, sob coordenação do responsável | Produz texto, banco de dados e evidências; o executor designado sobe a versão de trabalho no portal. |
| Submetida para revisão da seção | Executor ou autor | Sinaliza conclusão de elaboração, envia os arquivos e indica um revisor no nível da seção. |
| Em revisão da seção | Revisor indicado | Analisa o texto, os dados, a aderência ao escopo e as interfaces; aprova tecnicamente ou solicita ajustes. |
| Ajustes solicitados | Executor, autor ou grupo do capítulo | Responde aos apontamentos e submete nova versão mantendo histórico. |
| Em revisão do capítulo | Coordenador do capítulo | Confirma qualidade, integração das interfaces, completude do banco de dados e aderência do conjunto do capítulo. |
| Encaminhada ao coordenador do tomo | Coordenador do capítulo | Encaminha a versão recomendada, com a decisão da revisão de seção, para a instância do tomo. |
| Em aprovação do tomo | Coordenador do tomo | Realiza a mesma verificação de consistência, integração, qualidade e completude no nível do tomo; aprova, devolve para ajuste ou rejeita justificadamente. |
| Aprovada para documentação oficial | Coordenador do tomo | Consolida a versão como apta à inclusão oficial. |
| Publicada na documentação oficial | Administrador ou processo autorizado | Publica a versão aprovada, preservando a versão aprovada, metadados e trilha completa. |

O workflow deve observar as seguintes regras inegociáveis:

- O executor pode elaborar e submeter, mas não aprova a própria versão em nome da seção, do capítulo ou do tomo.
- O revisor deve ser indicado no nível da seção antes do início da revisão. A indicação registra usuário, data, escopo, prazo da revisão e versão submetida.
- A revisão da seção é condição obrigatória para o encaminhamento ao coordenador do capítulo. A revisão do capítulo é condição obrigatória para o encaminhamento ao coordenador do tomo.
- O coordenador do capítulo é o responsável formal pela atividade-mãe, pela coordenação de sua execução e pela gestão das interfaces vinculadas.
- O coordenador do tomo detém a aprovação final para inclusão na documentação oficial.
- Toda solicitação de ajuste, mudança de responsável, troca de liderança, aprovação, rejeição, reabertura e publicação deve registrar usuário, data, justificativa e versão afetada.
- As atividades de interface devem permitir que autores dos capítulos relacionados anexem evidências. A pré-análise por IA é um subsídio de consistência e não substitui a decisão dos coordenadores.
- Documentação oficial somente pode ser publicada após aprovação explícita do coordenador do tomo.

## Conexão obrigatória com o cronograma

Use o arquivo `Cronograma-R1-e-R2-26_agosto.xlsm` como referência de planejamento para períodos, entregas, marcos, seminários e dependências. O plano deve explicar como cada atividade-mãe e etapa de execução se relaciona ao cronograma, sem criar prazos paralelos ou conflitantes.

| Elemento do cronograma | Regra do workflow documental |
|---|---|
| Período da etapa | Define a janela de elaboração, carga do executor e data-limite de submissão para revisão da seção. |
| Marco intermediário | Gera evidência obrigatória, por exemplo: sumário validado, base de dados atualizada, primeira versão do texto ou resposta de interface. |
| Entrega de capítulo | Só pode ser marcada como pronta depois da revisão de seção, da validação pelo coordenador do capítulo e do registro das interfaces resolvidas ou justificadamente encaminhadas. |
| Entrega de tomo | Só pode ser considerada pronta após as decisões de capítulo e a aprovação formal do coordenador do tomo. |
| Seminário ou divulgação | Deve estar vinculado à atividade-mãe e ao capítulo pertinente, com materiais, versão apresentada, responsáveis e encaminhamentos registrados. |
| Alteração de prazo | Exige justificativa, registro de usuário e reavaliação das revisões e interfaces dependentes. |

Defina alertas automáticos para etapa sem executor, arquivo ainda não submetido na proximidade do marco, revisor não designado, revisão vencida, interface aberta que bloqueia entrega, banco de dados incompleto e aprovação pendente após o prazo do cronograma.

## Requisitos funcionais a detalhar

1. Desenhe a ficha única da atividade-mãe como centro de acompanhamento. Nela devem estar as etapas, responsáveis de execução, prazos, marcos, materiais, evidências, bancos de dados, revisão documental, interfaces, histórico e comandos de encaminhamento.
2. Defina o painel de revisão documental dentro da ficha: versão em análise, autor, data de submissão, revisor indicado no nível da seção, checklist, comentários, decisão, justificativa, responsável pela próxima ação e prazo de resposta.
3. Defina permissões por papel: administrador, coordenador de tomo, coordenador de capítulo, executor/autor, revisor e integrante consultante. Distingua coordenação formal de responsabilidade de execução.
4. Proponha a conexão entre atividade-mãe, capítulos, tomos e documentos oficiais, sem duplicar os mesmos dados em telas diferentes.
5. Defina indicadores mínimos para a Visão Geral: documentos em elaboração, aguardando revisão de capítulo, aguardando aprovação de tomo, devolvidos para ajustes, aprovados, publicados, atrasados e interfaces abertas.
6. Especifique alertas de prazo e de bloqueio: falta de responsável, falta de arquivo de trabalho, falta de revisor da seção, revisão vencida, banco de dados pendente, aprovação pendente, interface sem resposta e publicação impedida.
7. Descreva como os materiais e evidências devem ser versionados, vinculados e recuperados durante revisões, sem apagamento de registros.
8. Inclua a interação com a pré-análise de inconsistências por IA: tipos de inconsistência identificados, evidências analisadas, limitações, encaminhamento aos autores e confirmação humana do resultado.

## Entregáveis exigidos

Entregue o plano com as seções abaixo, em linguagem institucional e orientada à implementação:

1. Diagnóstico de simplificação: inventário de telas atuais, sobreposições e proposta de consolidação.
2. Arquitetura de informação futura: mapa dos módulos e navegação principal.
3. Fluxo documental em tabela: estados, gatilhos, responsáveis, permissões, artefatos obrigatórios e transições proibidas.
4. Matriz de responsabilidades: administrador, coordenador de tomo, coordenador de capítulo, executor/autor, revisor e consultante.
5. Especificação da ficha de atividade-mãe: seções, campos, comandos e regras de visibilidade.
6. Regras de dados e auditoria: preservação de históricos, versionamento, integridade e rastreabilidade.
7. Lista priorizada de alterações do portal, classificada em P0, P1, P2 e P3, com justificativa, dependências, vínculo ao cronograma e critério de aceite.
8. Plano de implantação em fases, incluindo migração aditiva, testes de permissão, testes de transição de workflow, validação de interface e comunicação aos usuários.
9. Indicadores de acompanhamento da revisão: tempo em cada estado, taxa de devolução, revisões vencidas, documentos publicados, pendências de interface, etapas sem revisor, bancos de dados pendentes e aderência aos marcos do cronograma.
10. Riscos e controles: aprovação indevida, perda de versão, sobrecarga de coordenador, inconsistência entre capítulos, acesso indevido e dependência de IA.

## Critérios de qualidade

Não presuma dados inexistentes, não reduza a função dos coordenadores, não proponha apagar registros históricos e não trate pré-análise por IA como aprovação automática. Sempre que existir ambiguidade, proponha uma regra explícita de governança e indique a decisão que deverá ser validada pela coordenação do Estudo.
```
