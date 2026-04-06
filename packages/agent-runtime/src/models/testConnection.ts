import type { ModelProfileTestResult } from "@paper-read/shared";

import { generateWithStreamingFallback } from "./generate";
import type { ModelRuntime } from "./types";

const CONNECTION_TEST_MAX_TOKENS = 16;
const CONNECTION_TEST_PROMPT = "Reply with OK.";

export async function testModelConnection(
  runtime: ModelRuntime
): Promise<ModelProfileTestResult> {
  const startedAt = performance.now();

  try {
    const response = await generateWithStreamingFallback(runtime, {
      messages: [
        {
          role: "system",
          content:
            "You are checking whether a model API connection works. Reply with a short OK."
        },
        {
          role: "user",
          content: CONNECTION_TEST_PROMPT
        }
      ],
      temperature: 0,
      maxTokens: CONNECTION_TEST_MAX_TOKENS,
      responseFormat: "text",
      stream: runtime.settings.stream
    });

    return {
      ok: true,
      provider: runtime.provider.kind,
      modelName: response.modelName,
      latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
      message: response.usedStreamingFallback
        ? "连接成功。流式接口不可用，已自动降级到非流式请求。"
        : "连接成功。"
    };
  } catch (error) {
    return {
      ok: false,
      provider: runtime.provider.kind,
      modelName: runtime.settings.modelName,
      latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
      message: error instanceof Error ? error.message : "模型连接测试失败。"
    };
  }
}
