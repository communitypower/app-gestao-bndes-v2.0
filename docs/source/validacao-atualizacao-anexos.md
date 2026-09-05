# Validação da atualização com anexos do Portal Naval

## Resultado da consolidação

| Verificação | Resultado |
|---|---|
| Itens da planilha | 36 |
| IDs confirmados no CSV | 36 |
| Itens identificados no plano em Markdown | 36 |
| Itens de atividade no portal | 36 |
| Itens com código, resumo, entrega e dependências | 36 |
| Frentes oficiais preservadas | 29 |
| Frentes desdobradas | `I.6` com 4 itens, `I.8` com 4 itens e `II.4` com 2 itens |
| Novas referências na Biblioteca | 3 |
| Referências totais na Biblioteca | 331 |
| Alocações históricas preservadas | 1 registro, 10 horas |

## Controles aplicados

A planilha foi utilizada como matriz estruturada para os metadados de planejamento e o plano em Markdown validou o detalhamento narrativo. O CSV confirmou os mesmos identificadores, mas seu encapsulamento multilinha não padronizado impediu seu uso como fonte detalhada. A precedência e o mapeamento estão descritos em [`reconciliacao-anexos-relatorio1.md`](./reconciliacao-anexos-relatorio1.md).

Os responsáveis funcionais `M1`, `M2` e `M3` foram registrados como informação de planejamento. O coordenador nominal, as responsabilidades delegadas, os revisores, os materiais, as interfaces, os prazos e o histórico anterior permanecem como registros operacionais da plataforma.

## Validação técnica e visual

| Verificação | Resultado |
|---|---|
| Testes automatizados | 83 testes em 22 arquivos aprovados |
| TypeScript | sem erros |
| Build de produção | concluído |
| Atividades em desktop | tabela com 36 itens e busca por metadados validada |
| Atividades, equipe e biblioteca em celular | leitura validada sem corte horizontal |
| Painel móvel | carregamento concluído, com 36 itens e 29 frentes explicitados |
| Registros recentes | sem novos erros funcionais relacionados à atualização |

