import "server-only";

import { NextResponse } from "next/server";

export function createSignupMutationForbiddenResponse(code = "SIGNUP_ORIGIN_FORBIDDEN"): NextResponse {
  return NextResponse.json(
    { ok: false, code },
    { status: 403, headers: { "Cache-Control": "no-store" } },
  );
}

export function isSameOriginSignupMutation(request: Request): boolean {
  const origin = request.headers.get("origin")?.trim();
  if (!origin) return true;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function assertSignupRateLimitExtensionPoint(): void {
  // Public signup abuse controls will plug in here before launch.
}
