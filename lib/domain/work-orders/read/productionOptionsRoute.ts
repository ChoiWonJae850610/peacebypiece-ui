import "server-only";

import { randomUUID } from "crypto";
import { createWaflApiSuccess } from "@/lib/api/waflApiServer";
import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import { createCommandErrorResponse, mapCommandGuardFailureStatus } from "@/lib/domain/work-orders/command/commandRoute";
import { createCommandTenantScope } from "@/lib/domain/work-orders/command/commandService";
import type { CorrelationId, WorkOrderId } from "@/lib/domain/work-orders/contracts";
import { listWorkOrderProductionOptions } from "@/lib/domain/work-orders/read/productionOptionsRepository";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

export async function handleListProductionOptions(workOrderId: string) {
  const correlationId = randomUUID() as CorrelationId;
  if (!UUID.test(workOrderId)) return createCommandErrorResponse({ code: "NOT_FOUND", status: 404, message: "작업지시서를 찾을 수 없습니다.", correlationId });
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.read" });
  if (!guard.ok) return createCommandErrorResponse({ ...mapCommandGuardFailureStatus(guard.response.status), correlationId });
  const scope = createCommandTenantScope({ scope: guard.scope, companyMemberId: guard.session.companyMemberId, correlationId, permissionCode: "workorder.read" });
  const assignedCompanyMemberId = guard.scope.visibility?.mode === "assigned" ? guard.scope.visibility.companyMemberId : null;
  const data = await listWorkOrderProductionOptions({ scope, workOrderId: workOrderId as WorkOrderId, assignedCompanyMemberId });
  if (!data) return createCommandErrorResponse({ code: "NOT_FOUND", status: 404, message: "작업지시서를 찾을 수 없습니다.", correlationId });
  return createWaflApiSuccess(data, { headers: { "Cache-Control": "no-store", "X-WAFL-Correlation-Id": correlationId } });
}
