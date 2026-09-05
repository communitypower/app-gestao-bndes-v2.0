# Manual de Instruções e Procedimentos da Equipe Participante
## Plataforma de Gestão do Estudo — Indústria Naval
### Estudo Técnico BNDES · FEP (2026—2027)

---

## 1. Apresentação e Objetivo

Este manual orienta todos os pesquisadores, executores, coordenadores e revisores participantes do **Estudo da Indústria Naval Brasileira: Diagnósticos e Políticas Públicas para o Desenvolvimento Industrial e Tecnológico**, viabilizado pela parceria **BNDES · FEP**.

A **Plataforma de Gestão do Estudo** foi desenvolvida para assegurar:
1. **Rastreabilidade e Rigor Metodológico**: Controle completo do ciclo de elaboração dos 30 capítulos analíticos distribuídos nos 4 Tomos do Relatório 1.
2. **Revisão Técnica Independente por Pares**: Garantia de que cada seção seja revisada por pesquisadores qualificados, assegurando integridade e qualidade analítica antes da homologação.
3. **Cumprimento de Prazos e Metas Contratuais**: Monitoramento transparente do avanço físico, das entregas internas e das remessas oficiais ao BNDES.
4. **Alinhamento Interdisciplinar**: Coordenação contínua entre as frentes temáticas (mercado, tecnologia, capacidade instalada, financiamento, regulação e cenários).

---

## 2. Perfis de Participação e Responsabilidades

Na plataforma, cada integrante atua sob um ou mais papéis operacionais, com permissões calibradas para seu escopo de trabalho:

| Papel | Descrição | Principais Atribuições na Plataforma |
| :--- | :--- | :--- |
| **Administrador** | Coordenação Geral do Estudo | Acesso irrestrito; provisionamento de usuários; configuração de parâmetros globais; homologação final de capítulos e interfaces globais. |
| **Coordenador de Grupo / Capítulo** | Liderança acadêmica e técnica de frentes ou capítulos específicos | Gestão do escopo oficial (Anexo B); designação de executores; atribuição de revisores independentes; atualização de etapas; homologação de minutas aprovadas. |
| **Pesquisador Executor / Autor** | Redator e pesquisador responsável pela produção do conteúdo analítico | Atualização de status e progresso de suas etapas; submissão de minutas e arquivos à revisão técnica; resposta e implementação de ajustes apontados. |
| **Revisor Técnico Independente** | Especialista responsável pelo escrutínio e validação por pares | Análise da minuta submetida; verificação de aderência técnica e metodológica; preenchimento do checklist; registro de apontamentos; emissão de parecer formal. |

---

## 3. Como Acessar a Plataforma

1. **Endereço de Acesso**: Acesse o sistema pelo navegador web através da URL institucional disponibilizada pela coordenação (ex.: `http://localhost:3000` em ambiente local ou o domínio oficial de produção).
2. **Autenticação**:
   - Utilize o e-mail cadastrado junto à coordenação executiva.
   - Em ambiente de testes/homologação, a página `/login` permite selecionar diretamente seu perfil institucional para acesso imediato.
3. **Navegação Responsiva**: A plataforma pode ser utilizada em computadores desktop, notebooks e dispositivos móveis (tablets e smartphones). A barra lateral de navegação pode ser recolhida clicando no ícone do painel superior esquerdo.

---

## 4. Estrutura e Módulos do Sistema

O menu lateral organiza as dimensões de trabalho do projeto:

* **Visão Geral (`/`)**: Painel executivo consolidado com indicadores de avanço por Tomo (I, II, III e IV), prazos próximos e situação das entregas.
* **Gestão de Atividades (`/atividades`)**: Centro nevrálgico do estudo. Apresenta o índice oficial dos 30 capítulos (Anexo B), seus tópicos de execução e a **Central de Ações do Participante**.
* **Produção e Revisão Técnica (`/producao`)**: Módulo dedicado ao fluxo editorial, permitindo visualizar minutas em elaboração, sob revisão ou aprovadas.
* **Cronograma (`/calendario`)**: Visão temporal e calendário editorial, diferenciando datas de entrega editorial interna e marcos oficiais do BNDES.
* **Equipe e Grupos (`/equipe`)**: Matriz de participantes, instituições parceiras, cargas horárias e capítulos sob responsabilidade de cada grupo.
* **Biblioteca de Referências (`/biblioteca`)**: Acervo com mais de 300 documentos, teses, artigos e bases de dados oficiais catalogados para subsidiar as pesquisas.
* **Interfaces entre Seções (`/interfaces`)**: Mapeamento de contatos e insumos compartilhados entre diferentes frentes de pesquisa para evitar sobreposições ou lacunas.
* **Trabalho de Campo e Divulgação (`/campo-divulgacao`)**: Registro de entrevistas com entidades do setor, reuniões institucionais e visitas a estaleiros.
* **Manual de Procedimentos (`/manual`)**: Guia interativo integrado com orientações operacionais detalhadas.

---

## 5. A Central de Ações e as Notificações em Tempo Real

Para que você não precise procurar em listas extensas o que deve fazer, a plataforma conta com dois mecanismos de direcionamento imediato:

### A. Central de Ações do Participante (`ParticipantActionCenter`)
Localizada no topo da página de **Gestão de Atividades (`/atividades`)**, ela identifica automaticamente quem você é e filtra tudo o que requer sua atuação imediata:
- **Como Autor / Executor**: Alerta sobre minutas pendentes de envio e apontamentos da revisão técnica aguardando correção.
- **Como Revisor Técnico**: Alerta sobre novas versões submetidas aguardando seu parecer e ajustes realizados pelo autor prontos para conferência.
- **Como Coordenador**: Alerta sobre capítulos sem revisores independentes designados e seções aprovadas aguardando homologação no capítulo.
- **Como Interface Interdisciplinar**: Alerta sobre interfaces prioritárias ou em discussão envolvendo o seu grupo de trabalho que demandam alinhamento ou fornecimento de insumos.
- **Filtros por Abas**: Alterne entre *"Todas"*, *"Autor"*, *"Revisor"*, *"Coordenação"* e *"Interfaces"* para focar em uma atribuição específica.
- **Botões de Ação Direta**: Cada pendência possui botão que abre imediatamente a Ficha da Atividade, a Estação de Revisão ou a Interface correspondente.

### B. Sino de Notificações (`NotificationBell`)
Localizado no canto superior direito do cabeçalho de todas as páginas:
- Exibe um indicador numérico vermelho sempre que houver novidades direcionadas a você.
- Ao clicar no sino, um painel suspenso lista os avisos recentes com data/hora e tipo de evento:
  - 🔔 **Revisão atribuída**: Você foi designado para revisar um capítulo ou seção.
  - 📄 **Nova versão submetida**: Uma nova minuta foi disponibilizada pelo autor para sua avaliação.
  - ✏️ **Ajustes solicitados**: O revisor registrou apontamentos na sua minuta.
  - ✅ **Ajustes implementados**: O autor registrou que corrigiu os apontamentos.
  - 🏆 **Seção aprovada**: Os revisores aprovaram a seção.
- É possível clicar diretamente na notificação para abrir o diálogo de trabalho ou marcar todas como lidas.

---

## 6. Procedimentos Passo a Passo

### 6.1. Procedimento para o Coordenador de Capítulo / Grupo

O coordenador responde pela consistência do capítulo, pelo fluxo de trabalho de sua equipe e pela harmonia com os demais grupos.

#### Passo 1: Verificar o Escopo Oficial do Capítulo
1. Acesse **Gestão de Atividades (`/atividades`)**.
2. Localize o capítulo correspondente (ex.: *Capítulo I.2 — Economia Marítima*).
3. Clique no capítulo para abrir a **Ficha da Atividade**.
4. Observe o bloco **"Escopo e descrição oficial do capítulo"** (`Anexo B — Plano de Trabalho`). Esse texto detalha o conteúdo acordado com o BNDES e delimita as fronteiras analíticas.

#### Passo 2: Mapear e Pactuar Interfaces Interdisciplinares
1. Na Ficha da Atividade, consulte o bloco **"Interfaces de Coordenação Interdisciplinares"**.
2. Identifique quais outros grupos fornecem insumos para este capítulo (ex.: projeção de frota, capacidade de diques, políticas de financiamento).
3. Caso identifique uma nova dependência ou ponto de contato metodológico, acesse **Interfaces entre Seções (`/interfaces`)** e registre a interface indicando o grupo parceiro, a prioridade e o insumo necessário.
4. Antes de liberar o texto para homologação final, assegure que as interfaces prioritárias estejam com status *"resolvida"* ou *"em discussão acordada"*.

#### Passo 3: Atualizar Etapas e Acompanhar a Equipe
1. Na Ficha da Atividade, consulte as **Etapas de Execução** (tópicos específicos do capítulo).
2. Para cada etapa, é possível clicar em **"Atualizar etapa"** para ajustar:
   - Status (*Não iniciada*, *Em andamento*, *Em revisão*, *Concluída*, *Bloqueada*).
   - Progresso percentual (0% a 100%).
   - Datas de início e término planejado.
   - Notas e observações de trabalho.

#### Passo 4: Designar Revisores Técnicos Independentes
> **Regra de Governança**: Para assegurar independência na avaliação por pares, os revisores técnicos devem ser preferencialmente pesquisadores qualificados vinculados a outros grupos de trabalho do estudo ou sem envolvimento direto na redação daquela seção específica.

1. Na Ficha da Atividade, na seção **"Revisores técnicos independentes"**, clique em **"Designar revisores"**.
2. O sistema abrirá uma gaveta lateral listando os pesquisadores elegíveis.
3. Selecione os revisores designados (mínimo recomendado: 1 a 2 revisores por seção) e clique em **"Salvar designações"**.
4. *O sistema enviará imediatamente uma notificação no perfil de cada revisor designado.*

#### Passo 5: Homologação e Consolidação Editorial
1. Quando todos os revisores aprovarem a seção, o coordenador recebe uma notificação de **Seção Aprovada**.
2. Na Ficha do Capítulo, no campo **"Próxima decisão"** do fluxo documental, o coordenador pode registrar as decisões de avanço:
   - *Avançar para consolidação editorial*
   - *Encaminhar para entrega BNDES*

---

### 6.2. Procedimento para o Autor / Pesquisador Executor

O pesquisador executor é responsável pela investigação analítica, pela articulação de insumos e pela elaboração das minutas.

#### Passo 1: Localizar suas Atividades e Interfaces Conexas
1. Acesse **Gestão de Atividades (`/atividades`)**.
2. A **Central de Ações** destacará imediatamente suas atribuições sob a aba **"Como Autor"** e suas pendências de alinhamento sob a aba **"Interfaces"**.
3. Abra a Ficha da Atividade do capítulo para consultar:
   - O **Escopo Oficial do Anexo B**.
   - As **Interfaces de Coordenação Interdisciplinares** conectadas ao capítulo (trocas de insumos com outros grupos).

#### Passo 2: Atualizar o Progresso da Etapa
1. Na Ficha da Atividade, localize sua etapa de execução e clique em **"Atualizar etapa"**.
2. Ajuste o percentual concluído (ex.: 25%, 50%, 75%, 100%) e o status da atividade.
3. Caso encontre algum impedimento crítico que dependa de terceiros, selecione o status **"Bloqueada"** e justifique no campo de notas.

#### Passo 3: Submeter Minuta à Revisão Técnica
1. Na Ficha da Atividade ou no módulo **Produção e Revisão (`/producao`)**, acerte o envio da minuta.
2. É possível registrar:
   - **Upload de arquivo** (PDF, Word DOCX) ou **Link externo compartilhado** (Google Drive, OneDrive, Teams).
   - **Título da versão** (ex.: *Minuta Preliminar - v1.0*).
   - **Notas da versão**: breve resumo das adições, fontes utilizadas e pontos que demandam atenção dos revisores.
3. Clique em **"Submeter à revisão"**.
4. *O sistema altera automaticamente o status documental da atividade para "Em revisão" e notifica todos os revisores designados.*

#### Passo 4: Atender aos Apontamentos da Revisão Técnica
1. Quando o revisor concluir a análise e solicitar ajustes, você receberá a notificação **Ajustes solicitados**.
2. Acesse a **Estação de Revisão** da atividade.
3. Analise a lista de apontamentos e observações dos revisores.
4. Após efetuar as alterações no texto, registre a **Nota de implementação de ajustes** e submeta a nova versão (*ex.: v1.1*).

---

### 6.3. Procedimento para o Revisor Técnico Independente

O revisor técnico é o guardião do rigor científico, metodológico e da coerência interdisciplinar do estudo.

#### Passo 1: Recebimento do Aviso e Acesso à Minuta
1. Ao receber a notificação **Revisão atribuída** ou **Nova versão submetida**, clique diretamente no aviso ou acesse a aba **"Como Revisor"** na Central de Ações.
2. Clique no botão **"Abrir estação de revisão"**.

#### Passo 2: Avaliação pelo Checklist Técnico
A Estação de Revisão apresenta o checklist institucional estruturado em dimensões fundamentais:
- [ ] **Aderência ao Escopo Oficial (Anexo B)**: A minuta cobre todos os itens analíticos previstos para o capítulo?
- [ ] **Rigor Conceitual e Teórico**: Os conceitos da economia marítima e industrial foram aplicados com precisão?
- [ ] **Consistência Metodológica e Empírica**: As fontes de dados, séries temporais e projeções estão fundamentadas?
- [ ] **Coerência Interdisciplinar (Interfaces)**: O capítulo dialoga adequadamente com as frentes correlatas e respeita as premissas acordadas nas interfaces de coordenação?
- [ ] **Clareza e Padrão Editorial**: A redação é fluida, concisa e compatível com relatórios técnicos de alto nível?

#### Passo 3: Registro de Apontamentos e Parecer Formal
1. **Apontamentos Específicos**: Registre comentários direcionados (indicando página, parágrafo ou tópico aprimorável).
2. **Emissão do Parecer**: Selecione uma das três decisões formais:
   - 🟢 **Aprovar Minuta**: A versão está madura e apta para consolidação editorial.
   - 🟡 **Solicitar Ajustes**: A minuta tem boa base, mas requer correções pontuais ou complementação antes da aprovação.
   - 🔴 **Bloquear / Reprovar**: A minuta apresenta divergências estruturais com o plano de trabalho ou ausência de dados essenciais (exige intervenção da coordenação).
3. Adicione uma síntese justificativa e clique em **"Emitir parecer"**.
4. *O sistema notificará imediatamente os autores e os coordenadores do capítulo.*

---

## 7. As Interfaces no Fluxo de Trabalho (Interdisciplinaridade)

A elaboração do Relatório 1 exige articulação estreita entre os 8 grupos de trabalho para que o diagnóstico e os cenários formem um conjunto harmonioso, sem contradições empíricas ou conceituais.

### O Ciclo de Vida de uma Interface:
```
[1. Identificação] ➔ [2. Alinhamento de Premissas] ➔ [3. Negociação e Troca] ➔ [4. Resolução e Acordo]
```

1. **Identificação**: Um coordenador ou autor percebe que seu capítulo depende de dados produzidos por outro grupo (ex.: demanda de navios-tanque depende da análise do transporte marítimo mundial).
2. **Alinhamento de Premissas**: No módulo **Interfaces entre Seções (`/interfaces`)**, a interface é registrada com classificação de prioridade (*Prioritária* ou *Não prioritária*).
3. **Negociação e Troca de Insumos**: Os grupos utilizam o mural de comentários da interface para trocar notas técnicas, tabelas e links de bases de dados compartilhadas.
4. **Resolução e Acordo**: Quando o insumo é fornecido e acordado, a interface é marcada como *"resolvida"*, desbloqueando o capítulo para validação e homologação.

> **Visibilidade Integrada**:
> - Na **Ficha da Atividade (`/atividades`)**: O bloco *"Interfaces de Coordenação Interdisciplinares"* lista todas as interfaces conectadas ao capítulo.
> - Na **Central de Ações**: A aba *"Interfaces"* sinaliza diretamente quando uma interface prioritária estiver pendente para o seu grupo.

---

## 8. Utilização da Biblioteca de Referências

A plataforma conta com uma biblioteca com mais de 300 referências organizadas:
1. Acesse **Biblioteca de Referências (`/biblioteca`)**.
2. Pesquise referências por palavra-chave, autor, instituição ou capítulo correspondente.
3. Você pode:
   - Acessar o link direto ou documento de apoio.
   - Vincular publicações e relatórios à atividade em que está trabalhando.
   - Sugerir novas referências bibliográficas para o acervo comum do estudo.

---

## 9. Perguntas Frequentes (FAQ)

### P1: Onde vejo minhas prioridades do dia?
**R:** Acesse a tela de **Gestão de Atividades (`/atividades`)**. O primeiro painel no topo da página é a **Central de Ações do Participante**, que agrupa todas as suas pendências imediatas separadas por função: *Como Autor*, *Como Revisor*, *Como Coordenação* e *Interfaces*.

### P2: Sou pesquisador executor. Posso atualizar o progresso da minha etapa?
**R:** Sim. Basta abrir a Ficha da Atividade do seu capítulo, localizar sua etapa de execução e clicar no botão **"Atualizar etapa"**. Você pode ajustar o percentual de avanço, datas e notas de trabalho. O que você não pode alterar é o coordenador geral da atividade ou remover outros colegas da equipe.

### P3: Onde estão as descrições oficiais completas dos capítulos?
**R:** As descrições detalhadas com o escopo do Anexo B estão disponíveis:
1. Na própria listagem de **Atividades (`/atividades`)**, exibidas logo abaixo do título de cada capítulo.
2. Na **Ficha da Atividade (modal de detalhes)**, no bloco em destaque intitulado **"Escopo e descrição oficial do capítulo"** (`Anexo B — Plano de Trabalho`).

### P4: Como sei se meu capítulo tem dependências com outros grupos?
**R:** Ao abrir a Ficha da Atividade em `/atividades`, consulte o bloco **"Interfaces de Coordenação Interdisciplinares"**. Ele lista todas as interfaces catalogadas para o capítulo, indicando os grupos parceiros, o status do alinhamento e eventuais bloqueios.

### P5: Minha minuta está no Google Drive / Teams. Como submeter?
**R:** Na Estação de Revisão, você pode colar o link compartilhável (Google Drive, Microsoft Teams, OneDrive ou Dropbox) no campo de endereço de nuvem, além de anexar arquivos PDF/DOCX se preferir. Certifique-se de que as permissões de acesso do link permitam leitura pelos revisores e coordenadores.

### P6: Quem define quando o capítulo está pronto para entrega ao BNDES?
**R:** A entrega oficial é prerrogativa da **Coordenação Geral e Administradores**, após a homologação do coordenador do capítulo, a resolução das interfaces prioritárias e a aprovação unânime de todos os revisores técnicos independentes designados.

---

## 10. Canais de Suporte e Apoio

Em caso de dúvidas operacionais, dificuldades de acesso ou inconsistências no sistema:
- **Suporte da Plataforma**: Contate o administrador do sistema pelo menu suspenso de perfil ou pelo e-mail institucional da coordenação.
- **Coordenação Técnica do Estudo**: Alinhamentos de metodologia e escopo devem ser direcionados ao coordenador do seu respectivo grupo temático.
