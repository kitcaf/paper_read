import type {
  ModelProfileTestResult,
  ModelProviderKind,
  ModelProviderProfile
} from "@paper-read/shared";
import { Check, FlaskConical, Star, Trash2 } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { Field, SelectInput, TextInput } from "../../../components/ui/Field";
import { ModelConnectionStatus } from "./ModelConnectionStatus";
import {
  getProviderOption,
  type ModelProfileDraft,
  PROVIDER_OPTIONS
} from "./modelSettingsConfig";

interface ModelProfileFormProps {
  draft: ModelProfileDraft;
  selectedProfile: ModelProviderProfile | null;
  profileCount: number;
  isSaving: boolean;
  isTesting: boolean;
  testResult: ModelProfileTestResult | null;
  onDraftChange: (draft: ModelProfileDraft) => void;
  onProviderChange: (provider: ModelProviderKind) => void;
  onSave: () => void;
  onTest: () => void;
  onDelete: (profileId: string) => void;
  onSetDefault: (profileId: string) => void;
}

export function ModelProfileForm({
  draft,
  selectedProfile,
  profileCount,
  isSaving,
  isTesting,
  testResult,
  onDraftChange,
  onProviderChange,
  onSave,
  onTest,
  onDelete,
  onSetDefault
}: ModelProfileFormProps) {
  const selectedOption = getProviderOption(draft.provider);
  const hasSavedApiKey = Boolean(selectedProfile?.settings.hasApiKey);
  const isBusy = isSaving || isTesting;

  return (
    <div className="min-w-0 overflow-hidden rounded-[24px] border border-ink-300/35 bg-white/78 p-4 shadow-[0_14px_36px_rgba(24,37,47,0.06)]">
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <Field label="配置名称">
            <TextInput
              value={draft.name}
              onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
            />
          </Field>

          <Field label="Provider">
            <SelectInput
              value={draft.provider}
              onChange={(event) => onProviderChange(event.target.value as ModelProviderKind)}
            >
              {PROVIDER_OPTIONS.map((option) => (
                <option key={option.provider} value={option.provider}>
                  {option.label}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="模型名称">
            <TextInput
              value={draft.modelName}
              placeholder={selectedOption.defaultModelName}
              onChange={(event) => onDraftChange({ ...draft, modelName: event.target.value })}
            />
          </Field>

          <Field
            label="API Key"
            description={
              hasSavedApiKey && !draft.apiKey
                ? "已保存密钥；留空会继续使用原密钥。"
                : selectedOption.requiresApiKey
                  ? "仅保存在本地 workspace。"
                  : "该 provider 可不填写。"
            }
          >
            <TextInput
              value={draft.apiKey}
              placeholder={selectedOption.requiresApiKey ? "输入 API key" : "可选"}
              type="password"
              onChange={(event) => onDraftChange({ ...draft, apiKey: event.target.value })}
            />
          </Field>
        </div>

        <Field label="Base URL">
          <TextInput
            value={draft.baseUrl}
            placeholder={selectedOption.defaultBaseUrl ?? "无需配置"}
            onChange={(event) => onDraftChange({ ...draft, baseUrl: event.target.value })}
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Temperature">
            <TextInput
              value={draft.temperature}
              inputMode="decimal"
              onChange={(event) => onDraftChange({ ...draft, temperature: event.target.value })}
            />
          </Field>

          <Field label="Max Tokens">
            <TextInput
              value={draft.maxTokens}
              inputMode="numeric"
              onChange={(event) => onDraftChange({ ...draft, maxTokens: event.target.value })}
            />
          </Field>
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

        <ModelConnectionStatus isTesting={isTesting} result={testResult} />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink-300/30 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button disabled={isBusy} variant="secondary" onClick={onTest}>
            <FlaskConical className="h-4 w-4" />
            测试连接
          </Button>

          {selectedProfile ? (
            <Button
              disabled={isBusy || profileCount <= 1}
              variant="danger"
              onClick={() => onDelete(selectedProfile.id)}
            >
              <Trash2 className="h-4 w-4" />
              删除
            </Button>
          ) : null}

          {selectedProfile && !selectedProfile.isDefault ? (
            <Button
              disabled={isBusy}
              variant="secondary"
              onClick={() => onSetDefault(selectedProfile.id)}
            >
              <Star className="h-4 w-4" />
              设为默认
            </Button>
          ) : null}
        </div>

        <Button disabled={isBusy} variant="primary" onClick={onSave}>
          <Check className="h-4 w-4" />
          {isSaving ? "保存中..." : "保存配置"}
        </Button>
      </div>
    </div>
  );
}
