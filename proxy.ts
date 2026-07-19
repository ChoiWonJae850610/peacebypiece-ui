import { NextRequest, NextResponse } from "next/server";

import {
  isExternalQaPathAllowed,
  isTailscaleServePathAllowed,
  isLocalHost,
  normalizeRequestHost,
  readExternalQaServerConfig,
} from "@/lib/external-qa/configCore.mjs";

const BLOCKED_HEADERS = {
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
} as const;

function blocked(status = 404) {
  return new NextResponse(null, { status, headers: BLOCKED_HEADERS });
}

export function proxy(request: NextRequest) {
  let qaConfig;
  try {
    qaConfig = readExternalQaServerConfig(process.env);
  } catch {
    return blocked(503);
  }
  if (!qaConfig.enabled) return NextResponse.next();

  // Each external transport is admitted only through the exact Host captured
  // by the runner. x-forwarded-host is intentionally not an authority input.
  const requestHost = normalizeRequestHost(request.headers.get("host"));
  if (!requestHost) return blocked();
  if (isLocalHost(requestHost)) return NextResponse.next();
  if (requestHost === qaConfig.hostname && qaConfig.hostAllowlist.has(requestHost)) {
    return isExternalQaPathAllowed(request.nextUrl.pathname, request.method, process.env)
      ? NextResponse.next()
      : blocked();
  }
  if (
    qaConfig.developerAutoConnectEnabled
    && qaConfig.tailscaleServe
    && requestHost === qaConfig.tailscaleServe.hostname
    && qaConfig.tailscaleServe.hostAllowlist.has(requestHost)
  ) {
    return isTailscaleServePathAllowed(request.nextUrl.pathname, request.method, process.env)
      ? NextResponse.next()
      : blocked();
  }
  return blocked();
}

export const config = { matcher: "/:path*" };
