/** Composição confirmada na lâmina da reunião de kick-off de 30 de agosto de 2026. */
export const KICKOFF_GROUP_REFERENCE: Record<string, { members: string[]; scope: string }> = {
  "G1 — Sistematização": { members: ["Floriano Carlos Martins Pires Jr.", "Segen Farid Estefen", "Luiz Felipe Assis", "Cassiano Marins de Souza", "Marcos Bernardes Cozzolino do Nascimento", "Carlos Frederico Leão Rocha", "Marcelo Colomer Ferraro"], scope: "Sistematização" },
  "G2 — Política Industrial e Cadeia de Suprimentos": { members: ["Carlos Frederico Leão Rocha", "Marcelo Colomer Ferraro", "Helder Queiroz Pinto Junior", "Germano Mendes de Paula", "Rodrigo Coelho Sabbatini"], scope: "Política industrial e cadeia de suprimentos" },
  "G3 — Transporte Marítimo Brasil e Políticas Marítimas": { members: ["Antonio João Prates", "Armando Freigedo Rodrigues Filho", "Paulo Octavio de Paiva Almeida", "Carolina Gonçalves dos Santos"], scope: "Transporte marítimo no Brasil e políticas marítimas" },
  "G4 — Transporte Marítimo Mundial": { members: ["Luiz Felipe Assis", "Floriano Carlos Martins Pires Jr."], scope: "Transporte marítimo mundial" },
  "G5 — Fundo da Marinha Mercante": { members: ["Marcos Bernardes Cozzolino do Nascimento"], scope: "Fundo da Marinha Mercante" },
  "G6 — Offshore": { members: ["Marcelo Igor Lourenço de Souza"], scope: "Offshore" },
  "G7 — Fluvial: Transporte e Construção": { members: ["Carlos Daher Padovezi", "Pedro Igor Dias Lameira", "André Mitsuo Kogishi", "Hito Braga de Moraes", "Nelio Moura de Figueiredo", "Emmanuel Loureiro"], scope: "Transporte e construção fluvial" },
  "G8 — Descarbonização": { members: ["Jean David Job Emmanuel Marie Caprace", "Luiz Antônio Vaz Pinto", "Crístofer Hood Marques"], scope: "Descarbonização" },
  "G9 — Construção Militar": { members: ["Andre Ricardo Mendonça Pinheiro"], scope: "Construção naval militar" },
  "G10 — Construção Naval Mundial e Análise Econômica": { members: ["Cassiano Marins de Souza", "Floriano Carlos Martins Pires Jr."], scope: "Construção naval mundial e análise econômica e tecnológica" },
  "G11 — Construção Naval no Brasil": { members: ["Marta Cecilia Tapia Reyes", "Marcos Pereira", "João Candido Gonçalves da Silva", "Sergio Lamarca Leite"], scope: "Construção naval no Brasil" },
};

/** Alias de compatibilidade para consumidores legados da matriz de referência. */
export const XLSM_GROUP_REFERENCE = KICKOFF_GROUP_REFERENCE;

export function groupReferenceFor(name: string | null | undefined) {
  return name ? KICKOFF_GROUP_REFERENCE[name] ?? null : null;
}
