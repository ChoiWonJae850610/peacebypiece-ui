import { NextRequest, NextResponse } from "next/server";
import { getR2Object } from "@/lib/storage/r2/r2Client";
import { isR2Configured } from "@/lib/storage/r2/r2Config";
import { isSupportedWorkOrderAttachmentStorageKey } from "@/lib/storage/r2/r2Keys";
import { getCachedR2Url, setCachedR2Url } from "@/lib/storage/r2/r2UrlCache";
import { createR2WorkerFileUrl, isR2WorkerUploadConfigured } from "@/lib/storage/r2/r2WorkerUpload";

export const runtime = "nodejs";

function isSafeStorageKey(value: string): boolean {
  return isSupportedWorkOrderAttachmentStorageKey(value) && value.startsWith("workorders/") && !value.includes("..") && !value.startsWith("/");
}

function createReadableStream(body: Buffer | Uint8Array | ArrayBuffer): ReadableStream<Uint8Array> {
  const chunk = body instanceof ArrayBuffer ? new Uint8Array(body) : new Uint8Array(body);

  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(chunk);
      controller.close();
    },
  });
}

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key")?.trim() ?? "";
  if (!key || !isSafeStorageKey(key)) {
    return NextResponse.json({ error: "INVALID_STORAGE_KEY" }, { status: 400 });
  }

  if (isR2WorkerUploadConfigured()) {
    try {
      const cachedUrl = getCachedR2Url({ purpose: "file", key });
      if (cachedUrl) {
        return NextResponse.redirect(cachedUrl, { status: 307 });
      }

      const workerFile = createR2WorkerFileUrl({ key });
      const cachedWorkerUrl = setCachedR2Url({
        purpose: "file",
        key,
        url: workerFile.url,
        expiresInSeconds: workerFile.expiresInSeconds,
      });

      return NextResponse.redirect(cachedWorkerUrl, { status: 307 });
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
    headers.set("cache-control", "private, max-age=300, stale-while-revalidate=60");

    return new NextResponse(createReadableStream(object.body), { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Attachment file read failed.";
    return NextResponse.json({ error: "ATTACHMENT_FILE_READ_FAILED", message }, { status: 404 });
  }
}
