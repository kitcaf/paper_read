import type {
  ModelProviderKind,
  ModelProviderSettings,
  ModelResponseFormat
} from "@paper-read/shared";

export type ModelMessageRole = "system" | "user" | "assistant";

export interface ModelMessage {
  role: ModelMessageRole;
  content: string;
}

export interface ModelGenerateRequest {
  messages: ModelMessage[];
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: ModelResponseFormat;
  stream?: boolean;
  onTextChunk?: (chunk: string) => void;
}

export interface ModelGenerateResponse {
  content: string;
  provider: ModelProviderKind;
  modelName: string;
  raw?: unknown;
}

export interface ModelProvider {
  kind: ModelProviderKind;
  generate: (
    settings: RequiredModelProviderSettings,
    request: ModelGenerateRequest
  ) => Promise<ModelGenerateResponse>;
}

export interface RequiredModelProviderSettings extends ModelProviderSettings {
  provider: ModelProviderKind;
  modelName: string;
  temperature: number;
  maxTokens: number;
  responseFormat: ModelResponseFormat;
  stream: boolean;
}

export interface ModelRuntime {
  settings: RequiredModelProviderSettings;
  provider: ModelProvider;
}
