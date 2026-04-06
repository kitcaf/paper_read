import type { ModelProvider } from "../types";

export const mockModelProvider: ModelProvider = {
  kind: "mock",
  async generate(settings, request) {
    const lastUserMessage = [...request.messages]
      .reverse()
      .find((message) => message.role === "user");

    return {
      provider: "mock",
      modelName: settings.modelName,
      content: lastUserMessage?.content ?? ""
    };
  }
};
