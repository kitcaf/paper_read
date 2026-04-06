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

export const DEFAULT_PROVIDER_OPTION: ProviderOption = {
  provider: "mock",
  label: "Mock / Rule-based",
  defaultModelName: "rule-based-title-screening",
  requiresApiKey: false
};

export const PROVIDER_OPTIONS: ProviderOption[] = [
  DEFAULT_PROVIDER_OPTION,
  {
    provider: "openai-compatible",
    label: "OpenAI Compatible",
    defaultModelName: "gpt-4.1-mini",
    defaultBaseUrl: "https://api.openai.com/v1",
    requiresApiKey: true
  },
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

export function getInputClassName() {
  return "h-11 w-full rounded-2xl border border-ink-300/45 bg-white/85 px-3 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-ink-700/60";
}

export function createDraftFromProfile(profile: ModelProviderProfile | null): ModelProfileDraft {
  const option = getProviderOption(profile?.settings.provider ?? "mock");

  return {
    name: profile?.name ?? "New model",
    provider: profile?.settings.provider ?? option.provider,
    modelName: profile?.settings.modelName ?? option.defaultModelName,
    baseUrl: profile?.settings.baseUrl ?? option.defaultBaseUrl ?? "",
    apiKey: "",
    temperature: String(profile?.settings.temperature ?? 0.1),
    maxTokens: String(profile?.settings.maxTokens ?? 900),
    isDefault: Boolean(profile?.isDefault)
  };
}
