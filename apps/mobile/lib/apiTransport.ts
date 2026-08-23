import { classifyMobileApiErrorCode, MobileApiError, type MobileFieldError } from "@/domain/mobileContract";
import { classifyNonJsonHttpResponse } from "@/domain/mobileHttpResponse";
import { isJsonObject } from "./apiResponseNormalizer";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_REQUEST_TIMEOUT_MS = 120_000;

export type MobileJsonRequestOptions = {
  readonly method: "GET" | "POST" | "PATCH" | "DELETE";
  readonly body?: unknown;
  readonly idempotencyKey?: string;
  readonly timeoutMs?: number;
};

function mobileRequestMetricKind(path: string, method: string) {
  if (path.startsWith("/api/v2/address-search?")) return "address-search";
  if (path.endsWith("/size-spec/commands")) return "measurement-command";
  if (path.endsWith("/size-spec/templates")) return "measurement-templates-get";
  if (path.endsWith("/size-spec")) return "measurement-get";
  if (path.includes("/size-color/selection-batch")) return "selection-batch-command";
  if (path.includes("/size-color/quantities/")) return "quantity-command";
  if (path.includes("/size-color/sizes")) return "size-command";
  if (path.includes("/size-color/colors")) return "color-command";
  if (path.endsWith("/size-color")) return "size-color-get";
  if (path.includes("/materials/") && method === "PATCH") return "material-patch";
  if (path.endsWith("/materials") && method === "POST") return "material-create";
  if (path.includes("/materials")) return "materials-get";
  if (/\/work-orders\/[^/]+$/u.test(path) && method === "PATCH") return "overview-patch";
  if (/\/work-orders\/[^/]+$/u.test(path) && method === "GET") return "detail-get";
  return "other";
}

function configuredOrigin(): string {
  const autoConnect = process.env.EXPO_PUBLIC_WAFL_DEVELOPER_AUTO_CONNECT?.trim().toLowerCase() === "true";
  const raw = process.env.EXPO_PUBLIC_WAFL_API_BASE_URL?.trim()
    || (!autoConnect ? process.env.EXPO_PUBLIC_WAFL_WEB_BASE_URL?.trim() : "");
  const externalQa = process.env.EXPO_PUBLIC_WAFL_EXTERNAL_QA?.trim().toLowerCase() === "true";
  if (!raw) throw new MobileApiError({ code: "API_ORIGIN_INVALID", message: "개발용 연결 주소가 설정되지 않았습니다." });

  try {
    const url = new URL(raw);
    const production = process.env.NODE_ENV === "production";
    const isLocal = LOCAL_HOSTS.has(url.hostname);
    const isQuickTunnel = url.hostname.endsWith(".trycloudflare.com");
    const isTailscaleServe = url.hostname.endsWith(".ts.net");
    if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error("origin-only");
    if (externalQa && (url.protocol !== "https:" || isLocal)) throw new Error("external-https-required");
    if (autoConnect && (url.protocol !== "https:" || !isTailscaleServe || isQuickTunnel)) throw new Error("tailscale-serve-origin-required");
    if (production && (isLocal || isQuickTunnel || isTailscaleServe)) throw new Error("temporary-origin-forbidden");
    if (!new Set(["http:", "https:"]).has(url.protocol)) throw new Error("protocol");
    return url.origin;
  } catch {
    throw new MobileApiError({ code: "API_ORIGIN_INVALID", message: "개발용 연결 주소가 올바르지 않습니다." });
  }
}

function readError(body: unknown, status: number, correlationHeader: string | null): MobileApiError {
  const root = isJsonObject(body) ? body : {};
  const nested = isJsonObject(root.error) ? root.error : {};
  const rawCode = String(nested.code ?? root.code ?? (status === 401 ? "AUTH_REQUIRED" : status === 403 ? "FORBIDDEN" : status === 404 ? "NOT_FOUND" : status >= 500 ? "INTERNAL_ERROR" : "NETWORK_ERROR"));
  const identity = classifyMobileApiErrorCode(rawCode);
  const fieldErrors = Array.isArray(nested.fieldErrors)
    ? nested.fieldErrors.filter(isJsonObject).map((fieldError): MobileFieldError => ({
      field: String(fieldError.field ?? ""),
      code: String(fieldError.code ?? "VALIDATION_ERROR"),
      message: String(fieldError.message ?? "입력값을 확인해 주세요."),
    })).filter((fieldError) => fieldError.field.length > 0)
    : [];
  const entityVersion = Number.isSafeInteger(nested.entityVersion) && Number(nested.entityVersion) >= 1
    ? Number(nested.entityVersion)
    : null;
  return new MobileApiError({
    code: identity.code,
    codeKind: identity.kind,
    rawCode: identity.rawCode,
    message: String(nested.message ?? root.message ?? "요청을 처리하지 못했습니다."),
    status,
    correlationId: String(nested.correlationId ?? correlationHeader ?? "").trim() || null,
    fieldErrors,
    entityVersion,
  });
}

export async function requestJson<T>(path: string, options: MobileJsonRequestOptions): Promise<T> {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new MobileApiError({ code: "API_ORIGIN_INVALID", message: "요청 경로가 올바르지 않습니다." });
  }
  const controller = new AbortController();
  const timeoutMs = Number.isSafeInteger(options.timeoutMs)
    ? Math.min(MAX_REQUEST_TIMEOUT_MS, Math.max(REQUEST_TIMEOUT_MS, Number(options.timeoutMs)))
    : REQUEST_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const requestStartedAt = Date.now();
  let response: Response;
  try {
    response = await fetch(`${configuredOrigin()}${path}`, {
      method: options.method,
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-store",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new MobileApiError({ code: "TIMEOUT", message: "요청 시간이 초과되었습니다." });
    }
    throw new MobileApiError({ code: "NETWORK_ERROR", message: "연결 상태를 확인한 뒤 다시 시도하세요." });
  } finally {
    clearTimeout(timeout);
  }

  if (process.env.EXPO_PUBLIC_WAFL_EXTERNAL_QA?.trim().toLowerCase() === "true") {
    const requestBody = isJsonObject(options.body) ? options.body : null;
    const patchBody = requestBody && isJsonObject(requestBody.patch) ? requestBody.patch : null;
    console.info("[WAFL_MOBILE_REQUEST_METRIC]", {
      requestKind: mobileRequestMetricKind(path, options.method),
      method: options.method,
      status: response.status,
      elapsedMs: Date.now() - requestStartedAt,
      payloadFields: patchBody ? Object.keys(patchBody).sort() : [],
      correlationPresent: Boolean(response.headers.get("x-wafl-correlation-id")),
      routeMs: response.headers.get("x-wafl-timing-route-ms"),
      guardMs: response.headers.get("x-wafl-timing-guard-ms"),
      productMs: response.headers.get("x-wafl-timing-product-ms"),
      statementCount: response.headers.get("x-wafl-command-statement-count"),
      dbMs: response.headers.get("x-wafl-command-db-ms") ?? response.headers.get("x-wafl-detail-db-ms"),
    });
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) {
    const classified = classifyNonJsonHttpResponse(response.status);
    throw new MobileApiError({
      code: classified.code,
      message: classified.message,
      status: response.status,
      correlationId: response.headers.get("x-wafl-correlation-id"),
    });
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "서버 응답을 읽을 수 없습니다.", status: response.status });
  }
  if (!response.ok) throw readError(body, response.status, response.headers.get("x-wafl-correlation-id"));
  return body as T;
}

export function resolveMobileApiUrl(path: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  return `${configuredOrigin()}${path}`;
}

export function assertMobileApiOrigin(): void {
  configuredOrigin();
}
