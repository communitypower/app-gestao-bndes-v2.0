# Desenho de migração — gestão detalhada por atividade

1. Adicionar `parentActivityId`, `detailCode` e `detailSortOrder` à atividade sem modificar registros existentes.
2. Criar as 286 atividades-filhas a partir da decomposição da Estrutura V1, vinculando cada uma ao item de coordenação do capítulo correspondente.
3. Preservar responsáveis formais, alocações, revisões, materiais, comentários, marcos, interfaces, evidências e logs nos itens já existentes.
4. Estender alocações e revisores para integrantes ativos de qualquer grupo, mantendo a autorização de distribuição e aprovação no coordenador formal ou administrador.
5. Criar anexos de interface e análises estruturadas de inconsistência, com arquivo, autor, data, escopo selecionado, achados da IA e confirmação humana.
