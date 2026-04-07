import type {
  ModelProfileTestResult,
  ModelProviderKind,
  ModelProviderProfile
} from "@paper-read/shared";
import type { ReactNode } from "react";
import { Check, FlaskConical, KeyRound, Settings2, Star, Trash2 } from "lucide-react";

import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../../../components/ui/select";
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

function Section({
  icon,
  title,
  description,
  children
}: {
  icon: typeof Settings2;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const Icon = icon;

  return (
    <section className="rounded-[24px] border border-ink-300/35 bg-paper-50/55 p-4">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-ink-300/30 bg-white text-ink-700 shadow-sm">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-ink-900">{title}</h4>
          <p className="mt-1 text-xs leading-5 text-ink-500">{description}</p>
        </div>
      </div>
      <div className="grid min-w-0 gap-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  description,
  children
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-w-0 gap-2">
      <Label>{label}</Label>
      {children}
      {description ? <p className="text-xs leading-5 text-ink-500">{description}</p> : null}
    </div>
  );
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
    <div className="min-w-0 overflow-hidden rounded-[28px] border border-ink-300/35 bg-white/84 p-5 shadow-[0_14px_36px_rgba(24,37,47,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink-300/30 pb-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-ink-900">
            {selectedProfile ? selectedProfile.name : "新模型配置"}
          </h3>
          <p className="mt-1 text-sm text-ink-500">
            用统一的 profile 管理不同提供方，发起对话时再选择使用哪个配置。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button disabled={isBusy} variant="outline" onClick={onTest}>
            <FlaskConical className="h-4 w-4" />
            测试连接
          </Button>
          <Button disabled={isBusy} onClick={onSave}>
            <Check className="h-4 w-4" />
            {isSaving ? "保存中..." : "保存配置"}
          </Button>
        </div>
      </div>

      <div className="mt-5 grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <Section
          description="为这个模型配置命名，并指定 provider、模型名称和请求入口。"
          icon={Settings2}
          title="基础配置"
        >
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
            <Field label="配置名称">
              <Input
                value={draft.name}
                onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
              />
            </Field>

            <Field label="Provider">
              <Select
                value={draft.provider}
                onValueChange={(value) => onProviderChange(value as ModelProviderKind)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择模型提供方" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_OPTIONS.map((option) => (
                    <SelectItem key={option.provider} value={option.provider}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="模型名称">
            <Input
              value={draft.modelName}
              placeholder={selectedOption.defaultModelName}
              onChange={(event) => onDraftChange({ ...draft, modelName: event.target.value })}
            />
          </Field>

          <Field label="Base URL">
            <Input
              value={draft.baseUrl}
              placeholder={selectedOption.defaultBaseUrl ?? "无需配置"}
              onChange={(event) => onDraftChange({ ...draft, baseUrl: event.target.value })}
            />
          </Field>
        </Section>

        <Section
          description="密钥只保存在当前本地 workspace。留空不会覆盖已保存的 API Key。"
          icon={KeyRound}
          title="认证与推理参数"
        >
          <Field
            label="API Key"
            description={
              hasSavedApiKey && !draft.apiKey
                ? "当前已存在一个已保存的 Key；保持留空会继续使用它。"
                : selectedOption.requiresApiKey
                  ? "请输入该 provider 的真实 API Key。"
                  : "该 provider 不强制要求 API Key。"
            }
          >
            <Input
              type="password"
              value={draft.apiKey}
              placeholder={selectedOption.requiresApiKey ? "输入 API Key" : "可选"}
              onChange={(event) => onDraftChange({ ...draft, apiKey: event.target.value })}
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Temperature">
              <Input
                inputMode="decimal"
                value={draft.temperature}
                onChange={(event) =>
                  onDraftChange({ ...draft, temperature: event.target.value })
                }
              />
            </Field>

            <Field label="Max Tokens">
              <Input
                inputMode="numeric"
                value={draft.maxTokens}
                onChange={(event) =>
                  onDraftChange({ ...draft, maxTokens: event.target.value })
                }
              />
            </Field>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-ink-300/35 bg-white px-4 py-3 text-sm font-medium text-ink-700">
            <input
              checked={draft.isDefault}
              className="h-4 w-4 accent-ink-900"
              type="checkbox"
              onChange={(event) =>
                onDraftChange({ ...draft, isDefault: event.target.checked })
              }
            />
            设为默认模型
          </label>

          <ModelConnectionStatus isTesting={isTesting} result={testResult} />
        </Section>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink-300/30 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          {selectedProfile && !selectedProfile.isDefault ? (
            <Button disabled={isBusy} variant="secondary" onClick={() => onSetDefault(selectedProfile.id)}>
              <Star className="h-4 w-4" />
              设为默认
            </Button>
          ) : null}

          {selectedProfile ? (
            <Button
              disabled={isBusy || profileCount <= 1}
              variant="destructive"
              onClick={() => onDelete(selectedProfile.id)}
            >
              <Trash2 className="h-4 w-4" />
              删除配置
            </Button>
          ) : null}
        </div>

        <p className="text-xs leading-5 text-ink-500">
          系统会优先尝试流式接口；若 provider 不支持，会自动降级到非流式请求。
        </p>
      </div>
    </div>
  );
}
