import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { requireAdminSettingsCompanyScope } from "@/lib/admin/settings/sessionScope";
import {
  COMPANY_FILE_ERROR_CODES,
  createCompanyFileStorageKey,
  validateCompanyFileUploadInput,
} from "@/lib/admin/settings/companyFilePolicy";
import { checkCompanyFileUploadStorageQuota } from "@/lib/billing/companyStorageQuotaRepository";
import { STORAGE_QUOTA_UPLOAD_ERROR_CODES } from "@/lib/billing/storageQuotaPolicy";
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

function getWorkerHostLabel(uploadUrl: string): string {
  try {
    const url = new URL(uploadUrl);
    return `${url.origin}${url.pathname}`;
  } catch {
    return "INVALID_R2_WORKER_UPLOAD_URL";
  }
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

  const requestId = randomUUID();
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

  try {
    const quotaResult = await checkCompanyFileUploadStorageQuota({
      companyId: scopeResult.companyScope.companyId,
      fileType: validation.fileType,
      incomingSizeBytes: validation.sizeBytes,
    });
    if (!quotaResult.ok) {
      return NextResponse.json(
        { ok: false, error: quotaResult.error, message: quotaResult.message },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (quotaResult.decision.status === "blocked") {
      return NextResponse.json(
        {
          ok: false,
          error: STORAGE_QUOTA_UPLOAD_ERROR_CODES.exceeded,
          message: quotaResult.decision.message,
          quota: quotaResult.decision,
        },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (!isR2WorkerUploadConfigured()) {
      console.warn("[ADMIN_COMPANY_FILE_R2_UPLOAD_NOT_CONFIGURED]", {
        requestId,
        companyId: scopeResult.companyScope.companyId,
        fileType: validation.fileType,
        mimeType: validation.mimeType,
        sizeBytes: validation.sizeBytes,
      });
      return NextResponse.json(
        {
          ok: false,
          error: COMPANY_FILE_ERROR_CODES.uploadNotConfigured,
          message: "COMPANY_FILE_UPLOAD_NOT_CONFIGURED",
          diagnostics: { requestId },
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    const storageKey = createCompanyFileStorageKey({
      companyId: scopeResult.companyScope.companyId,
      fileType: validation.fileType,
      originalName: validation.originalName,
      mimeType: validation.mimeType,
    });
    const upload = createR2WorkerUploadUrl({ key: storageKey, contentType: validation.mimeType });
    const workerHost = getWorkerHostLabel(upload.url);

    console.info("[ADMIN_COMPANY_FILE_UPLOAD_PREPARED]", {
      requestId,
      companyId: scopeResult.companyScope.companyId,
      fileType: validation.fileType,
      mimeType: validation.mimeType,
      sizeBytes: validation.sizeBytes,
      storageKey,
      workerHost,
      expiresInSeconds: upload.expiresInSeconds,
    });

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
        quota: quotaResult.decision,
        diagnostics: {
          requestId,
          workerHost,
          storageKey,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[ADMIN_COMPANY_FILE_UPLOAD_PREPARE_FAILED]", {
      requestId,
      companyId: scopeResult.companyScope.companyId,
      message,
      error,
    });
    return NextResponse.json(
      { ok: false, error: COMPANY_FILE_ERROR_CODES.presignFailed, message: COMPANY_FILE_ERROR_CODES.presignFailed, diagnostics: { requestId } },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
