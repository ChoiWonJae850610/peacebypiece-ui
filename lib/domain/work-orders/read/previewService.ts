import "server-only";

import type { WorkspaceApiCompanyScope } from "@/lib/auth/apiRouteGuards";
import type { CompanyId, CompanyMemberId, CorrelationId, TenantMemberScope, WorkOrderApiErrorCode, WorkOrderId, WorkOrderRevisionId } from "@/lib/domain/work-orders/contracts";
import { getIssuedWorkOrderPreviewV2 } from "@/lib/domain/work-orders/read/previewRepository";

export class WorkOrderPreviewRequestError extends Error {
  constructor(readonly code: WorkOrderApiErrorCode, readonly status: number, message: string) { super(message); this.name = "WorkOrderPreviewRequestError"; }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getIssuedWorkOrderPreview(input: {
  readonly workOrderId: string;
  readonly revisionId: string;
  readonly scope: WorkspaceApiCompanyScope;
  readonly companyMemberId: string | null;
  readonly correlationId: CorrelationId;
}) {
  if (!UUID.test(input.workOrderId) || !UUID.test(input.revisionId)) throw new WorkOrderPreviewRequestError("NOT_FOUND", 404, "발행된 작업지시서를 찾을 수 없습니다.");
  const scope: TenantMemberScope = {
    mode: "tenant_member",
    companyId: input.scope.companyId as CompanyId,
    companyMemberId: (input.companyMemberId?.trim() || `company-admin:${input.scope.companyId}`) as CompanyMemberId,
    permissionCodes: ["workorder.read"],
    correlationId: input.correlationId,
  };
  const result = await getIssuedWorkOrderPreviewV2({
    scope,
    workOrderId: input.workOrderId as WorkOrderId,
    revisionId: input.revisionId as WorkOrderRevisionId,
    assignedCompanyMemberId: input.scope.visibility?.mode === "assigned" ? input.scope.visibility.companyMemberId : null,
  });
  if (result.reason === "not_issued") throw new WorkOrderPreviewRequestError("DOCUMENT_NOT_READY", 409, "발행 완료된 Revision만 Preview할 수 있습니다.");
  if (!result.data) throw new WorkOrderPreviewRequestError("NOT_FOUND", 404, "발행된 작업지시서를 찾을 수 없습니다.");
  return result;
}
