import type { ModelProviderProfile } from "@paper-read/shared";
import { Star } from "lucide-react";

import { getProviderOption } from "./modelSettingsConfig";

interface ModelProfileListProps {
  profiles: ModelProviderProfile[];
  selectedProfileId: string | null;
  isLoading: boolean;
  onSelectProfile: (profile: ModelProviderProfile) => void;
}

export function ModelProfileList({
  profiles,
  selectedProfileId,
  isLoading,
  onSelectProfile
}: ModelProfileListProps) {
  return (
    <div className="space-y-2">
      {isLoading ? (
        <div className="rounded-2xl border border-ink-300/35 bg-white/70 px-4 py-5 text-sm text-ink-500">
          正在加载模型配置...
        </div>
      ) : null}

      {profiles.map((profile) => {
        const isSelected = profile.id === selectedProfileId;
        const providerOption = getProviderOption(profile.settings.provider);

        return (
          <button
            key={profile.id}
            className={[
              "w-full rounded-2xl border px-4 py-3 text-left transition",
              isSelected
                ? "border-ink-900/20 bg-white shadow-[0_12px_28px_rgba(24,37,47,0.08)]"
                : "border-ink-300/35 bg-white/65 hover:bg-white"
            ].join(" ")}
            type="button"
            onClick={() => onSelectProfile(profile)}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-semibold text-ink-900">{profile.name}</p>
              {profile.isDefault ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-ink-900 px-2 py-0.5 text-[0.68rem] text-paper-50">
                  <Star className="h-3 w-3" />
                  默认
                </span>
              ) : null}
            </div>
            <p className="mt-2 truncate text-xs text-ink-500">
              {providerOption.label} · {profile.settings.modelName}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {profile.settings.hasApiKey ? (
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.68rem] font-medium text-emerald-700">
                  Key saved
                </span>
              ) : null}
              <span className="rounded-full bg-paper-50 px-2 py-0.5 text-[0.68rem] font-medium text-ink-500">
                {profile.settings.stream ? "Stream first" : "Local"}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
