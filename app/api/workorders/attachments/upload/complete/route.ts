import { NextRequest, NextResponse } from "next/server";
import { createAttachmentFileProxyUrl } from "@/lib/storage/r2/r2Client";
import { WORKORDER_SERVICE_CODE } from "@/lib/constants/workorderServiceCodes";
import { resolveWorkOrderServiceCodeForRequest } from "@/lib/workorder/serviceCodeRequest";
import { WORKORDER_SERVICE_OPERATION, WORKORDER_SERVICE_RESOURCE } from "@/lib/workorder/serviceCodeSideEffects";
import { assertServiceCanUseSideEffect } from "@/lib/workorder/serviceCodeGuards";
import { deleteCachedR2UrlsByKey } from "@/lib/storage/r2/r2UrlCache";
import { isSupportedWorkOrderAttachmentStorageKey, isWorkOrderAttachmentStorageKeyForScope } from "@/lib/storage/r2/r2Keys";
import { isImageContentType, isWorkOrderAttachmentThumbnailKeyForScope } from "@/lib/storage/r2/r2ThumbnailKeys";
import { createAttachmentRepository } from "@/lib/workorder/persistence/attachmentAdapter";
import { createAdminHistoryLogSafe } from "@/lib/admin/history/repository";
import { requireAdminFileCompanyScope } from "@/lib/admin/files/sessionScope";
import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import { MEMBER_PERMISSION_CODE } from "@/lib/permissions";
import { queryDb } from "@/lib/db/client";
import { normalizeAttachmentUploadScope, validateAttachmentFile, validateAttachmentFileCount } from "@/lib/workorder/persistence/workOrderAttachmentPolicy";
import type { AttachmentRepository, AttachmentWritableRepository } from "@/lib/workorder/persistence/attachmentRepository";
import { inferAttachmentTypeFromMime } from "@/lib/workorder/persistence/attachmentTypes";
import type { Attachment, AttachmentScope } from "@/types/workorder";

export const runtime = "nodejs";

type CompleteUploadTargetInput = {
  storageKey?: unknown;
  fileName?: unknown;
  contentType?: unknown;
  fileSize?: unknown;
  thumbnailStorageKey?: unknown;
};

type CompleteUploadRequest = {
  workOrderId?: unknown;
  ownerId?: unknown;
  ownerName?: unknown;
  scope?: unknown;
  uploadTargets?: unknown;
  serviceCode?: unknown;
};

function isWritableRepository(repository: AttachmentRepository): repository is AttachmentWritableRepository {
  return "createAttachment" in repository;
}

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeScope(value: unknown): AttachmentScope {
  return normalizeAttachmentUploadScope(value);
}

function normalizeUploadTarget(input: CompleteUploadTargetInput, context: { companyId: string; workOrderId: string; scope: AttachmentScope }) {
  const storageKey = readText(input.storageKey);
  const fileName = readText(input.fileName);
  const contentType = readText(input.contentType);
  const fileSize = typeof input.fileSize === "number" && Number.isFinite(input.fileSize) ? input.fileSize : null;
  const thumbnailStorageKey = readText(input.thumbnailStorageKey);

  if (!storageKey || !fileName || !isSupportedWorkOrderAttachmentStorageKey(storageKey)) return null;
  if (!isWorkOrderAttachmentStorageKeyForScope({ key: storageKey, companyId: context.companyId, workOrderId: context.workOrderId, scope: context.scope })) return null;
  if (thumbnailStorageKey && !isWorkOrderAttachmentThumbnailKeyForScope({ key: thumbnailStorageKey, companyId: context.companyId, workOrderId: context.workOrderId, scope: context.scope })) return null;

  return {
    storageKey,
    fileName,
    contentType,
    fileSize,
    thumbnailStorageKey: thumbnailStorageKey && isImageContentType(contentType) ? thumbnailStorageKey : null,
  };
}


function createServiceCodeErrorResponse(result: Extract<ReturnType<typeof resolveWorkOrderServiceCodeForRequest>, { ok: false }>): NextResponse {
  return NextResponse.json(
    {
      attachments: [],
      error: result.error,
      expectedServiceCode: result.expected,
      receivedServiceCode: result.received,
    },
    { status: 400 },
  );
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

function createUploadAttachment(input: {
  id: string;
  fileName: string;
  contentType: string | null;
  scope: AttachmentScope;
  ownerId: string | null;
  ownerName: string | null;
  storageKey: string;
  thumbnailKey?: string | null;
  isPrimary?: boolean | null;
}): Attachment {
  return {
    id: input.id,
    name: input.fileName,
    type: inferAttachmentTypeFromMime(input.contentType, input.fileName),
    url: createAttachmentFileProxyUrl(input.storageKey),
    storageKey: input.storageKey,
    thumbnailKey: input.thumbnailKey ?? null,
    thumbnailUrl: input.thumbnailKey ? createAttachmentFileProxyUrl(input.thumbnailKey) : null,
    previewUrl: createAttachmentFileProxyUrl(input.storageKey),
    scope: input.scope,
    ownerId: input.ownerId,
    ownerName: input.ownerName,
    isPrimary: input.isPrimary === true,
  };
}

export async function POST(request: NextRequest) {
  const guard = await requireWorkspaceApiGuard({
    permissionCode: MEMBER_PERMISSION_CODE.workorderUpdate,
  });
  if (!guard.ok) return guard.response;

  try {
    const scopeResult = await requireAdminFileCompanyScope();
    if (!scopeResult.ok) return scopeResult.response;

    const { companyId, userId } = scopeResult.companyScope;
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
      .map((item) => normalizeUploadTarget(item as CompleteUploadTargetInput, { companyId, workOrderId, scope }))
      .filter((item): item is NonNullable<ReturnType<typeof normalizeUploadTarget>> => item !== null);

    if (uploadTargets.length === 0) {
      return NextResponse.json({ attachments: [], error: "UPLOAD_TARGETS_REQUIRED" }, { status: 400 });
    }

    const serviceCodeResult = resolveWorkOrderServiceCodeForRequest({
      expected: WORKORDER_SERVICE_CODE.attachmentUploadComplete,
      received: payload?.serviceCode,
    });
    if (!serviceCodeResult.ok) return createServiceCodeErrorResponse(serviceCodeResult);

    assertServiceCanUseSideEffect({
      serviceCode: serviceCodeResult.serviceCode,
      resource: WORKORDER_SERVICE_RESOURCE.attachments,
      operation: WORKORDER_SERVICE_OPERATION.insert,
    });

    const belongsToCompany = await workOrderBelongsToCompany({ workOrderId, companyId });
    if (!belongsToCompany) {
      return NextResponse.json({ attachments: [], error: "WORK_ORDER_NOT_FOUND" }, { status: 404 });
    }

    const repository = await createAttachmentRepository();
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
      if (target.thumbnailStorageKey) deleteCachedR2UrlsByKey(target.thumbnailStorageKey);

      const provisionalAttachment: Attachment = {
        id: target.storageKey,
        name: target.fileName,
        type: inferAttachmentTypeFromMime(target.contentType, target.fileName),
        url: target.storageKey,
        storageKey: target.storageKey,
        thumbnailKey: target.thumbnailStorageKey,
        thumbnailUrl: target.thumbnailStorageKey ? createAttachmentFileProxyUrl(target.thumbnailStorageKey) : null,
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
        thumbnailKey: target.thumbnailStorageKey,
        isPrimary: created.is_primary,
      }));
    }

    await Promise.all(attachments.map((attachment) => createAdminHistoryLogSafe({
      company_id: companyId,
      user_id: ownerId ?? userId,
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
