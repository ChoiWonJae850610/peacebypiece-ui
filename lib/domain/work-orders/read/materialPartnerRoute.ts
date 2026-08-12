import "server-only";

import { randomUUID } from "crypto";

import { createWaflApiSuccess } from "@/lib/api/waflApiServer";
import { requireWorkspaceApiGuard, type WorkspaceApiCompanyScope } from "@/lib/auth/apiRouteGuards";
import { createCommandErrorResponse, mapCommandGuardFailureStatus } from "@/lib/domain/work-orders/command/commandRoute";
import { createCommandTenantScope } from "@/lib/domain/work-orders/command/commandService";
import type { CorrelationId } from "@/lib/domain/work-orders/contracts";
import { listWorkOrderMaterialPartnerOptions } from "@/lib/domain/work-orders/read/materialPartnerRepository";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

function assignedMemberId(scope: WorkspaceApiCompanyScope) {
  return scope.visibility?.mode === "assigned" ? scope.visibility.companyMemberId : null;
}

export async function handleListMaterialPartners(workOrderId: string) {
  const correlationId = randomUUID() as CorrelationId;
  if (!UUID.test(workOrderId)) return createCommandErrorResponse({ code: "NOT_FOUND", status: 404, message: "작업지시서를 찾을 수 없습니다.", correlationId });
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.read" });
  if (!guard.ok) return createCommandErrorResponse({ ...mapCommandGuardFailureStatus(guard.response.status), correlationId });
  const scope = createCommandTenantScope({ scope: guard.scope, companyMemberId: guard.session.companyMemberId, correlationId, permissionCode: "workorder.read" });
  const data = await listWorkOrderMaterialPartnerOptions({ scope, workOrderId, assignedCompanyMemberId: assignedMemberId(guard.scope) });
  if (!data) return createCommandErrorResponse({ code: "NOT_FOUND", status: 404, message: "작업지시서를 찾을 수 없습니다.", correlationId });
  return createWaflApiSuccess(data, { headers: { "Cache-Control": "no-store", "X-WAFL-Correlation-Id": correlationId } });
}
