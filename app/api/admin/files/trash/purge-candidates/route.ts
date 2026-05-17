import { NextRequest, NextResponse } from "next/server";
import { listPurgeReadyAttachmentTrashItems } from "@/lib/admin/files/serverActions";
import { requireAdminFileCompanyScope } from "@/lib/admin/files/sessionScope";
import { getCompanySettings } from "@/lib/admin/settings/companyRepository";

export const runtime = "nodejs";

function readLimit(request: NextRequest): number {
  const value = request.nextUrl.searchParams.get("limit");
  const parsed = Number(value ?? 50);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), 1), 200) : 50;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR");
}

export async function GET(request: NextRequest) {
  const scopeResult = await requireAdminFileCompanyScope();
  if (!scopeResult.ok) return scopeResult.response;

  try {
    const { companyId } = scopeResult.companyScope;
    const settings = await getCompanySettings(companyId);
    const candidates = await listPurgeReadyAttachmentTrashItems({
      companyId,
      limit: readLimit(request),
      trashRetentionDays: settings.filePolicy.trashRetentionDays,
    });

    return NextResponse.json({
      ok: true,
      storageDeleteMode: "deferred-worker",
      candidates,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[ADMIN_FILE_PURGE_CANDIDATES_FAILED]", { message, error });
    return NextResponse.json({ ok: false, error: "ADMIN_FILE_PURGE_CANDIDATES_FAILED", message }, { status: 500 });
  }
}
