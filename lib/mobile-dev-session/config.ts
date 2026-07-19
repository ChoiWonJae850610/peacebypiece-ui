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
  readonly tailscaleServeHostname: string | null;
  readonly developerAutoConnectEnabled: boolean;
  readonly developerLoginSha256: string | null;
  readonly developerSystemAdminEmailSha256: string | null;
};

export function getMobileDevSessionRuntimeConfig(): MobileDevSessionRuntimeConfig | null {
  if (isProductionEnvironment(process.env)) return null;
  const config = readExternalQaServerConfig(process.env);
  if (!config.enabled || config.production) return null;
  return {
    runToken: config.runToken,
    externalHostname: config.hostname,
    tailscaleServeHostname: config.tailscaleServe?.hostname ?? null,
    developerAutoConnectEnabled: config.developerAutoConnectEnabled === true,
    developerLoginSha256: config.tailscaleServe?.developerLoginSha256 ?? null,
    developerSystemAdminEmailSha256: config.tailscaleServe?.developerSystemAdminEmailSha256 ?? null,
  };
}

export function isLocalMobileConnectRequest(request: Request): boolean {
  const host = normalizeRequestHost(request.headers.get("host"));
  return Boolean(host && isLocalHost(host));
}

export function isExternalMobileConnectRequest(
  request: Request,
  config: MobileDevSessionRuntimeConfig,
): boolean {
  const host = normalizeRequestHost(request.headers.get("host"));
  return host === config.externalHostname || (Boolean(config.tailscaleServeHostname) && host === config.tailscaleServeHostname);
}

export function isTailscaleAutoConnectRequest(
  request: Request,
  config: MobileDevSessionRuntimeConfig,
): boolean {
  if (!config.developerAutoConnectEnabled || !config.tailscaleServeHostname || !config.developerLoginSha256) return false;
  if (process.env.WAFL_TAILSCALE_SERVE_BACKEND_LOOPBACK !== "true") return false;
  if (process.env.WAFL_TAILSCALE_FUNNEL_DISABLED !== "true") return false;
  return normalizeRequestHost(request.headers.get("host")) === config.tailscaleServeHostname;
}
