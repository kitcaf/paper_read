import type { LocalMessageRecord } from "@paper-read/shared";

import { generateWithStreamingFallback } from "./models/generate";
import type { ModelMessage, ModelRuntime } from "./models/types";

// 系统提示词
const CHAT_SYSTEM_PROMPT = [
  "You are PaperRead, a focused research agent for academic paper exploration.",
  "You can chat naturally, help users reason about research topics, and support paper-related workflows when the app provides tools and context.",
  "Answer clearly and directly. Keep a helpful, professional tone.",
  "Do not invent papers, downloads, or tool results that are not present in the conversation context."
].join(" ");

const MAX_HISTORY_MESSAGES = 12;

function toModelMessages(history: LocalMessageRecord[]): ModelMessage[] {
  const conversationalMessages = history
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-MAX_HISTORY_MESSAGES)
    .map<ModelMessage>((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content
    }));

  return [
    {
      role: "system",
      content: CHAT_SYSTEM_PROMPT
    },
    ...conversationalMessages
  ];
}

export interface ChatModelReply {
  content: string;
  metadata: {
    provider: string;
    modelName: string;
    usedStreamingFallback: boolean;
    streamingFallbackReason?: string;
  };
}

export async function generateChatReply(
  runtime: ModelRuntime,
  history: LocalMessageRecord[],
  options?: {
    onTextChunk?: (chunk: string) => void;
  }
): Promise<ChatModelReply> {
  const response = await generateWithStreamingFallback(runtime, {
    messages: toModelMessages(history),
    responseFormat: "text",
    stream: runtime.settings.stream,
    onTextChunk: options?.onTextChunk
  });

  const content = response.content.trim();
  if (!content) {
    throw new Error("模型返回了空回复。");
  }

  return {
    content,
    metadata: {
      provider: response.provider,
      modelName: response.modelName,
      usedStreamingFallback: response.usedStreamingFallback,
      ...(response.streamingFallbackReason
        ? { streamingFallbackReason: response.streamingFallbackReason }
        : {})
    }
  };
}
