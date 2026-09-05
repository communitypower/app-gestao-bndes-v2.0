# Portal Naval — Funcionalidades Prontas para Teste da Equipe

> **Base de teste:** versão consolidada do portal com as 29 frentes oficiais, 36 itens de execução, cronograma mestre, interfaces, campo e divulgação. A integração efetiva de WhatsApp e a sincronização manual direta do Google Drive permanecem desativadas, aguardando fase posterior.

## 1. Perfis e acesso

| Perfil | Funcionalidades para testar | Limites esperados |
|---|---|---|
| **Administrador** | Acesso integral, gestão de equipe, atividades, períodos, marcos, revisores, interfaces, campo, Biblioteca e Administração. | Pode configurar parâmetros, mas não deve haver envio de WhatsApp enquanto a integração estiver desativada. |
| **Coordenador** | Atividades sob sua coordenação, distribuição de execução, datas, marcos, revisores, materiais e interfaces de seu grupo. | Não deve alterar atividades ou interfaces de grupos não envolvidos. |
| **Integrante delegado** | Consulta das atividades em que recebeu responsabilidade de execução. | Não deve alterar a distribuição, revisores, datas ou dados administrativos. |
| **Colaborador** | Biblioteca e Produção, conforme vínculo de grupo e revisão. | Não deve acessar módulos administrativos nem atividades sem delegação. |

## 2. Planejamento e execução

| Módulo | Funcionalidades prontas | Roteiro de teste sugerido |
|---|---|---|
| **Visão geral** | Indicadores, 29 frentes oficiais, 36 itens de execução, prazos, progresso e interfaces abertas. | Conferir se os totais e os itens por Tomo refletem o plano de trabalho. |
| **Atividades** | Tabela operacional, filtros, fichas completas, descrição oficial, notas operacionais, entregas, dependências e critérios de aceite. | Buscar um item por código, abrir sua ficha e conferir os metadados do plano. |
| **Responsabilidades** | Coordenador responsável, liderança de execução, responsabilidades delegadas, escopo e horas por integrante. | Como coordenador, distribuir a execução a participantes do grupo e verificar a consulta pelo delegado. |
| **Cronograma mestre** | Escala mensal M1–M6, início/término, marcos, entregáveis por mês, alertas de atraso, prazo próximo e sobreposição. | Definir início e marcos de um item; conferir a barra temporal, a agenda móvel e os alertas. |
| **Exportação do cronograma** | Exportação da visualização filtrada em PNG e PDF. | Aplicar filtros e conferir se cabeçalho, período, legenda e itens filtrados aparecem no arquivo exportado. |

## 3. Coordenação técnica e produção

| Módulo | Funcionalidades prontas | Roteiro de teste sugerido |
|---|---|---|
| **Equipe** | Nove grupos, coordenadores, participantes, escopo detalhado e contas vinculáveis. | Confirmar integrantes, coordenação e itens atribuídos a cada grupo. |
| **Interfaces** | Cinco interfaces críticas importadas, prioridades, grupos, seções e 44 vínculos com itens específicos do plano. | Abrir uma interface, validar os itens vinculados, registrar comentário e encaminhamento. |
| **Produção e revisão** | Materiais, versões, submissão formal, revisores, comentários, solicitações de ajuste e pareceres. | Submeter uma versão, atribuir revisor, registrar comentário e concluir uma decisão. |
| **Campo e divulgação** | Nove atividades: visitas a estaleiros no Brasil, China, Índia e Coreia do Sul; coleta de fontes, entrevistas, apresentações e audiências públicas. | Conferir os tipos de atividade e, como administrador/coordenador, testar cadastro, edição e status. |

## 4. Acervo e administração

| Módulo | Funcionalidades prontas | Roteiro de teste sugerido |
|---|---|---|
| **Biblioteca** | 331 referências, incluindo 328 documentos únicos do Drive, busca, filtros por seção/tema e paginação. | Buscar por tema, aplicar filtro de seção, abrir documentos e confirmar paginação. |
| **Administração** | Perfis, configuração de alertas, histórico de notificações e controles de agenda. | Conferir a separação de permissões; manter WhatsApp desativado nesta fase. |

## 5. Itens propositalmente pendentes

A seguir estão recursos visíveis ou preparados, mas **não devem ser usados como produção nesta fase**:

| Recurso | Situação atual |
|---|---|
| **Envio de WhatsApp** | Código e três eventos estão preparados, porém credenciais Meta, número de envio e consentimentos da equipe ainda não foram configurados. |
| **Sincronização manual do Google Drive pelo botão da Biblioteca** | Depende de autorização OAuth válida da conta Google; a reconciliação continua sendo conduzida de forma controlada até a próxima fase. |
| **Datas iniciais e marcos reais** | O portal suporta o registro, mas os dados atuais não foram inferidos automaticamente. Coordenadores devem informar datas e marcos validados. |

## 6. Como registrar o teste

Para cada teste, registrar o perfil utilizado, módulo, item ou interface testada, ação executada, resultado observado e evidência. Erros devem informar a página, o horário, o item afetado e uma captura de tela quando possível.
