import type { ModelGenerateRequest, ModelProvider } from "../types";
import { ensureOkResponse, readJsonResponse, trimTrailingSlash } from "../http";

interface OpenAICompatibleChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

function toOpenAICompatibleBody(settingsModelName: string, request: ModelGenerateRequest) {
  return {
    model: request.modelName ?? settingsModelName,
    messages: request.messages,
    temperature: request.temperature,
    max_tokens: request.maxTokens,
    ...(request.responseFormat === "json_object"
      ? { response_format: { type: "json_object" } }
      : {})
  };
}

function readCompletionContent(payload: unknown) {
  const response = payload as OpenAICompatibleChatCompletionResponse;
  const content = response.choices?.[0]?.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("OpenAI-compatible provider returned an empty completion.");
  }

  return content;
}

export const openAICompatibleProvider: ModelProvider = {
  kind: "openai-compatible",
  async generate(settings, request) {
    if (!settings.baseUrl) {
      throw new Error("OpenAI-compatible provider requires a baseUrl.");
    }

    const endpoint = `${trimTrailingSlash(settings.baseUrl)}/chat/completions`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(settings.apiKey ? { authorization: `Bearer ${settings.apiKey}` } : {})
      },
      body: JSON.stringify(toOpenAICompatibleBody(settings.modelName, request))
    });

    await ensureOkResponse(response, "OpenAI-compatible provider");
    const payload = await readJsonResponse(response);

    return {
      provider: "openai-compatible",
      modelName: request.modelName ?? settings.modelName,
      content: readCompletionContent(payload),
      raw: payload
    };
  }
};
