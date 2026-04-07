const HTTP_OK_MIN = 200;
const HTTP_OK_MAX = 299;
const AUTHENTICATION_STATUS_CODES = new Set([401, 403]);
const ERROR_PREVIEW_MAX_LENGTH = 260;

export class ModelProviderHttpError extends Error {
  readonly status: number;
  readonly providerName: string;

  constructor(providerName: string, status: number, message: string) {
    super(message);
    this.name = "ModelProviderHttpError";
    this.providerName = providerName;
    this.status = status;
  }
}

export function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/u, "");
}

export async function readJsonResponse(response: Response) {
  const responseText = await response.text();

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch (error) {
    throw new Error(
      `Model provider returned non-JSON response: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

function readProviderErrorMessage(responseBody: string) {
  if (!responseBody.trim()) {
    return "";
  }

  try {
    const parsedBody = JSON.parse(responseBody) as unknown;
    if (!parsedBody || typeof parsedBody !== "object") {
      return responseBody;
    }

    const errorPayload = "error" in parsedBody ? parsedBody.error : parsedBody;
    if (!errorPayload || typeof errorPayload !== "object") {
      return responseBody;
    }

    const message = "message" in errorPayload ? errorPayload.message : undefined;
    const code = "code" in errorPayload ? errorPayload.code : undefined;

    return [
      typeof message === "string" ? message : "",
      typeof code === "string" && code ? `Code: ${code}` : ""
    ]
      .filter(Boolean)
      .join(" ");
  } catch {
    return responseBody;
  }
}

function sanitizeProviderErrorMessage(value: string) {
  return value
    .replace(/api key:\s*[^,\s"]+/giu, "api key: [redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gu, "Bearer [redacted]")
    .replace(/sk-[A-Za-z0-9._-]+/gu, "sk-[redacted]")
    .slice(0, ERROR_PREVIEW_MAX_LENGTH);
}

export async function ensureOkResponse(response: Response, providerName: string) {
  if (response.status >= HTTP_OK_MIN && response.status <= HTTP_OK_MAX) {
    return;
  }

  const responseBody = await response.text();
  if (AUTHENTICATION_STATUS_CODES.has(response.status)) {
    throw new ModelProviderHttpError(
      providerName,
      response.status,
      `${providerName} authentication failed (HTTP ${response.status}). 请检查 API Key、Base URL 和模型名称。`
    );
  }

  const providerMessage = sanitizeProviderErrorMessage(
    readProviderErrorMessage(responseBody) || response.statusText
  );
  throw new ModelProviderHttpError(
    providerName,
    response.status,
    `${providerName} request failed with HTTP ${response.status}${
      providerMessage ? `: ${providerMessage}` : "."
    }`
  );
}

function parseSseBlock(block: string) {
  return block
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trim())
    .join("\n")
    .trim();
}

export async function readSseJsonChunks(
  response: Response,
  onChunk?: (chunk: unknown) => void
) {
  if (!response.body) {
    throw new Error("Streaming response did not include a readable body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks: unknown[] = [];
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split(/\r?\n\r?\n/u);
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const data = parseSseBlock(block);
      if (!data) {
        continue;
      }

      if (data === "[DONE]") {
        return chunks;
      }

      try {
        const parsedChunk = JSON.parse(data) as unknown;
        chunks.push(parsedChunk);
        onChunk?.(parsedChunk);
      } catch (error) {
        throw new Error(
          `Failed to parse model streaming chunk: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }
  }

  const remainingData = parseSseBlock(buffer);
  if (remainingData && remainingData !== "[DONE]") {
    const parsedChunk = JSON.parse(remainingData) as unknown;
    chunks.push(parsedChunk);
    onChunk?.(parsedChunk);
  }

  return chunks;
}

export async function readNdjsonChunks(
  response: Response,
  onChunk?: (chunk: unknown) => void
) {
  if (!response.body) {
    throw new Error("Streaming response did not include a readable body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const chunks: unknown[] = [];
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/u);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        continue;
      }

      const parsedChunk = JSON.parse(trimmedLine) as unknown;
      chunks.push(parsedChunk);
      onChunk?.(parsedChunk);
    }
  }

  const remainingLine = buffer.trim();
  if (remainingLine) {
    const parsedChunk = JSON.parse(remainingLine) as unknown;
    chunks.push(parsedChunk);
    onChunk?.(parsedChunk);
  }

  return chunks;
}
