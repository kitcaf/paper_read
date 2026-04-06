import type { ModelProviderProfile, ScreeningQueryOptions, SourceSummary } from "@paper-read/shared";
import { useEffect, useState } from "react";

interface SubmitScreeningMessageInput {
  sourceKey: string;
  queryText: string;
  modelProfileId?: string;
  options: ScreeningQueryOptions;
}

interface UseScreeningComposerOptions {
  sources: SourceSummary[];
  modelProfiles: ModelProviderProfile[];
  defaultSourceKey?: string;
  defaultModelProfileId?: string;
  resetKey: number;
  onSubmit: (input: SubmitScreeningMessageInput) => Promise<boolean> | boolean;
}

const DEFAULT_SCREENING_OPTIONS: ScreeningQueryOptions = {
  threshold: 0.58,
  includeReasoning: true
};

export function useScreeningComposer({
  sources,
  modelProfiles,
  defaultSourceKey,
  defaultModelProfileId,
  resetKey,
  onSubmit
}: UseScreeningComposerOptions) {
  const [queryText, setQueryText] = useState("");
  const [activeSourceKey, setActiveSourceKey] = useState(defaultSourceKey ?? "");
  const [activeModelProfileId, setActiveModelProfileId] = useState(defaultModelProfileId ?? "");
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);

  useEffect(() => {
    setQueryText("");
    setActiveSourceKey(defaultSourceKey ?? "");
    setActiveModelProfileId(defaultModelProfileId ?? "");
    setIsSourceDialogOpen(false);
  }, [defaultModelProfileId, defaultSourceKey, resetKey]);

  useEffect(() => {
    if (activeSourceKey || !defaultSourceKey) {
      return;
    }

    setActiveSourceKey(defaultSourceKey);
  }, [activeSourceKey, defaultSourceKey]);

  useEffect(() => {
    if (!activeSourceKey) {
      return;
    }

    const matchedSource = sources.some((source) => source.sourceKey === activeSourceKey);
    if (!matchedSource) {
      setActiveSourceKey("");
    }
  }, [activeSourceKey, sources]);

  useEffect(() => {
    if (activeModelProfileId || !defaultModelProfileId) {
      return;
    }

    setActiveModelProfileId(defaultModelProfileId);
  }, [activeModelProfileId, defaultModelProfileId]);

  useEffect(() => {
    if (!activeModelProfileId) {
      return;
    }

    const matchedProfile = modelProfiles.some((profile) => profile.id === activeModelProfileId);
    if (!matchedProfile) {
      setActiveModelProfileId(modelProfiles.find((profile) => profile.isDefault)?.id ?? "");
    }
  }, [activeModelProfileId, modelProfiles]);

  async function handleSubmit() {
    const normalizedQueryText = queryText.trim();
    if (!normalizedQueryText) {
      return false;
    }

    if (!activeSourceKey) {
      setIsSourceDialogOpen(true);
      return false;
    }

    const didSubmit = await onSubmit({
      sourceKey: activeSourceKey,
      queryText: normalizedQueryText,
      modelProfileId: activeModelProfileId || undefined,
      options: DEFAULT_SCREENING_OPTIONS
    });

    if (didSubmit) {
      setQueryText("");
    }

    return didSubmit;
  }

  return {
    queryText,
    activeSourceKey,
    activeModelProfileId,
    isSourceDialogOpen,
    canSubmit: Boolean(queryText.trim() && activeSourceKey),
    setQueryText,
    setActiveModelProfileId,
    setIsSourceDialogOpen,
    handleSelectSource: setActiveSourceKey,
    handleClearSource: () => setActiveSourceKey(""),
    handleSubmit
  };
}
