import type {
  ModelProviderKind,
  ModelProviderProfile,
  ModelProviderProfileInput
} from "@paper-read/shared";
import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

import { ModalRoot } from "../../../components/ModalRoot";
import { ModelProfileForm } from "./ModelProfileForm";
import { ModelProfileList } from "./ModelProfileList";
import {
  createDraftFromProfile,
  getProviderOption,
  type ModelProfileDraft
} from "./modelSettingsConfig";

interface ModelSettingsDialogProps {
  open: boolean;
  profiles: ModelProviderProfile[];
  isLoading: boolean;
  isSaving: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSaveProfile: (profile: ModelProviderProfileInput) => Promise<boolean>;
  onDeleteProfile: (profileId: string) => Promise<void>;
  onSetDefaultProfile: (profileId: string) => Promise<void>;
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
      temperature: Number(draft.temperature),
      maxTokens: Number(draft.maxTokens),
      responseFormat: "json_object"
    }
  };
}

export function ModelSettingsDialog({
  open,
  profiles,
  isLoading,
  isSaving,
  errorMessage,
  onClose,
  onSaveProfile,
  onDeleteProfile,
  onSetDefaultProfile
}: ModelSettingsDialogProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [draft, setDraft] = useState(createDraftFromProfile(null));
  const selectedProfile =
    profiles.find((profile) => profile.id === selectedProfileId) ?? profiles[0] ?? null;

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
  }

  function handleCreateProfile() {
    setSelectedProfileId(null);
    setDraft(createDraftFromProfile(null));
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
  }

  async function handleSave() {
    const didSave = await onSaveProfile(buildProfileInput(selectedProfileId, draft));
    if (didSave && !selectedProfileId) {
      setDraft(createDraftFromProfile(null));
    }
  }

  return (
    <ModalRoot
      ariaLabelledBy="settings-title"
      className="relative grid h-[min(780px,88vh)] w-[min(1060px,94vw)] overflow-hidden rounded-[28px] border border-white/75 bg-paper-50/96 shadow-[0_24px_80px_rgba(24,37,47,0.18)] backdrop-blur-2xl md:grid-cols-[220px_minmax(0,1fr)]"
      open={open}
      onClose={onClose}
    >
      <aside className="border-b border-ink-300/30 bg-paper-50/92 p-4 md:border-b-0 md:border-r">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="settings-title" className="text-lg font-semibold text-ink-900">
              设置
            </h2>
            <p className="mt-1 text-xs text-ink-500">本地工作区配置</p>
          </div>
          <button
            aria-label="Close settings"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-300/40 bg-white/75 text-ink-600 transition hover:border-ink-300/65 hover:bg-white hover:text-ink-900"
            type="button"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="mt-6">
          <button
            className="flex w-full items-center justify-between rounded-2xl bg-white px-3 py-3 text-left text-sm font-medium text-ink-900 shadow-[0_10px_24px_rgba(24,37,47,0.06)]"
            type="button"
          >
            <span>LLM</span>
            <span className="rounded-full bg-ink-900 px-2 py-0.5 text-[0.68rem] text-paper-50">
              {profiles.length}
            </span>
          </button>
        </nav>
      </aside>

      <section className="min-h-0 overflow-y-auto p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-ink-900">LLM API</h3>
            <p className="mt-1 text-sm text-ink-500">
              可以配置多个模型；发起对话时可选择其中一个模型配置。
            </p>
          </div>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-full border border-ink-300/45 bg-white px-4 text-sm font-medium text-ink-700 transition hover:border-ink-300/65"
            type="button"
            onClick={handleCreateProfile}
          >
            <Plus className="h-4 w-4" />
            新增模型
          </button>
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-2xl border border-coral-500/20 bg-coral-500/8 px-4 py-3 text-sm text-coral-500">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
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
            onDraftChange={setDraft}
            onProviderChange={handleProviderChange}
            onSave={() => void handleSave()}
            onDelete={(profileId) => void onDeleteProfile(profileId)}
            onSetDefault={(profileId) => void onSetDefaultProfile(profileId)}
          />
        </div>
      </section>
    </ModalRoot>
  );
}
