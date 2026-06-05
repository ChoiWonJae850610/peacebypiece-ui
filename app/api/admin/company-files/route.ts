import { NextResponse } from "next/server";

import {
  CompanyFileValidationError,
  createOrReplaceCompanyFileMetadata,
  listActiveCompanyFiles,
} from "@/lib/admin/settings/companyFileRepository";
import { requireAdminSettingsCompanyScope } from "@/lib/admin/settings/sessionScope";
import { COMPANY_FILE_ERROR_CODES, isCompanyFileStorageKeyForCompany, validateCompanyFileUploadInput } from "@/lib/admin/settings/companyFilePolicy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CompanyFileRequestBody = {
  fileType?: string | null;
  originalName?: string | null;
  storageKey?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | string | null;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR");
}

async function readBody(request: Request): Promise<CompanyFileRequestBody> {
  const payload = (await request.json().catch(() => null)) as unknown;
  return typeof payload === "object" && payload !== null ? (payload as CompanyFileRequestBody) : {};
}

export async function GET() {
  const scopeResult = await requireAdminSettingsCompanyScope({
    allowProfileRequired: true,
    allowApprovalPending: true,
    allowSubscriptionManagement: true,
  });
  if (!scopeResult.ok) return scopeResult.response;

  try {
    const files = await listActiveCompanyFiles(scopeResult.companyScope.companyId);
    return NextResponse.json(
      { ok: true, files },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[ADMIN_COMPANY_FILES_LIST_FAILED]", { message, error });
    return NextResponse.json(
      { ok: false, error: "ADMIN_COMPANY_FILES_LIST_FAILED", message },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: Request) {
  const scopeResult = await requireAdminSettingsCompanyScope({
    allowProfileRequired: true,
    allowApprovalPending: true,
    allowSubscriptionManagement: true,
  });
  if (!scopeResult.ok) return scopeResult.response;

  try {
    const body = await readBody(request);
    const validation = validateCompanyFileUploadInput({
      fileType: body.fileType,
      originalName: body.originalName,
      mimeType: body.mimeType,
      sizeBytes: body.sizeBytes,
    });

    if (!validation.ok) {
      return NextResponse.json(
        { ok: false, error: "ADMIN_COMPANY_FILE_INVALID_INPUT", message: validation.error },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const storageKey = String(body.storageKey ?? "").trim();
    if (!isCompanyFileStorageKeyForCompany({ key: storageKey, companyId: scopeResult.companyScope.companyId, fileType: validation.fileType })) {
      return NextResponse.json(
        { ok: false, error: "ADMIN_COMPANY_FILE_INVALID_INPUT", message: COMPANY_FILE_ERROR_CODES.invalidStorageKey },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const file = await createOrReplaceCompanyFileMetadata({
      companyId: scopeResult.companyScope.companyId,
      fileType: validation.fileType,
      originalName: validation.originalName,
      storageKey,
      mimeType: validation.mimeType,
      sizeBytes: validation.sizeBytes,
      uploadedByUserId: scopeResult.companyScope.userId,
    });

    return NextResponse.json(
      { ok: true, file },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = getErrorMessage(error);
    if (error instanceof CompanyFileValidationError) {
      return NextResponse.json(
        { ok: false, error: "ADMIN_COMPANY_FILE_INVALID_INPUT", message },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    console.error("[ADMIN_COMPANY_FILE_SAVE_FAILED]", { message, error });
    return NextResponse.json(
      { ok: false, error: "ADMIN_COMPANY_FILE_SAVE_FAILED", message },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
