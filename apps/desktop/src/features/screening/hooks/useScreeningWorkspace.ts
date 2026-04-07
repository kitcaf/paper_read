import type {
  AgentEvent,
  LocalMessageRecord,
  ScreeningQueryOptions,
  ScreeningResultsPage,
  SourceSummary
} from "@paper-read/shared";
import { useEffect, useEffectEvent, useRef, useState, useTransition } from "react";

import {
  createScreeningQuery,
  getScreeningQuery,
  getScreeningResults,
  listScreeningQueries,
  listSources,
  sendChatMessage,
  subscribeToAgentEvents
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

interface ChatStreamState {
  sessionId: string | null;
  runId: string | null;
  assistantMessageClientId: string | null;
  bufferedDelta: string;
  hasReceivedDelta: boolean;
  frameId: number | null;
  lastSeq: number;
}

const ACTIVE_QUERY_STATUSES = new Set(["queued", "running"]);
const POLLING_INTERVAL_MS = 2500;
const CHAT_SESSION_PREFIX = "session";
const CHAT_TURN_PREFIX = "turn";
const CHAT_RUN_PREFIX = "run";
const CHAT_USER_MESSAGE_PREFIX = "msg-user";
const CHAT_ASSISTANT_MESSAGE_PREFIX = "msg-assistant";

function nowIso() {
  return new Date().toISOString();
}

function createPrefixedId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function createOptimisticChatMessages(input: {
  conversationId: string;
  existingMessages: LocalMessageRecord[];
  queryText: string;
  turnId: string;
  runId: string;
  userMessageClientId: string;
  assistantMessageClientId: string;
  modelProfileId?: string;
}) {
  const userTimestamp = nowIso();
  const assistantTimestamp = new Date(Date.now() + 1).toISOString();

  return [
    ...input.existingMessages,
    {
      id: input.userMessageClientId,
      clientMessageId: input.userMessageClientId,
      conversationId: input.conversationId,
      role: "user" as const,
      content: input.queryText,
      metadata: {
        optimistic: true,
        turnId: input.turnId,
        runId: input.runId,
        clientMessageId: input.userMessageClientId,
        ...(input.modelProfileId ? { modelProfileId: input.modelProfileId } : {})
      },
      createdAt: userTimestamp
    },
    {
      id: input.assistantMessageClientId,
      clientMessageId: input.assistantMessageClientId,
      conversationId: input.conversationId,
      role: "assistant" as const,
      content: "",
      metadata: {
        pending: true,
        optimistic: true,
        streaming: true,
        turnId: input.turnId,
        runId: input.runId,
        clientMessageId: input.assistantMessageClientId,
        ...(input.modelProfileId ? { modelProfileId: input.modelProfileId } : {})
      },
      createdAt: assistantTimestamp
    }
  ];
}

function createOptimisticChatConversation(input: {
  currentConversation: WorkspaceConversationDetail | null;
  sessionId: string;
  queryText: string;
  turnId: string;
  runId: string;
  userMessageClientId: string;
  assistantMessageClientId: string;
  modelProfileId?: string;
}): WorkspaceConversationDetail {
  const createdAt = input.currentConversation?.mode === "chat" ? input.currentConversation.createdAt : nowIso();
  const updatedAt = nowIso();

  return {
    id: input.sessionId,
    title:
      input.currentConversation?.mode === "chat"
        ? input.currentConversation.title
        : input.queryText.slice(0, 80) || "新对话",
    preview: input.queryText,
    mode: "chat",
    sourceLabel: "自由聊天",
    status: "running",
    modelProfileId: input.modelProfileId ?? input.currentConversation?.modelProfileId,
    modelProfileName: input.currentConversation?.modelProfileName,
    createdAt,
    updatedAt,
    queryText: input.queryText,
    messages: createOptimisticChatMessages({
      conversationId: input.sessionId,
      existingMessages:
        input.currentConversation?.mode === "chat" ? input.currentConversation.messages : [],
      queryText: input.queryText,
      turnId: input.turnId,
      runId: input.runId,
      userMessageClientId: input.userMessageClientId,
      assistantMessageClientId: input.assistantMessageClientId,
      modelProfileId: input.modelProfileId
    }),
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

function updateMessageByClientId(
  messages: LocalMessageRecord[],
  clientMessageId: string,
  updater: (message: LocalMessageRecord) => LocalMessageRecord
) {
  let hasUpdated = false;

  const nextMessages = messages.map((message) => {
    if (message.clientMessageId !== clientMessageId) {
      return message;
    }

    hasUpdated = true;
    return updater(message);
  });

  return hasUpdated ? nextMessages : messages;
}

function mergeMessageRecords(
  currentMessages: LocalMessageRecord[],
  incomingMessages: LocalMessageRecord[]
) {
  const mergedMessages = new Map<string, LocalMessageRecord>();
  const orderedClientMessageIds: string[] = [];
  const knownClientMessageIds = new Set<string>();

  const upsertMessage = (message: LocalMessageRecord) => {
    const existingMessage = mergedMessages.get(message.clientMessageId);

    if (!knownClientMessageIds.has(message.clientMessageId)) {
      knownClientMessageIds.add(message.clientMessageId);
      orderedClientMessageIds.push(message.clientMessageId);
    }

    mergedMessages.set(
      message.clientMessageId,
      existingMessage
        ? {
            ...existingMessage,
            ...message,
            metadata: {
              ...existingMessage.metadata,
              ...message.metadata
            }
          }
        : message
    );
  };

  currentMessages.forEach(upsertMessage);
  incomingMessages.forEach(upsertMessage);

  return orderedClientMessageIds
    .map((clientMessageId) => mergedMessages.get(clientMessageId))
    .filter((message): message is LocalMessageRecord => Boolean(message));
}

function mergeConversationDetails(
  currentConversation: WorkspaceConversationDetail | null,
  incomingConversation: WorkspaceConversationDetail
) {
  if (!currentConversation) {
    return incomingConversation;
  }

  if (currentConversation.id !== incomingConversation.id) {
    return incomingConversation;
  }

  return {
    ...currentConversation,
    ...incomingConversation,
    messages: mergeMessageRecords(currentConversation.messages, incomingConversation.messages)
  };
}

function markAssistantMessageForAnimation(
  conversation: WorkspaceConversationDetail,
  clientMessageId: string
): WorkspaceConversationDetail {
  return {
    ...conversation,
    messages: updateMessageByClientId(conversation.messages, clientMessageId, (message) => ({
      ...message,
      id: message.id,
      metadata: {
        ...message.metadata,
        clientAnimate: true,
        pending: false,
        streaming: false
      }
    }))
  };
}

function appendStreamingAssistantDelta(
  conversation: WorkspaceConversationDetail,
  clientMessageId: string,
  delta: string
): WorkspaceConversationDetail {
  return {
    ...conversation,
    status: "running",
    messages: updateMessageByClientId(conversation.messages, clientMessageId, (message) => ({
      ...message,
      content: `${message.content}${delta}`,
      metadata: {
        ...message.metadata,
        pending: false,
        streaming: true,
        optimistic: false,
        clientAnimate: false
      }
    }))
  };
}

function clearStreamingMessageState(
  conversation: WorkspaceConversationDetail,
  clientMessageId: string
): WorkspaceConversationDetail {
  return {
    ...conversation,
    messages: updateMessageByClientId(conversation.messages, clientMessageId, (message) => ({
      ...message,
      metadata: {
        ...message.metadata,
        pending: false,
        streaming: false,
        optimistic: false
      }
    }))
  };
}

function syncStreamingConversationStart(
  conversation: WorkspaceConversationDetail,
  payload: Extract<AgentEvent, { type: "chat.started" }>["payload"]
): WorkspaceConversationDetail {
  return {
    ...conversation,
    id: payload.sessionId,
    status: "running",
    modelProfileId: payload.modelProfileId ?? conversation.modelProfileId,
    modelProfileName: payload.modelProfileName ?? conversation.modelProfileName,
    messages: updateMessageByClientId(
      conversation.messages,
      payload.assistantMessageClientId,
      (message) => ({
        ...message,
        conversationId: payload.sessionId,
        metadata: {
          ...message.metadata,
          pending: true,
          streaming: true,
          optimistic: false
        }
      })
    )
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
  const chatStreamRef = useRef<ChatStreamState>({
    sessionId: null,
    runId: null,
    assistantMessageClientId: null,
    bufferedDelta: "",
    hasReceivedDelta: false,
    frameId: null,
    lastSeq: -1
  });

  const clearChatStreamState = useEffectEvent(() => {
    if (chatStreamRef.current.frameId !== null) {
      window.cancelAnimationFrame(chatStreamRef.current.frameId);
    }

    chatStreamRef.current = {
      sessionId: null,
      runId: null,
      assistantMessageClientId: null,
      bufferedDelta: "",
      hasReceivedDelta: false,
      frameId: null,
      lastSeq: -1
    };
  });

  const loadConversationHistoryEvent = useEffectEvent(async () => {
    const response = await listScreeningQueries();
    startTransition(() => {
      setConversationHistory(response.items);
    });

    return response.items;
  });

  const flushChatStreamDelta = useEffectEvent(() => {
    const { assistantMessageClientId, bufferedDelta, sessionId } = chatStreamRef.current;
    chatStreamRef.current.frameId = null;

    if (!sessionId || !assistantMessageClientId || !bufferedDelta) {
      chatStreamRef.current.bufferedDelta = "";
      return;
    }

    chatStreamRef.current.bufferedDelta = "";
    startTransition(() => {
      setSelectedConversation((currentConversation) => {
        if (!currentConversation || currentConversation.mode !== "chat") {
          return currentConversation;
        }

        if (currentConversation.id !== sessionId) {
          return currentConversation;
        }

        return appendStreamingAssistantDelta(
          currentConversation,
          assistantMessageClientId,
          bufferedDelta
        );
      });
    });
  });

  const queueChatStreamDelta = useEffectEvent(
    (event: Extract<AgentEvent, { type: "chat.delta" }>) => {
      if (
        chatStreamRef.current.sessionId !== event.payload.sessionId ||
        chatStreamRef.current.runId !== event.payload.runId ||
        chatStreamRef.current.assistantMessageClientId !==
          event.payload.assistantMessageClientId
      ) {
        return;
      }

      if (event.payload.seq <= chatStreamRef.current.lastSeq) {
        return;
      }

      chatStreamRef.current.lastSeq = event.payload.seq;
      chatStreamRef.current.bufferedDelta += event.payload.delta;
      chatStreamRef.current.hasReceivedDelta = true;

      if (chatStreamRef.current.frameId !== null) {
        return;
      }

      chatStreamRef.current.frameId = window.requestAnimationFrame(() => {
        flushChatStreamDelta();
      });
    }
  );

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
          setSelectedConversation((currentConversation) =>
            mergeConversationDetails(currentConversation, conversationDetail)
          );
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
    const unsubscribe = subscribeToAgentEvents((event) => {
      if (event.type === "chat.started") {
        chatStreamRef.current.sessionId = event.payload.sessionId;
        chatStreamRef.current.runId = event.payload.runId;
        chatStreamRef.current.assistantMessageClientId =
          event.payload.assistantMessageClientId;
        chatStreamRef.current.bufferedDelta = "";
        chatStreamRef.current.hasReceivedDelta = false;
        chatStreamRef.current.lastSeq = -1;

        startTransition(() => {
          setSelectedConversation((currentConversation) => {
            if (!currentConversation || currentConversation.mode !== "chat") {
              return currentConversation;
            }

            if (currentConversation.id !== event.payload.sessionId) {
              return currentConversation;
            }

            return syncStreamingConversationStart(currentConversation, event.payload);
          });
          setSelectedConversationId(event.payload.sessionId);
        });
        return;
      }

      if (event.type === "chat.delta" && event.payload.delta) {
        queueChatStreamDelta(event);
      }
    });

    return () => {
      unsubscribe();
      clearChatStreamState();
    };
  }, [clearChatStreamState, queueChatStreamDelta]);

  useEffect(() => {
    if (!selectedConversationId) {
      return;
    }

    if (chatStreamRef.current.sessionId === selectedConversationId) {
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
        const previousConversation = selectedConversation;
        const previousResultsPage = resultsPage;
        const previousConversationId = selectedConversationId;
        const sessionId =
          selectedConversation?.mode === "chat"
            ? selectedConversation.id
            : createPrefixedId(CHAT_SESSION_PREFIX);
        const turnId = createPrefixedId(CHAT_TURN_PREFIX);
        const runId = createPrefixedId(CHAT_RUN_PREFIX);
        const userMessageClientId = createPrefixedId(CHAT_USER_MESSAGE_PREFIX);
        const assistantMessageClientId = createPrefixedId(CHAT_ASSISTANT_MESSAGE_PREFIX);
        const optimisticConversation = createOptimisticChatConversation({
          currentConversation: selectedConversation?.mode === "chat" ? selectedConversation : null,
          sessionId,
          queryText: input.queryText,
          turnId,
          runId,
          userMessageClientId,
          assistantMessageClientId,
          modelProfileId: input.modelProfileId
        });

        clearChatStreamState();
        chatStreamRef.current = {
          sessionId,
          runId,
          assistantMessageClientId,
          bufferedDelta: "",
          hasReceivedDelta: false,
          frameId: null,
          lastSeq: -1
        };

        startTransition(() => {
          setSelectedConversation(optimisticConversation);
          setSelectedConversationId(sessionId);
          setResultsPage(null);
        });

        try {
          const nextConversation = await sendChatMessage({
            sessionId,
            turnId,
            runId,
            userMessageClientId,
            assistantMessageClientId,
            messageText: input.queryText,
            modelProfileId: input.modelProfileId
          });

          const shouldAnimate = !chatStreamRef.current.hasReceivedDelta;
          clearChatStreamState();

          startTransition(() => {
            setSelectedConversation((currentConversation) => {
              const mergedConversation = mergeConversationDetails(
                currentConversation,
                nextConversation
              );

              if (!mergedConversation || mergedConversation.mode !== "chat") {
                return mergedConversation;
              }

              return shouldAnimate
                ? markAssistantMessageForAnimation(
                    mergedConversation,
                    assistantMessageClientId
                  )
                : clearStreamingMessageState(
                    mergedConversation,
                    assistantMessageClientId
                  );
            });
            setSelectedConversationId(sessionId);
            setResultsPage(null);
          });
          void loadConversationHistoryEvent();
          return true;
        } catch (error) {
          clearChatStreamState();
          startTransition(() => {
            setSelectedConversation(previousConversation);
            setSelectedConversationId(previousConversationId);
            setResultsPage(previousResultsPage);
          });
          throw error;
        }
      }

      const createdConversation = await createScreeningQuery(input);
      await loadConversationHistoryEvent();
      setSelectedConversation(null);
      setResultsPage(null);
      setSelectedConversationId(createdConversation.id);
      return true;
    } catch (error) {
      clearChatStreamState();
      const nextErrorMessage =
        error instanceof Error ? error.message : "Failed to submit conversation.";
      setErrorMessage(nextErrorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSelectConversation(conversationId: string) {
    clearChatStreamState();
    setSelectedConversation(null);
    setResultsPage(null);
    setSelectedConversationId(conversationId);
    setErrorMessage(null);
  }

  function handleStartNewChat() {
    clearChatStreamState();
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
