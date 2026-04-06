import type { SourceSummary } from "@paper-read/shared";
import { Check, Database } from "lucide-react";
import { useEffect, useState } from "react";

import { ModalShell } from "../../../components/layout/ModalShell";

interface ScreeningSourceDialogProps {
  open: boolean;
  sources: SourceSummary[];
  selectedSourceKey: string;
  onClose: () => void;
  onConfirm: (sourceKey: string) => void;
}

export function ScreeningSourceDialog({
  open,
  sources,
  selectedSourceKey,
  onClose,
  onConfirm
}: ScreeningSourceDialogProps) {
  const [draftSourceKey, setDraftSourceKey] = useState(selectedSourceKey);

  useEffect(() => {
    if (!open) {
      return;
    }

    setDraftSourceKey(selectedSourceKey || sources[0]?.sourceKey || "");
  }, [open, selectedSourceKey, sources]);

  return (
    <ModalShell
      open={open}
      title="选择论文源"
      description="先选定一个论文源，再用对话方式发起首轮筛选。"
      sizeClassName="max-w-2xl"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            className="inline-flex h-11 items-center justify-center rounded-full border border-ink-300/45 px-5 text-sm font-medium text-ink-700 transition hover:border-ink-300/65 hover:bg-white"
            type="button"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="inline-flex h-11 items-center justify-center rounded-full bg-ink-900 px-5 text-sm font-semibold text-paper-50 transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:bg-ink-500"
            type="button"
            disabled={!draftSourceKey}
            onClick={() => {
              if (!draftSourceKey) {
                return;
              }

              onConfirm(draftSourceKey);
              onClose();
            }}
          >
            使用该源
          </button>
        </div>
      }
      onClose={onClose}
    >
      {sources.length ? (
        <div className="grid gap-3">
          {sources.map((source) => {
            const isSelected = source.sourceKey === draftSourceKey;

            return (
              <button
                key={source.sourceKey}
                className={[
                  "group flex items-start justify-between gap-4 rounded-[22px] border px-4 py-4 text-left transition duration-200",
                  isSelected
                    ? "border-ink-900/18 bg-white shadow-[0_14px_28px_rgba(24,37,47,0.08)]"
                    : "border-ink-300/35 bg-paper-50/66 hover:border-ink-300/55 hover:bg-white"
                ].join(" ")}
                type="button"
                onClick={() => setDraftSourceKey(source.sourceKey)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/75 bg-white/85 text-ink-700 shadow-[0_10px_18px_rgba(24,37,47,0.04)]">
                    <Database className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-ink-900">{source.label}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                      <span>{source.paperCount} 篇论文</span>
                      <span>{source.hasAbstractCount} 篇含摘要</span>
                    </div>
                  </div>
                </div>

                <div
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition",
                    isSelected
                      ? "border-ink-900/14 bg-ink-900 text-paper-50"
                      : "border-ink-300/45 bg-white/75 text-transparent group-hover:text-ink-400"
                  ].join(" ")}
                >
                  <Check className="h-4 w-4" />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[22px] border border-ink-300/35 bg-white/75 px-4 py-5 text-sm text-ink-500">
          当前没有可用论文源。
        </div>
      )}
    </ModalShell>
  );
}
