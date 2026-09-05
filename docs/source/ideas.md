# Direção visual — Relatório técnico + Painel executivo

## Objetivo

Converter a interface editorial atual em uma ferramenta institucional de gestão com leitura rápida, alta densidade informacional controlada e aparência compatível com relatórios técnicos do setor público. O design deve destacar estado, prazo, responsabilidade, exceções e ações sem remover a identidade do Estudo BNDES.

## Princípios

1. **Hierarquia funcional:** títulos menores; indicadores, alertas e decisões ocupam a primeira faixa visual.
2. **Leitura tabular:** listas densas usam cabeçalhos, colunas estáveis, linhas compactas e alinhamento numérico.
3. **Cores semânticas:** verde-azulado para estrutura institucional; azul para informação; âmbar para atenção; vermelho para atraso e risco; verde para conclusão.
4. **Superfícies discretas:** fundo neutro, cartões brancos, bordas finas e sombras mínimas. Sem textura de papel nem grade ornamental.
5. **Tipografia documental:** IBM Plex Sans para interface, Source Serif 4 para títulos e IBM Plex Mono para códigos, datas e valores técnicos.
6. **Ações previsíveis:** botão primário sólido, secundário contornado e ações auxiliares sem competir com o conteúdo.
7. **Responsividade operacional:** tabelas tornam-se cartões estruturados no celular; filtros permanecem acessíveis; nomes e estados não são truncados de modo destrutivo.

## Paleta

| Uso | Cor |
|---|---|
| Fundo da aplicação | `#F4F6F5` |
| Superfície principal | `#FFFFFF` |
| Texto principal | `#17211F` |
| Texto secundário | `#5D6B67` |
| Institucional | `#174C4F` |
| Institucional escuro | `#103638` |
| Ação / informação | `#2563A6` |
| Atenção | `#B7791F` |
| Atraso / erro | `#B44232` |
| Conclusão | `#2F6B4F` |
| Borda | `#D7DEDB` |

## Componentes compartilhados

- **Cabeçalho de página:** breadcrumb funcional, índice do módulo, título de 36–48 px, descrição curta e ação alinhada à direita.
- **Indicador executivo:** cartão compacto com rótulo, valor, variação/contexto e barra semântica superior.
- **Barra de filtros:** superfície única com campos consistentes e contador de resultados.
- **Painel técnico:** cartão branco com cabeçalho, descrição opcional e conteúdo organizado por linhas.
- **Linha de dados:** colunas com rótulos claros, estado visível, data monoespaçada e ações agrupadas.
- **Estado vazio:** painel compacto com ícone, título, orientação e ação quando aplicável.
- **Diálogo:** cabeçalho fixo, corpo segmentado por seções e rodapé de ações persistente quando o conteúdo for extenso.

## Aplicação por módulo

| Módulo | Ênfase |
|---|---|
| Visão geral | indicadores, riscos, próximas entregas e progresso por frente |
| Atividades | tabela operacional, filtros, progresso, prazo e ações por perfil |
| Cronograma | agenda executiva no celular e calendário técnico no desktop |
| Equipe | grupos, capacidade, coordenadores e escopo atribuído |
| Biblioteca | busca, classificação, metadados e tipo de fonte |
| Produção | estado de revisão, versão vigente, decisão e responsáveis |
| Interfaces | prioridade, grupos envolvidos, prazo e último encaminhamento |
| Administração | configurações agrupadas, estados de integração e histórico |

## Restrições

- Preservar todas as rotas, permissões, dados, mutações, nomes acessíveis e testes funcionais.
- Não introduzir imagens decorativas, gradientes chamativos, glassmorphism ou animações longas.
- Manter contraste mínimo compatível com WCAG AA e foco de teclado visível.
