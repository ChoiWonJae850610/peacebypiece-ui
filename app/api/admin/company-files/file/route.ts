import { NextRequest, NextResponse } from "next/server";

import { requireAdminSettingsCompanyScope } from "@/lib/admin/settings/sessionScope";
import { getActiveCompanyFileById } from "@/lib/admin/settings/companyFileRepository";
import { isCompanyFileStorageKeyForCompany } from "@/lib/admin/settings/companyFilePolicy";
import { getR2Object } from "@/lib/storage/r2/r2Client";
import { isR2Configured } from "@/lib/storage/r2/r2Config";
import { createR2WorkerFileUrl, isR2WorkerUploadConfigured } from "@/lib/storage/r2/r2WorkerUpload";
import { getOrSetCachedR2Url, type R2UrlCacheState } from "@/lib/storage/r2/r2UrlCache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sanitizeDownloadFileName(value: string | null): string {
  const normalized = typeof value === "string" ? value.trim() : "";
  const safeName = normalized.replace(/[\\/\r\n\0"]/g, "_");

  return safeName || "company-file";
}

function createContentDisposition(fileName: string): string {
  const fallback = fileName.replace(/[^\x20-\x7E]/g, "_");

  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

function createReadableStream(body: Buffer | Uint8Array | ArrayBuffer): ReadableStream {
  const chunk = body instanceof ArrayBuffer ? new Uint8Array(body) : new Uint8Array(body);

  return new ReadableStream({
    start(controller) {
      controller.enqueue(chunk);
      controller.close();
    },
  });
}

function createWorkerRedirectResponse(url: string, cacheState: R2UrlCacheState): NextResponse {
  const response = NextResponse.redirect(url, { status: 307 });
  response.headers.set("cache-control", "no-store");
  response.headers.set("x-r2-url-cache", cacheState);

  return response;
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

async function createR2SdkFileResponse(input: {
  key: string;
  isDownloadRequest: boolean;
  downloadName: string;
}): Promise<NextResponse> {
  const object = await getR2Object(input.key);
  const headers = new Headers();

  if (object.contentType) headers.set("content-type", object.contentType);
  if (object.contentLength) headers.set("content-length", String(object.contentLength));

  headers.set("cache-control", input.isDownloadRequest ? "no-store" : "private, max-age=300, stale-while-revalidate=60");

  if (input.isDownloadRequest) {
    headers.set("content-disposition", createContentDisposition(input.downloadName));
  }

  return new NextResponse(createReadableStream(object.body), { status: 200, headers });
}

export async function GET(request: NextRequest) {
  const scopeResult = await requireAdminSettingsCompanyScope({
    allowProfileRequired: true,
    allowApprovalPending: true,
    allowSubscriptionManagement: true,
  });
  if (!scopeResult.ok) return scopeResult.response;

  const fileId = request.nextUrl.searchParams.get("fileId")?.trim() ?? "";
  const isDownloadRequest = request.nextUrl.searchParams.get("download") === "1";
  const file = fileId
    ? await getActiveCompanyFileById({
      companyId: scopeResult.companyScope.companyId,
      fileId,
    })
    : null;
  const key = file?.storageKey.trim() ?? "";
  const downloadName = sanitizeDownloadFileName(file?.originalName ?? null);

  if (!file || !key || key.includes("..") || key.startsWith("/") || !isCompanyFileStorageKeyForCompany({ key, companyId: scopeResult.companyScope.companyId, fileType: file.fileType })) {
    return NextResponse.json({ ok: false, error: "COMPANY_FILE_INVALID_STORAGE_KEY" }, { status: 400 });
  }

  if (isR2WorkerUploadConfigured()) {
    try {
      const workerRedirect = createWorkerFileRedirectUrl({ key, isDownloadRequest, downloadName });

      return createWorkerRedirectResponse(workerRedirect.url, workerRedirect.cacheState);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Worker file URL creation failed.";

      return NextResponse.json({ ok: false, error: "COMPANY_FILE_WORKER_FILE_URL_CREATE_FAILED", message }, { status: 500 });
    }
  }

  if (!isR2Configured()) {
    return NextResponse.json({ ok: false, error: "R2_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    return await createR2SdkFileResponse({ key, isDownloadRequest, downloadName });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Company file read failed.";

    return NextResponse.json({ ok: false, error: "COMPANY_FILE_READ_FAILED", message }, { status: 404 });
  }
}
