import type {
  CreateMaterialLineInput,
  MaterialLineCommandResult,
  MaterialLifecycleCommandInput,
  MobileCurrentUser,
  MobileFieldError,
  PatchMaterialLineInput,
  PatchWorkOrderBasicInfoInput,
  PatchWorkOrderBasicInfoResult,
  WorkOrderDetailCore,
  WorkOrderMaterialLine,
  WorkOrderMaterialPage,
  WorkOrderListPage,
} from "@/lib/apiTypes";
import { MobileApiError } from "@/lib/apiTypes";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const REQUEST_TIMEOUT_MS = 15_000;

type JsonObject = Record<string, unknown>;

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

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readError(body: unknown, status: number, correlationHeader: string | null): MobileApiError {
  const root = isJsonObject(body) ? body : {};
  const nested = isJsonObject(root.error) ? root.error : {};
  const code = String(nested.code ?? root.code ?? (status === 401 ? "AUTH_REQUIRED" : status === 403 ? "FORBIDDEN" : status === 404 ? "NOT_FOUND" : status >= 500 ? "INTERNAL_ERROR" : "NETWORK_ERROR"));
  const message = String(nested.message ?? root.message ?? "요청을 처리하지 못했습니다.");
  const correlationId = String(nested.correlationId ?? correlationHeader ?? "").trim() || null;
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
  return new MobileApiError({ code, message, status, correlationId, fieldErrors, entityVersion });
}

async function requestJson<T>(path: string, options: {
  readonly method: "GET" | "POST" | "PATCH";
  readonly body?: unknown;
  readonly idempotencyKey?: string;
}): Promise<T> {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new MobileApiError({ code: "API_ORIGIN_INVALID", message: "요청 경로가 올바르지 않습니다." });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
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

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) {
    throw new MobileApiError({
      code: "MALFORMED_RESPONSE",
      message: "서버 응답 형식이 올바르지 않습니다.",
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

export async function getCurrentMobileUser(): Promise<MobileCurrentUser> {
  const body = await requestJson<{ readonly authenticated: boolean; readonly user?: MobileCurrentUser }>("/api/auth/me", { method: "GET" });
  if (!body.authenticated || !body.user) throw new MobileApiError({ code: "AUTH_REQUIRED", message: "연결이 필요합니다.", status: 401 });
  return body.user;
}

export async function exchangeMobileConnectCode(code: string): Promise<void> {
  const body = await requestJson<{ readonly ok: boolean; readonly connected?: boolean }>("/api/dev/mobile-connect/exchange", { method: "POST", body: { code } });
  if (!body.ok || body.connected !== true) throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "연결 응답을 확인할 수 없습니다." });
}

export async function connectTailscaleDeveloper(): Promise<void> {
  const body = await requestJson<{ readonly ok: boolean; readonly connected?: boolean; readonly mode?: string }>(
    "/api/dev/mobile-connect/auto",
    { method: "POST" },
  );
  if (!body.ok || body.connected !== true || body.mode !== "tailscale-developer") {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "자동 연결 응답을 확인할 수 없습니다." });
  }
}

export async function disconnectMobileSession(): Promise<void> {
  const body = await requestJson<{ readonly ok: boolean; readonly disconnected?: boolean }>("/api/dev/mobile-connect/disconnect", { method: "POST" });
  if (!body.ok || body.disconnected !== true) throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "연결 해제 응답을 확인할 수 없습니다." });
}

export async function getWorkOrderList(): Promise<WorkOrderListPage> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: WorkOrderListPage }>("/api/v2/work-orders?limit=30", { method: "GET" });
  if (!body.ok || !body.data || !Array.isArray(body.data.items)) throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "제작 카드 목록 응답이 올바르지 않습니다." });
  return body.data;
}

export async function getWorkOrderDetail(workOrderId: string): Promise<WorkOrderDetailCore> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: WorkOrderDetailCore }>(`/api/v2/work-orders/${encodeURIComponent(workOrderId)}`, { method: "GET" });
  if (!body.ok || !body.data?.header) throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "제작 카드 상세 응답이 올바르지 않습니다." });
  return body.data;
}

const MATERIAL_STATUSES = new Set(["editing", "requested", "completed", "cancelled"]);
const DECIMAL_PATTERN = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;

function optionalString(value: unknown): string | null | undefined {
  if (value === null) return null;
  return typeof value === "string" ? value : undefined;
}

function normalizeMaterialLine(value: unknown): WorkOrderMaterialLine | null {
  if (!isJsonObject(value)) return null;
  const decimalFields = [
    value.requiredQuantity,
    value.allowanceQuantity,
    value.inventoryUsageQuantity,
    value.orderQuantity,
    value.unitPrice,
    value.amount,
  ];
  if (decimalFields.some((field) => typeof field !== "string" || !DECIMAL_PATTERN.test(field))) return null;
  if (
    typeof value.id !== "string"
    || value.materialType !== "fabric"
    || typeof value.name !== "string"
    || optionalString(value.colorOption) === undefined
    || optionalString(value.usageArea) === undefined
    || typeof value.unitCode !== "string"
    || typeof value.currency !== "string"
    || optionalString(value.memo) === undefined
    || typeof value.status !== "string"
    || !Number.isSafeInteger(value.displayOrder)
    || typeof value.locked !== "boolean"
    || (value.lifecycle !== "active" && value.lifecycle !== "archived")
    || !(value.archivedAt === null || typeof value.archivedAt === "string")
  ) return null;
  return {
    id: value.id,
    materialType: "fabric",
    name: value.name,
    colorOption: optionalString(value.colorOption) ?? null,
    usageArea: optionalString(value.usageArea) ?? null,
    requiredQuantity: value.requiredQuantity as string,
    allowanceQuantity: value.allowanceQuantity as string,
    inventoryUsageQuantity: value.inventoryUsageQuantity as string,
    orderQuantity: value.orderQuantity as string,
    unitCode: value.unitCode,
    currency: value.currency,
    unitPrice: value.unitPrice as string,
    amount: value.amount as string,
    memo: optionalString(value.memo) ?? null,
    status: MATERIAL_STATUSES.has(value.status) ? value.status as WorkOrderMaterialLine["status"] : "unknown",
    displayOrder: Number(value.displayOrder),
    locked: value.locked,
    lifecycle: value.lifecycle,
    archivedAt: value.archivedAt,
  };
}

export async function getWorkOrderMaterials(
  workOrderId: string,
  cursor: string | null = null,
  lifecycle: "active" | "archived" = "active",
): Promise<WorkOrderMaterialPage> {
  const query = new URLSearchParams({ type: "fabric", lifecycle, limit: "30" });
  if (cursor) query.set("cursor", cursor);
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/materials?${query.toString()}`,
    { method: "GET" },
  );
  if (!body.ok || !isJsonObject(body.data) || !Array.isArray(body.data.items)) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "원단 정보 응답이 올바르지 않습니다." });
  }
  const lines = body.data.items.map(normalizeMaterialLine);
  if (
    body.data.workOrderId !== workOrderId
    || body.data.materialType !== "fabric"
    || body.data.lifecycle !== lifecycle
    || lines.some((line) => line === null)
    || !(body.data.nextCursor === null || typeof body.data.nextCursor === "string")
    || typeof body.data.hasMore !== "boolean"
    || (body.data.hasMore && (typeof body.data.nextCursor !== "string" || body.data.nextCursor.length === 0))
    || (!body.data.hasMore && body.data.nextCursor !== null)
    || !Number.isSafeInteger(body.data.limit)
    || !Number.isSafeInteger(body.data.entityVersion)
    || !Number.isSafeInteger(body.data.totalCount)
  ) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "원단 정보 응답이 올바르지 않습니다." });
  }
  return {
    workOrderId,
    materialType: "fabric",
    lifecycle,
    items: lines as WorkOrderMaterialLine[],
    nextCursor: body.data.nextCursor as string | null,
    hasMore: body.data.hasMore,
    limit: Number(body.data.limit),
    entityVersion: Number(body.data.entityVersion),
    totalCount: Number(body.data.totalCount),
  };
}

function normalizeMaterialCommandResult(value: unknown, workOrderId: string): MaterialLineCommandResult | null {
  if (!isJsonObject(value) || !isJsonObject(value.result)) return null;
  const result = value.result;
  if (
    result.workOrderId !== workOrderId
    || typeof result.materialLineId !== "string"
    || result.materialType !== "fabric"
    || typeof result.status !== "string"
    || !MATERIAL_STATUSES.has(result.status)
    || !Number.isSafeInteger(result.nextVersion)
    || !Number.isSafeInteger(result.lineVersion)
    || (result.lifecycle !== "active" && result.lifecycle !== "archived")
    || !Number.isSafeInteger(value.nextVersion)
    || value.nextVersion !== result.nextVersion
    || Number(value.nextVersion) < 1
    || Number(result.lineVersion) < 1
  ) return null;
  return value as MaterialLineCommandResult;
}

async function transitionWorkOrderMaterialLifecycle(
  workOrderId: string,
  materialLineId: string,
  kind: "archive" | "restore",
  command: MaterialLifecycleCommandInput,
  idempotencyKey: string,
): Promise<MaterialLineCommandResult> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/materials/${encodeURIComponent(materialLineId)}/${kind}`,
    { method: "POST", body: command, idempotencyKey },
  );
  const normalized = body.ok ? normalizeMaterialCommandResult(body.data, workOrderId) : null;
  if (!normalized || normalized.result.materialLineId !== materialLineId || normalized.result.lifecycle !== (kind === "archive" ? "archived" : "active")) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "원단 상태 변경 응답이 올바르지 않습니다." });
  }
  return normalized;
}

export function archiveWorkOrderMaterial(
  workOrderId: string,
  materialLineId: string,
  command: MaterialLifecycleCommandInput,
  idempotencyKey: string,
) {
  return transitionWorkOrderMaterialLifecycle(workOrderId, materialLineId, "archive", command, idempotencyKey);
}

export function restoreWorkOrderMaterial(
  workOrderId: string,
  materialLineId: string,
  command: MaterialLifecycleCommandInput,
  idempotencyKey: string,
) {
  return transitionWorkOrderMaterialLifecycle(workOrderId, materialLineId, "restore", command, idempotencyKey);
}

export async function createWorkOrderMaterial(
  workOrderId: string,
  command: CreateMaterialLineInput,
  idempotencyKey: string,
): Promise<MaterialLineCommandResult> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/materials`,
    { method: "POST", body: command, idempotencyKey },
  );
  const normalized = body.ok ? normalizeMaterialCommandResult(body.data, workOrderId) : null;
  if (!normalized) throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "원단 저장 응답이 올바르지 않습니다." });
  return normalized;
}

export async function patchWorkOrderMaterial(
  workOrderId: string,
  materialLineId: string,
  command: PatchMaterialLineInput,
): Promise<MaterialLineCommandResult> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/materials/${encodeURIComponent(materialLineId)}`,
    { method: "PATCH", body: command },
  );
  const normalized = body.ok ? normalizeMaterialCommandResult(body.data, workOrderId) : null;
  if (!normalized || normalized.result.materialLineId !== materialLineId) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "원단 저장 응답이 올바르지 않습니다." });
  }
  return normalized;
}

export async function patchWorkOrderBasicInfo(
  workOrderId: string,
  command: PatchWorkOrderBasicInfoInput,
): Promise<PatchWorkOrderBasicInfoResult> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: PatchWorkOrderBasicInfoResult }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}`,
    { method: "PATCH", body: command },
  );
  if (
    !body.ok
    || !body.data?.result
    || !Number.isSafeInteger(body.data.nextVersion)
    || body.data.nextVersion < 1
  ) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "제작 카드 저장 응답이 올바르지 않습니다." });
  }
  return body.data;
}

export function assertMobileApiOrigin(): void {
  configuredOrigin();
}
