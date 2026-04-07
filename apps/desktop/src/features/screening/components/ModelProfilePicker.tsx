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
      <SelectTrigger className="h-10 max-w-[260px] rounded-full bg-paper-50 px-3 text-xs font-medium">
        <SelectValue placeholder="选择模型配置" />
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
