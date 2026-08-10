import type {
  CreateMaterialLineInput,
  MaterialLineCommandResult,
  MaterialLifecycleCommandInput,
  MaterialOrderCommandInput,
  MaterialOrderCommandKind,
  MaterialType,
  MobileCurrentUser,
  MobileFieldError,
  PatchMaterialLineInput,
  PatchWorkOrderBasicInfoInput,
  PatchWorkOrderBasicInfoResult,
  WorkOrderDetailCore,
  WorkOrderImageAsset,
  WorkOrderImageCommandResult,
  WorkOrderImagePage,
  WorkOrderImageUploadTarget,
  WorkOrderMaterialLine,
  WorkOrderMaterialPage,
  WorkOrderListPage,
  WorkOrderListStatusFilter,
  WorkOrderSizeColorMatrix,
  WorkOrderSizeRow,
  WorkOrderSizeSpec,
  SizeColorStructureCommandBase,
  SizeColorStructureCommandResult,
} from "@/domain/mobileContract";
import { classifyMobileApiErrorCode, MobileApiError } from "@/domain/mobileContract";
import { classifyNonJsonHttpResponse } from "@/domain/mobileHttpResponse";
import {
  isJsonObject,
  normalizeMaterialCommandResult,
  normalizeMaterialLine,
} from "./apiResponseNormalizer";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const REQUEST_TIMEOUT_MS = 15_000;

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
  return new MobileApiError({
    code: identity.code,
    codeKind: identity.kind,
    rawCode: identity.rawCode,
    message,
    status,
    correlationId,
    fieldErrors,
    entityVersion,
  });
}

async function requestJson<T>(path: string, options: {
  readonly method: "GET" | "POST" | "PATCH" | "DELETE";
  readonly body?: unknown;
  readonly idempotencyKey?: string;
}): Promise<T> {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new MobileApiError({ code: "API_ORIGIN_INVALID", message: "요청 경로가 올바르지 않습니다." });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
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
    const requestKind = options.method === "PATCH"
      ? (path.includes("/materials/") ? "material-patch" : "overview-patch")
      : path.includes("/materials") ? "materials-get" : path.includes("/work-orders/") ? "detail-get" : "other";
    const requestBody = isJsonObject(options.body) ? options.body : null;
    const patchBody = requestBody && isJsonObject(requestBody.patch) ? requestBody.patch : null;
    console.info("[WAFL_MOBILE_REQUEST_METRIC]", {
      requestKind,
      method: options.method,
      status: response.status,
      elapsedMs: Date.now() - requestStartedAt,
      payloadFields: patchBody ? Object.keys(patchBody).sort() : [],
      statementCount: response.headers.get("x-wafl-command-statement-count"),
      dbMs: response.headers.get("x-wafl-command-db-ms"),
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

const NON_NEGATIVE_DECIMAL_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
const COLOR_HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0;
}

function isDecimalString(value: unknown): value is string {
  return typeof value === "string" && NON_NEGATIVE_DECIMAL_PATTERN.test(value);
}

function normalizeSizeRows(value: unknown): readonly WorkOrderSizeRow[] | null {
  if (!Array.isArray(value)) return null;
  const rows: WorkOrderSizeRow[] = [];
  const ids = new Set<string>();
  const codes = new Set<string>();
  for (const candidate of value) {
    if (
      !isJsonObject(candidate)
      || !isNonEmptyString(candidate.id)
      || !isNonEmptyString(candidate.code)
      || !isNonEmptyString(candidate.displayLabel)
      || !isNonNegativeSafeInteger(candidate.displayOrder)
      || ids.has(candidate.id)
      || codes.has(candidate.code)
    ) return null;
    ids.add(candidate.id);
    codes.add(candidate.code);
    rows.push({
      id: candidate.id,
      code: candidate.code,
      displayLabel: candidate.displayLabel,
      displayOrder: candidate.displayOrder,
    });
  }
  return rows;
}

function malformedSizeColorResponse(): never {
  throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "사이즈·색상 응답이 올바르지 않습니다." });
}

function malformedSizeSpecResponse(): never {
  throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "완성 치수 응답이 올바르지 않습니다." });
}

function normalizeWorkOrderSizeColor(workOrderId: string, value: unknown): WorkOrderSizeColorMatrix {
  if (
    !isJsonObject(value)
    || value.workOrderId !== workOrderId
    || !isNonEmptyString(value.revisionId)
    || !isNonNegativeSafeInteger(value.entityVersion)
    || !isDecimalString(value.matrixTotal)
    || !isDecimalString(value.expectedTotal)
    || !isDecimalString(value.workOrderTotal)
    || !isDecimalString(value.revisionTotal)
    || typeof value.projectionsMatch !== "boolean"
    || typeof value.totalsMatch !== "boolean"
    || !isNullableString(value.memoFallback)
  ) return malformedSizeColorResponse();

  const sizes = normalizeSizeRows(value.sizes);
  if (!sizes || !Array.isArray(value.colors) || !Array.isArray(value.quantityCells)) return malformedSizeColorResponse();
  const sizeIds = new Set(sizes.map((row) => row.id));
  const colorIds = new Set<string>();
  const colors = [];
  for (const candidate of value.colors) {
    if (
      !isJsonObject(candidate)
      || !isNonEmptyString(candidate.id)
      || !isNonEmptyString(candidate.displayName)
      || !(candidate.hexValue === null || (typeof candidate.hexValue === "string" && COLOR_HEX_PATTERN.test(candidate.hexValue)))
      || !isNonNegativeSafeInteger(candidate.displayOrder)
      || colorIds.has(candidate.id)
    ) return malformedSizeColorResponse();
    colorIds.add(candidate.id);
    colors.push({
      id: candidate.id,
      displayName: candidate.displayName,
      hexValue: candidate.hexValue,
      displayOrder: candidate.displayOrder,
    });
  }

  const quantityCells = [];
  const cellKeys = new Set<string>();
  for (const candidate of value.quantityCells) {
    if (
      !isJsonObject(candidate)
      || !isNonEmptyString(candidate.colorId)
      || !isNonEmptyString(candidate.sizeRowId)
      || !isDecimalString(candidate.quantity)
      || !colorIds.has(candidate.colorId)
      || !sizeIds.has(candidate.sizeRowId)
    ) return malformedSizeColorResponse();
    const key = `${candidate.colorId}:${candidate.sizeRowId}`;
    if (cellKeys.has(key)) return malformedSizeColorResponse();
    cellKeys.add(key);
    quantityCells.push({
      colorId: candidate.colorId,
      sizeRowId: candidate.sizeRowId,
      quantity: candidate.quantity,
    });
  }
  const computedTotal = quantityCells.reduce((sum, cell) => sum + Number(cell.quantity), 0);
  if (computedTotal !== Number(value.matrixTotal)) return malformedSizeColorResponse();
  const projectionsMatch = Number(value.matrixTotal) === Number(value.workOrderTotal)
    && Number(value.matrixTotal) === Number(value.revisionTotal);
  if (value.projectionsMatch !== projectionsMatch || value.totalsMatch !== projectionsMatch) return malformedSizeColorResponse();
  return {
    workOrderId,
    revisionId: value.revisionId,
    sizes,
    colors,
    quantityCells,
    matrixTotal: value.matrixTotal,
    expectedTotal: value.expectedTotal,
    workOrderTotal: value.workOrderTotal,
    revisionTotal: value.revisionTotal,
    projectionsMatch: value.projectionsMatch,
    totalsMatch: value.totalsMatch,
    memoFallback: value.memoFallback,
    entityVersion: value.entityVersion,
  };
}

function normalizeWorkOrderSizeSpec(workOrderId: string, value: unknown): WorkOrderSizeSpec {
  if (
    !isJsonObject(value)
    || value.workOrderId !== workOrderId
    || !isNonEmptyString(value.revisionId)
    || !isNonNegativeSafeInteger(value.entityVersion)
    || !(value.measurementUnit === "cm" || value.measurementUnit === "inch")
    || !isNullableString(value.genderCode)
    || !isNullableString(value.categoryCode)
    || !isNullableString(value.templateId)
  ) return malformedSizeSpecResponse();

  const sizes = normalizeSizeRows(value.sizes);
  if (!sizes || !Array.isArray(value.pomColumns) || !Array.isArray(value.cells)) return malformedSizeSpecResponse();
  const sizeIds = new Set(sizes.map((row) => row.id));
  const pomIds = new Set<string>();
  const pomCodes = new Set<string>();
  const pomColumns = [];
  for (const candidate of value.pomColumns) {
    if (
      !isJsonObject(candidate)
      || !isNonEmptyString(candidate.id)
      || !isNonEmptyString(candidate.code)
      || !isNonEmptyString(candidate.displayName)
      || !isNonNegativeSafeInteger(candidate.displayOrder)
      || pomIds.has(candidate.id)
      || pomCodes.has(candidate.code)
    ) return malformedSizeSpecResponse();
    pomIds.add(candidate.id);
    pomCodes.add(candidate.code);
    pomColumns.push({
      id: candidate.id,
      code: candidate.code,
      displayName: candidate.displayName,
      displayOrder: candidate.displayOrder,
    });
  }

  const cells = [];
  const cellKeys = new Set<string>();
  for (const candidate of value.cells) {
    if (
      !isJsonObject(candidate)
      || !isNonEmptyString(candidate.sizeRowId)
      || !isNonEmptyString(candidate.pomColumnId)
      || !isNullableString(candidate.displayValue)
      || !(candidate.decimalValue === null || isDecimalString(candidate.decimalValue))
      || !sizeIds.has(candidate.sizeRowId)
      || !pomIds.has(candidate.pomColumnId)
    ) return malformedSizeSpecResponse();
    const key = `${candidate.pomColumnId}:${candidate.sizeRowId}`;
    if (cellKeys.has(key)) return malformedSizeSpecResponse();
    cellKeys.add(key);
    cells.push({
      sizeRowId: candidate.sizeRowId,
      pomColumnId: candidate.pomColumnId,
      displayValue: candidate.displayValue,
      decimalValue: candidate.decimalValue,
    });
  }
  return {
    workOrderId,
    revisionId: value.revisionId,
    genderCode: value.genderCode,
    categoryCode: value.categoryCode,
    measurementUnit: value.measurementUnit,
    templateId: value.templateId,
    sizes,
    pomColumns,
    cells,
    entityVersion: value.entityVersion,
  };
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

export async function getWorkOrderList(input: {
  readonly query?: string;
  readonly status?: WorkOrderListStatusFilter;
  readonly cursor?: string | null;
} = {}): Promise<WorkOrderListPage> {
  const query = new URLSearchParams({ limit: "30" });
  if (input.query?.trim()) query.set("q", input.query.trim());
  if (input.status && input.status !== "all") query.set("status", input.status);
  if (input.cursor) query.set("cursor", input.cursor);
  const body = await requestJson<{ readonly ok: boolean; readonly data?: WorkOrderListPage }>(`/api/v2/work-orders?${query.toString()}`, { method: "GET" });
  if (!body.ok || !body.data || !Array.isArray(body.data.items)) throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "제작 카드 목록 응답이 올바르지 않습니다." });
  return body.data;
}

export async function getWorkOrderDetail(workOrderId: string): Promise<WorkOrderDetailCore> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: WorkOrderDetailCore }>(`/api/v2/work-orders/${encodeURIComponent(workOrderId)}`, { method: "GET" });
  if (!body.ok || !body.data?.header) throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "제작 카드 상세 응답이 올바르지 않습니다." });
  return body.data;
}

export async function getWorkOrderSizeColor(workOrderId: string): Promise<WorkOrderSizeColorMatrix> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/size-color`,
    { method: "GET" },
  );
  if (!body.ok) return malformedSizeColorResponse();
  return normalizeWorkOrderSizeColor(workOrderId, body.data);
}

export async function getWorkOrderSizeSpec(workOrderId: string): Promise<WorkOrderSizeSpec> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/size-spec`,
    { method: "GET" },
  );
  if (!body.ok) return malformedSizeSpecResponse();
  return normalizeWorkOrderSizeSpec(workOrderId, body.data);
}

async function mutateSizeColorStructure(
  workOrderId: string,
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  command: SizeColorStructureCommandBase & Readonly<Record<string, unknown>>,
  idempotencyKey: string,
): Promise<SizeColorStructureCommandResult> {
  const body = await requestJson<{
    readonly ok: boolean;
    readonly data?: { readonly result?: SizeColorStructureCommandResult; readonly nextVersion?: number };
  }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/size-color/${path}`,
    { method, body: command, idempotencyKey },
  );
  const result = body.data?.result;
  if (
    !body.ok
    || !result
    || result.workOrderId !== workOrderId
    || !isNonEmptyString(result.revisionId)
    || !(result.targetKind === "size" || result.targetKind === "color" || result.targetKind === "quantity")
    || (result.targetKind === "quantity" && !isNonNegativeSafeInteger(result.totalQuantity))
    || ((result.targetKind === "size" || result.targetKind === "color") && result.totalQuantity !== undefined && !isNonNegativeSafeInteger(result.totalQuantity))
    || (result.deletedQuantityCellCount !== undefined && !isNonNegativeSafeInteger(result.deletedQuantityCellCount))
    || (result.removedQuantity !== undefined && !isNonNegativeSafeInteger(result.removedQuantity))
    || !(result.targetId === null || isNonEmptyString(result.targetId))
    || !Number.isSafeInteger(result.nextVersion)
    || result.nextVersion < 1
    || body.data?.nextVersion !== result.nextVersion
  ) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "사이즈·색상 변경 응답이 올바르지 않습니다." });
  }
  return result;
}

export function addWorkOrderSize(
  workOrderId: string,
  command: SizeColorStructureCommandBase & { readonly displayLabel: string },
  idempotencyKey: string,
) {
  return mutateSizeColorStructure(workOrderId, "sizes", "POST", command, idempotencyKey);
}

export function renameWorkOrderSize(
  workOrderId: string,
  sizeRowId: string,
  command: SizeColorStructureCommandBase & { readonly displayLabel: string },
  idempotencyKey: string,
) {
  return mutateSizeColorStructure(workOrderId, `sizes/${encodeURIComponent(sizeRowId)}`, "PATCH", command, idempotencyKey);
}

export function deleteWorkOrderSize(
  workOrderId: string,
  sizeRowId: string,
  command: SizeColorStructureCommandBase,
  idempotencyKey: string,
) {
  return mutateSizeColorStructure(workOrderId, `sizes/${encodeURIComponent(sizeRowId)}`, "DELETE", command, idempotencyKey);
}

export function reorderWorkOrderSizes(
  workOrderId: string,
  command: SizeColorStructureCommandBase & { readonly orderedSizeRowIds: readonly string[] },
  idempotencyKey: string,
) {
  return mutateSizeColorStructure(workOrderId, "sizes/reorder", "POST", command, idempotencyKey);
}

export function addWorkOrderColor(
  workOrderId: string,
  command: SizeColorStructureCommandBase & { readonly displayName: string; readonly hexValue: string | null },
  idempotencyKey: string,
) {
  return mutateSizeColorStructure(workOrderId, "colors", "POST", command, idempotencyKey);
}

export function patchWorkOrderColor(
  workOrderId: string,
  colorId: string,
  command: SizeColorStructureCommandBase & {
    readonly patch: { readonly displayName?: string; readonly hexValue?: string | null };
  },
  idempotencyKey: string,
) {
  return mutateSizeColorStructure(workOrderId, `colors/${encodeURIComponent(colorId)}`, "PATCH", command, idempotencyKey);
}

export function deleteWorkOrderColor(
  workOrderId: string,
  colorId: string,
  command: SizeColorStructureCommandBase,
  idempotencyKey: string,
) {
  return mutateSizeColorStructure(workOrderId, `colors/${encodeURIComponent(colorId)}`, "DELETE", command, idempotencyKey);
}

export function reorderWorkOrderColors(
  workOrderId: string,
  command: SizeColorStructureCommandBase & { readonly orderedColorIds: readonly string[] },
  idempotencyKey: string,
) {
  return mutateSizeColorStructure(workOrderId, "colors/reorder", "POST", command, idempotencyKey);
}

export function upsertWorkOrderColorSizeQuantity(
  workOrderId: string,
  colorId: string,
  sizeRowId: string,
  command: SizeColorStructureCommandBase & { readonly quantity: number },
  idempotencyKey: string,
) {
  return mutateSizeColorStructure(
    workOrderId,
    `quantities/${encodeURIComponent(colorId)}/${encodeURIComponent(sizeRowId)}`,
    "PATCH",
    command,
    idempotencyKey,
  );
}

export function resolveMobileApiUrl(path: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  return `${configuredOrigin()}${path}`;
}

export async function getWorkOrderImages(workOrderId: string): Promise<WorkOrderImagePage> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/assets?limit=50`,
    { method: "GET" },
  );
  if (!body.ok || !isJsonObject(body.data) || !Array.isArray(body.data.items)) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "작업지시서 이미지 응답이 올바르지 않습니다." });
  }
  const images = body.data.items.filter(isJsonObject).filter((item) => item.assetType === "image");
  const attachments = body.data.items.filter(isJsonObject).filter((item) => item.assetType === "attachment");
  const valid = images.every((item) => (
    typeof item.id === "string"
    && typeof item.filename === "string"
    && typeof item.mimeType === "string"
    && Number.isSafeInteger(item.sizeBytes)
    && Number.isSafeInteger(item.displayOrder)
    && typeof item.isRepresentative === "boolean"
    && (item.thumbnailUrl === null || typeof item.thumbnailUrl === "string")
    && (item.previewUrl === null || typeof item.previewUrl === "string")
    && (item.fullscreenUrl === null || typeof item.fullscreenUrl === "string")
    && (item.originalUrl === null || typeof item.originalUrl === "string")
    && (item.viewUrl === null || typeof item.viewUrl === "string")
    && typeof item.uploadedAt === "string"
  ));
  if (
    !valid
    || !attachments.every((item) => (
      typeof item.id === "string"
      && typeof item.filename === "string"
      && typeof item.mimeType === "string"
      && Number.isSafeInteger(item.sizeBytes)
      && Number.isSafeInteger(item.displayOrder)
      && typeof item.includeInDocument === "boolean"
      && (item.viewUrl === null || typeof item.viewUrl === "string")
      && typeof item.uploadedAt === "string"
    ))
    || body.data.workOrderId !== workOrderId
    || typeof body.data.revisionId !== "string"
    || !Number.isSafeInteger(body.data.entityVersion)
  ) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "작업지시서 이미지 응답이 올바르지 않습니다." });
  }
  return {
    workOrderId,
    revisionId: body.data.revisionId,
    items: images.map((item): WorkOrderImageAsset => ({
      assetType: "image",
      id: String(item.id),
      filename: String(item.filename),
      optionalTitle: typeof item.optionalTitle === "string" ? item.optionalTitle : null,
      mimeType: String(item.mimeType),
      sizeBytes: Number(item.sizeBytes),
      displayOrder: Number(item.displayOrder),
      isRepresentative: item.isRepresentative === true,
      state: "active",
      thumbnailUrl: typeof item.thumbnailUrl === "string" ? item.thumbnailUrl : null,
      previewUrl: typeof item.previewUrl === "string" ? item.previewUrl : null,
      fullscreenUrl: typeof item.fullscreenUrl === "string" ? item.fullscreenUrl : null,
      originalUrl: typeof item.originalUrl === "string" ? item.originalUrl : null,
      viewUrl: typeof item.viewUrl === "string" ? item.viewUrl : null,
      uploadedAt: String(item.uploadedAt),
    })),
    attachments: attachments.map((item) => ({
      assetType: "attachment",
      id: String(item.id),
      filename: String(item.filename),
      mimeType: String(item.mimeType),
      sizeBytes: Number(item.sizeBytes),
      displayOrder: Number(item.displayOrder),
      includeInDocument: item.includeInDocument === true,
      state: "active",
      viewUrl: typeof item.viewUrl === "string" ? item.viewUrl : null,
      uploadedAt: String(item.uploadedAt),
    })),
    nextCursor: null,
    hasMore: body.data.hasMore === true,
    limit: Number(body.data.limit ?? 100),
    entityVersion: Number(body.data.entityVersion),
  };
}

export async function prepareWorkOrderImageUpload(
  workOrderId: string,
  file: { readonly name: string; readonly type: string; readonly size: number },
): Promise<WorkOrderImageUploadTarget> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/images/upload`,
    { method: "POST", body: { file } },
  );
  const data = isJsonObject(body.data) ? body.data : null;
  const target = data && isJsonObject(data.uploadTarget) ? data.uploadTarget : null;
  if (
    !body.ok
    || !target
    || typeof target.storageKey !== "string"
    || typeof target.fileName !== "string"
    || typeof target.contentType !== "string"
    || !Number.isSafeInteger(target.fileSize)
    || typeof target.uploadUrl !== "string"
    || target.method !== "PUT"
    || !isJsonObject(target.headers)
  ) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "이미지 업로드 준비 응답이 올바르지 않습니다." });
  }
  return {
    storageKey: target.storageKey,
    fileName: target.fileName,
    contentType: target.contentType,
    fileSize: Number(target.fileSize),
    uploadUrl: target.uploadUrl,
    method: "PUT",
    headers: Object.fromEntries(Object.entries(target.headers).map(([key, value]) => [key, String(value)])),
    expiresInSeconds: Number(target.expiresInSeconds ?? 0),
  };
}

export async function putWorkOrderImageBlob(target: WorkOrderImageUploadTarget, blob: Blob): Promise<void> {
  let response: Response;
  try {
    const uploadUrl = resolveMobileApiUrl(target.uploadUrl);
    if (!uploadUrl) throw new Error("UPLOAD_URL_INVALID");
    response = await fetch(uploadUrl, {
      method: target.method,
      headers: { ...target.headers },
      body: blob,
    });
  } catch {
    throw new MobileApiError({ code: "NETWORK_ERROR", message: "이미지 파일을 전송하지 못했습니다." });
  }
  if (!response.ok) {
    throw new MobileApiError({ code: "NETWORK_ERROR", message: `이미지 파일 전송에 실패했습니다. (${response.status})`, status: response.status });
  }
}

export async function prepareWorkOrderAttachmentUpload(
  workOrderId: string,
  file: { readonly name: string; readonly type: string; readonly size: number },
): Promise<WorkOrderImageUploadTarget> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/attachments/upload`,
    { method: "POST", body: { file } },
  );
  const data = isJsonObject(body.data) ? body.data : null;
  const target = data && isJsonObject(data.uploadTarget) ? data.uploadTarget : null;
  if (
    !body.ok
    || !target
    || typeof target.storageKey !== "string"
    || typeof target.fileName !== "string"
    || typeof target.contentType !== "string"
    || !Number.isSafeInteger(target.fileSize)
    || typeof target.uploadUrl !== "string"
    || target.method !== "PUT"
    || !isJsonObject(target.headers)
  ) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "첨부 업로드 준비 응답이 올바르지 않습니다." });
  }
  return {
    storageKey: target.storageKey,
    fileName: target.fileName,
    contentType: target.contentType,
    fileSize: Number(target.fileSize),
    uploadUrl: target.uploadUrl,
    method: "PUT",
    headers: Object.fromEntries(Object.entries(target.headers).map(([key, value]) => [key, String(value)])),
    expiresInSeconds: Number(target.expiresInSeconds ?? 0),
  };
}

export async function completeWorkOrderAttachmentUpload(
  workOrderId: string,
  input: {
    readonly expectedVersion: number;
    readonly clientRequestId: string;
    readonly idempotencyKey: string;
    readonly uploadTarget: WorkOrderImageUploadTarget;
  },
): Promise<import("../domain/mobileContract").WorkOrderAttachmentCommandResult> {
  const body = await requestJson<{
    readonly ok: boolean;
    readonly data?: import("../domain/mobileContract").WorkOrderAttachmentCommandResult;
  }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/attachments/upload/complete`,
    {
      method: "POST",
      idempotencyKey: input.idempotencyKey,
      body: {
        expectedVersion: input.expectedVersion,
        clientRequestId: input.clientRequestId,
        uploadTarget: input.uploadTarget,
      },
    },
  );
  if (!body.ok || !body.data || body.data.workOrderId !== workOrderId || !Number.isSafeInteger(body.data.nextVersion)) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "첨부 업로드 완료 응답이 올바르지 않습니다." });
  }
  return body.data;
}

export async function deleteWorkOrderAttachment(
  workOrderId: string,
  attachmentId: string,
  input: { readonly expectedVersion: number; readonly clientRequestId: string; readonly idempotencyKey: string },
): Promise<import("../domain/mobileContract").WorkOrderAttachmentCommandResult> {
  const body = await requestJson<{
    readonly ok: boolean;
    readonly data?: import("../domain/mobileContract").WorkOrderAttachmentCommandResult;
  }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/attachments/${encodeURIComponent(attachmentId)}/delete`,
    {
      method: "POST",
      idempotencyKey: input.idempotencyKey,
      body: { expectedVersion: input.expectedVersion, clientRequestId: input.clientRequestId },
    },
  );
  if (
    !body.ok
    || !body.data
    || body.data.workOrderId !== workOrderId
    || body.data.attachmentId !== attachmentId
    || !Number.isSafeInteger(body.data.nextVersion)
  ) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "첨부 삭제 응답이 올바르지 않습니다." });
  }
  return body.data;
}

export async function issueWorkOrderAttachmentPreview(
  workOrderId: string,
  attachmentId: string,
): Promise<{ readonly previewUrl: string; readonly expiresAt: string; readonly expiresInSeconds: number }> {
  const body = await requestJson<{
    readonly ok: boolean;
    readonly data?: {
      readonly previewUrl?: unknown;
      readonly expiresAt?: unknown;
      readonly expiresInSeconds?: unknown;
    };
  }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/attachments/${encodeURIComponent(attachmentId)}/preview`,
    { method: "POST" },
  );
  if (
    !body.ok
    || typeof body.data?.previewUrl !== "string"
    || !body.data.previewUrl.startsWith("/api/v2/work-orders/attachments/preview?token=")
    || typeof body.data.expiresAt !== "string"
    || !Number.isSafeInteger(body.data.expiresInSeconds)
  ) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "첨부파일 미리보기 응답이 올바르지 않습니다." });
  }
  return {
    previewUrl: body.data.previewUrl,
    expiresAt: body.data.expiresAt,
    expiresInSeconds: Number(body.data.expiresInSeconds),
  };
}

export async function completeWorkOrderImageUpload(
  workOrderId: string,
  input: {
    readonly expectedVersion: number;
    readonly clientRequestId: string;
    readonly idempotencyKey: string;
    readonly uploadTarget: WorkOrderImageUploadTarget;
  },
): Promise<WorkOrderImageCommandResult> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: WorkOrderImageCommandResult }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/images/upload/complete`,
    {
      method: "POST",
      idempotencyKey: input.idempotencyKey,
      body: {
        expectedVersion: input.expectedVersion,
        clientRequestId: input.clientRequestId,
        uploadTarget: input.uploadTarget,
      },
    },
  );
  if (!body.ok || !body.data || body.data.workOrderId !== workOrderId || !Number.isSafeInteger(body.data.nextVersion)) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "이미지 업로드 완료 응답이 올바르지 않습니다." });
  }
  return body.data;
}

async function mutateWorkOrderImage(
  workOrderId: string,
  imageId: string,
  kind: "representative" | "delete",
  input: { readonly expectedVersion: number; readonly clientRequestId: string; readonly idempotencyKey: string },
): Promise<WorkOrderImageCommandResult> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: WorkOrderImageCommandResult }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/images/${encodeURIComponent(imageId)}/${kind}`,
    {
      method: "POST",
      idempotencyKey: input.idempotencyKey,
      body: { expectedVersion: input.expectedVersion, clientRequestId: input.clientRequestId },
    },
  );
  if (!body.ok || !body.data || body.data.workOrderId !== workOrderId || body.data.imageId !== imageId || !Number.isSafeInteger(body.data.nextVersion)) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "이미지 변경 응답이 올바르지 않습니다." });
  }
  return body.data;
}

export function setRepresentativeWorkOrderImage(
  workOrderId: string,
  imageId: string,
  input: { readonly expectedVersion: number; readonly clientRequestId: string; readonly idempotencyKey: string },
) {
  return mutateWorkOrderImage(workOrderId, imageId, "representative", input);
}

export function deleteWorkOrderImage(
  workOrderId: string,
  imageId: string,
  input: { readonly expectedVersion: number; readonly clientRequestId: string; readonly idempotencyKey: string },
) {
  return mutateWorkOrderImage(workOrderId, imageId, "delete", input);
}

export async function getWorkOrderMaterials(
  workOrderId: string,
  materialType: MaterialType,
  cursor: string | null = null,
  lifecycle: "active" | "archived" = "active",
): Promise<WorkOrderMaterialPage> {
  const query = new URLSearchParams({ type: materialType, lifecycle, limit: "30" });
  if (cursor) query.set("cursor", cursor);
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/materials?${query.toString()}`,
    { method: "GET" },
  );
  if (!body.ok || !isJsonObject(body.data) || !Array.isArray(body.data.items)) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "자재 정보 응답이 올바르지 않습니다." });
  }
  const lines = body.data.items.map(normalizeMaterialLine);
  if (
    body.data.workOrderId !== workOrderId
    || body.data.materialType !== materialType
    || body.data.lifecycle !== lifecycle
    || lines.some((line) => line === null)
    || lines.some((line) => line?.materialType !== materialType)
    || !(body.data.nextCursor === null || typeof body.data.nextCursor === "string")
    || typeof body.data.hasMore !== "boolean"
    || (body.data.hasMore && (typeof body.data.nextCursor !== "string" || body.data.nextCursor.length === 0))
    || (!body.data.hasMore && body.data.nextCursor !== null)
    || !Number.isSafeInteger(body.data.limit)
    || !Number.isSafeInteger(body.data.entityVersion)
    || !Number.isSafeInteger(body.data.totalCount)
  ) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "자재 정보 응답이 올바르지 않습니다." });
  }
  return {
    workOrderId,
    materialType,
    lifecycle,
    items: lines as WorkOrderMaterialLine[],
    nextCursor: body.data.nextCursor as string | null,
    hasMore: body.data.hasMore,
    limit: Number(body.data.limit),
    entityVersion: Number(body.data.entityVersion),
    totalCount: Number(body.data.totalCount),
  };
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

export async function deleteWorkOrderMaterial(
  workOrderId: string,
  materialLineId: string,
  command: MaterialLifecycleCommandInput,
  idempotencyKey: string,
): Promise<MaterialLineCommandResult> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/materials/${encodeURIComponent(materialLineId)}`,
    { method: "DELETE", body: command, idempotencyKey },
  );
  const normalized = body.ok ? normalizeMaterialCommandResult(body.data, workOrderId) : null;
  if (
    !normalized
    || normalized.result.materialLineId !== materialLineId
    || normalized.result.deleted !== true
    || normalized.result.lifecycle !== "active"
  ) throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "원단 삭제 응답이 올바르지 않습니다." });
  return normalized;
}

export async function transitionWorkOrderMaterialOrder(
  workOrderId: string,
  materialLineId: string,
  kind: MaterialOrderCommandKind,
  command: MaterialOrderCommandInput,
  idempotencyKey: string,
): Promise<MaterialLineCommandResult> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/materials/${encodeURIComponent(materialLineId)}/order-${kind}`,
    { method: "POST", body: command, idempotencyKey },
  );
  const normalized = body.ok ? normalizeMaterialCommandResult(body.data, workOrderId) : null;
  const expectedStatus = kind === "request" ? "requested" : kind === "cancel" ? "editing" : "completed";
  if (
    !normalized
    || normalized.result.materialLineId !== materialLineId
    || normalized.result.status !== expectedStatus
    || normalized.result.lifecycle !== "active"
  ) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "원단 발주 상태 응답이 올바르지 않습니다." });
  }
  return normalized;
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
