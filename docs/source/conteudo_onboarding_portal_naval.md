# Direção visual

> Apresentação institucional para onboarding de testadores. Aplicar a linguagem visual do Portal Naval: fundo claro, verde profundo como cor estrutural, cinza técnico para metadados, linhas finas, cartões compactos e tipografia de relatório técnico. Priorizar leitura operacional, hierarquia clara e pouco texto por slide.

## Cover

**Portal Naval**

**Rodada inicial de testes — Relatório 1**

Gestão do Estudo BNDES · Indústria Naval

## Slide 1

### Objetivo da rodada

- Validar acesso, permissões e fluxos essenciais antes da ampliação para toda a equipe.
- Conferir se o plano de trabalho, a distribuição de responsabilidades e os prazos estão utilizáveis no portal.
- Registrar erros, inconsistências e melhorias com evidências objetivas.

**Mensagem-chave:** testar a operação real do estudo, não apenas a aparência das telas.

## Slide 2

### O portal traduz o plano em controle operacional

| Elemento | Situação atual |
|---|---:|
| Frentes oficiais do Relatório 1 | 29 |
| Itens de execução detalhados | 36 |
| Grupos de trabalho | 9 |
| Interfaces críticas registradas | 5 |
| Atividades de campo e divulgação | 9 |
| Referências na Biblioteca | 331 |

**Mensagem-chave:** o escopo oficial permanece em 29 frentes; a execução foi detalhada em 36 itens acompanháveis.

## Slide 3

### Cada perfil enxerga o que precisa executar

- **Administrador:** visão integral, configuração, equipe, cronograma, interfaces e Biblioteca.
- **Coordenador:** gestão das atividades do próprio grupo, distribuição de execução, períodos, marcos, revisores e interfaces.
- **Integrante delegado:** consulta das atividades recebidas e dos materiais associados.
- **Colaborador:** acesso à Biblioteca e à Produção conforme seus vínculos.

**Teste esperado:** perfis não devem acessar nem editar dados fora de seu escopo.

## Slide 4

### Fluxo de uma atividade: do plano à entrega

1. Localizar o item pelos filtros de Tomo, grupo, responsável ou estado.
2. Conferir escopo oficial, entrega, dependências, critérios de aceite e notas operacionais.
3. Distribuir responsabilidades de execução, liderança e horas no próprio grupo.
4. Definir período e marcos; submeter material e encaminhar para revisão quando aplicável.

**Mensagem-chave:** coordenação supervisiona; execução pode ser delegada com escopo e carga explícitos.

## Slide 5

### Cronograma mestre organiza a execução em seis meses

| Mês | M1 Ago | M2 Set | M3 Out | M4 Nov | M5 Dez | M6 Jan |
|---|---:|---:|---:|---:|---:|---:|
| Entregáveis previstos | 10 | 4 | 8 | 5 | 6 | 3 |

- Itens com início e término definidos aparecem como barras de período.
- Marcos intermediários são registrados diretamente no item pelo administrador ou coordenador.
- A agenda móvel substitui a linha do tempo em telas menores.

## Slide 6

### Alertas transformam o cronograma em instrumento de decisão

- **Atraso:** prazo vencido sem conclusão.
- **Prazo próximo:** item com entrega iminente.
- **Sobreposição:** períodos concorrentes dentro do mesmo grupo.
- **Início a definir:** prazo existe, mas a programação ainda não foi formalizada.

**Teste esperado:** conferir cores, legendas, filtros e exportação do cronograma em PNG e PDF.

## Slide 7

### Interfaces críticas evitam divergências entre grupos

- Cinco interfaces críticas já foram registradas a partir do plano.
- Os vínculos conectam seções, grupos e itens específicos de execução.
- Cada interface permite registrar prioridade, responsável, comentários, encaminhamentos e resolução.

**Teste esperado:** abrir uma interface, validar os itens vinculados e registrar um encaminhamento de teste.

## Slide 8

### Campo, entrevistas e divulgação entram no mesmo controle

- Visitas a estaleiros no Brasil, China, Índia e Coreia do Sul.
- Coleta de dados em fontes primárias e entrevistas estruturadas.
- Apresentações de relatórios, apresentações para a equipe e audiências públicas.

**Mensagem-chave:** as atividades externas devem ser acompanhadas no mesmo ambiente de planejamento do relatório.

## Slide 9

### Biblioteca e revisão mantêm evidências rastreáveis

- Biblioteca com 331 referências, incluindo 328 documentos únicos provenientes do Drive.
- Busca, filtros por frente/tema e paginação para consulta do acervo.
- Produção colaborativa com versões, revisores, comentários, solicitação de ajustes e pareceres.

**Teste esperado:** localizar uma referência, abrir um material em produção e verificar o fluxo de revisão disponível ao perfil.

## Slide 10

### Roteiro mínimo para cada testador

1. Acessar o portal e concluir o primeiro login.
2. Confirmar com o administrador o vínculo da conta ao integrante correto.
3. Executar os cenários indicados para o perfil recebido.
4. Registrar ocorrência com página, item, ação, horário, resultado esperado, resultado observado e captura de tela.

**Classificação:** bloqueador · erro funcional · inconsistência de dados · melhoria de usabilidade · dúvida.

## Slide 11

### Recursos preparados para fase posterior

- Envio real de alertas por WhatsApp: depende de conta Meta, número de envio, credenciais e consentimentos.
- Sincronização manual do Google Drive pelo portal: depende de autorização OAuth válida da conta responsável.
- Datas iniciais e marcos reais: devem ser definidos pelos coordenadores, sem inferência automática.

**Mensagem-chave:** esses itens não são critérios de reprovação da rodada inicial.

## Slide 12

### Encerramento da rodada

**Prioridade imediata:** validar acessos, atividades, cronograma, interfaces, campo e Biblioteca.

**Resultado esperado:** lista priorizada de bloqueadores e ajustes antes de ampliar o acesso à equipe.

Portal Naval · Gestão do Estudo BNDES — Indústria Naval
