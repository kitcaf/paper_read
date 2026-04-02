import type { ScreeningIntent } from "@paper-read/shared";

const MINIMUM_TERM_LENGTH = 3;

const STOP_WORDS = new Set([
  "about",
  "against",
  "agent",
  "agents",
  "and",
  "any",
  "are",
  "articles",
  "find",
  "for",
  "from",
  "into",
  "looking",
  "need",
  "papers",
  "please",
  "related",
  "show",
  "that",
  "the",
  "their",
  "these",
  "those",
  "with",
  "关于",
  "以及",
  "使用",
  "我们",
  "想要",
  "文章",
  "论文",
  "筛选"
]);

const EXCLUDE_PATTERNS = [/exclude\s+([a-z0-9\s-]+)/i, /without\s+([a-z0-9\s-]+)/i, /不要\s*([^\s,，。]+)/i];

function tokenize(input: string) {
  return input
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fa5-]+/u)
    .map((term) => term.trim())
    .filter((term) => term.length >= MINIMUM_TERM_LENGTH && !STOP_WORDS.has(term));
}

function deduplicateTerms(terms: string[]) {
  return Array.from(new Set(terms));
}

function extractExcludeTerms(queryText: string) {
  const excludedTerms: string[] = [];

  for (const pattern of EXCLUDE_PATTERNS) {
    const match = queryText.match(pattern);
    if (!match?.[1]) {
      continue;
    }

    excludedTerms.push(...tokenize(match[1]));
  }

  return deduplicateTerms(excludedTerms);
}

function buildIntentSummary(focusTerms: string[], excludeTerms: string[]) {
  const focusText = focusTerms.length ? focusTerms.join(" / ") : "general relevance";
  if (!excludeTerms.length) {
    return `Focus on papers related to ${focusText}.`;
  }

  return `Focus on papers related to ${focusText}, while avoiding ${excludeTerms.join(" / ")}.`;
}

export function analyzeScreeningIntent(queryText: string): ScreeningIntent {
  const focusTerms = deduplicateTerms(tokenize(queryText));
  const excludeTerms = extractExcludeTerms(queryText);

  return {
    focusTerms,
    excludeTerms,
    summary: buildIntentSummary(focusTerms, excludeTerms)
  };
}
