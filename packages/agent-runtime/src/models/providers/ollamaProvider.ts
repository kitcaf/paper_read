import type { ModelGenerateRequest, ModelProvider } from "../types";
import { ensureOkResponse, readJsonResponse, readNdjsonChunks, trimTrailingSlash } from "../http";

interface OllamaChatResponse {
  message?: {
    content?: string;
  };
}

function toOllamaBody(settingsModelName: string, request: ModelGenerateRequest) {
  return {
    model: request.modelName ?? settingsModelName,
    messages: request.messages,
    stream: Boolean(request.stream),
    ...(request.responseFormat === "json_object" ? { format: "json" } : {}),
    options: {
      temperature: request.temperature,
      num_predict: request.maxTokens
    }
  };
}

function readOllamaContent(payload: unknown) {
  const response = payload as OllamaChatResponse;
  const content = response.message?.content;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Ollama provider returned an empty completion.");
  }

  return content;
}

function readOllamaStreamContent(chunks: unknown[]) {
  return chunks.map(readOllamaContent).join("").trim();
}

export const ollamaProvider: ModelProvider = {
  kind: "ollama",
  async generate(settings, request) {
    if (!settings.baseUrl) {
      throw new Error("Ollama provider requires a baseUrl.");
    }

    const endpoint = `${trimTrailingSlash(settings.baseUrl)}/api/chat`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(settings.apiKey ? { authorization: `Bearer ${settings.apiKey}` } : {})
      },
      body: JSON.stringify(toOllamaBody(settings.modelName, request))
    });

    await ensureOkResponse(response, "Ollama provider");
    if (request.stream) {
      const chunks = await readNdjsonChunks(response);
      const content = readOllamaStreamContent(chunks);
      if (!content) {
        throw new Error("Ollama provider returned an empty streaming completion.");
      }

      return {
        provider: "ollama",
        modelName: request.modelName ?? settings.modelName,
        content,
        raw: chunks
      };
    }

    const payload = await readJsonResponse(response);

    return {
      provider: "ollama",
      modelName: request.modelName ?? settings.modelName,
      content: readOllamaContent(payload),
      raw: payload
    };
  }
};
