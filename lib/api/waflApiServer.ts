import { NextResponse } from "next/server";

import type { WaflApiFailure, WaflApiSuccess } from "@/lib/api/waflApiTypes";

export type WaflJsonBodyResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse<WaflApiFailure> };

export function createWaflApiSuccess<T>(
  data: T,
  init?: number | ResponseInit,
): NextResponse<WaflApiSuccess<T>> {
  const responseInit = typeof init === "number" ? { status: init } : init;
  return NextResponse.json({ ok: true, data }, responseInit);
}

export function createWaflApiError(
  message: string,
  code: string,
  status: number,
): NextResponse<WaflApiFailure> {
  return NextResponse.json(
    { ok: false, code, message },
    { status },
  );
}

export function createWaflUnhandledApiError(
  error: unknown,
  fallbackMessage: string,
  code: string,
): NextResponse<WaflApiFailure> {
  console.error(`[${code}]`, error);
  return createWaflApiError(fallbackMessage, code, 500);
}

export async function readWaflJsonBody<T>(
  request: Request,
  options?: {
    invalidMessage?: string;
    invalidCode?: string;
  },
): Promise<WaflJsonBodyResult<T>> {
  try {
    const payload = (await request.json()) as unknown;
    if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
      return {
        ok: false,
        response: createWaflApiError(
          options?.invalidMessage || "요청 형식이 올바르지 않습니다.",
          options?.invalidCode || "INVALID_PAYLOAD",
          400,
        ),
      };
    }

    return { ok: true, data: payload as T };
  } catch {
    return {
      ok: false,
      response: createWaflApiError(
        options?.invalidMessage || "요청 형식이 올바르지 않습니다.",
        options?.invalidCode || "INVALID_PAYLOAD",
        400,
      ),
    };
  }
}
