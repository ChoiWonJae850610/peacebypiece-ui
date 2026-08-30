import type { WorkOrderAttachmentCommandResult, WorkOrderImageUploadTarget } from "@/domain/mobileContract";
import { MobileApiError } from "@/domain/mobileContract";
import { isJsonObject } from "../apiResponseNormalizer";
import { requestJson } from "../apiTransport";

export async function prepareWorkOrderAttachmentUpload(
  workOrderId: string,
  file: { readonly name: string; readonly type: string; readonly size: number },
): Promise<WorkOrderImageUploadTarget> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: unknown }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/attachments/upload`,
    { method: "POST", body: { file } },
  );
  const data = isJsonObject(body.data) ? body.data : null;
  const target = data && isJsonObject(data.uploadTarget) ? data.uploadTarget : null;
  if (
    !body.ok
    || !target
    || typeof target.storageKey !== "string"
    || typeof target.fileName !== "string"
    || typeof target.contentType !== "string"
    || !Number.isSafeInteger(target.fileSize)
    || typeof target.uploadUrl !== "string"
    || target.method !== "PUT"
    || !isJsonObject(target.headers)
  ) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "첨부 업로드 준비 응답이 올바르지 않습니다." });
  }
  return {
    storageKey: target.storageKey,
    fileName: target.fileName,
    contentType: target.contentType,
    fileSize: Number(target.fileSize),
    uploadUrl: target.uploadUrl,
    method: "PUT",
    headers: Object.fromEntries(Object.entries(target.headers).map(([key, value]) => [key, String(value)])),
    expiresInSeconds: Number(target.expiresInSeconds ?? 0),
  };
}

export async function completeWorkOrderAttachmentUpload(
  workOrderId: string,
  input: {
    readonly expectedVersion: number;
    readonly clientRequestId: string;
    readonly idempotencyKey: string;
    readonly uploadTarget: WorkOrderImageUploadTarget;
  },
): Promise<WorkOrderAttachmentCommandResult> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: WorkOrderAttachmentCommandResult }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/attachments/upload/complete`,
    {
      method: "POST",
      idempotencyKey: input.idempotencyKey,
      body: {
        expectedVersion: input.expectedVersion,
        clientRequestId: input.clientRequestId,
        uploadTarget: input.uploadTarget,
      },
    },
  );
  if (!body.ok || !body.data || body.data.workOrderId !== workOrderId || !Number.isSafeInteger(body.data.nextVersion)) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "첨부 업로드 완료 응답이 올바르지 않습니다." });
  }
  return body.data;
}

export async function deleteWorkOrderAttachment(
  workOrderId: string,
  attachmentId: string,
  input: { readonly expectedVersion: number; readonly clientRequestId: string; readonly idempotencyKey: string },
): Promise<WorkOrderAttachmentCommandResult> {
  const body = await requestJson<{ readonly ok: boolean; readonly data?: WorkOrderAttachmentCommandResult }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/attachments/${encodeURIComponent(attachmentId)}/delete`,
    {
      method: "POST",
      idempotencyKey: input.idempotencyKey,
      body: { expectedVersion: input.expectedVersion, clientRequestId: input.clientRequestId },
    },
  );
  if (!body.ok || !body.data || body.data.workOrderId !== workOrderId || body.data.attachmentId !== attachmentId
    || !Number.isSafeInteger(body.data.nextVersion)) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "첨부 삭제 응답이 올바르지 않습니다." });
  }
  return body.data;
}

export async function issueWorkOrderAttachmentPreview(
  workOrderId: string,
  attachmentId: string,
): Promise<{ readonly previewUrl: string; readonly expiresAt: string; readonly expiresInSeconds: number }> {
  const body = await requestJson<{
    readonly ok: boolean;
    readonly data?: { readonly previewUrl?: unknown; readonly expiresAt?: unknown; readonly expiresInSeconds?: unknown };
  }>(
    `/api/v2/work-orders/${encodeURIComponent(workOrderId)}/attachments/${encodeURIComponent(attachmentId)}/preview`,
    { method: "POST" },
  );
  if (
    !body.ok
    || typeof body.data?.previewUrl !== "string"
    || !body.data.previewUrl.startsWith("/api/v2/work-orders/attachments/preview?token=")
    || typeof body.data.expiresAt !== "string"
    || !Number.isSafeInteger(body.data.expiresInSeconds)
  ) {
    throw new MobileApiError({ code: "MALFORMED_RESPONSE", message: "첨부파일 미리보기 응답이 올바르지 않습니다." });
  }
  return {
    previewUrl: body.data.previewUrl,
    expiresAt: body.data.expiresAt,
    expiresInSeconds: Number(body.data.expiresInSeconds),
  };
}
