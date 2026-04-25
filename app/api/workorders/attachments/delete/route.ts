import { NextRequest, NextResponse } from "next/server";
import { deleteR2Object } from "@/lib/storage/r2/r2Client";
import { isSupportedWorkOrderAttachmentStorageKey } from "@/lib/storage/r2/r2Keys";
import { createAttachmentMemoRepository } from "@/lib/workorder/persistence/attachmentMemoAdapter";
import type { AttachmentMemoRepository, AttachmentMemoWritableRepository } from "@/lib/workorder/persistence/attachmentMemoRepository";

export const runtime = "nodejs";

type AttachmentDeleteRequest = {
  attachmentId?: unknown;
};

function isWritableRepository(repository: AttachmentMemoRepository): repository is AttachmentMemoWritableRepository {
  return "softDeleteAttachment" in repository;
}

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
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

    const deleted = await repository.softDeleteAttachment(attachmentId);
    if (!deleted) {
      return NextResponse.json({ attachmentId: null, error: "ATTACHMENT_NOT_FOUND" }, { status: 404 });
    }

    if (deleted.storage_key && isSupportedWorkOrderAttachmentStorageKey(deleted.storage_key)) {
      await deleteR2Object({ key: deleted.storage_key });
    }

    return NextResponse.json({ attachmentId: deleted.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Attachment delete failed.";
    console.error("[ATTACHMENT_DELETE_FAILED]", { message, error });
    return NextResponse.json({ attachmentId: null, error: "ATTACHMENT_DELETE_FAILED", message }, { status: 500 });
  }
}
