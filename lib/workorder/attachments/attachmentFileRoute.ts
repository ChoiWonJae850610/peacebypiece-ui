import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { getR2Object } from "@/lib/storage/r2/r2Client";
import { isR2Configured } from "@/lib/storage/r2/r2Config";
import { getCompanyIdFromWorkOrderAttachmentStorageKey, isSupportedWorkOrderAttachmentStorageKey } from "@/lib/storage/r2/r2Keys";
import { getOrSetCachedR2Url, type R2UrlCacheState } from "@/lib/storage/r2/r2UrlCache";
import { createR2WorkerFileUrl, isR2WorkerUploadConfigured } from "@/lib/storage/r2/r2WorkerUpload";
import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { createCompanyApiAccessBlockedResponse } from "@/lib/billing/companyApiAccessGuard";

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
    return NextResponse.json({ ok: false, error: "ATTACHMENT_FILE_COMPANY_SCOPE_MISMATCH" }, { status: 403 });
  }

  return createCompanyApiAccessBlockedResponse(companyId);
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

function sanitizeDownloadFileName(value: string | null): string {
  const normalized = typeof value === "string" ? value.trim() : "";
  const safeName = normalized.replace(/[\\/\r\n\0"]/g, "_");

  return safeName || "attachment";
}

function createContentDisposition(fileName: string): string {
  const fallback = fileName.replace(/[^\x20-\x7E]/g, "_");

  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
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

export async function handleWorkOrderAttachmentFileGet(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key")?.trim() ?? "";
  const isDownloadRequest = request.nextUrl.searchParams.get("download") === "1";
  const downloadName = sanitizeDownloadFileName(request.nextUrl.searchParams.get("name"));

  if (!key || !isSafeStorageKey(key)) {
    return NextResponse.json({ error: "INVALID_STORAGE_KEY" }, { status: 400 });
  }

  const blockedResponse = await requireAttachmentFileCompanyAccess(key);
  if (blockedResponse) return blockedResponse;

  if (isR2WorkerUploadConfigured()) {
    try {
      const workerRedirect = createWorkerFileRedirectUrl({ key, isDownloadRequest, downloadName });

      return createWorkerRedirectResponse(workerRedirect.url, workerRedirect.cacheState);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Worker file URL creation failed.";

      return NextResponse.json({ error: "WORKER_FILE_URL_CREATE_FAILED", message }, { status: 500 });
    }
  }

  if (!isR2Configured()) {
    return NextResponse.json({ error: "R2_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    return await createR2SdkFileResponse({ key, isDownloadRequest, downloadName });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Attachment file read failed.";

    return NextResponse.json({ error: "ATTACHMENT_FILE_READ_FAILED", message }, { status: 404 });
  }
}
