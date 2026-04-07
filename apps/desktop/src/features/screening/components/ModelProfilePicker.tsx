import type { ModelProviderProfile } from "@paper-read/shared";
import { Bot } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../../../components/ui/select";

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
      <SelectTrigger className="h-10 min-w-[160px] max-w-[220px] rounded-full border-ink-300/35 bg-white/92 px-2.5 shadow-[0_8px_18px_rgba(24,37,47,0.05)]">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-paper-50 px-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink-500">
            <Bot className="h-3.5 w-3.5" />
            LLM
          </span>
          <p className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-ink-900">
            {selectedProfile.name}
          </p>
        </div>
        <span className="sr-only">选择模型配置</span>
      </SelectTrigger>
      <SelectContent className="min-w-[220px]">
        {profiles.map((profile) => (
          <SelectItem key={profile.id} value={profile.id}>
            <span className="truncate font-medium text-ink-900">{profile.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
