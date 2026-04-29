import { NextRequest, NextResponse } from "next/server";
import { requestPurgeAttachmentTrashItems } from "@/lib/admin/files/serverActions";

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
  try {
    const payload = (await request.json().catch(() => null)) as PurgeRequest | null;
    const trashItemIds = readStringArray(payload?.trashItemIds);

    if (trashItemIds.length === 0) {
      return NextResponse.json({ ok: false, error: "TRASH_ITEM_IDS_REQUIRED" }, { status: 400 });
    }

    const result = await requestPurgeAttachmentTrashItems({ trashItemIds });

    return NextResponse.json({
      ok: true,
      action: "purge-request",
      requestedCount: result.requestedCount,
      affectedCount: result.affectedCount,
      storageDeleteMode: "deferred-worker",
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[ADMIN_FILE_TRASH_PURGE_FAILED]", { message, error });
    return NextResponse.json({ ok: false, error: "ADMIN_FILE_TRASH_PURGE_FAILED", message }, { status: 500 });
  }
}
