import type { ModelGenerateRequest, ModelMessage, ModelProvider } from "../types";
import { ensureOkResponse, readJsonResponse, readSseJsonChunks, trimTrailingSlash } from "../http";

const ANTHROPIC_VERSION = "2023-06-01";

interface AnthropicMessageResponse {
  content?: Array<{
    type?: string;
    text?: string;
  }>;
}

interface AnthropicStreamChunk {
  type?: string;
  delta?: {
    type?: string;
    text?: string;
  };
}

function splitAnthropicMessages(messages: ModelMessage[]) {
  const system = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n");
  const conversationMessages = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content
    }));

  return {
    system: system || undefined,
    messages: conversationMessages.length
      ? conversationMessages
      : [{ role: "user" as const, content: "Continue." }]
  };
}

function toAnthropicBody(settingsModelName: string, request: ModelGenerateRequest) {
  const { system, messages } = splitAnthropicMessages(request.messages);

  return {
    model: request.modelName ?? settingsModelName,
    max_tokens: request.maxTokens,
    temperature: request.temperature,
    stream: Boolean(request.stream),
    ...(system ? { system } : {}),
    messages
  };
}

function readAnthropicContent(payload: unknown) {
  const response = payload as AnthropicMessageResponse;
  const content = response.content
    ?.filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("")
    .trim();

  if (!content) {
    throw new Error("Anthropic provider returned an empty completion.");
  }

  return content;
}

function readAnthropicStreamContent(chunks: unknown[]) {
  return chunks
    .map((chunk) => {
      const streamChunk = chunk as AnthropicStreamChunk;
      if (
        streamChunk.type === "content_block_delta" &&
        streamChunk.delta?.type === "text_delta"
      ) {
        return streamChunk.delta.text ?? "";
      }

      return "";
    })
    .join("")
    .trim();
}

function readAnthropicStreamDelta(chunk: unknown) {
  const streamChunk = chunk as AnthropicStreamChunk;
  if (
    streamChunk.type === "content_block_delta" &&
    streamChunk.delta?.type === "text_delta"
  ) {
    return streamChunk.delta.text ?? "";
  }

  return "";
}

export const anthropicProvider: ModelProvider = {
  kind: "anthropic",
  async generate(settings, request) {
    if (!settings.baseUrl) {
      throw new Error("Anthropic provider requires a baseUrl.");
    }

    if (!settings.apiKey) {
      throw new Error("Anthropic provider requires an API key.");
    }

    const response = await fetch(`${trimTrailingSlash(settings.baseUrl)}/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": settings.apiKey,
        "anthropic-version": ANTHROPIC_VERSION
      },
      body: JSON.stringify(toAnthropicBody(settings.modelName, request))
    });

    await ensureOkResponse(response, "Anthropic provider");

    if (request.stream) {
      const chunks = await readSseJsonChunks(response, (chunk) => {
        const textChunk = readAnthropicStreamDelta(chunk);
        if (textChunk) {
          request.onTextChunk?.(textChunk);
        }
      });
      const content = readAnthropicStreamContent(chunks);
      if (!content) {
        throw new Error("Anthropic provider returned an empty streaming completion.");
      }

      return {
        provider: "anthropic",
        modelName: request.modelName ?? settings.modelName,
        content,
        raw: chunks
      };
    }

    const payload = await readJsonResponse(response);

    return {
      provider: "anthropic",
      modelName: request.modelName ?? settings.modelName,
      content: readAnthropicContent(payload),
      raw: payload
    };
  }
};
