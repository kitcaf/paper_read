import type { ModelGenerateRequest, ModelMessage, ModelProvider } from "../types";
import { ensureOkResponse, readJsonResponse, readSseJsonChunks, trimTrailingSlash } from "../http";

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

function mapGeminiRole(role: ModelMessage["role"]) {
  return role === "assistant" ? "model" : "user";
}

function splitGeminiMessages(messages: ModelMessage[]) {
  const system = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n");
  const contents = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: mapGeminiRole(message.role),
      parts: [{ text: message.content }]
    }));

  return {
    systemInstruction: system ? { parts: [{ text: system }] } : undefined,
    contents: contents.length ? contents : [{ role: "user", parts: [{ text: "Continue." }] }]
  };
}

function toGeminiBody(request: ModelGenerateRequest) {
  const { systemInstruction, contents } = splitGeminiMessages(request.messages);

  return {
    ...(systemInstruction ? { system_instruction: systemInstruction } : {}),
    contents,
    generationConfig: {
      temperature: request.temperature,
      maxOutputTokens: request.maxTokens,
      ...(request.responseFormat === "json_object"
        ? { responseMimeType: "application/json" }
        : {})
    }
  };
}

function readGeminiContent(payload: unknown) {
  const response = payload as GeminiGenerateContentResponse;
  const content = response.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!content) {
    throw new Error("Gemini provider returned an empty completion.");
  }

  return content;
}

function createGeminiEndpoint(baseUrl: string, modelName: string, isStreaming: boolean) {
  const action = isStreaming ? "streamGenerateContent?alt=sse" : "generateContent";
  return `${trimTrailingSlash(baseUrl)}/models/${encodeURIComponent(modelName)}:${action}`;
}

export const geminiProvider: ModelProvider = {
  kind: "gemini",
  async generate(settings, request) {
    if (!settings.baseUrl) {
      throw new Error("Gemini provider requires a baseUrl.");
    }

    if (!settings.apiKey) {
      throw new Error("Gemini provider requires an API key.");
    }

    const modelName = request.modelName ?? settings.modelName;
    const response = await fetch(
      createGeminiEndpoint(settings.baseUrl, modelName, Boolean(request.stream)),
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": settings.apiKey
        },
        body: JSON.stringify(toGeminiBody(request))
      }
    );

    await ensureOkResponse(response, "Gemini provider");

    if (request.stream) {
      const chunks = await readSseJsonChunks(response);
      const content = chunks.map(readGeminiContent).join("").trim();
      if (!content) {
        throw new Error("Gemini provider returned an empty streaming completion.");
      }

      return {
        provider: "gemini",
        modelName,
        content,
        raw: chunks
      };
    }

    const payload = await readJsonResponse(response);

    return {
      provider: "gemini",
      modelName,
      content: readGeminiContent(payload),
      raw: payload
    };
  }
};
