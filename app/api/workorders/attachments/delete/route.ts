import { NextRequest, NextResponse } from "next/server";
import { deleteR2Object, deleteR2ObjectWithPresignedRequest } from "@/lib/storage/r2/r2Client";
import { deleteR2ObjectViaWorker, isR2WorkerUploadConfigured } from "@/lib/storage/r2/r2WorkerUpload";
import { isSupportedWorkOrderAttachmentStorageKey } from "@/lib/storage/r2/r2Keys";
import { createAttachmentMemoRepository } from "@/lib/workorder/persistence/attachmentMemoAdapter";
import type { AttachmentMemoRepository, AttachmentMemoWritableRepository } from "@/lib/workorder/persistence/attachmentMemoRepository";

export const runtime = "nodejs";

type AttachmentDeleteRequest = {
  attachmentId?: unknown;
};

type StorageDeleteMode = "worker" | "presigned" | "sdk" | "skipped";

function isWritableRepository(repository: AttachmentMemoRepository): repository is AttachmentMemoWritableRepository {
  return "softDeleteAttachment" in repository && "getAttachmentById" in repository;
}

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR");
}

function isWorkerDeleteUnsupported(error: unknown): boolean {
  const message = getErrorMessage(error);
  return /METHOD_NOT_ALLOWED|405|DELETE.*not allowed/i.test(message);
}

async function tryDeleteWithSdk(key: string): Promise<StorageDeleteMode> {
  try {
    await deleteR2Object({ key });
    return "sdk";
  } catch (sdkError) {
    console.warn("[ATTACHMENT_DELETE_SDK_FALLBACK_FAILED]", { key, message: getErrorMessage(sdkError) });
    await deleteR2ObjectWithPresignedRequest({ key });
    return "presigned";
  }
}

async function deleteStorageObject(key: string): Promise<StorageDeleteMode> {
  if (isR2WorkerUploadConfigured()) {
    try {
      await deleteR2ObjectViaWorker({ key });
      return "worker";
    } catch (workerError) {
      console.warn("[ATTACHMENT_DELETE_WORKER_FAILED]", {
        key,
        message: getErrorMessage(workerError),
        fallback: isWorkerDeleteUnsupported(workerError) ? "sdk-or-presigned" : "sdk-or-presigned",
      });
    }
  }

  return tryDeleteWithSdk(key);
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

    const deleted = await repository.softDeleteAttachment(attachmentId);
    if (!deleted) {
      return NextResponse.json({ attachmentId: null, error: "ATTACHMENT_NOT_FOUND" }, { status: 404 });
    }

    let storageDeleteMode: StorageDeleteMode = "skipped";
    let storageDeleteWarning: string | null = null;
    if (target.storage_key && isSupportedWorkOrderAttachmentStorageKey(target.storage_key)) {
      try {
        storageDeleteMode = await deleteStorageObject(target.storage_key);
      } catch (storageError) {
        storageDeleteWarning = getErrorMessage(storageError);
        console.warn("[ATTACHMENT_DELETE_STORAGE_DEFERRED]", {
          attachmentId,
          key: target.storage_key,
          message: storageDeleteWarning,
        });
      }
    }

    return NextResponse.json({ attachmentId: deleted.id, storageDeleteMode, storageDeleteWarning });
  } catch (error) {
    const message = getErrorMessage(error) || "Attachment delete failed.";
    console.error("[ATTACHMENT_DELETE_FAILED]", { message, error });
    return NextResponse.json({ attachmentId: null, error: "ATTACHMENT_DELETE_FAILED", message }, { status: 500 });
  }
}
