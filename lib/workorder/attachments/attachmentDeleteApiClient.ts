export type AttachmentDeleteApiResult = {
  attachmentId: string | null;
  error?: string;
  message?: string;
};

async function readJson<T>(response: Response, fallback: T): Promise<T> {
  return (await response.json().catch(() => fallback)) as T;
}

export async function deleteWorkOrderAttachmentInDb(attachmentId: string): Promise<string> {
  const response = await fetch("/api/workorders/attachments/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ attachmentId }),
  });

  const result = await readJson<AttachmentDeleteApiResult>(response, { attachmentId: null, error: "INVALID_ATTACHMENT_DELETE_RESPONSE" });

  if (!response.ok) {
    throw new Error(result.message || result.error || "ATTACHMENT_DELETE_FAILED");
  }

  if (!result.attachmentId) {
    throw new Error("ATTACHMENT_DELETE_RESPONSE_MISSING");
  }

  return result.attachmentId;
}
