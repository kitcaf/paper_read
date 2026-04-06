import type {
  PaperRecord,
  ScreeningDecision,
  ScreeningIntent
} from "@paper-read/shared";

import { analyzeIntent, scorePaperTitle } from "./screening";
import { generateWithStreamingFallback } from "./models/generate";
import type { ModelRuntime } from "./models/types";

interface ScreeningIntentModelResponse {
  summary?: unknown;
  focusTerms?: unknown;
  excludeTerms?: unknown;
}

interface ScreeningScoreModelResponse {
  decision?: unknown;
  score?: unknown;
  reasoning?: unknown;
  matchedKeywords?: unknown;
}

interface ScreeningModelResultMetadata {
  provider: string;
  modelName: string;
  usedFallback: boolean;
  fallbackReason?: string;
  matchedKeywords?: string[];
  usedStreamingFallback?: boolean;
  streamingFallbackReason?: string;
}

export interface ScreeningModelScore {
  decision: ScreeningDecision;
  score: number;
  reasoning: string;
  metadata: ScreeningModelResultMetadata;
}

const SCORE_MIN = 0;
const SCORE_MAX = 1;
const SCREENING_MODEL_TEMPERATURE = 0.1;
const SCREENING_MODEL_MAX_TOKENS = 700;

function clampScore(score: number) {
  return Math.min(Math.max(score, SCORE_MIN), SCORE_MAX);
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : [];
}

function asDecision(value: unknown): ScreeningDecision | null {
  if (value === "keep" || value === "discard" || value === "uncertain") {
    return value;
  }

  return null;
}

function parseJsonObject(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/u);
    if (!match) {
      throw new Error("Model response did not contain a JSON object.");
    }

    return JSON.parse(match[0]);
  }
}

function fallbackIntent(queryText: string, fallbackReason?: string): ScreeningIntent {
  const intent = analyzeIntent(queryText);

  return {
    ...intent,
    excludeTerms: [],
    summary: fallbackReason
      ? `${intent.summary} (Fallback: ${fallbackReason})`
      : intent.summary
  };
}

function fallbackScore(
  runtime: ModelRuntime,
  queryText: string,
  paper: PaperRecord,
  fallbackReason?: string
): ScreeningModelScore {
  const score = scorePaperTitle(queryText, paper);

  return {
    ...score,
    metadata: {
      provider: runtime.provider.kind,
      modelName: runtime.settings.modelName,
      usedFallback: true,
      ...(fallbackReason ? { fallbackReason } : {})
    }
  };
}

function parseIntentModelResponse(content: string): ScreeningIntent {
  const payload = parseJsonObject(content) as ScreeningIntentModelResponse;
  const summary =
    typeof payload.summary === "string" && payload.summary.trim()
      ? payload.summary.trim()
      : "Intent analyzed for title-only paper screening.";

  return {
    summary,
    focusTerms: asStringArray(payload.focusTerms),
    excludeTerms: asStringArray(payload.excludeTerms)
  };
}

function parseScoreModelResponse(
  runtime: ModelRuntime,
  content: string
): ScreeningModelScore {
  const payload = parseJsonObject(content) as ScreeningScoreModelResponse;
  const decision = asDecision(payload.decision);

  if (!decision) {
    throw new Error("Model response decision must be keep, discard, or uncertain.");
  }

  const rawScore = typeof payload.score === "number" && Number.isFinite(payload.score)
    ? payload.score
    : null;
  const reasoning =
    typeof payload.reasoning === "string" && payload.reasoning.trim()
      ? payload.reasoning.trim()
      : "No model reasoning was provided.";

  return {
    decision,
    score: rawScore === null ? 0 : clampScore(rawScore),
    reasoning,
    metadata: {
      provider: runtime.provider.kind,
      modelName: runtime.settings.modelName,
      usedFallback: false,
      matchedKeywords: asStringArray(payload.matchedKeywords)
    }
  };
}

export async function analyzeIntentWithModel(
  runtime: ModelRuntime,
  queryText: string
): Promise<ScreeningIntent> {
  if (runtime.provider.kind === "mock") {
    return fallbackIntent(queryText);
  }

  try {
    const response = await generateWithStreamingFallback(runtime, {
      messages: [
        {
          role: "system",
          content:
            "You analyze research screening intent. Return only JSON with summary, focusTerms, and excludeTerms."
        },
        {
          role: "user",
          content: `Research screening query:\n${queryText}`
        }
      ],
      temperature: SCREENING_MODEL_TEMPERATURE,
      maxTokens: SCREENING_MODEL_MAX_TOKENS,
      responseFormat: "json_object",
      stream: runtime.settings.stream
    });

    return parseIntentModelResponse(response.content);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return fallbackIntent(queryText, message);
  }
}

export async function scorePaperWithModel(
  runtime: ModelRuntime,
  queryText: string,
  paper: PaperRecord
): Promise<ScreeningModelScore> {
  if (runtime.provider.kind === "mock") {
    return fallbackScore(runtime, queryText, paper);
  }

  try {
    const response = await generateWithStreamingFallback(runtime, {
      messages: [
        {
          role: "system",
          content:
            "You screen academic papers for a research query. Use only the supplied title and optional abstract. Return only JSON with decision, score, reasoning, and matchedKeywords. decision must be keep, discard, or uncertain. score must be between 0 and 1."
        },
        {
          role: "user",
          content: JSON.stringify({
            queryText,
            paper: {
              title: paper.title,
              abstract: paper.abstract
            }
          })
        }
      ],
      temperature: SCREENING_MODEL_TEMPERATURE,
      maxTokens: SCREENING_MODEL_MAX_TOKENS,
      responseFormat: "json_object",
      stream: runtime.settings.stream
    });

    const parsedScore = parseScoreModelResponse(runtime, response.content);
    return {
      ...parsedScore,
      metadata: {
        ...parsedScore.metadata,
        usedStreamingFallback: response.usedStreamingFallback,
        ...(response.streamingFallbackReason
          ? { streamingFallbackReason: response.streamingFallbackReason }
          : {})
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return fallbackScore(runtime, queryText, paper, message);
  }
}
