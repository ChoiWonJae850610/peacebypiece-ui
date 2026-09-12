import "server-only";

import { createHash } from "node:crypto";

import type { WorkspaceApiCompanyScope } from "@/lib/auth/apiRouteGuards";
import { createCommandTenantScope, WorkOrderCommandRequestError } from "@/lib/domain/work-orders/command/commandService";
import type { CorrelationId } from "@/lib/domain/work-orders/contracts";
import { getDocumentAccessRuntimeGuard } from "@/lib/generated-documents/document-access/runtimeGuard";
import { GENERATED_DOCUMENT_REVOKE_COMMAND_CODE, GeneratedDocumentRevokeRepositoryError, revokeGeneratedDocumentV2 } from "./revokeRepository";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

function invalid(message: string): never {
  throw new WorkOrderCommandRequestError({ code: "VALIDATION_ERROR", status: 400, message });
}

export async function revokeGeneratedDocument(input: {
  readonly scope: WorkspaceApiCompanyScope;
  readonly companyMemberId: string | null;
  readonly correlationId: CorrelationId;
  readonly workOrderId: string;
  readonly documentId: string;
  readonly body: unknown;
  readonly idempotencyKey: string;
}) {
  const body = input.body && typeof input.body === "object" ? input.body as Record<string, unknown> : {};
  const revisionId = typeof body.revisionId === "string" ? body.revisionId.trim() : "";
  const clientRequestId = typeof body.clientRequestId === "string" ? body.clientRequestId.trim() : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const generationNumber = Number(body.generationNumber);
  if (!UUID.test(input.workOrderId) || !UUID.test(input.documentId) || !UUID.test(revisionId)) invalid("폐기 대상 문서 식별자가 올바르지 않습니다.");
  if (!clientRequestId || clientRequestId.length > 128 || input.idempotencyKey !== clientRequestId) invalid("Idempotency-Key가 올바르지 않습니다.");
  if (!Number.isSafeInteger(generationNumber) || generationNumber < 1) invalid("문서 생성 번호가 올바르지 않습니다.");
  if (!reason || reason.length > 200) invalid("폐기 사유를 확인해 주세요.");
  const runtime = getDocumentAccessRuntimeGuard({ requireMutationApproval: true, mutationPurpose: "manual_share" });
  if (!runtime.ok) throw new WorkOrderCommandRequestError({ code: "FORBIDDEN", status: 403, message: "PDF 폐기는 승인된 DEV/TEST runtime에서만 실행할 수 있습니다." });
  const scope = createCommandTenantScope({ scope: input.scope, companyMemberId: input.companyMemberId,
    correlationId: input.correlationId, permissionCode: "workorder.update" });
  const scopedIdempotencyKeyHash = sha256([GENERATED_DOCUMENT_REVOKE_COMMAND_CODE, scope.companyId,
    scope.companyMemberId, input.workOrderId, revisionId, input.documentId, clientRequestId].join("\0"));
  const requestHash = sha256(JSON.stringify({ workOrderId: input.workOrderId, revisionId,
    documentId: input.documentId, generationNumber, reason }));
  try {
    return await revokeGeneratedDocumentV2({ scope, workOrderId: input.workOrderId, revisionId,
      documentId: input.documentId, generationNumber, reason, clientRequestId,
      scopedIdempotencyKeyHash, requestHash });
  } catch (error) {
    if (error instanceof GeneratedDocumentRevokeRepositoryError) {
      if (error.reason === "not_found") throw new WorkOrderCommandRequestError({ code: "NOT_FOUND", status: 404, message: "현재 리비전의 폐기 대상 PDF를 찾을 수 없습니다." });
      if (error.reason === "locked") throw new WorkOrderCommandRequestError({ code: "LOCKED", status: 409, message: "현재 문서 상태에서는 폐기할 수 없습니다." });
      throw new WorkOrderCommandRequestError({ code: "CONFLICT", status: 409, message: "같은 요청 키의 처리 결과를 확인할 수 없습니다." });
    }
    throw error;
  }
}
