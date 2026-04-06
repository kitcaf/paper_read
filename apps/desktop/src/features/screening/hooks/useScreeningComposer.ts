import type { ScreeningQueryOptions, SourceSummary } from "@paper-read/shared";
import { useEffect, useState } from "react";

interface SubmitScreeningMessageInput {
  sourceKey: string;
  queryText: string;
  options: ScreeningQueryOptions;
}

interface UseScreeningComposerOptions {
  sources: SourceSummary[];
  defaultSourceKey?: string;
  resetKey: number;
  onSubmit: (input: SubmitScreeningMessageInput) => Promise<boolean> | boolean;
}

const DEFAULT_SCREENING_OPTIONS: ScreeningQueryOptions = {
  threshold: 0.58,
  includeReasoning: true
};

export function useScreeningComposer({
  sources,
  defaultSourceKey,
  resetKey,
  onSubmit
}: UseScreeningComposerOptions) {
  const [queryText, setQueryText] = useState("");
  const [activeSourceKey, setActiveSourceKey] = useState(defaultSourceKey ?? "");
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);

  useEffect(() => {
    setQueryText("");
    setActiveSourceKey(defaultSourceKey ?? "");
    setIsSourceDialogOpen(false);
  }, [defaultSourceKey, resetKey]);

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
    isSourceDialogOpen,
    canSubmit: Boolean(queryText.trim() && activeSourceKey),
    setQueryText,
    setIsSourceDialogOpen,
    handleSelectSource: setActiveSourceKey,
    handleClearSource: () => setActiveSourceKey(""),
    handleSubmit
  };
}
