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
    <div className="min-w-0 overflow-hidden rounded-[24px] border border-ink-300/35 bg-white/72 shadow-[0_12px_30px_rgba(24,37,47,0.05)]">
      <div className="border-b border-ink-300/25 px-4 py-3">
        <h4 className="text-sm font-semibold text-ink-900">已配置模型</h4>
        <p className="mt-1 text-xs leading-5 text-ink-500">
          这里管理当前 workspace 内的所有 LLM 配置。
        </p>
      </div>

      <div className="ui-scroll-shadow max-h-[420px] space-y-2 overflow-y-auto px-3 py-3 xl:max-h-[560px]">
        {isLoading ? (
          <div className="rounded-2xl border border-ink-300/35 bg-white/70 px-4 py-5 text-sm text-ink-500">
            正在加载模型配置...
          </div>
        ) : null}

        {!isLoading && !profiles.length ? (
          <div className="rounded-2xl border border-dashed border-ink-300/45 bg-paper-50/70 px-4 py-5 text-sm text-ink-500">
            还没有模型配置，先创建一个新的 LLM profile。
          </div>
        ) : null}

        {profiles.map((profile) => {
          const isSelected = profile.id === selectedProfileId;
          const providerOption = getProviderOption(profile.settings.provider);

          return (
            <button
              key={profile.id}
              className={[
                "w-full min-w-0 rounded-2xl border px-4 py-3 text-left transition",
                isSelected
                  ? "border-ink-900/20 bg-white shadow-[0_12px_28px_rgba(24,37,47,0.08)]"
                  : "border-ink-300/35 bg-white/65 hover:border-ink-300/55 hover:bg-white"
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
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-[0.68rem] font-medium",
                    profile.settings.hasApiKey
                      ? "bg-emerald-500/10 text-emerald-700"
                      : "bg-amber-500/10 text-amber-700"
                  ].join(" ")}
                >
                  {profile.settings.hasApiKey ? "API Key 已保存" : "未保存 API Key"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
