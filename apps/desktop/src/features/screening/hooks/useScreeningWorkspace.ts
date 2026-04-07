import type {
  LocalMessageRecord,
  ScreeningQueryOptions,
  ScreeningResultsPage,
  SourceSummary
} from "@paper-read/shared";
import { useEffect, useEffectEvent, useState, useTransition } from "react";

import {
  createScreeningQuery,
  getScreeningQuery,
  getScreeningResults,
  listScreeningQueries,
  listSources,
  sendChatMessage
} from "../api/screeningApi";
import type {
  WorkspaceConversationDetail,
  WorkspaceConversationSummary
} from "../workspaceTypes";

interface SubmitChatInput {
  mode: "chat";
  queryText: string;
  modelProfileId?: string;
}

interface SubmitScreeningInput {
  mode: "screening";
  sourceKey: string;
  queryText: string;
  modelProfileId?: string;
  options: ScreeningQueryOptions;
}

type SubmitConversationInput = SubmitChatInput | SubmitScreeningInput;

const ACTIVE_QUERY_STATUSES = new Set(["queued", "running"]);
const POLLING_INTERVAL_MS = 2500;

function nowIso() {
  return new Date().toISOString();
}

function createOptimisticChatMessages(
  conversationId: string,
  existingMessages: LocalMessageRecord[],
  queryText: string
) {
  const userTimestamp = nowIso();
  const assistantTimestamp = new Date(Date.now() + 1).toISOString();

  return [
    ...existingMessages,
    {
      id: `temp-user-${crypto.randomUUID()}`,
      conversationId,
      role: "user" as const,
      content: queryText,
      metadata: {
        optimistic: true
      },
      createdAt: userTimestamp
    },
    {
      id: `temp-assistant-${crypto.randomUUID()}`,
      conversationId,
      role: "assistant" as const,
      content: "正在思考...",
      metadata: {
        pending: true,
        optimistic: true
      },
      createdAt: assistantTimestamp
    }
  ];
}

function createOptimisticChatConversation(
  currentConversation: WorkspaceConversationDetail | null,
  queryText: string
): WorkspaceConversationDetail {
  const conversationId =
    currentConversation?.mode === "chat"
      ? currentConversation.id
      : `temp-chat-${crypto.randomUUID()}`;
  const createdAt =
    currentConversation?.mode === "chat" ? currentConversation.createdAt : nowIso();
  const updatedAt = nowIso();

  return {
    id: conversationId,
    title:
      currentConversation?.mode === "chat"
        ? currentConversation.title
        : queryText.slice(0, 80) || "新对话",
    preview: queryText,
    mode: "chat",
    sourceLabel: "自由聊天",
    status: "running",
    modelProfileId: currentConversation?.modelProfileId,
    modelProfileName: currentConversation?.modelProfileName,
    createdAt,
    updatedAt,
    queryText,
    messages: createOptimisticChatMessages(
      conversationId,
      currentConversation?.mode === "chat" ? currentConversation.messages : [],
      queryText
    ),
    options: {},
    intentSummary: null,
    intentJson: null,
    lastError: null,
    totalPapers: 0,
    processedPapers: 0,
    matchedPapers: 0,
    failedPapers: 0,
    completedAt: null
  };
}

export function useScreeningWorkspace() {
  const [sources, setSources] = useState<SourceSummary[]>([]);
  const [conversationHistory, setConversationHistory] = useState<WorkspaceConversationSummary[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] =
    useState<WorkspaceConversationDetail | null>(null);
  const [resultsPage, setResultsPage] = useState<ScreeningResultsPage | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [composerResetKey, setComposerResetKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  const loadConversationHistoryEvent = useEffectEvent(async () => {
    const response = await listScreeningQueries();
    startTransition(() => {
      setConversationHistory(response.items);
    });

    return response.items;
  });

  const loadSelectedConversationEvent = useEffectEvent(
    async (conversationId: string, options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setIsRefreshing(true);
      }

      try {
        const conversationDetail = await getScreeningQuery(conversationId);
        const conversationResults =
          conversationDetail.mode === "screening"
            ? await getScreeningResults(conversationId)
            : null;

        startTransition(() => {
          setSelectedConversation(conversationDetail);
          setResultsPage(conversationResults);
        });
      } catch (error) {
        const nextErrorMessage =
          error instanceof Error ? error.message : "Failed to load conversation.";
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
          loadConversationHistoryEvent()
        ]);

        if (!isMounted) {
          return;
        }

        setSources(availableSources);
        if (!selectedConversationId && historyItems[0]) {
          setSelectedConversationId(historyItems[0].id);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const nextErrorMessage =
          error instanceof Error ? error.message : "Failed to bootstrap workspace.";
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
    if (!selectedConversationId) {
      return;
    }

    void loadSelectedConversationEvent(selectedConversationId);
  }, [selectedConversationId]);

  useEffect(() => {
    if (
      !selectedConversationId ||
      !selectedConversation ||
      selectedConversation.mode !== "screening" ||
      !ACTIVE_QUERY_STATUSES.has(selectedConversation.status)
    ) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadSelectedConversationEvent(selectedConversationId, { silent: true });
      void loadConversationHistoryEvent();
    }, POLLING_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [selectedConversation, selectedConversationId]);

  async function handleSubmitConversation(input: SubmitConversationInput) {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (input.mode === "chat") {
        const optimisticConversation = createOptimisticChatConversation(
          selectedConversation,
          input.queryText
        );

        startTransition(() => {
          setSelectedConversation(optimisticConversation);
          setResultsPage(null);
        });

        if (selectedConversation?.mode !== "chat") {
          setSelectedConversationId(null);
        }

        const nextConversation = await sendChatMessage({
          messageText: input.queryText,
          conversationId:
            selectedConversation?.mode === "chat" ? selectedConversation.id : undefined,
          modelProfileId: input.modelProfileId
        });

        await loadConversationHistoryEvent();
        startTransition(() => {
          setSelectedConversation(nextConversation);
          setSelectedConversationId(nextConversation.id);
          setResultsPage(null);
        });
        return true;
      }

      const createdConversation = await createScreeningQuery(input);
      await loadConversationHistoryEvent();
      setSelectedConversation(null);
      setResultsPage(null);
      setSelectedConversationId(createdConversation.id);
      return true;
    } catch (error) {
      const nextErrorMessage =
        error instanceof Error ? error.message : "Failed to submit conversation.";
      setErrorMessage(nextErrorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSelectConversation(conversationId: string) {
    setSelectedConversation(null);
    setResultsPage(null);
    setSelectedConversationId(conversationId);
    setErrorMessage(null);
  }

  function handleStartNewChat() {
    setSelectedConversationId(null);
    setSelectedConversation(null);
    setResultsPage(null);
    setErrorMessage(null);
    setComposerResetKey((currentValue) => currentValue + 1);
  }

  async function handleRefreshCurrentConversation() {
    if (!selectedConversationId) {
      return;
    }

    await loadSelectedConversationEvent(selectedConversationId);
    await loadConversationHistoryEvent();
  }

  return {
    sources,
    conversationHistory,
    selectedConversationId,
    selectedConversation,
    resultsPage,
    errorMessage,
    isBootstrapping,
    isSubmitting,
    isRefreshing,
    isPending,
    composerResetKey,
    onSubmitConversation: handleSubmitConversation,
    onSelectConversation: handleSelectConversation,
    onStartNewChat: handleStartNewChat,
    onRefreshCurrentConversation: handleRefreshCurrentConversation
  };
}
