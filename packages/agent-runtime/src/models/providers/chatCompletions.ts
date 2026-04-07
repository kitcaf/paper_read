import type { ModelGenerateRequest, ModelMessage } from "../types";
import { ensureOkResponse, readJsonResponse, readSseJsonChunks, trimTrailingSlash } from "../http";

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

interface ChatCompletionStreamChunk {
  choices?: Array<{
    delta?: {
      content?: string | null;
    };
  }>;
}

export interface ChatCompletionProviderOptions {
  providerName: string;
  baseUrl: string;
  apiKey?: string;
  modelName: string;
  request: ModelGenerateRequest;
  extraBody?: Record<string, unknown>;
  includeTemperature?: boolean;
}

function toChatCompletionBody(
  modelName: string,
  request: ModelGenerateRequest,
  options?: Pick<ChatCompletionProviderOptions, "extraBody" | "includeTemperature">
) {
  return {
    model: request.modelName ?? modelName,
    messages: request.messages satisfies ModelMessage[],
    max_tokens: request.maxTokens,
    stream: Boolean(request.stream),
    ...(options?.includeTemperature === false ? {} : { temperature: request.temperature }),
    ...(request.responseFormat === "json_object"
      ? { response_format: { type: "json_object" } }
      : {}),
    ...(options?.extraBody ?? {})
  };
}

function readCompletionContent(payload: unknown, providerName: string) {
  const response = payload as ChatCompletionResponse;
  const content = response.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error(`${providerName} returned an empty completion.`);
  }

  return content;
}

function readCompletionStreamContent(chunks: unknown[]) {
  return chunks
    .map((chunk) => {
      const streamChunk = chunk as ChatCompletionStreamChunk;
      return streamChunk.choices?.[0]?.delta?.content ?? "";
    })
    .join("")
    .trim();
}

function readCompletionStreamDelta(chunk: unknown) {
  const streamChunk = chunk as ChatCompletionStreamChunk;
  return streamChunk.choices?.[0]?.delta?.content ?? "";
}

export async function requestChatCompletion({
  providerName,
  baseUrl,
  apiKey,
  modelName,
  request,
  extraBody,
  includeTemperature
}: ChatCompletionProviderOptions) {
  const endpoint = `${trimTrailingSlash(baseUrl)}/chat/completions`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {})
    },
    body: JSON.stringify(
      toChatCompletionBody(modelName, request, { extraBody, includeTemperature })
    )
  });

  await ensureOkResponse(response, providerName);

  if (request.stream) {
    const chunks = await readSseJsonChunks(response, (chunk) => {
      const textChunk = readCompletionStreamDelta(chunk);
      if (textChunk) {
        request.onTextChunk?.(textChunk);
      }
    });
    const content = readCompletionStreamContent(chunks);
    if (!content) {
      throw new Error(`${providerName} returned an empty streaming completion.`);
    }

    return {
      content,
      raw: chunks
    };
  }

  const payload = await readJsonResponse(response);

  return {
    content: readCompletionContent(payload, providerName),
    raw: payload
  };
}
