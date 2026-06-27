import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import { MEMBER_PERMISSION_CODE } from "@/lib/permissions";
import { WORKORDER_SERVICE_CODE } from "@/lib/constants/workorderServiceCodes";
import { WORKORDER_SERVICE_OPERATION, WORKORDER_SERVICE_RESOURCE } from "@/lib/workorder/serviceCodeSideEffects";
import { assertServiceCanUseSideEffect } from "@/lib/workorder/serviceCodeGuards";
import { purgeWorkOrderTrashBundle } from "@/lib/admin/files/serverActions";
import { createAdminTrashActionMessage } from "@/lib/admin/files/presentation";
import { requireAdminFileCompanyScope } from "@/lib/admin/files/sessionScope";

export const runtime = "nodejs";

type WorkOrderPurgeRequest = {
  workOrderId?: unknown;
  purgedBy?: unknown;
};

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR");
}

export async function POST(request: NextRequest) {
  const guard = await requireWorkspaceApiGuard({
    permissionCode: MEMBER_PERMISSION_CODE.storageDeleteRequest,
  });
  if (!guard.ok) return guard.response;

  const scopeResult = await requireAdminFileCompanyScope();
  if (!scopeResult.ok) return scopeResult.response;

  try {
    assertServiceCanUseSideEffect({
      serviceCode: WORKORDER_SERVICE_CODE.trashPurge,
      resource: WORKORDER_SERVICE_RESOURCE.workOrders,
      operation: WORKORDER_SERVICE_OPERATION.delete,
    });

    const { companyId } = scopeResult.companyScope;
    const payload = (await request.json().catch(() => null)) as WorkOrderPurgeRequest | null;
    const result = await purgeWorkOrderTrashBundle({
      companyId,
      workOrderId: readText(payload?.workOrderId) ?? "",
      actorId: readText(payload?.purgedBy),
    });

    const status = result.ok
      ? 200
      : result.reason === "WORKORDER_ID_REQUIRED"
        ? 400
        : result.reason === "WORKORDER_NOT_FOUND"
          ? 404
          : 409;

    return NextResponse.json(
      {
        ok: result.ok,
        action: result.action,
        workOrderId: result.workOrderId,
        requestedCount: result.requestedCount,
        affectedCount: result.affectedCount,
        attachmentCount: result.attachmentCount ?? 0,
        documentCount: result.documentCount ?? result.attachmentCount ?? 0,
        designCount: result.designCount ?? 0,
        reason: result.reason,
        message: result.ok
          ? createAdminTrashActionMessage("purge", {
              workOrderCount: result.affectedCount,
              documentCount: result.documentCount ?? result.attachmentCount ?? 0,
              designCount: result.designCount ?? 0,
            })
          : result.message,
        storageDeleteMode: "deferred-system-purge",
      },
      { status },
    );
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[ADMIN_WORKORDER_TRASH_PURGE_FAILED]", { message, error });
    return NextResponse.json({ ok: false, error: "ADMIN_WORKORDER_TRASH_PURGE_FAILED", message }, { status: 500 });
  }
}
