import "server-only";

import { createHash, randomUUID } from "crypto";

import { createWaflApiSuccess } from "@/lib/api/waflApiServer";
import { requireWorkspaceApiGuard, type WorkspaceApiCompanyScope } from "@/lib/auth/apiRouteGuards";
import { checkCompanyUploadStorageQuota } from "@/lib/billing/companyStorageQuotaRepository";
import {
  createCommandErrorResponse,
  mapCommandGuardFailureStatus,
  readBoundedCommandJson,
} from "@/lib/domain/work-orders/command/commandRoute";
import {
  ATTACHMENT_DELETE_COMMAND_CODE,
  ATTACHMENT_OUTPUT_INCLUDE_COMMAND_CODE,
  ATTACHMENT_UPLOAD_COMMAND_CODE,
  AttachmentCommandRepositoryError,
  completeWorkOrderAttachmentUploadV2,
  deleteWorkOrderAttachmentV2,
  setWorkOrderAttachmentOutputIncludeV2,
} from "@/lib/domain/work-orders/command/attachmentCommandRepository";
import {
  createCommandTenantScope,
  requireCommandMutationApproval,
  WorkOrderCommandRequestError,
} from "@/lib/domain/work-orders/command/commandService";
import {
  getWorkOrderV2ImageMutationRuntimeGuard,
} from "@/lib/domain/work-orders/command/runtimeGuard";
import type {
  CompanyMemberId,
  CorrelationId,
  EntityVersion,
  TenantMemberScope,
  WorkOrderId,
} from "@/lib/domain/work-orders/contracts";
import { withWaflV2TenantReadOnlyTransaction } from "@/lib/db/client";
import { ATTACHMENT_SCOPE } from "@/lib/constants/workorderIdentity";
import {
  createWorkOrderAttachmentStorageKey,
  isWorkOrderAttachmentStorageKeyForScope,
} from "@/lib/storage/r2/r2Keys";
import {
  createR2WorkerUploadProxyUrl,
  deleteR2ObjectViaWorker,
  isR2WorkerUploadConfigured,
} from "@/lib/storage/r2/r2WorkerUpload";
import {
  validateAttachmentFile,
  validateAttachmentFileCount,
} from "@/lib/workorder/persistence/workOrderAttachmentPolicy";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{12,180}$/;
const CLIENT_REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{8,180}$/;

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function positiveInteger(value: unknown): number | null {
  return Number.isSafeInteger(value) && Number(value) > 0 ? Number(value) : null;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function deterministicUuid(hash: string): string {
  const hex = sha256(`work-order-attachment\0${hash}`).slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = ["8", "9", "a", "b"][Number.parseInt(hex[16], 16) % 4];
  return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`;
}

function assignedMemberId(scope: WorkspaceApiCompanyScope): CompanyMemberId | null {
  return scope.visibility?.mode === "assigned"
    ? scope.visibility.companyMemberId as CompanyMemberId
    : null;
}

function ensureRuntime(correlationId: CorrelationId) {
  const runtime = getWorkOrderV2ImageMutationRuntimeGuard();
  if (!runtime.ok) {
    throw new WorkOrderCommandRequestError({
      code: "FORBIDDEN",
      status: 403,
      message: `작업지시서 첨부 mutation runtime이 승인되지 않았습니다. (${correlationId.slice(0, 8)})`,
    });
  }
  requireCommandMutationApproval(process.env.WAFL_V2_COMMAND_MUTATION_APPROVED ?? "");
}

function readIdempotencyKey(request: Request): string {
  const value = request.headers.get("Idempotency-Key")?.trim() ?? "";
  if (!IDEMPOTENCY_KEY_PATTERN.test(value)) {
    throw new WorkOrderCommandRequestError({
      code: "VALIDATION_ERROR",
      status: 400,
      message: "유효한 Idempotency-Key가 필요합니다.",
    });
  }
  return value;
}

function readVersionedBody(body: unknown) {
  if (!isObject(body)) {
    throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message: "요청 본문이 올바르지 않습니다." });
  }
  const expectedVersion = positiveInteger(body.expectedVersion);
  const clientRequestId = text(body.clientRequestId);
  if (!expectedVersion || !clientRequestId || !CLIENT_REQUEST_ID_PATTERN.test(clientRequestId)) {
    throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message: "요청 버전과 clientRequestId를 확인해 주세요." });
  }
  return { expectedVersion: expectedVersion as EntityVersion, clientRequestId };
}

async function requireScope(correlationId: CorrelationId) {
  ensureRuntime(correlationId);
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.update" });
  if (!guard.ok) {
    throw new WorkOrderCommandRequestError({ ...mapCommandGuardFailureStatus(guard.response.status) });
  }
  return {
    guard,
    tenantScope: createCommandTenantScope({
      scope: guard.scope,
      companyMemberId: guard.session.companyMemberId,
      correlationId,
      permissionCode: "workorder.update",
    }),
  };
}

async function assertReadableDraftTarget(input: {
  tenantScope: TenantMemberScope;
  workOrderId: string;
  assignedCompanyMemberId: CompanyMemberId | null;
}) {
  const result = await withWaflV2TenantReadOnlyTransaction(async (client) => {
    await client.query(
      `SELECT set_config('wafl.company_id', $1, true),
              set_config('wafl.company_member_id', $2, true),
              set_config('wafl.access_mode', 'tenant_member', true),
              set_config('wafl.correlation_id', $3, true)`,
      [input.tenantScope.companyId, input.tenantScope.companyMemberId, input.tenantScope.correlationId],
    );
    const rows = await client.query<{ asset_count: number | string }>(`
      SELECT (
        (SELECT count(*) FROM work_order_revision_images ri
          JOIN work_order_images i ON i.company_id = ri.company_id AND i.id = ri.image_id AND i.deleted_at IS NULL
          WHERE ri.company_id = w.company_id AND ri.revision_id = r.id)
        +
        (SELECT count(*) FROM work_order_revision_attachments ra
          JOIN work_order_attachments a ON a.company_id = ra.company_id AND a.id = ra.attachment_id AND a.deleted_at IS NULL
          WHERE ra.company_id = w.company_id AND ra.revision_id = r.id)
      )::integer AS asset_count
      FROM work_orders w
      JOIN work_order_revisions r ON r.company_id = w.company_id AND r.id = w.current_revision_id
      WHERE w.company_id = $1 AND w.id = $2::uuid AND w.deleted_at IS NULL
        AND w.status = 'draft' AND r.revision_status = 'draft'
        AND ($3::text IS NULL OR w.assignee_member_id = $3)
      LIMIT 1
    `, [input.tenantScope.companyId, input.workOrderId, input.assignedCompanyMemberId]);
    return rows.rows[0] ? Number(rows.rows[0].asset_count) : null;
  });
  if (result === null) {
    throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "변경 가능한 작업지시서를 찾을 수 없습니다." });
  }
  const count = validateAttachmentFileCount({ currentCount: result, incomingCount: 1 });
  if (!count.ok) {
    throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message: count.message });
  }
}

function mapRepositoryError(error: AttachmentCommandRepositoryError): never {
  const entityVersion = error.entityVersion === null ? undefined : error.entityVersion as EntityVersion;
  if (error.reason === "not_found") {
    throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "작업지시서 첨부를 찾을 수 없습니다." });
  }
  if (error.reason === "conflict" || error.reason === "idempotency_conflict") {
    throw new WorkOrderCommandRequestError({
      code: "CONFLICT",
      status: 409,
      message: error.reason === "idempotency_conflict"
        ? "같은 Idempotency-Key가 다른 첨부 요청에 이미 사용되었습니다."
        : "다른 변경이 먼저 저장되었습니다. 최신 내용을 다시 불러와 주세요.",
      entityVersion,
    });
  }
  if (error.reason === "locked") {
    throw new WorkOrderCommandRequestError({ code: "LOCKED", status: 409, message: "작성중인 작업지시서의 첨부만 변경할 수 있습니다.", entityVersion });
  }
  if (error.reason === "revision_mismatch") {
    throw new WorkOrderCommandRequestError({ code: "REVISION_MISMATCH", status: 409, message: "현재 draft revision의 첨부만 변경할 수 있습니다.", entityVersion });
  }
  throw new WorkOrderCommandRequestError({ code: "INTERNAL_ERROR", status: 500, message: "첨부 요청의 idempotency 상태를 확인하지 못했습니다.", retryable: true });
}

function successResponse<T>(
  commandResult: {
    readonly result: T;
    readonly statementCount: number;
    readonly transactionCount: 1;
    readonly dbMs: number;
    readonly idempotentReplay: boolean;
  },
  correlationId: CorrelationId,
  status = 200,
) {
  return createWaflApiSuccess(commandResult.result, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-WAFL-Correlation-Id": correlationId,
      "X-WAFL-Command-Statement-Count": String(commandResult.statementCount),
      "X-WAFL-Command-Transaction-Count": String(commandResult.transactionCount),
      "X-WAFL-Command-DB-Ms": String(commandResult.dbMs),
      "X-WAFL-Idempotent-Replay": commandResult.idempotentReplay ? "1" : "0",
    },
  });
}

async function routeError(error: unknown, correlationId: CorrelationId) {
  if (error instanceof WorkOrderCommandRequestError) {
    return createCommandErrorResponse({
      code: error.code,
      message: error.message,
      status: error.status,
      retryable: error.retryable,
      fieldErrors: error.fieldErrors,
      entityVersion: error.entityVersion,
      correlationId,
    });
  }
  console.error("[WORK_ORDER_ATTACHMENT_COMMAND_FAILED]", {
    correlationId,
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
  return createCommandErrorResponse({
    code: "INTERNAL_ERROR",
    message: "작업지시서 첨부 요청을 처리하지 못했습니다.",
    status: 500,
    retryable: true,
    correlationId,
  });
}

export async function handlePrepareWorkOrderAttachmentUpload(request: Request, workOrderId: string) {
  const correlationId = randomUUID() as CorrelationId;
  try {
    if (!UUID_PATTERN.test(workOrderId)) {
      throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "작업지시서를 찾을 수 없습니다." });
    }
    const { guard, tenantScope } = await requireScope(correlationId);
    const body = await readBoundedCommandJson(request);
    if (!isObject(body) || !isObject(body.file)) {
      throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message: "업로드할 첨부 정보가 필요합니다." });
    }
    const fileName = text(body.file.name);
    const mimeType = text(body.file.type);
    const sizeBytes = positiveInteger(body.file.size);
    if (!fileName || !mimeType || !sizeBytes) {
      throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message: "첨부 이름, 형식, 크기를 확인해 주세요." });
    }
    const validation = validateAttachmentFile({
      scope: ATTACHMENT_SCOPE.attachment,
      fileName,
      contentType: mimeType,
      fileSize: sizeBytes,
    });
    if (!validation.ok) {
      throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message: validation.message });
    }
    await assertReadableDraftTarget({
      tenantScope,
      workOrderId,
      assignedCompanyMemberId: assignedMemberId(guard.scope),
    });
    const quota = await checkCompanyUploadStorageQuota({
      companyId: tenantScope.companyId,
      incomingSizeBytes: sizeBytes,
    });
    if (!quota.ok || quota.decision.status === "blocked") {
      throw new WorkOrderCommandRequestError({ code: "FORBIDDEN", status: quota.ok ? 409 : 503, message: quota.ok ? quota.decision.message : quota.message });
    }
    if (!isR2WorkerUploadConfigured()) {
      throw new WorkOrderCommandRequestError({ code: "INTERNAL_ERROR", status: 503, message: "Worker 첨부 업로드 경로가 준비되지 않았습니다.", retryable: true });
    }
    const storageKey = createWorkOrderAttachmentStorageKey({
      companyId: tenantScope.companyId,
      workOrderId,
      scope: ATTACHMENT_SCOPE.attachment,
      originalName: fileName,
    });
    const upload = createR2WorkerUploadProxyUrl({ key: storageKey, contentType: mimeType });
    return createWaflApiSuccess({
      uploadTarget: {
        storageKey,
        fileName,
        contentType: mimeType,
        fileSize: sizeBytes,
        uploadUrl: upload.url,
        method: upload.method,
        headers: upload.headers,
        expiresInSeconds: upload.expiresInSeconds,
      },
      quota: quota.decision,
    }, {
      status: 200,
      headers: { "Cache-Control": "no-store", "X-WAFL-Correlation-Id": correlationId },
    });
  } catch (error) {
    return routeError(error, correlationId);
  }
}

export async function handleCompleteWorkOrderAttachmentUpload(request: Request, workOrderId: string) {
  const correlationId = randomUUID() as CorrelationId;
  try {
    if (!UUID_PATTERN.test(workOrderId)) {
      throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "작업지시서를 찾을 수 없습니다." });
    }
    const { guard, tenantScope } = await requireScope(correlationId);
    const idempotencyKey = readIdempotencyKey(request);
    const body = await readBoundedCommandJson(request);
    const versioned = readVersionedBody(body);
    if (!isObject(body) || !isObject(body.uploadTarget)) {
      throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message: "첨부 업로드 완료 정보가 필요합니다." });
    }
    const storageObjectKey = text(body.uploadTarget.storageKey);
    const originalFilename = text(body.uploadTarget.fileName);
    const mimeType = text(body.uploadTarget.contentType);
    const sizeBytes = positiveInteger(body.uploadTarget.fileSize);
    if (!storageObjectKey || !originalFilename || !mimeType || !sizeBytes) {
      throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message: "첨부 업로드 완료 정보를 확인해 주세요." });
    }
    if (!isWorkOrderAttachmentStorageKeyForScope({
      key: storageObjectKey,
      companyId: tenantScope.companyId,
      workOrderId,
      scope: ATTACHMENT_SCOPE.attachment,
    })) {
      throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message: "첨부 저장 경로가 올바르지 않습니다." });
    }
    const validation = validateAttachmentFile({
      scope: ATTACHMENT_SCOPE.attachment,
      fileName: originalFilename,
      contentType: mimeType,
      fileSize: sizeBytes,
    });
    if (!validation.ok) {
      throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message: validation.message });
    }
    const scopedKeyHash = sha256([
      ATTACHMENT_UPLOAD_COMMAND_CODE,
      tenantScope.companyId,
      tenantScope.companyMemberId,
      idempotencyKey,
    ].join("\0"));
    const attachmentId = deterministicUuid(scopedKeyHash);
    const requestHash = sha256(JSON.stringify({
      workOrderId,
      expectedVersion: versioned.expectedVersion,
      storageObjectKey,
      originalFilename,
      mimeType,
      sizeBytes,
    }));
    try {
      const commandResult = await completeWorkOrderAttachmentUploadV2({
        scope: tenantScope,
        assignedCompanyMemberId: assignedMemberId(guard.scope),
        workOrderId: workOrderId as WorkOrderId,
        attachmentId,
        expectedVersion: versioned.expectedVersion,
        clientRequestId: versioned.clientRequestId,
        scopedIdempotencyKeyHash: scopedKeyHash,
        requestHash,
        storageObjectKey,
        originalFilename,
        mimeType,
        sizeBytes,
      });
      return successResponse(commandResult, correlationId, commandResult.idempotentReplay ? 200 : 201);
    } catch (error) {
      if (error instanceof AttachmentCommandRepositoryError) mapRepositoryError(error);
      throw error;
    }
  } catch (error) {
    return routeError(error, correlationId);
  }
}

export async function handleDeleteWorkOrderAttachment(
  request: Request,
  workOrderId: string,
  attachmentId: string,
) {
  const correlationId = randomUUID() as CorrelationId;
  try {
    if (!UUID_PATTERN.test(workOrderId) || !UUID_PATTERN.test(attachmentId)) {
      throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "작업지시서 첨부를 찾을 수 없습니다." });
    }
    const { guard, tenantScope } = await requireScope(correlationId);
    const idempotencyKey = readIdempotencyKey(request);
    const body = await readBoundedCommandJson(request);
    const versioned = readVersionedBody(body);
    const scopedKeyHash = sha256([
      ATTACHMENT_DELETE_COMMAND_CODE,
      tenantScope.companyId,
      tenantScope.companyMemberId,
      idempotencyKey,
    ].join("\0"));
    const requestHash = sha256(JSON.stringify({
      workOrderId,
      attachmentId,
      expectedVersion: versioned.expectedVersion,
    }));
    try {
      const commandResult = await deleteWorkOrderAttachmentV2({
        scope: tenantScope,
        assignedCompanyMemberId: assignedMemberId(guard.scope),
        workOrderId: workOrderId as WorkOrderId,
        attachmentId,
        expectedVersion: versioned.expectedVersion,
        clientRequestId: versioned.clientRequestId,
        scopedIdempotencyKeyHash: scopedKeyHash,
        requestHash,
      });
      await deleteR2ObjectViaWorker({ key: commandResult.storageObjectKey });
      return successResponse(commandResult, correlationId);
    } catch (error) {
      if (error instanceof AttachmentCommandRepositoryError) mapRepositoryError(error);
      throw error;
    }
  } catch (error) {
    return routeError(error, correlationId);
  }
}

export async function handleSetWorkOrderAttachmentOutputInclude(
  request: Request,
  workOrderId: string,
  attachmentId: string,
) {
  const correlationId = randomUUID() as CorrelationId;
  try {
    if (!UUID_PATTERN.test(workOrderId) || !UUID_PATTERN.test(attachmentId)) {
      throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "작업지시서 첨부를 찾을 수 없습니다." });
    }
    const { guard, tenantScope } = await requireScope(correlationId);
    const idempotencyKey = readIdempotencyKey(request);
    const body = await readBoundedCommandJson(request);
    const versioned = readVersionedBody(body);
    if (!isObject(body) || typeof body.includeInDocument !== "boolean") {
      throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message: "출력 포함 여부를 확인해 주세요." });
    }
    const scopedKeyHash = sha256([
      ATTACHMENT_OUTPUT_INCLUDE_COMMAND_CODE,
      tenantScope.companyId,
      tenantScope.companyMemberId,
      idempotencyKey,
    ].join("\0"));
    const requestHash = sha256(JSON.stringify({
      workOrderId,
      attachmentId,
      expectedVersion: versioned.expectedVersion,
      includeInDocument: body.includeInDocument,
    }));
    try {
      const commandResult = await setWorkOrderAttachmentOutputIncludeV2({
        scope: tenantScope,
        assignedCompanyMemberId: assignedMemberId(guard.scope),
        workOrderId: workOrderId as WorkOrderId,
        attachmentId,
        expectedVersion: versioned.expectedVersion,
        clientRequestId: versioned.clientRequestId,
        includeInDocument: body.includeInDocument,
        scopedIdempotencyKeyHash: scopedKeyHash,
        requestHash,
      });
      return successResponse(commandResult, correlationId);
    } catch (error) {
      if (error instanceof AttachmentCommandRepositoryError) mapRepositoryError(error);
      throw error;
    }
  } catch (error) {
    return routeError(error, correlationId);
  }
}
