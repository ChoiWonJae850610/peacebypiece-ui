import { createAttachmentThumbnailFile } from "@/lib/workorder/attachments/attachmentThumbnails";
import { validateAttachmentFile, validateAttachmentFileCount, normalizeAttachmentUploadScope } from "@/lib/workorder/persistence/workOrderAttachmentPolicy";
import type { Attachment, AttachmentScope, UserProfile, WorkOrder } from "@/types/workorder";

export type AttachmentUploadApiResult = {
  attachments: Attachment[];
  error?: string;
  message?: string;
};

export type AttachmentUploadTarget = {
  storageKey: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  uploadUrl: string;
  thumbnailStorageKey?: string | null;
  thumbnailUploadUrl?: string | null;
  thumbnailContentType?: string | null;
  method: "PUT";
  headers: Record<string, string>;
  expiresInSeconds: number;
};

type AttachmentUploadPrepareResult = {
  uploadTargets?: AttachmentUploadTarget[];
  error?: string;
  message?: string;
};

async function readJson<T>(response: Response, fallback: T): Promise<T> {
  return (await response.json().catch(() => fallback)) as T;
}

async function prepareWorkOrderAttachmentUploads(payload: {
  workOrder: Pick<WorkOrder, "id" | "attachments">;
  files: File[];
  scope: AttachmentScope;
}): Promise<AttachmentUploadTarget[]> {
  const response = await fetch("/api/workorders/attachments/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      workOrderId: payload.workOrder.id,
      scope: payload.scope,
      files: payload.files.map((file) => ({
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
      })),
    }),
  });
  const result = await readJson<AttachmentUploadPrepareResult>(response, { uploadTargets: [], error: "INVALID_UPLOAD_PREPARE_RESPONSE" });

  if (!response.ok) {
    throw new Error(result.message || result.error || "ATTACHMENT_UPLOAD_PREPARE_FAILED");
  }

  return Array.isArray(result.uploadTargets) ? result.uploadTargets : [];
}

async function uploadFileThroughServerFallback(file: File, target: Pick<AttachmentUploadTarget, "storageKey">): Promise<void> {
  const formData = new FormData();
  formData.set("storageKey", target.storageKey);
  formData.set("file", file);

  const response = await fetch("/api/workorders/attachments/upload/direct", {
    method: "POST",
    body: formData,
  });
  const result = await readJson<{ error?: string; message?: string }>(response, { error: "INVALID_SERVER_UPLOAD_RESPONSE" });

  if (!response.ok) {
    throw new Error(result.message || result.error || `ATTACHMENT_SERVER_UPLOAD_FAILED:${response.status}`);
  }
}

async function putBlobToUploadUrl(file: File, target: Pick<AttachmentUploadTarget, "uploadUrl" | "method" | "headers" | "storageKey">): Promise<void> {
  const response = await fetch(target.uploadUrl, {
    method: target.method,
    headers: target.headers,
    body: file,
  }).catch(() => null);

  if (response?.ok) {
    return;
  }

  await uploadFileThroughServerFallback(file, target);
}

async function completeWorkOrderAttachmentUploads(payload: {
  workOrder: Pick<WorkOrder, "id" | "attachments">;
  currentUser: Pick<UserProfile, "id" | "name">;
  scope: AttachmentScope;
  uploadTargets: AttachmentUploadTarget[];
}): Promise<Attachment[]> {
  const response = await fetch("/api/workorders/attachments/upload/complete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      workOrderId: payload.workOrder.id,
      ownerId: payload.currentUser.id,
      ownerName: payload.currentUser.name,
      scope: payload.scope,
      uploadTargets: payload.uploadTargets.map((target) => ({
        storageKey: target.storageKey,
        fileName: target.fileName,
        contentType: target.contentType,
        fileSize: target.fileSize,
        thumbnailStorageKey: target.thumbnailStorageKey ?? null,
      })),
    }),
  });
  const result = await readJson<AttachmentUploadApiResult>(response, { attachments: [], error: "INVALID_UPLOAD_COMPLETE_RESPONSE" });

  if (!response.ok) {
    throw new Error(result.message || result.error || "ATTACHMENT_UPLOAD_COMPLETE_FAILED");
  }

  return Array.isArray(result.attachments) ? result.attachments : [];
}

export async function uploadWorkOrderAttachmentFiles(payload: {
  workOrder: Pick<WorkOrder, "id" | "attachments">;
  currentUser: Pick<UserProfile, "id" | "name">;
  files: File[];
  scope: AttachmentScope;
}): Promise<AttachmentUploadApiResult> {
  try {
    const countValidation = validateAttachmentFileCount({
      currentCount: payload.workOrder.attachments?.length ?? 0,
      incomingCount: payload.files.length,
    });
    if (!countValidation.ok) {
      return {
        attachments: [],
        error: countValidation.error,
        message: countValidation.message,
      };
    }

    for (const file of payload.files) {
      const fileValidation = validateAttachmentFile({
        scope: normalizeAttachmentUploadScope(payload.scope),
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        fileSize: file.size,
      });
      if (!fileValidation.ok) {
        return {
          attachments: [],
          error: fileValidation.error,
          message: fileValidation.message,
        };
      }
    }

    const uploadTargets = await prepareWorkOrderAttachmentUploads({
      workOrder: payload.workOrder,
      files: payload.files,
      scope: payload.scope,
    });

    if (uploadTargets.length !== payload.files.length) {
      return {
        attachments: [],
        error: "ATTACHMENT_UPLOAD_TARGET_MISMATCH",
      };
    }

    for (let index = 0; index < payload.files.length; index += 1) {
      const file = payload.files[index];
      const target = uploadTargets[index];
      await putBlobToUploadUrl(file, target);

      const thumbnailFile = await createAttachmentThumbnailFile(file, target);
      if (thumbnailFile && target.thumbnailStorageKey && target.thumbnailUploadUrl) {
        await putBlobToUploadUrl(thumbnailFile, {
          storageKey: target.thumbnailStorageKey,
          uploadUrl: target.thumbnailUploadUrl,
          method: target.method,
          headers: { "Content-Type": target.thumbnailContentType || "image/webp" },
        });
      }
    }

    const attachments = await completeWorkOrderAttachmentUploads({
      workOrder: payload.workOrder,
      currentUser: payload.currentUser,
      scope: payload.scope,
      uploadTargets,
    });

    return { attachments };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Attachment upload failed.";
    return {
      attachments: [],
      error: "ATTACHMENT_UPLOAD_FAILED",
      message,
    };
  }
}
