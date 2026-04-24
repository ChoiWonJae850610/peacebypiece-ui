import { NextRequest, NextResponse } from "next/server";
import { createAttachmentFileProxyUrl } from "@/lib/storage/r2/r2Client";
import { createAttachmentMemoRepository } from "@/lib/workorder/persistence/attachmentMemoAdapter";
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
  return value === "design" ? "design" : "official";
}

function normalizeUploadTarget(input: CompleteUploadTargetInput) {
  const storageKey = readText(input.storageKey);
  const fileName = readText(input.fileName);
  const contentType = readText(input.contentType);
  const fileSize = typeof input.fileSize === "number" && Number.isFinite(input.fileSize) ? input.fileSize : null;

  if (!storageKey || !fileName) return null;

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
}): Attachment {
  return {
    id: input.id,
    name: input.fileName,
    type: inferAttachmentTypeFromMime(input.contentType, input.fileName),
    url: createAttachmentFileProxyUrl(input.storageKey),
    scope: input.scope,
    ownerId: input.ownerId,
    ownerName: input.ownerName,
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => null)) as CompleteUploadRequest | null;
    const workOrderId = readText(payload?.workOrderId);
    const ownerId = readText(payload?.ownerId);
    const ownerName = readText(payload?.ownerName);
    const scope = normalizeScope(payload?.scope);
    const uploadTargets = Array.isArray(payload?.uploadTargets)
      ? payload.uploadTargets.map((item) => normalizeUploadTarget(item as CompleteUploadTargetInput)).filter((item): item is NonNullable<ReturnType<typeof normalizeUploadTarget>> => item !== null)
      : [];

    if (!workOrderId) {
      return NextResponse.json({ attachments: [], error: "WORK_ORDER_ID_REQUIRED" }, { status: 400 });
    }

    if (uploadTargets.length === 0) {
      return NextResponse.json({ attachments: [], error: "UPLOAD_TARGETS_REQUIRED" }, { status: 400 });
    }

    const repository = await createAttachmentMemoRepository();
    if (!isWritableRepository(repository)) {
      return NextResponse.json({ attachments: [], error: "ATTACHMENT_REPOSITORY_WRITE_UNSUPPORTED" }, { status: 503 });
    }

    const attachments: Attachment[] = [];

    for (const target of uploadTargets) {
      const provisionalAttachment: Attachment = {
        id: target.storageKey,
        name: target.fileName,
        type: inferAttachmentTypeFromMime(target.contentType, target.fileName),
        url: target.storageKey,
        scope,
        ownerId,
        ownerName,
      };
      const created = await repository.createAttachment({
        work_order_id: workOrderId,
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
      }));
    }

    return NextResponse.json({ attachments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Attachment upload complete failed.";
    console.error("[ATTACHMENT_UPLOAD_COMPLETE_FAILED]", { message, error });
    return NextResponse.json({ attachments: [], error: "ATTACHMENT_UPLOAD_COMPLETE_FAILED", message }, { status: 500 });
  }
}
