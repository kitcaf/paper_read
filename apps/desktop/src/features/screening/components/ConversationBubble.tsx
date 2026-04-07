import { memo } from "react";
import type { ConversationMessage } from "../conversation";
import { MessageMarkdown } from "./MessageMarkdown";

type VariantTone = "default" | "success" | "warning" | "error";

const assistantVariants: Record<VariantTone, string> = {
  default: "bg-transparent text-ink-800",
  success: "rounded-[24px] border border-mint-500/18 bg-mint-500/[0.08] px-5 py-4 text-ink-800",
  warning:
    "rounded-[24px] border border-amber-500/18 bg-amber-500/[0.08] px-5 py-4 text-ink-800",
  error:
    "rounded-[24px] border border-coral-500/18 bg-coral-500/[0.08] px-5 py-4 text-ink-800"
};

function ConversationBubbleInner({ message }: { message: ConversationMessage }) {
  const variant = message.variant ?? "default";

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[820px] rounded-[28px] bg-paper-100/92 px-5 py-3.5 text-sm leading-8 text-ink-900">
          {message.chips?.length ? (
            <div className="mb-2.5 flex flex-wrap gap-2">
              {message.chips.map((chip) => (
                <span
                  key={chip.id}
                  className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[0.72rem] font-medium text-ink-500"
                >
                  {chip.label}
                </span>
              ))}
            </div>
          ) : null}

          <p className="whitespace-pre-wrap break-words">{message.body}</p>
        </div>
      </div>
    );
  }

  if (message.pending) {
    return (
      <div className="max-w-[860px] py-1">
        <div className="inline-flex items-center gap-2 text-sm text-ink-500">
          <span>正在思考</span>
          <span className="inline-flex gap-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-300 [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-300 [animation-delay:180ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-300 [animation-delay:360ms]" />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[860px]">
      <div className={assistantVariants[variant]}>
        {message.title ? (
          <p className="mb-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ink-500/85">
            {message.title}
          </p>
        ) : null}

        <div className="relative">
          <MessageMarkdown
            content={message.body}
            animate={message.animate}
            streaming={message.streaming}
          />
          {message.streaming ? (
            <span className="ml-1 inline-block h-5 w-0.5 animate-pulse rounded-full bg-ink-400/70 align-middle" />
          ) : null}
        </div>

        {message.chips?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {message.chips.map((chip) => (
              <span
                key={chip.id}
                className="rounded-full border border-ink-300/35 bg-paper-50 px-3 py-1 text-[0.72rem] font-medium text-ink-700"
              >
                {chip.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function areConversationBubblesEqual(
  previousProps: { message: ConversationMessage },
  nextProps: { message: ConversationMessage }
) {
  const previousMessage = previousProps.message;
  const nextMessage = nextProps.message;
  const previousChips = previousMessage.chips ?? [];
  const nextChips = nextMessage.chips ?? [];

  if (previousChips.length !== nextChips.length) {
    return false;
  }

  for (let index = 0; index < previousChips.length; index += 1) {
    if (
      previousChips[index]?.id !== nextChips[index]?.id ||
      previousChips[index]?.label !== nextChips[index]?.label
    ) {
      return false;
    }
  }

  return (
    previousMessage.id === nextMessage.id &&
    previousMessage.role === nextMessage.role &&
    previousMessage.title === nextMessage.title &&
    previousMessage.body === nextMessage.body &&
    previousMessage.variant === nextMessage.variant &&
    previousMessage.animate === nextMessage.animate &&
    previousMessage.pending === nextMessage.pending &&
    previousMessage.streaming === nextMessage.streaming
  );
}

export const ConversationBubble = memo(
  ConversationBubbleInner,
  areConversationBubblesEqual
);
