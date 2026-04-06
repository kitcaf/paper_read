import type { PaperRecord, SourceSummary } from "@paper-read/shared";

export interface PaperSourceConnector {
  readonly sourceKey: string;
  readonly label: string;
  listPapers(): Promise<PaperRecord[]>;
}

export interface LocalSourceDefinition {
  sourceKey: string;
  label: string;
}

export const BUILT_IN_SOURCE_DEFINITIONS: LocalSourceDefinition[] = [
  {
    sourceKey: "aaai_2026",
    label: "AAAI 2026"
  }
];

export function summarizeSource(source: LocalSourceDefinition, papers: PaperRecord[]): SourceSummary {
  const sourcePapers = papers.filter((paper) => paper.sourceKey === source.sourceKey);

  return {
    sourceKey: source.sourceKey,
    label: source.label,
    paperCount: sourcePapers.length,
    hasAbstractCount: sourcePapers.filter((paper) => Boolean(paper.abstract)).length
  };
}
