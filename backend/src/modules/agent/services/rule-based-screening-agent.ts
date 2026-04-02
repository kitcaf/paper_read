import type {
  PaperRecord,
  ScreeningDecision,
  ScreeningInputMode,
  ScreeningIntent,
  ScreeningQueryOptions
} from "@paper-read/shared";

const MODEL_NAME = "rule-based-screening-agent";
const DEFAULT_KEEP_THRESHOLD = 0.58;
const DEFAULT_UNCERTAIN_THRESHOLD = 0.3;

const TERM_ALIASES: Record<string, string[]> = {
  agent: ["agent", "agents", "agentic"],
  planning: ["planning", "planner", "plan"],
  rag: ["rag", "retrieval", "retrieval-augmented"],
  retrieval: ["retrieval", "retriever", "grounded"],
  multiagent: ["multi-agent", "multiagent", "collaborative", "coordination"],
  reasoning: ["reasoning", "deliberation", "verification"],
  tool: ["tool", "tool-use", "tools"]
};

interface ScreenPaperInput {
  paper: PaperRecord;
  intent: ScreeningIntent;
  inputMode: ScreeningInputMode;
  options: ScreeningQueryOptions;
}

export interface ScreenPaperOutput {
  decision: ScreeningDecision;
  score: number;
  reasoning: string;
  matchedTerms: string[];
  modelName: string;
}

function normalizeTerm(term: string) {
  return term.replace(/[\s_-]+/g, "");
}

function resolveSearchTerms(term: string) {
  const normalizedTerm = normalizeTerm(term);
  const aliasTerms = TERM_ALIASES[normalizedTerm] ?? [];

  return Array.from(new Set([term, normalizedTerm, ...aliasTerms]));
}

function buildSearchText(paper: PaperRecord, inputMode: ScreeningInputMode) {
  const fieldValues = [paper.title];
  if (inputMode === "title_abstract" && paper.abstract) {
    fieldValues.push(paper.abstract);
  }

  return fieldValues.join(" ").toLowerCase();
}

function collectMatchedTerms(searchText: string, focusTerms: string[]) {
  const matchedTerms = new Set<string>();

  for (const focusTerm of focusTerms) {
    const searchTerms = resolveSearchTerms(focusTerm);
    if (searchTerms.some((term) => searchText.includes(term.toLowerCase()))) {
      matchedTerms.add(focusTerm);
    }
  }

  return Array.from(matchedTerms);
}

function countExcludeHits(searchText: string, excludeTerms: string[]) {
  return excludeTerms.filter((term) =>
    resolveSearchTerms(term).some((searchTerm) => searchText.includes(searchTerm.toLowerCase()))
  ).length;
}

function computeScore(
  matchedTerms: string[],
  focusTerms: string[],
  excludeHits: number,
  paper: PaperRecord,
  options: ScreeningQueryOptions
) {
  const focusCoverage = focusTerms.length ? matchedTerms.length / focusTerms.length : 0.45;
  const yearBoost =
    options.preferredYears?.length && paper.year && options.preferredYears.includes(paper.year)
      ? 0.08
      : 0;
  const abstractBoost = paper.abstract ? 0.04 : 0;
  const excludePenalty = excludeHits * 0.24;

  return Math.max(0, Math.min(1, focusCoverage + yearBoost + abstractBoost - excludePenalty));
}

function decide(score: number, threshold: number): ScreeningDecision {
  if (score >= threshold) {
    return "keep";
  }

  if (score >= Math.min(threshold - 0.08, DEFAULT_UNCERTAIN_THRESHOLD)) {
    return "uncertain";
  }

  return "discard";
}

function buildReasoning(
  paper: PaperRecord,
  decision: ScreeningDecision,
  matchedTerms: string[],
  excludeHits: number
) {
  const reasoningFragments = [
    `Decision: ${decision}.`,
    matchedTerms.length
      ? `Matched query themes: ${matchedTerms.join(", ")}.`
      : "The title shows limited overlap with the requested focus.",
    excludeHits > 0 ? "The paper also touches excluded themes." : null,
    paper.abstract
      ? "The source already includes an abstract for future deep screening."
      : "This run only relied on title evidence."
  ].filter(Boolean);

  return reasoningFragments.join(" ");
}

export function screenPaperWithRules(input: ScreenPaperInput): ScreenPaperOutput {
  const threshold = input.options.threshold ?? DEFAULT_KEEP_THRESHOLD;
  const searchText = buildSearchText(input.paper, input.inputMode);
  const matchedTerms = collectMatchedTerms(searchText, input.intent.focusTerms);
  const excludeHits = countExcludeHits(searchText, input.intent.excludeTerms);
  const score = computeScore(
    matchedTerms,
    input.intent.focusTerms,
    excludeHits,
    input.paper,
    input.options
  );
  const decision = decide(score, threshold);

  return {
    decision,
    score: Number(score.toFixed(4)),
    reasoning: buildReasoning(input.paper, decision, matchedTerms, excludeHits),
    matchedTerms,
    modelName: MODEL_NAME
  };
}
