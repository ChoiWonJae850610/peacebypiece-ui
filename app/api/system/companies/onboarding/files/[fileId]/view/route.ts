import { NextRequest, NextResponse } from "next/server";

import {
  getActiveCompanyOnboardingFileMetadata,
  getActiveCompanyOnboardingFileMetadataById,
} from "@/lib/admin/settings/companyOnboardingFileRepository";
import { isCompanyOnboardingFileStorageKeyForCompany } from "@/lib/admin/settings/companyOnboardingFilePolicy";
import { createR2WorkerFileUrl, isR2WorkerUploadConfigured } from "@/lib/storage/r2/r2WorkerUpload";
import { requireSystemAdminScope } from "@/lib/system/sessionScope";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ fileId?: string }>;
};

function appendDownloadParams(input: { url: string; download: boolean; fileName: string }): string {
  const url = new URL(input.url);
  if (input.download) {
    url.searchParams.set("download", "1");
    url.searchParams.set("name", input.fileName);
  }
  return url.toString();
}

function normalizeQueryValue(value: string | null): string | null {
  const normalized = value?.trim() ?? "";
  return normalized.length > 0 ? normalized : null;
}

function createSystemCompanyOnboardingFileErrorResponse(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  if (!isR2WorkerUploadConfigured()) {
    return createSystemCompanyOnboardingFileErrorResponse("COMPANY_ONBOARDING_FILE_VIEW_NOT_CONFIGURED", 503);
  }

  const params = await context.params;
  const fileId = params.fileId?.trim() ?? "";
  if (!fileId) {
    return createSystemCompanyOnboardingFileErrorResponse("COMPANY_ONBOARDING_FILE_NOT_FOUND", 404);
  }

  const companyId = normalizeQueryValue(request.nextUrl.searchParams.get("companyId"));
  const file = companyId
    ? await getActiveCompanyOnboardingFileMetadata({ companyId, fileId })
    : await getActiveCompanyOnboardingFileMetadataById(fileId);

  if (!file) {
    return createSystemCompanyOnboardingFileErrorResponse("COMPANY_ONBOARDING_FILE_NOT_FOUND", 404);
  }

  if (
    companyId &&
    file.companyId !== companyId
  ) {
    return createSystemCompanyOnboardingFileErrorResponse("COMPANY_ONBOARDING_FILE_COMPANY_MISMATCH", 403);
  }

  if (!isCompanyOnboardingFileStorageKeyForCompany({
    key: file.storageKey,
    companyId: file.companyId,
    fileType: file.fileType,
  })) {
    return createSystemCompanyOnboardingFileErrorResponse("COMPANY_ONBOARDING_FILE_INVALID_STORAGE_KEY", 400);
  }

  try {
    const signedUrl = createR2WorkerFileUrl({ key: file.storageKey });
    const download = request.nextUrl.searchParams.get("download") === "1";
    const targetUrl = appendDownloadParams({
      url: signedUrl.url,
      download,
      fileName: file.originalName,
    });

    return NextResponse.redirect(targetUrl, {
      status: 302,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[SYSTEM_COMPANY_ONBOARDING_FILE_VIEW_FAILED]", {
      fileId: file.id,
      companyId: file.companyId,
      fileType: file.fileType,
      message: error instanceof Error ? error.message : String(error),
    });

    return createSystemCompanyOnboardingFileErrorResponse("COMPANY_ONBOARDING_FILE_VIEW_FAILED", 502);
  }
}
