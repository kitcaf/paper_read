import type { ScreeningQuerySummary, SourceSummary } from "@paper-read/shared";
import { ChevronLeft, Plus, Settings } from "lucide-react";

import {
  formatConversationTimestamp,
  formatSourceLabel,
  getQueryStatusVariant,
  truncateText
} from "../presentation";

interface HistorySidebarProps {
  queries: ScreeningQuerySummary[];
  sources: SourceSummary[];
  selectedQueryId: string | null;
  onSelectQuery: (queryId: string) => void;
  onCreateChat: () => void;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
}

export function HistorySidebar({
  queries,
  sources,
  selectedQueryId,
  onSelectQuery,
  onCreateChat,
  onToggleSidebar,
  onOpenSettings
}: HistorySidebarProps) {
  return (
    <aside className="flex h-full min-h-0 flex-col">
      <div className="border-b border-ink-300/35 px-3 py-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[1.05rem] font-semibold text-ink-900">PaperRead</h1>
          <button
            aria-label="Hide history sidebar"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-500 transition hover:bg-white hover:text-ink-900"
            type="button"
            onClick={onToggleSidebar}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-3 py-3">
        <button
          className="inline-flex w-full items-center gap-2 rounded-[14px] border border-ink-300/50 bg-white/82 px-3 py-2 text-sm font-medium text-ink-700 transition hover:bg-white"
          type="button"
          onClick={onCreateChat}
        >
          <Plus className="h-4 w-4" />
          <span>新对话</span>
        </button>
      </div>

      <div className="px-3 pb-2">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ink-500">
          历史对话
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {queries.length ? (
          <ul className="space-y-1">
            {queries.map((query) => {
              const statusVariant = getQueryStatusVariant(query.status);
              const isActive = query.id === selectedQueryId;

              return (
                <li key={query.id}>
                  <button
                    className={[
                      "w-full rounded-[14px] border px-3 py-3 text-left transition duration-200",
                      isActive
                        ? "border-ink-300/55 bg-white shadow-[0_8px_24px_rgba(24,37,47,0.06)]"
                        : "border-transparent bg-transparent hover:border-white/70 hover:bg-white/72"
                    ].join(" ")}
                    type="button"
                    onClick={() => onSelectQuery(query.id)}
                  >
                    <p className="truncate text-sm font-medium text-ink-900">
                      {truncateText(query.queryTitle, 28)}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-ink-500">
                        {formatSourceLabel(query.sourceKey, sources)}
                      </span>
                      <span className={statusVariant.badgeClassName}>{query.status}</span>
                    </div>
                    <p className="mt-2 text-xs text-ink-400">
                      {formatConversationTimestamp(query.createdAt)}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-2 py-3 text-sm text-ink-500">还没有历史对话。</div>
        )}
      </div>

      <div className="border-t border-ink-300/35 px-3 py-3">
        <button
          className="inline-flex w-full items-center gap-2 rounded-[14px] px-3 py-2 text-sm font-medium text-ink-600 transition hover:bg-white hover:text-ink-900"
          type="button"
          onClick={onOpenSettings}
        >
          <Settings className="h-4 w-4" />
          <span>设置</span>
        </button>
      </div>
    </aside>
  );
}
