/**
 * Reestruturações de capítulos aprovadas pela coordenação depois da carga do
 * índice analítico. Cada entrada descreve como as linhas de `activities` já
 * existentes no banco devem ser remanejadas para que o conteúdo (minutas,
 * revisões, interfaces, marcos) acompanhe a seção correspondente na nova
 * numeração. O catálogo canônico (`pdfAnalyticIndex.ts`) e o cronograma
 * (`officialScheduleMes3.ts`) já refletem a estrutura nova; este arquivo só
 * orienta a migração dos dados existentes.
 *
 * Regras de segurança aplicadas por `applyChapterRestructurings`:
 * - Nada é apagado: as seções fundidas são arquivadas
 *   (`structureStatus = "arquivada"`) com registro em
 *   `activity_structure_reconciliations`, o que permite reverter.
 * - A migração só é aplicada se todas as linhas de origem existirem com o
 *   título antigo esperado; se a estrutura já estiver na forma nova, é
 *   ignorada; em qualquer outro estado, nada é alterado e o fato é registrado
 *   no log.
 * - Seções a arquivar com minuta ou submissão de revisão bloqueiam a migração.
 */

export type ChapterRestructuring = {
  key: string;
  chapter: string;
  sourceReference: string;
  reason: string;
  /** Seções fundidas em `mergeInto` e arquivadas. */
  retire: ReadonlyArray<{ code: string; oldTitle: string }>;
  /** Código da seção que recebe o conteúdo das seções arquivadas. */
  mergeInto: string;
  /** Seções que mudam de número, levando consigo o seu conteúdo. */
  moves: ReadonlyArray<{ from: string; to: string; oldTitle: string }>;
};

export const CHAPTER_RESTRUCTURINGS: ReadonlyArray<ChapterRestructuring> = [
  {
    key: "III.4-2026-11",
    chapter: "III.4",
    sourceReference:
      "E-mails G3/Aquapar (Freigedo) de 26/10, 27/10 e 30/10/2026; ajuste de L. F. Assis em 30/10/2026; aceite em 03/11/2026",
    reason:
      "Reorganização do capítulo III.4 por assunto (políticas, instrumentos e mudanças): itens 4.1 a 4.4 fundidos no novo 4.1 e 'Resultados' como penúltimo item (4.8).",
    retire: [
      { code: "III.4.2", oldTitle: "Evolução das políticas brasileiras de marinha mercante" },
      { code: "III.4.3", oldTitle: "Evolução das políticas brasileiras de construção naval" },
      {
        code: "III.4.4",
        oldTitle:
          "Os Planos de Desenvolvimento e os Planos de Construção Naval: ciclos de 1970–1980 e 2000–2010",
      },
    ],
    mergeInto: "III.4.1",
    moves: [
      {
        from: "III.4.8",
        to: "III.4.2",
        oldTitle: "Políticas de pesquisa, desenvolvimento, inovação e formação de recursos humanos",
      },
      { from: "III.4.9", to: "III.4.3", oldTitle: "Clusters navais e políticas de desenvolvimento regional" },
      {
        from: "III.4.10",
        to: "III.4.4",
        oldTitle:
          "Políticas para os setores de óleo e gás, defesa e energia e seus impactos sobre a indústria naval",
      },
      {
        from: "III.4.11",
        to: "III.4.8",
        oldTitle: "Resultados das políticas brasileiras de marinha mercante e construção naval",
      },
      { from: "III.4.12", to: "III.4.9", oldTitle: "Mudanças recentes e principais questões em debate no Brasil" },
    ],
  },
];
