import "server-only";

import type { WorkspaceApiCompanyScope } from "@/lib/auth/apiRouteGuards";
import type { CompanyId, CompanyMemberId, CorrelationId, TenantMemberScope } from "@/lib/domain/work-orders/contracts";
import { WorkOrderPreviewRequestError } from "@/lib/domain/work-orders/read/previewService";
import { resolveIssuedPreviewTargetV2 } from "@/lib/domain/work-orders/read/previewTargetRepository";

const DOCUMENT_NUMBER = /^([A-Z0-9-]{8,80})-R(\d+)$/;

export async function resolveIssuedPreviewTarget(input: { readonly documentNumber: string; readonly scope: WorkspaceApiCompanyScope; readonly companyMemberId: string | null; readonly correlationId: string }) {
  const normalized = input.documentNumber.trim().toUpperCase();
  const match = DOCUMENT_NUMBER.exec(normalized);
  if (!match) throw new WorkOrderPreviewRequestError("NOT_FOUND", 404, "발행된 작업지시서를 찾을 수 없습니다.");
  const scope: TenantMemberScope = { mode: "tenant_member", companyId: input.scope.companyId as CompanyId, companyMemberId: (input.companyMemberId?.trim() || `company-admin:${input.scope.companyId}`) as CompanyMemberId, permissionCodes: ["workorder.read"], correlationId: input.correlationId as CorrelationId };
  const result = await resolveIssuedPreviewTargetV2({ scope, documentNumberBase: match[1], revisionNumber: Number(match[2]), assignedCompanyMemberId: input.scope.visibility?.mode === "assigned" ? input.scope.visibility.companyMemberId : null });
  if (!result.data) throw new WorkOrderPreviewRequestError("NOT_FOUND", 404, "발행된 작업지시서를 찾을 수 없습니다.");
  return result;
}
