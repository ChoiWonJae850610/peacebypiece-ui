import "server-only";

import { NextRequest, NextResponse } from "next/server";

import {
  createWorkOrderImageDerivativeKeys,
  getCompanyIdFromWorkOrderAttachmentStorageKey,
  isSupportedWorkOrderAttachmentStorageKey,
  isWorkOrderImageDerivativeStorageKey,
  parseWorkOrderAttachmentStorageKey,
} from "@/lib/storage/r2/r2Keys";
import { getOrSetCachedR2Url, type R2UrlCacheState } from "@/lib/storage/r2/r2UrlCache";
import { createR2WorkerFileUrl, isR2WorkerUploadConfigured } from "@/lib/storage/r2/r2WorkerUpload";
import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import {
  createWaflNotFoundResponse,
  requireWorkspaceApiGuard,
} from "@/lib/auth/apiRouteGuards";
import { createCompanyApiAccessBlockedResponse } from "@/lib/billing/companyApiAccessGuard";
import { queryDb } from "@/lib/db/client";
import { MEMBER_PERMISSION_CODE } from "@/lib/permissions";

function isSafeStorageKey(value: string): boolean {
  return (
    isSupportedWorkOrderAttachmentStorageKey(value) &&
    value.startsWith("companies/") &&
    !value.includes("..") &&
    !value.startsWith("/")
  );
}



async function requireAttachmentFileCompanyAccess(key: string): Promise<NextResponse | null> {
  const session = await getCurrentWaflSession();
  const companyId = session?.companyId?.trim();
  const keyCompanyId = getCompanyIdFromWorkOrderAttachmentStorageKey(key);

  if (!session || !companyId) {
    return NextResponse.json({ ok: false, error: "COMPANY_SESSION_REQUIRED" }, { status: 401 });
  }

  if (!keyCompanyId || keyCompanyId !== companyId) {
    return createWaflNotFoundResponse();
  }

  const blockedResponse = await createCompanyApiAccessBlockedResponse(companyId);
  if (blockedResponse) return blockedResponse;

  const attachmentRow = await queryDb<{ id: string }>(
    `SELECT id::text
       FROM attachments
      WHERE company_id = $1
        AND (storage_key = $2 OR thumbnail_key = $2)
        AND is_active = true
        AND deleted_at IS NULL
      UNION ALL
     SELECT id::text
       FROM work_order_images
      WHERE company_id = $1
        AND (storage_object_key = $2 OR thumbnail_object_key = $2)
        AND deleted_at IS NULL
      UNION ALL
     SELECT id::text
       FROM work_order_attachments
      WHERE company_id = $1
        AND storage_object_key = $2
        AND deleted_at IS NULL
      LIMIT 1`,
    [companyId, key],
  );

  if (attachmentRow.rows[0]) return null;
  if (!isWorkOrderImageDerivativeStorageKey(key)) return createWaflNotFoundResponse();

  const parsed = parseWorkOrderAttachmentStorageKey(key);
  if (!parsed || parsed.companyId !== companyId) return createWaflNotFoundResponse();
  const imageRows = await queryDb<{ storage_object_key: string; thumbnail_object_key: string | null }>(
    `SELECT storage_object_key, thumbnail_object_key
       FROM work_order_images
      WHERE company_id = $1
        AND work_order_id = $2::uuid
        AND deleted_at IS NULL
        AND thumbnail_object_key IS NOT NULL`,
    [companyId, parsed.workOrderId],
  );
  const authorized = imageRows.rows.some((row) => {
    const derivatives = createWorkOrderImageDerivativeKeys(row.storage_object_key);
    return key === derivatives.thumbnail || key === derivatives.medium || key === derivatives.large;
  });
  return authorized ? null : createWaflNotFoundResponse();
}
function createWorkerRedirectResponse(url: string, cacheState: R2UrlCacheState): NextResponse {
  const response = NextResponse.redirect(url, { status: 307 });
  response.headers.set("cache-control", "no-store");
  response.headers.set("x-r2-url-cache", cacheState);

  return response;
}

function sanitizeDownloadFileName(value: string | null): string {
  const normalized = typeof value === "string" ? value.trim() : "";
  const safeName = normalized.replace(/[\\/\r\n\0"]/g, "_");

  return safeName || "attachment";
}

function appendWorkerDownloadParams(url: string, fileName: string): string {
  const workerUrl = new URL(url);
  workerUrl.searchParams.set("download", "1");
  workerUrl.searchParams.set("name", fileName);

  return workerUrl.toString();
}

function createWorkerFileRedirectUrl(input: { key: string; isDownloadRequest: boolean; downloadName: string }): {
  url: string;
  cacheState: R2UrlCacheState;
} {
  const cachedWorkerUrl = getOrSetCachedR2Url({
    purpose: input.isDownloadRequest ? "download" : "file",
    key: input.key,
    createUrl: () => {
      const created = createR2WorkerFileUrl({ key: input.key });

      return {
        ...created,
        url: input.isDownloadRequest ? appendWorkerDownloadParams(created.url, input.downloadName) : created.url,
      };
    },
  });

  return {
    url: cachedWorkerUrl.url,
    cacheState: cachedWorkerUrl.cacheState,
  };
}

export function createWorkOrderAttachmentWorkerFileResponse(input: {
  readonly key: string;
  readonly download?: boolean;
  readonly fileName?: string | null;
}): NextResponse {
  if (!isR2WorkerUploadConfigured()) {
    return NextResponse.json(
      { error: "R2_WORKER_UPLOAD_NOT_CONFIGURED" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  try {
    const workerRedirect = createWorkerFileRedirectUrl({
      key: input.key,
      isDownloadRequest: input.download === true,
      downloadName: sanitizeDownloadFileName(input.fileName ?? null),
    });
    return createWorkerRedirectResponse(workerRedirect.url, workerRedirect.cacheState);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Worker file URL creation failed.";
    return NextResponse.json({ error: "WORKER_FILE_URL_CREATE_FAILED", message }, { status: 500 });
  }
}

export async function handleWorkOrderAttachmentFileGet(request: NextRequest) {
  const guard = await requireWorkspaceApiGuard({
    permissionCode: MEMBER_PERMISSION_CODE.storageRead,
  });
  if (!guard.ok) return guard.response;

  const key = request.nextUrl.searchParams.get("key")?.trim() ?? "";
  const isDownloadRequest = request.nextUrl.searchParams.get("download") === "1";
  const downloadName = sanitizeDownloadFileName(request.nextUrl.searchParams.get("name"));

  if (!key || !isSafeStorageKey(key)) {
    return NextResponse.json({ error: "INVALID_STORAGE_KEY" }, { status: 400 });
  }

  const blockedResponse = await requireAttachmentFileCompanyAccess(key);
  if (blockedResponse) return blockedResponse;

  return createWorkOrderAttachmentWorkerFileResponse({
    key,
    download: isDownloadRequest,
    fileName: downloadName,
  });
}
