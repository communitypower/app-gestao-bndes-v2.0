# Prompt para avaliar e melhorar a plataforma de gestão da execução do Estudo BNDES

## Prompt pronto para uso

> Atue como um **especialista sênior em gestão de projetos complexos, PMO, governança, transformação digital e desenho de sistemas de informação gerencial**. Avalie criticamente a plataforma desenvolvida para apoiar a execução do **Estudo BNDES — Indústria Naval** e proponha melhorias concretas que aumentem a capacidade de planejar, coordenar, acompanhar, revisar e concluir o estudo com qualidade.
>
> A avaliação deve considerar simultaneamente dois objetos: **a qualidade da gestão da execução do estudo** e **a capacidade da plataforma de sustentar essa gestão**. Não se limite a avaliar aparência, arquitetura técnica ou quantidade de funcionalidades. Verifique se os recursos existentes produzem clareza de responsabilidades, antecipação de riscos, decisões tempestivas, equilíbrio de carga, integração entre seções e qualidade das entregas.
>
> ## 1. Contexto
>
> O estudo está organizado em **21 seções técnicas**, executadas por grupos multidisciplinares. Cada grupo possui um coordenador e participantes. As atividades têm responsáveis, prazos, progresso e horas alocadas. Coordenadores podem disponibilizar materiais em desenvolvimento, indicar revisores, receber comentários e registrar ajustes. Há interfaces, dependências e possíveis sobreposições de escopo entre seções e grupos.
>
> A plataforma contempla, ou poderá contemplar, painel executivo, atividades, calendário, equipe, biblioteca, produção de materiais, revisões, comentários, notificações, interfaces entre grupos e administração de usuários e permissões.
>
> Os perfis principais são **administrador, coordenador, participante e revisor**. Preserve a segregação de acesso e considere que informações consolidadas de outros grupos podem ser sensíveis.
>
> ## 2. Objetivo da avaliação
>
> Determine se a plataforma permite que a coordenação geral responda, com dados confiáveis, às seguintes perguntas:
>
> 1. O estudo está no prazo e quais entregas ameaçam os marcos principais?
> 2. Quem é responsável por cada resultado, pendência, revisão, decisão e interface?
> 3. A capacidade disponível é compatível com o trabalho restante?
> 4. Quais grupos, pessoas ou revisores estão sobrecarregados ou constituem pontos únicos de falha?
> 5. Quais materiais estão prontos, em revisão, aguardando ajustes ou bloqueados?
> 6. Quais interfaces entre seções podem gerar incoerência, lacuna ou duplicidade no produto final?
> 7. Quais riscos exigem decisão da coordenação e até quando?
> 8. A plataforma induz registros completos, tempestivos e úteis ou apenas armazena informações?
> 9. Quais alterações na plataforma produzirão maior ganho gerencial com menor esforço e risco?
>
> ## 3. Fontes de evidência
>
> Utilize somente evidências observáveis nas fontes disponibilizadas. Caso alguma fonte não esteja disponível, declare a limitação e não invente informações.
>
> | Fonte | Evidências esperadas |
> |---|---|
> | Interface e fluxos | Páginas, formulários, filtros, alertas, ações por perfil, estados vazios e navegação |
> | Modelo de dados | Entidades, vínculos, campos obrigatórios, histórico, rastreabilidade e integridade |
> | Regras de acesso | Permissões de administrador, coordenador, participante e revisor |
> | Atividades | Responsáveis, seções, status, prazos, progresso, horas e dependências |
> | Equipe | Grupos, funções, vínculos, disponibilidade e distribuição da carga |
> | Produção e revisão | Versões, submissões, revisores, comentários, pareceres e pendências |
> | Interfaces | Seções e grupos envolvidos, prioridade, prazo, responsável, encaminhamentos e resolução |
> | Painéis e relatórios | Indicadores, tendências, exceções, comparações e apoio à decisão |
> | Testes e registros | Cobertura das regras críticas, erros, falhas recorrentes e problemas de usabilidade |
> | Documentação do projeto | Objetivos, marcos, restrições, critérios de aceite e decisões anteriores |
>
> ## 4. Princípios obrigatórios
>
> Baseie cada conclusão em evidências. Diferencie explicitamente **fato observado, inferência fundamentada, hipótese e lacuna de informação**. Não presuma que uma funcionalidade existe apenas porque seria desejável.
>
> Avalie a gestão ponta a ponta, e não cada página isoladamente. Siga os fluxos reais de administrador, coordenador, participante e revisor, desde o planejamento da atividade até a conclusão, revisão e integração ao resultado final.
>
> Identifique causas, não apenas sintomas. Um atraso pode resultar de escopo indefinido, carga incompatível, dependência não registrada, revisão tardia, ausência de decisão ou interface não resolvida. Classifique cada achado como **problema de processo, governança, dados, permissão, experiência do usuário, regra de negócio, automação ou arquitetura**.
>
> Evite recomendar burocracia sem benefício mensurável. Toda alteração deve resolver um problema identificado, indicar quem será beneficiado, apresentar esforço aproximado e definir como o resultado será verificado.
>
> ## 5. Dimensões de avaliação
>
> Atribua uma nota de **0 a 5** para cada dimensão. Use 0 para ausência de controle ou situação crítica; 1 para controle informal e insuficiente; 2 para controle parcial e reativo; 3 para processo definido, mas inconsistente; 4 para processo confiável e mensurável; e 5 para processo integrado, preventivo e orientado a resultados.
>
> | Dimensão | Perguntas de avaliação |
> |---|---|
> | Governança | Papéis, alçadas e responsáveis estão claros? As decisões têm dono, prazo e registro? |
> | Planejamento | Existem marcos, prioridades, sequência lógica, dependências e visão do trabalho restante? |
> | Controle de prazo | A plataforma antecipa desvios ou apenas registra atrasos consumados? |
> | Capacidade e horas | Há visão de capacidade, comprometimento, desvio de horas e sobrecarga por pessoa e grupo? |
> | Qualidade das entregas | Há critérios de aceite, versões, revisão, parecer e fechamento verificável? |
> | Revisão por pares | Revisores são adequadamente alocados? Há prazo, pendências, resposta e decisão sobre os apontamentos? |
> | Interfaces entre seções | Sobreposições e dependências são identificadas, discutidas, encaminhadas e resolvidas? |
> | Riscos e impedimentos | Riscos possuem probabilidade, impacto, responsável, resposta e sinais de alerta? |
> | Comunicação | A plataforma reduz reuniões improdutivas e transforma discussões em ações verificáveis? |
> | Informação gerencial | Os painéis mostram causas, tendências e exceções ou apenas contagens estáticas? |
> | Qualidade dos dados | Há completude, consistência, atualização, histórico e fonte verificável? |
> | Experiência e acessibilidade | Os fluxos são claros, responsivos, acessíveis e adequados à frequência de uso? |
> | Automação e alertas | Notificações são relevantes, acionáveis, não redundantes e vinculadas a prazos ou riscos? |
> | Segurança e segregação | Cada perfil acessa somente os dados e ações necessários? |
> | Orientação ao resultado final | A plataforma favorece coerência entre as 21 seções e qualidade do estudo consolidado? |
>
> ## 6. Procedimento de análise
>
> Primeiro, descreva o funcionamento atual da plataforma em uma visão **as is**, identificando os principais fluxos, perfis e dados utilizados. Em seguida, percorra cada dimensão de avaliação e registre a nota, as evidências, o impacto e o nível de confiança.
>
> Depois, trace os problemas até suas causas prováveis. Relacione funcionalidades, processos e comportamentos. Por exemplo, verifique se um painel pouco útil decorre da ausência de dados, de registros não obrigatórios, de métricas mal definidas ou apenas da apresentação visual.
>
> Avalie também as conexões entre os módulos. Confirme se alterações em atividades atualizam calendário, carga, revisão, interfaces, alertas e indicadores; se comentários geram pendências gerenciáveis; se interfaces aparecem nas fichas das seções; e se decisões registradas influenciam o acompanhamento executivo.
>
> Por fim, formule um estado futuro **to be** e proponha a menor sequência de alterações capaz de produzir melhoria gerencial relevante.
>
> ## 7. Estrutura obrigatória da resposta
>
> ### A. Resumo executivo
>
> Apresente, em até doze linhas, a maturidade geral da plataforma para gerir a execução do estudo, os três principais pontos fortes, os três principais problemas e a mudança mais urgente.
>
> ### B. Visão atual da plataforma
>
> | Fluxo | Usuários | Como funciona atualmente | Resultado gerencial | Lacuna principal |
> |---|---|---|---|---|
> | [FLUXO] | [PERFIS] | [FUNCIONAMENTO] | [RESULTADO] | [LACUNA] |
>
> ### C. Painel de maturidade
>
> | Dimensão | Nota de 0 a 5 | Evidência | Impacto | Confiança |
> |---|---:|---|---|---|
> | [DIMENSÃO] | [NOTA] | [EVIDÊNCIA OBSERVÁVEL] | [IMPACTO] | Alta, média ou baixa |
>
> Calcule uma nota geral, mas destaque separadamente toda dimensão com nota 0, 1 ou 2. Não permita que a média esconda uma fragilidade crítica.
>
> ### D. Achados e causas
>
> | ID | Achado | Evidência | Causa raiz provável | Tipo | Consequência | Perfis ou módulos afetados |
> |---|---|---|---|---|---|---|
> | A1 | [ACHADO] | [EVIDÊNCIA] | [CAUSA] | [CLASSIFICAÇÃO] | [CONSEQUÊNCIA] | [ESCOPO] |
>
> ### E. Riscos gerenciais
>
> | Risco | Probabilidade | Impacto | Sinal de alerta | Resposta recomendada | Responsável sugerido |
> |---|---|---|---|---|---|
> | [RISCO] | Baixa, média ou alta | Baixo, médio ou alto | [INDICADOR] | [RESPOSTA] | [PAPEL] |
>
> ### F. Melhorias priorizadas
>
> | ID | Alteração proposta | Problema resolvido | Impacto | Esforço | Risco de implantação | Prioridade | Indicador de sucesso |
> |---|---|---|---|---|---|---|---|
> | M1 | [ALTERAÇÃO] | [PROBLEMA] | Alto, médio ou baixo | Alto, médio ou baixo | Alto, médio ou baixo | P0, P1, P2 ou P3 | [MÉTRICA] |
>
> Classifique como **P0** a correção imediata que evita dano grave; **P1** a alteração essencial ao ciclo atual; **P2** a melhoria importante do próximo ciclo; e **P3** o aperfeiçoamento desejável.
>
> ### G. Especificação funcional das alterações
>
> Para cada melhoria P0, P1 e P2, apresente: objetivo; usuário beneficiado; história do usuário; fluxo esperado; dados necessários; regra de acesso; critérios de aceite verificáveis; dependências; possíveis efeitos colaterais; e teste recomendado.
>
> Escreva histórias no formato: **“Como [perfil], quero [capacidade], para [resultado gerencial]”.** Os critérios de aceite devem ser observáveis e não podem usar expressões vagas como “funcionar corretamente”.
>
> ### H. Indicadores recomendados
>
> Recomende entre oito e doze indicadores que apoiem decisões reais. Para cada indicador, informe fórmula, fonte de dados, periodicidade, meta inicial, limiar de alerta e decisão apoiada. Considere, quando aplicável, aderência a prazos, idade das pendências, tempo médio de revisão, taxa de comentários resolvidos, interfaces críticas abertas, desvio de horas, concentração de carga, retrabalho, cumprimento de marcos e confiabilidade dos dados.
>
> ### I. Roteiro de implantação
>
> | Horizonte | Alterações | Responsáveis | Dependências | Resultado esperado |
> |---|---|---|---|---|
> | 0–30 dias | [AÇÕES] | [PAPÉIS] | [DEPENDÊNCIAS] | [RESULTADO] |
> | 31–60 dias | [AÇÕES] | [PAPÉIS] | [DEPENDÊNCIAS] | [RESULTADO] |
> | 61–90 dias | [AÇÕES] | [PAPÉIS] | [DEPENDÊNCIAS] | [RESULTADO] |
>
> ### J. Decisões requeridas
>
> Liste as decisões que a coordenação do estudo precisa tomar. Para cada decisão, apresente opções, vantagens, riscos, recomendação e prazo-limite.
>
> ### K. Lacunas de informação
>
> Encerre com perguntas bloqueadoras e complementares. Explique como cada resposta poderá alterar a avaliação ou a prioridade das melhorias.
>
> ## 8. Regras finais
>
> Não confunda maior quantidade de funcionalidades com melhor gestão. Prefira mecanismos simples que gerem responsabilidade, visibilidade, prevenção e decisão.
>
> Não proponha recursos desconectados dos fluxos existentes. Indique quais páginas, dados, permissões, procedimentos do servidor e testes seriam afetados por cada alteração.
>
> Não use dados fictícios para preencher lacunas. Quando não houver evidência suficiente, atribua confiança baixa e solicite a informação necessária.
>
> Ao final, responda de forma direta: **quais três mudanças na plataforma produziriam o maior ganho para a gestão da execução do Estudo BNDES nos próximos 30 dias, por que devem ser priorizadas e como seu resultado será medido?**

## Dados a anexar ao executar o prompt

Para obter uma avaliação mais precisa, anexe ou disponibilize o código da plataforma, o modelo de dados, as telas principais, o arquivo de acompanhamento do desenvolvimento, os testes, os registros recentes de erros e uma exportação atual de atividades, equipe, horas, revisões e interfaces. Caso existam, inclua também cronograma oficial, marcos contratuais e critérios de aceite do estudo.
