# Diagnóstico de aderência ao controle documental do Estudo BNDES — Indústria Naval

**Data:** 29 de agosto de 2026  
**Objeto da verificação:** aderência do Portal Naval ao fluxo documental por tomo, capítulo e seção, desde a execução até a aprovação final do coordenador do projeto.

## Conclusão executiva

O portal já contém uma base funcional relevante para o controle documental: a estrutura ativa possui 30 capítulos e 253 itens de execução; há atribuição de executores, indicação de revisores, carregamento de materiais, submissão formal, comentários, pareceres, checklists e gestão de interfaces. Contudo, **o fluxo ainda não está completo como processo de consolidação editorial por seção, capítulo, tomo e projeto**. As transições posteriores à revisão por pares não estão representadas em uma máquina de estados e tampouco estão condicionadas à consolidação do capítulo, à gestão das interfaces remanescentes, à aprovação de tomo e à revisão final do coordenador do projeto.

## Evidências do inventário

| Indicador | Situação observada |
|---|---:|
| Capítulos ativos | 30 |
| Itens de execução ativos | 253 |
| Itens com executor de execução designado | 3 |
| Capítulos com revisor designado | 2 |
| Submissões formais de revisão | 3 |
| Decisões de revisão registradas | 0 |
| Interfaces abertas | 5 |
| Designações de coordenador/substituto de tomo | 0 |

Esses dados demonstram que a infraestrutura já existe, mas sua utilização e o encadeamento de aprovação ainda estão em estágio inicial.

## Aderência por etapa do fluxo

| Etapa esperada | Situação atual | Avaliação |
|---|---|---|
| Tomo → capítulo → seção | A hierarquia canônica identifica tomos e capítulos, e apresenta 253 itens internos de execução. | **Parcial.** A nomenclatura de item/etapa ainda precisa ser consolidada como seção documental no workflow. |
| Designação de executor por seção | Há alocações de execução e qualquer integrante ativo pode ser designado. | **Implementada.** Requer completar a cobertura de 250 itens ainda sem executor. |
| Executor elabora e submete aos revisores | Integrantes ativos podem desenvolver versões, mas a submissão formal está restrita ao coordenador responsável da atividade. | **Parcial.** O executor precisa poder submeter sua própria entrega à revisão apontada. |
| Revisores avaliam e devolvem ajustes | Há revisores, pareceres, comentários e estados de aprovação/ajustes. | **Implementada.** Ainda sem decisões registradas na base atual. |
| Resolução de interfaces da seção | Há cadastro, responsáveis, evidências, comentários e resolução de interfaces. | **Parcial.** Não há bloqueio formal da progressão quando uma interface da seção permanece aberta. |
| Consolidação e aprovação do capítulo | Há checklist de capítulo e responsável formal da atividade-mãe. | **Parcial.** Falta transição formal de consolidado/aprovado pelo coordenador do capítulo. |
| Encaminhamento e aprovação do tomo | Atribuições de coordenador e substituto de tomo estão disponíveis. | **Não operacional.** Não há designações cadastradas e o papel ainda não aprova ou encaminha documentos no fluxo. |
| Revisão final do projeto | O perfil administrativo pode gerir o portal. | **Não operacional.** Não existe estado ou decisão específica do coordenador do projeto para inclusão na documentação final. |

## Fluxo recomendado

O fluxo documental deve tornar explícita a unidade de trabalho de cada seção e suas decisões humanas, mantendo o material, os pareceres e as interfaces vinculados ao mesmo registro:

> **Planejada → Em elaboração pelo executor → Submetida à revisão da seção → Em revisão → Ajustes solicitados / Revisão aprovada → Interfaces da seção resolvidas → Consolidada pelo coordenador do capítulo → Interfaces intercapítulos resolvidas → Encaminhada ao coordenador do tomo → Aprovada no tomo → Consolidada para revisão do coordenador do projeto → Aprovada para documentação final.**

Cada transição deve registrar data, autor, justificativa, versão documental e pendências remanescentes. Nenhuma etapa de aprovação deve ser automática ou realizada por quem produziu a versão aprovada.

## Ajustes prioritários necessários

| Prioridade | Ajuste | Resultado esperado |
|---|---|---|
| P0 | Criar uma máquina de estados documental por seção, capítulo, tomo e projeto. | Situação única, auditável e visualmente compreensível. |
| P0 | Autorizar o executor designado a submeter a versão da seção aos revisores apontados. | Separação efetiva entre elaboração e revisão. |
| P0 | Condicionar o avanço de seção e capítulo à resolução ou ao encaminhamento formal de interfaces aplicáveis. | Coerência entre seções e capítulos. |
| P0 | Implementar decisões explícitas do coordenador de capítulo, coordenador de tomo e coordenador do projeto. | Cadeia de aprovação humana até a documentação final. |
| P1 | Designar coordenadores e substitutos dos cinco níveis editoriais já configurados. | Responsabilização de Apresentação e Tomos I–IV. |
| P1 | Preencher executores e revisores das seções prioritárias. | Execução operacional distribuída. |

## Decisões que exigem validação da coordenação

Para implementar a fase seguinte sem pressupostos institucionais, ainda é necessário confirmar: **(1)** quem exerce a função de coordenador do projeto e seu substituto; **(2)** a lista de coordenadores e substitutos dos tomos; **(3)** se o coordenador do capítulo pode devolver uma seção ao executor ou somente encaminhar ajustes por novo ciclo de revisão; e **(4)** quais interfaces abertas bloqueiam obrigatoriamente a aprovação de capítulo ou tomo.
