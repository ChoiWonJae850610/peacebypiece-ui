import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/permissions";
import { WORKORDER_SERVICE_CODE } from "@/lib/constants/workorderServiceCodes";
import { WORKORDER_SERVICE_OPERATION, WORKORDER_SERVICE_RESOURCE } from "@/lib/workorder/serviceCodeSideEffects";
import { assertServiceCanUseSideEffect } from "@/lib/workorder/serviceCodeGuards";
import { requestPurgeAttachmentTrashItems } from "@/lib/admin/files/serverActions";
import { createAdminTrashActionMessage } from "@/lib/admin/files/presentation";
import { requireAdminFileCompanyScope } from "@/lib/admin/files/sessionScope";

export const runtime = "nodejs";

type PurgeRequest = {
  trashItemIds?: unknown;
};

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR");
}

export async function POST(request: NextRequest) {
  const permissionDenied = requireApiPermission(request, {
    permissionCode: "storage.delete.request",
    routeLabel: "admin.files.trash.purgeRequest",
  });
  if (permissionDenied) return permissionDenied;

  const scopeResult = await requireAdminFileCompanyScope();
  if (!scopeResult.ok) return scopeResult.response;

  try {
    const payload = (await request.json().catch(() => null)) as PurgeRequest | null;
    const trashItemIds = readStringArray(payload?.trashItemIds);

    if (trashItemIds.length === 0) {
      return NextResponse.json({ ok: false, error: "TRASH_ITEM_IDS_REQUIRED" }, { status: 400 });
    }

    assertServiceCanUseSideEffect({
      serviceCode: WORKORDER_SERVICE_CODE.trashPurge,
      resource: WORKORDER_SERVICE_RESOURCE.attachments,
      operation: WORKORDER_SERVICE_OPERATION.delete,
    });

    const { companyId, userId } = scopeResult.companyScope;
    const result = await requestPurgeAttachmentTrashItems({
      companyId,
      trashItemIds,
      actorId: userId,
    });

    const ok = result.affectedCount > 0;
    return NextResponse.json(
      {
        ok,
        action: "purge-request",
        requestedCount: result.requestedCount,
        affectedCount: result.affectedCount,
        documentCount: result.documentCount,
        designCount: result.designCount,
        storageDeleteMode: "deferred-worker",
        message: createAdminTrashActionMessage("purge", {
          workOrderCount: 0,
          documentCount: result.documentCount,
          designCount: result.designCount,
          memoCount: 0,
        }),
      },
      { status: ok ? 200 : 409 },
    );
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[ADMIN_FILE_TRASH_PURGE_FAILED]", { message, error });
    return NextResponse.json({ ok: false, error: "ADMIN_FILE_TRASH_PURGE_FAILED", message }, { status: 500 });
  }
}
