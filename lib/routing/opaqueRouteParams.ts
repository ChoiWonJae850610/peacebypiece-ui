import "server-only";

import { createWaflNotFoundResponse } from "@/lib/auth/apiRouteGuards";

const OPAQUE_WORKORDER_ID_PATTERN =
  /^(?:wo[_-][A-Za-z0-9_-]{8,64}|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}|wafl-fn-company-[a-j]-workorder-\d{5})$/i;

export type OpaqueRouteParamResult =
  | { ok: true; value: string }
  | { ok: false; response: ReturnType<typeof createWaflNotFoundResponse> };

export function validateOpaqueWorkOrderRouteParam(
  value: string | null | undefined,
): OpaqueRouteParamResult {
  const normalized = String(value ?? "").trim();
  if (!normalized || !OPAQUE_WORKORDER_ID_PATTERN.test(normalized)) {
    return { ok: false, response: createWaflNotFoundResponse() };
  }

  return { ok: true, value: normalized };
}
