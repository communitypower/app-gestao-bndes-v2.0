# Cronograma de itens

## Objetivo

O cronograma apresenta os **36 itens de execução** em escala mensal, complementando o calendário anterior de entregas. Cada linha relaciona o item do plano, grupo, coordenador, estado, progresso e período de execução.

## Período de cada item

| Campo | Uso |
|---|---|
| Data inicial | Opcional. Quando definida, o item é exibido como barra de período no cronograma. |
| Data de término | Obrigatória. Corresponde ao prazo de entrega já utilizado pelo portal. |
| Sem data inicial | O cronograma mostra um marco na data de término e o texto “início a definir”. |

Os 36 itens existentes preservam seus prazos de término e iniciam sem data inicial definida. Essa decisão evita inferir ou fabricar cronogramas. Os períodos devem ser definidos pelo administrador ou pelo coordenador responsável diretamente no cronograma ou no editor da atividade.

## Acesso e uso

| Perfil | Visualização | Atualização do período |
|---|---:|---:|
| Administrador | Todos os itens | Todos os itens |
| Coordenador responsável | Itens sob sua coordenação | Itens sob sua coordenação |
| Integrante delegado | Atividades delegadas | Não permitido |

O cronograma oferece filtros por Tomo, grupo, responsável funcional, estado e intervalo. Em telas pequenas, a linha do tempo é substituída por uma agenda acessível, com início, término e botão de período; não há interação obrigatória por arrastar e soltar.

## Validação

| Verificação | Resultado |
|---|---|
| Itens compatíveis com o cronograma | 36 |
| Itens sem término | 0 |
| Períodos inválidos | 0 |
| Itens sem início, aguardando definição | 36 |
| Testes automatizados | 87 aprovados em 23 arquivos |
| TypeScript e build | concluídos sem erros |
| Cronograma desktop e agenda móvel | validados |

