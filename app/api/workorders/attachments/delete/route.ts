import { NextRequest, NextResponse } from "next/server";
import { deleteR2ObjectViaWorker, isR2WorkerUploadConfigured } from "@/lib/storage/r2/r2WorkerUpload";
import { isSupportedWorkOrderAttachmentStorageKey } from "@/lib/storage/r2/r2Keys";
import { createAttachmentMemoRepository } from "@/lib/workorder/persistence/attachmentMemoAdapter";
import type { AttachmentMemoRepository, AttachmentMemoWritableRepository } from "@/lib/workorder/persistence/attachmentMemoRepository";

export const runtime = "nodejs";

type AttachmentDeleteRequest = {
  attachmentId?: unknown;
};

type StorageDeleteMode = "worker" | "skipped";

function isWritableRepository(repository: AttachmentMemoRepository): repository is AttachmentMemoWritableRepository {
  return "softDeleteAttachment" in repository && "getAttachmentById" in repository;
}

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR");
}

function createDeleteFailureResponse(input: { attachmentId: string; message: string }) {
  return NextResponse.json(
    {
      attachmentId: input.attachmentId,
      error: "ATTACHMENT_STORAGE_DELETE_FAILED",
      message: input.message,
    },
    { status: 502 },
  );
}

async function deleteStorageObjectWithWorker(key: string): Promise<StorageDeleteMode> {
  if (!isR2WorkerUploadConfigured()) {
    throw new Error("R2_WORKER_UPLOAD_NOT_CONFIGURED");
  }

  await deleteR2ObjectViaWorker({ key });
  return "worker";
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

    let storageDeleteMode: StorageDeleteMode = "skipped";
    if (target.storage_key && isSupportedWorkOrderAttachmentStorageKey(target.storage_key)) {
      try {
        storageDeleteMode = await deleteStorageObjectWithWorker(target.storage_key);
      } catch (storageError) {
        const message = getErrorMessage(storageError);
        console.warn("[ATTACHMENT_DELETE_WORKER_REQUIRED_FAILED]", {
          attachmentId,
          key: target.storage_key,
          message,
        });
        return createDeleteFailureResponse({ attachmentId, message });
      }
    }

    const deleted = await repository.softDeleteAttachment(attachmentId);
    if (!deleted) {
      return NextResponse.json({ attachmentId: null, error: "ATTACHMENT_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ attachmentId: deleted.id, storageDeleteMode });
  } catch (error) {
    const message = getErrorMessage(error) || "Attachment delete failed.";
    console.error("[ATTACHMENT_DELETE_FAILED]", { message, error });
    return NextResponse.json({ attachmentId: null, error: "ATTACHMENT_DELETE_FAILED", message }, { status: 500 });
  }
}
