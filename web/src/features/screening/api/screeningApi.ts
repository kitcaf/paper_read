import type {
  PaginatedResponse,
  ScreeningQueryDetail,
  ScreeningQueryOptions,
  ScreeningQuerySummary,
  ScreeningResultsPage,
  SourceSummary
} from "@paper-read/shared";

import { buildApiUrl } from "../../../services/http";

interface RequestInitWithJson extends RequestInit {
  json?: unknown;
}

interface QueryFilterInput {
  sourceKey?: string;
  status?: string;
}

interface CreateScreeningQueryInput {
  sourceKey: string;
  queryText: string;
  options: ScreeningQueryOptions;
}

function buildRequestUrl(path: string, searchParams?: Record<string, string | number | undefined>) {
  const requestUrl = new URL(buildApiUrl(`/api${path}`));
  if (!searchParams) {
    return requestUrl.toString();
  }

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined || value === "") {
      continue;
    }

    requestUrl.searchParams.set(key, String(value));
  }

  return requestUrl.toString();
}

async function requestJson<TResponse>(
  path: string,
  init?: RequestInitWithJson,
  searchParams?: Record<string, string | number | undefined>
) {
  const response = await fetch(buildRequestUrl(path, searchParams), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    },
    body: init?.json ? JSON.stringify(init.json) : init?.body
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new Error(errorPayload?.message ?? `Request failed with status ${response.status}`);
  }

  return (await response.json()) as TResponse;
}

export async function listSources() {
  const response = await requestJson<{ items: SourceSummary[] }>("/sources");
  return response.items;
}

export async function listScreeningQueries(filter?: QueryFilterInput) {
  return requestJson<PaginatedResponse<ScreeningQuerySummary>>("/screening/queries", undefined, {
    sourceKey: filter?.sourceKey,
    status: filter?.status
  });
}

export async function getScreeningQuery(queryId: string) {
  return requestJson<ScreeningQueryDetail>(`/screening/queries/${queryId}`);
}

export async function getScreeningResults(queryId: string) {
  return requestJson<ScreeningResultsPage>(`/screening/queries/${queryId}/results`, undefined, {
    sortBy: "score",
    sortOrder: "desc"
  });
}

export async function createScreeningQuery(input: CreateScreeningQueryInput) {
  return requestJson<ScreeningQueryDetail>("/screening/queries", {
    method: "POST",
    json: {
      sourceKey: input.sourceKey,
      queryText: input.queryText,
      inputMode: "title",
      options: input.options
    }
  });
}
