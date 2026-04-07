import type { LocalMessageRecord, ScreeningResultsPage, SourceSummary } from "@paper-read/shared";

import type { WorkspaceConversationDetail } from "./workspaceTypes";
import { formatConversationTimestamp, formatSourceLabel } from "./presentation";

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
  conversation: WorkspaceConversationDetail,
  resultsPage: ScreeningResultsPage | null
): Pick<ConversationMessage, "title" | "body" | "variant"> {
  if (conversation.status === "failed") {
    return {
      title: "筛选失败",
      body: conversation.lastError ?? "这次筛选没有顺利完成，可以稍后重新刷新结果。",
      variant: "error"
    };
  }

  if (conversation.status === "completed") {
    const keepCount = resultsPage?.summary.keepCount ?? conversation.matchedPapers;

    return {
      title: "筛选完成",
      body: `已完成 ${conversation.processedPapers}/${conversation.totalPapers} 篇论文筛选，当前保留 ${keepCount} 篇候选论文。`,
      variant: "success"
    };
  }

  if (conversation.status === "queued") {
    return {
      title: "已开始",
      body: `请求已进入队列，准备读取 ${conversation.totalPapers || "当前源中的"}论文标题并启动首轮筛选。`,
      variant: "warning"
    };
  }

  return {
    title: "正在筛选",
    body: `已处理 ${conversation.processedPapers}/${conversation.totalPapers} 篇论文，当前保留 ${conversation.matchedPapers} 篇候选论文。`,
    variant: "default"
  };
}

function mapLocalMessageToConversationMessage(message: LocalMessageRecord): ConversationMessage | null {
  const timestamp = formatConversationTimestamp(message.createdAt);

  if (message.role === "user") {
    return {
      id: message.id,
      role: "user",
      body: message.content,
      meta: timestamp
    };
  }

  if (message.role === "assistant") {
    const modelLabel =
      typeof message.metadata.modelProfileName === "string"
        ? message.metadata.modelProfileName
        : typeof message.metadata.modelName === "string"
          ? message.metadata.modelName
          : undefined;

    return {
      id: message.id,
      role: "assistant",
      body: message.content,
      meta: modelLabel ? `${timestamp} · ${modelLabel}` : timestamp,
      variant: "default"
    };
  }

  const toolLabel =
    typeof message.metadata.tool === "string"
      ? message.metadata.tool
      : typeof message.metadata.step === "string"
        ? message.metadata.step
        : "tool";

  return {
    id: message.id,
    role: "assistant",
    title: "工具执行",
    body: message.content,
    meta: timestamp,
    chips: [
      {
        id: `${message.id}:tool`,
        label: toolLabel
      }
    ],
    variant: "default"
  };
}

function buildChatConversationMessages(
  conversation: WorkspaceConversationDetail
): ConversationMessage[] {
  const mappedMessages = conversation.messages
    .map(mapLocalMessageToConversationMessage)
    .filter((message): message is ConversationMessage => Boolean(message));

  if (mappedMessages.length) {
    return mappedMessages;
  }

  return [
    {
      id: `${conversation.id}:empty`,
      role: "assistant",
      body: "先发一条消息吧，我现在已经可以直接自由聊天了。",
      variant: "default"
    }
  ];
}

function buildScreeningConversationMessages(
  conversation: WorkspaceConversationDetail,
  resultsPage: ScreeningResultsPage | null,
  sources: SourceSummary[]
) {
  const sourceLabel = formatSourceLabel(conversation.sourceKey ?? "local", sources);
  const progressMessage = buildProgressMessage(conversation, resultsPage);

  return [
    {
      id: `${conversation.id}:user`,
      role: "user",
      body: conversation.queryText,
      meta: formatConversationTimestamp(conversation.createdAt),
      chips: [
        {
          id: `${conversation.id}:tool`,
          label: "筛选论文"
        },
        {
          id: `${conversation.id}:source`,
          label: sourceLabel
        }
      ]
    },
    {
      id: `${conversation.id}:started`,
      role: "assistant",
      title: "已开始",
      body: `正在从 ${sourceLabel} 中读取论文标题，并准备这次主题筛选。`,
      meta: formatConversationTimestamp(conversation.createdAt),
      variant: conversation.status === "failed" ? "warning" : "default"
    },
    {
      id: `${conversation.id}:intent`,
      role: "assistant",
      title: "意图分析",
      body:
        conversation.intentSummary ??
        "正在根据你的主题描述提取关注方向，并生成这一轮筛选判断依据。",
      chips:
        conversation.intentJson?.focusTerms.map((item) => ({
          id: `${conversation.id}:focus:${item}`,
          label: item
        })) ?? [],
      variant: "default"
    },
    {
      id: `${conversation.id}:progress`,
      role: "assistant",
      title: progressMessage.title,
      body: progressMessage.body,
      meta: conversation.completedAt
        ? formatConversationTimestamp(conversation.completedAt)
        : undefined,
      variant: progressMessage.variant
    }
  ] satisfies ConversationMessage[];
}

export function buildConversationMessages(
  conversation: WorkspaceConversationDetail,
  resultsPage: ScreeningResultsPage | null,
  sources: SourceSummary[]
) {
  if (conversation.mode === "chat") {
    return buildChatConversationMessages(conversation);
  }

  return buildScreeningConversationMessages(conversation, resultsPage, sources);
}
