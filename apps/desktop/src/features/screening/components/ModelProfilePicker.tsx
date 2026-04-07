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
      <SelectTrigger className="h-11 max-w-[320px] rounded-full border-ink-300/35 bg-white/90 px-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded-full bg-paper-50 px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-ink-500">
            LLM
          </span>
          <div className="min-w-0 text-left">
            <p className="truncate text-xs font-semibold text-ink-900">{selectedProfile.name}</p>
            <p className="truncate text-[0.68rem] text-ink-500">
              {getProviderOption(selectedProfile.settings.provider).label} ·{" "}
              {selectedProfile.settings.modelName}
            </p>
          </div>
        </div>
        <SelectValue className="sr-only" placeholder="选择模型配置" />
      </SelectTrigger>
      <SelectContent>
        {profiles.map((profile) => {
          const providerOption = getProviderOption(profile.settings.provider);

          return (
            <SelectItem key={profile.id} value={profile.id}>
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{profile.name}</span>
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
