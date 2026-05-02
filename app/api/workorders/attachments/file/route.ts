import { NextRequest, NextResponse } from "next/server";

import { getR2Object } from "@/lib/storage/r2/r2Client";
import { isR2Configured } from "@/lib/storage/r2/r2Config";
import { isSupportedWorkOrderAttachmentStorageKey } from "@/lib/storage/r2/r2Keys";
import { getOrSetCachedR2Url, type R2UrlCacheState } from "@/lib/storage/r2/r2UrlCache";
import { createR2WorkerFileUrl, isR2WorkerUploadConfigured } from "@/lib/storage/r2/r2WorkerUpload";

export const runtime = "nodejs";

function isSafeStorageKey(value: string): boolean {
  return (
    isSupportedWorkOrderAttachmentStorageKey(value) &&
    value.startsWith("workorders/") &&
    !value.includes("..") &&
    !value.startsWith("/")
  );
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

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key")?.trim() ?? "";
  const isDownloadRequest = request.nextUrl.searchParams.get("download") === "1";
  const downloadName = sanitizeDownloadFileName(request.nextUrl.searchParams.get("name"));

  if (!key || !isSafeStorageKey(key)) {
    return NextResponse.json({ error: "INVALID_STORAGE_KEY" }, { status: 400 });
  }

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
    const object = await getR2Object(key);
    const headers = new Headers();

    if (object.contentType) headers.set("content-type", object.contentType);
    if (object.contentLength) headers.set("content-length", String(object.contentLength));
    headers.set("cache-control", isDownloadRequest ? "no-store" : "private, max-age=300, stale-while-revalidate=60");

    if (isDownloadRequest) {
      headers.set("content-disposition", createContentDisposition(downloadName));
    }

    return new NextResponse(createReadableStream(object.body), { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Attachment file read failed.";
    return NextResponse.json({ error: "ATTACHMENT_FILE_READ_FAILED", message }, { status: 404 });
  }
}
