import { describe, it, expect } from "vitest";
import { parseSpreadsheetMatrix, DEFAULT_SPREADSHEET_CSV_TEMPLATE } from "../shared/matrixParser";

describe("matrixParser — Parser da Matriz da Planilha Atividades-Grupos", () => {
  const SAMPLE_CSV = `G1,Sistematização,,,,,,,,,,
,,Floriano Carlos Martins Pires Jr.,,,,,,,,Coordenação,
,,Segen Farid Estefen,,,,,,,,,
,,Luiz Felipe Assis,,,,,,,,Geral,
,,Cassiano Marins de Souza,,,,,,,,,Floriano Carlos Martins Pires Jr.
,,Marcos Bernardes Cozzolino do Nascimento,,,,,,,,,
,,Carlos Frederico Leão Rocha,,,,,,,,Administrativa,
,,Marcelo Colomer Ferraro,,,,,,,,,Luiz Felipe Assis
G2,Política Industrial e Cadeia  de Suprimentos,,,,,,,,,,Denise Cunha
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
G6,Offshore ,,,,,,,,,,
,,Marcelo Igor Lourenço de Souza,,,,,,,,,
G7,Fluvial: Transporte e Construção,,,,,,,,,,
,,Carlos Daher Padovezi,,,,,,,,,
,,Pedro Igor Dias Lameira,,,,,,,,,
,,André Mitsuo Kogishi,,,,,,,,,
,,Hito Braga de Moraes,,,,,,,,,
,,Nelio Moura de Figueiredo,,,,,,,,,
,,Emannuel Loureiro,,,,,,,,,
G8,Descarbonização,,,,,,,,,,
,,Jean David Job Emmanuel Marie Caprace,,,,,,,,,
,,Luiz Antônio Vaz Pinto,,,,,,,,,
,,Crístofer Hood Marques,,,,,,,,,
G9,Construção Militar,,,,,,,,,,
,,Andre Ricardo Mendonça Pinheiro,,,,,,,,,
G10,Construção Naval Mundial e Construção no Brasil - analise econômica  e tecnológica,,,,,,,,,,
,,Cassiano Marins de Souza,,,,,,,,,
,,Floriano Carlos Martins Pires Jr.,,,,,,,,,
G11,Construção Naval no Brasil,,,,,,,,,,
,,Marta Cecilia Tapia Reyes,,,,,,,,,
,,Marcos Pereira,,,,,,,,,
,,João Candido Gonçalves da Silva,,,,,,,,,
,,Sergio Lamarca Leite,,,,,,,,,
,,Isaias\u00a0Quaresma Masetti,,,,,,,,,`;

  it("parseia corretamente todos os 11 grupos temáticos da planilha", () => {
    const result = parseSpreadsheetMatrix(SAMPLE_CSV);
    expect(result.groups).toHaveLength(11);

    const g1 = result.groups.find(g => g.groupCode === "G1");
    expect(g1).toBeDefined();
    expect(g1?.fullName).toContain("G1 — Sistematização");
    expect(g1?.coordinatorName).toBe("Floriano Carlos Martins Pires Jr.");
    expect(g1?.members).toContain("Segen Farid Estefen");
    expect(g1?.members).toContain("Luiz Felipe Assis");
    expect(g1?.members).toContain("Cassiano Marins de Souza");
    expect(g1?.members).toContain("Carlos Frederico Leão Rocha");
    expect(g1?.members).toContain("Marcelo Colomer Ferraro");

    const g11 = result.groups.find(g => g.groupCode === "G11");
    expect(g11).toBeDefined();
    expect(g11?.coordinatorName).toBe("Marta Cecilia Tapia Reyes");
    expect(g11?.members).toContain("Marcos Pereira");
    expect(g11?.members).toContain("João Candido Gonçalves da Silva");
    expect(g11?.members).toContain("Sergio Lamarca Leite");
    expect(g11?.members).toContain("Isaias Quaresma Masetti");
  });

  it("identifica corretamente os membros de governança (Geral, Administrativa, Técnica)", () => {
    const result = parseSpreadsheetMatrix(SAMPLE_CSV);
    expect(result.governance.geral).toContain("Floriano Carlos Martins Pires Jr.");
    expect(result.governance.administrativa).toContain("Luiz Felipe Assis");
    expect(result.governance.administrativa).toContain("Denise Cunha");
    expect(result.governance.tecnica).toContain("Floriano Carlos Martins Pires Jr.");
    expect(result.governance.tecnica).toContain("Segen Farid Estefen");
    expect(result.governance.tecnica).toContain("Luiz Felipe Assis");
    expect(result.governance.tecnica).toContain("Carlos Frederico Leão Rocha");
    expect(result.governance.tecnica).toContain("Marcelo Colomer Ferraro");
    expect(result.governance.tecnica).toContain("Cassiano Marins de Souza");
  });

  it("parseia o template canônico padrão sem erros", () => {
    const result = parseSpreadsheetMatrix(DEFAULT_SPREADSHEET_CSV_TEMPLATE);
    expect(result.groups).toHaveLength(11);
    expect(result.allMemberNames.length).toBeGreaterThanOrEqual(30);
  });
});
