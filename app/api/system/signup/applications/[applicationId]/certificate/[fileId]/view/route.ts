import { NextRequest, NextResponse } from "next/server";

import { getR2Object } from "@/lib/storage/r2/r2Client";
import { requireSystemAdminScope } from "@/lib/system/sessionScope";
import {
  isSignupApplicationCertificateMimeTypeAllowed,
  isSignupApplicationCertificateStorageKey,
  isSignupApplicationCertificateStorageKeyConsistentWithMime,
  normalizeSignupApplicationCertificateMimeType,
  SIGNUP_APPLICATION_CERTIFICATE_ERROR_CODES,
} from "@/lib/signup/signupApplicationFilePolicy";
import { createPostgresSignupApplicationCertificateRepository } from "@/lib/signup/signupApplicationCertificateRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ applicationId?: string; fileId?: string }>;
};

function jsonError(code: string, status: number): NextResponse {
  return NextResponse.json(
    { ok: false, code },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function createInlineDisposition(fileName: string): string {
  const fallback = fileName.replace(/["\r\n\\]+/g, " ").trim() || "business-registration";
  return `inline; filename="${fallback.slice(0, 120)}"`;
}

function isObjectContentTypeConsistent(input: {
  objectContentType: string | null | undefined;
  dbMimeType: string;
}): boolean {
  const objectContentType = normalizeSignupApplicationCertificateMimeType(input.objectContentType);
  if (!objectContentType || objectContentType === "application/octet-stream") return true;
  return objectContentType === normalizeSignupApplicationCertificateMimeType(input.dbMimeType);
}

export async function GET(request: NextRequest, context: RouteContext) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  if (request.nextUrl.searchParams.get("download") === "1") {
    return jsonError("SIGNUP_CERTIFICATE_DOWNLOAD_BLOCKED", 403);
  }

  const params = await context.params;
  const applicationId = params.applicationId?.trim() ?? "";
  const fileId = params.fileId?.trim() ?? "";
  if (!applicationId || !fileId) {
    return jsonError(SIGNUP_APPLICATION_CERTIFICATE_ERROR_CODES.fileNotFound, 404);
  }

  const file = await createPostgresSignupApplicationCertificateRepository().findCertificateForSystemViewer({
    applicationId,
    fileId,
  });
  if (!file) {
    return jsonError(SIGNUP_APPLICATION_CERTIFICATE_ERROR_CODES.fileNotFound, 404);
  }
  const certificateStorageKey = file.storageKey;
  if (
    !isSignupApplicationCertificateMimeTypeAllowed(file.mimeType)
    || !isSignupApplicationCertificateStorageKey({ storageKey: certificateStorageKey, applicationId, fileId })
    || !isSignupApplicationCertificateStorageKeyConsistentWithMime({
      storageKey: certificateStorageKey,
      mimeType: file.mimeType,
    })
  ) {
    return jsonError("SIGNUP_CERTIFICATE_INVALID_STORAGE_KEY", 400);
  }

  try {
    const object = await getR2Object({ key: certificateStorageKey });
    if (!isObjectContentTypeConsistent({
      objectContentType: object.contentType,
      dbMimeType: file.mimeType,
    })) {
      return jsonError("SIGNUP_CERTIFICATE_CONTENT_MISMATCH", 409);
    }
    const body = object.body.buffer.slice(
      object.body.byteOffset,
      object.body.byteOffset + object.body.byteLength,
    ) as ArrayBuffer;
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": file.mimeType || object.contentType || "application/octet-stream",
        "Content-Length": String(object.contentLength),
        "Content-Disposition": createInlineDisposition(file.originalName),
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    console.error("[SIGNUP_CERTIFICATE_VIEW_FAILED]", {
      operation: "view",
      hasFileId: Boolean(file.id),
      hasApplicationId: Boolean(file.applicationId),
      reason: "r2-get-failed",
    });
    return jsonError(SIGNUP_APPLICATION_CERTIFICATE_ERROR_CODES.viewFailed, 502);
  }
}
