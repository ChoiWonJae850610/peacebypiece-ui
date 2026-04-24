import { NextRequest, NextResponse } from "next/server";
import { getR2Object } from "@/lib/storage/r2/r2Client";
import { isR2Configured } from "@/lib/storage/r2/r2Config";

export const runtime = "nodejs";

function isSafeStorageKey(value: string): boolean {
  return value.startsWith("workorders/") && !value.includes("..") && !value.startsWith("/");
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
  if (!isR2Configured()) {
    return NextResponse.json({ error: "R2_NOT_CONFIGURED" }, { status: 503 });
  }

  const key = request.nextUrl.searchParams.get("key")?.trim() ?? "";
  if (!key || !isSafeStorageKey(key)) {
    return NextResponse.json({ error: "INVALID_STORAGE_KEY" }, { status: 400 });
  }

  try {
    const object = await getR2Object(key);
    const headers = new Headers();
    if (object.contentType) headers.set("content-type", object.contentType);
    if (object.contentLength) headers.set("content-length", String(object.contentLength));
    headers.set("cache-control", "private, max-age=300");

    return new NextResponse(createReadableStream(object.body), { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Attachment file read failed.";
    return NextResponse.json({ error: "ATTACHMENT_FILE_READ_FAILED", message }, { status: 404 });
  }
}
