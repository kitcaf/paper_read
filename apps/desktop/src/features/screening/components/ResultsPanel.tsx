import type {
  ScreeningResultItem,
  ScreeningResultsPage,
  SourceSummary
} from "@paper-read/shared";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

import {
  formatSourceLabel,
  getDecisionVariant,
  truncateText
} from "../presentation";
import type { WorkspaceConversationDetail } from "../workspaceTypes";

interface ResultsPanelProps {
  conversation: WorkspaceConversationDetail | null;
  resultsPage: ScreeningResultsPage | null;
  sources: SourceSummary[];
  isLoading: boolean;
  onToggleSidebar: () => void;
}

function formatScore(score: number | null) {
  return score === null ? "--" : score.toFixed(2);
}

function buildSelectedResult(
  items: ScreeningResultItem[] | undefined,
  selectedResultId: string | null
) {
  if (!items?.length) {
    return null;
  }

  return items.find((item) => item.id === selectedResultId) ?? items[0];
}

export function ResultsPanel({
  conversation,
  resultsPage,
  sources,
  isLoading,
  onToggleSidebar
}: ResultsPanelProps) {
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const selectedResult = buildSelectedResult(resultsPage?.items, selectedResultId);

  return (
    <aside className="flex h-full min-h-0 flex-col px-3 py-3">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-ink-300/35 bg-white shadow-[0_10px_28px_rgba(24,37,47,0.06)]">
        <div className="flex items-center justify-between gap-3 border-b border-ink-300/35 px-4 py-3">
          <p className="truncate text-sm font-medium text-ink-900">
            {selectedResult ? truncateText(selectedResult.paper.title, 42) : "论文上下文"}
          </p>
          <div className="flex items-center gap-3">
            {conversation?.mode === "screening" ? (
              <span className="shrink-0 text-xs text-ink-500">
                {resultsPage?.summary.keepCount ?? 0} keep
              </span>
            ) : null}
            <button
              aria-label="Hide paper sidebar"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-500 transition hover:bg-paper-50 hover:text-ink-900"
              type="button"
              onClick={onToggleSidebar}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {selectedResult ? (
            <div className="px-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={getDecisionVariant(selectedResult.decision).badgeClassName}>
                  {selectedResult.decision}
                </span>
                <span className="text-xs text-ink-500">
                  {formatSourceLabel(selectedResult.paper.sourceKey, sources)}
                </span>
              </div>

              <h2 className="mt-4 text-[1.9rem] font-semibold leading-tight text-ink-900">
                {selectedResult.paper.title}
              </h2>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-ink-500">
                {selectedResult.paper.venue ? <span>{selectedResult.paper.venue}</span> : null}
                {selectedResult.paper.year ? <span>{selectedResult.paper.year}</span> : null}
                <span>Score {formatScore(selectedResult.score)}</span>
              </div>

              <div className="mt-6 space-y-4 text-sm leading-7 text-ink-700">
                <p>{selectedResult.reasoning ?? "No reasoning available."}</p>
                {selectedResult.paper.abstract ? <p>{selectedResult.paper.abstract}</p> : null}
              </div>
            </div>
          ) : (
            <div className="px-4 py-4 text-sm text-ink-500">
              {conversation
                ? conversation.mode === "screening"
                  ? isLoading
                    ? "正在同步论文..."
                    : "这次筛选还没有候选论文。"
                  : "当前是自由聊天；等你执行筛选、阅读或引用论文后，这里会显示相关上下文。"
                : "对话开始后，这里会显示筛选出来的论文。"}
            </div>
          )}

          {resultsPage?.items.length ? (
            <div className="border-t border-ink-300/35 px-3 py-3">
              <p className="px-1 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-ink-500">
                Paper list
              </p>
              <div className="mt-3 space-y-1">
                {resultsPage.items.map((result) => {
                  const isActive = selectedResult?.id === result.id;

                  return (
                    <button
                      key={result.id}
                      className={[
                        "w-full rounded-[14px] border px-3 py-3 text-left transition duration-200",
                        isActive
                          ? "border-ink-300/55 bg-paper-50"
                          : "border-transparent hover:border-ink-300/45 hover:bg-paper-50/70"
                      ].join(" ")}
                      type="button"
                      onClick={() => setSelectedResultId(result.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 text-sm font-medium leading-6 text-ink-900">
                          {truncateText(result.paper.title, 56)}
                        </p>
                        <span className="shrink-0 text-xs text-ink-500">
                          {formatScore(result.score)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={getDecisionVariant(result.decision).badgeClassName}>
                          {result.decision}
                        </span>
                        {result.paper.year ? (
                          <span className="text-xs text-ink-500">{result.paper.year}</span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
