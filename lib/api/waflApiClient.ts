import { WaflApiError, type WaflApiFailure } from "@/lib/api/waflApiTypes";

type LegacyApiErrorPayload = Partial<WaflApiFailure> & {
  error?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readFailureMessage(payload: unknown, fallbackMessage: string): string {
  if (!isRecord(payload)) return fallbackMessage;

  for (const key of ["message", "error", "code"] as const) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return fallbackMessage;
}

function readFailureCode(payload: unknown): string | undefined {
  if (!isRecord(payload)) return undefined;
  const value = payload.code ?? payload.error;
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

async function readOptionalJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new WaflApiError({
      message: "서버 응답을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      code: "INVALID_JSON_RESPONSE",
      status: response.status || 500,
    });
  }
}

export async function readWaflApiResponse<T>(
  response: Response,
  fallbackMessage = "요청을 처리하지 못했습니다.",
): Promise<T> {
  const payload = await readOptionalJson(response);

  if (!response.ok) {
    throw new WaflApiError({
      message: readFailureMessage(payload, fallbackMessage),
      code: readFailureCode(payload),
      status: response.status,
    });
  }

  if (!isRecord(payload)) {
    throw new WaflApiError({
      message: fallbackMessage,
      code: "EMPTY_API_RESPONSE",
      status: response.status || 500,
    });
  }

  if (payload.ok === false) {
    const failure = payload as LegacyApiErrorPayload;
    throw new WaflApiError({
      message: readFailureMessage(failure, fallbackMessage),
      code: readFailureCode(failure),
      status: response.status || 500,
    });
  }

  if (payload.ok !== true || !("data" in payload)) {
    throw new WaflApiError({
      message: fallbackMessage,
      code: "INVALID_API_ENVELOPE",
      status: response.status || 500,
    });
  }

  return (payload as { ok: true; data: T }).data;
}


export async function readWaflLegacyApiResponse<T>(
  response: Response,
  fallbackMessage = "요청을 처리하지 못했습니다.",
): Promise<T> {
  const payload = await readOptionalJson(response);

  if (!response.ok || payload === null) {
    throw new WaflApiError({
      message: readFailureMessage(payload, fallbackMessage),
      code: readFailureCode(payload),
      status: response.status || 500,
    });
  }

  return payload as T;
}

export async function waflApiRequest<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallbackMessage?: string,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(input, init);
  } catch {
    throw new WaflApiError({
      message: fallbackMessage || "네트워크 연결을 확인해 주세요.",
      code: "NETWORK_ERROR",
      status: 0,
    });
  }

  return readWaflApiResponse<T>(response, fallbackMessage);
}

export async function waflLegacyApiRequest<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallbackMessage?: string,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(input, init);
  } catch {
    throw new WaflApiError({
      message: fallbackMessage || "네트워크 연결을 확인해 주세요.",
      code: "NETWORK_ERROR",
      status: 0,
    });
  }

  return readWaflLegacyApiResponse<T>(response, fallbackMessage);
}
