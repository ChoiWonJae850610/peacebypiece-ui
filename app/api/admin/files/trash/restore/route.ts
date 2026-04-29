import { NextRequest, NextResponse } from "next/server";
import { restoreAttachmentTrashItems } from "@/lib/admin/files/serverActions";

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

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => null)) as RestoreRequest | null;
    const trashItemIds = readStringArray(payload?.trashItemIds);

    if (trashItemIds.length === 0) {
      return NextResponse.json({ ok: false, error: "TRASH_ITEM_IDS_REQUIRED" }, { status: 400 });
    }

    const result = await restoreAttachmentTrashItems({
      trashItemIds,
      actorId: readText(payload?.restoredBy),
    });

    return NextResponse.json({
      ok: true,
      action: "restore",
      requestedCount: result.requestedCount,
      affectedCount: result.affectedCount,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[ADMIN_FILE_TRASH_RESTORE_FAILED]", { message, error });
    return NextResponse.json({ ok: false, error: "ADMIN_FILE_TRASH_RESTORE_FAILED", message }, { status: 500 });
  }
}
