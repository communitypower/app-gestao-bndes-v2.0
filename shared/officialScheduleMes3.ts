/**
 * Cronograma Oficial do Estudo (Relatório 1)
 * Fonte: cronograma_R1 (Revisão Master BNDES - Padrão Dia 15)
 */

export interface MonthMilestone {
  month: number;
  label: string;
  startDate: string;
  dueDate: string;
  startAt: number;
  dueAt: number;
}

export const OFFICIAL_MONTH_MILESTONES: ReadonlyArray<MonthMilestone> = [
  { month: 1, label: "M1", startDate: "2026-08-16", dueDate: "2026-09-15", startAt: 1786838400000, dueAt: 1789516799000 },
  { month: 2, label: "M2", startDate: "2026-09-16", dueDate: "2026-10-15", startAt: 1789516800000, dueAt: 1792108799000 },
  { month: 3, label: "M3", startDate: "2026-10-16", dueDate: "2026-11-15", startAt: 1792108800000, dueAt: 1794787199000 },
  { month: 4, label: "M4", startDate: "2026-11-16", dueDate: "2026-12-15", startAt: 1794787200000, dueAt: 1797379199000 },
  { month: 5, label: "M5", startDate: "2026-12-16", dueDate: "2027-01-15", startAt: 1797379200000, dueAt: 1800057599000 },
  { month: 6, label: "M6", startDate: "2027-01-16", dueDate: "2027-02-15", startAt: 1800057600000, dueAt: 1802735999000 },
  { month: 7, label: "M7", startDate: "2027-02-16", dueDate: "2027-03-15", startAt: 1802736000000, dueAt: 1805155199000 },
] as const;

export interface ScheduleSectionItem {
  detailCode: string;
  title: string;
  tome: string;
  startMonth: number;
  endMonth: number;
  activeMonths: number[];
  startDate: string;
  dueDate: string;
  startAt: number;
  dueAt: number;
  group?: string | null;
}

export interface ScheduleChapterItem {
  code: string;
  title: string;
  tome: string;
  startMonth: number;
  endMonth: number;
  activeMonths: number[];
  startDate: string;
  dueDate: string;
  startAt: number;
  dueAt: number;
  group?: string | null;
}

export const OFFICIAL_SCHEDULE_MES3_SECTIONS: ReadonlyArray<ScheduleSectionItem> = [
  {
    "detailCode": "I.1.1",
    "title": "Objetivos",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G1"
  },
  {
    "detailCode": "I.1.2",
    "title": "Escopo setorial, temporal e geográfico",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G1"
  },
  {
    "detailCode": "I.1.3",
    "title": "Metodologia e fontes de informação",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G1"
  },
  {
    "detailCode": "I.1.4",
    "title": "Estrutura do relatório e articulação entre os tomos",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G1"
  },
  {
    "detailCode": "I.2.1",
    "title": "Conceito e delimitação da economia marítima",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G1"
  },
  {
    "detailCode": "I.2.2",
    "title": "Interdependências entre a construção naval e demais setores marítimos",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G1"
  },
  {
    "detailCode": "I.2.3",
    "title": "Relevância estratégica e econômica da economia marítima",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G1"
  },
  {
    "detailCode": "I.2.4",
    "title": "Vetores de transformação: geopolítica, transição energética, cadeias globais e regulação ambiental",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 5,
    "activeMonths": [
      1,
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-08-16",
    "dueDate": "2027-01-15",
    "startAt": 1786838400000,
    "dueAt": 1800057599000,
    "group": "G1"
  },
  {
    "detailCode": "I.3.1",
    "title": "Evolução do comércio e do transporte marítimo mundial",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G4"
  },
  {
    "detailCode": "I.3.2",
    "title": "Regulamentação internacional do transporte marítimo",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G4"
  },
  {
    "detailCode": "I.3.3",
    "title": "Principais tipos de embarcações: aspectos tecnológicos e operacionais",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G4"
  },
  {
    "detailCode": "I.3.4",
    "title": "Estrutura e evolução da frota mercante",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G4"
  },
  {
    "detailCode": "I.3.5",
    "title": "Mercado de transporte de granéis líquidos, gases liquefeitos e produtos químicos",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G4"
  },
  {
    "detailCode": "I.3.6",
    "title": "Mercado de transporte de granéis sólidos",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G4"
  },
  {
    "detailCode": "I.3.7",
    "title": "Mercado de transporte de contêineres",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G4"
  },
  {
    "detailCode": "I.3.8",
    "title": "Outros segmentos: veículos, cargas de projeto, apoio marítimo e portuário",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G4"
  },
  {
    "detailCode": "I.3.9",
    "title": "Evolução dos preços, fretes e condições de mercado",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G4"
  },
  {
    "detailCode": "I.3.10",
    "title": "Carteira de encomendas, renovação da frota e perspectivas de demanda por novas embarcações",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 4,
    "activeMonths": [
      3,
      4
    ],
    "startDate": "2026-10-16",
    "dueDate": "2026-12-15",
    "startAt": 1792108800000,
    "dueAt": 1797379199000,
    "group": "G4"
  },
  {
    "detailCode": "I.3.11",
    "title": "Fatores econômicos, geopolíticos e ambientais que condicionam a expansão, renovação e transformação tecnológica das frotas",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 4,
    "activeMonths": [
      3,
      4
    ],
    "startDate": "2026-10-16",
    "dueDate": "2026-12-15",
    "startAt": 1792108800000,
    "dueAt": 1797379199000,
    "group": "G4"
  },
  {
    "detailCode": "I.3.12",
    "title": "Perspectivas do transporte marítimo mundial e implicações para a marinha mercante e a indústria naval brasileiras",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 4,
    "activeMonths": [
      3,
      4
    ],
    "startDate": "2026-10-16",
    "dueDate": "2026-12-15",
    "startAt": 1792108800000,
    "dueAt": 1797379199000,
    "group": "G4"
  },
  {
    "detailCode": "I.4.1",
    "title": "Evolução da marinha mercante brasileira",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G4"
  },
  {
    "detailCode": "I.4.2",
    "title": "Principais fluxos de transporte marítimo de cabotagem e longo curso",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G4"
  },
  {
    "detailCode": "I.4.3",
    "title": "Regulamentação do transporte marítimo no Brasil",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G4"
  },
  {
    "detailCode": "I.4.4",
    "title": "Estrutura e organização dos mercados: empresas, frotas, bandeiras e afretamento",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G4"
  },
  {
    "detailCode": "I.4.5",
    "title": "Integração às redes mundiais de transporte marítimo",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "I.4.6",
    "title": "Apoio portuário e apoio marítimo",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "I.4.7",
    "title": "Custos diferenciais da bandeira brasileira",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "I.4.8",
    "title": "Panorama do setor pesqueiro",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "I.4.9",
    "title": "Cenários de demanda para construção, reparo, conversão e modernização de navios e embarcações de apoio",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 4,
    "activeMonths": [
      3,
      4
    ],
    "startDate": "2026-10-16",
    "dueDate": "2026-12-15",
    "startAt": 1792108800000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "I.5.1",
    "title": "Principais bacias e sistemas de navegação interior no Brasil",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G4"
  },
  {
    "detailCode": "I.5.2",
    "title": "Regulamentação da navegação interior",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G4"
  },
  {
    "detailCode": "I.5.3",
    "title": "Principais tipos de embarcações: aspectos tecnológicos e operacionais",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G4"
  },
  {
    "detailCode": "I.5.4",
    "title": "Infraestrutura e condições de navegabilidade",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G7"
  },
  {
    "detailCode": "I.5.5",
    "title": "Fluxos e estrutura das operações",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G7"
  },
  {
    "detailCode": "I.5.6",
    "title": "Empresas e frotas",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G7"
  },
  {
    "detailCode": "I.5.7",
    "title": "Transporte multimodal",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G7"
  },
  {
    "detailCode": "I.5.8",
    "title": "Navegação fluvial de percurso internacional",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G7"
  },
  {
    "detailCode": "I.5.9",
    "title": "Transporte de passageiros na Região Amazônica",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G7"
  },
  {
    "detailCode": "I.5.10",
    "title": "Transporte hidroviário urbano",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G7"
  },
  {
    "detailCode": "I.5.11",
    "title": "Navegação interior e desenvolvimento regional",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G7 + G1"
  },
  {
    "detailCode": "I.5.12",
    "title": "Cenários de demanda para construção de embarcações fluviais",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 5,
    "activeMonths": [
      4,
      5
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-01-15",
    "startAt": 1794787200000,
    "dueAt": 1800057599000,
    "group": "G7"
  },
  {
    "detailCode": "I.6.1",
    "title": "Evolução e perspectivas da indústria mundial de óleo e gás offshore",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G6"
  },
  {
    "detailCode": "I.6.2",
    "title": "Marcos regulatórios nos principais polos",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G6"
  },
  {
    "detailCode": "I.6.3",
    "title": "Principais tipos de unidades flutuantes de exploração e produção: aspectos tecnológicos e operacionais",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G6"
  },
  {
    "detailCode": "I.6.4",
    "title": "Mercado internacional de unidades de exploração e produção offshore: demanda, oferta, formas de contratação e preços",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G6"
  },
  {
    "detailCode": "I.6.5",
    "title": "Embarcações de apoio e aliviadores: aspectos tecnológicos e operacionais",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G6 + G4"
  },
  {
    "detailCode": "I.6.6",
    "title": "Mercado internacional de embarcações de apoio e aliviadores: regiões de operação, demanda, oferta, formas de contratação e preços",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G6 + G4"
  },
  {
    "detailCode": "I.6.7",
    "title": "Atividade offshore no Brasil: campos, empresas e perspectivas",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G6"
  },
  {
    "detailCode": "I.6.8",
    "title": "Frota e demanda por unidades flutuantes de produção e sondas no Brasil",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G6"
  },
  {
    "detailCode": "I.6.9",
    "title": "Cenários de demanda de E&P no Brasil: construção, fabricação e integração de módulos e descomissionamento",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G6"
  },
  {
    "detailCode": "I.6.10",
    "title": "Mercado brasileiro de navios aliviadores e embarcações de apoio offshore",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G6 + G3"
  },
  {
    "detailCode": "I.6.11",
    "title": "O setor de geração eólica offshore no Brasil: evolução, perspectivas e regulamentação",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 5,
    "activeMonths": [
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-09-16",
    "dueDate": "2027-01-15",
    "startAt": 1789516800000,
    "dueAt": 1800057599000,
    "group": "G6"
  },
  {
    "detailCode": "I.6.12",
    "title": "Tipos de instalações e embarcações para energia eólica offshore: aspectos tecnológicos e operacionais",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G6"
  },
  {
    "detailCode": "I.6.13",
    "title": "Cenários de demanda por navios aliviadores, embarcações de apoio especializadas e instalações de geração eólica offshore no Brasil",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 5,
    "activeMonths": [
      4,
      5
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-01-15",
    "startAt": 1794787200000,
    "dueAt": 1800057599000,
    "group": "G6"
  },
  {
    "detailCode": "I.7.1",
    "title": "Construção naval militar no mundo: políticas navais e modelos de governança",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 2,
    "activeMonths": [
      1,
      2
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-10-15",
    "startAt": 1786838400000,
    "dueAt": 1792108799000,
    "group": "G9"
  },
  {
    "detailCode": "I.7.2",
    "title": "Principais tipos de navios e embarcações militares: aspectos tecnológicos e operacionais",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 2,
    "activeMonths": [
      1,
      2
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-10-15",
    "startAt": 1786838400000,
    "dueAt": 1792108799000,
    "group": "G9"
  },
  {
    "detailCode": "I.7.3",
    "title": "Evolução da construção naval militar no Brasil",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 2,
    "activeMonths": [
      1,
      2
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-10-15",
    "startAt": 1786838400000,
    "dueAt": 1792108799000,
    "group": "G9"
  },
  {
    "detailCode": "I.7.4",
    "title": "Programas navais em curso e previstos",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 3,
    "activeMonths": [
      2,
      3
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-11-15",
    "startAt": 1789516800000,
    "dueAt": 1794787199000,
    "group": "G9"
  },
  {
    "detailCode": "I.7.5",
    "title": "Programas de offset, clusters navais e estratégias de inovação",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G9"
  },
  {
    "detailCode": "I.7.6",
    "title": "Participação da indústria local e processos de transferência de tecnologia",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G9"
  },
  {
    "detailCode": "I.7.7",
    "title": "Gargalos econômicos, produtivos e tecnológicos",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 4,
    "activeMonths": [
      3,
      4
    ],
    "startDate": "2026-10-16",
    "dueDate": "2026-12-15",
    "startAt": 1792108800000,
    "dueAt": 1797379199000,
    "group": "G9"
  },
  {
    "detailCode": "I.7.8",
    "title": "Oportunidades para inserção nas cadeias globais",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 4,
    "activeMonths": [
      3,
      4
    ],
    "startDate": "2026-10-16",
    "dueDate": "2026-12-15",
    "startAt": 1792108800000,
    "dueAt": 1797379199000,
    "group": "G9"
  },
  {
    "detailCode": "I.8.1",
    "title": "Direcionadores globais, metas e regulamentação internacional da descarbonização marítima",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 1,
    "activeMonths": [
      1
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-09-15",
    "startAt": 1786838400000,
    "dueAt": 1789516799000,
    "group": "G8"
  },
  {
    "detailCode": "I.8.2",
    "title": "Estratégias de descarbonização nos principais países e regiões",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G8"
  },
  {
    "detailCode": "I.8.3",
    "title": "Respostas de armadores, operadores, portos e fornecedores de energia à descarbonização",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G8"
  },
  {
    "detailCode": "I.8.4",
    "title": "Combustíveis marítimos alternativos: características, disponibilidade, custos e perspectivas",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G8"
  },
  {
    "detailCode": "I.8.5",
    "title": "Tecnologias de eficiência energética e redução de emissões: casco, propulsão, sistemas de controle e digitalização",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G8"
  },
  {
    "detailCode": "I.8.6",
    "title": "Maturidade tecnológica, custos e perspectivas de adoção das tecnologias de descarbonização",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G8"
  },
  {
    "detailCode": "I.8.7",
    "title": "Frota mundial: adoção de combustíveis alternativos e tecnologias de eficiência energética por segmento, país e perfil de empresa",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 3,
    "activeMonths": [
      2,
      3
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-11-15",
    "startAt": 1789516800000,
    "dueAt": 1794787199000,
    "group": "G8"
  },
  {
    "detailCode": "I.8.8",
    "title": "Impactos da descarbonização sobre os mercados, renovação da frota e demanda por novas embarcações e retrofitting",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 5,
    "activeMonths": [
      4,
      5
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-01-15",
    "startAt": 1794787200000,
    "dueAt": 1800057599000,
    "group": "G8"
  },
  {
    "detailCode": "I.8.9",
    "title": "Frota brasileira: estratégias de descarbonização dos armadores",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G8"
  },
  {
    "detailCode": "I.8.10",
    "title": "Potencial competitivo do Brasil na produção e utilização de combustíveis marítimos renováveis",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 5,
    "activeMonths": [
      4,
      5
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-01-15",
    "startAt": 1794787200000,
    "dueAt": 1800057599000,
    "group": "G8"
  },
  {
    "detailCode": "I.8.11",
    "title": "Infraestrutura de abastecimento, bunkering, portos e corredores verdes",
    "tome": "Tomo I",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 5,
    "activeMonths": [
      4,
      5
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-01-15",
    "startAt": 1794787200000,
    "dueAt": 1800057599000,
    "group": "G8"
  },
  {
    "detailCode": "II.1.1",
    "title": "Análise da trajetória e da estrutura atual da construção naval mundial",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G10"
  },
  {
    "detailCode": "II.1.2",
    "title": "Evolução da produção, da capacidade dos estaleiros e dos padrões de produção",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G10"
  },
  {
    "detailCode": "II.1.3",
    "title": "Segmentos da indústria naval: navios mercantes, offshore, apoio marítimo, defesa e outros",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G10"
  },
  {
    "detailCode": "II.1.4",
    "title": "Principais estaleiros e organizações empresariais: estatais e privados, grupos de estaleiros, verticalização e escala",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G10"
  },
  {
    "detailCode": "II.1.5",
    "title": "Protecionismo e fatores de competitividade",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G10 + G3"
  },
  {
    "detailCode": "II.1.6",
    "title": "Estrutura e integração da cadeia produtiva",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G10"
  },
  {
    "detailCode": "II.1.7",
    "title": "Transformações ambientais, tecnológicas e geopolíticas e tendências da construção naval mundial",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G10"
  },
  {
    "detailCode": "II.2.1",
    "title": "Dimensões de análise das experiências nacionais: protecionismo; evolução da indústria; estrutura empresarial; especialização; qualificação tecnológica; recursos humanos; cadeia de fornecedores; inserção internacional; evolução da produtividade; competitividade; resultados produtivos; estratégias de desenvolvimento tecnológico e catching-up",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 2,
    "activeMonths": [
      1,
      2
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-10-15",
    "startAt": 1786838400000,
    "dueAt": 1792108799000,
    "group": "G1 + G3"
  },
  {
    "detailCode": "II.2.2",
    "title": "Japão",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G1 + G3"
  },
  {
    "detailCode": "II.2.3",
    "title": "Coreia do Sul",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G1 + G3"
  },
  {
    "detailCode": "II.2.4",
    "title": "China",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G1 + G3"
  },
  {
    "detailCode": "II.2.5",
    "title": "Singapura",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G1 + G3"
  },
  {
    "detailCode": "II.2.6",
    "title": "Estados Unidos",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G1 + G3"
  },
  {
    "detailCode": "II.2.7",
    "title": "Países europeus selecionados",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G1 + G3"
  },
  {
    "detailCode": "II.2.8",
    "title": "Índia",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G1 + G3"
  },
  {
    "detailCode": "II.2.9",
    "title": "Vietnã",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G1 + G3"
  },
  {
    "detailCode": "II.2.10",
    "title": "Indonésia",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G1 + G3"
  },
  {
    "detailCode": "II.2.11",
    "title": "Outros produtores emergentes",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 5,
    "activeMonths": [
      4,
      5
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-01-15",
    "startAt": 1794787200000,
    "dueAt": 1800057599000,
    "group": "G1 + G3"
  },
  {
    "detailCode": "II.3.1",
    "title": "Antecedentes e formação da indústria naval moderna brasileira",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G1"
  },
  {
    "detailCode": "II.3.2",
    "title": "O ciclo das décadas de 1970 e 1980",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G1"
  },
  {
    "detailCode": "II.3.3",
    "title": "O ciclo das décadas de 2000 e 2010",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G1"
  },
  {
    "detailCode": "II.3.4",
    "title": "Evolução da construção de navios e embarcações",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G1"
  },
  {
    "detailCode": "II.3.5",
    "title": "Evolução da construção de unidades offshore, fabricação de módulos, integração e comissionamento",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G1"
  },
  {
    "detailCode": "II.3.6",
    "title": "Evolução da construção naval militar",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G1"
  },
  {
    "detailCode": "II.3.7",
    "title": "Evolução da estrutura industrial: empresas, capacidade produtiva, distribuição geográfica e cadeia de fornecedores",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G1"
  },
  {
    "detailCode": "II.3.8",
    "title": "Evolução da qualificação tecnológica e dos recursos humanos",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G1"
  },
  {
    "detailCode": "II.3.9",
    "title": "Contratos, produção realizada, preços, prazos e desempenho",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 4,
    "activeMonths": [
      3,
      4
    ],
    "startDate": "2026-10-16",
    "dueDate": "2026-12-15",
    "startAt": 1792108800000,
    "dueAt": 1797379199000,
    "group": "G1"
  },
  {
    "detailCode": "II.3.10",
    "title": "Fatores econômicos, empresariais, tecnológicos, regulatórios e institucionais associados aos ciclos de expansão e retração",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 4,
    "activeMonths": [
      3,
      4
    ],
    "startDate": "2026-10-16",
    "dueDate": "2026-12-15",
    "startAt": 1792108800000,
    "dueAt": 1797379199000,
    "group": "G1"
  },
  {
    "detailCode": "II.4.1",
    "title": "Dimensões de análise dos estaleiros e instalações: evolução das instalações, organização corporativa, capacidade, produção e desempenho; estrutura e situação atuais; segmentos de atuação; carteiras de encomendas; engenharia de projeto e de processos; infraestrutura industrial; processos produtivos; organização e gestão; potencial de reativação, modernização e adaptação",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 2,
    "activeMonths": [
      1,
      2
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-10-15",
    "startAt": 1786838400000,
    "dueAt": 1792108799000,
    "group": "G11"
  },
  {
    "detailCode": "II.4.2",
    "title": "Estaleiros de construção de navios e embarcações",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 5,
    "activeMonths": [
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-09-16",
    "dueDate": "2027-01-15",
    "startAt": 1789516800000,
    "dueAt": 1800057599000,
    "group": "G11"
  },
  {
    "detailCode": "II.4.3",
    "title": "Estaleiros de construção de embarcações fluviais",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 5,
    "activeMonths": [
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-09-16",
    "dueDate": "2027-01-15",
    "startAt": 1789516800000,
    "dueAt": 1800057599000,
    "group": "G11 +G7"
  },
  {
    "detailCode": "II.4.4",
    "title": "Estaleiros e instalações para construção de unidades offshore, fabricação e integração de módulos",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 5,
    "activeMonths": [
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-09-16",
    "dueDate": "2027-01-15",
    "startAt": 1789516800000,
    "dueAt": 1800057599000,
    "group": "G11 + G6"
  },
  {
    "detailCode": "II.4.5",
    "title": "Estaleiros de construção naval militar",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 5,
    "activeMonths": [
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-09-16",
    "dueDate": "2027-01-15",
    "startAt": 1789516800000,
    "dueAt": 1800057599000,
    "group": "G11 + G9"
  },
  {
    "detailCode": "II.4.6",
    "title": "Cadeia produtiva, por tipo de produto e região",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 5,
    "activeMonths": [
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-09-16",
    "dueDate": "2027-01-15",
    "startAt": 1789516800000,
    "dueAt": 1800057599000,
    "group": "G11 + G2"
  },
  {
    "detailCode": "II.4.7",
    "title": "Economias e deseconomias de localização e os polos navais",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G1"
  },
  {
    "detailCode": "II.5.1",
    "title": "Reparo naval: características do mercado mundial e principais polos",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G1"
  },
  {
    "detailCode": "II.5.2",
    "title": "Estaleiros de construção e de reparo: diferenças estruturais, tecnológicas e operacionais",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G11"
  },
  {
    "detailCode": "II.5.3",
    "title": "Regulamentação internacional do desmantelamento e reciclagem de navios: Convenção de Hong Kong e requisitos ambientais",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G11 + G9 + G6"
  },
  {
    "detailCode": "II.5.4",
    "title": "Mercado mundial de desmantelamento e reciclagem de navios: estrutura, principais polos e tendências",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G11 + G9"
  },
  {
    "detailCode": "II.5.5",
    "title": "Descomissionamento de unidades offshore: características, regulamentação e mercado mundial",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G11 + G6"
  },
  {
    "detailCode": "II.5.6",
    "title": "Regulamentação brasileira do desmantelamento e reciclagem de navios e plataformas",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G11 + G9"
  },
  {
    "detailCode": "II.5.7",
    "title": "Demanda brasileira por reparo, docagem e retrofitting de embarcações",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G4 + G8"
  },
  {
    "detailCode": "II.5.8",
    "title": "Demanda brasileira por reparo, conversão e descomissionamento de unidades offshore",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G6"
  },
  {
    "detailCode": "II.5.9",
    "title": "Empresas, instalações e capacidade nacional para reparo, conversão, desmantelamento e descomissionamento",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G11"
  },
  {
    "detailCode": "II.5.10",
    "title": "Competição internacional e competitividade das atividades no Brasil",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 5,
    "activeMonths": [
      4,
      5
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-01-15",
    "startAt": 1794787200000,
    "dueAt": 1800057599000,
    "group": "G11 + G1"
  },
  {
    "detailCode": "II.5.11",
    "title": "Desafios e oportunidades para reparo, retrofitting, desmantelamento e descomissionamento no Brasil",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 5,
    "activeMonths": [
      4,
      5
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-01-15",
    "startAt": 1794787200000,
    "dueAt": 1800057599000,
    "group": "G11 + G1"
  },
  {
    "detailCode": "II.6.1",
    "title": "Estrutura da cadeia produtiva da construção naval: principais segmentos, produtos e relações entre estaleiros e fornecedores",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 2,
    "activeMonths": [
      1,
      2
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-10-15",
    "startAt": 1786838400000,
    "dueAt": 1792108799000,
    "group": "G2 + G11"
  },
  {
    "detailCode": "II.6.2",
    "title": "Perfil de nacionalização de componentes nos principais países produtores de navios",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G10"
  },
  {
    "detailCode": "II.6.3",
    "title": "Indústrias de materiais, equipamentos e sistemas navais nos principais países produtores",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G2"
  },
  {
    "detailCode": "II.6.4",
    "title": "Evolução do conteúdo nacional e da cadeia de fornecedores nas diferentes fases da indústria naval brasileira",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G10"
  },
  {
    "detailCode": "II.6.5",
    "title": "Estrutura atual da cadeia de fornecedores da indústria naval brasileira",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G10 + G11 + G2"
  },
  {
    "detailCode": "II.6.6",
    "title": "Cadeia de fornecedores por segmento: construção de navios, embarcações fluviais, offshore e construção naval militar",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G11"
  },
  {
    "detailCode": "II.6.7",
    "title": "Distribuição regional e capacidade dos fornecedores nacionais",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G11 + G2"
  },
  {
    "detailCode": "II.6.8",
    "title": "Conteúdo nacional, dependências externas e lacunas produtivas e tecnológicas",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G2"
  },
  {
    "detailCode": "II.6.9",
    "title": "Relações entre estaleiros e fornecedores e formas de organização da cadeia de suprimentos",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G2"
  },
  {
    "detailCode": "II.6.10",
    "title": "Desafios e oportunidades para a estaleiros brasileiros",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 5,
    "endMonth": 6,
    "activeMonths": [
      5,
      6
    ],
    "startDate": "2026-12-16",
    "dueDate": "2027-02-15",
    "startAt": 1797379200000,
    "dueAt": 1802735999000,
    "group": "G2"
  },
  {
    "detailCode": "II.7.1",
    "title": "Capacitação dos estaleiros brasileiros em engenharia de produto e de processo",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G11"
  },
  {
    "detailCode": "II.7.2",
    "title": "Capacitação dos estaleiros brasileiros em planejamento, organização e gestão da produção",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G11"
  },
  {
    "detailCode": "II.7.3",
    "title": "Força de trabalho empregada nos estaleiros: perfil e qualificação",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G11"
  },
  {
    "detailCode": "II.7.4",
    "title": "Capacidade de pesquisa, desenvolvimento e inovação em empresas, universidades e centros de pesquisa",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G10"
  },
  {
    "detailCode": "II.7.5",
    "title": "Relações entre universidades, centros de pesquisa, empresas e a base produtiva da indústria naval",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G10"
  },
  {
    "detailCode": "II.7.6",
    "title": "Disponibilidade de recursos humanos para a indústria naval nos níveis operacional, técnico, de engenharia e gerencial",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 5,
    "activeMonths": [
      4,
      5
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-01-15",
    "startAt": 1794787200000,
    "dueAt": 1800057599000,
    "group": "G10"
  },
  {
    "detailCode": "II.7.7",
    "title": "Sistemas de formação e qualificação profissional nos níveis básico, técnico e superior",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 5,
    "activeMonths": [
      4,
      5
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-01-15",
    "startAt": 1794787200000,
    "dueAt": 1800057599000,
    "group": "G10"
  },
  {
    "detailCode": "II.8.1",
    "title": "Metodologia e indicadores para avaliação tecnológica, de produtividade e desempenho dos estaleiros",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 2,
    "activeMonths": [
      1,
      2
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-10-15",
    "startAt": 1786838400000,
    "dueAt": 1792108799000,
    "group": "G10 + G11"
  },
  {
    "detailCode": "II.8.2",
    "title": "Padrões tecnológicos, produtividade e desempenho das principais classes de estaleiros mundiais",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G10"
  },
  {
    "detailCode": "II.8.3",
    "title": "Padrões tecnológicos, produtividade e desempenho dos estaleiros brasileiros nos últimos períodos de operação contínua, na situação atual e potencial",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 5,
    "activeMonths": [
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-09-16",
    "dueDate": "2027-01-15",
    "startAt": 1789516800000,
    "dueAt": 1800057599000,
    "group": "G10 + G11"
  },
  {
    "detailCode": "II.8.4",
    "title": "Benchmarking dos estaleiros brasileiros em relação às classes internacionais relevantes",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G10 + G11"
  },
  {
    "detailCode": "II.8.5",
    "title": "Potencialidades, limitações e gargalos de produtividade e competitividade dos estaleiros brasileiros",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 5,
    "activeMonths": [
      4,
      5
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-01-15",
    "startAt": 1794787200000,
    "dueAt": 1800057599000,
    "group": "G10 + G11"
  },
  {
    "detailCode": "II.8.6",
    "title": "Possibilidades de inserção competitiva e metas de produtividade e desempenho por classe de estaleiro",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 5,
    "endMonth": 5,
    "activeMonths": [
      5
    ],
    "startDate": "2026-12-16",
    "dueDate": "2027-01-15",
    "startAt": 1797379200000,
    "dueAt": 1800057599000,
    "group": "G10"
  },
  {
    "detailCode": "II.9.1",
    "title": "Impactos da descarbonização sobre o projeto, a construção e o retrofitting de navios",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G8"
  },
  {
    "detailCode": "II.9.2",
    "title": "Competências requeridas para projeto e construção de navios capazes ou preparados para novos combustíveis",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G8"
  },
  {
    "detailCode": "II.9.3",
    "title": "Competências requeridas para desenvolvimento e aplicação de tecnologias de eficiência energética, captura de carbono e correlatas",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G8"
  },
  {
    "detailCode": "II.9.4",
    "title": "Requisitos tecnológicos e produtivos para retrofitting de navios",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G8"
  },
  {
    "detailCode": "II.9.5",
    "title": "Capacidades e deficiências dos estaleiros brasileiros para atendimento às novas demandas tecnológicas",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 5,
    "activeMonths": [
      4,
      5
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-01-15",
    "startAt": 1794787200000,
    "dueAt": 1800057599000,
    "group": "G8"
  },
  {
    "detailCode": "II.9.6",
    "title": "Capacidades e oportunidades para empresas brasileiras de engenharia e fornecedores de equipamentos e sistemas",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 5,
    "activeMonths": [
      4,
      5
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-01-15",
    "startAt": 1794787200000,
    "dueAt": 1800057599000,
    "group": "G8"
  },
  {
    "detailCode": "II.9.7",
    "title": "Descarbonização dos processos de construção naval",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 5,
    "activeMonths": [
      4,
      5
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-01-15",
    "startAt": 1794787200000,
    "dueAt": 1800057599000,
    "group": "G8"
  },
  {
    "detailCode": "II.9.8",
    "title": "Oportunidades de inserção competitiva da indústria naval brasileira nos mercados associados à descarbonização",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 6,
    "activeMonths": [
      4,
      5,
      6
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-02-15",
    "startAt": 1794787200000,
    "dueAt": 1802735999000,
    "group": "G8"
  },
  {
    "detailCode": "II.9.9",
    "title": "Principais desafios tecnológicos e produtivos",
    "tome": "Tomo II",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 6,
    "activeMonths": [
      4,
      5,
      6
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-02-15",
    "startAt": 1794787200000,
    "dueAt": 1802735999000,
    "group": "G8"
  },
  {
    "detailCode": "III.1.1",
    "title": "Conceitos e fundamentos da política industrial",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G2"
  },
  {
    "detailCode": "III.1.2",
    "title": "Justificativas econômicas e estratégicas para políticas industriais",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G2"
  },
  {
    "detailCode": "III.1.3",
    "title": "Objetivos e instrumentos de política industrial: políticas horizontais e setoriais",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G2"
  },
  {
    "detailCode": "III.1.4",
    "title": "Transformações ambientais e geopolíticas em curso e tendências",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G2"
  },
  {
    "detailCode": "III.1.5",
    "title": "Evolução das políticas industriais praticadas no Brasil e tendências recentes",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G2"
  },
  {
    "detailCode": "III.1.6",
    "title": "Metodologia para análise da evolução das políticas setoriais voltadas para a indústria naval no Brasil e no mundo",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G2 + G3"
  },
  {
    "detailCode": "III.1.7",
    "title": "Relevância dos instrumentos horizontais para a indústria naval: Nova Indústria Brasil (NIB) e outras políticas",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G2"
  },
  {
    "detailCode": "III.1.8",
    "title": "Políticas públicas e mecanismos de fomento à descarbonização marítima e sua aplicabilidade ao Brasil",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 5,
    "activeMonths": [
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-09-16",
    "dueDate": "2027-01-15",
    "startAt": 1789516800000,
    "dueAt": 1800057599000,
    "group": "G2 + G8"
  },
  {
    "detailCode": "III.2.1",
    "title": "Justificativas econômicas, estratégicas e geopolíticas para políticas de marinha mercante",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G2 + G3"
  },
  {
    "detailCode": "III.2.2",
    "title": "Evolução das políticas de marinha mercante desde o pós-guerra",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.2.3",
    "title": "Regulamentação e organismos internacionais",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.2.4",
    "title": "Dimensões de análise das experiências nacionais: evolução das políticas; registros alternativos; financiamento; subsídios; incentivos fiscais; reserva de mercado e de carga; preferência de bandeira; políticas de tripulação; desenvolvimento tecnológico; resultados sobre frota, participação no mercado e competitividade; identificação dos casos mais expressivos de sucesso e falha",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.2.5",
    "title": "Europa Ocidental",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.2.6",
    "title": "Estados Unidos",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.2.7",
    "title": "Japão",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.2.8",
    "title": "Coreia do Sul",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.2.9",
    "title": "China",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.2.10",
    "title": "Singapura",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.2.11",
    "title": "Austrália e Nova Zelândia",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.2.12",
    "title": "Europa Oriental e Turquia",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.2.13",
    "title": "Índia",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.2.14",
    "title": "Outros casos relevantes",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 5,
    "activeMonths": [
      4,
      5
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-01-15",
    "startAt": 1794787200000,
    "dueAt": 1800057599000,
    "group": "G3"
  },
  {
    "detailCode": "III.3.1",
    "title": "Justificativas econômicas, estratégicas e geopolíticas para políticas de construção naval",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G2 + G3"
  },
  {
    "detailCode": "III.3.2",
    "title": "Inter-relação entre políticas de marinha mercante e de construção naval",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.3.3",
    "title": "Evolução das políticas de construção naval e dos ciclos de industrialização e realocação da produção mundial",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.3.4",
    "title": "Regulamentação e organismos internacionais",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.3.5",
    "title": "Dimensões de análise das experiências nacionais: planejamento e políticas de desenvolvimento da indústria; proteção do mercado; participação e controle estatal; subsídios e incentivos fiscais; financiamento; garantias e créditos à exportação; compras governamentais; políticas de conteúdo local; desenvolvimento tecnológico e transferência de tecnologia; cooperação internacional; impacto das políticas governamentais na consolidação da indústria; identificação dos casos mais expressivos de sucesso e falha",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.3.6",
    "title": "Japão",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.3.7",
    "title": "Coreia do Sul",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.3.8",
    "title": "China",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.3.9",
    "title": "Singapura",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.3.10",
    "title": "Estados Unidos",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.3.11",
    "title": "Europa Ocidental",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.3.12",
    "title": "Índia",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 4,
    "activeMonths": [
      3,
      4
    ],
    "startDate": "2026-10-16",
    "dueDate": "2026-12-15",
    "startAt": 1792108800000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.3.13",
    "title": "Vietnã",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 4,
    "activeMonths": [
      3,
      4
    ],
    "startDate": "2026-10-16",
    "dueDate": "2026-12-15",
    "startAt": 1792108800000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.3.14",
    "title": "Indonésia",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 4,
    "activeMonths": [
      3,
      4
    ],
    "startDate": "2026-10-16",
    "dueDate": "2026-12-15",
    "startAt": 1792108800000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.3.15",
    "title": "Turquia e Europa Oriental",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 4,
    "activeMonths": [
      3,
      4
    ],
    "startDate": "2026-10-16",
    "dueDate": "2026-12-15",
    "startAt": 1792108800000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.3.16",
    "title": "Outros casos relevantes",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 4,
    "activeMonths": [
      4
    ],
    "startDate": "2026-11-16",
    "dueDate": "2026-12-15",
    "startAt": 1794787200000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.4.1",
    "title": "Políticas marítimas no Brasil: marinha mercante, construção naval, navegação interior, óleo e gás offshore, energias oceânicas e defesa",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G3"
  },
  {
    "detailCode": "III.4.2",
    "title": "Evolução das políticas brasileiras de marinha mercante",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G3"
  },
  {
    "detailCode": "III.4.3",
    "title": "Evolução das políticas brasileiras de construção naval",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G3"
  },
  {
    "detailCode": "III.4.4",
    "title": "Os Planos de Desenvolvimento e os Planos de Construção Naval: ciclos de 1970–1980 e 2000–2010",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G3"
  },
  {
    "detailCode": "III.4.5",
    "title": "Instrumentos de proteção e incentivo à marinha mercante: reserva de mercado e de carga, preferência de bandeira, afretamento, tripulação e incentivos fiscais",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.4.6",
    "title": "Instrumentos de apoio à construção naval: barreiras tributárias e restrições ao afretamento, incentivos fiscais, conteúdo local e compras governamentais",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.4.7",
    "title": "Financiamento e outros instrumentos financeiros",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3 + G5"
  },
  {
    "detailCode": "III.4.8",
    "title": "Políticas de pesquisa, desenvolvimento, inovação e formação de recursos humanos",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3 + G1"
  },
  {
    "detailCode": "III.4.9",
    "title": "Clusters navais e políticas de desenvolvimento regional",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3"
  },
  {
    "detailCode": "III.4.10",
    "title": "Políticas para os setores de óleo e gás, defesa e energia e seus impactos sobre a indústria naval",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3 + G2 + G9"
  },
  {
    "detailCode": "III.4.11",
    "title": "Resultados das políticas brasileiras de marinha mercante e construção naval",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 5,
    "activeMonths": [
      4,
      5
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-01-15",
    "startAt": 1794787200000,
    "dueAt": 1800057599000,
    "group": "G3 + G1"
  },
  {
    "detailCode": "III.4.12",
    "title": "Mudanças recentes e principais questões em debate no Brasil",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 5,
    "activeMonths": [
      4,
      5
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-01-15",
    "startAt": 1794787200000,
    "dueAt": 1800057599000,
    "group": "G3 + G1"
  },
  {
    "detailCode": "III.5.1",
    "title": "Descrição geral do sistema",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 1,
    "activeMonths": [
      1
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-09-15",
    "startAt": 1786838400000,
    "dueAt": 1789516799000,
    "group": "G5"
  },
  {
    "detailCode": "III.5.2",
    "title": "Histórico e relevância do FMM para a indústria marítima brasileira",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 2,
    "activeMonths": [
      2
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-10-15",
    "startAt": 1789516800000,
    "dueAt": 1792108799000,
    "group": "G5"
  },
  {
    "detailCode": "III.5.3",
    "title": "Evolução da regulamentação do AFRMM e do FMM",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 2,
    "activeMonths": [
      2
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-10-15",
    "startAt": 1789516800000,
    "dueAt": 1792108799000,
    "group": "G5"
  },
  {
    "detailCode": "III.5.4",
    "title": "Arrecadação, distribuição e aplicação do AFRMM",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 2,
    "activeMonths": [
      2
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-10-15",
    "startAt": 1789516800000,
    "dueAt": 1792108799000,
    "group": "G5"
  },
  {
    "detailCode": "III.5.5",
    "title": "Eficiência do sistema: projetos financiados, obras concluídas e prazos",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 3,
    "activeMonths": [
      3
    ],
    "startDate": "2026-10-16",
    "dueDate": "2026-11-15",
    "startAt": 1792108800000,
    "dueAt": 1794787199000,
    "group": "G5"
  },
  {
    "detailCode": "III.5.6",
    "title": "Eficácia do sistema: consolidação das empresas e evolução da competitividade",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 3,
    "activeMonths": [
      3
    ],
    "startDate": "2026-10-16",
    "dueDate": "2026-11-15",
    "startAt": 1792108800000,
    "dueAt": 1794787199000,
    "group": "G5"
  },
  {
    "detailCode": "III.5.7",
    "title": "Efeitos do financiamento e da utilização das contas vinculadas sobre o custo efetivo de capital: análise e simulações",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 5,
    "activeMonths": [
      4,
      5
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-01-15",
    "startAt": 1794787200000,
    "dueAt": 1800057599000,
    "group": "G5"
  },
  {
    "detailCode": "III.5.8",
    "title": "Alocação de custos e benefícios: efeitos distributivos intersetoriais e inter-regionais",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 3,
    "endMonth": 5,
    "activeMonths": [
      3,
      4,
      5
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-01-15",
    "startAt": 1792108800000,
    "dueAt": 1800057599000,
    "group": "G5 + G1 + G2"
  },
  {
    "detailCode": "III.5.9",
    "title": "Justificativa econômica e estratégica do modelo atual por segmento da navegação",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 5,
    "activeMonths": [
      4,
      5
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-01-15",
    "startAt": 1794787200000,
    "dueAt": 1800057599000,
    "group": "G5 + G1 + G2"
  },
  {
    "detailCode": "III.6.1",
    "title": "Políticas industriais e perfil de nacionalização da cadeia de suprimentos da indústria naval nos principais países produtores",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G2 G1 + G3"
  },
  {
    "detailCode": "III.6.2",
    "title": "Importância da siderurgia e da indústria de materiais e equipamentos navais para a construção naval",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G2 + G11"
  },
  {
    "detailCode": "III.6.3",
    "title": "Evolução das indústrias siderúrgica e de materiais e equipamentos navais no Brasil",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 5,
    "activeMonths": [
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-09-16",
    "dueDate": "2027-01-15",
    "startAt": 1789516800000,
    "dueAt": 1800057599000,
    "group": "G2"
  },
  {
    "detailCode": "III.6.4",
    "title": "Estrutura atual da oferta de produtos siderúrgicos para a indústria naval brasileira: empresas, capacidade, tecnologia e dependência de importações",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 5,
    "activeMonths": [
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-09-16",
    "dueDate": "2027-01-15",
    "startAt": 1789516800000,
    "dueAt": 1800057599000,
    "group": "G2"
  },
  {
    "detailCode": "III.6.5",
    "title": "Estrutura atual da indústria brasileira de materiais e equipamentos navais: setores, empresas, capacidade, tecnologia e dependência de importações",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 5,
    "activeMonths": [
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-09-16",
    "dueDate": "2027-01-15",
    "startAt": 1789516800000,
    "dueAt": 1800057599000,
    "group": "G2"
  },
  {
    "detailCode": "III.6.6",
    "title": "Políticas industriais e de conteúdo local e evolução dos índices de nacionalização no Brasil",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 5,
    "activeMonths": [
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-09-16",
    "dueDate": "2027-01-15",
    "startAt": 1789516800000,
    "dueAt": 1800057599000,
    "group": "G2"
  },
  {
    "detailCode": "III.6.7",
    "title": "Cenários prospectivos, oportunidades e desafios para o desenvolvimento da siderurgia e da indústria de materiais e equipamentos navais",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 5,
    "activeMonths": [
      4,
      5
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-01-15",
    "startAt": 1794787200000,
    "dueAt": 1800057599000,
    "group": "G2"
  },
  {
    "detailCode": "III.6.8",
    "title": "Importância do desenvolvimento da cadeia nacional de suprimentos para a competitividade da indústria naval brasileira",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 5,
    "activeMonths": [
      4,
      5
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-01-15",
    "startAt": 1794787200000,
    "dueAt": 1800057599000,
    "group": "G2 + G11"
  },
  {
    "detailCode": "III.7.1",
    "title": "O ciclo das décadas de 1970 e 1980 no Brasil: objetivos, instrumentos e resultados",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G1 + G2 + G3 + G9"
  },
  {
    "detailCode": "III.7.2",
    "title": "Fatores endógenos e exógenos da crise e retração nas décadas de 1980 e 1990",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G1 + G2 + G3 + G9"
  },
  {
    "detailCode": "III.7.3",
    "title": "Brasil e Coreia do Sul: análise comparada das trajetórias da indústria naval",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 1,
    "endMonth": 3,
    "activeMonths": [
      1,
      2,
      3
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-11-15",
    "startAt": 1786838400000,
    "dueAt": 1794787199000,
    "group": "G1 + G2 + G3 + G9"
  },
  {
    "detailCode": "III.7.4",
    "title": "O ciclo das décadas de 2000 e 2010 no Brasil: objetivos, instrumentos e resultados",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G1 + G2 + G3 + G9"
  },
  {
    "detailCode": "III.7.5",
    "title": "Fatores determinantes da retração da indústria naval brasileira após o ciclo de expansão dos anos 2000",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G1 + G2 + G3 + G9"
  },
  {
    "detailCode": "III.7.6",
    "title": "Brasil e China: análise comparada das trajetórias da indústria naval a partir dos anos 2000",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 2,
    "endMonth": 4,
    "activeMonths": [
      2,
      3,
      4
    ],
    "startDate": "2026-09-16",
    "dueDate": "2026-12-15",
    "startAt": 1789516800000,
    "dueAt": 1797379199000,
    "group": "G1 + G2 + G3 + G9"
  },
  {
    "detailCode": "III.7.7",
    "title": "Análise comparativa dos ciclos brasileiros: continuidade e coordenação institucional, demanda, financiamento, escala de produção, produtividade, aprendizado tecnológico e inserção internacional",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 5,
    "activeMonths": [
      4,
      5
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-01-15",
    "startAt": 1794787200000,
    "dueAt": 1800057599000,
    "group": "G1 + G2 + G3 + G9"
  },
  {
    "detailCode": "III.7.8",
    "title": "Problemas sistêmicos e lições para uma nova política de desenvolvimento da indústria naval brasileira",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 5,
    "activeMonths": [
      4,
      5
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-01-15",
    "startAt": 1794787200000,
    "dueAt": 1800057599000,
    "group": "G1 + G2 + G3 + G9"
  },
  {
    "detailCode": "III.8.1",
    "title": "Transformações geopolíticas e seus impactos sobre o comércio, o transporte marítimo e a indústria naval",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 5,
    "endMonth": 6,
    "activeMonths": [
      5,
      6
    ],
    "startDate": "2026-12-16",
    "dueDate": "2027-02-15",
    "startAt": 1797379200000,
    "dueAt": 1802735999000,
    "group": "G1 + G2 + G8 + G3"
  },
  {
    "detailCode": "III.8.2",
    "title": "Segurança econômica e reorganização das cadeias globais de produção e suprimento",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 5,
    "endMonth": 6,
    "activeMonths": [
      5,
      6
    ],
    "startDate": "2026-12-16",
    "dueDate": "2027-02-15",
    "startAt": 1797379200000,
    "dueAt": 1802735999000,
    "group": "G1 + G2 + G8 + G3"
  },
  {
    "detailCode": "III.8.3",
    "title": "Descarbonização e novas exigências ambientais: impactos sobre a demanda e a estrutura da indústria naval",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 5,
    "endMonth": 6,
    "activeMonths": [
      5,
      6
    ],
    "startDate": "2026-12-16",
    "dueDate": "2027-02-15",
    "startAt": 1797379200000,
    "dueAt": 1802735999000,
    "group": "G1 + G2 + G8 + G3"
  },
  {
    "detailCode": "III.8.4",
    "title": "Reconfiguração da indústria naval mundial: relocalização de capacidades produtivas, políticas de reindustrialização e novos países produtores",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 5,
    "endMonth": 6,
    "activeMonths": [
      5,
      6
    ],
    "startDate": "2026-12-16",
    "dueDate": "2027-02-15",
    "startAt": 1797379200000,
    "dueAt": 1802735999000,
    "group": "G1 + G2 + G8 + G3"
  },
  {
    "detailCode": "III.8.5",
    "title": "Segurança e defesa e seus impactos sobre a indústria naval",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 5,
    "endMonth": 6,
    "activeMonths": [
      5,
      6
    ],
    "startDate": "2026-12-16",
    "dueDate": "2027-02-15",
    "startAt": 1797379200000,
    "dueAt": 1802735999000,
    "group": "G1 + G2 + G8 + G3"
  },
  {
    "detailCode": "III.8.6",
    "title": "Riscos e oportunidades decorrentes das transformações geopolíticas e ambientais para a indústria naval brasileira",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 5,
    "endMonth": 6,
    "activeMonths": [
      5,
      6
    ],
    "startDate": "2026-12-16",
    "dueDate": "2027-02-15",
    "startAt": 1797379200000,
    "dueAt": 1802735999000,
    "group": "G1 + G2 + G8 + G3"
  },
  {
    "detailCode": "III.9.1",
    "title": "Condições econômicas para o desenvolvimento da indústria marítima brasileira: demanda, ambiente macroeconômico, custo de capital, restrições fiscais, taxa de câmbio e ambiente de investimento",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 5,
    "endMonth": 6,
    "activeMonths": [
      5,
      6
    ],
    "startDate": "2026-12-16",
    "dueDate": "2027-02-15",
    "startAt": 1797379200000,
    "dueAt": 1802735999000,
    "group": "G1 + G2 + G3"
  },
  {
    "detailCode": "III.9.2",
    "title": "Organização institucional dos órgãos do Estado com atribuições sobre a indústria marítima",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 6,
    "activeMonths": [
      4,
      5,
      6
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-02-15",
    "startAt": 1794787200000,
    "dueAt": 1802735999000,
    "group": "G1 + G2 + G3"
  },
  {
    "detailCode": "III.9.3",
    "title": "Coordenação entre órgãos e políticas e continuidade da orientação programática",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 6,
    "activeMonths": [
      4,
      5,
      6
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-02-15",
    "startAt": 1794787200000,
    "dueAt": 1802735999000,
    "group": "G1 + G2 + G3"
  },
  {
    "detailCode": "III.9.4",
    "title": "Capacitação técnica, autonomia decisória e continuidade institucional dos órgãos e agências",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 4,
    "endMonth": 6,
    "activeMonths": [
      4,
      5,
      6
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-02-15",
    "startAt": 1794787200000,
    "dueAt": 1802735999000,
    "group": "G1 + G2 + G3"
  },
  {
    "detailCode": "III.9.5",
    "title": "Riscos políticos, econômicos, institucionais e regulatórios para a reestruturação da indústria naval",
    "tome": "Tomo III",
    "chapter": null,
    "startMonth": 5,
    "endMonth": 6,
    "activeMonths": [
      5,
      6
    ],
    "startDate": "2026-12-16",
    "dueDate": "2027-02-15",
    "startAt": 1797379200000,
    "dueAt": 1802735999000,
    "group": "G1 + G2 + G3"
  },
  {
    "detailCode": "IV.1.1",
    "title": "Relações entre volume e estabilidade da demanda, capacidade dos estaleiros, produtividade, custos, prazos, qualidade e condições de financiamento",
    "tome": "Tomo IV",
    "chapter": null,
    "startMonth": 5,
    "endMonth": 6,
    "activeMonths": [
      5,
      6
    ],
    "startDate": "2026-12-16",
    "dueDate": "2027-02-15",
    "startAt": 1797379200000,
    "dueAt": 1802735999000,
    "group": null
  },
  {
    "detailCode": "IV.1.2",
    "title": "Compatibilidade entre a demanda potencial e a capacidade de atendimento da indústria naval brasileira nos diferentes segmentos",
    "tome": "Tomo IV",
    "chapter": null,
    "startMonth": 5,
    "endMonth": 6,
    "activeMonths": [
      5,
      6
    ],
    "startDate": "2026-12-16",
    "dueDate": "2027-02-15",
    "startAt": 1797379200000,
    "dueAt": 1802735999000,
    "group": null
  },
  {
    "detailCode": "IV.1.3",
    "title": "Potencialidades, limitações e gargalos da indústria naval brasileira",
    "tome": "Tomo IV",
    "chapter": null,
    "startMonth": 5,
    "endMonth": 6,
    "activeMonths": [
      5,
      6
    ],
    "startDate": "2026-12-16",
    "dueDate": "2027-02-15",
    "startAt": 1797379200000,
    "dueAt": 1802735999000,
    "group": null
  },
  {
    "detailCode": "IV.1.4",
    "title": "Potencialidades, limitações e gargalos dos segmentos de reparo, conversão e descomissionamento",
    "tome": "Tomo IV",
    "chapter": null,
    "startMonth": 5,
    "endMonth": 6,
    "activeMonths": [
      5,
      6
    ],
    "startDate": "2026-12-16",
    "dueDate": "2027-02-15",
    "startAt": 1797379200000,
    "dueAt": 1802735999000,
    "group": null
  },
  {
    "detailCode": "IV.1.5",
    "title": "Impactos da descarbonização e das transformações tecnológicas e geopolíticas sobre a demanda, requisitos tecnológicos e oportunidades para a indústria naval brasileira",
    "tome": "Tomo IV",
    "chapter": null,
    "startMonth": 5,
    "endMonth": 6,
    "activeMonths": [
      5,
      6
    ],
    "startDate": "2026-12-16",
    "dueDate": "2027-02-15",
    "startAt": 1797379200000,
    "dueAt": 1802735999000,
    "group": null
  },
  {
    "detailCode": "IV.1.6",
    "title": "Fatores críticos e incertezas para a construção dos cenários para a indústria naval brasileira",
    "tome": "Tomo IV",
    "chapter": null,
    "startMonth": 5,
    "endMonth": 6,
    "activeMonths": [
      5,
      6
    ],
    "startDate": "2026-12-16",
    "dueDate": "2027-02-15",
    "startAt": 1797379200000,
    "dueAt": 1802735999000,
    "group": null
  },
  {
    "detailCode": "IV.2.1",
    "title": "Premissas, hipóteses, horizontes temporais e principais incertezas",
    "tome": "Tomo IV",
    "chapter": null,
    "startMonth": 5,
    "endMonth": 6,
    "activeMonths": [
      5,
      6
    ],
    "startDate": "2026-12-16",
    "dueDate": "2027-02-15",
    "startAt": 1797379200000,
    "dueAt": 1802735999000,
    "group": null
  },
  {
    "detailCode": "IV.2.2",
    "title": "Consolidação das projeções de demanda para transporte marítimo, navegação interior, óleo e gás offshore, energias oceânicas, defesa, reparo e descomissionamento",
    "tome": "Tomo IV",
    "chapter": null,
    "startMonth": 5,
    "endMonth": 6,
    "activeMonths": [
      5,
      6
    ],
    "startDate": "2026-12-16",
    "dueDate": "2027-02-15",
    "startAt": 1797379200000,
    "dueAt": 1802735999000,
    "group": null
  },
  {
    "detailCode": "IV.2.3",
    "title": "Cenários alternativos de volume e composição da demanda por segmento",
    "tome": "Tomo IV",
    "chapter": null,
    "startMonth": 5,
    "endMonth": 6,
    "activeMonths": [
      5,
      6
    ],
    "startDate": "2026-12-16",
    "dueDate": "2027-02-15",
    "startAt": 1797379200000,
    "dueAt": 1802735999000,
    "group": null
  },
  {
    "detailCode": "IV.2.4",
    "title": "Capacidade da indústria naval brasileira para atendimento da demanda nos diferentes cenários",
    "tome": "Tomo IV",
    "chapter": null,
    "startMonth": 5,
    "endMonth": 6,
    "activeMonths": [
      5,
      6
    ],
    "startDate": "2026-12-16",
    "dueDate": "2027-02-15",
    "startAt": 1797379200000,
    "dueAt": 1802735999000,
    "group": null
  },
  {
    "detailCode": "IV.2.5",
    "title": "Simulação das condições necessárias para que a demanda seja atendida pela indústria nacional",
    "tome": "Tomo IV",
    "chapter": null,
    "startMonth": 5,
    "endMonth": 6,
    "activeMonths": [
      5,
      6
    ],
    "startDate": "2026-12-16",
    "dueDate": "2027-02-15",
    "startAt": 1797379200000,
    "dueAt": 1802735999000,
    "group": null
  },
  {
    "detailCode": "IV.2.6",
    "title": "Possibilidades e desafios para a inserção competitiva no mercado internacional",
    "tome": "Tomo IV",
    "chapter": null,
    "startMonth": 5,
    "endMonth": 6,
    "activeMonths": [
      5,
      6
    ],
    "startDate": "2026-12-16",
    "dueDate": "2027-02-15",
    "startAt": 1797379200000,
    "dueAt": 1802735999000,
    "group": null
  },
  {
    "detailCode": "IV.2.7",
    "title": "Requisitos de infraestrutura, tecnologia e recursos humanos para os diferentes cenários",
    "tome": "Tomo IV",
    "chapter": null,
    "startMonth": 5,
    "endMonth": 6,
    "activeMonths": [
      5,
      6
    ],
    "startDate": "2026-12-16",
    "dueDate": "2027-02-15",
    "startAt": 1797379200000,
    "dueAt": 1802735999000,
    "group": null
  },
  {
    "detailCode": "IV.3.1",
    "title": "Principais conclusões do diagnóstico integrado e dos cenários",
    "tome": "Tomo IV",
    "chapter": null,
    "startMonth": 6,
    "endMonth": 6,
    "activeMonths": [
      6
    ],
    "startDate": "2027-01-16",
    "dueDate": "2027-02-15",
    "startAt": 1800057600000,
    "dueAt": 1802735999000,
    "group": null
  },
  {
    "detailCode": "IV.3.2",
    "title": "Incertezas, hipóteses e lacunas de informação que condicionam as conclusões",
    "tome": "Tomo IV",
    "chapter": null,
    "startMonth": 6,
    "endMonth": 6,
    "activeMonths": [
      6
    ],
    "startDate": "2027-01-16",
    "dueDate": "2027-02-15",
    "startAt": 1800057600000,
    "dueAt": 1802735999000,
    "group": null
  },
  {
    "detailCode": "IV.3.3",
    "title": "Questões para a identificação dos segmentos estratégicos e a formulação das políticas",
    "tome": "Tomo IV",
    "chapter": null,
    "startMonth": 6,
    "endMonth": 6,
    "activeMonths": [
      6
    ],
    "startDate": "2027-01-16",
    "dueDate": "2027-02-15",
    "startAt": 1800057600000,
    "dueAt": 1802735999000,
    "group": null
  }
] as const;

export const OFFICIAL_SCHEDULE_MES3_CHAPTERS: Record<string, ScheduleChapterItem> = {
  "I.1": {
    "code": "I.1",
    "title": "Introdução",
    "tome": "Tomo I",
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G1",
    "childrenCount": 4
  },
  "I.2": {
    "code": "I.2",
    "title": "Economia Marítima",
    "tome": "Tomo I",
    "startMonth": 1,
    "endMonth": 5,
    "activeMonths": [
      1,
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-08-16",
    "dueDate": "2027-01-15",
    "startAt": 1786838400000,
    "dueAt": 1800057599000,
    "group": "G1",
    "childrenCount": 4
  },
  "I.3": {
    "code": "I.3",
    "title": "Transporte Marítimo Mundial",
    "tome": "Tomo I",
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G4",
    "childrenCount": 12
  },
  "I.4": {
    "code": "I.4",
    "title": "Transporte Marítimo no Brasil",
    "tome": "Tomo I",
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3",
    "childrenCount": 9
  },
  "I.5": {
    "code": "I.5",
    "title": "Transporte Hidroviário Interior",
    "tome": "Tomo I",
    "startMonth": 1,
    "endMonth": 5,
    "activeMonths": [
      1,
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-08-16",
    "dueDate": "2027-01-15",
    "startAt": 1786838400000,
    "dueAt": 1800057599000,
    "group": "G4",
    "childrenCount": 12
  },
  "I.6": {
    "code": "I.6",
    "title": "Indústria de Óleo e Gás e de Energia Eólica Offshore",
    "tome": "Tomo I",
    "startMonth": 1,
    "endMonth": 5,
    "activeMonths": [
      1,
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-08-16",
    "dueDate": "2027-01-15",
    "startAt": 1786838400000,
    "dueAt": 1800057599000,
    "group": "G6",
    "childrenCount": 13
  },
  "I.7": {
    "code": "I.7",
    "title": "Construção naval militar",
    "tome": "Tomo I",
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G9",
    "childrenCount": 8
  },
  "I.8": {
    "code": "I.8",
    "title": "Descarbonização na Indústria Marítima",
    "tome": "Tomo I",
    "startMonth": 1,
    "endMonth": 5,
    "activeMonths": [
      1,
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-08-16",
    "dueDate": "2027-01-15",
    "startAt": 1786838400000,
    "dueAt": 1800057599000,
    "group": "G8",
    "childrenCount": 11
  },
  "II.1": {
    "code": "II.1",
    "title": "Construção Naval Mundial",
    "tome": "Tomo II",
    "startMonth": 1,
    "endMonth": 5,
    "activeMonths": [
      1,
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-08-16",
    "dueDate": "2027-01-15",
    "startAt": 1786838400000,
    "dueAt": 1800057599000,
    "group": "G10",
    "childrenCount": 7
  },
  "II.2": {
    "code": "II.2",
    "title": "Experiências nacionais de desenvolvimento da indústria naval",
    "tome": "Tomo II",
    "startMonth": 1,
    "endMonth": 5,
    "activeMonths": [
      1,
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-08-16",
    "dueDate": "2027-01-15",
    "startAt": 1786838400000,
    "dueAt": 1800057599000,
    "group": "G1",
    "childrenCount": 11
  },
  "II.3": {
    "code": "II.3",
    "title": "Construção naval e offshore no Brasil",
    "tome": "Tomo II",
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G1",
    "childrenCount": 10
  },
  "II.4": {
    "code": "II.4",
    "title": "Estrutura atual e capacidade dos estaleiros brasileiros",
    "tome": "Tomo II",
    "startMonth": 1,
    "endMonth": 5,
    "activeMonths": [
      1,
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-08-16",
    "dueDate": "2027-01-15",
    "startAt": 1786838400000,
    "dueAt": 1800057599000,
    "group": "G11",
    "childrenCount": 7
  },
  "II.5": {
    "code": "II.5",
    "title": "Reparo, conversão, desmantelamento e descomissionamento",
    "tome": "Tomo II",
    "startMonth": 1,
    "endMonth": 5,
    "activeMonths": [
      1,
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-08-16",
    "dueDate": "2027-01-15",
    "startAt": 1786838400000,
    "dueAt": 1800057599000,
    "group": "G11",
    "childrenCount": 11
  },
  "II.6": {
    "code": "II.6",
    "title": "Cadeia produtiva da indústria de construção naval",
    "tome": "Tomo II",
    "startMonth": 1,
    "endMonth": 6,
    "activeMonths": [
      1,
      2,
      3,
      4,
      5,
      6
    ],
    "startDate": "2026-08-16",
    "dueDate": "2027-02-15",
    "startAt": 1786838400000,
    "dueAt": 1802735999000,
    "group": "G2",
    "childrenCount": 10
  },
  "II.7": {
    "code": "II.7",
    "title": "Padrão tecnológico e recursos humanos",
    "tome": "Tomo II",
    "startMonth": 1,
    "endMonth": 5,
    "activeMonths": [
      1,
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-08-16",
    "dueDate": "2027-01-15",
    "startAt": 1786838400000,
    "dueAt": 1800057599000,
    "group": "G10",
    "childrenCount": 7
  },
  "II.8": {
    "code": "II.8",
    "title": "Produtividade e competitividade",
    "tome": "Tomo II",
    "startMonth": 1,
    "endMonth": 5,
    "activeMonths": [
      1,
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-08-16",
    "dueDate": "2027-01-15",
    "startAt": 1786838400000,
    "dueAt": 1800057599000,
    "group": "G10",
    "childrenCount": 6
  },
  "II.9": {
    "code": "II.9",
    "title": "Descarbonização: oportunidades e desafios para a indústria naval",
    "tome": "Tomo II",
    "startMonth": 3,
    "endMonth": 6,
    "activeMonths": [
      3,
      4,
      5,
      6
    ],
    "startDate": "2026-10-16",
    "dueDate": "2027-02-15",
    "startAt": 1792108800000,
    "dueAt": 1802735999000,
    "group": "G8",
    "childrenCount": 9
  },
  "III.1": {
    "code": "III.1",
    "title": "Fundamentos e tendências",
    "tome": "Tomo III",
    "startMonth": 1,
    "endMonth": 5,
    "activeMonths": [
      1,
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-08-16",
    "dueDate": "2027-01-15",
    "startAt": 1786838400000,
    "dueAt": 1800057599000,
    "group": "G2",
    "childrenCount": 8
  },
  "III.2": {
    "code": "III.2",
    "title": "Políticas de marinha mercante no mundo",
    "tome": "Tomo III",
    "startMonth": 1,
    "endMonth": 6,
    "activeMonths": [
      1,
      2,
      3,
      4,
      5,
      6
    ],
    "startDate": "2026-08-16",
    "dueDate": "2027-02-15",
    "startAt": 1786838400000,
    "dueAt": 1802735999000,
    "group": "G3",
    "childrenCount": 14
  },
  "III.3": {
    "code": "III.3",
    "title": "Políticas de construção naval no mundo",
    "tome": "Tomo III",
    "startMonth": 1,
    "endMonth": 4,
    "activeMonths": [
      1,
      2,
      3,
      4
    ],
    "startDate": "2026-08-16",
    "dueDate": "2026-12-15",
    "startAt": 1786838400000,
    "dueAt": 1797379199000,
    "group": "G3",
    "childrenCount": 16
  },
  "III.4": {
    "code": "III.4",
    "title": "Políticas brasileiras de marinha mercante e construção naval",
    "tome": "Tomo III",
    "startMonth": 1,
    "endMonth": 5,
    "activeMonths": [
      1,
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-08-16",
    "dueDate": "2027-01-15",
    "startAt": 1786838400000,
    "dueAt": 1800057599000,
    "group": "G3",
    "childrenCount": 12
  },
  "III.5": {
    "code": "III.5",
    "title": "O Fundo da Marinha Mercante",
    "tome": "Tomo III",
    "startMonth": 1,
    "endMonth": 5,
    "activeMonths": [
      1,
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-08-16",
    "dueDate": "2027-01-15",
    "startAt": 1786838400000,
    "dueAt": 1800057599000,
    "group": "G5",
    "childrenCount": 9
  },
  "III.6": {
    "code": "III.6",
    "title": "Setores críticos da cadeia de suprimentos: siderurgia e materiais e equipamentos navais",
    "tome": "Tomo III",
    "startMonth": 1,
    "endMonth": 5,
    "activeMonths": [
      1,
      2,
      3,
      4,
      5
    ],
    "startDate": "2026-08-16",
    "dueDate": "2027-01-15",
    "startAt": 1786838400000,
    "dueAt": 1800057599000,
    "group": "G2",
    "childrenCount": 8
  },
  "III.7": {
    "code": "III.7",
    "title": "Ciclos de expansão e queda da indústria naval brasileira: diagnóstico de sucessos e falhas",
    "tome": "Tomo III",
    "startMonth": 1,
    "endMonth": 6,
    "activeMonths": [
      1,
      2,
      3,
      4,
      5,
      6
    ],
    "startDate": "2026-08-16",
    "dueDate": "2027-02-15",
    "startAt": 1786838400000,
    "dueAt": 1802735999000,
    "group": "G1",
    "childrenCount": 8
  },
  "III.8": {
    "code": "III.8",
    "title": "Fatores geopolíticos e ambientais críticos para a reestruturação da indústria naval brasileira",
    "tome": "Tomo III",
    "startMonth": 5,
    "endMonth": 6,
    "activeMonths": [
      5,
      6
    ],
    "startDate": "2026-12-16",
    "dueDate": "2027-02-15",
    "startAt": 1797379200000,
    "dueAt": 1802735999000,
    "group": "G1",
    "childrenCount": 6
  },
  "III.9": {
    "code": "III.9",
    "title": "Ambiente econômico e institucional da indústria marítima brasileira",
    "tome": "Tomo III",
    "startMonth": 4,
    "endMonth": 6,
    "activeMonths": [
      4,
      5,
      6
    ],
    "startDate": "2026-11-16",
    "dueDate": "2027-02-15",
    "startAt": 1794787200000,
    "dueAt": 1802735999000,
    "group": "G1",
    "childrenCount": 5
  },
  "IV.1": {
    "code": "IV.1",
    "title": "Diagnóstico integrado da indústria naval brasileira",
    "tome": "Tomo IV",
    "startMonth": 5,
    "endMonth": 6,
    "activeMonths": [
      5,
      6
    ],
    "startDate": "2026-12-16",
    "dueDate": "2027-02-15",
    "startAt": 1797379200000,
    "dueAt": 1802735999000,
    "group": "G1",
    "childrenCount": 6
  },
  "IV.2": {
    "code": "IV.2",
    "title": "Cenários para a indústria naval brasileira",
    "tome": "Tomo IV",
    "startMonth": 5,
    "endMonth": 6,
    "activeMonths": [
      5,
      6
    ],
    "startDate": "2026-12-16",
    "dueDate": "2027-02-15",
    "startAt": 1797379200000,
    "dueAt": 1802735999000,
    "group": null,
    "childrenCount": 7
  },
  "IV.3": {
    "code": "IV.3",
    "title": "Conclusões do Relatório 1",
    "tome": "Tomo IV",
    "startMonth": 6,
    "endMonth": 6,
    "activeMonths": [
      6
    ],
    "startDate": "2027-01-16",
    "dueDate": "2027-02-15",
    "startAt": 1800057600000,
    "dueAt": 1802735999000,
    "group": "G1",
    "childrenCount": 3
  },
  "AP": {
    "code": "AP",
    "title": "Apresentação",
    "tome": "Apresentação",
    "startMonth": 1,
    "endMonth": 6,
    "activeMonths": [
      1,
      2,
      3,
      4,
      5,
      6
    ],
    "startDate": "2026-08-16",
    "dueDate": "2027-02-15",
    "startAt": 1786838400000,
    "dueAt": 1802735999000,
    "group": "G1",
    "childrenCount": 0
  }
} as const;

export const SCHEDULE_MES3_SECTIONS_BY_CODE = new Map<string, ScheduleSectionItem>(
  OFFICIAL_SCHEDULE_MES3_SECTIONS.map(item => [item.detailCode, item])
);

export function getScheduleForDetailCode(detailCode: string): ScheduleSectionItem | undefined {
  return SCHEDULE_MES3_SECTIONS_BY_CODE.get(detailCode);
}

export function getScheduleForChapterCode(chapterCode: string): ScheduleChapterItem | undefined {
  return OFFICIAL_SCHEDULE_MES3_CHAPTERS[chapterCode];
}
