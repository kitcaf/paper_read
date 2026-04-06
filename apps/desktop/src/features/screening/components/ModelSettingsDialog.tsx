import type {
  ModelProviderKind,
  ModelProviderSettings,
  PublicModelProviderSettings
} from "@paper-read/shared";
import { useEffect, useState } from "react";

import { ModalShell } from "../../../components/ModalShell";

interface ModelSettingsDialogProps {
  open: boolean;
  settings: PublicModelProviderSettings | null;
  isSaving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSave: (settings: ModelProviderSettings) => Promise<boolean>;
}

interface ProviderOption {
  provider: ModelProviderKind;
  label: string;
  defaultModelName: string;
  defaultBaseUrl?: string;
  requiresApiKey: boolean;
}

const DEFAULT_PROVIDER_OPTION: ProviderOption = {
  provider: "mock",
  label: "Mock / Rule-based",
  defaultModelName: "rule-based-title-screening",
  requiresApiKey: false
};

const PROVIDER_OPTIONS: ProviderOption[] = [
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
    provider: "ollama",
    label: "Ollama / Local",
    defaultModelName: "llama3.1",
    defaultBaseUrl: "http://127.0.0.1:11434",
    requiresApiKey: false
  }
];

function getProviderOption(provider: ModelProviderKind) {
  return (
    PROVIDER_OPTIONS.find((option) => option.provider === provider) ?? DEFAULT_PROVIDER_OPTION
  );
}

function getInputClassName() {
  return "h-11 w-full rounded-2xl border border-ink-300/45 bg-white/85 px-3 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-ink-700/60";
}

export function ModelSettingsDialog({
  open,
  settings,
  isSaving,
  errorMessage,
  onClose,
  onSave
}: ModelSettingsDialogProps) {
  const [provider, setProvider] = useState<ModelProviderKind>("mock");
  const [modelName, setModelName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [temperature, setTemperature] = useState("0.1");
  const [maxTokens, setMaxTokens] = useState("900");
  const [stream, setStream] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextProvider = settings?.provider ?? "mock";
    const option = getProviderOption(nextProvider);
    setProvider(nextProvider);
    setModelName(settings?.modelName ?? option.defaultModelName);
    setBaseUrl(settings?.baseUrl ?? option.defaultBaseUrl ?? "");
    setApiKey("");
    setTemperature(String(settings?.temperature ?? 0.1));
    setMaxTokens(String(settings?.maxTokens ?? 900));
    setStream(Boolean(settings?.stream));
  }, [open, settings]);

  function handleProviderChange(nextProvider: ModelProviderKind) {
    const option = getProviderOption(nextProvider);
    setProvider(nextProvider);
    setModelName(option.defaultModelName);
    setBaseUrl(option.defaultBaseUrl ?? "");
    setApiKey("");
  }

  async function handleSubmit() {
    const option = getProviderOption(provider);
    await onSave({
      provider,
      modelName: modelName.trim() || option.defaultModelName,
      ...(baseUrl.trim() ? { baseUrl: baseUrl.trim() } : {}),
      ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
      temperature: Number(temperature),
      maxTokens: Number(maxTokens),
      responseFormat: "json_object",
      stream
    });
  }

  const selectedOption = getProviderOption(provider);

  return (
    <ModalShell
      open={open}
      title="模型设置"
      description="配置本地 agent 调用的大模型协议；API Key 只保存在本地 workspace。"
      sizeClassName="max-w-2xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-ink-500">
            {settings?.hasApiKey ? "已保存 API Key。留空不会覆盖。" : "尚未保存 API Key。"}
          </p>
          <div className="flex items-center gap-3">
            <button
              className="inline-flex h-11 items-center justify-center rounded-full border border-ink-300/45 px-5 text-sm font-medium text-ink-700 transition hover:border-ink-300/65 hover:bg-white"
              type="button"
              onClick={onClose}
            >
              取消
            </button>
            <button
              className="inline-flex h-11 items-center justify-center rounded-full bg-ink-900 px-5 text-sm font-semibold text-paper-50 transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:bg-ink-500"
              type="button"
              disabled={isSaving}
              onClick={() => void handleSubmit()}
            >
              {isSaving ? "保存中..." : "保存设置"}
            </button>
          </div>
        </div>
      }
      onClose={onClose}
    >
      <div className="grid gap-4">
        {errorMessage ? (
          <div className="rounded-2xl border border-coral-500/20 bg-coral-500/8 px-4 py-3 text-sm text-coral-500">
            {errorMessage}
          </div>
        ) : null}

        <label className="grid gap-2 text-sm font-medium text-ink-700">
          Provider
          <select
            className={getInputClassName()}
            value={provider}
            onChange={(event) => handleProviderChange(event.target.value as ModelProviderKind)}
          >
            {PROVIDER_OPTIONS.map((option) => (
              <option key={option.provider} value={option.provider}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-ink-700">
            Model
            <input
              className={getInputClassName()}
              value={modelName}
              placeholder={selectedOption.defaultModelName}
              onChange={(event) => setModelName(event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-ink-700">
            API Key
            <input
              className={getInputClassName()}
              value={apiKey}
              placeholder={selectedOption.requiresApiKey ? "sk-..." : "可选"}
              type="password"
              onChange={(event) => setApiKey(event.target.value)}
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-medium text-ink-700">
          Base URL
          <input
            className={getInputClassName()}
            value={baseUrl}
            placeholder={selectedOption.defaultBaseUrl ?? "无需配置"}
            onChange={(event) => setBaseUrl(event.target.value)}
          />
        </label>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium text-ink-700">
            Temperature
            <input
              className={getInputClassName()}
              value={temperature}
              inputMode="decimal"
              onChange={(event) => setTemperature(event.target.value)}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-ink-700">
            Max Tokens
            <input
              className={getInputClassName()}
              value={maxTokens}
              inputMode="numeric"
              onChange={(event) => setMaxTokens(event.target.value)}
            />
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-ink-300/35 bg-white/65 px-4 py-3 text-sm font-medium text-ink-700">
            <input
              checked={stream}
              className="h-4 w-4 accent-ink-900"
              type="checkbox"
              onChange={(event) => setStream(event.target.checked)}
            />
            流式 API
          </label>
        </div>
      </div>
    </ModalShell>
  );
}
