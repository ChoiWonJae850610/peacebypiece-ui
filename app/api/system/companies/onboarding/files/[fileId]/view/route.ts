import { NextRequest, NextResponse } from "next/server";

import { getActiveCompanyOnboardingFileMetadataById } from "@/lib/admin/settings/companyOnboardingFileRepository";
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

export async function GET(request: NextRequest, context: RouteContext) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  if (!isR2WorkerUploadConfigured()) {
    return NextResponse.json(
      { ok: false, error: "COMPANY_ONBOARDING_FILE_VIEW_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const params = await context.params;
  const fileId = params.fileId?.trim() ?? "";
  if (!fileId) {
    return NextResponse.json(
      { ok: false, error: "COMPANY_ONBOARDING_FILE_NOT_FOUND" },
      { status: 404 },
    );
  }

  const file = await getActiveCompanyOnboardingFileMetadataById(fileId);
  if (!file) {
    return NextResponse.json(
      { ok: false, error: "COMPANY_ONBOARDING_FILE_NOT_FOUND" },
      { status: 404 },
    );
  }

  if (!isCompanyOnboardingFileStorageKeyForCompany({
    key: file.storageKey,
    companyId: file.companyId,
    fileType: file.fileType,
  })) {
    return NextResponse.json(
      { ok: false, error: "COMPANY_ONBOARDING_FILE_INVALID_STORAGE_KEY" },
      { status: 400 },
    );
  }

  const signedUrl = createR2WorkerFileUrl({ key: file.storageKey });
  const download = request.nextUrl.searchParams.get("download") === "1" || file.mimeType === "application/pdf";
  const targetUrl = appendDownloadParams({
    url: signedUrl.url,
    download,
    fileName: file.originalName,
  });

  return NextResponse.redirect(targetUrl, {
    status: 302,
    headers: { "Cache-Control": "no-store" },
  });
}
