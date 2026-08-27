import { NextResponse } from "next/server";

import { createWaflApiSuccess } from "@/lib/api/waflApiServer";
import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import { createCommandErrorResponse, mapCommandGuardFailureStatus } from "@/lib/domain/work-orders/command/commandRoute";
import { listCompatibleMeasurementTemplates, readCompatibleMeasurementTemplateContent } from "@/lib/domain/work-orders/measurement/templateRepository";
import { getWorkOrderV2ReadRuntimeGuard } from "@/lib/domain/work-orders/read/runtimeGuard";
import type { CorrelationId } from "@/lib/domain/work-orders/contracts";
import { randomUUID } from "crypto";

type RouteContext = { params: Promise<{ workOrderId: string }> };
export async function GET(request: Request, context: RouteContext): Promise<NextResponse> {
  const correlationId = randomUUID() as CorrelationId;
  if (!getWorkOrderV2ReadRuntimeGuard().ok) return createCommandErrorResponse({ code: "FORBIDDEN", message: "Read API disabled.", status: 403, correlationId });
  const guard = await requireWorkspaceApiGuard({ permissionCode: "workorder.read" });
  if (!guard.ok) return createCommandErrorResponse({ ...mapCommandGuardFailureStatus(guard.response.status), correlationId });
  const url = new URL(request.url);
  const genderCode = url.searchParams.get("genderCode");
  const templateId = url.searchParams.get("templateId")?.trim() || null;
  const { workOrderId } = await context.params;
  if (templateId) {
    const content = await readCompatibleMeasurementTemplateContent({
      scope: { mode: "tenant_member", companyId: guard.scope.companyId as never, companyMemberId: guard.session.companyMemberId as never, permissionCodes: ["workorder.read"], correlationId },
      workOrderId,
      templateId,
      genderCode: genderCode?.trim() || null,
    });
    if (!content) return createCommandErrorResponse({ code: "NOT_FOUND", message: "Requested resource was not found.", status: 404, correlationId });
    return createWaflApiSuccess({ workOrderId, content }, { headers: { "Cache-Control": "no-store", "X-WAFL-Correlation-Id": correlationId } });
  }
  const items = await listCompatibleMeasurementTemplates({
    scope: { mode: "tenant_member", companyId: guard.scope.companyId as never, companyMemberId: guard.session.companyMemberId as never, permissionCodes: ["workorder.read"], correlationId },
    workOrderId,
    genderCode: genderCode?.trim() || null,
  });
  return createWaflApiSuccess({ workOrderId, items }, { headers: { "Cache-Control": "no-store", "X-WAFL-Correlation-Id": correlationId } });
}
