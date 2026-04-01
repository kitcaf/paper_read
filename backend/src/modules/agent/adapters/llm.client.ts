export interface CompletionRequest {
  prompt: string;
}

export class LlmClient {
  async complete(request: CompletionRequest) {
    return {
      rawText: `placeholder-response:${request.prompt.slice(0, 40)}`
    };
  }
}
