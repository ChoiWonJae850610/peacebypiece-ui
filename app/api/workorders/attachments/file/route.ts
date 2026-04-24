import { NextRequest, NextResponse } from "next/server";
import { getR2Object } from "@/lib/storage/r2/r2Client";
import { isR2Configured } from "@/lib/storage/r2/r2Config";

function isSafeStorageKey(value: string): boolean {
  return value.startsWith("workorders/") && !value.includes("..") && !value.startsWith("/");
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
    if (object.contentLength) headers.set("content-length", object.contentLength);
    headers.set("cache-control", "private, max-age=300");

    return new NextResponse(object.body, { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Attachment file read failed.";
    return NextResponse.json({ error: "ATTACHMENT_FILE_READ_FAILED", message }, { status: 404 });
  }
}
