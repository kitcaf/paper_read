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
}

function toChatCompletionBody(modelName: string, request: ModelGenerateRequest) {
  return {
    model: request.modelName ?? modelName,
    messages: request.messages satisfies ModelMessage[],
    temperature: request.temperature,
    max_tokens: request.maxTokens,
    stream: Boolean(request.stream),
    ...(request.responseFormat === "json_object"
      ? { response_format: { type: "json_object" } }
      : {})
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

export async function requestChatCompletion({
  providerName,
  baseUrl,
  apiKey,
  modelName,
  request
}: ChatCompletionProviderOptions) {
  const endpoint = `${trimTrailingSlash(baseUrl)}/chat/completions`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {})
    },
    body: JSON.stringify(toChatCompletionBody(modelName, request))
  });

  await ensureOkResponse(response, providerName);

  if (request.stream) {
    const chunks = await readSseJsonChunks(response);
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
