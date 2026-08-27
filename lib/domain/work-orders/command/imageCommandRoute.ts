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
  createCommandTenantScope,
  requireCommandMutationApproval,
  WorkOrderCommandRequestError,
} from "@/lib/domain/work-orders/command/commandService";
import {
  deleteWorkOrderImageV2,
  IMAGE_DELETE_COMMAND_CODE,
  IMAGE_REPRESENTATIVE_COMMAND_CODE,
  IMAGE_UPLOAD_COMMAND_CODE,
  ImageCommandRepositoryError,
  setRepresentativeWorkOrderImageV2,
  completeWorkOrderImageUploadV2,
  reconcileCompletedWorkOrderImageUploadV2,
} from "@/lib/domain/work-orders/command/imageCommandRepository";
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
import { createWorkOrderAttachmentStorageKey, isWorkOrderAttachmentStorageKeyForScope } from "@/lib/storage/r2/r2Keys";
import {
  createR2WorkerUploadProxyUrl,
  createWorkOrderImageDerivativesViaWorker,
  deleteWorkOrderImageFamilyViaWorker,
  isR2WorkerUploadConfigured,
  readR2ObjectViaWorker,
  R2WorkerRequestError,
} from "@/lib/storage/r2/r2WorkerUpload";
import { ATTACHMENT_SCOPE } from "@/lib/constants/workorderIdentity";
import { validateAttachmentFile } from "@/lib/workorder/persistence/workOrderAttachmentPolicy";
import { inspectUploadedWorkOrderImage } from "@/lib/workorder/persistence/imageAssetIntegrity.mjs";
import { createImageDerivativesWithBoundedRetry } from "@/lib/domain/work-orders/command/imageDerivativeRetryPolicy";

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
  const hex = sha256(`work-order-image\0${hash}`).slice(0, 32).split("");
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
  const runtimeGuard = getWorkOrderV2ImageMutationRuntimeGuard();
  if (!runtimeGuard.ok) {
    throw new WorkOrderCommandRequestError({
      code: "FORBIDDEN",
      status: 403,
      message: `작업지시서 이미지 mutation runtime이 승인되지 않았습니다. (${correlationId.slice(0, 8)})`,
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

function mapRepositoryError(error: ImageCommandRepositoryError): never {
  const entityVersion = error.entityVersion === null ? undefined : error.entityVersion as EntityVersion;
  if (error.reason === "not_found") {
    throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "작업지시서 이미지를 찾을 수 없습니다." });
  }
  if (error.reason === "conflict" || error.reason === "idempotency_conflict") {
    throw new WorkOrderCommandRequestError({
      code: "CONFLICT",
      status: 409,
      message: error.reason === "idempotency_conflict"
        ? "같은 Idempotency-Key가 다른 이미지 요청에 이미 사용되었습니다."
        : "다른 이미지 변경이 먼저 저장되었습니다. 최신 내용을 다시 불러와 주세요.",
      entityVersion,
    });
  }
  if (error.reason === "locked") {
    throw new WorkOrderCommandRequestError({ code: "LOCKED", status: 409, message: "작성중인 작업지시서의 이미지만 변경할 수 있습니다.", entityVersion });
  }
  if (error.reason === "revision_mismatch") {
    throw new WorkOrderCommandRequestError({ code: "REVISION_MISMATCH", status: 409, message: "현재 draft revision의 이미지만 변경할 수 있습니다.", entityVersion });
  }
  throw new WorkOrderCommandRequestError({ code: "INTERNAL_ERROR", status: 500, message: "이미지 요청의 idempotency 상태를 확인하지 못했습니다.", retryable: true });
}

function successResponse(
  result: Awaited<ReturnType<typeof completeWorkOrderImageUploadV2>>,
  correlationId: CorrelationId,
  status = 200,
) {
  return createWaflApiSuccess(result.result, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-WAFL-Correlation-Id": correlationId,
      "X-WAFL-Command-Statement-Count": String(result.statementCount),
      "X-WAFL-Command-Transaction-Count": String(result.transactionCount),
      "X-WAFL-Command-DB-Ms": String(result.dbMs),
      "X-WAFL-Idempotent-Replay": result.idempotentReplay ? "1" : "0",
    },
  });
}

async function requireImageCommandScope(correlationId: CorrelationId) {
  ensureRuntime(correlationId);
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.update" });
  if (!guard.ok) {
    throw new WorkOrderCommandRequestError({
      ...mapCommandGuardFailureStatus(guard.response.status),
    });
  }
  const tenantScope = createCommandTenantScope({
    scope: guard.scope,
    companyMemberId: guard.session.companyMemberId,
    correlationId,
    permissionCode: "workorder.update",
  });
  return { guard, tenantScope };
}

async function assertReadableDraftTarget(input: {
  readonly tenantScope: TenantMemberScope;
  readonly workOrderId: string;
  readonly assignedCompanyMemberId: CompanyMemberId | null;
}) {
  const exists = await withWaflV2TenantReadOnlyTransaction(async (client) => {
    await client.query(
      `SELECT set_config('wafl.company_id', $1, true),
              set_config('wafl.company_member_id', $2, true),
              set_config('wafl.access_mode', 'tenant_member', true),
              set_config('wafl.correlation_id', $3, true)`,
      [input.tenantScope.companyId, input.tenantScope.companyMemberId, input.tenantScope.correlationId],
    );
    const result = await client.query(`
      SELECT 1
      FROM work_orders w
      JOIN work_order_revisions r
        ON r.company_id = w.company_id AND r.id = w.current_revision_id
      WHERE w.company_id = $1 AND w.id = $2::uuid AND w.deleted_at IS NULL
        AND w.status = 'draft' AND r.revision_status = 'draft'
        AND ($3::text IS NULL OR w.assignee_member_id = $3)
      LIMIT 1
    `, [input.tenantScope.companyId, input.workOrderId, input.assignedCompanyMemberId]);
    return Boolean(result.rows[0]);
  });
  if (!exists) {
    throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "변경 가능한 작업지시서를 찾을 수 없습니다." });
  }
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
  if (error instanceof R2WorkerRequestError) {
    console.error("[WORK_ORDER_IMAGE_WORKER_FAILED]", {
      correlationId,
      workerCode: error.code,
      workerStatus: error.status,
      retryable: error.retryable,
    });
    return createCommandErrorResponse({
      code: "INTERNAL_ERROR",
      message: "이미지 미리보기를 생성하지 못했습니다.",
      status: 502,
      retryable: error.retryable,
      correlationId,
    });
  }
  console.error("[WORK_ORDER_IMAGE_COMMAND_FAILED]", {
    correlationId,
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
  return createCommandErrorResponse({
    code: "INTERNAL_ERROR",
    message: "작업지시서 이미지 요청을 처리하지 못했습니다.",
    status: 500,
    retryable: true,
    correlationId,
  });
}

export async function handlePrepareWorkOrderImageUpload(request: Request, workOrderId: string) {
  const correlationId = randomUUID() as CorrelationId;
  try {
    if (!UUID_PATTERN.test(workOrderId)) {
      throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "작업지시서를 찾을 수 없습니다." });
    }
    const { guard, tenantScope } = await requireImageCommandScope(correlationId);
    const body = await readBoundedCommandJson(request);
    if (!isObject(body) || !isObject(body.file)) {
      throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message: "업로드할 이미지 정보가 필요합니다." });
    }
    const fileName = text(body.file.name);
    const mimeType = text(body.file.type);
    const sizeBytes = positiveInteger(body.file.size);
    if (!fileName || !mimeType || !sizeBytes) {
      throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message: "이미지 이름, 형식, 크기를 확인해 주세요." });
    }
    const validation = validateAttachmentFile({
      scope: ATTACHMENT_SCOPE.design,
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
      throw new WorkOrderCommandRequestError({ code: "INTERNAL_ERROR", status: 503, message: "Worker 이미지 업로드 경로가 준비되지 않았습니다.", retryable: true });
    }
    const storageKey = createWorkOrderAttachmentStorageKey({
      companyId: tenantScope.companyId,
      workOrderId,
      scope: ATTACHMENT_SCOPE.design,
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

export async function handleCompleteWorkOrderImageUpload(request: Request, workOrderId: string) {
  const correlationId = randomUUID() as CorrelationId;
  try {
    if (!UUID_PATTERN.test(workOrderId)) {
      throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "작업지시서를 찾을 수 없습니다." });
    }
    const { guard, tenantScope } = await requireImageCommandScope(correlationId);
    const idempotencyKey = readIdempotencyKey(request);
    const body = await readBoundedCommandJson(request);
    const versioned = readVersionedBody(body);
    if (!isObject(body) || !isObject(body.uploadTarget)) {
      throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message: "업로드 완료 정보가 필요합니다." });
    }
    const storageObjectKey = text(body.uploadTarget.storageKey);
    const originalFilename = text(body.uploadTarget.fileName);
    const mimeType = text(body.uploadTarget.contentType);
    const sizeBytes = positiveInteger(body.uploadTarget.fileSize);
    if (!storageObjectKey || !originalFilename || !mimeType || !sizeBytes) {
      throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message: "업로드 완료 정보를 확인해 주세요." });
    }
    if (!isWorkOrderAttachmentStorageKeyForScope({
      key: storageObjectKey,
      companyId: tenantScope.companyId,
      workOrderId,
      scope: ATTACHMENT_SCOPE.design,
    })) {
      throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message: "업로드 저장 경로가 올바르지 않습니다." });
    }
    const validation = validateAttachmentFile({
      scope: ATTACHMENT_SCOPE.design,
      fileName: originalFilename,
      contentType: mimeType,
      fileSize: sizeBytes,
    });
    if (!validation.ok) {
      throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message: validation.message });
    }
    let actual: ReturnType<typeof inspectUploadedWorkOrderImage>;
    try {
      const uploaded = await readR2ObjectViaWorker({ key: storageObjectKey });
      actual = inspectUploadedWorkOrderImage({
        declaredContentType: mimeType,
        actualContentType: uploaded.contentType,
        body: uploaded.body,
      });
    } catch (error) {
      await deleteWorkOrderImageFamilyViaWorker({ storageObjectKey }).catch((cleanupError: unknown) => {
        console.error("[WORK_ORDER_IMAGE_INTEGRITY_COMPENSATION_FAILED]", {
          correlationId,
          errorName: cleanupError instanceof Error ? cleanupError.name : "UnknownError",
        });
      });
      throw error;
    }
    const actualQuota = await checkCompanyUploadStorageQuota({
      companyId: tenantScope.companyId,
      incomingSizeBytes: actual.sizeBytes,
    });
    if (!actualQuota.ok || actualQuota.decision.status === "blocked") {
      await deleteWorkOrderImageFamilyViaWorker({ storageObjectKey });
      throw new WorkOrderCommandRequestError({
        code: "FORBIDDEN",
        status: actualQuota.ok ? 409 : 503,
        message: actualQuota.ok ? actualQuota.decision.message : actualQuota.message,
      });
    }
    const scopedKeyHash = sha256([
      IMAGE_UPLOAD_COMMAND_CODE,
      tenantScope.companyId,
      tenantScope.companyMemberId,
      idempotencyKey,
    ].join("\0"));
    const imageId = deterministicUuid(scopedKeyHash);
    const requestHash = sha256(JSON.stringify({
      workOrderId,
      expectedVersion: versioned.expectedVersion,
      storageObjectKey,
      originalFilename,
      mimeType,
      sizeBytes: actual.sizeBytes,
      contentSha256: actual.contentSha256,
    }));
    let derivatives;
    try {
      derivatives = await createImageDerivativesWithBoundedRetry({
        create: () => createWorkOrderImageDerivativesViaWorker({ key: storageObjectKey }),
        isRetryable: (error) => error instanceof R2WorkerRequestError && error.retryable,
      });
    } catch (error) {
      await deleteWorkOrderImageFamilyViaWorker({ storageObjectKey }).catch((cleanupError: unknown) => {
        console.error("[WORK_ORDER_IMAGE_UPLOAD_COMPENSATION_FAILED]", {
          correlationId,
          errorName: cleanupError instanceof Error ? cleanupError.name : "UnknownError",
        });
      });
      throw error;
    }
    try {
      const result = await completeWorkOrderImageUploadV2({
        scope: tenantScope,
        assignedCompanyMemberId: assignedMemberId(guard.scope),
        workOrderId: workOrderId as WorkOrderId,
        imageId,
        expectedVersion: versioned.expectedVersion,
        clientRequestId: versioned.clientRequestId,
        scopedIdempotencyKeyHash: scopedKeyHash,
        requestHash,
        storageObjectKey,
        thumbnailObjectKey: derivatives.thumbnail,
        originalFilename,
        mimeType: actual.contentType,
        sizeBytes: actual.sizeBytes,
        contentSha256: actual.contentSha256,
      });
      return successResponse(result, correlationId, result.idempotentReplay ? 200 : 201);
    } catch (error) {
      if (error instanceof ImageCommandRepositoryError) mapRepositoryError(error);
      throw error;
    }
  } catch (error) {
    return routeError(error, correlationId);
  }
}

export async function handleReconcileWorkOrderImageUpload(request: Request, workOrderId: string) {
  const correlationId = randomUUID() as CorrelationId;
  try {
    if (!UUID_PATTERN.test(workOrderId)) {
      throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "작업지시서를 찾을 수 없습니다." });
    }
    const { guard, tenantScope } = await requireImageCommandScope(correlationId);
    const idempotencyKey = readIdempotencyKey(request);
    const clientRequestId = new URL(request.url).searchParams.get("clientRequestId")?.trim() ?? "";
    if (!CLIENT_REQUEST_ID_PATTERN.test(clientRequestId)) {
      throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message: "clientRequestId를 확인해 주세요." });
    }
    const scopedKeyHash = sha256([
      IMAGE_UPLOAD_COMMAND_CODE,
      tenantScope.companyId,
      tenantScope.companyMemberId,
      idempotencyKey,
    ].join("\0"));
    const result = await reconcileCompletedWorkOrderImageUploadV2({
      scope: tenantScope,
      assignedCompanyMemberId: assignedMemberId(guard.scope),
      workOrderId: workOrderId as WorkOrderId,
      imageId: deterministicUuid(scopedKeyHash),
      scopedIdempotencyKeyHash: scopedKeyHash,
    });
    if (!result) {
      return createWaflApiSuccess({ status: "pending", clientRequestId }, {
        status: 202,
        headers: { "Cache-Control": "no-store", "X-WAFL-Correlation-Id": correlationId },
      });
    }
    return successResponse(result, correlationId, 200);
  } catch (error) {
    return routeError(error, correlationId);
  }
}

async function handleExistingImageMutation(
  request: Request,
  workOrderId: string,
  imageId: string,
  kind: "representative" | "delete",
) {
  const correlationId = randomUUID() as CorrelationId;
  try {
    if (!UUID_PATTERN.test(workOrderId) || !UUID_PATTERN.test(imageId)) {
      throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "작업지시서 이미지를 찾을 수 없습니다." });
    }
    const { guard, tenantScope } = await requireImageCommandScope(correlationId);
    const idempotencyKey = readIdempotencyKey(request);
    const versioned = readVersionedBody(await readBoundedCommandJson(request));
    const commandCode = kind === "representative"
      ? IMAGE_REPRESENTATIVE_COMMAND_CODE
      : IMAGE_DELETE_COMMAND_CODE;
    const scopedKeyHash = sha256([
      commandCode,
      tenantScope.companyId,
      tenantScope.companyMemberId,
      idempotencyKey,
    ].join("\0"));
    const requestHash = sha256(JSON.stringify({
      workOrderId,
      imageId,
      expectedVersion: versioned.expectedVersion,
      kind,
    }));
    try {
      const input = {
        scope: tenantScope,
        assignedCompanyMemberId: assignedMemberId(guard.scope),
        workOrderId: workOrderId as WorkOrderId,
        imageId,
        expectedVersion: versioned.expectedVersion,
        clientRequestId: versioned.clientRequestId,
        scopedIdempotencyKeyHash: scopedKeyHash,
        requestHash,
      };
      const result = kind === "representative"
        ? await setRepresentativeWorkOrderImageV2(input)
        : await deleteWorkOrderImageV2(input);
      if (kind === "delete") {
        await deleteWorkOrderImageFamilyViaWorker({
          storageObjectKey: result.storageObjectKey,
        });
      }
      return successResponse(result, correlationId);
    } catch (error) {
      if (error instanceof ImageCommandRepositoryError) mapRepositoryError(error);
      throw error;
    }
  } catch (error) {
    return routeError(error, correlationId);
  }
}

export function handleSetRepresentativeWorkOrderImage(request: Request, workOrderId: string, imageId: string) {
  return handleExistingImageMutation(request, workOrderId, imageId, "representative");
}

export function handleDeleteWorkOrderImage(request: Request, workOrderId: string, imageId: string) {
  return handleExistingImageMutation(request, workOrderId, imageId, "delete");
}
