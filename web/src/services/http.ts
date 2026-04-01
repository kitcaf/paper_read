import { getWebConfig } from "../utils/env";

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getWebConfig().backendBaseUrl}${normalizedPath}`;
}
