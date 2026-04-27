import { NextRequest, NextResponse } from "next/server";
import { listPurgeReadyAttachmentTrashItems } from "@/lib/admin/adminFiles.serverActions";

export const runtime = "nodejs";

function readLimit(request: NextRequest): number {
  const value = request.nextUrl.searchParams.get("limit");
  const parsed = Number(value ?? 50);
  return Number.isFinite(parsed) ? parsed : 50;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR");
}

export async function GET(request: NextRequest) {
  try {
    const candidates = await listPurgeReadyAttachmentTrashItems(readLimit(request));

    return NextResponse.json({
      ok: true,
      storageDeleteMode: "deferred-worker",
      candidates,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[ADMIN_FILE_PURGE_CANDIDATES_FAILED]", { message, error });
    return NextResponse.json({ ok: false, error: "ADMIN_FILE_PURGE_CANDIDATES_FAILED", message }, { status: 500 });
  }
}
