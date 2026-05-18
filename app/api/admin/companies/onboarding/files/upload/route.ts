import { NextRequest, NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { createCompanyApiAccessBlockedResponse } from "@/lib/billing/companyApiAccessGuard";
import { uploadCompanyOnboardingFile } from "@/lib/admin/settings/companyOnboardingFileService";
import { COMPANY_ONBOARDING_FILE_ERROR_CODES } from "@/lib/admin/settings/companyOnboardingFilePolicy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function readFormText(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readFormFile(formData: FormData): File | null {
  const value = formData.get("file");
  return value instanceof File && value.size > 0 ? value : null;
}

function getStatusByErrorCode(code: string): number {
  if (code === COMPANY_ONBOARDING_FILE_ERROR_CODES.uploadNotConfigured) return 503;
  if (
    code === COMPANY_ONBOARDING_FILE_ERROR_CODES.fileRequired ||
    code === COMPANY_ONBOARDING_FILE_ERROR_CODES.fileTypeRequired ||
    code === COMPANY_ONBOARDING_FILE_ERROR_CODES.fileTypeUnsupported ||
    code === COMPANY_ONBOARDING_FILE_ERROR_CODES.mimeTypeUnsupported ||
    code === COMPANY_ONBOARDING_FILE_ERROR_CODES.fileSizeUnsupported
  ) {
    return 400;
  }
  return 500;
}

function getErrorCode(error: unknown): string {
  return error instanceof Error && error.message ? error.message : COMPANY_ONBOARDING_FILE_ERROR_CODES.uploadFailed;
}



async function requireOnboardingFileCompanyApiAccess(companyId: string): Promise<NextResponse | null> {
  return createCompanyApiAccessBlockedResponse(companyId, {
    allowProfileRequired: true,
    allowApprovalPending: true,
    allowSubscriptionManagement: true,
  });
}
export async function POST(request: NextRequest) {
  const session = await getCurrentWaflSession();

  if (!session || session.role !== "company_admin" || !session.companyId) {
    return NextResponse.json(
      { file: null, error: COMPANY_ONBOARDING_FILE_ERROR_CODES.sessionRequired },
      { status: 401 },
    );
  }

  const blockedResponse = await requireOnboardingFileCompanyApiAccess(session.companyId);
  if (blockedResponse) return blockedResponse;

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      { file: null, error: COMPANY_ONBOARDING_FILE_ERROR_CODES.fileRequired },
      { status: 400 },
    );
  }

  const file = readFormFile(formData);
  if (!file) {
    return NextResponse.json(
      { file: null, error: COMPANY_ONBOARDING_FILE_ERROR_CODES.fileRequired },
      { status: 400 },
    );
  }

  try {
    const uploaded = await uploadCompanyOnboardingFile({
      companyId: session.companyId,
      uploadedByUserId: session.userId,
      fileType: readFormText(formData, "file_type") ?? readFormText(formData, "fileType"),
      file,
    });

    return NextResponse.json(
      { file: uploaded },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const code = getErrorCode(error);
    return NextResponse.json(
      { file: null, error: code },
      { status: getStatusByErrorCode(code) },
    );
  }
}
