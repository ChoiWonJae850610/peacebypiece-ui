import { NextRequest, NextResponse } from "next/server";
import { putR2Object } from "@/lib/storage/r2/r2Client";
import { isSupportedWorkOrderAttachmentStorageKey } from "@/lib/storage/r2/r2Keys";

export const runtime = "nodejs";

function readText(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const storageKey = readText(formData.get("storageKey"));
    const file = formData.get("file");

    if (!storageKey || !isSupportedWorkOrderAttachmentStorageKey(storageKey)) {
      return NextResponse.json({ error: "INVALID_STORAGE_KEY" }, { status: 400 });
    }

    if (!(file instanceof File) || file.size <= 0) {
      return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await putR2Object({
      key: storageKey,
      body: buffer,
      contentType: file.type || "application/octet-stream",
    });

    return NextResponse.json({ ok: true, storageKey });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Attachment server upload failed.";
    console.error("[ATTACHMENT_SERVER_UPLOAD_FAILED]", { message, error });
    return NextResponse.json({ error: "ATTACHMENT_SERVER_UPLOAD_FAILED", message }, { status: 500 });
  }
}
