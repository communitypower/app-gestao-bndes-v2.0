import { PDF_ANALYTIC_SECTIONS } from "./pdfAnalyticIndex";
import { STUDY_SECTION_DESCRIPTIONS as RICH_SECTION_DESCRIPTIONS, type StudySectionCode } from "./studyDescriptions";

export const ACTIVITY_STATUSES = [
  "pendente",
  "em andamento",
  "concluído",
  "atrasado",
] as const;

export type ActivityStatus = (typeof ACTIVITY_STATUSES)[number];

export const APP_ROLES = ["administrador", "coordenador", "executor"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const TEAM_GROUP_ROLES = ["coordenador", "participante"] as const;
export type TeamGroupRole = (typeof TEAM_GROUP_ROLES)[number];

export const NOTIFICATION_EVENTS = [
  "atribuicao",
  "prazo_3_dias",
  "atraso",
] as const;

export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number];

export const STUDY_TOMES = [
  "Apresentação",
  "Tomo I",
  "Tomo II",
  "Tomo III",
  "Tomo IV",
] as const;

export type StudyTome = (typeof STUDY_TOMES)[number];

/** Subtítulos editoriais de apresentação; não alteram a estrutura canônica do Anexo B. */
export const STUDY_TOME_TITLES: Record<StudyTome, string> = {
  "Apresentação": "Objetivos, metodologia e produtos do Estudo",
  "Tomo I": "Economia Marítima, Mercados e Demanda para a Indústria Naval",
  "Tomo II": "Indústria Naval: Base Produtiva, Tecnologia e Competitividade",
  "Tomo III": "Política Industrial e Política Marítima",
  "Tomo IV": "Diagnóstico Integrado e Cenários",
};

/** Estrutura canônica exclusiva: Anexo B do Plano_de_Trabalho-UFRJ_26_agosto.pdf. */
export const STUDY_SECTIONS = PDF_ANALYTIC_SECTIONS.map(section => ({
  code: section.code,
  tome: section.tome as StudyTome,
  title: section.title,
  officialDescription: RICH_SECTION_DESCRIPTIONS[section.code as StudySectionCode] ?? section.description,
  sortOrder: section.sortOrder,
})) as ReadonlyArray<{
  code: string;
  tome: StudyTome;
  title: string;
  officialDescription: string;
  sortOrder: number;
}>;

export const STUDY_SECTION_CODES = STUDY_SECTIONS.map(section => section.code);

/** Mapa de descrições derivado do Anexo B do PDF, mantido por compatibilidade de leitura. */
export const STUDY_SECTION_DESCRIPTIONS = Object.fromEntries(
  STUDY_SECTIONS.map(section => [section.code, section.officialDescription])
);

export function studySectionDescription(code: string) {
  return (
    STUDY_SECTIONS.find(section => section.code === code)?.officialDescription ??
    RICH_SECTION_DESCRIPTIONS[code as StudySectionCode] ??
    "Descrição não localizada no índice analítico oficial."
  );
}

export function studyTomeFromCode(code: string): StudyTome | "Outro" {
  if (code === "AP") return "Apresentação";
  if (code.startsWith("IV.")) return "Tomo IV";
  if (code.startsWith("III.")) return "Tomo III";
  if (code.startsWith("II.")) return "Tomo II";
  if (code.startsWith("I.")) return "Tomo I";
  return "Outro";
}

export function initialActivityTitle(sectionTitle: string) {
  return sectionTitle.trim();
}

export const DEFAULT_PROJECT_START_AT = Date.UTC(2026, 7, 1, 12, 0, 0);
export const DEFAULT_PROJECT_END_AT = Date.UTC(2027, 0, 31, 12, 0, 0);
export const DEFAULT_TIMEZONE = "America/Sao_Paulo";

export const TEAM_SEED: ReadonlyArray<{
  name: string;
  title: string;
  institution: string;
  email: string;
  appRole: AppRole;
}> = [
  // 1. Administradores da Coordenação e Suporte Técnico do Projeto
  { name: "Floriano Carlos Martins Pires Jr.", title: "Professor", institution: "UFRJ", email: "floriano@poli.ufrj.br", appRole: "administrador" },
  { name: "Denise Cunha", title: "Administradora", institution: "UFRJ", email: "denisecunha@poli.ufrj.br", appRole: "administrador" },
  { name: "Cassiano Marins de Souza", title: "Consultor", institution: "Consultoria", email: "cassianomarins@gmail.com", appRole: "administrador" },
  { name: "Luiz Felipe Assis", title: "Professor", institution: "UFRJ", email: "lfelipe@oceanica.ufrj.br", appRole: "administrador" },
  { name: "Marcos Pedreira da Silva", title: "Técnico de TI", institution: "UFRJ", email: "marcos.pedreira@ufrj.br", appRole: "administrador" },

  // 2. Coordenadores de Grupos Temáticos / Frentes
  { name: "Carlos Frederico Leão Rocha", title: "Professor", institution: "UFRJ", email: "carlos.rocha@ie.ufrj.br", appRole: "coordenador" },
  { name: "Armando Freigedo Rodrigues Filho", title: "Consultor", institution: "Consultoria", email: "armando.freigedo@aquapar.com.br", appRole: "coordenador" },
  { name: "Marcos Bernardes Cozzolino do Nascimento", title: "Consultor", institution: "Consultoria", email: "marcos.cozzolino@consultoria.com", appRole: "coordenador" },
  { name: "Marcelo Igor Lourenço de Souza", title: "Professor", institution: "UFRJ", email: "igor@oceanica.ufrj.br", appRole: "coordenador" },
  { name: "Carlos Daher Padovezi", title: "Pesquisador", institution: "IPT", email: "padovezi@ipt.br", appRole: "coordenador" },
  { name: "Jean David Job Emmanuel Marie Caprace", title: "Professor", institution: "UFRJ", email: "caprace@oceanica.ufrj.br", appRole: "coordenador" },
  { name: "Andre Ricardo Mendonça Pinheiro", title: "Doutorando", institution: "UFRJ", email: "andre.pinheiro@oceanica.ufrj.br", appRole: "coordenador" },
  { name: "Marta Cecilia Tapia Reyes", title: "Professor", institution: "UFRJ", email: "marta@oceanica.ufrj.br", appRole: "coordenador" },
  { name: "Segen Farid Estefen", title: "Professor", institution: "UFRJ", email: "segen@oceanica.ufrj.br", appRole: "coordenador" },

  // 3. Executores e Pesquisadores
  { name: "Marcelo Colomer Ferraro", title: "Professor", institution: "UFRJ", email: "marcelocolomer@ie.ufrj.br", appRole: "executor" },
  { name: "Helder Queiroz Pinto Junior", title: "Professor", institution: "UFRJ", email: "helder@ie.ufrj.br", appRole: "executor" },
  { name: "Luiz Antônio Vaz Pinto", title: "Professor", institution: "UFRJ", email: "vaz@oceanica.ufrj.br", appRole: "executor" },
  { name: "Crístofer Hood Marques", title: "Professor", institution: "UFRJ", email: "cristofer@oceanica.ufrj.br", appRole: "executor" },
  { name: "Marcos Pereira", title: "Professor", institution: "UFPE", email: "marcos.pereira@ufpe.br", appRole: "executor" },
  { name: "André Mitsuo Kogishi", title: "Pesquisador", institution: "IPT", email: "akogishi@ipt.br", appRole: "executor" },
  { name: "Pedro Igor Dias Lameira", title: "Professor", institution: "UFPA", email: "pedrolameira@ufpa.br", appRole: "executor" },
  { name: "Hito Braga de Moraes", title: "Professor", institution: "UFPA", email: "hito@ufpa.br", appRole: "executor" },
  { name: "Nelio Moura de Figueiredo", title: "Professor", institution: "UFPA", email: "neliomf@ufpa.br", appRole: "executor" },
  { name: "Emmanuel Loureiro", title: "Professor", institution: "UFPA", email: "eloureiro@ufpa.br", appRole: "executor" },
  { name: "Germano Mendes de Paula", title: "Professor", institution: "UFU", email: "germano@ufu.br", appRole: "executor" },
  { name: "Rodrigo Coelho Sabbatini", title: "Professor", institution: "FACAMP", email: "rodrigo.sabbatini@facamp.com.br", appRole: "executor" },
  { name: "Antonio João Prates", title: "Consultor", institution: "Consultoria", email: "antonio.prates@consultoria.com", appRole: "executor" },
  { name: "Paulo Octavio de Paiva Almeida", title: "Consultor", institution: "Consultoria", email: "paulo.octavio@aquapar.com.br", appRole: "executor" },
  { name: "Carolina Gonçalves dos Santos", title: "Consultor", institution: "Consultoria", email: "carolina.santos@consultoria.com", appRole: "executor" },
  { name: "João Candido Gonçalves da Silva", title: "Consultor", institution: "Consultoria", email: "joao.candido@consultoria.com", appRole: "executor" },
  { name: "Sergio Lamarca Leite", title: "Consultor", institution: "Consultoria", email: "sergio.lamarca@consultoria.com", appRole: "executor" },
  { name: "S. Navaneetha Krishnan", title: "Professor", institution: "Institute TPMI - India", email: "krishnan@tpmi-india.org", appRole: "executor" },
  { name: "Jeom-Kee Paik", title: "Professor", institution: "UCL", email: "j.paik@ucl.ac.uk", appRole: "executor" },
];

export const TEAM_GROUP_SEED = [
  { name: "G1 — Sistematização", institution: "Interinstitucional", coordinatorName: "Floriano Carlos Martins Pires Jr.", memberNames: ["Segen Farid Estefen", "Luiz Felipe Assis", "Cassiano Marins de Souza", "Marcos Bernardes Cozzolino do Nascimento", "Carlos Frederico Leão Rocha", "Marcelo Colomer Ferraro"] },
  { name: "G2 — Política Industrial e Cadeia de Suprimentos", institution: "IE-UFRJ", coordinatorName: "Carlos Frederico Leão Rocha", memberNames: ["Marcelo Colomer Ferraro", "Helder Queiroz Pinto Junior", "Germano Mendes de Paula", "Rodrigo Coelho Sabbatini"] },
  { name: "G3 — Transporte Marítimo Brasil e Políticas Marítimas", institution: "AQUAPAR", coordinatorName: "Armando Freigedo Rodrigues Filho", memberNames: ["Antonio João Prates", "Paulo Octavio de Paiva Almeida", "Carolina Gonçalves dos Santos"] },
  { name: "G4 — Transporte Marítimo Mundial", institution: "Interinstitucional", coordinatorName: "Luiz Felipe Assis", memberNames: ["Floriano Carlos Martins Pires Jr."] },
  { name: "G5 — Fundo da Marinha Mercante", institution: "Consultoria", coordinatorName: "Marcos Bernardes Cozzolino do Nascimento", memberNames: [] },
  { name: "G6 — Offshore", institution: "UFRJ", coordinatorName: "Marcelo Igor Lourenço de Souza", memberNames: [] },
  { name: "G7 — Fluvial: Transporte e Construção", institution: "IPT / UFPA", coordinatorName: "Carlos Daher Padovezi", memberNames: ["Pedro Igor Dias Lameira", "André Mitsuo Kogishi", "Hito Braga de Moraes", "Nelio Moura de Figueiredo", "Emmanuel Loureiro"] },
  { name: "G8 — Descarbonização", institution: "UFRJ", coordinatorName: "Jean David Job Emmanuel Marie Caprace", memberNames: ["Luiz Antônio Vaz Pinto", "Crístofer Hood Marques"] },
  { name: "G9 — Construção Militar", institution: "UFRJ", coordinatorName: "Andre Ricardo Mendonça Pinheiro", memberNames: [] },
  { name: "G10 — Construção Naval Mundial e Análise Econômica", institution: "Interinstitucional", coordinatorName: "Cassiano Marins de Souza", memberNames: ["Floriano Carlos Martins Pires Jr."] },
  { name: "G11 — Construção Naval no Brasil", institution: "UFRJ / UFPE", coordinatorName: "Marta Cecilia Tapia Reyes", memberNames: ["Marcos Pereira", "João Candido Gonçalves da Silva", "Sergio Lamarca Leite"] },
] as const;

export const GROUP_MEMBERSHIPS_SEED = [
  // G1 — Sistematização
  { groupName: "G1 — Sistematização", memberName: "Floriano Carlos Martins Pires Jr." },
  { groupName: "G1 — Sistematização", memberName: "Segen Farid Estefen" },
  { groupName: "G1 — Sistematização", memberName: "Luiz Felipe Assis" },
  { groupName: "G1 — Sistematização", memberName: "Cassiano Marins de Souza" },
  { groupName: "G1 — Sistematização", memberName: "Marcos Bernardes Cozzolino do Nascimento" },
  { groupName: "G1 — Sistematização", memberName: "Carlos Frederico Leão Rocha" },
  { groupName: "G1 — Sistematização", memberName: "Marcelo Colomer Ferraro" },

  // G2 — Política Industrial e Cadeia de Suprimentos
  { groupName: "G2 — Política Industrial e Cadeia de Suprimentos", memberName: "Carlos Frederico Leão Rocha" },
  { groupName: "G2 — Política Industrial e Cadeia de Suprimentos", memberName: "Marcelo Colomer Ferraro" },
  { groupName: "G2 — Política Industrial e Cadeia de Suprimentos", memberName: "Helder Queiroz Pinto Junior" },
  { groupName: "G2 — Política Industrial e Cadeia de Suprimentos", memberName: "Germano Mendes de Paula" },
  { groupName: "G2 — Política Industrial e Cadeia de Suprimentos", memberName: "Rodrigo Coelho Sabbatini" },

  // G3 — Transporte Marítimo Brasil e Políticas Marítimas
  { groupName: "G3 — Transporte Marítimo Brasil e Políticas Marítimas", memberName: "Armando Freigedo Rodrigues Filho" },
  { groupName: "G3 — Transporte Marítimo Brasil e Políticas Marítimas", memberName: "Antonio João Prates" },
  { groupName: "G3 — Transporte Marítimo Brasil e Políticas Marítimas", memberName: "Paulo Octavio de Paiva Almeida" },
  { groupName: "G3 — Transporte Marítimo Brasil e Políticas Marítimas", memberName: "Carolina Gonçalves dos Santos" },

  // G4 — Transporte Marítimo Mundial
  { groupName: "G4 — Transporte Marítimo Mundial", memberName: "Luiz Felipe Assis" },
  { groupName: "G4 — Transporte Marítimo Mundial", memberName: "Floriano Carlos Martins Pires Jr." },

  // G5 — Fundo da Marinha Mercante
  { groupName: "G5 — Fundo da Marinha Mercante", memberName: "Marcos Bernardes Cozzolino do Nascimento" },

  // G6 — Offshore
  { groupName: "G6 — Offshore", memberName: "Marcelo Igor Lourenço de Souza" },

  // G7 — Fluvial: Transporte e Construção
  { groupName: "G7 — Fluvial: Transporte e Construção", memberName: "Carlos Daher Padovezi" },
  { groupName: "G7 — Fluvial: Transporte e Construção", memberName: "Pedro Igor Dias Lameira" },
  { groupName: "G7 — Fluvial: Transporte e Construção", memberName: "André Mitsuo Kogishi" },
  { groupName: "G7 — Fluvial: Transporte e Construção", memberName: "Hito Braga de Moraes" },
  { groupName: "G7 — Fluvial: Transporte e Construção", memberName: "Nelio Moura de Figueiredo" },
  { groupName: "G7 — Fluvial: Transporte e Construção", memberName: "Emmanuel Loureiro" },

  // G8 — Descarbonização
  { groupName: "G8 — Descarbonização", memberName: "Jean David Job Emmanuel Marie Caprace" },
  { groupName: "G8 — Descarbonização", memberName: "Luiz Antônio Vaz Pinto" },
  { groupName: "G8 — Descarbonização", memberName: "Crístofer Hood Marques" },

  // G9 — Construção Militar
  { groupName: "G9 — Construção Militar", memberName: "Andre Ricardo Mendonça Pinheiro" },

  // G10 — Construção Naval Mundial e Análise Econômica
  { groupName: "G10 — Construção Naval Mundial e Análise Econômica", memberName: "Cassiano Marins de Souza" },
  { groupName: "G10 — Construção Naval Mundial e Análise Econômica", memberName: "Floriano Carlos Martins Pires Jr." },

  // G11 — Construção Naval no Brasil
  { groupName: "G11 — Construção Naval no Brasil", memberName: "Marta Cecilia Tapia Reyes" },
  { groupName: "G11 — Construção Naval no Brasil", memberName: "Marcos Pereira" },
  { groupName: "G11 — Construção Naval no Brasil", memberName: "João Candido Gonçalves da Silva" },
  { groupName: "G11 — Construção Naval no Brasil", memberName: "Sergio Lamarca Leite" },
] as const;

export const ACTIVE_TEAM_MEMBER_NAMES = TEAM_GROUP_SEED.flatMap(group => [
  group.coordinatorName,
  ...group.memberNames,
]);

export function teamGroupForMember(memberName: string) {
  return (
    TEAM_GROUP_SEED.find(group => group.coordinatorName === memberName) ||
    TEAM_GROUP_SEED.find(group =>
      group.memberNames.some(name => name === memberName)
    )
  );
}

export const CHAPTER_RESPONSIBLE_MAP: Record<string, string> = {
  "AP": "Floriano Carlos Martins Pires Jr.",
  "I.1": "Floriano Carlos Martins Pires Jr.",
  "I.2": "Floriano Carlos Martins Pires Jr.",
  "I.3": "Luiz Felipe Assis",
  "I.4": "Armando Freigedo Rodrigues Filho",
  "I.5": "Carlos Daher Padovezi",
  "I.6": "Marcelo Igor Lourenço de Souza",
  "I.7": "Andre Ricardo Mendonça Pinheiro",
  "I.8": "Jean David Job Emmanuel Marie Caprace",
  "II.1": "Cassiano Marins de Souza",
  "II.2": "Cassiano Marins de Souza",
  "II.3": "Marta Cecilia Tapia Reyes",
  "II.4": "Marta Cecilia Tapia Reyes",
  "II.5": "Marta Cecilia Tapia Reyes",
  "II.6": "Carlos Frederico Leão Rocha",
  "II.7": "Marta Cecilia Tapia Reyes",
  "II.8": "Marta Cecilia Tapia Reyes",
  "II.9": "Jean David Job Emmanuel Marie Caprace",
  "III.1": "Carlos Frederico Leão Rocha",
  "III.2": "Armando Freigedo Rodrigues Filho",
  "III.3": "Cassiano Marins de Souza",
  "III.4": "Armando Freigedo Rodrigues Filho",
  "III.5": "Marcos Bernardes Cozzolino do Nascimento",
  "III.6": "Carlos Frederico Leão Rocha",
  "III.7": "Floriano Carlos Martins Pires Jr.",
  "III.8": "Floriano Carlos Martins Pires Jr.",
  "III.9": "Floriano Carlos Martins Pires Jr.",
  "IV.1": "Floriano Carlos Martins Pires Jr.",
  "IV.2": "Floriano Carlos Martins Pires Jr.",
  "IV.3": "Floriano Carlos Martins Pires Jr.",
};

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const ALLOWED_UPLOAD_EXTENSIONS = [
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "md", "csv", "odt", "ods", "odp",
] as const;

export { IDENTIFIED_INTERFACES_SEED } from "./identifiedInterfacesSeed";
