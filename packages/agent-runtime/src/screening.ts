import type { PaperRecord, ScreeningDecision } from "@paper-read/shared";

const SCORE_PRECISION = 1000;
const MATCH_THRESHOLD = 0.25;

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fa5]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

export function analyzeIntent(queryText: string) {
  const focusTerms = Array.from(new Set(tokenize(queryText))).slice(0, 12);

  return {
    summary: focusTerms.length
      ? `Focus on papers related to ${focusTerms.slice(0, 5).join(", ")}.`
      : "Focus on papers related to the submitted research intent.",
    focusTerms
  };
}

export function scorePaperTitle(queryText: string, paper: PaperRecord) {
  const queryTerms = tokenize(queryText);
  const titleTerms = new Set(tokenize(paper.title));

  if (!queryTerms.length || !titleTerms.size) {
    return {
      decision: "uncertain" as ScreeningDecision,
      score: 0,
      reasoning: "The query or paper title does not contain enough terms for a title-only screening pass."
    };
  }

  const hitCount = queryTerms.filter((term) => titleTerms.has(term)).length;
  const rawScore = hitCount / queryTerms.length;
  const score = Math.round(rawScore * SCORE_PRECISION) / SCORE_PRECISION;
  const decision: ScreeningDecision =
    score >= MATCH_THRESHOLD ? "keep" : score > 0 ? "uncertain" : "discard";

  return {
    decision,
    score,
    reasoning:
      hitCount > 0
        ? `Matched ${hitCount} title term(s) in the first title-only screening pass.`
        : "No title terms matched in the first title-only screening pass."
  };
}
