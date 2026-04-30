import { NextRequest, NextResponse } from "next/server";
import { createAttachmentFileProxyUrl } from "@/lib/storage/r2/r2Client";
import { deleteCachedR2UrlsByKey } from "@/lib/storage/r2/r2UrlCache";
import { isSupportedWorkOrderAttachmentStorageKey, isWorkOrderAttachmentStorageKeyForScope } from "@/lib/storage/r2/r2Keys";
import { createAttachmentMemoRepository } from "@/lib/workorder/persistence/attachmentMemoAdapter";
import { createAdminHistoryLogSafe } from "@/lib/admin/history/repository";
import { WORKSPACE_COMPANY_ID } from "@/lib/constants/company";
import { normalizeAttachmentUploadScope, validateAttachmentFile, validateAttachmentFileCount } from "@/lib/workorder/persistence/workOrderAttachmentPolicy";
import type { AttachmentMemoRepository, AttachmentMemoWritableRepository } from "@/lib/workorder/persistence/attachmentMemoRepository";
import { inferAttachmentTypeFromMime } from "@/lib/workorder/persistence/attachmentMemoTypes";
import type { Attachment, AttachmentScope } from "@/types/workorder";

export const runtime = "nodejs";

type CompleteUploadTargetInput = {
  storageKey?: unknown;
  fileName?: unknown;
  contentType?: unknown;
  fileSize?: unknown;
};

type CompleteUploadRequest = {
  workOrderId?: unknown;
  ownerId?: unknown;
  ownerName?: unknown;
  scope?: unknown;
  uploadTargets?: unknown;
};

function isWritableRepository(repository: AttachmentMemoRepository): repository is AttachmentMemoWritableRepository {
  return "createAttachment" in repository;
}

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeScope(value: unknown): AttachmentScope {
  return normalizeAttachmentUploadScope(value);
}

function normalizeUploadTarget(input: CompleteUploadTargetInput, context: { workOrderId: string; scope: AttachmentScope }) {
  const storageKey = readText(input.storageKey);
  const fileName = readText(input.fileName);
  const contentType = readText(input.contentType);
  const fileSize = typeof input.fileSize === "number" && Number.isFinite(input.fileSize) ? input.fileSize : null;

  if (!storageKey || !fileName || !isSupportedWorkOrderAttachmentStorageKey(storageKey)) return null;
  if (!isWorkOrderAttachmentStorageKeyForScope({ key: storageKey, workOrderId: context.workOrderId, scope: context.scope })) return null;

  return {
    storageKey,
    fileName,
    contentType,
    fileSize,
  };
}

function createUploadAttachment(input: {
  id: string;
  fileName: string;
  contentType: string | null;
  scope: AttachmentScope;
  ownerId: string | null;
  ownerName: string | null;
  storageKey: string;
  isPrimary?: boolean | null;
}): Attachment {
  return {
    id: input.id,
    name: input.fileName,
    type: inferAttachmentTypeFromMime(input.contentType, input.fileName),
    url: createAttachmentFileProxyUrl(input.storageKey),
    storageKey: input.storageKey,
    thumbnailKey: null,
    thumbnailUrl: null,
    previewUrl: createAttachmentFileProxyUrl(input.storageKey),
    scope: input.scope,
    ownerId: input.ownerId,
    ownerName: input.ownerName,
    isPrimary: input.isPrimary === true,
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => null)) as CompleteUploadRequest | null;
    const workOrderId = readText(payload?.workOrderId);
    const ownerId = readText(payload?.ownerId);
    const ownerName = readText(payload?.ownerName);
    const scope = normalizeScope(payload?.scope);
    const rawUploadTargets = Array.isArray(payload?.uploadTargets) ? payload.uploadTargets : [];

    if (!workOrderId) {
      return NextResponse.json({ attachments: [], error: "WORK_ORDER_ID_REQUIRED" }, { status: 400 });
    }

    const uploadTargets = rawUploadTargets
      .map((item) => normalizeUploadTarget(item as CompleteUploadTargetInput, { workOrderId, scope }))
      .filter((item): item is NonNullable<ReturnType<typeof normalizeUploadTarget>> => item !== null);

    if (uploadTargets.length === 0) {
      return NextResponse.json({ attachments: [], error: "UPLOAD_TARGETS_REQUIRED" }, { status: 400 });
    }

    const repository = await createAttachmentMemoRepository();
    if (!isWritableRepository(repository)) {
      return NextResponse.json({ attachments: [], error: "ATTACHMENT_REPOSITORY_WRITE_UNSUPPORTED" }, { status: 503 });
    }

    const currentCount = await repository.countActiveAttachmentsByWorkOrderId(workOrderId);
    const countValidation = validateAttachmentFileCount({ currentCount, incomingCount: uploadTargets.length });
    if (!countValidation.ok) {
      return NextResponse.json({ attachments: [], error: countValidation.error, message: countValidation.message }, { status: 400 });
    }

    for (const target of uploadTargets) {
      const fileValidation = validateAttachmentFile({
        scope: normalizeAttachmentUploadScope(scope),
        fileName: target.fileName,
        contentType: target.contentType || "application/octet-stream",
        fileSize: target.fileSize ?? 0,
      });
      if (!fileValidation.ok) {
        return NextResponse.json({ attachments: [], error: fileValidation.error, message: fileValidation.message }, { status: 400 });
      }
    }

    const attachments: Attachment[] = [];

    for (const target of uploadTargets) {
      deleteCachedR2UrlsByKey(target.storageKey);

      const provisionalAttachment: Attachment = {
        id: target.storageKey,
        name: target.fileName,
        type: inferAttachmentTypeFromMime(target.contentType, target.fileName),
        url: target.storageKey,
        storageKey: target.storageKey,
        thumbnailKey: null,
        thumbnailUrl: null,
        previewUrl: target.storageKey,
        scope,
        ownerId,
        ownerName,
      };
      const created = await repository.createAttachment({
        order_id: workOrderId,
        attachment: provisionalAttachment,
        storage_provider: "r2",
        storage_key: target.storageKey,
        content_type: target.contentType,
        file_size: target.fileSize,
      });

      attachments.push(createUploadAttachment({
        id: created.id,
        fileName: target.fileName,
        contentType: target.contentType,
        scope,
        ownerId,
        ownerName,
        storageKey: target.storageKey,
        isPrimary: created.is_primary,
      }));
    }

    await Promise.all(attachments.map((attachment) => createAdminHistoryLogSafe({
      company_id: WORKSPACE_COMPANY_ID,
      user_id: ownerId,
      action_type: "FILE_UPLOADED",
      target_type: "file",
      target_id: attachment.id,
      message: `${attachment.name} 업로드`,
      metadata: {
        workOrderId,
        attachmentId: attachment.id,
        fileName: attachment.name,
        scope: attachment.scope,
        ownerName,
      },
    })));

    return NextResponse.json({ attachments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Attachment upload complete failed.";
    console.error("[ATTACHMENT_UPLOAD_COMPLETE_FAILED]", { message, error });
    return NextResponse.json({ attachments: [], error: "ATTACHMENT_UPLOAD_COMPLETE_FAILED", message }, { status: 500 });
  }
}
