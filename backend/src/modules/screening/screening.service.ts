import { analyzeScreeningIntent } from "../agent/services/intent-analyzer.js";
import { screenPaperWithRules } from "../agent/services/rule-based-screening-agent.js";
import { listPapersBySource, sourceExists } from "../papers/papers.repository.js";
import {
  applyTopKToResults,
  countMatchingResults,
  createScreeningQueryRecord,
  finalizeScreeningQuery,
  getScreeningQueryFromStore,
  initializeScreeningResults,
  listScreeningQueriesFromStore,
  listScreeningResultsFromStore,
  setScreeningIntent,
  updateProgressCounters,
  updateScreeningQueryFromStore,
  updateScreeningResult
} from "./screening.repository.js";
import type {
  CreateScreeningQueryInput,
  ListScreeningQueriesQuery,
  ListScreeningResultsQuery
} from "./screening.schema.js";

const activeScreeningQueryIds = new Set<string>();

function scheduleScreening(queryId: string) {
  if (activeScreeningQueryIds.has(queryId)) {
    return;
  }

  activeScreeningQueryIds.add(queryId);

  queueMicrotask(async () => {
    try {
      await processScreeningQuery(queryId);
    } finally {
      activeScreeningQueryIds.delete(queryId);
    }
  });
}

async function processScreeningQuery(queryId: string) {
  const screeningQuery = await getScreeningQueryFromStore(queryId);
  if (!screeningQuery) {
    return;
  }

  const papers = await listPapersBySource(screeningQuery.sourceKey);
  const screeningIntent = analyzeScreeningIntent(screeningQuery.queryText);
  if (screeningQuery.options.excludeKeywords?.length) {
    screeningIntent.excludeTerms = Array.from(
      new Set([...screeningIntent.excludeTerms, ...screeningQuery.options.excludeKeywords])
    );
    screeningIntent.summary = `${screeningIntent.summary} Extra excluded keywords: ${screeningQuery.options.excludeKeywords.join(", ")}.`;
  }

  await updateScreeningQueryFromStore(queryId, {
    status: "running"
  });
  await setScreeningIntent(queryId, screeningIntent, papers.length);
  await initializeScreeningResults(queryId, papers);

  let processedPapers = 0;
  let matchedPapers = 0;
  let failedPapers = 0;

  for (const paper of papers) {
    try {
      const screeningOutput = screenPaperWithRules({
        paper,
        intent: screeningIntent,
        inputMode: screeningQuery.inputMode,
        options: screeningQuery.options
      });

      processedPapers += 1;
      if (screeningOutput.decision === "keep") {
        matchedPapers += 1;
      }

      await updateScreeningResult(queryId, paper.id, {
        status: "completed",
        decision: screeningOutput.decision,
        score: screeningOutput.score,
        reasoning: screeningQuery.options.includeReasoning === false ? null : screeningOutput.reasoning,
        modelName: screeningOutput.modelName,
        options: {
          matchedTerms: screeningOutput.matchedTerms
        },
        processedAt: new Date().toISOString(),
        errorMessage: null
      });
      await updateProgressCounters(queryId, processedPapers, matchedPapers, failedPapers);
    } catch (error) {
      processedPapers += 1;
      failedPapers += 1;

      const errorMessage = error instanceof Error ? error.message : "Unknown screening error";
      await updateScreeningResult(queryId, paper.id, {
        status: "failed",
        decision: "uncertain",
        score: null,
        reasoning: null,
        modelName: null,
        errorMessage,
        processedAt: new Date().toISOString()
      });
      await updateProgressCounters(queryId, processedPapers, matchedPapers, failedPapers);
      await updateScreeningQueryFromStore(queryId, {
        lastError: errorMessage
      });
    }
  }

  if ((screeningQuery.options.topK ?? 0) > 0) {
    await applyTopKToResults(queryId, screeningQuery.options.topK!);
    matchedPapers = await countMatchingResults(queryId);
    await updateProgressCounters(queryId, processedPapers, matchedPapers, failedPapers);
  }

  const finalizedQuery = await getScreeningQueryFromStore(queryId);
  const nextStatus =
    finalizedQuery && finalizedQuery.failedPapers === finalizedQuery.totalPapers && finalizedQuery.totalPapers > 0
      ? "failed"
      : "completed";

  await finalizeScreeningQuery(queryId, nextStatus, finalizedQuery?.lastError ?? null);
}

export async function createScreeningQuery(input: CreateScreeningQueryInput) {
  const sourceIsKnown = await sourceExists(input.sourceKey);
  if (!sourceIsKnown) {
    throw new Error(`Unknown source key: ${input.sourceKey}`);
  }

  const screeningQuery = await createScreeningQueryRecord(input);
  scheduleScreening(screeningQuery.id);

  return screeningQuery;
}

export async function listScreeningQueries(query: ListScreeningQueriesQuery) {
  return listScreeningQueriesFromStore(query);
}

export async function getScreeningQuery(queryId: string) {
  return getScreeningQueryFromStore(queryId);
}

export async function getScreeningResults(queryId: string, query: ListScreeningResultsQuery) {
  return listScreeningResultsFromStore(queryId, query);
}
