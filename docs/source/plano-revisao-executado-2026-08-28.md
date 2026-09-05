# Plano de revisão do Portal Naval — execução do prompt

**Data de referência:** 28 de agosto de 2026  
**Escopo:** Gestão do Estudo BNDES — Indústria Naval

## 1. Síntese executiva

O Portal Naval já dispõe de uma base consistente de planejamento: **30 frentes**, **47 atividades-mãe** e **286 etapas de execução**, com controle de equipe, responsáveis, cronograma, materiais, evidências, interfaces e permissões. A principal lacuna é a transformação desses recursos em um **workflow documental único e obrigatório**, no qual o trabalho executado pelo grupo do capítulo percorre revisão de seção, coordenação de capítulo, aprovação de tomo e publicação oficial.

O diagnóstico recomenda simplificar a experiência em torno da **ficha da atividade-mãe**, mantendo as páginas globais como meios de monitoramento, filtro e navegação. Produção e revisão, interfaces, banco de dados, seminários, materiais e etapas devem convergir para painéis contextuais nessa ficha, sem apagar os registros atuais ou duplicar dados.

## 2. Evidências do estado atual

| Elemento inventariado | Quantidade observada | Leitura para o plano |
|---|---:|---|
| Frentes/capítulos cadastrados | 30 | Estrutura editorial consolidada para o Relatório 1. |
| Atividades-mãe | 47 | Unidade adequada para coordenação de capítulo e interfaces. |
| Etapas de execução | 286 | Unidade adequada para executor, prazo e evidências do trabalho. |
| Integrantes ativos | 17 | Base inicial para distribuição de execução e revisão. |
| Revisores designados | 3 | Cobertura insuficiente para revisão obrigatória por seção. |
| Submissões de revisão | 0 | O fluxo documental ainda não foi iniciado operacionalmente. |
| Decisões de revisão | 0 | Não há decisões registradas para alimentar a aprovação escalonada. |
| Materiais em produção | 3 | A capacidade existe, mas ainda não representa o conjunto das entregas. |
| Evidências vinculadas a atividades | 1 | É necessário induzir o uso da ficha como repositório de execução. |
| Interfaces abertas | 5 | Devem ter acompanhamento explícito no fluxo de revisão. |
| Seminários de divulgação | 11 | Devem ser vinculados aos capítulos e às respectivas entregas. |
| Etapas sem executor | 284 | Prioridade para ativar a execução distribuída. |
| Etapas sem período completo | 77 | Prioridade para alinhamento ao cronograma de agosto. |

> Os números acima foram obtidos diretamente da base operacional do portal. Eles representam o estado do ambiente avaliado e não constituem metas ou estimativas.

## 3. Arquitetura simplificada proposta

O portal deve ter cinco pontos de entrada permanentes. As demais funções devem ser contextuais, acionadas dentro da ficha da atividade-mãe ou por links diretos dos painéis globais.

| Ponto de entrada | Finalidade | Consolida ou absorve |
|---|---|---|
| Visão Geral | Indicadores, alertas, entregas do mês e acesso às fichas. | Cards de resumo e atalhos dispersos. |
| Atividades | Lista hierárquica de atividades-mãe; ficha como centro da execução. | Acompanhamento detalhado, revisões, materiais, evidências, seminários e interfaces. |
| Cronograma | Prazos, marcos, etapas sem período, carga e entregas por mês. | Planejamento de período e alertas de dependência. |
| Equipe e grupos | Capacidade, cargas, integrantes, coordenadores e acesso a atividades. | Distribuição operacional e consulta de pendências por pessoa. |
| Administração | Usuários, perfis, parâmetros de governança, auditoria e catálogos. | Configurações administrativas e gestão de acesso. |

**Biblioteca**, **Produção e revisão**, **Interfaces entre seções** e **Campo e divulgação** devem permanecer como áreas de consulta especializada no período de transição, mas suas ações de trabalho devem ser acessíveis também na ficha da atividade-mãe. Assim, a equipe não precisa alternar telas para concluir uma entrega.

## 4. Workflow documental recomendado

| Estado | Responsável primário | Artefato mínimo | Saídas permitidas | Transições proibidas |
|---|---|---|---|---|
| Planejada | Coordenador do capítulo | Executor, revisor, prazo, critérios de aceite e etapas. | Em elaboração. | Encaminhar ao tomo sem revisão. |
| Em elaboração | Grupo do capítulo e executor da etapa | Texto de trabalho, fontes, banco de dados e evidências. | Submetida para revisão da seção. | Publicar como oficial. |
| Submetida para revisão da seção | Executor/autor | Versão identificada, revisor designado e mensagem de submissão. | Em revisão da seção. | Autoaprovação pelo autor. |
| Em revisão da seção | Revisor indicado | Checklist, comentários e decisão registrada. | Ajustes solicitados ou em revisão do capítulo. | Encaminhar sem decisão de revisão. |
| Ajustes solicitados | Grupo do capítulo | Nova versão e resposta aos apontamentos. | Submetida para revisão da seção. | Substituir ou apagar versão anterior. |
| Em revisão do capítulo | Coordenador do capítulo | Validação de escopo, dados, interfaces e completude. | Encaminhada ao coordenador do tomo ou ajustes solicitados. | Ignorar interface bloqueadora sem justificativa. |
| Encaminhada ao coordenador do tomo | Coordenador do capítulo | Recomendação formal e evidências das revisões anteriores. | Em aprovação do tomo. | Publicar diretamente. |
| Em aprovação do tomo | Coordenador do tomo | Parecer de aprovação ou devolução. | Aprovada para documentação oficial ou ajustes solicitados. | Aprovar sem registros de revisão anteriores. |
| Aprovada para documentação oficial | Coordenador do tomo | Versão aprovada e metadados da decisão. | Publicada na documentação oficial. | Alterar conteúdo sem reabrir o fluxo. |
| Publicada na documentação oficial | Administrador/processo autorizado | Referência da versão oficial e data de publicação. | Reaberta, mediante justificativa. | Excluir histórico. |

## 5. Matriz de responsabilidades

| Papel | Responsabilidade | Pode aprovar | Não pode fazer |
|---|---|---|---|
| Administrador | Configura acesso, parâmetros e publicação autorizada. | Publicação técnica após aprovação do tomo. | Aprovar conteúdo em nome de coordenador sem delegação formal. |
| Coordenador de tomo | Garante consistência e aprovação final do tomo. | Aprovação para documentação oficial. | Substituir a revisão de seção ou de capítulo sem registro. |
| Coordenador de capítulo | Coordena a atividade-mãe, seu grupo e suas interfaces. | Encaminhamento ao tomo e revisão de capítulo. | Transferir a coordenação formal para etapa. |
| Executor/autor | Realiza etapas, redige texto, prepara dados e anexa evidências. | Submissão para revisão da seção. | Aprovar a própria entrega. |
| Revisor de seção | Revisa qualidade, dados, escopo e interfaces. | Aprovação técnica da seção ou pedido de ajuste. | Aprovação final do tomo. |
| Integrante consultante | Consulta conteúdo e contribui quando autorizado. | Nenhuma aprovação. | Alterar registro sem atribuição. |

## 6. Regras de conexão com o cronograma

O `Cronograma-R1-e-R2-26_agosto.xlsm` deve ser a fonte de referência para datas, marcos, seminários e dependências. Toda atividade-mãe deve ter vínculo a pelo menos uma entrega do cronograma; cada etapa deve ter janela de execução ou ser identificada explicitamente como pendência de planejamento.

| Regra | Controle no portal | Critério de aceite |
|---|---|---|
| Etapa com prazo | Início, término e marco editáveis na ficha e no cronograma. | Nenhuma entrega é marcada pronta com etapa crítica sem período. |
| Revisão de seção | Prazo próprio derivado da entrega da etapa. | Revisor e data-limite definidos antes da submissão. |
| Interface bloqueadora | Sinalização vinculada à atividade-mãe e à entrega. | Encaminhamento somente com resolução ou justificativa aceita. |
| Seminário | Vínculo com atividade-mãe, capítulo, materiais e encaminhamentos. | Evento associado à entrega ou marco correspondente. |
| Mudança de prazo | Justificativa e reavaliação de dependências. | Auditoria registra autor, data, motivo e impacto. |

## 7. Prioridades de implementação

| Prioridade | Alteração | Justificativa | Critério de aceite |
|---|---|---|---|
| P0 | Workflow documental escalonado na ficha da atividade-mãe. | Sem submissões e decisões, o controle de revisão não se inicia. | Estados, guardas de transição e trilha auditável disponíveis. |
| P0 | Designação obrigatória de revisor por seção. | 45 atividades-mãe ainda não têm revisor. | Não é possível submeter sem revisor e prazo de revisão. |
| P0 | Painel de bloqueios de execução e revisão. | 284 etapas sem executor e 77 sem período demandam ação coordenada. | Coordenadores veem e filtram pendências por capítulo. |
| P1 | Vínculo de seminários e evidências às atividades-mãe. | Os 11 eventos devem gerar evidência e encaminhamento. | Cada seminário tem capítulo, atividade, material e responsável. |
| P1 | Checklist de revisão e de completude de banco de dados. | Evita encaminhamento com texto ou dados incompletos. | Coordenador só encaminha com checklist completo ou ressalva registrada. |
| P2 | Consolidação contextual dos módulos especializados. | Reduz alternância de telas durante a execução. | Principais ações estão disponíveis na ficha-mãe sem remover consultas globais. |
| P2 | Indicadores de fila documental na Visão Geral. | Dá visibilidade a estados e atrasos de revisão. | Painel mostra contagens por estado e item bloqueador. |
| P3 | Relatórios de desempenho de revisão por tomo. | Útil após início regular das submissões. | Relatório calcula tempo por estado, devoluções e atrasos. |

## 8. Plano de implantação proposto

| Horizonte | Entregas prioritárias | Resultado esperado |
|---|---|---|
| 0–30 dias | P0: estados do workflow, revisor obrigatório, painéis de bloqueio e preparação de dados. | Primeira rodada de documentos pode ser submetida e revisada de forma rastreável. |
| 31–60 dias | P1: checklist, vínculos de seminário, evidências e controles de banco de dados. | Revisões de capítulo refletem texto, dados e interfaces. |
| 61–90 dias | P2: simplificação contextual, indicadores executivos e treinamento dos usuários. | A ficha-mãe torna-se o local padrão de gestão da entrega. |
| Após 90 dias | P3: relatórios comparativos, ajustes de capacidade e automações aprovadas. | Governança baseada em evidências de uso e de prazo. |

## 9. Riscos e controles

| Risco | Controle proposto |
|---|---|
| Aprovação sem revisão registrada | Guardas de transição e exigência de decisão de seção e capítulo. |
| Sobrecarga dos coordenadores | Distribuição de etapas, indicadores de carga e revisão por seção. |
| Perda de versões | Versionamento imutável, sem exclusão de material aprovado ou submetido. |
| Interface ignorada | Bloqueio ou justificativa formal antes do encaminhamento ao tomo. |
| Banco de dados incompleto | Checklist específico e evidência de atualização vinculada à entrega. |
| Confiança excessiva na IA | Pré-análise tratada somente como subsídio, com decisão humana obrigatória. |

## 10. Decisões para validação da coordenação

1. Formalizar os coordenadores de tomo e os substitutos autorizados no portal.
2. Definir o checklist mínimo de cada tipo de capítulo, incluindo critérios de banco de dados.
3. Estabelecer o prazo-padrão de revisão de seção e de capítulo por tipo de entrega.
4. Decidir quais interfaces impedem formalmente o encaminhamento ao tomo.
5. Aprovar o conjunto P0 como próxima etapa de implementação.

## Fontes internas consultadas

| Fonte | Uso na avaliação |
|---|---|
| `docs/prompt-plano-revisao-portal.md` | Regras e entregáveis da avaliação. |
| `drizzle/schema.ts` | Modelo de atividades, revisões, materiais, evidências e interfaces. |
| Base operacional do Portal Naval | Contagens de frentes, atividades, etapas, revisões, evidências, interfaces e seminários. |
| `Cronograma-R1-e-R2-26_agosto.xlsm` | Referência de períodos, marcos, entregas e seminários reconciliados no portal. |
