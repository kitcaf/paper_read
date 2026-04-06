import type {
  ScreeningQueryDetail,
  ScreeningQueryOptions,
  ScreeningQuerySummary,
  ScreeningResultsPage,
  SourceSummary
} from "@paper-read/shared";
import { useEffect, useEffectEvent, useState, useTransition } from "react";

import {
  createScreeningQuery,
  getScreeningQuery,
  getScreeningResults,
  listScreeningQueries,
  listSources
} from "../api/screeningApi";

interface SubmitScreeningQueryInput {
  sourceKey: string;
  queryText: string;
  modelProfileId?: string;
  options: ScreeningQueryOptions;
}

const ACTIVE_QUERY_STATUSES = new Set(["queued", "running"]);
const POLLING_INTERVAL_MS = 2500;

export function useScreeningWorkspace() {
  const [sources, setSources] = useState<SourceSummary[]>([]);
  const [queryHistory, setQueryHistory] = useState<ScreeningQuerySummary[]>([]);
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);
  const [selectedQuery, setSelectedQuery] = useState<ScreeningQueryDetail | null>(null);
  const [resultsPage, setResultsPage] = useState<ScreeningResultsPage | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [composerResetKey, setComposerResetKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  const loadQueryHistoryEvent = useEffectEvent(async () => {
    const response = await listScreeningQueries();
    startTransition(() => {
      setQueryHistory(response.items);
    });

    return response.items;
  });

  const loadSelectedQueryEvent = useEffectEvent(
    async (queryId: string, options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setIsRefreshing(true);
      }

      try {
        const [queryDetail, queryResults] = await Promise.all([
          getScreeningQuery(queryId),
          getScreeningResults(queryId)
        ]);

        startTransition(() => {
          setSelectedQuery(queryDetail);
          setResultsPage(queryResults);
        });
      } catch (error) {
        const nextErrorMessage =
          error instanceof Error ? error.message : "Failed to load screening query.";
        setErrorMessage(nextErrorMessage);
      } finally {
        if (!options?.silent) {
          setIsRefreshing(false);
        }
      }
    }
  );

  useEffect(() => {
    let isMounted = true;

    async function bootstrapWorkspace() {
      setIsBootstrapping(true);
      setErrorMessage(null);

      try {
        const [availableSources, historyItems] = await Promise.all([
          listSources(),
          loadQueryHistoryEvent()
        ]);

        if (!isMounted) {
          return;
        }

        setSources(availableSources);
        if (!selectedQueryId && historyItems[0]) {
          setSelectedQueryId(historyItems[0].id);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const nextErrorMessage =
          error instanceof Error ? error.message : "Failed to bootstrap screening workspace.";
        setErrorMessage(nextErrorMessage);
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    }

    void bootstrapWorkspace();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedQueryId) {
      return;
    }

    void loadSelectedQueryEvent(selectedQueryId);
  }, [selectedQueryId]);

  useEffect(() => {
    if (!selectedQueryId || !selectedQuery || !ACTIVE_QUERY_STATUSES.has(selectedQuery.status)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadSelectedQueryEvent(selectedQueryId, { silent: true });
      void loadQueryHistoryEvent();
    }, POLLING_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [selectedQuery, selectedQueryId]);

  async function handleSubmitQuery(input: SubmitScreeningQueryInput) {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const createdQuery = await createScreeningQuery(input);
      await loadQueryHistoryEvent();
      setSelectedQuery(null);
      setResultsPage(null);
      setSelectedQueryId(createdQuery.id);
      return true;
    } catch (error) {
      const nextErrorMessage =
        error instanceof Error ? error.message : "Failed to create screening query.";
      setErrorMessage(nextErrorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSelectQuery(queryId: string) {
    setSelectedQuery(null);
    setResultsPage(null);
    setSelectedQueryId(queryId);
    setErrorMessage(null);
  }

  function handleStartNewChat() {
    setSelectedQueryId(null);
    setSelectedQuery(null);
    setResultsPage(null);
    setErrorMessage(null);
    setComposerResetKey((currentValue) => currentValue + 1);
  }

  async function handleRefreshCurrentQuery() {
    if (!selectedQueryId) {
      return;
    }

    await loadSelectedQueryEvent(selectedQueryId);
    await loadQueryHistoryEvent();
  }

  return {
    sources,
    queryHistory,
    selectedQueryId,
    selectedQuery,
    resultsPage,
    errorMessage,
    isBootstrapping,
    isSubmitting,
    isRefreshing,
    isPending,
    composerResetKey,
    onSubmitQuery: handleSubmitQuery,
    onSelectQuery: handleSelectQuery,
    onStartNewChat: handleStartNewChat,
    onRefreshCurrentQuery: handleRefreshCurrentQuery
  };
}
