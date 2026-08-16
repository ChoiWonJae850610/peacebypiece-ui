import "server-only";

import { createHash, randomUUID } from "crypto";

import { createWaflApiSuccess } from "@/lib/api/waflApiServer";
import { requireWorkspaceApiGuard, type WorkspaceApiCompanyScope } from "@/lib/auth/apiRouteGuards";
import { createCommandErrorResponse, mapCommandGuardFailureStatus, readBoundedCommandJson } from "@/lib/domain/work-orders/command/commandRoute";
import { createCommandTenantScope, WorkOrderCommandRequestError } from "@/lib/domain/work-orders/command/commandService";
import { getWorkOrderV2MeasurementMutationRuntimeGuard } from "@/lib/domain/work-orders/command/runtimeGuard";
import {
  createCompanyWorkOrderStructureOption,
  listCompanyWorkOrderStructureOptions,
  removeCompanyWorkOrderStructureOption,
  renameCompanyWorkOrderStructureOption,
  scopedStructureOptionIdempotencyKey,
  STRUCTURE_OPTION_CREATE_COMMAND_CODE,
  STRUCTURE_OPTION_REMOVE_COMMAND_CODE,
  STRUCTURE_OPTION_RENAME_COMMAND_CODE,
  StructureOptionRepositoryError,
} from "@/lib/domain/work-orders/catalog/structureOptionRepository";
import { isWorkOrderStructureOptionKind, normalizeWorkOrderStructureOptionHex, normalizeWorkOrderStructureOptionName } from "@/lib/domain/work-orders/catalog/structureOptionPolicy";
import type { CorrelationId, EntityVersion } from "@/lib/domain/work-orders/contracts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const KEY = /^[A-Za-z0-9._:-]{12,180}$/u;
const REQUEST_ID = /^[A-Za-z0-9._:-]{8,180}$/u;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

function assignedMemberId(scope: WorkspaceApiCompanyScope) {
  return scope.visibility?.mode === "assigned" ? scope.visibility.companyMemberId : null;
}

function deterministicUuid(namespace: string, value: string) {
  const chars = hash(`${namespace}\0${value}`).slice(0, 32).split("");
  chars[12] = "5";
  chars[16] = ["8", "9", "a", "b"][Number.parseInt(chars[16], 16) % 4];
  return `${chars.slice(0, 8).join("")}-${chars.slice(8, 12).join("")}-${chars.slice(12, 16).join("")}-${chars.slice(16, 20).join("")}-${chars.slice(20).join("")}`;
}

function bodyObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message: "요청 본문을 확인해 주세요." });
  return value as Record<string, unknown>;
}

function mutationInput(request: Request, body: Record<string, unknown>) {
  const idempotencyKey = request.headers.get("Idempotency-Key")?.trim() ?? "";
  const clientRequestId = typeof body.clientRequestId === "string" ? body.clientRequestId.trim() : "";
  const expectedVersion = Number(body.expectedVersion);
  if (!KEY.test(idempotencyKey) || !REQUEST_ID.test(clientRequestId) || !Number.isSafeInteger(expectedVersion) || expectedVersion < 1) {
    throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message: "요청 버전과 식별값을 확인해 주세요." });
  }
  return { idempotencyKey, clientRequestId, expectedVersion };
}

function mapRepositoryError(error: StructureOptionRepositoryError): never {
  const entityVersion = error.entityVersion === null ? undefined : error.entityVersion as EntityVersion;
  if (error.reason === "not_found") throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "회사 선택지를 찾을 수 없습니다.", entityVersion });
  if (error.reason === "locked") throw new WorkOrderCommandRequestError({ code: "LOCKED", status: 409, message: "수정 가능한 초안에서만 회사 선택지를 변경할 수 있습니다.", entityVersion });
  if (error.reason === "validation") throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message: "회사 선택지 정보를 확인해 주세요.", entityVersion });
  throw new WorkOrderCommandRequestError({ code: "CONFLICT", status: 409, message: error.reason === "idempotency_conflict" ? "같은 요청 식별값이 다른 변경에 사용되었습니다." : "최신 상태를 다시 확인해 주세요.", entityVersion });
}

async function guard(permissionCode: "workorder.read" | "workorder.update", correlationId: CorrelationId, mutation: boolean) {
  if (mutation && !getWorkOrderV2MeasurementMutationRuntimeGuard().ok) throw new WorkOrderCommandRequestError({ code: "FORBIDDEN", status: 403, message: "승인된 dev/test Runtime에서만 변경할 수 있습니다." });
  const result = await requireWorkspaceApiGuard({ permissionCode });
  if (!result.ok) return result;
  const scope = createCommandTenantScope({ scope: result.scope, companyMemberId: result.session.companyMemberId, correlationId, permissionCode });
  return { ...result, tenantScope: scope } as const;
}

async function errorResponse(operation: () => Promise<Response>, correlationId: CorrelationId) {
  try { return await operation(); } catch (error) {
    if (error instanceof StructureOptionRepositoryError) { try { mapRepositoryError(error); } catch (mapped) { error = mapped; } }
    if (error instanceof WorkOrderCommandRequestError) return createCommandErrorResponse({ code: error.code, status: error.status, message: error.message, entityVersion: error.entityVersion, correlationId });
    console.error("[WORK_ORDER_STRUCTURE_OPTION_FAILED]", { correlationId, errorName: error instanceof Error ? error.name : "UnknownError" });
    return createCommandErrorResponse({ code: "INTERNAL_ERROR", status: 500, message: "회사 사이즈·색상 선택지를 처리하지 못했습니다.", retryable: true, correlationId });
  }
}

export async function handleListStructureOptions(workOrderId: string) {
  const correlationId = randomUUID() as CorrelationId;
  return errorResponse(async () => {
    if (!UUID.test(workOrderId)) throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "작업지시서를 찾을 수 없습니다." });
    const access = await guard("workorder.read", correlationId, false);
    if (!access.ok) return createCommandErrorResponse({ ...mapCommandGuardFailureStatus(access.response.status), correlationId });
    const data = await listCompanyWorkOrderStructureOptions({ scope: access.tenantScope, workOrderId, assignedCompanyMemberId: assignedMemberId(access.scope) });
    return createWaflApiSuccess(data, { headers: { "Cache-Control": "no-store", "X-WAFL-Correlation-Id": correlationId } });
  }, correlationId);
}

export async function handleCreateStructureOption(request: Request, workOrderId: string) {
  const correlationId = randomUUID() as CorrelationId;
  return errorResponse(async () => {
    if (!UUID.test(workOrderId)) throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "작업지시서를 찾을 수 없습니다." });
    const access = await guard("workorder.update", correlationId, true);
    if (!access.ok) return createCommandErrorResponse({ ...mapCommandGuardFailureStatus(access.response.status), correlationId });
    const body = bodyObject(await readBoundedCommandJson(request));
    const common = mutationInput(request, body);
    if (!isWorkOrderStructureOptionKind(body.kind)) throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message: "선택지 종류를 확인해 주세요." });
    const name = normalizeWorkOrderStructureOptionName(body.displayName, body.kind);
    if (!name.ok) throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message: name.message });
    const color = normalizeWorkOrderStructureOptionHex(body.hexValue, body.kind);
    if (!color.ok) throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message: color.message });
    const scopedKey = scopedStructureOptionIdempotencyKey(STRUCTURE_OPTION_CREATE_COMMAND_CODE, access.tenantScope, common.idempotencyKey);
    const requestHash = hash(JSON.stringify({ workOrderId, expectedVersion: common.expectedVersion, kind: body.kind, displayName: name.displayName, hexValue: color.hexValue }));
    const result = await createCompanyWorkOrderStructureOption({ scope: access.tenantScope, workOrderId, assignedCompanyMemberId: assignedMemberId(access.scope), expectedVersion: common.expectedVersion, scopedIdempotencyKeyHash: scopedKey, requestHash, optionId: deterministicUuid("company-work-order-structure-option", scopedKey), kind: body.kind, displayName: name.displayName, normalizedName: name.normalizedName, hexValue: color.hexValue });
    return createWaflApiSuccess(result, { headers: { "Cache-Control": "no-store", "X-WAFL-Correlation-Id": correlationId } });
  }, correlationId);
}

export async function handleRemoveStructureOption(request: Request, workOrderId: string, optionId: string) {
  const correlationId = randomUUID() as CorrelationId;
  return errorResponse(async () => {
    if (!UUID.test(workOrderId) || !UUID.test(optionId)) throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "회사 선택지를 찾을 수 없습니다." });
    const access = await guard("workorder.update", correlationId, true);
    if (!access.ok) return createCommandErrorResponse({ ...mapCommandGuardFailureStatus(access.response.status), correlationId });
    const body = bodyObject(await readBoundedCommandJson(request));
    const common = mutationInput(request, body);
    const scopedKey = scopedStructureOptionIdempotencyKey(STRUCTURE_OPTION_REMOVE_COMMAND_CODE, access.tenantScope, common.idempotencyKey);
    const requestHash = hash(JSON.stringify({ workOrderId, optionId, expectedVersion: common.expectedVersion }));
    const result = await removeCompanyWorkOrderStructureOption({ scope: access.tenantScope, workOrderId, assignedCompanyMemberId: assignedMemberId(access.scope), expectedVersion: common.expectedVersion, scopedIdempotencyKeyHash: scopedKey, requestHash, optionId });
    return createWaflApiSuccess(result, { headers: { "Cache-Control": "no-store", "X-WAFL-Correlation-Id": correlationId } });
  }, correlationId);
}

export async function handleRenameStructureOption(request: Request, workOrderId: string, optionId: string) {
  const correlationId = randomUUID() as CorrelationId;
  return errorResponse(async () => {
    if (!UUID.test(workOrderId) || !UUID.test(optionId)) throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "회사 스펙 항목을 찾을 수 없습니다." });
    const access = await guard("workorder.update", correlationId, true);
    if (!access.ok) return createCommandErrorResponse({ ...mapCommandGuardFailureStatus(access.response.status), correlationId });
    const body = bodyObject(await readBoundedCommandJson(request));
    const common = mutationInput(request, body);
    const name = normalizeWorkOrderStructureOptionName(body.displayName, "spec_item");
    if (!name.ok) throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message: name.message });
    const scopedKey = scopedStructureOptionIdempotencyKey(STRUCTURE_OPTION_RENAME_COMMAND_CODE, access.tenantScope, common.idempotencyKey);
    const requestHash = hash(JSON.stringify({ workOrderId, optionId, expectedVersion: common.expectedVersion, displayName: name.displayName }));
    const result = await renameCompanyWorkOrderStructureOption({
      scope: access.tenantScope,
      workOrderId,
      assignedCompanyMemberId: assignedMemberId(access.scope),
      expectedVersion: common.expectedVersion,
      scopedIdempotencyKeyHash: scopedKey,
      requestHash,
      optionId,
      displayName: name.displayName,
      normalizedName: name.normalizedName,
    });
    return createWaflApiSuccess(result, { headers: { "Cache-Control": "no-store", "X-WAFL-Correlation-Id": correlationId } });
  }, correlationId);
}
