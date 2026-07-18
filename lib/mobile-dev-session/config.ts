import "server-only";

import {
  isLocalHost,
  isProductionEnvironment,
  normalizeRequestHost,
  readExternalQaServerConfig,
} from "@/lib/external-qa/configCore.mjs";

export type MobileDevSessionRuntimeConfig = {
  readonly runToken: string;
  readonly externalHostname: string;
};

export function getMobileDevSessionRuntimeConfig(): MobileDevSessionRuntimeConfig | null {
  if (isProductionEnvironment(process.env)) return null;
  const config = readExternalQaServerConfig(process.env);
  if (!config.enabled || config.production) return null;
  return { runToken: config.runToken, externalHostname: config.hostname };
}

export function isLocalMobileConnectRequest(request: Request): boolean {
  const host = normalizeRequestHost(request.headers.get("host"));
  return Boolean(host && isLocalHost(host));
}

export function isExternalMobileConnectRequest(
  request: Request,
  config: MobileDevSessionRuntimeConfig,
): boolean {
  return normalizeRequestHost(request.headers.get("host")) === config.externalHostname;
}
