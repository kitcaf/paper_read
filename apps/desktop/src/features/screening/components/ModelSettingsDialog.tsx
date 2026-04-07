import type {
  ModelProfileTestResult,
  ModelProviderKind,
  ModelProviderProfile,
  ModelProviderProfileInput
} from "@paper-read/shared";
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

import { ModalRoot } from "../../../components/ModalRoot";
import { Button } from "../../../components/ui/button";
import { ModelProfileForm } from "./ModelProfileForm";
import { ModelProfileList } from "./ModelProfileList";
import {
  createDraftFromProfile,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
  getProviderOption,
  readDraftNumber,
  type ModelProfileDraft
} from "./modelSettingsConfig";

interface ModelSettingsDialogProps {
  open: boolean;
  profiles: ModelProviderProfile[];
  isLoading: boolean;
  isSaving: boolean;
  isTesting: boolean;
  testResult: ModelProfileTestResult | null;
  errorMessage?: string | null;
  onClose: () => void;
  onSaveProfile: (profile: ModelProviderProfileInput) => Promise<boolean>;
  onDeleteProfile: (profileId: string) => Promise<void>;
  onSetDefaultProfile: (profileId: string) => Promise<void>;
  onTestProfile: (profile: ModelProviderProfileInput) => Promise<ModelProfileTestResult>;
  onClearTestResult: () => void;
}

function buildProfileInput(
  selectedProfileId: string | null,
  draft: ModelProfileDraft
): ModelProviderProfileInput {
  const selectedOption = getProviderOption(draft.provider);

  return {
    id: selectedProfileId ?? undefined,
    name: draft.name.trim() || draft.modelName,
    isDefault: draft.isDefault,
    settings: {
      provider: draft.provider,
      modelName: draft.modelName.trim() || selectedOption.defaultModelName,
      ...(draft.baseUrl.trim() ? { baseUrl: draft.baseUrl.trim() } : {}),
      ...(draft.apiKey.trim() ? { apiKey: draft.apiKey.trim() } : {}),
      temperature: readDraftNumber(draft.temperature, DEFAULT_TEMPERATURE),
      maxTokens: readDraftNumber(draft.maxTokens, DEFAULT_MAX_TOKENS),
      responseFormat: "json_object"
    }
  };
}

export function ModelSettingsDialog({
  open,
  profiles,
  isLoading,
  isSaving,
  isTesting,
  testResult,
  errorMessage,
  onClose,
  onSaveProfile,
  onDeleteProfile,
  onSetDefaultProfile,
  onTestProfile,
  onClearTestResult
}: ModelSettingsDialogProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [draft, setDraft] = useState(createDraftFromProfile(null));
  const selectedProfile = selectedProfileId
    ? profiles.find((profile) => profile.id === selectedProfileId) ?? null
    : null;

  useEffect(() => {
    if (!open) {
      return;
    }

    const initialProfile = profiles.find((profile) => profile.isDefault) ?? profiles[0] ?? null;
    setSelectedProfileId(initialProfile?.id ?? null);
    setDraft(createDraftFromProfile(initialProfile));
  }, [open, profiles]);

  function handleSelectProfile(profile: ModelProviderProfile) {
    setSelectedProfileId(profile.id);
    setDraft(createDraftFromProfile(profile));
    onClearTestResult();
  }

  function handleCreateProfile() {
    setSelectedProfileId(null);
    setDraft(createDraftFromProfile(null));
    onClearTestResult();
  }

  function handleProviderChange(provider: ModelProviderKind) {
    const option = getProviderOption(provider);
    setDraft((currentDraft) => ({
      ...currentDraft,
      provider,
      modelName: option.defaultModelName,
      baseUrl: option.defaultBaseUrl ?? "",
      apiKey: ""
    }));
    onClearTestResult();
  }

  function handleDraftChange(nextDraft: ModelProfileDraft) {
    setDraft(nextDraft);
    onClearTestResult();
  }

  async function handleSave() {
    const didSave = await onSaveProfile(buildProfileInput(selectedProfileId, draft));
    if (didSave && !selectedProfileId) {
      setDraft(createDraftFromProfile(null));
    }
  }

  async function handleTest() {
    await onTestProfile(buildProfileInput(selectedProfileId, draft));
  }

  return (
    <ModalRoot
      ariaLabelledBy="settings-title"
      className="relative grid h-[min(780px,calc(100vh-48px))] w-[min(1060px,calc(100vw-48px))] min-w-0 overflow-hidden rounded-[28px] border border-white/75 bg-paper-50/96 shadow-[0_24px_80px_rgba(24,37,47,0.18)] backdrop-blur-2xl md:grid-cols-[200px_minmax(0,1fr)]"
      open={open}
      onClose={onClose}
    >
      <aside className="min-w-0 border-b border-ink-300/30 bg-paper-50/92 p-4 md:border-b-0 md:border-r">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="settings-title" className="text-lg font-semibold text-ink-900">
              设置
            </h2>
          </div>
          <Button
            aria-label="Close settings"
            size="icon"
            variant="secondary"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="mt-6">
          <div className="flex w-full items-center justify-between rounded-2xl border border-ink-300/30 bg-white px-3 py-3 text-left text-sm font-medium text-ink-900 shadow-[0_10px_24px_rgba(24,37,47,0.06)]">
            <span>LLM</span>
            <span className="rounded-full bg-ink-900 px-2 py-0.5 text-[0.68rem] text-paper-50">
              {profiles.length}
            </span>
          </div>
        </nav>
      </aside>

      <section className="min-h-0 min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-ink-900">LLM API</h3>
            <p className="mt-1 text-sm text-ink-500">
              可以配置多个模型；发起对话时可选择其中一个模型配置。
            </p>
          </div>
          <Button variant="secondary" onClick={handleCreateProfile}>
            <Plus className="h-4 w-4" />
            新增模型
          </Button>
        </div>

        {errorMessage ? (
          <div className="mt-4 max-h-28 overflow-y-auto rounded-2xl border border-coral-500/20 bg-coral-500/8 px-4 py-3 text-sm text-coral-500 [overflow-wrap:anywhere]">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-5 grid min-w-0 gap-4 xl:grid-cols-[minmax(220px,280px)_minmax(0,1fr)]">
          <ModelProfileList
            profiles={profiles}
            selectedProfileId={selectedProfileId}
            isLoading={isLoading}
            onSelectProfile={handleSelectProfile}
          />

          <ModelProfileForm
            draft={draft}
            selectedProfile={selectedProfile}
            profileCount={profiles.length}
            isSaving={isSaving}
            isTesting={isTesting}
            testResult={testResult}
            onDraftChange={handleDraftChange}
            onProviderChange={handleProviderChange}
            onSave={() => void handleSave()}
            onTest={() => void handleTest()}
            onDelete={(profileId) => void onDeleteProfile(profileId)}
            onSetDefault={(profileId) => void onSetDefaultProfile(profileId)}
          />
        </div>
      </section>
    </ModalRoot>
  );
}
