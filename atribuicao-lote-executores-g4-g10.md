# Atribuição em lote de executores — Grupos G4 e G10

**Data de implantação:** 30 de agosto de 2026  
**Matriz de referência:** `Atividades-Grupos.xlsm`, aba **Atividades**.

## Objetivo

Foi incluído, na página **Gestão de atividades**, um painel administrativo para designar em lote um executor às seções canônicas ainda sem alocação vigente que constam como referência dos grupos G4 ou G10 na matriz XLSM.

| Grupo | Escopo | Seções disponíveis na matriz |
|---|---|---:|
| G4 | Transporte Marítimo Mundial | 15 códigos de referência |
| G10 | Construção Naval Mundial e Análise Econômica | 20 códigos de referência |

## Procedimento de uso

O administrador seleciona **Atribuir G4/G10 em lote** no cabeçalho da Gestão de Atividades, escolhe o grupo funcional, seleciona um integrante ativo, informa as horas previstas por seção e marca as seções pendentes que receberão o executor. Antes da conclusão, é necessária uma confirmação explícita do conjunto selecionado.

Para cada seção, o portal cria uma alocação vigente com o integrante escolhido como líder de execução. O registro guarda o administrador que realizou a designação, as horas previstas e a nota de origem da matriz XLSM.

## Salvaguardas

| Regra | Proteção aplicada |
|---|---|
| Escopo do lote | Apenas códigos presentes na matriz de referência do grupo selecionado. |
| Situação da seção | Apenas seções canônicas, filhas de capítulo e sem executor vigente. |
| Executor | Apenas integrante ativo. |
| Sobreposição | A operação é recusada se qualquer seção selecionada já receber executor antes do salvamento. |
| Confirmação | Botão só é habilitado com executor, horas positivas, ao menos uma seção e confirmação marcada. |
| Auditoria | Alocação registra origem, grupo, autor da designação, data e observação. |

O recurso não infere responsáveis individuais da planilha. A matriz é usada somente para delimitar as seções elegíveis, conforme a orientação da coordenação.

## Validação

| Verificação | Resultado |
|---|---|
| Procedimentos protegidos | Consulta e atribuição em lote restritas ao perfil administrador. |
| Cobertura de interface | Painel, seção de referência e confirmação incluídos em teste. |
| Testes automatizados | 32 arquivos e 114 testes aprovados. |
| TypeScript e build | `pnpm check` e `pnpm build` aprovados. |

> A prévia automatizada não mostra o painel porque opera com um perfil de demonstração identificado como colaborador. O painel aparece no perfil administrativo, sem ampliar permissões para outros integrantes.
