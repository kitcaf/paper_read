const HTTP_OK_MIN = 200;
const HTTP_OK_MAX = 299;

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

export async function ensureOkResponse(response: Response, providerName: string) {
  if (response.status >= HTTP_OK_MIN && response.status <= HTTP_OK_MAX) {
    return;
  }

  const responseBody = await response.text();
  throw new Error(
    `${providerName} request failed with HTTP ${response.status}: ${
      responseBody || response.statusText
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

export async function readSseJsonChunks(response: Response) {
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
        chunks.push(JSON.parse(data) as unknown);
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
    chunks.push(JSON.parse(remainingData) as unknown);
  }

  return chunks;
}

export async function readNdjsonChunks(response: Response) {
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

      chunks.push(JSON.parse(trimmedLine) as unknown);
    }
  }

  const remainingLine = buffer.trim();
  if (remainingLine) {
    chunks.push(JSON.parse(remainingLine) as unknown);
  }

  return chunks;
}
