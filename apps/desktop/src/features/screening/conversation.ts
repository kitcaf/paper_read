import type {
  ScreeningQueryDetail,
  ScreeningResultsPage,
  SourceSummary
} from "@paper-read/shared";

import {
  formatConversationTimestamp,
  formatSourceLabel
} from "./presentation";

type ConversationRole = "assistant" | "user";
type ConversationVariant = "default" | "success" | "warning" | "error";

export interface ConversationChip {
  id: string;
  label: string;
}

export interface ConversationMessage {
  id: string;
  role: ConversationRole;
  title?: string;
  body: string;
  meta?: string;
  chips?: ConversationChip[];
  variant?: ConversationVariant;
}

function buildProgressMessage(
  query: ScreeningQueryDetail,
  resultsPage: ScreeningResultsPage | null
): Pick<ConversationMessage, "title" | "body" | "variant"> {
  if (query.status === "failed") {
    return {
      title: "筛选失败",
      body: query.lastError ?? "这次筛选没有顺利完成，可以稍后重新刷新结果。",
      variant: "error"
    };
  }

  if (query.status === "completed") {
    const keepCount = resultsPage?.summary.keepCount ?? query.matchedPapers;

    return {
      title: "筛选完成",
      body: `已完成 ${query.processedPapers}/${query.totalPapers} 篇论文筛选，当前保留 ${keepCount} 篇候选论文。`,
      variant: "success"
    };
  }

  if (query.status === "queued") {
    return {
      title: "已开始",
      body: `请求已进入队列，准备读取 ${query.totalPapers || "当前源中的"}论文标题并启动首轮筛选。`,
      variant: "warning"
    };
  }

  return {
    title: "正在筛选",
    body: `已处理 ${query.processedPapers}/${query.totalPapers} 篇论文，当前保留 ${query.matchedPapers} 篇候选论文。`,
    variant: "default"
  };
}

export function buildConversationMessages(
  query: ScreeningQueryDetail,
  resultsPage: ScreeningResultsPage | null,
  sources: SourceSummary[]
) {
  const sourceLabel = formatSourceLabel(query.sourceKey, sources);
  const progressMessage = buildProgressMessage(query, resultsPage);

  return [
    {
      id: `${query.id}:user`,
      role: "user",
      body: query.queryText,
      meta: formatConversationTimestamp(query.createdAt),
      chips: [
        {
          id: `${query.id}:tool`,
          label: "筛选论文"
        },
        {
          id: `${query.id}:source`,
          label: sourceLabel
        }
      ]
    },
    {
      id: `${query.id}:started`,
      role: "assistant",
      title: "已开始",
      body: `正在从 ${sourceLabel} 中读取论文标题，并准备这次主题筛选。`,
      meta: formatConversationTimestamp(query.createdAt),
      variant: query.status === "failed" ? "warning" : "default"
    },
    {
      id: `${query.id}:intent`,
      role: "assistant",
      title: "意图分析",
      body:
        query.intentSummary ??
        "正在根据你的主题描述提取关注方向，并生成这一轮筛选判断依据。",
      chips:
        query.intentJson?.focusTerms.map((item) => ({
          id: `${query.id}:focus:${item}`,
          label: item
        })) ?? [],
      variant: "default"
    },
    {
      id: `${query.id}:progress`,
      role: "assistant",
      title: progressMessage.title,
      body: progressMessage.body,
      meta:
        query.completedAt ? formatConversationTimestamp(query.completedAt) : undefined,
      variant: progressMessage.variant
    }
  ] satisfies ConversationMessage[];
}
