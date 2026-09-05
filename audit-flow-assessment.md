# Avaliação dos fluxos gerenciais e da qualidade dos dados

## Fluxos ponta a ponta

| Fluxo | Perfis envolvidos | Funcionamento comprovado | Resultado gerencial atual | Lacuna principal |
|---|---|---|---|---|
| Configurar projeto e governança | Administrador | Define período, equipe, grupos, papéis, contas, integração de alertas e rotina de prazo. | Há uma estrutura organizacional clara, com 9 grupos e 9 coordenadores. | Não há marcos, alçadas de decisão, registro de decisões nem auditoria completa das alterações administrativas. |
| Planejar e acompanhar atividades | Administrador; coordenador responsável | Administrador cria e edita; coordenador consulta suas atividades e administra horas e revisores; calendário e painel refletem status, progresso e prazo. | As 21 seções possuem atividade, responsável, prazo e status. | Não há prioridade, critério de aceite, dependências entre atividades, esforço restante, linha de base ou decomposição em entregas intermediárias. |
| Planejar capacidade | Administrador; coordenador responsável | Horas podem ser distribuídas entre participantes do grupo. | A plataforma possui estrutura para comprometer esforço nominal. | Não existe disponibilidade por período, horas realizadas, saldo ou alerta de sobrecarga; no estado atual, nenhuma hora foi alocada. |
| Produzir e versionar materiais | Administrador; coordenador; grupo responsável | Material pode ser vinculado à atividade, receber versões e ficar visível ao grupo. | Preserva versões e relaciona produção à seção e atividade. | Não há critérios de aceite, modelo de conteúdo, comparação entre versões ou evidência de adoção; nenhum material foi cadastrado. |
| Submeter e revisar | Coordenador responsável; revisores apontados | Coordenador aloca revisores e submete versão; revisores comentam, solicitam ajustes e registram parecer; decisões ficam associadas à submissão. | O fluxo formal de qualidade e segregação de papéis está bem desenhado. | Não há prazo de aceite ou parecer, escalonamento, carga do revisor, tempo de ciclo ou cobertura mínima; não existem revisores ou submissões no estado atual. |
| Gerir interfaces entre seções | Administrador; coordenadores e integrantes dos grupos envolvidos | Registra tipo, prioridade, grupos, seções, responsável, prazo, discussão, histórico e solução pactuada. | Oferece rastreabilidade para dependências e sobreposições transversais. | A solução não altera automaticamente planejamento ou escopo; faltam alertas e indicadores de idade; nenhuma interface foi registrada. |
| Antecipar desvios de prazo | Administrador; coordenadores | Painel e calendário mostram datas, status, próximas entregas e atraso; motor de WhatsApp prevê atribuição, aviso de 3 dias e atraso. | Há visibilidade de vencimentos e uma base de automação resiliente. | O alerta opera apenas sobre prazo final, não sobre marcos, revisão, impedimentos ou interfaces; WhatsApp e rotina estão desativados. |
| Apoiar decisão executiva | Administrador | Painel consolida progresso, atividades em andamento, atrasos, equipe, cronograma, próximas entregas e interfaces por seção. | Permite leitura rápida do estado cadastrado. | Não mostra tendência, previsão, causa, capacidade, qualidade, confiança do dado, decisões pendentes ou exceções acionáveis. |
| Organizar referências | Administrador e colaboradores autorizados | Biblioteca recebe arquivos e links, com busca e filtros por tema e seção. | Estrutura uma base de conhecimento ligada ao escopo. | Não há aprovação, versão ou indicador de cobertura por seção; o acervo está vazio. |

## Fluxos por perfil

| Perfil | Capacidades previstas | Situação operacional observada | Risco gerencial |
|---|---|---|---|
| Administrador | Visão integral, cadastro e edição de atividades, equipe, perfis, configurações, alertas e intervenção nos demais fluxos. | É o único perfil autenticado no ambiente. | Centralização excessiva e risco de a plataforma funcionar como cadastro mantido por uma única pessoa. |
| Coordenador | Acessa as próprias atividades, distribui horas do grupo, indica revisores, submete materiais e gere interfaces dos grupos envolvidos. | Há 9 coordenadores cadastrados, mas nenhum está vinculado a conta. | O principal mecanismo de responsabilização não pode ser exercido diretamente. |
| Participante | Visualiza materiais do próprio grupo e interfaces do grupo; contribui conforme permissões do fluxo. | Existem 21 participantes, porém nenhum possui conta vinculada. | Produção e comunicação continuam fora da plataforma; baixa tempestividade e rastreabilidade. |
| Revisor | Quando apontado, acessa a submissão, comenta e registra parecer individual. | Não há revisor alocado nem conta vinculada. | A qualidade formal prevista ainda não produz controle efetivo sobre as entregas. |

## Qualidade dos dados

| Critério | Avaliação | Evidência | Consequência |
|---|---|---|---|
| Completude estrutural | Parcialmente boa | Todas as 21 atividades têm título, descrição, seção, responsável, prazo, status e progresso; o esquema exige esses campos. | A ficha básica existe, mas não representa o trabalho restante ou os critérios de conclusão. |
| Completude operacional | Crítica | 0 contas vinculadas entre 30 integrantes, 0 horas, 0 revisores, 0 materiais, 0 interfaces e 0 notificações. | Os indicadores não conseguem explicar capacidade, qualidade, coordenação transversal ou risco real. |
| Consistência | Boa no desenho, ainda pouco testada no uso | Regras de servidor exigem coordenadores ativos, membros elegíveis, revisores apontados e solução antes do fechamento de interface. | Reduz erros de cadastro, mas o baixo volume operacional impede observar exceções reais. |
| Atualidade | Não mensurável | Não existe indicador de última atualização por atividade no painel nem histórico de mudanças de progresso. | A coordenação não sabe se um valor de progresso continua confiável. |
| Auditabilidade | Parcial | Há autoria em materiais, versões, comentários, pareceres, interfaces e notificações; atividades e mutações administrativas não possuem trilha completa. | Decisões e alterações de prazo, responsável, progresso ou papel podem ser difíceis de reconstruir. |
| Confiabilidade técnica | Boa | 58 testes passaram; TypeScript e build de produção foram concluídos sem erros. | A base técnica reduz regressões conhecidas, mas não substitui testes de uso real nem controles transacionais em operações compostas. |

## Conclusão desta etapa

O principal contraste é entre **capacidade funcional** e **maturidade operacional**. A plataforma já contém fluxos relevantes para responsabilidade, revisão e coordenação transversal, mas a gestão ainda não se beneficia deles porque os atores não estão habilitados e os dados operacionais não foram iniciados. Portanto, as primeiras melhorias não devem adicionar complexidade indiscriminadamente: devem ativar o ciclo real, exigir um conjunto mínimo de dados úteis e transformar exceções em ações com dono e prazo.
