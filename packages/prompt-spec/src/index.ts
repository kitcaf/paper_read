export interface ScreeningPromptInput {
  queryText: string;
  title: string;
  abstract?: string | null;
}

export function buildTitleScreeningPrompt(input: ScreeningPromptInput) {
  return [
    "You are screening academic papers for a local-first research workspace.",
    "Decide whether the paper matches the user's research intent.",
    `Research intent: ${input.queryText}`,
    `Paper title: ${input.title}`,
    input.abstract ? `Paper abstract: ${input.abstract}` : "Paper abstract: unavailable",
    "Return a decision, score, and concise reasoning."
  ].join("\n");
}
