# Passos exatos para disponibilizar o Portal Naval ao primeiro grupo de testadores

> **URL atual do portal:** `https://gestaobndes-xppnpsup.manus.space`
>
> **Regra de publicação:** neste projeto, cada checkpoint validado é publicado automaticamente. Portanto, não há uma etapa separada de deploy após salvar a versão.

## Etapa 1 — Definir a versão de teste

1. Abra a gestão do projeto e verifique a versão mais recente validada.
2. Antes de convidar testadores, confirme que os recursos incluídos na rodada estão testados. Para a rodada funcional já consolidada, use a versão que contém cronograma mestre, interfaces críticas, campo e divulgação.
3. Não inclua em teste funcional recursos que ainda estejam em configuração externa, como o envio real de WhatsApp ou a sincronização manual OAuth do Google Drive.
4. Caso exista qualquer ajuste pendente no ambiente de desenvolvimento, conclua os testes, salve um novo checkpoint e utilize a URL publicada após essa publicação automática.

## Etapa 2 — Preparar os acessos

O portal usa autenticação. Cada testador precisa acessar a URL uma primeira vez e concluir o login. Após esse primeiro acesso, o administrador poderá associar a conta autenticada ao integrante correspondente na equipe.

| Ordem | Ação do administrador | Resultado esperado |
|---:|---|---|
| 1 | Enviar a URL do portal ao testador. | O testador abre o portal e realiza o primeiro login. |
| 2 | Abrir **Equipe** e localizar o integrante. | O cadastro do integrante aparece no grupo correto. |
| 3 | Editar o integrante e vincular a **conta de acesso** que surgiu após o primeiro login. | A identidade autenticada fica associada ao membro da equipe. |
| 4 | Conferir o papel do grupo: `coordenador` ou `participante`. | As permissões de execução respeitam a composição do grupo. |
| 5 | Em **Administração**, conferir o perfil da conta: `administrador` ou `colaborador`. | O perfil institucional e o papel do grupo permanecem coerentes. |
| 6 | Para coordenadores, confirmar que possuem atividades atribuídas. | Eles podem definir período, marcos, responsáveis delegados e revisores das próprias atividades. |

> Recomenda-se iniciar com **um administrador, dois coordenadores e três a cinco participantes** distribuídos em grupos distintos. Isso cobre os principais limites de permissão sem abrir o teste para toda a equipe.

## Etapa 3 — Informar o grupo de teste

Envie uma mensagem de abertura contendo a URL, o período de teste, o escopo e um canal de retorno. Um texto sugerido é:

> Prezado(a), o Portal Naval está disponível para uma rodada controlada de testes. Acesse `https://gestaobndes-xppnpsup.manus.space`, conclua o login e informe ao administrador caso sua conta não esteja vinculada ao seu cadastro de equipe. Nesta rodada, teste apenas os módulos e cenários indicados no roteiro recebido. Registre qualquer ocorrência com página, item, horário e captura de tela.

## Etapa 4 — Executar o roteiro de aceite

| Perfil | Cenários mínimos | Critério de aceite |
|---|---|---|
| Administrador | Painel, Equipe, Atividades, Cronograma, Interfaces, Campo e Biblioteca. | Visualiza todos os módulos e consegue administrar os dados autorizados. |
| Coordenador | Definir início e marcos, delegar responsabilidade, atribuir revisores e editar interface do próprio grupo. | Alterações são persistidas e não alcançam grupo não envolvido. |
| Participante delegado | Consultar a atividade delegada, a ficha, o material e o cronograma. | Não consegue alterar períodos, responsáveis ou revisores. |
| Colaborador | Consultar Biblioteca e Produção conforme seus vínculos. | Não visualiza áreas administrativas nem atividades sem delegação. |

O grupo também deve testar a busca da Biblioteca, a paginação, os filtros do cronograma, a exportação em PNG/PDF e a agenda em celular. A exportação deve refletir exatamente os filtros aplicados.

## Etapa 5 — Coletar e classificar retornos

Para cada ocorrência, registrar: perfil utilizado, URL da página, item ou interface afetado, ação executada, resultado esperado, resultado observado, horário e captura de tela. Classifique o retorno como `bloqueador`, `erro funcional`, `inconsistência de dados`, `melhoria de usabilidade` ou `dúvida`.

Bloqueadores devem ser corrigidos antes da ampliação da rodada. Melhorias de usabilidade podem ser agrupadas e priorizadas para a próxima versão.

## Etapa 6 — Encerrar ou ampliar a rodada

1. Revise os retornos com os coordenadores.
2. Corrija bloqueadores e salve uma nova versão validada; ela será publicada automaticamente.
3. Repita o roteiro com o mesmo grupo para confirmar as correções.
4. Amplie o acesso somente quando não houver bloqueadores abertos e os perfis estiverem vinculados corretamente.

## Plano de reversão

Se uma versão nova introduzir problema crítico, abra o histórico de versões no painel de gestão e restaure o último checkpoint validado. Como a publicação acompanha o checkpoint, a restauração recupera a versão anterior do portal.
