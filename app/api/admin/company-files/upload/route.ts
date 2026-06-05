import { NextResponse } from "next/server";

import { requireAdminSettingsCompanyScope } from "@/lib/admin/settings/sessionScope";
import {
  COMPANY_FILE_ERROR_CODES,
  createCompanyFileStorageKey,
  validateCompanyFileUploadInput,
} from "@/lib/admin/settings/companyFilePolicy";
import { createR2WorkerUploadUrl, isR2WorkerUploadConfigured } from "@/lib/storage/r2/r2WorkerUpload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CompanyFileUploadRequestBody = {
  fileType?: string | null;
  originalName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | string | null;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR");
}

async function readBody(request: Request): Promise<CompanyFileUploadRequestBody> {
  const payload = (await request.json().catch(() => null)) as unknown;
  return typeof payload === "object" && payload !== null ? (payload as CompanyFileUploadRequestBody) : {};
}

export async function POST(request: Request) {
  const scopeResult = await requireAdminSettingsCompanyScope({
    allowProfileRequired: true,
    allowApprovalPending: true,
    allowSubscriptionManagement: true,
  });
  if (!scopeResult.ok) return scopeResult.response;

  const body = await readBody(request);
  const validation = validateCompanyFileUploadInput({
    fileType: body.fileType,
    originalName: body.originalName,
    mimeType: body.mimeType,
    sizeBytes: body.sizeBytes,
  });

  if (!validation.ok) {
    return NextResponse.json(
      { ok: false, error: validation.error },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!isR2WorkerUploadConfigured()) {
    return NextResponse.json(
      { ok: false, error: COMPANY_FILE_ERROR_CODES.uploadNotConfigured },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const storageKey = createCompanyFileStorageKey({
      companyId: scopeResult.companyScope.companyId,
      fileType: validation.fileType,
      originalName: validation.originalName,
      mimeType: validation.mimeType,
    });
    const upload = createR2WorkerUploadUrl({ key: storageKey, contentType: validation.mimeType });

    return NextResponse.json(
      {
        ok: true,
        file: {
          fileType: validation.fileType,
          originalName: validation.originalName,
          mimeType: validation.mimeType,
          sizeBytes: validation.sizeBytes,
          storageKey,
        },
        upload,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[ADMIN_COMPANY_FILE_UPLOAD_PREPARE_FAILED]", { message, error });
    return NextResponse.json(
      { ok: false, error: COMPANY_FILE_ERROR_CODES.presignFailed, message },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
