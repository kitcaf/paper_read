import type {
  ScreeningResultsPage,
  SourceSummary
} from "@paper-read/shared";

import { buildConversationMessages } from "../conversation";
import type { WorkspaceConversationDetail } from "../workspaceTypes";
import { ConversationBubble } from "./ConversationBubble";

interface QueryStatusPanelProps {
  conversation: WorkspaceConversationDetail | null;
  resultsPage: ScreeningResultsPage | null;
  sources: SourceSummary[];
  isRefreshing: boolean;
  onRefresh: () => Promise<void> | void;
}

export function QueryStatusPanel({
  conversation,
  resultsPage,
  sources,
  isRefreshing,
  onRefresh
}: QueryStatusPanelProps) {
  if (!conversation) {
    return (
      <section className="mx-auto flex h-full w-full max-w-[980px] flex-col justify-end px-4 py-8 md:px-6">
        <div className="flex items-end gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/75 bg-paper-100 text-xs font-semibold uppercase tracking-[0.18em] text-ink-700 shadow-[0_10px_18px_rgba(24,37,47,0.06)]">
            AI
          </div>
          <div className="max-w-[760px] rounded-[22px] border border-ink-300/40 bg-white px-5 py-4 text-sm leading-7 text-ink-700 shadow-[0_10px_24px_rgba(24,37,47,0.05)]">
            现在可以直接自由聊天；如果你想启动论文研究流程，再点击下方的“筛选论文”工具。
          </div>
        </div>
      </section>
    );
  }

  const messages = buildConversationMessages(conversation, resultsPage, sources);

  return (
    <section className="mx-auto w-full max-w-[980px] px-4 py-6 md:px-6">
      <div className="mb-5 flex justify-end">
        <button
          className="inline-flex items-center justify-center rounded-full border border-ink-300/40 bg-white/72 px-3 py-1.5 text-xs font-medium text-ink-500 transition hover:border-ink-300/60 hover:bg-white hover:text-ink-900"
          type="button"
          onClick={() => void onRefresh()}
        >
          {isRefreshing ? "同步中..." : "刷新"}
        </button>
      </div>

      <div className="space-y-5">
        {messages.map((message) => (
          <ConversationBubble key={message.id} message={message} />
        ))}

        {conversation.lastError ? (
          <div className="ml-[52px] max-w-[780px] rounded-[20px] border border-coral-500/20 bg-coral-500/8 px-5 py-4 text-sm leading-7 text-coral-500">
            {conversation.lastError}
          </div>
        ) : null}
      </div>
    </section>
  );
}
