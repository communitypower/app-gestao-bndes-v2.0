# Filtros por atribuição e exportação de status

**Data de execução:** 29 de agosto de 2026  
**Escopo:** consulta de capítulos e atividades por responsável ou revisor e exportação do status atual em CSV ou PDF.

## Funcionalidades incluídas

Na página **Gestão de atividades**, os filtros agora permitem selecionar um integrante como responsável ou revisor. O filtro de responsável reconhece tanto a coordenação da atividade-mãe quanto as atribuições de execução. O filtro de revisor identifica as designações registradas para a atividade. Os dois filtros podem ser combinados com busca textual, tomo e situação.

| Controle | Resultado |
|---|---|
| Responsável | Exibe os capítulos atribuídos ao coordenador selecionado e as atividades em que ele possui responsabilidade de execução. |
| Revisor | Exibe os capítulos e atividades em que o integrante selecionado está designado para revisão. |
| CSV | Baixa arquivo em UTF-8 com as atividades correspondentes aos filtros vigentes. |
| PDF | Gera relatório paginado de status para as atividades correspondentes aos filtros vigentes. |

## Conteúdo da exportação

Cada arquivo inclui tomo, capítulo, código, nível hierárquico, atividade, situação, percentual de progresso, coordenação, responsáveis de execução, revisores, período, horas e síntese do checklist. A síntese registra itens concluídos, em aberto e bloqueados. A exportação inclui todas as atividades ativas por padrão — 30 capítulos e 253 etapas de execução — e aplica os filtros selecionados quando houver.

## Salvaguardas

Os dados são consultados por procedimento protegido que respeita a mesma regra de acesso da lista de atividades. Os arquivos são gerados no navegador e baixados diretamente, sem enviar conteúdo operacional a um serviço externo. O CSV escapa aspas e é emitido com marca UTF-8 para preservar acentuação em planilhas.

## Validação

| Verificação | Resultado |
|---|---|
| Estrutura ativa utilizada pelo relatório | 283 atividades: 30 capítulos e 253 etapas. |
| Checklists disponíveis | 30 capítulos e 150 itens de checklist. |
| Filtros e comandos na interface | Cobertos por teste de interface com nomes acessíveis. |
| Download CSV | Coberto por teste de geração de URL temporária e acionamento do download. |
| Testes automatizados | 29 arquivos e 105 testes aprovados. |
| TypeScript e build | `pnpm check` e `pnpm build` aprovados. |
