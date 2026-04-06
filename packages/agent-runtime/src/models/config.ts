import type {
  ModelProviderKind,
  ModelProviderSettings,
  PublicModelProviderSettings
} from "@paper-read/shared";

import type { RequiredModelProviderSettings } from "./types";

const DEFAULT_TEMPERATURE = 0.1;
const DEFAULT_MAX_TOKENS = 900;
const DEFAULT_OPENAI_COMPATIBLE_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_ANTHROPIC_BASE_URL = "https://api.anthropic.com/v1";
const DEFAULT_GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEFAULT_KIMI_BASE_URL = "https://api.moonshot.cn/v1";
const DEFAULT_OPENAI_COMPATIBLE_MODEL_NAME = "gpt-4.1-mini";
const DEFAULT_OLLAMA_MODEL_NAME = "llama3.1";
const DEFAULT_ANTHROPIC_MODEL_NAME = "claude-sonnet-4-5";
const DEFAULT_GEMINI_MODEL_NAME = "gemini-2.5-flash";
const DEFAULT_DEEPSEEK_MODEL_NAME = "deepseek-chat";
const DEFAULT_KIMI_MODEL_NAME = "kimi-k2.5";

export const DEFAULT_MODEL_PROVIDER_SETTINGS: RequiredModelProviderSettings = {
  provider: "openai-compatible",
  modelName: DEFAULT_OPENAI_COMPATIBLE_MODEL_NAME,
  baseUrl: DEFAULT_OPENAI_COMPATIBLE_BASE_URL,
  temperature: DEFAULT_TEMPERATURE,
  maxTokens: DEFAULT_MAX_TOKENS,
  responseFormat: "json_object",
  stream: true
};

function isModelProviderKind(value: unknown): value is ModelProviderKind {
  return (
    value === "openai-compatible" ||
    value === "ollama" ||
    value === "anthropic" ||
    value === "gemini" ||
    value === "deepseek" ||
    value === "kimi"
  );
}

function readOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readOptionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function defaultModelName(provider: ModelProviderKind) {
  if (provider === "openai-compatible") {
    return DEFAULT_OPENAI_COMPATIBLE_MODEL_NAME;
  }

  if (provider === "ollama") {
    return DEFAULT_OLLAMA_MODEL_NAME;
  }

  if (provider === "anthropic") {
    return DEFAULT_ANTHROPIC_MODEL_NAME;
  }

  if (provider === "gemini") {
    return DEFAULT_GEMINI_MODEL_NAME;
  }

  if (provider === "deepseek") {
    return DEFAULT_DEEPSEEK_MODEL_NAME;
  }

  if (provider === "kimi") {
    return DEFAULT_KIMI_MODEL_NAME;
  }

  return DEFAULT_OPENAI_COMPATIBLE_MODEL_NAME;
}

function defaultBaseUrl(provider: ModelProviderKind) {
  if (provider === "openai-compatible") {
    return DEFAULT_OPENAI_COMPATIBLE_BASE_URL;
  }

  if (provider === "ollama") {
    return DEFAULT_OLLAMA_BASE_URL;
  }

  if (provider === "anthropic") {
    return DEFAULT_ANTHROPIC_BASE_URL;
  }

  if (provider === "gemini") {
    return DEFAULT_GEMINI_BASE_URL;
  }

  if (provider === "deepseek") {
    return DEFAULT_DEEPSEEK_BASE_URL;
  }

  if (provider === "kimi") {
    return DEFAULT_KIMI_BASE_URL;
  }

  return undefined;
}

export function normalizeModelProviderSettings(
  settings: Partial<ModelProviderSettings> | null | undefined
): RequiredModelProviderSettings {
  const provider = isModelProviderKind(settings?.provider)
    ? settings.provider
    : DEFAULT_MODEL_PROVIDER_SETTINGS.provider;
  const modelName =
    readOptionalString(settings?.modelName) ?? defaultModelName(provider);
  const baseUrl = readOptionalString(settings?.baseUrl) ?? defaultBaseUrl(provider);
  const apiKey = readOptionalString(settings?.apiKey);

  return {
    provider,
    modelName,
    ...(baseUrl ? { baseUrl } : {}),
    ...(apiKey ? { apiKey } : {}),
    temperature: readOptionalNumber(settings?.temperature) ?? DEFAULT_TEMPERATURE,
    maxTokens: readOptionalNumber(settings?.maxTokens) ?? DEFAULT_MAX_TOKENS,
    responseFormat:
      settings?.responseFormat === "text" || settings?.responseFormat === "json_object"
        ? settings.responseFormat
        : DEFAULT_MODEL_PROVIDER_SETTINGS.responseFormat,
    stream: true
  };
}

export function withRuntimeSecrets(
  settings: RequiredModelProviderSettings
): RequiredModelProviderSettings {
  if (settings.apiKey) {
    return settings;
  }

  if (settings.provider === "openai-compatible") {
    const apiKey = readOptionalString(
      process.env.PAPER_READ_MODEL_API_KEY ?? process.env.OPENAI_API_KEY
    );
    return apiKey ? { ...settings, apiKey } : settings;
  }

  if (settings.provider === "ollama") {
    const apiKey = readOptionalString(process.env.PAPER_READ_OLLAMA_API_KEY);
    return apiKey ? { ...settings, apiKey } : settings;
  }

  if (settings.provider === "anthropic") {
    const apiKey = readOptionalString(
      process.env.PAPER_READ_ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY
    );
    return apiKey ? { ...settings, apiKey } : settings;
  }

  if (settings.provider === "gemini") {
    const apiKey = readOptionalString(
      process.env.PAPER_READ_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY
    );
    return apiKey ? { ...settings, apiKey } : settings;
  }

  if (settings.provider === "deepseek") {
    const apiKey = readOptionalString(
      process.env.PAPER_READ_DEEPSEEK_API_KEY ?? process.env.DEEPSEEK_API_KEY
    );
    return apiKey ? { ...settings, apiKey } : settings;
  }

  if (settings.provider === "kimi") {
    const apiKey = readOptionalString(
      process.env.PAPER_READ_KIMI_API_KEY ??
        process.env.KIMI_API_KEY ??
        process.env.MOONSHOT_API_KEY
    );
    return apiKey ? { ...settings, apiKey } : settings;
  }

  return settings;
}

export function toPublicModelProviderSettings(
  settings: RequiredModelProviderSettings
): PublicModelProviderSettings {
  const { apiKey: _apiKey, ...publicSettings } = settings;

  return {
    ...publicSettings,
    hasApiKey: Boolean(settings.apiKey)
  };
}
