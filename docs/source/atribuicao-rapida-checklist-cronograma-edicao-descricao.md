# Atribuição rápida, checklist por cronograma e edição de descrição

**Data de execução:** 28 de agosto de 2026  
**Fontes preservadas:** cronograma oficial sincronizado nas atividades e textos descritivos da Estrutura do Relatório 1 — V1.

## Recursos incluídos

| Recurso | Como utilizar | Regra preservada |
|---|---|---|
| Atribuir responsáveis | Na ficha, usar **Atribuir responsáveis** para abrir a distribuição de execução, selecionar integrantes, definir escopo, horas e liderança. | Somente administrador ou coordenador designado pode alterar as atribuições. A liderança de execução continua exigindo justificativa em caso de transferência. |
| Atribuir revisores | Na ficha, usar **Atribuir revisores** para acessar a lista pesquisável de integrantes elegíveis. | Revisores devem estar ativos, possuir conta vinculada e ser distintos do coordenador responsável. |
| Prazo oficial de revisão | Criar o checklist ou usar **Aplicar cronograma oficial** para recalcular os cinco prazos. | O cálculo é ancorado no prazo oficial de término do capítulo e não ultrapassa seu período programado. |
| Responsável por item de revisão | Selecionar diretamente o responsável em cada linha do checklist. | Apenas integrantes ativos podem ser indicados; a alteração gera evento auditável. |
| Edição rápida da descrição | Na seção **Descrição da atividade**, selecionar **Edição rápida**, revisar o texto e salvar. | A edição é restrita à administração ou à coordenação designada e registra snapshot de antes/depois. |

## Configuração dos prazos de revisão

Todos os 30 capítulos canônicos receberam seus checklists, totalizando 150 itens com prazo. Cada data parte do término oficial já registrado no cronograma do projeto, com antecipação escalonada e limite mínimo na data inicial do capítulo quando houver período curto.

| Item do checklist | Prazo em relação ao término do capítulo |
|---|---:|
| Texto, fontes e referências da seção | 21 dias antes |
| Banco de dados e evidências da seção | 14 dias antes |
| Interfaces e escopos sobrepostos | 10 dias antes |
| Coerência, integração e aderência ao capítulo | 7 dias antes |
| Encaminhamento ao coordenador do tomo | 2 dias antes |

## Integridade e validação

| Verificação | Resultado |
|---|---|
| Capítulos com checklist | 30 de 30 |
| Itens com prazo | 150 de 150 |
| Prazos fora do período oficial | 0 |
| Antecedências verificadas | 21, 14, 10, 7 e 2 dias, por item de revisão |
| Testes automatizados | 29 arquivos e 103 testes aprovados |
| TypeScript e build | `pnpm check` e `pnpm build` aprovados |

> A aplicação do cronograma oficial é uma ação explícita. Ela permite restabelecer a grade-padrão do capítulo quando necessário, sem criar prazos paralelos fora do cronograma oficial.
