export const REFERENCE_ASSIGNMENT_CODES = {
  G4: [
    "I.3.1", "I.3.2", "I.3.3", "I.3.4", "I.3.5", "I.3.6", "I.3.7",
    "I.3.8", "I.3.9", "I.3.10", "I.3.11", "I.3.12", "I.6.5", "I.6.6", "II.5.7",
  ],
  G10: [
    "II.1.1", "II.1.2", "II.1.3", "II.1.4", "II.1.5", "II.1.6", "II.1.7",
    "II.6.2", "II.6.4", "II.6.5", "II.7.4", "II.7.5", "II.7.6", "II.7.7",
    "II.8.1", "II.8.2", "II.8.3", "II.8.4", "II.8.5", "II.8.6",
  ],
} as const;

export type ReferenceAssignmentGroupCode = keyof typeof REFERENCE_ASSIGNMENT_CODES;

export const REFERENCE_ASSIGNMENT_GROUP_LABELS: Record<ReferenceAssignmentGroupCode, string> = {
  G4: "G4 — Transporte Marítimo Mundial",
  G10: "G10 — Construção Naval Mundial e Análise Econômica",
};

export function referenceCodesForGroup(groupCode: ReferenceAssignmentGroupCode) {
  return REFERENCE_ASSIGNMENT_CODES[groupCode];
}
