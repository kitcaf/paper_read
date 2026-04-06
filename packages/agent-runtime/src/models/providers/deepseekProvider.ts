import type { ModelProvider } from "../types";
import { requestChatCompletion } from "./chatCompletions";

export const deepSeekProvider: ModelProvider = {
  kind: "deepseek",
  async generate(settings, request) {
    if (!settings.baseUrl) {
      throw new Error("DeepSeek provider requires a baseUrl.");
    }

    const completion = await requestChatCompletion({
      providerName: "DeepSeek provider",
      baseUrl: settings.baseUrl,
      apiKey: settings.apiKey,
      modelName: settings.modelName,
      request
    });

    return {
      provider: "deepseek",
      modelName: request.modelName ?? settings.modelName,
      content: completion.content,
      raw: completion.raw
    };
  }
};
