import type { ScreeningDecision, ScreeningQueryStatus, SourceSummary } from "@paper-read/shared";

type VisualVariant = {
  badgeClassName: string;
  ringClassName: string;
};

const queryStatusVariants: Record<ScreeningQueryStatus, VisualVariant> = {
  queued: {
    badgeClassName: "status-chip bg-amber-500/12 text-amber-500",
    ringClassName: "border-amber-500/30 bg-amber-500/8 text-amber-500"
  },
  running: {
    badgeClassName: "status-chip bg-sky-500/12 text-sky-500",
    ringClassName: "border-sky-500/30 bg-sky-500/8 text-sky-500"
  },
  completed: {
    badgeClassName: "status-chip bg-mint-500/12 text-mint-500",
    ringClassName: "border-mint-500/30 bg-mint-500/8 text-mint-500"
  },
  failed: {
    badgeClassName: "status-chip bg-coral-500/12 text-coral-500",
    ringClassName: "border-coral-500/30 bg-coral-500/8 text-coral-500"
  }
};

const decisionVariants: Record<ScreeningDecision, VisualVariant> = {
  keep: {
    badgeClassName: "status-chip bg-mint-500/12 text-mint-500",
    ringClassName: "border-mint-500/30 bg-mint-500/8 text-mint-500"
  },
  discard: {
    badgeClassName: "status-chip bg-coral-500/12 text-coral-500",
    ringClassName: "border-coral-500/30 bg-coral-500/8 text-coral-500"
  },
  uncertain: {
    badgeClassName: "status-chip bg-amber-500/12 text-amber-500",
    ringClassName: "border-amber-500/30 bg-amber-500/8 text-amber-500"
  }
};

export function getQueryStatusVariant(status: ScreeningQueryStatus) {
  return queryStatusVariants[status];
}

export function getDecisionVariant(decision: ScreeningDecision) {
  return decisionVariants[decision];
}

export function formatSourceLabel(sourceKey: string, sources?: SourceSummary[]) {
  const matchedSource = sources?.find((source) => source.sourceKey === sourceKey);
  return matchedSource?.label ?? sourceKey.toUpperCase();
}

export function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
}

export function formatConversationTimestamp(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  return isSameDay
    ? date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      })
    : date.toLocaleDateString([], {
        month: "short",
        day: "numeric"
      });
}
