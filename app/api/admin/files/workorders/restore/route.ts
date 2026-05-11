import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/permissions";
import { restoreWorkOrderTrashBundle } from "@/lib/admin/files/serverActions";
import { createAdminTrashActionMessage } from "@/lib/admin/files/presentation";
import { WORKSPACE_COMPANY_ID } from "@/lib/constants/company";
import { createSystemAuditLogSafe } from "@/lib/system/audit/repository";
import { buildWorkOrderRestoredAuditLog } from "@/lib/system/audit/writeActions";

export const runtime = "nodejs";

type WorkOrderRestoreRequest = {
  workOrderId?: unknown;
  restoredBy?: unknown;
};

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR");
}

function getAuditRequestId(request: NextRequest): string | null {
  return request.headers.get("x-request-id") || request.headers.get("x-vercel-id") || null;
}

function getAuditIpAddress(request: NextRequest): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",")[0]?.trim();
  return firstForwardedIp || request.headers.get("x-real-ip") || null;
}

export async function POST(request: NextRequest) {
  const permissionDenied = requireApiPermission(request, {
    permissionCode: "workorder.restore",
    routeLabel: "admin.files.workorders.restore",
  });
  if (permissionDenied) return permissionDenied;

  try {
    const payload = (await request.json().catch(() => null)) as WorkOrderRestoreRequest | null;
    const actorId = readText(payload?.restoredBy);
    const result = await restoreWorkOrderTrashBundle({
      workOrderId: readText(payload?.workOrderId) ?? "",
      actorId,
    });

    const restoredWorkOrderId = result.workOrderId;

    if (result.ok && restoredWorkOrderId) {
      await createSystemAuditLogSafe(
        buildWorkOrderRestoredAuditLog({
          workOrderId: restoredWorkOrderId,
          actorId,
          companyId: WORKSPACE_COMPANY_ID,
          affectedCount: result.affectedCount,
          documentCount: result.documentCount ?? result.attachmentCount ?? 0,
          designCount: result.designCount ?? 0,
          memoCount: result.memoCount ?? 0,
          requestId: getAuditRequestId(request),
          ipAddress: getAuditIpAddress(request),
        }),
      );
    }

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
        memoCount: result.memoCount ?? 0,
        reason: result.reason,
        message: result.ok
          ? createAdminTrashActionMessage("restore", {
              workOrderCount: result.affectedCount,
              documentCount: result.documentCount ?? result.attachmentCount ?? 0,
              designCount: result.designCount ?? 0,
              memoCount: result.memoCount ?? 0,
            })
          : result.message,
      },
      { status: result.ok ? 200 : result.reason === "WORKORDER_ID_REQUIRED" ? 400 : 404 },
    );
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[ADMIN_WORKORDER_TRASH_RESTORE_PREVIEW_FAILED]", { message, error });
    return NextResponse.json({ ok: false, error: "ADMIN_WORKORDER_TRASH_RESTORE_PREVIEW_FAILED", message }, { status: 500 });
  }
}
