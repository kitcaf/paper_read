import type { ModelProviderKind } from "@paper-read/shared";

import { normalizeModelProviderSettings, withRuntimeSecrets } from "./config";
import { mockModelProvider } from "./providers/mockProvider";
import { ollamaProvider } from "./providers/ollamaProvider";
import { openAICompatibleProvider } from "./providers/openaiCompatibleProvider";
import type { ModelProvider, ModelRuntime, RequiredModelProviderSettings } from "./types";

const MODEL_PROVIDERS: Record<ModelProviderKind, ModelProvider> = {
  mock: mockModelProvider,
  "openai-compatible": openAICompatibleProvider,
  ollama: ollamaProvider
};

export function createModelRuntime(settings: Partial<RequiredModelProviderSettings>): ModelRuntime {
  const normalizedSettings = withRuntimeSecrets(normalizeModelProviderSettings(settings));

  return {
    settings: normalizedSettings,
    provider: MODEL_PROVIDERS[normalizedSettings.provider]
  };
}
