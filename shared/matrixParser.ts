import { TEAM_GROUP_SEED, TEAM_SEED, type TeamGroupRole, type AppRole } from "./domain";

export type ParsedGroupMatrix = {
  groupCode: string; // "G1", "G2", ..., "G11"
  groupName: string; // "Sistematização", "Política Industrial e Cadeia de Suprimentos", etc.
  fullName: string; // "G1 — Sistematização"
  coordinatorName: string | null;
  members: string[];
};

export type ParsedGovernanceMatrix = {
  geral: string[];
  administrativa: string[];
  tecnica: string[];
};

export type ParsedSpreadsheetResult = {
  groups: ParsedGroupMatrix[];
  governance: ParsedGovernanceMatrix;
  allMemberNames: string[];
};

export const DEFAULT_SPREADSHEET_CSV_TEMPLATE = `G1,Sistematização,,,,,,,,,,
,,Floriano Carlos Martins Pires Jr.,,,,,,,,Coordenação,
,,Segen Farid Estefen,,,,,,,,,
,,Luiz Felipe Assis,,,,,,,,Geral,
,,Cassiano Marins de Souza,,,,,,,,,Floriano Carlos Martins Pires Jr.
,,Marcos Bernardes Cozzolino do Nascimento,,,,,,,,,
,,Carlos Frederico Leão Rocha,,,,,,,,Administrativa,
,,Marcelo Colomer Ferraro,,,,,,,,,Luiz Felipe Assis
G2,Política Industrial e Cadeia de Suprimentos,,,,,,,,,,Denise Cunha
,,Carlos Frederico Leão Rocha,,,,,,,,Técnica,
,,Marcelo Colomer Ferraro,,,,,,,,,Floriano Carlos Martins Pires Jr.
,,Helder Queiroz Pinto Junior,,,,,,,,,Segen Farid Estefen
,,Germano Mendes de Paula,,,,,,,,,Luiz Felipe Assis
,,Rodrigo Coelho Sabbatini,,,,,,,,,Carlos Frederico Leão Rocha
G3,Transporte Marítimo no Brasil; Políticas de Marinha Mercante e de Construção Naval,,,,,,,,,,Marcelo Colomer Ferraro
,,Antonio João Prates,,,,,,,,,Cassiano Marins de Souza
,,Armando Freigedo Rodrigues Filho,,,,,,,,,
,,Paulo Octavio de Paiva Almeida,,,,,,,,,
,,Carolina Gonçalves dos Santos,,,,,,,,,
G4,Transporte Marítimo Mundial,,,,,,,,,,
,,Luiz Felipe Assis,,,,,,,,,
,,Floriano Carlos Martins Pires Jr.,,,,,,,,,
G5,FMM,,,,,,,,,,
,,Marcos Bernardes Cozzolino do Nascimento,,,,,,,,,
G6,Offshore,,,,,,,,,,
,,Marcelo Igor Lourenço de Souza,,,,,,,,,
G7,Fluvial: Transporte e Construção,,,,,,,,,,
,,Carlos Daher Padovezi,,,,,,,,,
,,Pedro Igor Dias Lameira,,,,,,,,,
,,André Mitsuo Kogishi,,,,,,,,,
,,Hito Braga de Moraes,,,,,,,,,
,,Nelio Moura de Figueiredo,,,,,,,,,
,,Emmanuel Loureiro,,,,,,,,,
G8,Descarbonização,,,,,,,,,,
,,Jean David Job Emmanuel Marie Caprace,,,,,,,,,
,,Luiz Antônio Vaz Pinto,,,,,,,,,
,,Crístofer Hood Marques,,,,,,,,,
G9,Construção Militar,,,,,,,,,,
,,Andre Ricardo Mendonça Pinheiro,,,,,,,,,
G10,Construção Naval Mundial e Construção no Brasil - analise econômica e tecnológica,,,,,,,,,,
,,Cassiano Marins de Souza,,,,,,,,,
,,Floriano Carlos Martins Pires Jr.,,,,,,,,,
G11,Construção Naval no Brasil,,,,,,,,,,
,,Marta Cecilia Tapia Reyes,,,,,,,,,
,,Marcos Pereira,,,,,,,,,
,,João Candido Gonçalves da Silva,,,,,,,,,
,,Sergio Lamarca Leite,,,,,,,,,
,,Isaias Quaresma Masetti,,,,,,,,,`;

/**
 * Normaliza strings limpando espaços duplos, caracteres invisíveis e non-breaking spaces (\u00A0).
 */
export function normalizeName(name: string): string {
  return name
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parseia o conteúdo em formato CSV/texto da planilha "Atividades-Grupos"
 */
export function parseSpreadsheetMatrix(rawCsv: string): ParsedSpreadsheetResult {
  const lines = rawCsv.split(/\r?\n/);
  const groups: ParsedGroupMatrix[] = [];
  const governance: ParsedGovernanceMatrix = {
    geral: [],
    administrativa: [],
    tecnica: [],
  };

  let currentGroup: ParsedGroupMatrix | null = null;
  let currentGovernanceSection: "geral" | "administrativa" | "tecnica" | null = null;

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Divide respeitando aspas ou vírgulas normais
    const cells = line.split(",").map(c => normalizeName(c.replace(/^["']|["']$/g, "")));

    // 1. Detectar cabeçalho de grupo (Ex: "G1", "Sistematização" ou "G1 — Sistematização")
    const firstCell = cells[0] || "";
    const groupMatch = firstCell.match(/^(G\d+)(?:\s*[-—]\s*(.*))?$/i);

    if (groupMatch) {
      if (currentGroup) {
        groups.push(currentGroup);
      }
      const groupCode = groupMatch[1].toUpperCase();
      let groupName = (groupMatch[2] || cells[1] || "").trim();

      // Caso o nome canônico esteja pré-definido no seed, alinhar
      const seedGroup = TEAM_GROUP_SEED.find(g => g.name.startsWith(`${groupCode} `) || g.name.startsWith(`${groupCode}—`));
      if (!groupName && seedGroup) {
        groupName = seedGroup.name.replace(/^G\d+\s*[-—]\s*/, "").trim();
      }

      const fullName = seedGroup?.name || `${groupCode} — ${groupName || "Grupo"}`;

      currentGroup = {
        groupCode,
        groupName: groupName || fullName,
        fullName,
        coordinatorName: null,
        members: [],
      };
    } else {
      // 2. Extrair integrante do grupo atual
      let memberCandidate = "";
      if (cells[2] && cells[2].length >= 3 && !cells[2].startsWith("Coordenação") && !cells[2].startsWith("Geral") && !cells[2].startsWith("Técnica") && !cells[2].startsWith("Administrativa")) {
        memberCandidate = cells[2];
      } else if (cells[1] && cells[1].length >= 3 && !cells[1].startsWith("Coordenação") && !cells[1].startsWith("Geral") && !cells[1].startsWith("Técnica") && !cells[1].startsWith("Administrativa")) {
        memberCandidate = cells[1];
      } else if (cells[0] && cells[0].length >= 3 && !cells[0].startsWith("Coordenação") && !cells[0].startsWith("Geral") && !cells[0].startsWith("Técnica") && !cells[0].startsWith("Administrativa") && !cells[0].startsWith("G")) {
        memberCandidate = cells[0];
      }

      if (memberCandidate && currentGroup) {
        const cleanMember = normalizeName(memberCandidate);
        if (cleanMember.length > 2 && !currentGroup.members.includes(cleanMember)) {
          currentGroup.members.push(cleanMember);
          if (!currentGroup.coordinatorName) {
            currentGroup.coordinatorName = cleanMember;
          }
        }
      }
    }

    // 3. Extrair coluna de Governança (Coordenação Geral, Administrativa, Técnica)
    for (let i = 0; i < cells.length; i++) {
      const val = cells[i];
      if (!val) continue;

      if (val.toLowerCase() === "coordenação" || val.toLowerCase().includes("coordenação")) {
        continue;
      }
      if (val.toLowerCase() === "geral") {
        currentGovernanceSection = "geral";
        continue;
      }
      if (val.toLowerCase() === "administrativa") {
        currentGovernanceSection = "administrativa";
        continue;
      }
      if (val.toLowerCase() === "técnica" || val.toLowerCase() === "tecnica") {
        currentGovernanceSection = "tecnica";
        continue;
      }

      if (currentGovernanceSection && i >= 7 && val.length > 3) {
        const govPerson = normalizeName(val);
        if (govPerson && !governance[currentGovernanceSection].includes(govPerson)) {
          governance[currentGovernanceSection].push(govPerson);
        }
      }
    }
  }

  if (currentGroup) {
    groups.push(currentGroup);
  }

  // Fallbacks de Governança
  if (governance.geral.length === 0) {
    governance.geral = ["Floriano Carlos Martins Pires Jr."];
  }
  if (governance.administrativa.length === 0) {
    governance.administrativa = ["Luiz Felipe Assis", "Denise Cunha"];
  }
  if (governance.tecnica.length === 0) {
    governance.tecnica = [
      "Floriano Carlos Martins Pires Jr.",
      "Segen Farid Estefen",
      "Luiz Felipe Assis",
      "Carlos Frederico Leão Rocha",
      "Marcelo Colomer Ferraro",
      "Cassiano Marins de Souza",
    ];
  }

  // Coletar todos os nomes
  const memberNameSet = new Set<string>();
  for (const g of groups) {
    for (const m of g.members) {
      memberNameSet.add(m);
    }
  }
  for (const m of governance.geral) memberNameSet.add(m);
  for (const m of governance.administrativa) memberNameSet.add(m);
  for (const m of governance.tecnica) memberNameSet.add(m);

  return {
    groups,
    governance,
    allMemberNames: Array.from(memberNameSet),
  };
}
