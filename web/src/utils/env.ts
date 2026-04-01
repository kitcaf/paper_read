interface WebConfig {
  appName: string;
  backendBaseUrl: string;
}

let cachedConfig: WebConfig | undefined;

export function getWebConfig(): WebConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = {
    appName: "paper-read",
    backendBaseUrl: import.meta.env.VITE_BACKEND_BASE_URL ?? "http://localhost:3000"
  };

  return cachedConfig;
}
