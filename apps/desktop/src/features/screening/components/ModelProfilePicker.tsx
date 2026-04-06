import type { ModelProviderProfile } from "@paper-read/shared";
import { Check, ChevronDown, Cpu } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedProfile =
    profiles.find((profile) => profile.id === selectedProfileId) ??
    profiles.find((profile) => profile.isDefault) ??
    profiles[0] ??
    null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (!selectedProfile) {
    return null;
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        aria-expanded={isOpen}
        className="inline-flex h-10 max-w-[240px] items-center gap-2 rounded-full border border-ink-300/45 bg-paper-50 px-3 text-xs font-medium text-ink-700 outline-none transition hover:border-ink-300/70 hover:bg-white"
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      >
        <Cpu className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{selectedProfile.name}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-ink-400" />
      </button>

      {isOpen ? (
        <div className="absolute bottom-12 left-0 z-30 w-[300px] overflow-hidden rounded-[22px] border border-ink-300/35 bg-white/98 p-1.5 shadow-[0_24px_60px_rgba(24,37,47,0.18)] backdrop-blur-2xl">
          {profiles.map((profile) => {
            const providerOption = getProviderOption(profile.settings.provider);
            const isSelected = profile.id === selectedProfile.id;

            return (
              <button
                key={profile.id}
                className={[
                  "flex w-full items-start gap-3 rounded-[18px] px-3 py-2.5 text-left transition",
                  isSelected ? "bg-ink-900 text-paper-50" : "text-ink-700 hover:bg-paper-50"
                ].join(" ")}
                type="button"
                onClick={() => {
                  onSelectProfile(profile.id);
                  setIsOpen(false);
                }}
              >
                <span
                  className={[
                    "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                    isSelected ? "border-paper-50/45" : "border-ink-300/45"
                  ].join(" ")}
                >
                  {isSelected ? <Check className="h-3 w-3" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{profile.name}</span>
                    {profile.isDefault ? (
                      <span
                        className={[
                          "rounded-full px-1.5 py-0.5 text-[0.62rem]",
                          isSelected ? "bg-paper-50/16" : "bg-ink-100 text-ink-500"
                        ].join(" ")}
                      >
                        默认
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={[
                      "mt-1 block truncate text-xs",
                      isSelected ? "text-paper-50/72" : "text-ink-500"
                    ].join(" ")}
                  >
                    {providerOption.label} · {profile.settings.modelName}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
