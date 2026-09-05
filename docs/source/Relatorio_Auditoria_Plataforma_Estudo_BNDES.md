# Auditoria da plataforma de gestão da execução do Estudo BNDES — Indústria Naval

**Autor:** Manus AI  
**Data da avaliação:** 31 de julho de 2026  
**Escopo:** plataforma em desenvolvimento, dados atuais, regras de acesso, fluxos, testes e controles técnicos  
**Período cadastrado do estudo:** 1º de agosto de 2026 a 31 de janeiro de 2027

> **Conclusão central:** a plataforma contém uma base funcional consistente para responsabilização, revisão e coordenação transversal, mas ainda não opera como sistema de gestão da execução. A prioridade não é adicionar muitas telas; é ativar os atores, completar a linha de base e transformar exceções em ações com responsável e prazo.

![Painel de maturidade da plataforma](https://files.manuscdn.com/user_upload_by_module/session_file/310519663187585221/OoXFGYbJkqWgnCvk.png)

## Metodologia e ressalva temporal

A avaliação aplicou integralmente o prompt de auditoria definido para a plataforma. Foram examinados o modelo de dados, os fluxos visíveis em desktop e celular, os procedimentos do servidor, as regras de acesso, os controles de upload e notificações, os testes automatizados e uma fotografia quantitativa do banco.[1] [2] [5] [6] O resultado distingue **capacidade implementada** de **uso operacional observado**.

O estudo começa em 1º de agosto de 2026, enquanto esta auditoria foi realizada em 31 de julho. Portanto, os registros operacionais vazios não devem ser interpretados como descumprimento de execução já iniciada. Eles demonstram uma **lacuna de prontidão para entrada em operação** que deve ser fechada nos primeiros dias do estudo.[1]

## A. Resumo executivo

A maturidade geral foi avaliada em **1,80 de 5**, correspondente a controles parcialmente definidos, ainda reativos ou sem uso operacional.[3] [4] Os três principais pontos fortes são a segregação de acesso por papel e escopo, a conexão entre atividade, material, revisão e interface, e a interface editorial responsiva sustentada por 58 testes aprovados, verificação TypeScript e build de produção.[1] [5] [6]

Os três problemas centrais são: **nenhuma conta vinculada aos 30 integrantes**, impossibilitando a operação distribuída; planejamento limitado a uma atividade e um prazo por seção, sem marcos, dependências, risco ou capacidade temporal; e painéis que mostram estado cadastrado, mas não destacam causas, tendência, previsão ou decisões requeridas.[1] [2]

A mudança mais urgente é instituir um **go-live controlado de gestão**: vincular contas, completar a linha de base mínima de cada seção, ativar uma rotina semanal de atualização e apresentar ao administrador e aos coordenadores uma fila única de exceções com dono, prazo e escalonamento. Essa alteração transforma a plataforma de cadastro em instrumento de decisão sem depender, inicialmente, de uma expansão excessiva do escopo.

## B. Visão atual da plataforma

| Fluxo | Usuários | Como funciona atualmente | Resultado gerencial | Lacuna principal |
|---|---|---|---|---|
| Governança e acesso | Administrador | Mantém projeto, grupos, integrantes, papéis, contas e configurações. | Estrutura nove grupos e define coordenadores. | Somente o administrador está operacional; coordenadores e participantes não possuem conta vinculada. |
| Atividades e calendário | Administrador; coordenador responsável | Cada seção possui atividade, responsável, prazo, status e progresso; coordenador administra horas e revisores da própria atividade. | Fornece responsabilidade nominal e leitura de prazo. | Não há marcos, dependências, prioridade, critério de aceite, esforço restante ou linha de base. |
| Capacidade | Administrador; coordenador responsável | Permite distribuir horas entre participantes do grupo. | Estrutura o comprometimento nominal por atividade. | Não registra disponibilidade por período, horas realizadas ou saldo; atualmente há 0 horas alocadas. |
| Produção | Administrador; coordenador; grupo | Materiais vinculam-se a atividade e seção, recebem versões e ficam visíveis ao grupo. | Organiza a produção e preserva versões. | Não há critérios de aceite ou materiais cadastrados; comparação entre versões não é apoiada. |
| Revisão por pares | Coordenador; revisor | Coordenador aponta revisores e submete versão; revisor comenta e registra parecer. | Cria segregação e rastreabilidade da qualidade. | Não há prazo de revisão, cobertura mínima, balanceamento de revisores ou operação real. |
| Interfaces entre seções | Administrador; grupos envolvidos | Registra sobreposição, dependência ou interface, prioridade, responsável, discussão, histórico e resolução. | Estrutura a coordenação transversal. | Nenhuma interface foi cadastrada; resolução não repercute automaticamente no planejamento. |
| Alertas | Administrador; destinatários | Motor prevê atribuição, prazo próximo e atraso, com idempotência e retentativas. | Base técnica adequada para comunicação acionável. | WhatsApp e rotina estão desativados; não cobre revisão, interface, risco ou dado desatualizado. |
| Painel executivo | Administrador | Mostra progresso, atividades em andamento, atrasos, equipe, cronograma, próximas entregas e interfaces por seção. | Permite leitura rápida do estado cadastrado. | Não mostra tendência, previsão, causa, capacidade, qualidade, frescor ou decisão pendente. |
| Biblioteca | Usuários autorizados | Organiza arquivos e links por tema e seção. | Centraliza referências. | O acervo está vazio e não há indicador de cobertura ou aprovação por seção. |

Os fluxos e a qualidade dos dados foram detalhados na matriz de evidências da auditoria.[2] O desenho atual é coerente, mas o benefício gerencial depende de adoção e preenchimento tempestivo.

## C. Painel de maturidade

| Dimensão | Nota de 0 a 5 | Evidência | Impacto | Confiança |
|---|---:|---|---|---|
| Governança | 2 | Papéis e grupos estão definidos, mas os colaboradores não possuem acesso operacional. | Responsabilização e atualização permanecem centralizadas. | Alta |
| Planejamento | 2 | Há responsável e prazo por seção, sem marcos, dependências, linha de base ou aceite. | O plano não permite previsão nem análise de sequência lógica. | Alta |
| Controle de prazo | 2 | Calendário e atraso existem; alertas estão inativos e não há previsão. | O controle tende a reagir ao vencimento. | Alta |
| Capacidade e horas | 1 | Existe alocação nominal, mas não há disponibilidade, realizado ou uso atual. | A viabilidade do plano e a sobrecarga não podem ser demonstradas. | Alta |
| Qualidade das entregas | 1 | Versionamento e pareceres existem, sem critérios de aceite e sem materiais. | “Concluído” pode não equivaler a “aceito”. | Alta |
| Revisão por pares | 1 | Fluxo implementado, com 0 revisores e 0 submissões. | A garantia de qualidade ainda não opera. | Alta |
| Interfaces entre seções | 2 | Há fluxo auditável, mas nenhuma interface e nenhuma integração automática ao plano. | Riscos transversais podem permanecer externos. | Alta |
| Riscos e impedimentos | 2 | Prazo e interfaces cobrem sinais parciais; não há ciclo próprio de risco. | A coordenação não mantém carteira preventiva de ameaças e respostas. | Alta |
| Comunicação | 1 | Comentários e motor de notificações existem, mas estão sem operação multiusuário ou envio ativo. | Discussões e decisões tendem a permanecer em canais paralelos. | Alta |
| Informação gerencial | 2 | O painel consolida estado e contagens, sem tendência, previsão, causa ou exceção priorizada. | A reunião precisa reconstruir manualmente o contexto. | Alta |
| Qualidade dos dados | 1 | Campos básicos existem; dados operacionais críticos estão vazios e a auditoria é parcial. | Indicadores não comprovam atualidade nem completude. | Alta |
| Experiência e acessibilidade | 3 | Fluxos responsivos e diálogos acessíveis; listas móveis são extensas. | A operação é viável, ainda pouco otimizada para triagem. | Alta |
| Automação e alertas | 2 | Motor resiliente implementado, porém desativado e restrito a prazo/atribuição. | A coordenação monitora manualmente outros eventos críticos. | Alta |
| Segurança e segregação | 3 | Regras granulares e testes existem; faltam auditoria transversal e transações compostas. | O desenho é seguro, mas ainda não foi validado em escala real. | Alta |
| Orientação ao resultado final | 2 | Revisão e interfaces apoiam coerência, sem aceite consolidado ou visão da integração das 21 seções. | A plataforma acompanha produção, mas ainda não assegura a qualidade do estudo final. | Alta |

As notas foram calibradas por 15 avaliações independentes e consolidadas contra a fotografia operacional.[1] [4] As dimensões com nota 1 exigem ação no início do ciclo; as notas 2 indicam controles parciais que devem ser conectados e ativados antes de se tornarem confiáveis.

## D. Achados e causas

| ID | Achado | Evidência | Causa-raiz provável | Tipo | Consequência | Perfis ou módulos afetados |
|---|---|---|---|---|---|---|
| A1 | A governança está cadastrada, mas não ativada. | 30 integrantes, 9 coordenadores e 0 vínculos com contas. | Onboarding não foi tratado como requisito de go-live. | Processo, governança e dados | O administrador torna-se ponto único de atualização. | Todos; equipe; administração |
| A2 | O cronograma não representa a rede real de execução. | Há 21 atividades, sem marcos, dependências ou linha de base. | O modelo priorizou a ficha simples por seção. | Dados e regra de negócio | Desvio pode ser percebido apenas próximo ao prazo final. | Painel; atividades; calendário |
| A3 | A capacidade não é mensurável. | Há 0 horas alocadas e não existem disponibilidade, realizado ou saldo. | Alocação foi modelada sem controle temporal de capacidade. | Dados e processo | Sobrecarga e esforço restante ficam invisíveis. | Equipe; atividades; painel |
| A4 | A responsabilidade aparente está concentrada. | Um coordenador responde por 12 das 21 atividades, ou 57,1%.[1] | Distribuição inicial sem validação por esforço e suplência. | Governança e planejamento | Possível gargalo e ponto único de falha. | Coordenação geral; Grupo UFRJ |
| A5 | O mecanismo de qualidade não entrou em operação. | Não há material, revisor, submissão, comentário ou parecer. | Acesso, aceite e ritual de revisão ainda não foram ativados. | Processo e dados | Não se distingue produção de aprovação técnica. | Produção; revisão; atividades |
| A6 | Interfaces podem continuar fora do sistema. | Há fluxo completo, mas 0 interfaces e nenhum alerta específico. | O rito transversal não foi incorporado ao planejamento. | Governança e automação | Incoerências podem surgir apenas na consolidação. | Interfaces; seções; painel |
| A7 | Risco e impedimento não possuem ciclo explícito. | Não há probabilidade, impacto, gatilho, resposta, dono ou data de decisão. | Foco no status, sem gestão estruturada da incerteza. | Dados e regra de negócio | A coordenação não dispõe de carteira preventiva. | Painel; atividades; coordenação |
| A8 | O painel descreve, mas não dirige a ação. | Contagens e progresso não incluem causa, idade, previsão ou decisão requerida. | Métricas foram criadas antes das regras de exceção. | Informação gerencial e experiência | Reuniões precisam reconstruir contexto e prioridade. | Visão geral; calendário |
| A9 | Automação tecnicamente boa permanece inativa. | Integração, opt-in e rotina sem ativação ou histórico de envio. | Configuração operacional e catálogo de eventos incompletos. | Automação | Revisão, interface, risco e atualização dependem de cobrança manual. | Administração; notificações |
| A10 | A rastreabilidade é desigual. | Há históricos por módulo, sem log geral de alterações e sem atomicidade em algumas operações compostas.[5] | Controles cresceram localmente, não como camada transversal. | Arquitetura e segurança | Incidentes e divergências podem ser difíceis de reconstruir. | Administração; atividades; alertas |
| A11 | O celular preserva conteúdo, mas não prioriza exceções. | Atividades e cronograma formam páginas extensas em 390 px.[1] | A responsividade empilha a visão completa. | Experiência do usuário | Maior tempo para localizar ações urgentes. | Painel; atividades |

## E. Riscos gerenciais

| Risco | Probabilidade | Impacto | Sinal de alerta | Resposta recomendada | Responsável sugerido |
|---|---|---|---|---|---|
| A plataforma não se tornar o sistema oficial da execução. | Alta | Alto | Contas e dados operacionais continuam zerados após a primeira semana. | Onboarding por grupo, política de atualização e monitoramento de adesão. | Coordenação geral e administrador |
| Sobrecarga de coordenador crítico. | Média-alta | Alto | Mais de 40% das atividades ou horas concentradas em uma pessoa. | Validar esforço, distribuir execução e nomear suplente. | Coordenação geral |
| Atraso percebido apenas no vencimento. | Alta | Alto | Progresso sem atualização e marcos inexistentes. | Criar marcos, previsão e gatilhos por desvio. | PMO/coordenação geral |
| Entrega concluída sem aceite técnico. | Alta | Alto | Atividade fechada sem material aprovado ou critérios verificados. | Tornar aceite e revisão condições de encerramento. | Coordenadores e revisores |
| Contradição ou duplicidade entre seções. | Média-alta | Alto | Interface crítica perto da consolidação ou seções correlatas sem análise. | Revisão transversal e escalonamento de interfaces críticas. | Coordenação geral |
| Progresso desatualizado orientar decisão equivocada. | Alta | Médio-alto | Última atualização superior a sete dias. | Exibir frescor e criar fila de atualização pendente. | Coordenadores |
| Notificação não chegar ao destinatário. | Alta no estado atual | Médio | Integração desativada, ausência de opt-in ou repetição de falhas. | Piloto, canal alternativo e painel de falhas. | Administrador |
| Alteração crítica sem reconstrução possível. | Média | Médio | Mudança de prazo, responsável ou papel sem autor e justificativa. | Log transversal e transações em operações compostas. | Administrador técnico |

## F. Melhorias priorizadas

| ID | Alteração proposta | Problema resolvido | Impacto | Esforço | Risco de implantação | Prioridade | Indicador de sucesso |
|---|---|---|---|---|---|---|---|
| M1 | Assistente de prontidão e ativação por grupo | Governança sem usuários e dados mínimos | Alto | Médio | Baixo | P0 | 100% dos coordenadores vinculados; 90% dos integrantes ativos em 10 dias |
| M2 | Central de ações e atualização semanal | Painel descritivo e dados sem frescor | Alto | Médio | Baixo | P1 | 95% das atividades atualizadas em até 7 dias; redução de pendências vencidas |
| M3 | Capacidade por período, realizado e esforço restante | Impossibilidade de avaliar sobrecarga e viabilidade | Alto | Alto | Médio | P1 | 100% das atividades com esforço restante; nenhuma pessoa acima do limiar sem decisão |
| M4 | Marcos, dependências, linha de base e previsão | Cronograma sem lógica executável | Alto | Alto | Médio | P1 | 100% das seções com marcos e previsão; desvio previsto antes do vencimento |
| M5 | Critérios de aceite, SLA de revisão e trava de conclusão | Entrega sem comprovação de qualidade | Alto | Médio | Médio | P1 | 100% das entregas aplicáveis concluídas com aceite e parecer |
| M6 | Registro de riscos e impedimentos | Incertezas e bloqueios fora do sistema | Alto | Médio | Baixo | P1 | 100% dos riscos altos com resposta, responsável e prazo |
| M7 | Escalonamento e repercussão das interfaces no plano | Coordenação transversal desconectada da execução | Alto | Médio | Médio | P1 | Nenhuma interface crítica vencida sem escalonamento; resoluções refletidas no plano |
| M8 | Catálogo multicanal de alertas acionáveis | Automação estreita e inativa | Médio-alto | Médio | Médio | P1 | 95% de entrega dos alertas; menos de 5% de alertas sem ação necessária |
| M9 | Painel analítico de tendência, previsão e qualidade do dado | Informação gerencial sem causa ou futuro | Alto | Alto | Médio | P2 | 80% das reuniões usam a central de exceções; redução do tempo de preparação |
| M10 | Auditoria transversal, transações e segurança de upload | Rastreabilidade e integridade desiguais | Médio-alto | Alto | Médio | P2 | 100% das mutações críticas auditadas; zero operação parcial detectada |
| M11 | Visão móvel “minhas ações” e listas progressivas | Rolagem longa e baixa triagem móvel | Médio | Médio | Baixo | P2 | Redução do tempo mediano para localizar uma ação prioritária |
| M12 | Relatório de encerramento e lições por seção | Aprendizado e consolidação não estruturados | Médio | Médio | Baixo | P3 | 100% das seções encerradas com aceite, interfaces fechadas e lições registradas |

## G. Especificação funcional das alterações

### M1 — Assistente de prontidão e ativação por grupo — P0

| Elemento | Especificação |
|---|---|
| Objetivo | Colocar coordenadores, participantes e revisores em operação com dados mínimos confiáveis antes de iniciar o acompanhamento regular. |
| Usuários beneficiados | Administrador, coordenação geral, coordenadores, participantes e revisores. |
| História | **Como administrador, quero acompanhar a prontidão de cada grupo, para iniciar o estudo com responsáveis habilitados e fichas mínimas completas.** |
| Fluxo esperado | O sistema lista grupos e integrantes, permite vincular ou convidar contas, registra confirmação de acesso e apresenta checklist por seção: responsável, suplente, prazo, marcos iniciais, horas, critérios de aceite e revisores. |
| Dados necessários | Estado do convite, data de ativação, último acesso, checklist de prontidão, responsável pela pendência e prazo de regularização. |
| Regra de acesso | Administrador vê todos; coordenador vê e completa somente o próprio grupo e suas seções; participante confirma dados próprios. |
| Critérios de aceite | O painel mostra percentual por grupo; nenhuma seção pode ser marcada “pronta” com item obrigatório ausente; cada pendência tem dono e prazo; ativação e mudanças ficam auditadas. |
| Dependências e efeitos | Requer fluxo de convite/vínculo de conta. Convites devem expirar e ser reemitidos; não deve conceder perfil por domínio de e-mail. |
| Teste recomendado | Cenários de convite válido, expirado, vínculo duplicado, coordenador em grupo alheio, checklist incompleto e prontidão completa. |

### M2 — Central de ações e atualização semanal — P1

| Elemento | Especificação |
|---|---|
| Objetivo | Transformar dados em uma fila priorizada de decisões e atualizações. |
| Usuários beneficiados | Administrador, coordenação geral, coordenadores e revisores. |
| História | **Como coordenador, quero ver todas as ações que dependem de mim, para atualizar, decidir ou escalar o trabalho no prazo.** |
| Fluxo esperado | A página inicial apresenta “Minhas ações” e “Exceções do estudo”, agrupadas por vencida, hoje, próxima e sem prazo. Cada item informa causa, impacto, dono, prazo e ação direta. |
| Dados necessários | Última atualização, próximo passo, responsável, prazo da ação, severidade, origem e estado de escalonamento. |
| Regra de acesso | Usuário vê ações próprias e do próprio grupo; administrador vê o conjunto; dados sensíveis de outros grupos aparecem apenas agregados. |
| Critérios de aceite | Atividade sem atualização por 7 dias gera ação; comentário de ajuste pendente gera ação; interface e parecer vencidos entram na fila; ações encerradas preservam histórico. |
| Dependências e efeitos | Depende de eventos uniformes e de regras de prioridade. Deve evitar duplicação entre e-mail, WhatsApp e painel. |
| Teste recomendado | Geração idempotente, escopo por grupo, escalonamento, encerramento automático pela ação correspondente e visualização móvel. |

### M3 — Capacidade por período, realizado e esforço restante — P1

| Elemento | Especificação |
|---|---|
| Objetivo | Verificar se o esforço disponível é compatível com o plano restante. |
| Usuários beneficiados | Coordenação geral, coordenadores e integrantes. |
| História | **Como coordenador, quero comparar disponibilidade, alocação, realizado e esforço restante, para redistribuir trabalho antes da sobrecarga.** |
| Fluxo esperado | Cada integrante informa capacidade semanal; o coordenador aloca horas por atividade e semana; o realizado é lançado ou importado; o sistema calcula saldo e previsão de conclusão. |
| Dados necessários | Capacidade semanal, ausências, alocação por semana, horas realizadas, estimativa restante e confiança da estimativa. |
| Regra de acesso | Integrante vê seus dados; coordenador vê o grupo; administrador vê consolidados e detalhes autorizados. |
| Critérios de aceite | Saldo é calculado por período; sobrecarga acima de 110% é destacada; mudança preserva linha de base; atividade sem esforço restante não pode ter previsão calculada. |
| Dependências e efeitos | Exige decisão sobre periodicidade e fonte do realizado. Deve evitar controle excessivamente granular. |
| Teste recomendado | Sobreposição de alocações, férias, mudança de capacidade, valores decimais, permissão entre grupos e recálculo da previsão. |

### M4 — Marcos, dependências, linha de base e previsão — P1

| Elemento | Especificação |
|---|---|
| Objetivo | Representar a lógica de execução e antecipar impacto de desvios. |
| Usuários beneficiados | Coordenação geral e coordenadores. |
| História | **Como coordenação geral, quero visualizar marcos e dependências, para identificar o caminho crítico e agir antes que uma seção afete as demais.** |
| Fluxo esperado | Atividade recebe marcos e dependências término–início; a primeira aprovação cria linha de base; atualizações geram previsão e indicam impacto a jusante. |
| Dados necessários | Marco, data-base, data prevista, dependência, defasagem, responsável, justificativa da mudança e nível de confiança. |
| Regra de acesso | Administrador aprova linha de base; coordenador propõe e atualiza marcos das próprias atividades. |
| Critérios de aceite | Dependência circular é bloqueada; desvio superior ao limiar gera ação; alteração de prazo exige justificativa; calendário e painel usam a previsão vigente. |
| Dependências e efeitos | Requer política de baseline e versionamento. Pode aumentar a carga se houver marcos em excesso. |
| Teste recomendado | Ciclo de dependência, alteração de baseline, propagação de atraso, fuso horário, escopo do coordenador e histórico. |

### M5 — Critérios de aceite, SLA de revisão e trava de conclusão — P1

| Elemento | Especificação |
|---|---|
| Objetivo | Fazer com que conclusão represente entrega verificada, não apenas percentual informado. |
| Usuários beneficiados | Coordenadores, revisores e coordenação geral. |
| História | **Como revisor, quero avaliar critérios explícitos e prazo de parecer, para emitir uma decisão consistente e tempestiva.** |
| Fluxo esperado | Cada atividade define critérios de aceite; submissão recebe prazo por revisor; comentários de ajuste precisam de resposta e resolução; conclusão aplicável exige material aprovado e critérios verificados. |
| Dados necessários | Critérios, evidência, obrigatoriedade de revisão, prazo do parecer, decisão, pendências e aceite final. |
| Regra de acesso | Coordenador propõe critérios; administrador aprova padrões; revisor decide apenas submissões atribuídas; grupo visualiza o próprio material. |
| Critérios de aceite | Não é possível concluir atividade com critério obrigatório pendente; cada parecer possui prazo; substituição de versão não apaga decisão histórica; divergência entre revisores é escalada. |
| Dependências e efeitos | Requer taxonomia mínima de entregáveis e política para exceções. Pode retardar fechamento se o SLA for irrealista. |
| Teste recomendado | Fechamento bloqueado, revisão dispensada com justificativa, parecer vencido, versão substituída, dois revisores divergentes e isolamento entre grupos. |

### M6 — Registro de riscos e impedimentos — P1

| Elemento | Especificação |
|---|---|
| Objetivo | Antecipar ameaças e dar tratamento verificável a bloqueios. |
| Usuários beneficiados | Coordenação geral e coordenadores. |
| História | **Como coordenador, quero registrar risco ou impedimento com resposta e gatilho, para obter decisão antes que afete o prazo ou a qualidade.** |
| Fluxo esperado | Usuário registra tipo, causa, evento, probabilidade, impacto, resposta, dono e prazo; matriz calcula criticidade; risco materializado pode virar impedimento ou ação. |
| Dados necessários | Probabilidade, impacto em prazo/custo/qualidade, gatilho, resposta, responsável, prazo, estado e decisão requerida. |
| Regra de acesso | Grupo vê seus riscos; administrador vê a carteira completa; informações sensíveis podem ser restritas. |
| Critérios de aceite | Risco alto exige resposta e dono; impedimento exige data de escalonamento; risco vencido entra na central; encerramento exige evidência ou decisão. |
| Dependências e efeitos | Exige escala simples e rito de revisão. Deve evitar duplicação com interfaces. |
| Teste recomendado | Cálculo de criticidade, escopo, materialização, escalonamento, encerramento e distinção de interface. |

### M7 — Escalonamento e repercussão das interfaces no plano — P1

| Elemento | Especificação |
|---|---|
| Objetivo | Converter resolução transversal em alteração efetiva e verificável. |
| Usuários beneficiados | Coordenadores dos grupos envolvidos e coordenação geral. |
| História | **Como coordenador envolvido, quero que o encaminhamento de uma interface gere ações nas seções afetadas, para que a solução pactuada seja incorporada ao estudo.** |
| Fluxo esperado | Interface crítica exige prazo e reunião/decisão; resolução cria ações ou solicitações de mudança nas atividades relacionadas; todos os grupos confirmam incorporação. |
| Dados necessários | Seções e grupos, impacto, decisão, ações derivadas, responsáveis, prazos e confirmações. |
| Regra de acesso | Integrantes dos grupos visualizam; coordenadores gerem; responsável e administrador encerram conforme regra atual. |
| Critérios de aceite | Interface crítica vencida escala automaticamente; encerramento exige solução, ações e confirmação dos grupos; atividades relacionadas exibem o encaminhamento vigente. |
| Dependências e efeitos | Depende da central de ações e de política de mudança de escopo. |
| Teste recomendado | Interface multigrupo, escalonamento, ação derivada, confirmação parcial, encerramento e visibilidade restrita. |

### M8 — Catálogo multicanal de alertas acionáveis — P1

| Elemento | Especificação |
|---|---|
| Objetivo | Alertar somente quando há ação definida, preservando consentimento e evitando ruído. |
| Usuários beneficiados | Todos os perfis vinculados. |
| História | **Como usuário, quero receber alertas relevantes no canal autorizado, para agir sem depender de cobrança manual.** |
| Fluxo esperado | Eventos de prazo, atualização, revisão, interface e risco criam notificações internas; regras selecionam canal, urgência, agrupamento e escalonamento. |
| Dados necessários | Evento, destinatário, canal, consentimento, prioridade, deduplicação, tentativa, entrega, leitura e ação. |
| Regra de acesso | Cada usuário configura canais; administrador configura políticas sem ignorar opt-in. |
| Critérios de aceite | Envio é idempotente; falha aparece em painel; alerta contém ação direta; resumo agrupa eventos não urgentes; evento resolvido não é reenviado. |
| Dependências e efeitos | Requer configuração segura do provedor e transação entre mudança de estado e criação do evento. |
| Teste recomendado | Opt-in, duplicidade, retentativa, falha permanente, agrupamento, escalonamento e isolamento de dados. |

### M9 — Painel analítico de tendência, previsão e qualidade do dado — P2

| Elemento | Especificação |
|---|---|
| Objetivo | Apoiar decisão executiva com causas, tendências e exceções. |
| Usuários beneficiados | Coordenação geral e coordenadores. |
| História | **Como coordenação geral, quero visualizar previsão, capacidade, qualidade e exceções, para decidir onde intervir.** |
| Fluxo esperado | Painel abre pela central de exceções; gráficos mostram tendência de progresso, prazo previsto, idade das pendências, capacidade, revisão e interfaces críticas. |
| Dados necessários | Histórico de progresso, baseline, previsão, horas, SLA, idade, completude e decisões. |
| Regra de acesso | Consolidação ampla para administrador; coordenador vê o próprio grupo e comparativos anonimizados. |
| Critérios de aceite | Cada indicador expõe fórmula e data de atualização; clique leva à lista que explica o número; dado incompleto é sinalizado, não tratado como zero. |
| Dependências e efeitos | Depende de M2–M8 e de histórico suficiente. Não deve ser priorizado antes da qualidade dos dados. |
| Teste recomendado | Fórmulas, filtros, escopo, dado ausente, comparação temporal e navegação para causa. |

### M10 — Auditoria transversal, transações e segurança de upload — P2

| Elemento | Especificação |
|---|---|
| Objetivo | Preservar integridade, autoria e reconstrução das decisões. |
| Usuários beneficiados | Administrador, coordenação geral e suporte técnico. |
| História | **Como administrador, quero reconstruir alterações críticas, para investigar divergências e demonstrar governança.** |
| Fluxo esperado | Mutações críticas gravam antes/depois, autor, justificativa e correlação; operações compostas usam transação; upload valida conteúdo e não apenas extensão. |
| Dados necessários | Entidade, ação, autor, timestamp, valores anteriores e novos, motivo, correlação e resultado. |
| Regra de acesso | Log detalhado restrito ao administrador; usuário pode ver histórico pertinente ao próprio escopo. |
| Critérios de aceite | Mudanças de prazo, responsável, papel, status e configuração ficam auditadas; falha intermediária faz rollback; tipo real do arquivo é validado. |
| Dependências e efeitos | Exige política de retenção e cuidado com dados pessoais. O log deve omitir segredos e conteúdo sensível. |
| Teste recomendado | Rollback, concorrência, mascaramento, autorização do log, arquivo com extensão falsa e carga próxima ao limite. |

### M11 — Visão móvel “minhas ações” — P2

| Elemento | Especificação |
|---|---|
| Objetivo | Reduzir a carga cognitiva dos fluxos de alta frequência em celular. |
| Usuários beneficiados | Coordenadores, participantes e revisores. |
| História | **Como usuário móvel, quero ver primeiro o que exige minha ação, para atualizar o estudo com poucos passos.** |
| Fluxo esperado | A página inicial móvel mostra ações pessoais, filtros rápidos e agrupamentos recolhíveis; listas completas usam carregamento progressivo. |
| Dados necessários | Ações, prioridade, prazo, origem, estado e contexto mínimo. |
| Regra de acesso | Mesma política da central de ações. |
| Critérios de aceite | Nenhum corte horizontal a 390 px; ação prioritária alcançável em até dois toques; foco e leitor de tela preservados; listas não renderizam todos os itens de uma vez. |
| Dependências e efeitos | Depende de M2. Não deve ocultar o acesso à visão integral. |
| Teste recomendado | 390 px, teclado, leitor de tela, 100 itens, filtros e navegação de retorno. |

## H. Indicadores recomendados

| Indicador | Fórmula | Fonte | Periodicidade | Meta inicial | Limiar de alerta | Decisão apoiada |
|---|---|---|---|---|---|---|
| Cobertura de acesso | Integrantes ativos com conta ÷ integrantes ativos × 100 | Equipe e usuários | Diária no go-live; semanal depois | 100% dos coordenadores e ≥90% do total | <100% dos coordenadores após 5 dias | Onboarding e bloqueio de dependências |
| Frescor das atividades | Atividades atualizadas nos últimos 7 dias ÷ atividades abertas × 100 | Histórico de atividades | Semanal | ≥95% | <85% | Cobrança e confiança do painel |
| Aderência à linha de base | Marcos concluídos no prazo ÷ marcos concluídos × 100 | Marcos e baseline | Semanal/mensal | ≥85% | <75% | Replanejamento e intervenção |
| Previsão de atraso | Atividades com data prevista posterior ao compromisso ÷ atividades abertas × 100 | Marcos, dependências e esforço | Semanal | Tendência decrescente | Qualquer seção crítica ou >15% do total | Priorização e redistribuição |
| Desvio de esforço | (Realizado + restante − baseline) ÷ baseline × 100 | Horas e baseline | Semanal | Entre −10% e +10% | >20% | Revisão de escopo ou capacidade |
| Sobrecarga de capacidade | Pessoas com alocação >110% ÷ pessoas alocadas × 100 | Capacidade e alocações | Semanal | 0% sem decisão registrada | Qualquer coordenador >110% por 2 semanas | Redistribuição e suplência |
| Tempo de ciclo da revisão | Média de conclusão − submissão | Submissões e decisões | Semanal | ≤5 dias úteis, a confirmar | >7 dias úteis | Troca de revisor ou escalonamento |
| Resolução de apontamentos | Solicitações resolvidas ÷ solicitações totais × 100 | Comentários | Semanal | ≥90% antes do aceite | <80% ou item vencido | Bloqueio de aceite e ajuste |
| Interfaces críticas vencidas | Interfaces críticas abertas após o prazo | Interfaces | Diária/semanal | 0 | ≥1 | Escalonamento transversal |
| Idade dos impedimentos | Hoje − data de abertura, por criticidade | Riscos/impedimentos | Diária/semanal | Alto ≤3 dias úteis | Alto >3 dias; médio >7 dias | Decisão da coordenação |
| Concentração de carga | Maior parcela de horas por pessoa e grupo | Alocações | Semanal | Nenhuma pessoa >25%, salvo justificativa | >40% | Mitigação de ponto único de falha |
| Confiabilidade dos dados | Registros com campos mínimos e atualização vigente ÷ registros aplicáveis × 100 | Atividades, horas, revisão, interfaces | Semanal | ≥95% | <90% | Limitar uso do indicador e corrigir dados |

As metas são **iniciais** e devem ser confirmadas pela coordenação com base no cronograma contratual, na disponibilidade real e no volume esperado de revisões. Dado ausente não deve ser convertido automaticamente em zero; precisa aparecer como lacuna de qualidade.

## I. Roteiro de implantação

| Horizonte | Alterações | Responsáveis | Dependências | Resultado esperado |
|---|---|---|---|---|
| 0–30 dias | Executar M1; instituir atualização semanal; lançar versão mínima de M2; completar horas iniciais; definir critérios e SLA; cadastrar riscos e interfaces já conhecidos; ativar piloto de alertas internos. | Coordenação geral, administrador e coordenadores | Decisões sobre papéis, frequência, critérios e canais | Plataforma torna-se sistema oficial de registro; dados mínimos passam a sustentar a reunião semanal. |
| 31–60 dias | Implementar M3, M4, M5, M6 e M7; ativar notificações selecionadas; revisar carga e previsão; realizar primeiro ciclo completo de revisão e interface. | Produto, desenvolvimento, PMO e representantes dos grupos | Dados de quatro semanas e políticas aprovadas | Gestão passa de registro de estado para antecipação de capacidade, prazo, qualidade e conflitos. |
| 61–90 dias | Implementar M9, M10 e M11; calibrar indicadores; automatizar escalonamentos; auditar adoção e ajustar processos. | Desenvolvimento, administrador técnico e coordenação geral | Histórico suficiente e regras estabilizadas | Painel confiável, trilha auditável e experiência focada em exceções e decisão. |

O roteiro deve ser executado em incrementos curtos. A coordenação deve recusar funcionalidades analíticas sofisticadas enquanto acesso, completude e atualização permanecerem abaixo do limiar definido.

## J. Decisões requeridas

| Decisão | Opções | Vantagens e riscos | Recomendação | Prazo-limite |
|---|---|---|---|---|
| Fonte oficial da execução | Plataforma como sistema oficial; uso paralelo; sistema apenas informativo | A adoção oficial melhora rastreabilidade; uso paralelo produz divergência. | Declarar a plataforma como registro oficial das atividades, decisões, revisões e interfaces. | Primeira semana |
| Periodicidade de atualização | Diária; semanal; por evento | Semanal reduz carga e mantém frescor; por evento complementa. | Atualização semanal obrigatória e por evento crítico. | Primeira semana |
| Unidade de capacidade | Horas semanais; mensais; apenas total | Semanal oferece antecipação sem granularidade diária excessiva. | Horas semanais, com ausências e esforço restante. | Até o 10º dia |
| Política de aceite | Aceite por seção; por tipo de entrega; decisão ad hoc | Padrões por tipo aumentam consistência; rigidez excessiva pode atrasar. | Critérios mínimos por tipo, complementáveis por atividade. | Até o 10º dia |
| SLA de revisão | Prazo único; por criticidade; sem SLA | Por criticidade equilibra urgência e capacidade. | Definir 3, 5 e 7 dias úteis para alta, média e baixa criticidade, sujeitos a validação. | Antes da primeira submissão |
| Cobertura de revisão | Um revisor; dois em entregas críticas; livre escolha | Dois reduzem viés, mas elevam carga. | Um revisor por padrão e dois para entregas críticas ou transversais. | Antes da primeira submissão |
| Visibilidade entre grupos | Aberta; restrita; agregada com exceções | Restrição protege sensibilidade; abertura facilita integração. | Detalhe restrito ao grupo; agregados e interfaces compartilhados conforme necessidade. | Antes de vincular contas |
| Canal de alerta | Interno; e-mail; WhatsApp; combinação | Multicanal amplia alcance, mas pode gerar ruído e exige consentimento. | Painel como fonte; e-mail/WhatsApp apenas para urgência e opt-in. | Antes do piloto |
| Regra de conclusão | Percentual/status; material; aceite completo | Aceite completo aumenta qualidade, mas requer exceções bem definidas. | Bloquear conclusão quando revisão ou critério obrigatório estiver pendente. | Antes do primeiro encerramento |

## K. Lacunas de informação

| Pergunta | Por que é necessária | Como pode alterar a avaliação ou a prioridade |
|---|---|---|
| Qual é o cronograma contratual detalhado e quais são os marcos externos? | A plataforma contém apenas período e prazos por atividade. | Pode elevar M4 a P0 e redefinir alertas e caminho crítico. |
| Quais entregáveis possuem critérios formais de aceite do BNDES? | Não foram disponibilizados critérios contratuais. | Define a trava de conclusão, tipos de revisão e indicadores de qualidade. |
| Qual é a disponibilidade semanal real de cada integrante? | Horas e capacidade estão vazias. | Confirma ou descarta a hipótese de sobrecarga e concentração. |
| Quais canais de comunicação são permitidos e quais consentimentos existem? | WhatsApp está desativado e depende de opt-in. | Altera M8, cronograma e desenho de privacidade. |
| Quais interfaces já são conhecidas entre as 21 seções? | O módulo está vazio na véspera do início. | Pode demandar workshop imediato e priorizar M7. |
| Quem exerce PMO ou coordenação geral operacional? | O sistema possui administrador e coordenadores, mas não um papel explícito de PMO. | Pode exigir novo perfil, alçada e central de decisões. |
| Como horas realizadas serão obtidas? | Não há fonte definida. | Determina esforço e viabilidade de M3; pode exigir integração ou lançamento simples. |
| Há restrições de confidencialidade entre instituições ou seções? | A segregação existe, mas a política de visibilidade não foi informada. | Pode restringir painéis, interfaces e comparativos. |
| Qual é o volume esperado de arquivos e o tamanho típico? | Upload atual usa base64 e valida extensão.[5] | Define urgência da migração para streaming e varredura de conteúdo. |
| Existem entrevistas ou testes de usabilidade com usuários reais? | A avaliação usou telas e testes técnicos, não observação de uso. | Pode alterar a prioridade de M11 e revelar barreiras de adoção. |

## Estado futuro recomendado

No estado futuro, cada seção possui responsável, suplente, marcos, dependências, capacidade, esforço restante, critérios de aceite, materiais e revisores. Toda exceção relevante — dado desatualizado, sobrecarga, previsão de atraso, parecer vencido, apontamento pendente, interface crítica ou risco alto — aparece em uma central de ações. O administrador enxerga o conjunto; o coordenador enxerga seu grupo; participantes e revisores veem apenas o escopo necessário. Alterações críticas preservam autoria e justificativa, e o painel executivo mostra causas, tendência e decisão requerida, não apenas contagens.

## As três mudanças de maior ganho nos próximos 30 dias

| Mudança | Por que priorizar | Como medir o resultado |
|---|---|---|
| **1. Ativar os usuários e concluir a linha de base mínima por seção** | Sem coordenadores e integrantes operacionais, revisão, horas, interfaces e alertas não produzem gestão. Como o estudo começa imediatamente, essa é uma condição de go-live. | 100% dos coordenadores vinculados em 5 dias; ≥90% dos integrantes em 10 dias; 100% das seções com checklist mínimo e responsável confirmado. |
| **2. Criar a central de ações com frescor, marcos e capacidade inicial** | A coordenação precisa saber onde agir, não apenas ver percentuais. Frescor, próximo marco e esforço restante são o menor conjunto capaz de antecipar desvio. | ≥95% das atividades atualizadas em 7 dias; 100% com próximo marco e esforço restante; toda exceção com dono e prazo. |
| **3. Tornar revisão, aceite e interfaces condições do resultado final** | O maior risco de um estudo com 21 seções é entregar partes pontuais, porém incoerentes ou não aceitas. O fluxo já existe e precisa ser institucionalizado. | 100% das entregas aplicáveis com critérios; 100% das submissões com SLA e parecer; 0 interface crítica vencida sem escalonamento. |

Essas três mudanças devem preceder um painel analítico mais sofisticado. Sem usuários ativos, regras de atualização e dados de execução, qualquer camada adicional de inteligência apenas apresentará com mais elegância uma base ainda incompleta.

## Referências

[1]: ./evidencias-auditoria.md "Fotografia quantitativa do banco e observações visuais"
[2]: ./avaliacao-fluxos.md "Avaliação dos fluxos gerenciais e da qualidade dos dados"
[3]: ./painel-riscos.md "Painel de maturidade, achados e riscos"
[4]: ./pontuacao-maturidade.csv "Pontuação independente das 15 dimensões"
[5]: ./controles-servidor.json "Auditoria dos controles do servidor"
[6]: ./modulos-plataforma.json "Auditoria dos módulos da plataforma"
[7]: ./prompt-aplicado.md "Prompt de auditoria aplicado"
