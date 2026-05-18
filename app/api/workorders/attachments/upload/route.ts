import { NextRequest, NextResponse } from "next/server";
import { createR2PresignedPutUrl } from "@/lib/storage/r2/r2Client";
import { isR2Configured } from "@/lib/storage/r2/r2Config";
import { createWorkOrderAttachmentStorageKey } from "@/lib/storage/r2/r2Keys";
import { createWorkOrderAttachmentThumbnailKey, isImageContentType } from "@/lib/storage/r2/r2ThumbnailKeys";
import { createR2WorkerUploadUrl, isR2WorkerUploadConfigured } from "@/lib/storage/r2/r2WorkerUpload";
import { createAttachmentMemoRepository } from "@/lib/workorder/persistence/attachmentMemoAdapter";
import { requireAdminFileCompanyScope } from "@/lib/admin/files/sessionScope";
import { queryDb } from "@/lib/db/client";
import type { AttachmentMemoRepository, AttachmentMemoWritableRepository } from "@/lib/workorder/persistence/attachmentMemoRepository";
import { validateAttachmentFile, validateAttachmentFileCount, normalizeAttachmentUploadScope } from "@/lib/workorder/persistence/workOrderAttachmentPolicy";
import type { AttachmentScope } from "@/types/workorder";

export const runtime = "nodejs";

type PrepareUploadFileInput = { name?: unknown; type?: unknown; size?: unknown };
type PrepareUploadRequest = { workOrderId?: unknown; scope?: unknown; files?: unknown };

function isWritableRepository(repository: AttachmentMemoRepository): repository is AttachmentMemoWritableRepository {
  return "countActiveAttachmentsByWorkOrderId" in repository;
}

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeScope(value: unknown): AttachmentScope {
  return normalizeAttachmentUploadScope(value);
}

function normalizeFile(input: PrepareUploadFileInput) {
  const name = readText(input.name);
  const type = readText(input.type) || "application/octet-stream";
  const size = typeof input.size === "number" && Number.isFinite(input.size) ? input.size : 0;
  if (!name || size <= 0) return null;
  return { name, type, size };
}

async function workOrderBelongsToCompany(input: { workOrderId: string; companyId: string }): Promise<boolean> {
  const result = await queryDb<{ id: string }>(
    `SELECT id
       FROM spec_sheets
      WHERE id = $1
        AND company_id = $2
        AND deleted_at IS NULL
        AND COALESCE(is_active, true) = true
      LIMIT 1`,
    [input.workOrderId, input.companyId],
  );

  return Boolean(result.rows[0]);
}

function createUploadTarget(input: { companyId: string; workOrderId: string; scope: AttachmentScope; file: NonNullable<ReturnType<typeof normalizeFile>> }) {
  const storageKey = createWorkOrderAttachmentStorageKey({ companyId: input.companyId, workOrderId: input.workOrderId, scope: input.scope, originalName: input.file.name });
  const upload = isR2WorkerUploadConfigured()
    ? createR2WorkerUploadUrl({ key: storageKey, contentType: input.file.type })
    : createR2PresignedPutUrl({ key: storageKey, contentType: input.file.type });
  const thumbnailStorageKey = isImageContentType(input.file.type)
    ? createWorkOrderAttachmentThumbnailKey({ companyId: input.companyId, workOrderId: input.workOrderId, scope: input.scope })
    : null;
  const thumbnailUpload = thumbnailStorageKey
    ? isR2WorkerUploadConfigured()
      ? createR2WorkerUploadUrl({ key: thumbnailStorageKey, contentType: "image/webp" })
      : createR2PresignedPutUrl({ key: thumbnailStorageKey, contentType: "image/webp" })
    : null;

  return {
    storageKey,
    fileName: input.file.name,
    contentType: input.file.type,
    fileSize: input.file.size,
    uploadUrl: upload.url,
    thumbnailStorageKey,
    thumbnailUploadUrl: thumbnailUpload?.url ?? null,
    thumbnailContentType: thumbnailStorageKey ? "image/webp" : null,
    method: upload.method,
    headers: upload.headers,
    expiresInSeconds: upload.expiresInSeconds,
  };
}

export async function POST(request: NextRequest) {
  if (!isR2WorkerUploadConfigured() && !isR2Configured()) {
    return NextResponse.json({ uploadTargets: [], error: "R2_UPLOAD_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    const scopeResult = await requireAdminFileCompanyScope();
    if (!scopeResult.ok) return scopeResult.response;

    const { companyId } = scopeResult.companyScope;
    const payload = (await request.json().catch(() => null)) as PrepareUploadRequest | null;
    const workOrderId = readText(payload?.workOrderId);
    const scope = normalizeScope(payload?.scope);
    const files = Array.isArray(payload?.files)
      ? payload.files.map((item) => normalizeFile(item as PrepareUploadFileInput)).filter((item): item is NonNullable<ReturnType<typeof normalizeFile>> => item !== null)
      : [];

    if (!workOrderId) return NextResponse.json({ uploadTargets: [], error: "WORK_ORDER_ID_REQUIRED" }, { status: 400 });
    if (files.length === 0) return NextResponse.json({ uploadTargets: [], error: "FILES_REQUIRED" }, { status: 400 });

    const belongsToCompany = await workOrderBelongsToCompany({ workOrderId, companyId });
    if (!belongsToCompany) {
      return NextResponse.json({ uploadTargets: [], error: "WORK_ORDER_NOT_FOUND" }, { status: 404 });
    }

    const repository = await createAttachmentMemoRepository();
    if (isWritableRepository(repository)) {
      const currentCount = await repository.countActiveAttachmentsByWorkOrderId(workOrderId);
      const countValidation = validateAttachmentFileCount({ currentCount, incomingCount: files.length });
      if (!countValidation.ok) {
        return NextResponse.json({ uploadTargets: [], error: countValidation.error, message: countValidation.message }, { status: 400 });
      }
    }

    for (const file of files) {
      const validation = validateAttachmentFile({
        scope: normalizeAttachmentUploadScope(scope),
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      });
      if (!validation.ok) {
        return NextResponse.json({ uploadTargets: [], error: validation.error, message: validation.message }, { status: 400 });
      }
    }

    return NextResponse.json({ uploadTargets: files.map((file) => createUploadTarget({ companyId, workOrderId, scope, file })) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Attachment upload prepare failed.";
    console.error("[ATTACHMENT_UPLOAD_PREPARE_FAILED]", { message, error });
    return NextResponse.json({ uploadTargets: [], error: "ATTACHMENT_UPLOAD_PREPARE_FAILED", message }, { status: 500 });
  }
}
