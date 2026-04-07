import type { ModelProviderProfile } from "@paper-read/shared";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../../../components/ui/select";
import { getProviderOption } from "./modelSettingsConfig";

interface ModelProfilePickerProps {
  profiles: ModelProviderProfile[];
  selectedProfileId: string;
  onSelectProfile: (profileId: string) => void;
}

export function ModelProfilePicker({
  profiles,
  selectedProfileId,
  onSelectProfile
}: ModelProfilePickerProps) {
  const selectedProfile =
    profiles.find((profile) => profile.id === selectedProfileId) ??
    profiles.find((profile) => profile.isDefault) ??
    profiles[0] ??
    null;

  if (!selectedProfile) {
    return null;
  }

  return (
    <Select value={selectedProfile.id} onValueChange={onSelectProfile}>
      <SelectTrigger className="h-12 min-w-[260px] max-w-[340px] rounded-[22px] border-ink-300/35 bg-white/92 px-2.5 shadow-[0_10px_24px_rgba(24,37,47,0.06)]">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="inline-flex h-8 shrink-0 items-center rounded-full bg-paper-50 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-ink-500">
            LLM
          </span>
          <div className="min-w-0 flex-1 text-left leading-none">
            <p className="truncate text-sm font-semibold text-ink-900">{selectedProfile.name}</p>
            <p className="mt-1 truncate text-[0.72rem] text-ink-500">
              {getProviderOption(selectedProfile.settings.provider).label} ·{" "}
              {selectedProfile.settings.modelName}
            </p>
          </div>
        </div>
        <span className="sr-only">选择模型配置</span>
      </SelectTrigger>
      <SelectContent className="min-w-[320px]">
        {profiles.map((profile) => {
          const providerOption = getProviderOption(profile.settings.provider);

          return (
            <SelectItem key={profile.id} value={profile.id}>
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium text-ink-900">{profile.name}</span>
                <span className="truncate text-xs text-ink-500">
                  {providerOption.label} · {profile.settings.modelName}
                </span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
