import type { ModelGenerateRequest, ModelGenerateResponse, ModelRuntime } from "./types";
import { ModelProviderHttpError } from "./http";

export interface ModelGenerateWithFallbackResponse extends ModelGenerateResponse {
  usedStreamingFallback: boolean;
  streamingFallbackReason?: string;
}

export async function generateWithStreamingFallback(
  runtime: ModelRuntime,
  request: ModelGenerateRequest
): Promise<ModelGenerateWithFallbackResponse> {
  try {
    return {
      ...(await runtime.provider.generate(runtime.settings, request)),
      usedStreamingFallback: false
    };
  } catch (streamingError) {
    if (!request.stream) {
      throw streamingError;
    }

    if (streamingError instanceof ModelProviderHttpError && streamingError.status !== 400) {
      throw streamingError;
    }

    const fallbackRequest = {
      ...request,
      stream: false
    };

    try {
      return {
        ...(await runtime.provider.generate(runtime.settings, fallbackRequest)),
        usedStreamingFallback: true,
        streamingFallbackReason:
          streamingError instanceof Error ? streamingError.message : String(streamingError)
      };
    } catch (fallbackError) {
      throw new Error(
        `模型流式请求和非流式降级请求都失败。流式错误：${
          streamingError instanceof Error ? streamingError.message : String(streamingError)
        }；非流式错误：${
          fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        }`
      );
    }
  }
}
