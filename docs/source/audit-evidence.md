# Evidências da auditoria gerencial

## Fotografia do banco em 31 de julho de 2026

| Domínio | Evidência observada |
|---|---|
| Projeto | “Diagnósticos e Políticas Públicas — Indústria Naval”, período cadastrado de agosto de 2026 a janeiro de 2027, fuso `America/Sao_Paulo`. |
| Escopo | 21 seções técnicas cadastradas. |
| Acesso | 1 usuário autenticado, administrador; nenhum colaborador autenticado. |
| Equipe | 9 grupos, 30 integrantes ativos e 9 coordenadores; nenhum integrante vinculado a uma conta de usuário. |
| Atividades | 21 atividades: 3 em andamento, 18 pendentes, nenhuma concluída ou atrasada; progresso médio de 5%; nenhuma descrição vazia. |
| Capacidade | Nenhuma alocação de horas, nenhuma atividade com horas e nenhuma pessoa alocada. |
| Produção | Nenhum material, revisão ou vínculo de material com atividade. |
| Revisão | Nenhum revisor alocado, submissão, comentário, parecer ou decisão. |
| Interfaces | Nenhuma interface, vínculo entre seção/grupo, discussão ou evento auditável. |
| Biblioteca | A tela informa acervo em construção e nenhum item cadastrado. |
| Alertas | WhatsApp desabilitado, credenciais pendentes, rotina automática não ativada e nenhum registro de notificação. |

## Observações das páginas em desktop

| Página | Evidência visual | Implicação gerencial inicial |
|---|---|---|
| Visão geral | Exibe progresso geral de 5%, 3 atividades em andamento, 18 pendentes, 0 atrasadas e 30 integrantes. Mostra cronograma mestre, próximas entregas e interfaces abertas por seção. | Boa visão sintética, porém os indicadores ainda refletem sobretudo dados iniciais; não há tendências, capacidade, riscos, revisões ou qualidade dos dados. |
| Atividades | Lista as 21 atividades com seção, status, coordenador, grupo, entrega, horas e revisores. Todas exibem 0h e 0 revisores; as descrições visíveis têm padrão genérico semelhante. | Há responsabilização nominal e rastreabilidade básica, mas não existe ainda decomposição do trabalho, dependências, critérios de aceite, prioridade, risco ou esforço restante. |
| Calendário | Agenda mensal clara; quatro entregas aparecem concentradas em 25 de agosto. | Permite enxergar datas, mas não evidencia colisões de capacidade, dependências ou marcos intermediários. |
| Equipe | Hierarquia de 9 grupos e coordenadores está clara; vários grupos não têm participantes listados. | A estrutura organizacional está cadastrada, mas ausência de contas vinculadas e de horas impede operação distribuída e análise de capacidade. |
| Produção | Área formal de materiais e revisão está vazia. | O fluxo existe na plataforma, porém ainda não há evidência de adoção, versionamento, revisão ou qualidade das entregas. |
| Interfaces | Formulário, filtros e fluxo de resolução existem; nenhuma interface cadastrada. | O mecanismo de coordenação transversal existe, mas não há evidência de identificação antecipada de dependências ou sobreposições. |
| Biblioteca | Busca e filtros existem; nenhum item cadastrado. | O acervo não sustenta ainda a elaboração das seções nem permite avaliar cobertura de referências. |
| Administração | Mostra 1 perfil, credenciais de WhatsApp pendentes, rotina automática aguardando ativação e nenhum histórico de notificação. | O controle administrativo existe, mas alertas e operação multiusuário ainda não estão ativos. |

## Observações das páginas em celular

| Página | Evidência visual | Implicação gerencial inicial |
|---|---|---|
| Visão geral | Os indicadores, cronograma, entregas e atalhos são reorganizados em coluna sem corte horizontal. O cronograma de 21 seções fica longo e exige bastante rolagem. | A informação permanece acessível, mas a priorização móvel pode ser melhorada com filtros de exceção e resumo recolhível. |
| Atividades | As 21 atividades são apresentadas em sequência, com comandos preservados, porém a listagem integral forma uma página muito longa. | A operação é possível em celular, mas faltam agrupamento, paginação ou visão “somente o que exige ação” para reduzir carga cognitiva. |
| Produção | Título, ação de novo material, filtro e estado vazio permanecem legíveis e sem transbordamento. | O fluxo vazio é claro; a usabilidade com múltiplos materiais e comentários ainda não pôde ser observada por ausência de dados. |
| Interfaces | Busca, filtros, ação de criação e estado vazio se reorganizam em coluna e permanecem legíveis. | O fluxo é responsivo; a legibilidade de discussões e histórico com volume real ainda não pôde ser validada. |

## Observações do modelo de dados

O modelo oferece estruturas para seções, grupos, integrantes, atividades, horas, revisores, materiais, versões, submissões, pareceres, comentários, interfaces, eventos e notificações. Entretanto, não há entidades explícitas para marcos, dependências entre atividades, riscos, impedimentos, decisões gerenciais, critérios de aceite, capacidade disponível por período, estimativa de esforço restante, linha de base ou histórico de progresso. Essas ausências limitam a prevenção de desvios e a análise causal.

## Limitações da evidência

A auditoria utiliza o estado atual do ambiente de desenvolvimento e dados iniciais. Não foram disponibilizados cronograma contratual detalhado, marcos formais, critérios de aceite, disponibilidade semanal da equipe, orçamento, atas de decisão ou histórico real de execução. Conclusões sobre comportamento dos usuários e efetividade operacional devem, portanto, ser tratadas como hipóteses de confiança baixa até que o sistema seja usado por coordenadores, participantes e revisores reais.
