import { NextRequest, NextResponse } from "next/server";
import { previewPurgeWorkOrderTrashBundle } from "@/lib/admin/files/serverActions";

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
  try {
    const payload = (await request.json().catch(() => null)) as WorkOrderPurgeRequest | null;
    const result = await previewPurgeWorkOrderTrashBundle({
      workOrderId: readText(payload?.workOrderId) ?? "",
      actorId: readText(payload?.purgedBy),
    });

    return NextResponse.json(
      {
        ok: result.ok,
        action: result.action,
        workOrderId: result.workOrderId,
        requestedCount: result.requestedCount,
        affectedCount: result.affectedCount,
        reason: result.reason,
        message: result.message,
        storageDeleteMode: "deferred-worker",
      },
      { status: result.reason === "WORKORDER_ID_REQUIRED" ? 400 : 409 },
    );
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[ADMIN_WORKORDER_TRASH_PURGE_PREVIEW_FAILED]", { message, error });
    return NextResponse.json({ ok: false, error: "ADMIN_WORKORDER_TRASH_PURGE_PREVIEW_FAILED", message }, { status: 500 });
  }
}
