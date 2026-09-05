# ⚓ Portal de Gestão do Estudo BNDES — Indústria Naval (v2.0)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg?logo=react)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-38b2ac.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![tRPC](https://img.shields.io/badge/tRPC-11.x-2596be.svg?logo=trpc)](https://trpc.io/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-c5f74f.svg?logo=drizzle)](https://orm.drizzle.team/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646cff.svg?logo=vite)](https://vitejs.dev/)
[![Vitest](https://img.shields.io/badge/Tests-105%20passed-success.svg?logo=vitest)](https://vitest.dev/)

Plataforma integrada de **governança, planejamento executivo, controle de interfaces, pesquisa de campo e gestão documental** desenvolvida para a execução e monitoramento do Estudo Técnico do **BNDES** para a retomada e reestruturação da Indústria Naval Brasileira.

---

## 📋 Sumário

- [Visão Geral e Objetivos](#-visão-geral-e-objetivos)
- [Principais Módulos do Sistema](#-principais-módulos-do-sistema)
  - [1. Painel Executivo e Indicadores (Dashboard)](#1-painel-executivo-e-indicadores-dashboard)
  - [2. Plano de Atividades e Fichas Técnicas](#2-plano-de-atividades-e-fichas-técnicas)
  - [3. Linha do Tempo e Cronograma Mestre (M1–M6)](#3-linha-do-tempo-e-cronograma-mestre-m1m6)
  - [4. Controle de Interfaces Técnicas (G1–G11)](#4-controle-de-interfaces-técnicas-g1g11)
  - [5. Pesquisa de Campo e Entrevistas](#5-pesquisa-de-campo-e-entrevistas)
  - [6. Acervo e Biblioteca Digital](#6-acervo-e-biblioteca-digital)
  - [7. Governança e Administração de Acessos](#7-governança-e-administração-de-acessos)
- [Estrutura do Estudo e Tomos](#-estrutura-do-estudo-e-tomos)
- [Arquitetura de Software e Tecnologias](#-arquitetura-de-software-e-tecnologias)
- [Instalação e Execução Local](#-instalação-e-execução-local)
- [Suíte de Testes e Qualidade](#-suíte-de-testes-e-qualidade)
- [Estrutura de Diretórios](#-estrutura-de-diretórios)
- [Equipe e Governança](#-equipe-e-governança)

---

## 🎯 Visão Geral e Objetivos

O **Portal de Gestão do Estudo BNDES** foi concebido para fornecer uma camada unificada de coordenação institucional entre a equipe executiva (coordenadores e pesquisadores da **COPPE/UFRJ**, **IPT**, **FGV**, **SOBENA**) e o **BNDES**.

### Principais Diretrizes:
1. **Reconciliação Canônica**: Alinhamento estrito ao Índice Analítico oficial (30 seções estruturadas nos Tomos I a IV e Apresentação).
2. **Rastreabilidade de Entregáveis**: Acompanhamento de 328+ atividades detalhadas com prazos, responsáveis funcionais, marcos intermediários e dependências.
3. **Gestão de Interfaces Cruzadas**: Detecção e mediação de interfaces técnicas entre frentes de trabalho (G1 a G11).
4. **Governança com Perfis de Acesso**: Níveis de permissão rigorosos (*Administrador*, *Coordenador*, *Executor*) com auditoria completa de eventos.

---

## 🚀 Principais Módulos do Sistema

### 1. Painel Executivo e Indicadores (`/`)
- Panorama em tempo real das entregas globais e progresso ponderado por Tomo.
- Monitoramento de prazos críticos (atividades atrasadas, prazos nos próximos 7 dias e sobreposições de alocação).
- Distribuição de atividades por frentes técnicas (G1 a G11) e próximos entregáveis.
- Acesso rápido aos atalhos institucionais e arquivos de evidência.

### 2. Plano de Atividades e Fichas Técnicas (`/atividades`)
- Catálogo hierárquico com visualização por Tomo, Grupo e Responsável.
- **Ficha Completa da Atividade**:
  - Código canônico, título executivo e objetivo detalhado;
  - Liderança de execução e equipe alocada;
  - Datas de início, término e marcos intermediários com controle de status;
  - Histórico de revisões e notas institucionais;
  - Associação de interfaces e documentos de referência.

### 3. Linha do Tempo e Cronograma Mestre (`/calendario`)
- Visualização compacta tipo **Gantt Executivo** cobrindo os 6 meses de execução (M1 a M6).
- **Alinhamento Rigoroso em Grade CSS**: Sincronia perfeita entre colunas de cabeçalho, dados e linha do tempo.
- **Agrupamento por Seções / Capítulos**: Organização pelos 30 capítulos oficiais com acordeão (*Expandir Todos* / *Recolher Todos* ou toggle por seção).
- **Títulos Clicáveis**: Acesso direto à ficha técnica detalhada da atividade.
- **Exportação de Relatórios**: Geração instantânea em imagens PNG de alta resolução e documentos PDF paisagem.

### 4. Controle de Interfaces Técnicas (`/interfaces`)
- Monitoramento de dependências metodológicas e cruzamento de dados entre diferentes grupos executivos (ex.: G1 Macroeconomia ↔ G4 Construção Naval).
- Registro formal de interfaces identificadas com fluxo de status (*Identificada*, *Em Análise*, *Alinhada*, *Resolvida*).
- Checklists de validação conjunta e designação de coordenadores responsáveis por cada interface.

### 5. Pesquisa de Campo e Entrevistas (`/campo`)
- Mapeamento e gestão de visitas a estaleiros, portos, armadores e órgãos reguladores.
- Cadastro de entidades, interlocutores-chave e cronograma de campo.
- Repositório de atas, roteiros de entrevista, áudios/transcrições e evidências documentais com controle de privacidade.

### 6. Acervo e Biblioteca Digital (`/biblioteca`)
- Catálogo de **328 referências bibliográficas**, estudos setoriais, relatórios anteriores (FGV, IPT, SOBENA, COPPE 2005) e legislação.
- Filtros dinâmicos por Tomo, Grupo e Categoria documental com busca textual instantânea.
- Matriz de vínculo entre referências bibliográficas e capítulos do estudo.

### 7. Governança e Administração de Acessos (`/administracao` e `/usuarios-permissoes`)
- Gestão completa de usuários, instituições parceiras e grupos de trabalho (G1 a G11).
- **Instruções de Primeiro Acesso Automatizadas**:
  - Disparo de e-mail institucional e mensagem padronizada com link de ativação;
  - Modal interativo para pré-visualização e cópia rápida de link e texto;
  - Auditoria de envio registrada no histórico de segurança.
- Alternância dinâmica de papéis em ambiente de desenvolvimento para teste de experiência de usuário (UX).

---

## 📚 Estrutura do Estudo e Tomos

| Tomo | Denominação | Escopo Temático Principal |
| :--- | :--- | :--- |
| **AP** | **Apresentação e Metodologia** | Metodologia, alinhamento institucional e estrutura do projeto. |
| **Tomo I** | **Comércio e Transporte Marítimo** | Macroeconomia marítima, cabotagem, longo curso e navegação interior. |
| **Tomo II** | **Indústria da Construção Naval** | Estaleiros nacionais, capacidade produtiva, cadeia de suprimentos e custos. |
| **Tomo III** | **Transição Energética e Inovação** | Descarbonização naval, combustíveis alternativos (metanol, amônia, hidrogênio, elétricos). |
| **Tomo IV** | **Políticas Públicas e Financiamento** | Fundo da Marinha Mercante (FMM), garantias financeiras, incentivos e regulação. |

---

## 🛠️ Arquitetura de Software e Tecnologias

```
                           ┌─────────────────────────────────────────┐
                           │               CLIENT (SPA)              │
                           │   React 18 + Vite + Tailwind CSS v4     │
                           │   Radix UI + Lucide Icons + Wouter      │
                           └────────────────────┬────────────────────┘
                                                │  tRPC / JSON
                                                ▼
                           ┌─────────────────────────────────────────┐
                           │             SERVER (Node.js)            │
                           │    Express + tRPC Server + TypeScript   │
                           │   Modular Routers (Activities, Team,    │
                           │    Interfaces, Fieldwork, Governance)   │
                           └────────────────────┬────────────────────┘
                                                │  SQL / ORM
                                                ▼
                           ┌─────────────────────────────────────────┐
                           │             DATABASE LAYER              │
                           │   Drizzle ORM + Local In-Memory MySQL   │
                           │      (Ready for Cloud SQL / MySQL)      │
                           └─────────────────────────────────────────┘
```

- **Frontend**: React 18, Vite 6, Tailwind CSS v4, Lucide Icons, Wouter (Routing), TanStack Query v5.
- **Backend / API**: Node.js, Express, tRPC v11 (Type-Safe RPC), Zod (validação de schemas).
- **Persistência**: Drizzle ORM, schema relacional estruturado, motor embedded in-memory MySQL para desenvolvimento e suporte a MySQL/PostgreSQL em produção.
- **Exportação e Gráficos**: `html2canvas`, `jspdf`, `recharts`.
- **Testes**: Vitest, React Testing Library, JSDOM.

---

## 💻 Instalação e Execução Local

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18.x ou superior
- Gerenciador de pacotes `npm` ou `pnpm`

### Passos de Execução

1. **Clonar o Repositório**:
   ```bash
   git clone https://github.com/communitypower/Portal-BNDES.git
   cd Portal-BNDES/"App Gestão Estudo BNDES/app gestão bndes v2.0"
   ```

2. **Instalar as Dependências**:
   ```bash
   npm install
   ```

3. **Iniciar o Servidor de Desenvolvimento**:
   ```bash
   npm run dev
   ```
   *O portal estará disponível em: `http://localhost:3000`*

4. **Verificação de Tipos (TypeScript)**:
   ```bash
   npx tsc --noEmit
   ```

---

## 🧪 Suíte de Testes e Qualidade

O projeto conta com uma suíte abrangente de testes automatizados unitários e de integração:

```bash
# Executar todos os testes
npx vitest run

# Executar testes em modo watch
npx vitest
```

**Métricas de Qualidade**:
- **105 testes automatizados** cobrindo routers, controle de acesso, renderização de cronograma, fichas de atividade e fluxos de interface.
- **100% de aprovação** em todos os 27 arquivos de teste.

---

## 📁 Estrutura de Diretórios

```
app gestão bndes v2.0/
├── client/                     # Aplicação Frontend
│   └── src/
│       ├── components/         # Componentes reutilizáveis (UI, Fichas, Layout)
│       ├── lib/                # Funções utilitárias, formatação e cliente tRPC
│       ├── pages/              # Páginas e views da aplicação
│       │   ├── Activities.tsx  # Plano e Fichas de Atividades
│       │   ├── Calendar.tsx    # Linha do Tempo e Cronograma Mestre
│       │   ├── Dashboard.tsx   # Painel Executivo e KPIs
│       │   ├── Interfaces.tsx  # Controle de Interfaces Técnicas
│       │   ├── Fieldwork.tsx   # Gestão da Pesquisa de Campo
│       │   ├── Library.tsx     # Acervo e Biblioteca Digital
│       │   └── ...
│       └── App.tsx             # Roteamento e Provedores Globais
├── server/                     # Backend e API
│   ├── _core/                  # Configurações de servidor, ambiente e tRPC
│   ├── routers/                # Roteadores modulares (atividades, equipe, interfaces)
│   ├── db.ts                   # Camada de banco de dados e queries Drizzle
│   └── localDb.ts              # Driver de banco local e sementes iniciais
├── shared/                     # Código compartilhado entre Client e Server
│   ├── domain.ts               # Constantes de domínio, grupos e tomos
│   ├── pdfAnalyticIndex.ts     # Índice canônico das 30 seções oficiais
│   ├── identifiedInterfacesSeed.ts # Catálogo estruturado de interfaces
│   └── types.ts                # Definições de tipos TypeScript
├── drizzle/                    # Esquemas e migrações do banco
│   └── schema.ts               # Modelos relacionais Drizzle
└── package.json                # Dependências e scripts do projeto
```

---

## 👥 Equipe e Governança

- **Financiador**: Banco Nacional de Desenvolvimento Econômico e Social (**BNDES**)
- **Instituição Coordenadora**: Universidade Federal do Rio de Janeiro (**COPPE/UFRJ**)
- **Instituições Parceiras**: **IPT**, **FGV**, **SOBENA**
- **Coordenação Geral**: Prof. Floriano Carlos Martins Pires

---

*Portal de Gestão do Estudo BNDES — Indústria Naval · Versão 2.0 (2026)*
