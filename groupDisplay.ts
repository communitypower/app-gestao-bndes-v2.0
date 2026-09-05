/**
 * Rótulos concisos para leitura rápida na interface. Os nomes integrais do
 * banco permanecem a referência institucional e são preservados nas fichas.
 */
const GROUP_SHORT_NAMES: Record<string, string> = {
  "G1 — Sistematização": "G1 · Sistematização",
  "G2 — Política Industrial e Cadeia de Suprimentos": "G2 · Política industrial",
  "G3 — Transporte Marítimo Brasil e Políticas Marítimas": "G3 · Transporte e políticas",
  "G4 — Transporte Marítimo Mundial": "G4 · Transporte mundial",
  "G5 — Fundo da Marinha Mercante": "G5 · FMM",
  "G6 — Offshore": "G6 · Offshore",
  "G7 — Fluvial: Transporte e Construção": "G7 · Fluvial",
  "G8 — Descarbonização": "G8 · Descarbonização",
  "G9 — Construção Militar": "G9 · Construção militar",
  "G10 — Construção Naval Mundial e Análise Econômica": "G10 · CN mundial",
  "G11 — Construção Naval no Brasil": "G11 · CN Brasil",
};

export function groupDisplayName(name: string | null | undefined) {
  if (!name) return "Sem grupo";
  return GROUP_SHORT_NAMES[name] ?? name;
}
