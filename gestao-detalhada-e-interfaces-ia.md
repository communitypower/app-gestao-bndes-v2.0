# Gestão detalhada por atividade e interfaces assistidas

## Estrutura operacional

A Estrutura do Relatório 1 — V1 foi convertida em **286 atividades detalhadas**, vinculadas de forma pai-filho aos **47 itens de coordenação** já existentes. As frentes e os itens originais permanecem preservados como camada editorial, de coordenação e de histórico; os novos registros representam os tópicos efetivamente gerenciáveis de cada capítulo.

Cada atividade detalhada possui código próprio, texto-base proveniente do anexo V1, responsável formal herdado do item de coordenação e prazo inicial herdado até que a coordenação defina período específico. A sincronização é idempotente e registra o detalhamento sem substituir horas, materiais, comentários, marcos, revisões, interfaces ou alocações históricas.

## Responsabilidades e revisão

> O coordenador do grupo continua sendo o responsável formal pela atividade. A execução pode ser delegada a qualquer integrante ativo da equipe, inclusive de outro grupo, com escopo, horas e líder de execução registrados. A revisão também pode ser atribuída a integrantes ativos com conta vinculada, exceto o responsável formal da própria atividade.

## Materiais e evidências nas atividades

As fichas de atividade passaram a aceitar links de **material** ou **evidência de campo**. O vínculo é protegido pelas mesmas permissões de distribuição de execução, fica visível na ficha e abre em nova guia com `rel="noreferrer"`.

## Evidências e pré-análise nas interfaces

Os integrantes ativos de grupos envolvidos podem carregar arquivos de evidência para uma interface e, opcionalmente, associá-los a uma atividade relacionada. Os metadados, a URL segura de armazenamento e o autor do envio ficam registrados de forma auditável.

A pré-análise exige pelo menos dois arquivos e é acionada por administrador ou coordenador envolvido. O modelo `gpt-5-mini`, disponível no catálogo do projeto na data de implementação, compara os documentos PDF e devolve um resultado JSON com resumo, achados e limitações. O resultado é apresentado como **subsídio à deliberação humana**; não resolve automaticamente a interface, não altera textos e não substitui a revisão técnica.

## Validações realizadas

| Controle | Resultado |
| --- | --- |
| Itens de coordenação preservados | 47 |
| Atividades detalhadas | 286, com códigos únicos |
| Testes automatizados | 99 aprovados |
| TypeScript | aprovado |
| Build de produção | aprovado |
| Verificação visual | desktop e celular em Atividades e Interfaces |

O carregamento aceita os formatos permitidos pelo portal, mas a pré-análise automatizada atual utiliza somente as evidências enviadas em PDF. Outros arquivos permanecem armazenados e disponíveis para consulta; sua análise requer conversão apropriada ou avaliação humana.
