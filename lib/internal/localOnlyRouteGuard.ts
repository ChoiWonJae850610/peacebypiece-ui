import { headers } from "next/headers";
import { notFound } from "next/navigation";

const LOCAL_HOST_NAMES = new Set(["localhost", "127.0.0.1", "::1"]);

export function isLocalOnlyRouteHostAllowed(rawHost: string | null | undefined): boolean {
  if (!rawHost) return false;

  const host = rawHost.trim().split(",")[0]?.trim().toLowerCase();
  if (!host) return false;

  if (host.startsWith("[::1]")) {
    return host === "[::1]" || host.startsWith("[::1]:");
  }

  const hostName = host.split(":")[0];
  return LOCAL_HOST_NAMES.has(hostName);
}

export async function assertLocalOnlyRouteHost(): Promise<void> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (!isLocalOnlyRouteHostAllowed(host)) {
    notFound();
  }
}
