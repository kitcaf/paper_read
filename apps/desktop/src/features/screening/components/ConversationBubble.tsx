import type { ConversationMessage } from "../conversation";
import { Bot, Sparkles, UserRound } from "lucide-react";

type VariantTone = "default" | "success" | "warning" | "error";

const assistantVariants: Record<VariantTone, string> = {
  default: "border border-ink-300/35 bg-white/92 text-ink-800 shadow-[0_10px_24px_rgba(24,37,47,0.06)]",
  success:
    "border border-mint-500/18 bg-mint-500/[0.08] text-ink-800 shadow-[0_10px_24px_rgba(24,37,47,0.04)]",
  warning:
    "border border-amber-500/18 bg-amber-500/[0.08] text-ink-800 shadow-[0_10px_24px_rgba(24,37,47,0.04)]",
  error:
    "border border-coral-500/18 bg-coral-500/[0.08] text-ink-800 shadow-[0_10px_24px_rgba(24,37,47,0.04)]"
};

function AssistantAvatar({ variant }: { variant: VariantTone }) {
  const className =
    variant === "success"
      ? "bg-mint-500/14 text-mint-500"
      : variant === "warning"
        ? "bg-amber-500/14 text-amber-500"
        : variant === "error"
          ? "bg-coral-500/14 text-coral-500"
          : "bg-paper-100 text-ink-700";

  return (
    <div
      className={[
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/75 shadow-[0_10px_18px_rgba(24,37,47,0.06)]",
        className
      ].join(" ")}
    >
      {variant === "default" ? <Bot className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
    </div>
  );
}

export function ConversationBubble({ message }: { message: ConversationMessage }) {
  const variant = message.variant ?? "default";

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="flex max-w-[760px] items-end gap-3">
          <div className="min-w-0 rounded-[24px] bg-ink-900 px-5 py-4 text-paper-50 shadow-[0_16px_36px_rgba(24,37,47,0.18)]">
            {message.chips?.length ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {message.chips.map((chip) => (
                  <span
                    key={chip.id}
                    className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[0.7rem] font-medium text-paper-50/84"
                  >
                    {chip.label}
                  </span>
                ))}
              </div>
            ) : null}

            <p className="text-sm leading-7 text-paper-50/94">{message.body}</p>
            {message.meta ? (
              <p className="mt-3 text-right text-[0.72rem] uppercase tracking-[0.14em] text-paper-50/44">
                {message.meta}
              </p>
            ) : null}
          </div>

          <div className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink-300/35 bg-white/92 text-ink-700 shadow-[0_10px_18px_rgba(24,37,47,0.06)]">
            <UserRound className="h-4 w-4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <AssistantAvatar variant={variant} />

      <div
        className={[
          "min-w-0 max-w-[780px] rounded-[24px] px-5 py-4",
          assistantVariants[variant]
        ].join(" ")}
      >
        {message.title ? (
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ink-500">
            {message.title}
          </p>
        ) : null}

        <p
          className={
            message.title ? "mt-2 text-sm leading-7 text-ink-800" : "text-sm leading-7 text-ink-800"
          }
        >
          {message.body}
        </p>

        {message.chips?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.chips.map((chip) => (
              <span
                key={chip.id}
                className="rounded-full border border-ink-300/40 bg-paper-50 px-3 py-1 text-[0.72rem] font-medium text-ink-700"
              >
                {chip.label}
              </span>
            ))}
          </div>
        ) : null}

        {message.meta ? (
          <p className="mt-3 text-[0.72rem] uppercase tracking-[0.14em] text-ink-400">
            {message.meta}
          </p>
        ) : null}
      </div>
    </div>
  );
}
