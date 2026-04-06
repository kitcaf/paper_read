import type {
  AgentEvent,
  PaginatedResponse,
  ScreeningQueryDetail,
  ScreeningQueryOptions,
  ScreeningQuerySummary,
  SourceSummary
} from "@paper-read/shared";

import { agentClient } from "./agentClient";
import {
  mapConversationDetail,
  mapConversationsPage,
  mapLocalResultsPage
} from "./screeningMappers";

interface QueryFilterInput {
  sourceKey?: string;
  status?: string;
}

interface CreateScreeningQueryInput {
  sourceKey: string;
  queryText: string;
  options: ScreeningQueryOptions;
}

function assertEventType<TType extends AgentEvent["type"]>(
  event: AgentEvent,
  type: TType
): Extract<AgentEvent, { type: TType }> {
  if (event.type !== type) {
    throw new Error(`Unexpected agent event: ${event.type}`);
  }

  return event as Extract<AgentEvent, { type: TType }>;
}

export async function listSources() {
  await agentClient.ensureReady();
  const event = assertEventType(
    await agentClient.request({ type: "sources.list" }, "sources.loaded"),
    "sources.loaded"
  );

  return event.payload.sources satisfies SourceSummary[];
}

export async function listScreeningQueries(
  filter?: QueryFilterInput
): Promise<PaginatedResponse<ScreeningQuerySummary>> {
  await agentClient.ensureReady();
  const event = assertEventType(
    await agentClient.request({ type: "conversation.list" }, "conversation.listed"),
    "conversation.listed"
  );
  const response = mapConversationsPage(event.payload.conversations);
  const items = response.items.filter((item) => {
    const matchesSource = filter?.sourceKey ? item.sourceKey === filter.sourceKey : true;
    const matchesStatus = filter?.status ? item.status === filter.status : true;
    return matchesSource && matchesStatus;
  });

  return {
    ...response,
    items,
    total: items.length
  };
}

export async function getScreeningQuery(queryId: string) {
  await agentClient.ensureReady();
  const event = assertEventType(
    await agentClient.request(
      { type: "conversation.get", payload: { conversationId: queryId } },
      "conversation.loaded"
    ),
    "conversation.loaded"
  );

  return mapConversationDetail(event.payload.conversation, event.payload.messages);
}

export async function getScreeningResults(queryId: string) {
  await agentClient.ensureReady();
  const event = assertEventType(
    await agentClient.request(
      { type: "screening.results.get", payload: { conversationId: queryId } },
      "screening.results.loaded"
    ),
    "screening.results.loaded"
  );

  return mapLocalResultsPage(event.payload.results);
}

export async function createScreeningQuery(input: CreateScreeningQueryInput) {
  await agentClient.ensureReady();
  const startEvent = assertEventType(
    await agentClient.request(
      {
        type: "screening.start",
        payload: {
          sourceKey: input.sourceKey,
          queryText: input.queryText,
          options: input.options
        }
      },
      "screening.started"
    ),
    "screening.started"
  );

  return getScreeningQuery(startEvent.payload.conversationId);
}
