export async function setPrimaryDesignAttachmentInDb(input: {
  workOrderId: string;
  attachmentId: string;
}): Promise<void> {
  const response = await fetch("/api/workorders/attachments/primary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const result = await response.json().catch(() => null) as { error?: string; message?: string } | null;
  if (!response.ok) {
    throw new Error(result?.message || result?.error || "PRIMARY_DESIGN_ATTACHMENT_UPDATE_FAILED");
  }
}
