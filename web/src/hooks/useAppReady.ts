import { getWebConfig } from "../utils/env";

export function useAppReady() {
  return getWebConfig();
}
