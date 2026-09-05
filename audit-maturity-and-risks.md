# Maturidade, causas-raiz e riscos gerenciais

## Painel de maturidade

> **Nota geral: 1,80 de 5.** A base funcional é promissora, mas a maturidade operacional ainda é baixa. A plataforma está mais avançada como desenho de controle do que como instrumento efetivamente usado por coordenadores, participantes e revisores.

| Dimensão | Nota | Evidência observável | Impacto | Confiança |
|---|---:|---|---|---|
| Governança | 2 | Há 9 grupos, coordenadores definidos e regras de acesso por papel; somente o administrador possui conta operacional. | A responsabilidade está modelada, mas a atualização e a decisão continuam centralizadas. | Alta |
| Planejamento | 2 | As 21 seções têm atividade, responsável e prazo; faltam marcos, dependências, prioridade, esforço restante e critério de aceite. | O cronograma informa datas finais, mas não representa a lógica de execução nem permite previsão robusta. | Alta |
| Controle de prazo | 2 | Painel, calendário e estados de atraso existem; a rotina automática está desativada e não há linha de base ou previsão. | O controle tende a reagir ao vencimento em vez de antecipar o desvio. | Alta |
| Capacidade e horas | 1 | Existe alocação nominal, mas não há disponibilidade, realizado, saldo ou uso: 0 horas alocadas. | Não é possível demonstrar viabilidade do plano ou detectar sobrecarga. | Alta |
| Qualidade das entregas | 1 | Versionamento e pareceres foram implementados; não há critérios de aceite nem materiais em uso. | A conclusão da atividade pode não significar entrega tecnicamente aceita. | Alta |
| Revisão por pares | 1 | O ciclo de revisão está disponível, porém há 0 revisores, 0 submissões e 0 pareceres. | A segregação e a garantia de qualidade ainda não operam. | Alta |
| Interfaces entre seções | 2 | Há registro, prioridade, grupos, discussão, histórico e resolução; nenhuma interface foi cadastrada e o fechamento não atualiza o plano. | A coordenação transversal existe como capacidade, mas não reduz risco no estado atual. | Alta |
| Riscos e impedimentos | 2 | Prazo e interfaces tratam parte dos sinais, porém não há entidade própria para risco, impedimento ou resposta. | Causas de atraso e decisões preventivas permanecem fora do sistema. | Alta |
| Comunicação | 1 | Comentários e notificações foram modelados; contas e WhatsApp não estão ativos e nenhuma notificação foi enviada. | A execução ainda depende de canais paralelos e reuniões sem rastreabilidade garantida. | Alta |
| Informação gerencial | 2 | O painel mostra contagens, progresso, cronograma e próximas entregas; não mostra tendência, previsão, causa, capacidade ou confiança do dado. | A coordenação vê o estado cadastrado, mas não recebe uma fila priorizada de decisões. | Alta |
| Qualidade dos dados | 1 | Os campos básicos estão preenchidos, mas os dados operacionais críticos estão vazios e não há trilha integral das mutações. | Indicadores podem transmitir sensação de controle sem evidenciar atualidade ou completude. | Alta |
| Experiência e acessibilidade | 3 | Os fluxos são responsivos e os diálogos principais têm nomes acessíveis; listas longas em celular dificultam varredura. | A operação é possível, mas ainda pouco otimizada para exceções e alta frequência. | Alta |
| Automação e alertas | 2 | Há idempotência, retentativas e rotina diária; a automação está inativa e cobre basicamente atribuição e prazo final. | A coordenação precisa monitorar manualmente revisão, interfaces e atualização de progresso. | Alta |
| Segurança e segregação | 3 | Regras por perfil e escopo estão testadas; faltam auditoria completa e transações em operações compostas. | O desenho protege a confidencialidade, mas a segurança operacional ainda não foi provada em escala. | Alta |
| Orientação ao resultado final | 2 | Seções, revisão e interfaces se conectam ao produto final; faltam critérios de aceite e visão consolidada da coerência entre seções. | A plataforma acompanha produção, mas ainda não assegura a qualidade do estudo integrado. | Alta |

As dimensões com nota **0, 1 ou 2** devem ser tratadas como fragilidades materiais. A nota 3 de experiência e segurança não elimina pendências: ela indica processos definidos, ainda sem comprovação operacional suficiente.

## Achados e causas-raiz

| ID | Achado | Evidência | Causa-raiz provável | Tipo | Consequência | Perfis ou módulos afetados |
|---|---|---|---|---|---|---|
| A1 | A governança está cadastrada, mas não ativada. | 30 integrantes e 9 coordenadores; 0 vínculos com contas. | Onboarding e responsabilização não foram incorporados ao início da operação. | Processo, governança e dados | O administrador vira ponto único de atualização e controle. | Todos os perfis; equipe; administração |
| A2 | O cronograma é uma lista de datas, não uma rede executável. | Uma atividade principal por seção; ausência de marcos, dependências e linha de base. | O modelo privilegiou a ficha simples antes da decomposição gerencial do trabalho. | Dados e regra de negócio | Desvios podem ser percebidos apenas perto do vencimento final. | Painel; atividades; calendário |
| A3 | A viabilidade de capacidade não pode ser demonstrada. | 0 horas alocadas; não há disponibilidade, realizado ou saldo. | O sistema registra comprometimento nominal, mas não gerencia capacidade temporal. | Dados e processo | Sobrecarga, ociosidade e esforço restante ficam invisíveis. | Equipe; atividades; painel |
| A4 | A carga aparente está concentrada. | 12 das 21 atividades, ou 57,1%, estão sob um único coordenador. | Distribuição inicial por seção sem validação por esforço ou delegação operacional. | Governança e planejamento | Risco de gargalo e ponto único de falha; a gravidade real não pode ser confirmada sem horas. | Coordenação geral; Grupo UFRJ |
| A5 | O mecanismo de qualidade está pronto, mas não entrou em operação. | 0 materiais, revisores, submissões, comentários e pareceres. | Contas não vinculadas, critérios de aceite ausentes e ausência de ritual obrigatório de revisão. | Processo e dados | A coordenação não consegue distinguir material produzido de material aceito. | Produção; revisão; atividades |
| A6 | Interfaces transversais podem continuar sendo tratadas fora da plataforma. | Módulo completo, mas 0 interfaces registradas e sem alertas específicos. | O fluxo não foi incorporado aos ritos de planejamento e revisão das seções. | Governança, processo e automação | Sobreposição, lacuna e incoerência podem aparecer apenas na consolidação final. | Interfaces; seções; painel |
| A7 | Riscos e impedimentos não possuem ciclo próprio. | Não há registro de probabilidade, impacto, gatilho, resposta, dono ou data de decisão. | A atenção foi concentrada em status e prazo, sem gestão explícita de incerteza. | Dados e regra de negócio | A coordenação não dispõe de carteira priorizada de ameaças e respostas. | Painel; atividades; coordenação geral |
| A8 | O painel descreve, mas não dirige a ação. | Mostra progresso e contagens; não mostra tendência, previsão, causa, idade, atualização ou decisão pendente. | Indicadores foram construídos antes de haver dados operacionais e regras de exceção. | Informação gerencial e experiência | Reuniões precisam reconstruir manualmente contexto, causa e prioridade. | Visão geral; calendário; administração |
| A9 | A automação é tecnicamente resiliente, porém inativa e estreita. | WhatsApp e rotina estão desativados; escopo principal é prazo/atribuição. | Configuração operacional pendente e catálogo de eventos incompleto. | Automação | Alertas de revisão, interface, risco e desatualização dependem de acompanhamento manual. | Administração; notificações; produção; interfaces |
| A10 | A rastreabilidade técnica é desigual. | Há históricos específicos, mas faltam log geral de mutações, transações em operações compostas e validação de conteúdo de arquivos. | Controles foram implementados por módulo, sem camada transversal de auditoria e integridade. | Arquitetura e segurança | Incidentes ou divergências podem ser difíceis de reconstruir e corrigir. | Administração; atividades; notificações; uploads |
| A11 | A experiência móvel preserva o conteúdo, mas não prioriza exceções. | Atividades e cronograma formam páginas extensas em 390 px. | O desenho responsivo empilha a visão desktop sem uma camada específica de triagem móvel. | Experiência do usuário | Maior tempo para localizar itens que exigem decisão ou atualização. | Painel; atividades |

## Riscos gerenciais

| Risco | Probabilidade | Impacto | Sinal de alerta | Resposta recomendada | Responsável sugerido |
|---|---|---|---|---|---|
| A plataforma não se tornar o sistema de registro da execução. | Alta | Alto | Contas continuam desvinculadas e dados operacionais permanecem zerados após a primeira semana. | Realizar onboarding por grupo, definir responsáveis por atualização e monitorar adesão semanal. | Coordenação geral e administrador |
| Sobrecarga ou indisponibilidade de coordenador crítico. | Média-alta | Alto | Mais de 40% das atividades ou horas concentradas em uma pessoa; atualizações atrasadas. | Validar esforço, nomear suplente e redistribuir execução ou revisão. | Coordenação geral |
| Atraso descoberto apenas no prazo final. | Alta | Alto | Progresso sem atualização, marcos inexistentes e esforço restante incompatível com dias úteis. | Criar marcos, previsão e alertas por desvio; exigir atualização semanal. | PMO/coordenação geral |
| Entrega tecnicamente incompleta ou inconsistente. | Alta | Alto | Atividade concluída sem material aprovado ou critério de aceite verificado. | Tornar revisão e aceite condições de fechamento das atividades aplicáveis. | Coordenadores e revisores |
| Contradição ou duplicidade entre seções. | Média-alta | Alto | Interfaces críticas abertas perto do marco de consolidação; seções correlatas sem interface avaliada. | Instituir revisão transversal e escalonamento de interfaces críticas. | Coordenação geral e coordenadores envolvidos |
| Dados de progresso desatualizados produzirem decisão equivocada. | Alta | Médio-alto | Idade da última atualização acima de 7 dias ou campos mínimos incompletos. | Exibir frescor, bloquear conclusão inconsistente e criar fila de atualização pendente. | Coordenadores |
| Alertas automáticos não chegarem aos destinatários. | Alta no estado atual | Médio | Integração desativada, 0 opt-ins ou falhas repetidas de envio. | Ativar piloto, testar entrega, manter canal interno alternativo e painel de falhas. | Administrador |
| Alterações críticas não poderem ser reconstruídas. | Média | Médio | Divergência de prazo, responsável ou papel sem autor e justificativa. | Implantar trilha de auditoria e transações nas operações compostas. | Administrador técnico |
| Arquivo malformado ou consumo excessivo no upload. | Baixa-média | Médio | Arquivo cuja extensão diverge do conteúdo ou picos de memória. | Validar assinatura do arquivo e migrar envio para streaming quando houver escala. | Administrador técnico |

## Síntese causal

O problema dominante não é falta de telas. Há uma cadeia causal mais direta: **atores não habilitados → registros operacionais inexistentes → indicadores sem poder explicativo → decisões continuam fora da plataforma → baixa adesão percebida**. Em paralelo, o modelo atual cobre o “estado” do trabalho, mas ainda não representa plenamente **plano, incerteza, capacidade, aceite e previsão**. A estratégia recomendada deve romper primeiro o ciclo de não adoção e, em seguida, adicionar somente os controles que sustentem decisões recorrentes.
