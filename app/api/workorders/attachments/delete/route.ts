import { NextRequest, NextResponse } from "next/server";
import { deleteCachedR2UrlsByKey } from "@/lib/storage/r2/r2UrlCache";
import { createAttachmentMemoRepository } from "@/lib/workorder/persistence/attachmentMemoAdapter";
import type { AttachmentMemoRepository, AttachmentMemoWritableRepository } from "@/lib/workorder/persistence/attachmentMemoRepository";

export const runtime = "nodejs";

type AttachmentDeleteRequest = {
  attachmentId?: unknown;
  deletedBy?: unknown;
  deleteReason?: unknown;
};

function isWritableRepository(repository: AttachmentMemoRepository): repository is AttachmentMemoWritableRepository {
  return "softDeleteAttachment" in repository && "getAttachmentById" in repository;
}

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR");
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => null)) as AttachmentDeleteRequest | null;
    const attachmentId = readText(payload?.attachmentId);

    if (!attachmentId) {
      return NextResponse.json({ attachmentId: null, error: "ATTACHMENT_ID_REQUIRED" }, { status: 400 });
    }

    const repository = await createAttachmentMemoRepository();
    if (!isWritableRepository(repository)) {
      return NextResponse.json({ attachmentId: null, error: "ATTACHMENT_REPOSITORY_WRITE_UNSUPPORTED" }, { status: 503 });
    }

    const target = await repository.getAttachmentById(attachmentId);
    if (!target || target.is_active === false || target.deleted_at) {
      return NextResponse.json({ attachmentId: null, error: "ATTACHMENT_NOT_FOUND" }, { status: 404 });
    }

    const deleted = await repository.softDeleteAttachment({
      attachmentId,
      deletedBy: readText(payload?.deletedBy),
      deleteReason: readText(payload?.deleteReason),
    });

    if (!deleted) {
      return NextResponse.json({ attachmentId: null, error: "ATTACHMENT_NOT_FOUND" }, { status: 404 });
    }

    if (target.storage_key) {
      deleteCachedR2UrlsByKey(target.storage_key);
    }

    return NextResponse.json({
      attachmentId: deleted.id,
      trashMode: "soft-delete",
      storageDeleteMode: "deferred",
    });
  } catch (error) {
    const message = getErrorMessage(error) || "Attachment delete failed.";
    console.error("[ATTACHMENT_TRASH_MOVE_FAILED]", { message, error });
    return NextResponse.json({ attachmentId: null, error: "ATTACHMENT_TRASH_MOVE_FAILED", message }, { status: 500 });
  }
}
