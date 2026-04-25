import { NextRequest, NextResponse } from "next/server";
import { deleteR2Object } from "@/lib/storage/r2/r2Client";
import { deleteR2ObjectViaWorker, isR2WorkerUploadConfigured } from "@/lib/storage/r2/r2WorkerUpload";
import { isSupportedWorkOrderAttachmentStorageKey } from "@/lib/storage/r2/r2Keys";
import { createAttachmentMemoRepository } from "@/lib/workorder/persistence/attachmentMemoAdapter";
import type { AttachmentMemoRepository, AttachmentMemoWritableRepository } from "@/lib/workorder/persistence/attachmentMemoRepository";

export const runtime = "nodejs";

type AttachmentDeleteRequest = {
  attachmentId?: unknown;
};

function isWritableRepository(repository: AttachmentMemoRepository): repository is AttachmentMemoWritableRepository {
  return "softDeleteAttachment" in repository && "getAttachmentById" in repository;
}

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

async function deleteStorageObject(key: string): Promise<"worker" | "sdk"> {
  if (isR2WorkerUploadConfigured()) {
    await deleteR2ObjectViaWorker({ key });
    return "worker";
  }

  await deleteR2Object({ key });
  return "sdk";
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

    let storageDeleteMode: "worker" | "sdk" | "skipped" = "skipped";
    if (target.storage_key && isSupportedWorkOrderAttachmentStorageKey(target.storage_key)) {
      storageDeleteMode = await deleteStorageObject(target.storage_key);
    }

    const deleted = await repository.softDeleteAttachment(attachmentId);
    if (!deleted) {
      return NextResponse.json({ attachmentId: null, error: "ATTACHMENT_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ attachmentId: deleted.id, storageDeleteMode });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Attachment delete failed.";
    console.error("[ATTACHMENT_DELETE_FAILED]", { message, error });
    return NextResponse.json({ attachmentId: null, error: "ATTACHMENT_DELETE_FAILED", message }, { status: 500 });
  }
}
