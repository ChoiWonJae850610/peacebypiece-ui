import { NextRequest, NextResponse } from "next/server";
import { createAttachmentFileProxyUrl, putR2Object } from "@/lib/storage/r2/r2Client";
import { isR2Configured } from "@/lib/storage/r2/r2Config";
import { createWorkOrderAttachmentStorageKey } from "@/lib/storage/r2/r2Keys";
import { createAttachmentMemoRepository } from "@/lib/workorder/persistence/attachmentMemoAdapter";
import type { AttachmentMemoRepository, AttachmentMemoWritableRepository } from "@/lib/workorder/persistence/attachmentMemoRepository";
import { inferAttachmentTypeFromMime } from "@/lib/workorder/persistence/attachmentMemoTypes";
import type { Attachment, AttachmentScope } from "@/types/workorder";

export const runtime = "nodejs";
function isWritableRepository(repository: AttachmentMemoRepository): repository is AttachmentMemoWritableRepository {
  return "createAttachment" in repository;
}

function normalizeScope(value: FormDataEntryValue | null): AttachmentScope {
  return value === "design" ? "design" : "official";
}

function readText(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function createUploadAttachment(input: {
  id: string;
  file: File;
  scope: AttachmentScope;
  ownerId: string | null;
  ownerName: string | null;
  storageKey: string;
}): Attachment {
  return {
    id: input.id,
    name: input.file.name,
    type: inferAttachmentTypeFromMime(input.file.type, input.file.name),
    url: createAttachmentFileProxyUrl(input.storageKey),
    scope: input.scope,
    ownerId: input.ownerId,
    ownerName: input.ownerName,
  };
}

export async function POST(request: NextRequest) {
  if (!isR2Configured()) {
    return NextResponse.json({ attachments: [], error: "R2_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const workOrderId = readText(formData.get("workOrderId"));
    const ownerId = readText(formData.get("ownerId"));
    const ownerName = readText(formData.get("ownerName"));
    const scope = normalizeScope(formData.get("scope"));
    const files = formData.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);

    if (!workOrderId) {
      return NextResponse.json({ attachments: [], error: "WORK_ORDER_ID_REQUIRED" }, { status: 400 });
    }

    if (files.length === 0) {
      return NextResponse.json({ attachments: [], error: "FILES_REQUIRED" }, { status: 400 });
    }

    const repository = await createAttachmentMemoRepository();
    if (!isWritableRepository(repository)) {
      return NextResponse.json({ attachments: [], error: "ATTACHMENT_REPOSITORY_WRITE_UNSUPPORTED" }, { status: 503 });
    }

    const attachments: Attachment[] = [];

    for (const file of files) {
      const storageKey = createWorkOrderAttachmentStorageKey({ workOrderId, scope, originalName: file.name });
      const buffer = Buffer.from(await file.arrayBuffer());

      console.info("[ATTACHMENT_UPLOAD_START]", {
        workOrderId,
        scope,
        storageKey,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type || "application/octet-stream",
      });

      await putR2Object({
        key: storageKey,
        body: buffer,
        contentType: file.type || "application/octet-stream",
      });

      const provisionalAttachment: Attachment = {
        id: storageKey,
        name: file.name,
        type: inferAttachmentTypeFromMime(file.type, file.name),
        url: storageKey,
        scope,
        ownerId,
        ownerName,
      };
      const created = await repository.createAttachment({
        work_order_id: workOrderId,
        attachment: provisionalAttachment,
        storage_provider: "r2",
        storage_key: storageKey,
        content_type: file.type || null,
        file_size: file.size,
      });

      attachments.push(createUploadAttachment({
        id: created.id,
        file,
        scope,
        ownerId,
        ownerName,
        storageKey,
      }));
    }

    return NextResponse.json({ attachments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Attachment upload failed.";
    console.error("[ATTACHMENT_UPLOAD_FAILED]", { message, error });
    return NextResponse.json({ attachments: [], error: "ATTACHMENT_UPLOAD_FAILED", message }, { status: 500 });
  }
}
