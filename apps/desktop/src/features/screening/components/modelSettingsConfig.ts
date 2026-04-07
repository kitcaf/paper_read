import type { ModelProviderKind, ModelProviderProfile } from "@paper-read/shared";

export interface ProviderOption {
  provider: ModelProviderKind;
  label: string;
  defaultModelName: string;
  defaultBaseUrl?: string;
  requiresApiKey: boolean;
}

export interface ModelProfileDraft {
  name: string;
  provider: ModelProviderKind;
  modelName: string;
  baseUrl: string;
  apiKey: string;
  temperature: string;
  maxTokens: string;
  isDefault: boolean;
}

export const DEFAULT_TEMPERATURE = "0.1";
export const DEFAULT_MAX_TOKENS = "900";

export const DEFAULT_PROVIDER_OPTION: ProviderOption = {
  provider: "openai-compatible",
  label: "OpenAI Compatible",
  defaultModelName: "gpt-4.1-mini",
  defaultBaseUrl: "https://api.openai.com/v1",
  requiresApiKey: true
};

export const PROVIDER_OPTIONS: ProviderOption[] = [
  DEFAULT_PROVIDER_OPTION,
  {
    provider: "anthropic",
    label: "Anthropic Claude",
    defaultModelName: "claude-sonnet-4-5",
    defaultBaseUrl: "https://api.anthropic.com/v1",
    requiresApiKey: true
  },
  {
    provider: "gemini",
    label: "Google Gemini",
    defaultModelName: "gemini-2.5-flash",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
    requiresApiKey: true
  },
  {
    provider: "deepseek",
    label: "DeepSeek",
    defaultModelName: "deepseek-chat",
    defaultBaseUrl: "https://api.deepseek.com",
    requiresApiKey: true
  },
  {
    provider: "kimi",
    label: "Kimi / Moonshot",
    defaultModelName: "kimi-k2.5",
    defaultBaseUrl: "https://api.moonshot.cn/v1",
    requiresApiKey: true
  },
  {
    provider: "ollama",
    label: "Ollama / Local",
    defaultModelName: "llama3.1",
    defaultBaseUrl: "http://127.0.0.1:11434",
    requiresApiKey: false
  }
];

export function getProviderOption(provider: ModelProviderKind) {
  return (
    PROVIDER_OPTIONS.find((option) => option.provider === provider) ?? DEFAULT_PROVIDER_OPTION
  );
}

export function readDraftNumber(value: string, fallback: string) {
  if (!value.trim()) {
    return Number(fallback);
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : Number(fallback);
}

export function createDraftFromProfile(profile: ModelProviderProfile | null): ModelProfileDraft {
  const option = getProviderOption(profile?.settings.provider ?? DEFAULT_PROVIDER_OPTION.provider);

  return {
    name: profile?.name ?? "New model",
    provider: profile?.settings.provider ?? option.provider,
    modelName: profile?.settings.modelName ?? option.defaultModelName,
    baseUrl: profile?.settings.baseUrl ?? option.defaultBaseUrl ?? "",
    apiKey: "",
    temperature: String(profile?.settings.temperature ?? DEFAULT_TEMPERATURE),
    maxTokens: String(profile?.settings.maxTokens ?? DEFAULT_MAX_TOKENS),
    isDefault: Boolean(profile?.isDefault)
  };
}
