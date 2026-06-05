import { NextResponse } from "next/server";

import { requireSystemAdminScope } from "@/lib/system/sessionScope";
import {
  isSystemCompanyFileReviewAction,
  listSystemCompanyFileReviews,
  updateSystemCompanyFileReview,
} from "@/lib/system/companyFileReviewRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getRequestLimit(request: Request): number {
  const url = new URL(request.url);
  const rawLimit = Number(url.searchParams.get("limit") || 50);
  if (!Number.isFinite(rawLimit)) return 50;
  return Math.min(Math.max(Math.trunc(rawLimit), 1), 200);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "SYSTEM_COMPANY_FILE_REVIEW_FAILED");
}

function getStatusForError(error: unknown): number {
  const message = getErrorMessage(error);
  if (message === "SYSTEM_COMPANY_FILE_NOT_FOUND") return 404;
  if (
    message === "SYSTEM_COMPANY_FILE_ID_REQUIRED" ||
    message === "SYSTEM_COMPANY_FILE_REVIEWER_REQUIRED" ||
    message === "SYSTEM_COMPANY_FILE_REJECTION_REASON_REQUIRED" ||
    message === "SYSTEM_COMPANY_FILE_REVIEW_REASON_TOO_LONG"
  ) {
    return 400;
  }
  return 500;
}

export async function GET(request: Request) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  try {
    const files = await listSystemCompanyFileReviews(getRequestLimit(request));
    return NextResponse.json(
      { ok: true, files },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "SYSTEM_COMPANY_FILE_REVIEW_LIST_FAILED",
        message: getErrorMessage(error),
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function PATCH(request: Request) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  try {
    const payload = (await request.json().catch(() => null)) as {
      fileId?: unknown;
      action?: unknown;
      reviewReason?: unknown;
    } | null;

    const fileId = typeof payload?.fileId === "string" ? payload.fileId.trim() : "";
    if (!fileId) {
      return NextResponse.json(
        { ok: false, error: "SYSTEM_COMPANY_FILE_ID_REQUIRED" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (!isSystemCompanyFileReviewAction(payload?.action)) {
      return NextResponse.json(
        { ok: false, error: "SYSTEM_COMPANY_FILE_REVIEW_ACTION_INVALID" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const file = await updateSystemCompanyFileReview({
      fileId,
      reviewerUserId: scope.systemScope.userId,
      action: payload.action,
      reviewReason: payload.reviewReason,
    });

    return NextResponse.json(
      { ok: true, file },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "SYSTEM_COMPANY_FILE_REVIEW_UPDATE_FAILED",
        message: getErrorMessage(error),
      },
      { status: getStatusForError(error), headers: { "Cache-Control": "no-store" } },
    );
  }
}
