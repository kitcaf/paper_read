import type { ModelProviderSettings, PublicModelProviderSettings } from "@paper-read/shared";
import { useEffect, useEffectEvent, useState } from "react";

import { getModelSettings, updateModelSettings } from "../api/screeningApi";

export function useModelSettings() {
  const [settings, setSettings] = useState<PublicModelProviderSettings | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSettingsEvent = useEffectEvent(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      setSettings(await getModelSettings());
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load model settings."
      );
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    void loadSettingsEvent();
  }, []);

  async function handleSaveSettings(nextSettings: ModelProviderSettings) {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      setSettings(await updateModelSettings(nextSettings));
      setIsOpen(false);
      return true;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update model settings."
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  return {
    settings,
    errorMessage,
    isOpen,
    isLoading,
    isSaving,
    onOpen: () => setIsOpen(true),
    onClose: () => setIsOpen(false),
    onSave: handleSaveSettings
  };
}
