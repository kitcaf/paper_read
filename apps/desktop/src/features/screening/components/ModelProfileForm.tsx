import type { ModelProviderKind, ModelProviderProfile } from "@paper-read/shared";
import { Check, Star, Trash2 } from "lucide-react";

import {
  getInputClassName,
  getProviderOption,
  type ModelProfileDraft,
  PROVIDER_OPTIONS
} from "./modelSettingsConfig";

interface ModelProfileFormProps {
  draft: ModelProfileDraft;
  selectedProfile: ModelProviderProfile | null;
  profileCount: number;
  isSaving: boolean;
  onDraftChange: (draft: ModelProfileDraft) => void;
  onProviderChange: (provider: ModelProviderKind) => void;
  onSave: () => void;
  onDelete: (profileId: string) => void;
  onSetDefault: (profileId: string) => void;
}

export function ModelProfileForm({
  draft,
  selectedProfile,
  profileCount,
  isSaving,
  onDraftChange,
  onProviderChange,
  onSave,
  onDelete,
  onSetDefault
}: ModelProfileFormProps) {
  const selectedOption = getProviderOption(draft.provider);

  return (
    <div className="rounded-[24px] border border-ink-300/35 bg-white/72 p-4">
      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-ink-700">
          名称
          <input
            className={getInputClassName()}
            value={draft.name}
            onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-ink-700">
          Provider
          <select
            className={getInputClassName()}
            value={draft.provider}
            onChange={(event) => onProviderChange(event.target.value as ModelProviderKind)}
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
              value={draft.modelName}
              placeholder={selectedOption.defaultModelName}
              onChange={(event) => onDraftChange({ ...draft, modelName: event.target.value })}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-ink-700">
            API Key
            <input
              className={getInputClassName()}
              value={draft.apiKey}
              placeholder={selectedOption.requiresApiKey ? "留空则保留原 Key" : "可选"}
              type="password"
              onChange={(event) => onDraftChange({ ...draft, apiKey: event.target.value })}
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-medium text-ink-700">
          Base URL
          <input
            className={getInputClassName()}
            value={draft.baseUrl}
            placeholder={selectedOption.defaultBaseUrl ?? "无需配置"}
            onChange={(event) => onDraftChange({ ...draft, baseUrl: event.target.value })}
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium text-ink-700">
            Temperature
            <input
              className={getInputClassName()}
              value={draft.temperature}
              inputMode="decimal"
              onChange={(event) => onDraftChange({ ...draft, temperature: event.target.value })}
            />
          </label>

          <label className="grid gap-2 text-sm font-medium text-ink-700">
            Max Tokens
            <input
              className={getInputClassName()}
              value={draft.maxTokens}
              inputMode="numeric"
              onChange={(event) => onDraftChange({ ...draft, maxTokens: event.target.value })}
            />
          </label>
        </div>

        <label className="flex items-center gap-3 rounded-2xl border border-ink-300/35 bg-paper-50/70 px-4 py-3 text-sm font-medium text-ink-700">
          <input
            checked={draft.isDefault}
            className="h-4 w-4 accent-ink-900"
            type="checkbox"
            onChange={(event) => onDraftChange({ ...draft, isDefault: event.target.checked })}
          />
          设为默认模型
        </label>

        <p className="rounded-2xl border border-ink-300/35 bg-paper-50/70 px-4 py-3 text-xs leading-5 text-ink-500">
          模型调用默认优先走流式接口；如果服务端或模型不支持，agent 会自动降级重试非流式请求。
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink-300/30 pt-4">
        <div className="flex items-center gap-2">
          {selectedProfile ? (
            <button
              className="inline-flex h-10 items-center gap-2 rounded-full border border-ink-300/45 px-4 text-sm font-medium text-ink-600 transition hover:border-coral-500/40 hover:text-coral-500 disabled:cursor-not-allowed disabled:opacity-45"
              type="button"
              disabled={isSaving || profileCount <= 1}
              onClick={() => onDelete(selectedProfile.id)}
            >
              <Trash2 className="h-4 w-4" />
              删除
            </button>
          ) : null}
          {selectedProfile && !selectedProfile.isDefault ? (
            <button
              className="inline-flex h-10 items-center gap-2 rounded-full border border-ink-300/45 px-4 text-sm font-medium text-ink-700 transition hover:border-ink-300/65 hover:bg-white"
              type="button"
              disabled={isSaving}
              onClick={() => onSetDefault(selectedProfile.id)}
            >
              <Star className="h-4 w-4" />
              设为默认
            </button>
          ) : null}
        </div>

        <button
          className="inline-flex h-11 items-center gap-2 rounded-full bg-ink-900 px-5 text-sm font-semibold text-paper-50 transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:bg-ink-500"
          type="button"
          disabled={isSaving}
          onClick={onSave}
        >
          <Check className="h-4 w-4" />
          {isSaving ? "保存中..." : "保存配置"}
        </button>
      </div>
    </div>
  );
}
