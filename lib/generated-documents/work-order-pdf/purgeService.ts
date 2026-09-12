import "server-only";

import { createHash } from "node:crypto";

import type { WorkspaceApiCompanyScope } from "@/lib/auth/apiRouteGuards";
import { createCommandTenantScope, WorkOrderCommandRequestError } from "@/lib/domain/work-orders/command/commandService";
import type { CorrelationId } from "@/lib/domain/work-orders/contracts";
import { getDocumentAccessRuntimeGuard } from "@/lib/generated-documents/document-access/runtimeGuard";
import { R2WorkerGeneratedDocumentObjectStore, type GeneratedDocumentObjectStore } from "./objectStore";
import { resolveAmbiguousGeneratedDocumentDelete, resolveGeneratedDocumentPurgeStoragePlan } from "./purgeCore";
import {
  GENERATED_DOCUMENT_PURGE_COMMAND_CODE,
  GeneratedDocumentPurgeRepositoryError,
  finalizeGeneratedDocumentPurgeV2,
  prepareGeneratedDocumentPurgeV2,
} from "./purgeRepository";
import { R2WorkerGeneratedDocumentTransport } from "./r2WorkerTransport";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const purgeQueues = new Map<string, Promise<void>>();

async function withGeneratedDocumentPurgeLock<TResult>(key: string, operation: () => Promise<TResult>) {
  const previous = purgeQueues.get(key) ?? Promise.resolve();
  let release = () => {};
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const current = previous.catch(() => {}).then(() => gate);
  purgeQueues.set(key, current);
  await previous.catch(() => {});
  try {
    return await operation();
  } finally {
    release();
    if (purgeQueues.get(key) === current) purgeQueues.delete(key);
  }
}

function invalid(message: string): never {
  throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message });
}

export type GeneratedDocumentPurgeExecution = {
  readonly objectStore?: GeneratedDocumentObjectStore;
  readonly hooks?: {
    readonly beforeObjectDelete?: (input: { readonly documentId: string; readonly objectKey: string }) => Promise<void>;
    readonly afterObjectAbsentBeforeFinalize?: (input: { readonly documentId: string; readonly objectKey: string }) => Promise<void>;
  };
};

function mapRepositoryError(error: GeneratedDocumentPurgeRepositoryError): never {
  if (error.reason === "not_found") throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404,
    message: "현재 리비전의 삭제 대상 PDF를 찾을 수 없습니다." });
  if (error.reason === "locked") throw new WorkOrderCommandRequestError({ code: "LOCKED", status: 409,
    message: "폐기된 현재 PDF만 삭제할 수 있습니다." });
  throw new WorkOrderCommandRequestError({ code: "CONFLICT", status: 409,
    message: "같은 요청 키의 처리 결과를 확인할 수 없습니다." });
}

export async function purgeRevokedGeneratedDocument(input: {
  readonly scope: WorkspaceApiCompanyScope;
  readonly companyMemberId: string | null;
  readonly correlationId: CorrelationId;
  readonly workOrderId: string;
  readonly documentId: string;
  readonly body: unknown;
  readonly idempotencyKey: string;
}, execution: GeneratedDocumentPurgeExecution = {}) {
  const body = input.body && typeof input.body === "object" ? input.body as Record<string, unknown> : {};
  const revisionId = typeof body.revisionId === "string" ? body.revisionId.trim() : "";
  const clientRequestId = typeof body.clientRequestId === "string" ? body.clientRequestId.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const generationNumber = Number(body.generationNumber);
  if (!UUID.test(input.workOrderId) || !UUID.test(input.documentId) || !UUID.test(revisionId)) {
    invalid("삭제 대상 문서 식별자가 올바르지 않습니다.");
  }
  if (!clientRequestId || clientRequestId.length > 128 || input.idempotencyKey !== clientRequestId) {
    invalid("Idempotency-Key가 올바르지 않습니다.");
  }
  if (!Number.isSafeInteger(generationNumber) || generationNumber < 1) invalid("문서 생성 번호가 올바르지 않습니다.");
  if (!reason || reason.length > 200) invalid("삭제 사유를 확인해 주세요.");
  const runtime = getDocumentAccessRuntimeGuard({ requireMutationApproval: true, mutationPurpose: "manual_share" });
  if (!runtime.ok) throw new WorkOrderCommandRequestError({ code: "FORBIDDEN", status: 403,
    message: "PDF 삭제는 승인된 DEV/TEST runtime에서만 실행할 수 있습니다." });
  const scope = createCommandTenantScope({ scope: input.scope, companyMemberId: input.companyMemberId,
    correlationId: input.correlationId, permissionCode: "workorder.update" });
  const scopedIdempotencyKeyHash = sha256([GENERATED_DOCUMENT_PURGE_COMMAND_CODE, scope.companyId,
    scope.companyMemberId, input.workOrderId, revisionId, input.documentId, clientRequestId].join("\0"));
  const requestHash = sha256(JSON.stringify({ workOrderId: input.workOrderId, revisionId,
    documentId: input.documentId, generationNumber, reason }));
  const identity = { scope, workOrderId: input.workOrderId, revisionId, documentId: input.documentId,
    generationNumber, reason, clientRequestId, scopedIdempotencyKeyHash, requestHash };
  return withGeneratedDocumentPurgeLock([
    scope.companyId, input.workOrderId, revisionId, input.documentId, generationNumber,
  ].join("\0"), async () => { try {
    const prepared = await prepareGeneratedDocumentPurgeV2(identity);
    if (prepared.result) return { ...prepared, objectDeleteCount: 0, absenceReconciled: false };
    const store = execution.objectStore
      ?? new R2WorkerGeneratedDocumentObjectStore(new R2WorkerGeneratedDocumentTransport());
    let objectPresent = await store.headPdf(prepared.target.objectKey) !== null;
    let objectDeleteCount = 0;
    const storagePlan = resolveGeneratedDocumentPurgeStoragePlan({ lifecycle: prepared.target.status, objectPresent });
    if (storagePlan === "delete_then_finalize") {
      await execution.hooks?.beforeObjectDelete?.({ documentId: input.documentId,
        objectKey: prepared.target.objectKey });
      try {
        objectDeleteCount += 1;
        await store.deletePdf(prepared.target.objectKey);
      } catch (deleteError) {
        try {
          objectPresent = await store.headPdf(prepared.target.objectKey) !== null;
        } catch {
          throw deleteError;
        }
        const ambiguity = resolveAmbiguousGeneratedDocumentDelete({
          verification: objectPresent ? "present" : "absent",
        });
        if (!ambiguity.mayFinalizeDeleted) throw deleteError;
      }
    }
    if (await store.headPdf(prepared.target.objectKey) !== null) {
      throw new Error("PDF_R2_EXACT_PURGE_VERIFICATION_FAILED");
    }
    await execution.hooks?.afterObjectAbsentBeforeFinalize?.({ documentId: input.documentId,
      objectKey: prepared.target.objectKey });
    const finalized = await finalizeGeneratedDocumentPurgeV2(identity);
    return {
      ...finalized,
      statementCount: prepared.statementCount + finalized.statementCount,
      transactionCount: (prepared.transactionCount + finalized.transactionCount) as 2,
      dbMs: Number((prepared.dbMs + finalized.dbMs).toFixed(2)),
      objectDeleteCount,
      absenceReconciled: objectDeleteCount === 0,
    };
  } catch (error) {
    if (error instanceof GeneratedDocumentPurgeRepositoryError) mapRepositoryError(error);
    if (error instanceof WorkOrderCommandRequestError) throw error;
    console.error("[WORK_ORDER_DOCUMENT_PURGE_DEPENDENCY_FAILED]", {
      correlationId: input.correlationId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    throw new WorkOrderCommandRequestError({ code: "INTERNAL_ERROR", status: 503, retryable: true,
      message: "PDF 파일 삭제를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요." });
  } });
}
