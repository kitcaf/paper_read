import type {
  ModelProfileTestResult,
  ModelProviderProfile,
  ModelProviderProfileInput
} from "@paper-read/shared";
import { useEffect, useEffectEvent, useState } from "react";

import {
  deleteModelProfile,
  listModelProfiles,
  setDefaultModelProfile,
  testModelProfile,
  upsertModelProfile
} from "../api/screeningApi";

export function useModelSettings() {
  const [profiles, setProfiles] = useState<ModelProviderProfile[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ModelProfileTestResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSettingsEvent = useEffectEvent(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      setProfiles(await listModelProfiles());
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load model profiles."
      );
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    void loadSettingsEvent();
  }, []);

  async function handleSaveProfile(profile: ModelProviderProfileInput) {
    setIsSaving(true);
    setErrorMessage(null);
    setTestResult(null);

    try {
      await upsertModelProfile(profile);
      setProfiles(await listModelProfiles());
      return true;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save model profile."
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteProfile(profileId: string) {
    setIsSaving(true);
    setErrorMessage(null);
    setTestResult(null);

    try {
      setProfiles(await deleteModelProfile(profileId));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to delete model profile."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSetDefaultProfile(profileId: string) {
    setIsSaving(true);
    setErrorMessage(null);
    setTestResult(null);

    try {
      setProfiles(await setDefaultModelProfile(profileId));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to set default model profile."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTestProfile(profile: ModelProviderProfileInput) {
    setIsTesting(true);
    setErrorMessage(null);
    setTestResult(null);

    try {
      const result = await testModelProfile(profile);
      setTestResult(result);
      return result;
    } catch (error) {
      const fallbackResult: ModelProfileTestResult = {
        ok: false,
        provider: profile.settings.provider,
        modelName: profile.settings.modelName,
        latencyMs: 0,
        message: error instanceof Error ? error.message : "Failed to test model profile."
      };
      setTestResult(fallbackResult);
      return fallbackResult;
    } finally {
      setIsTesting(false);
    }
  }

  return {
    profiles,
    defaultProfile: profiles.find((profile) => profile.isDefault) ?? profiles[0] ?? null,
    errorMessage,
    isOpen,
    isLoading,
    isSaving,
    isTesting,
    testResult,
    onOpen: () => setIsOpen(true),
    onClose: () => setIsOpen(false),
    onSaveProfile: handleSaveProfile,
    onDeleteProfile: handleDeleteProfile,
    onSetDefaultProfile: handleSetDefaultProfile,
    onTestProfile: handleTestProfile,
    onClearTestResult: () => setTestResult(null),
    onReload: loadSettingsEvent
  };
}
