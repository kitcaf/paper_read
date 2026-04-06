import type { ScreeningQueryOptions, SourceSummary } from "@paper-read/shared";
import type { FormEvent } from "react";
import { ArrowUp, ChevronDown, Search, Sparkles, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { useScreeningComposer } from "../hooks/useScreeningComposer";
import { formatSourceLabel } from "../presentation";
import { ScreeningSourceDialog } from "./ScreeningSourceDialog";

interface QueryComposerProps {
  sources: SourceSummary[];
  defaultSourceKey?: string;
  resetKey: number;
  isSubmitting: boolean;
  onSubmit: (input: {
    sourceKey: string;
    queryText: string;
    options: ScreeningQueryOptions;
  }) => Promise<boolean> | boolean;
}

export function QueryComposer({
  sources,
  defaultSourceKey,
  resetKey,
  isSubmitting,
  onSubmit
}: QueryComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const {
    queryText,
    activeSourceKey,
    isSourceDialogOpen,
    canSubmit,
    setQueryText,
    setIsSourceDialogOpen,
    handleSelectSource,
    handleClearSource,
    handleSubmit: submitScreeningMessage
  } = useScreeningComposer({
    sources,
    defaultSourceKey,
    resetKey,
    onSubmit
  });

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) {
      return;
    }

    element.style.height = "0px";
    element.style.height = `${Math.min(element.scrollHeight, 144)}px`;
  }, [queryText]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitScreeningMessage();
  }

  return (
    <>
      <section className="overflow-hidden rounded-[26px] border border-white/85 bg-white/96 shadow-[0_24px_48px_rgba(24,37,47,0.14)] backdrop-blur-2xl">
        {activeSourceKey ? (
          <div className="flex flex-wrap items-center gap-2 border-b border-ink-300/25 px-4 py-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-ink-300/35 bg-paper-50 px-3 py-1.5 text-xs font-medium text-ink-700">
              <Search className="h-3.5 w-3.5" />
              <span>筛选论文</span>
            </span>

            <button
              className="inline-flex items-center gap-2 rounded-full border border-ink-300/35 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-ink-300/55 hover:bg-paper-50"
              type="button"
              onClick={() => setIsSourceDialogOpen(true)}
            >
              <span>{formatSourceLabel(activeSourceKey, sources)}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            <button
              aria-label="Clear screening source"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-ink-300/35 bg-paper-50 text-ink-500 transition hover:border-ink-300/55 hover:bg-white hover:text-ink-900"
              type="button"
              onClick={handleClearSource}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div className="px-4 pt-3">
            <textarea
              ref={textareaRef}
              rows={1}
              className="min-h-[56px] max-h-[144px] w-full resize-none bg-transparent py-2 text-[15px] leading-7 text-ink-900 outline-none placeholder:text-ink-500/58"
              value={queryText}
              onChange={(event) => setQueryText(event.target.value)}
              placeholder={
                activeSourceKey
                  ? "输入你想筛选的研究主题或问题..."
                  : "先选择“筛选论文”工具，再输入你的研究主题..."
              }
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center justify-between gap-3 px-3 pb-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                className={[
                  "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition",
                  activeSourceKey
                    ? "border-ink-900/10 bg-ink-900 text-paper-50 hover:bg-ink-800"
                    : "border-ink-300/45 bg-paper-50 text-ink-700 hover:border-ink-300/65 hover:bg-white"
                ].join(" ")}
                type="button"
                onClick={() => setIsSourceDialogOpen(true)}
              >
                <Search className="h-4 w-4" />
                <span>筛选论文</span>
              </button>

              <div className="hidden items-center gap-2 rounded-full border border-transparent px-2 text-xs text-ink-400 md:inline-flex">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Research mode</span>
              </div>
            </div>

            <button
              aria-label="Send message"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-ink-900 text-paper-50 transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:bg-ink-500"
              type="submit"
              disabled={isSubmitting || !queryText.trim() || !sources.length || !canSubmit}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </form>
      </section>

      <ScreeningSourceDialog
        open={isSourceDialogOpen}
        sources={sources}
        selectedSourceKey={activeSourceKey}
        onClose={() => setIsSourceDialogOpen(false)}
        onConfirm={handleSelectSource}
      />
    </>
  );
}
