# Delegação de responsabilidades de execução

## Regra de governança

Cada atividade mantém um **coordenador responsável**, que permanece responsável pela supervisão, pela distribuição de trabalho, pelos revisores e pelas decisões da frente. O coordenador ou um administrador pode atribuir a execução a um ou mais participantes ativos do mesmo grupo.

Cada atribuição vigente exige os seguintes dados:

| Campo | Regra |
|---|---|
| Integrante | Participante ativo do mesmo grupo do coordenador |
| Escopo da responsabilidade | Texto entre 3 e 1.000 caracteres |
| Horas previstas | Valor positivo, com até duas casas decimais |
| Liderança de execução | Exatamente um integrante quando houver atribuições |
| Autor da atribuição | Usuário administrador ou coordenador que realizou a distribuição |

## Acessos

| Perfil | Consulta | Distribui responsabilidades | Edita atividade e revisores |
|---|---:|---:|---:|
| Administrador | Todas as atividades | Sim | Sim |
| Coordenador responsável | Atividades sob sua coordenação | Sim | Sim |
| Integrante delegado | Somente atividades com atribuição vigente | Não | Não |
| Integrante sem delegação | Não acessa Atividades | Não | Não |

## Histórico

O sistema mantém alocações históricas separadas das atribuições vigentes. A atualização da distribuição remove e recria somente registros de tipo `vigente`; as alocações `histórica`, incluindo as 10 horas preservadas anteriormente, permanecem disponíveis na ficha da atividade.

## Validação

| Verificação | Resultado |
|---|---|
| Migração aditiva | campos `responsibility`, `isExecutionLead` e `assignedBy` adicionados à tabela de alocações |
| Integridade histórica | 1 alocação histórica, total de 10 horas, preservada |
| Testes automatizados | 79 testes em 20 arquivos aprovados |
| TypeScript | sem erros |
| Build de produção | concluído |
| Lista de atividades | validada em desktop e celular |
| Registros recentes | sem novos erros de navegador ou rede |

