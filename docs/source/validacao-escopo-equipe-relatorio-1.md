# Validação do escopo e da equipe — Relatório 1

## Validação visual em desktop

Foram inspecionadas as rotas `/`, `/equipe` e `/atividades` em 1440 × 900 px. O painel apresenta **29 entregas**, **16 integrantes ativos** e as primeiras frentes na sequência oficial. A equipe exibe nove grupos com coordenadores, participantes e respectivos escopos. A página de atividades apresenta os códigos da Apresentação e dos Tomos, filtro por Tomo, responsável, grupo, prazo e ações operacionais.

Também foram inspecionadas `/producao`, `/interfaces` e `/biblioteca` em 1280 × 800 px. O material existente aparece preservado em **II.1 — Construção Naval Mundial**, sob o grupo Núcleo; os filtros de interfaces permanecem disponíveis para as novas seções e grupos; e a biblioteca apresenta explicitamente o escopo das 29 frentes oficiais.

## Validação visual em celular

Foram inspecionadas as rotas `/equipe` e `/atividades` em 390 × 844 px. A hierarquia dos grupos, os escopos atribuídos, os filtros e as ações de atividades permanecem legíveis, empilhados e sem corte horizontal. A ordem dos grupos segue a composição informada: Núcleo, AQUAPAR, IE-UFRJ, FMM, Fluvial, CN Brasil / Estaleiros, Defesa e CN Militar, Offshore e Descarbonização.

## Integridade observada

| Verificação | Resultado |
|---|---:|
| Frentes oficiais | 29 |
| Códigos antigos `5.x` remanescentes | 0 |
| Atividades vinculadas | 29 |
| Grupos ativos | 9 |
| Coordenadores ativos | 9 |
| Participantes ativos | 7 |
| Integrantes preservados como inativos e sem grupo | 14 |
| Material de produção preservado | 1 |
| Horas existentes antes da migração | 10 h |
| Horas restauradas como histórico | 10 h |
| Horas vigentes após a reorganização | 0 h |
| Registros na trilha de migração | 83 |
| Frentes sem atividade | 0 |
| Vínculos duplicados entre frente e atividade | 0 |
| Atividades com responsável inválido | 0 |

O material `Indice_CN_Mundo_e_Brasil_REV4 (2).docx` permaneceu vinculado ao mesmo registro de atividade, agora identificado como **II.1 — Construção Naval Mundial**.

A alocação de **10 horas de André Ricardo Mendonça Pinheiro** permaneceu vinculada ao mesmo registro de atividade, agora **II.2 — Experiências nacionais de desenvolvimento da construção naval**, como registro histórico. A ficha separa esse valor das horas vigentes, e as mutações de alocação preservam registros marcados como `histórica`.

## Validação técnica

| Verificação | Resultado |
|---|---|
| Vitest | 59 testes aprovados em 14 arquivos |
| TypeScript | Sem erros em `tsc --noEmit` |
| Build de produção | Concluído com Vite e esbuild |
| Console do navegador em 16/08/2026 | Nenhum erro ou aviso novo |
| Servidor em 16/08/2026 | Nenhuma falha de execução |
| Rede em 16/08/2026 | Nenhuma resposta HTTP 4xx ou 5xx nas rotas validadas |
