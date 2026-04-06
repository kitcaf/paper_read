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
