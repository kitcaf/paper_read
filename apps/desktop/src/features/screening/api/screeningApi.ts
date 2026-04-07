import type {
  AgentEvent,
  ModelProviderProfile,
  ModelProviderProfileInput,
  ModelProfileTestResult,
  ModelProviderSettings,
  PaginatedResponse,
  PublicModelProviderSettings,
  ScreeningQueryOptions,
  SourceSummary
} from "@paper-read/shared";
import type {
  WorkspaceConversationDetail,
  WorkspaceConversationSummary
} from "../workspaceTypes";

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
  modelProfileId?: string;
  options: ScreeningQueryOptions;
}

interface SendChatMessageInput {
  messageText: string;
  conversationId?: string;
  modelProfileId?: string;
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

export async function getModelSettings(): Promise<PublicModelProviderSettings> {
  await agentClient.ensureReady();
  const event = assertEventType(
    await agentClient.request({ type: "model.settings.get" }, "model.settings.loaded"),
    "model.settings.loaded"
  );

  return event.payload.settings;
}

export async function updateModelSettings(
  settings: ModelProviderSettings
): Promise<PublicModelProviderSettings> {
  await agentClient.ensureReady();
  const event = assertEventType(
    await agentClient.request(
      { type: "model.settings.update", payload: { settings } },
      "model.settings.updated"
    ),
    "model.settings.updated"
  );

  return event.payload.settings;
}

export async function listModelProfiles(): Promise<ModelProviderProfile[]> {
  await agentClient.ensureReady();
  const event = assertEventType(
    await agentClient.request({ type: "model.profiles.list" }, "model.profiles.loaded"),
    "model.profiles.loaded"
  );

  return event.payload.profiles;
}

export async function upsertModelProfile(
  profile: ModelProviderProfileInput
): Promise<ModelProviderProfile> {
  await agentClient.ensureReady();
  const event = assertEventType(
    await agentClient.request(
      { type: "model.profiles.upsert", payload: { profile } },
      "model.profile.upserted"
    ),
    "model.profile.upserted"
  );

  return event.payload.profile;
}

export async function deleteModelProfile(profileId: string): Promise<ModelProviderProfile[]> {
  await agentClient.ensureReady();
  const event = assertEventType(
    await agentClient.request(
      { type: "model.profiles.delete", payload: { profileId } },
      "model.profile.deleted"
    ),
    "model.profile.deleted"
  );

  return event.payload.profiles;
}

export async function setDefaultModelProfile(profileId: string): Promise<ModelProviderProfile[]> {
  await agentClient.ensureReady();
  const event = assertEventType(
    await agentClient.request(
      { type: "model.profiles.set_default", payload: { profileId } },
      "model.profile.default_set"
    ),
    "model.profile.default_set"
  );

  return event.payload.profiles;
}

export async function testModelProfile(
  profile: ModelProviderProfileInput
): Promise<ModelProfileTestResult> {
  await agentClient.ensureReady();
  const event = assertEventType(
    await agentClient.request(
      { type: "model.profile.test", payload: { profile } },
      "model.profile.tested"
    ),
    "model.profile.tested"
  );

  return event.payload;
}

export async function listScreeningQueries(
  filter?: QueryFilterInput
): Promise<PaginatedResponse<WorkspaceConversationSummary>> {
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

export async function sendChatMessage(input: SendChatMessageInput): Promise<WorkspaceConversationDetail> {
  await agentClient.ensureReady();
  const event = assertEventType(
    await agentClient.request(
      {
        type: "chat.start",
        payload: {
          conversationId: input.conversationId,
          messageText: input.messageText,
          modelProfileId: input.modelProfileId
        }
      },
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
          modelProfileId: input.modelProfileId,
          options: input.options
        }
      },
      "screening.started"
    ),
    "screening.started"
  );

  return getScreeningQuery(startEvent.payload.conversationId);
}

export function subscribeToAgentEvents(listener: (event: AgentEvent) => void) {
  return agentClient.subscribe(listener);
}
