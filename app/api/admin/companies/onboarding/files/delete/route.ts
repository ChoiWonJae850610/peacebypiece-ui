import { NextRequest, NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { createCompanyApiAccessBlockedResponse } from "@/lib/billing/companyApiAccessGuard";
import { deleteCompanyOnboardingFile } from "@/lib/admin/settings/companyOnboardingFileService";
import { COMPANY_ONBOARDING_FILE_ERROR_CODES } from "@/lib/admin/settings/companyOnboardingFilePolicy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type DeleteCompanyOnboardingFileRequest = {
  fileId?: unknown;
};

function readText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getStatusByErrorCode(code: string): number {
  if (code === COMPANY_ONBOARDING_FILE_ERROR_CODES.uploadNotConfigured) return 503;
  if (code === COMPANY_ONBOARDING_FILE_ERROR_CODES.fileNotFound) return 404;
  return 500;
}

function getErrorCode(error: unknown): string {
  return error instanceof Error && error.message ? error.message : COMPANY_ONBOARDING_FILE_ERROR_CODES.deleteFailed;
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

  const body = (await request.json().catch(() => null)) as DeleteCompanyOnboardingFileRequest | null;
  const fileId = readText(body?.fileId);

  if (!fileId) {
    return NextResponse.json(
      { file: null, error: COMPANY_ONBOARDING_FILE_ERROR_CODES.fileNotFound },
      { status: 404 },
    );
  }

  try {
    const deleted = await deleteCompanyOnboardingFile({
      companyId: session.companyId,
      fileId,
    });

    if (!deleted) {
      return NextResponse.json(
        { file: null, error: COMPANY_ONBOARDING_FILE_ERROR_CODES.fileNotFound },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { file: deleted },
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
