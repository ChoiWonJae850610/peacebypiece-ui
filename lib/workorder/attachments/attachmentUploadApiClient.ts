import type { Attachment, AttachmentScope, UserProfile, WorkOrder } from "@/types/workorder";

export type AttachmentUploadApiResult = {
  attachments: Attachment[];
  error?: string;
  message?: string;
};

export async function uploadWorkOrderAttachmentFiles(payload: {
  workOrder: Pick<WorkOrder, "id">;
  currentUser: Pick<UserProfile, "id" | "name">;
  files: File[];
  scope: AttachmentScope;
}): Promise<AttachmentUploadApiResult> {
  const formData = new FormData();
  formData.append("workOrderId", payload.workOrder.id);
  formData.append("ownerId", payload.currentUser.id);
  formData.append("ownerName", payload.currentUser.name);
  formData.append("scope", payload.scope);

  for (const file of payload.files) {
    formData.append("files", file, file.name);
  }

  const response = await fetch("/api/workorders/attachments/upload", {
    method: "POST",
    body: formData,
  });
  const result = (await response.json().catch(() => ({ attachments: [], error: "INVALID_UPLOAD_RESPONSE" }))) as AttachmentUploadApiResult;

  if (!response.ok) {
    return {
      attachments: [],
      error: result.error ?? "ATTACHMENT_UPLOAD_FAILED",
      message: result.message,
    };
  }

  return {
    attachments: Array.isArray(result.attachments) ? result.attachments : [],
  };
}
