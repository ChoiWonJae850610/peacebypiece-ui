import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import { MEMBER_PERMISSION_CODE } from "@/lib/permissions";
import { WORKORDER_SERVICE_CODE } from "@/lib/constants/workorderServiceCodes";
import { WORKORDER_SERVICE_OPERATION, WORKORDER_SERVICE_RESOURCE } from "@/lib/workorder/serviceCodeSideEffects";
import { assertServiceCanUseSideEffect } from "@/lib/workorder/serviceCodeGuards";
import { restoreAttachmentTrashItems } from "@/lib/admin/files/serverActions";
import { createAdminTrashActionMessage } from "@/lib/admin/files/presentation";
import { requireAdminFileCompanyScope } from "@/lib/admin/files/sessionScope";
import { createSystemAuditLogSafe } from "@/lib/system/audit/repository";
import { buildAttachmentRestoredAuditLog } from "@/lib/system/audit/writeActions";

export const runtime = "nodejs";

type RestoreRequest = {
  trashItemIds?: unknown;
  restoredBy?: unknown;
};

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

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
  const guard = await requireWorkspaceApiGuard({
    permissionCode: MEMBER_PERMISSION_CODE.storageRestore,
  });
  if (!guard.ok) return guard.response;

  const scopeResult = await requireAdminFileCompanyScope();
  if (!scopeResult.ok) return scopeResult.response;

  try {
    const payload = (await request.json().catch(() => null)) as RestoreRequest | null;
    const trashItemIds = readStringArray(payload?.trashItemIds);

    if (trashItemIds.length === 0) {
      return NextResponse.json({ ok: false, error: "TRASH_ITEM_IDS_REQUIRED" }, { status: 400 });
    }

    assertServiceCanUseSideEffect({
      serviceCode: WORKORDER_SERVICE_CODE.attachmentRestore,
      resource: WORKORDER_SERVICE_RESOURCE.attachments,
      operation: WORKORDER_SERVICE_OPERATION.restore,
    });

    const actorId = readText(payload?.restoredBy);
    const { companyId } = scopeResult.companyScope;
    const result = await restoreAttachmentTrashItems({
      companyId,
      trashItemIds,
      actorId,
    });

    const ok = result.affectedCount > 0;
    if (ok) {
      await createSystemAuditLogSafe(
        buildAttachmentRestoredAuditLog({
          actorId,
          companyId,
          requestedCount: result.requestedCount,
          affectedCount: result.affectedCount,
          documentCount: result.documentCount,
          designCount: result.designCount,
          requestId: getAuditRequestId(request),
          ipAddress: getAuditIpAddress(request),
        }),
      );
    }

    return NextResponse.json(
      {
        ok,
        action: "restore",
        requestedCount: result.requestedCount,
        affectedCount: result.affectedCount,
        documentCount: result.documentCount,
        designCount: result.designCount,
        message: createAdminTrashActionMessage("restore", {
          workOrderCount: 0,
          documentCount: result.documentCount,
          designCount: result.designCount,
        }),
      },
      { status: ok ? 200 : 409 },
    );
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[ADMIN_FILE_TRASH_RESTORE_FAILED]", { message, error });
    return NextResponse.json({ ok: false, error: "ADMIN_FILE_TRASH_RESTORE_FAILED", message }, { status: 500 });
  }
}
