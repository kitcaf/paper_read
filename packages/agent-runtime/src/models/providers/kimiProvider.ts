import type { ModelProvider } from "../types";
import { requestChatCompletion } from "./chatCompletions";

function getKimiExtraBody(modelName: string) {
  if (modelName.startsWith("kimi-k2.5")) {
    return {
      thinking: {
        type: "disabled"
      }
    };
  }

  return undefined;
}

export const kimiProvider: ModelProvider = {
  kind: "kimi",
  async generate(settings, request) {
    if (!settings.baseUrl) {
      throw new Error("Kimi provider requires a baseUrl.");
    }

    if (!settings.apiKey) {
      throw new Error("Kimi provider requires an API key.");
    }

    const modelName = request.modelName ?? settings.modelName;
    const completion = await requestChatCompletion({
      providerName: "Kimi provider",
      baseUrl: settings.baseUrl,
      apiKey: settings.apiKey,
      modelName: settings.modelName,
      request,
      extraBody: getKimiExtraBody(modelName),
      includeTemperature: !modelName.startsWith("kimi-k2.5")
    });

    return {
      provider: "kimi",
      modelName,
      content: completion.content,
      raw: completion.raw
    };
  }
};
