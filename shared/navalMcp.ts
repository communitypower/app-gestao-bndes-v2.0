/**
 * Contratos das ferramentas do servidor MCP bndes-naval-mcp
 * (repositório communitypower/Estudo_BNDES_MCP_Pipeline, packages/mcp/src/tools).
 */

export const NAVAL_SOURCE_FILTERS = [
  { value: "all", label: "Todo o corpus" },
  { value: "coppe_ufrj", label: "COPPE/UFRJ" },
  { value: "geipot", label: "GEIPOT" },
  { value: "ipea", label: "IPEA" },
  { value: "bndes_proposta", label: "Proposta BNDES" },
  { value: "wbs_evm", label: "Nota WBS/EVM" },
  { value: "consultoria", label: "Consultoria (anonimizada)" },
] as const;

export type NavalSourceFilter = (typeof NAVAL_SOURCE_FILTERS)[number]["value"];

export const NAVAL_SHIPYARDS = ["EAS", "VARD", "EISA", "WilsonSons", "Oceana"] as const;

export const NAVAL_DOCUMENTS = [
  { id: "coppe-v1", label: "COPPE/UFRJ — Volume 1" },
  { id: "coppe-v2", label: "COPPE/UFRJ — Volume 2" },
  { id: "coppe-v3", label: "COPPE/UFRJ — Volume 3" },
  { id: "coppe-v4", label: "COPPE/UFRJ — Volume 4" },
  { id: "geipot-sobena-1999", label: "GEIPOT/SOBENA 1999" },
  { id: "geipot-fgv-1999", label: "GEIPOT/FGV 1999" },
  { id: "benchmarking-2007", label: "Benchmarking COPPE 2007" },
  { id: "ipea-2014", label: "IPEA 2014" },
  { id: "bndes-poli-27664", label: "Proposta BNDES POLI 27664" },
  { id: "wbs-evm-nota", label: "Nota Técnica WBS/EVM" },
  { id: "consultoria-2018", label: "Consultoria 2018 (anonimizada)" },
] as const;

export type NavalEvidenceChunk = {
  source: string;
  abbrev: string;
  year: number | null;
  page: string;
  similarity: number;
  excerpt: string;
  isAnonymized: boolean;
};

export type NavalSearchCorpusResult = {
  query: string;
  results: NavalEvidenceChunk[];
  metadata: {
    totalFound: number;
    filterApplied: string;
    minSimilarity: number;
    note: string | null;
  };
};

export type NavalShipyardProfile = {
  found: boolean;
  sigla: string;
  name: string;
  location: string | null;
  status: string | null;
  capacity: {
    steelTonPerYear: number | null;
    dryDockCount: number | null;
    dryDockMaxLengthM: number | null;
    coveredAreaM2: number | null;
  };
  workforce: { peak: number | null; current: number | null; retentionRate: string | null };
  competitiveness: {
    equipment: string;
    processes: string;
    management: string;
    summary: string;
    manHoursGapRatio: string | null;
    benchmarkReference: string | null;
  };
  promef: {
    unitsContracted: number | null;
    unitsDelivered: number | null;
    completionRate: string | null;
    notes: string | null;
  };
  decarbonization: { readiness: string | null; notes: string | null };
  projects: {
    name: string | null;
    vesselType: string | null;
    client: string | null;
    period: string;
    units: number | null;
    program: string | null;
  }[];
  benchmarks: {
    country: string;
    shipyardName: string | null;
    metric: string;
    value: string | null;
    unit: string | null;
    year: number | null;
  }[];
  sources: string[];
  analyticalNote: string;
};

export type NavalCrossReferenceEvidence = Omit<NavalEvidenceChunk, "isAnonymized"> & {
  stance: "supports" | "contradicts" | "qualifies";
};

export type NavalCrossReferenceResult = {
  claim: string;
  stance: string;
  supporting: NavalCrossReferenceEvidence[];
  contradicting: NavalCrossReferenceEvidence[];
  verdict: "well_supported" | "partially_supported" | "contradicted" | "inconclusive";
  verdictRationale: string;
};

export type NavalCitationResult = {
  docId: string;
  found: boolean;
  isAnonymized: boolean;
  inline: string;
  footnote: string;
  referenceList: string;
  warning: string | null;
};
