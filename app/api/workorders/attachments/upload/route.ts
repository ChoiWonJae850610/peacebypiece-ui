import { NextRequest, NextResponse } from "next/server";
import { createR2PresignedPutUrl } from "@/lib/storage/r2/r2Client";
import { isR2Configured } from "@/lib/storage/r2/r2Config";
import { createWorkOrderAttachmentStorageKey } from "@/lib/storage/r2/r2Keys";
import { createR2WorkerUploadUrl, isR2WorkerUploadConfigured } from "@/lib/storage/r2/r2WorkerUpload";
import type { AttachmentScope } from "@/types/workorder";

export const runtime = "nodejs";

type PrepareUploadFileInput = { name?: unknown; type?: unknown; size?: unknown };
type PrepareUploadRequest = { workOrderId?: unknown; scope?: unknown; files?: unknown };

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeScope(value: unknown): AttachmentScope {
  return value === "design" ? "design" : value === "memo" ? "memo" : "attachment";
}

function normalizeFile(input: PrepareUploadFileInput) {
  const name = readText(input.name);
  const type = readText(input.type) || "application/octet-stream";
  const size = typeof input.size === "number" && Number.isFinite(input.size) ? input.size : 0;
  if (!name || size <= 0) return null;
  return { name, type, size };
}

function createUploadTarget(input: { workOrderId: string; scope: AttachmentScope; file: NonNullable<ReturnType<typeof normalizeFile>> }) {
  const storageKey = createWorkOrderAttachmentStorageKey({ workOrderId: input.workOrderId, scope: input.scope, originalName: input.file.name });
  const upload = isR2WorkerUploadConfigured()
    ? createR2WorkerUploadUrl({ key: storageKey, contentType: input.file.type })
    : createR2PresignedPutUrl({ key: storageKey, contentType: input.file.type });

  return {
    storageKey,
    fileName: input.file.name,
    contentType: input.file.type,
    fileSize: input.file.size,
    uploadUrl: upload.url,
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
    const payload = (await request.json().catch(() => null)) as PrepareUploadRequest | null;
    const workOrderId = readText(payload?.workOrderId);
    const scope = normalizeScope(payload?.scope);
    const files = Array.isArray(payload?.files)
      ? payload.files.map((item) => normalizeFile(item as PrepareUploadFileInput)).filter((item): item is NonNullable<ReturnType<typeof normalizeFile>> => item !== null)
      : [];

    if (!workOrderId) return NextResponse.json({ uploadTargets: [], error: "WORK_ORDER_ID_REQUIRED" }, { status: 400 });
    if (files.length === 0) return NextResponse.json({ uploadTargets: [], error: "FILES_REQUIRED" }, { status: 400 });

    return NextResponse.json({ uploadTargets: files.map((file) => createUploadTarget({ workOrderId, scope, file })) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Attachment upload prepare failed.";
    console.error("[ATTACHMENT_UPLOAD_PREPARE_FAILED]", { message, error });
    return NextResponse.json({ uploadTargets: [], error: "ATTACHMENT_UPLOAD_PREPARE_FAILED", message }, { status: 500 });
  }
}
