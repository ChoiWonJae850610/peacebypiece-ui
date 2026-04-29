import { NextRequest, NextResponse } from "next/server";
import { markAttachmentTrashItemsPurgedByAttachmentIds } from "@/lib/admin/adminFiles.serverActions";
import { createAdminHistoryLogSafe } from "@/lib/admin/history/repository";
import { getCompanySettings, getCurrentAdminCompany } from "@/lib/admin/companySettings.repository";
import { deleteCachedR2UrlsByKey } from "@/lib/storage/r2/r2UrlCache";
import { deleteR2ObjectViaWorker } from "@/lib/storage/r2/r2WorkerUpload";
import { createAttachmentMemoRepository } from "@/lib/workorder/persistence/attachmentMemoAdapter";
import type { AttachmentMemoRepository, AttachmentMemoWritableRepository } from "@/lib/workorder/persistence/attachmentMemoRepository";

export const runtime = "nodejs";

type AttachmentDeleteRequest = {
  attachmentId?: unknown;
  deletedBy?: unknown;
  deleteReason?: unknown;
};

function isWritableRepository(repository: AttachmentMemoRepository): repository is AttachmentMemoWritableRepository {
  return "softDeleteAttachment" in repository && "getAttachmentById" in repository;
}

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR");
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

    const company = await getCurrentAdminCompany();
    const settings = await getCompanySettings(company.id);
    const trashRetentionDays = settings.filePolicy.trashRetentionDays;
    const softDeleteEnabled = settings.filePolicy.softDeleteEnabled;

    const deleteKeys = Array.from(
      new Set(
        [target.storage_key, target.thumbnail_key].filter((key): key is string => typeof key === "string" && key.trim().length > 0),
      ),
    );

    if (!softDeleteEnabled) {
      for (const key of deleteKeys) {
        await deleteR2ObjectViaWorker({ key });
        deleteCachedR2UrlsByKey(key);
      }
    } else {
      for (const key of deleteKeys) {
        deleteCachedR2UrlsByKey(key);
      }
    }

    const deleted = await repository.softDeleteAttachment({
      attachmentId,
      deletedBy: readText(payload?.deletedBy),
      deleteReason: readText(payload?.deleteReason),
      trashRetentionDays: softDeleteEnabled ? trashRetentionDays : 0,
    });

    if (!deleted) {
      return NextResponse.json({ attachmentId: null, error: "ATTACHMENT_NOT_FOUND" }, { status: 404 });
    }

    if (!softDeleteEnabled) {
      await markAttachmentTrashItemsPurgedByAttachmentIds({ attachmentIds: [attachmentId], actorId: readText(payload?.deletedBy) ?? "attachment-delete-api" });
    }

    await createAdminHistoryLogSafe({
      company_id: company.id,
      user_id: readText(payload?.deletedBy),
      action_type: "FILE_DELETED",
      target_type: "file",
      target_id: deleted.id,
      message: `${target.original_name || target.storage_key || deleted.id} 삭제`,
      metadata: {
        attachmentId: deleted.id,
        workOrderId: target.order_id,
        fileName: target.original_name ?? null,
        storageKey: target.storage_key ?? null,
        trashMode: softDeleteEnabled ? "soft-delete" : "immediate-delete",
        deleteReason: readText(payload?.deleteReason),
      },
    });

    return NextResponse.json({
      attachmentId: deleted.id,
      trashMode: softDeleteEnabled ? "soft-delete" : "immediate-delete",
      storageDeleteMode: softDeleteEnabled ? "deferred" : "immediate",
      trashRetentionDays: softDeleteEnabled ? trashRetentionDays : 0,
    });
  } catch (error) {
    const message = getErrorMessage(error) || "Attachment delete failed.";
    console.error("[ATTACHMENT_DELETE_FAILED]", { message, error });
    return NextResponse.json({ attachmentId: null, error: "ATTACHMENT_DELETE_FAILED", message }, { status: 500 });
  }
}
