import type { ModelGenerateRequest, ModelGenerateResponse, ModelRuntime } from "./types";

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
        `Streaming and non-streaming model calls failed. Streaming: ${
          streamingError instanceof Error ? streamingError.message : String(streamingError)
        }; Non-streaming: ${
          fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        }`
      );
    }
  }
}
