import type { Attachment, AttachmentScope, UserProfile, WorkOrder } from "@/types/workorder";

export type AttachmentUploadApiResult = {
  attachments: Attachment[];
  error?: string;
  message?: string;
};

type AttachmentUploadTarget = {
  storageKey: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  uploadUrl: string;
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
  workOrder: Pick<WorkOrder, "id">;
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

async function putFileToUploadTarget(file: File, target: AttachmentUploadTarget): Promise<void> {
  const response = await fetch(target.uploadUrl, {
    method: target.method,
    headers: target.headers,
    body: file,
  });

  if (!response.ok) {
    throw new Error(`ATTACHMENT_DIRECT_UPLOAD_FAILED:${response.status}`);
  }
}

async function completeWorkOrderAttachmentUploads(payload: {
  workOrder: Pick<WorkOrder, "id">;
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
  workOrder: Pick<WorkOrder, "id">;
  currentUser: Pick<UserProfile, "id" | "name">;
  files: File[];
  scope: AttachmentScope;
}): Promise<AttachmentUploadApiResult> {
  try {
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
      await putFileToUploadTarget(payload.files[index], uploadTargets[index]);
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
