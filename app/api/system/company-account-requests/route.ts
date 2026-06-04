import { NextResponse } from "next/server";

import { requireSystemAdminScope } from "@/lib/system/sessionScope";
import {
  isSystemCompanyAccountRequestReviewAction,
  listSystemCompanyAccountRequests,
  updateSystemCompanyAccountRequestStatus,
} from "@/lib/system/companyAccountRequestsRepository";

export const runtime = "nodejs";

function getRequestLimit(request: Request): number {
  const url = new URL(request.url);
  const rawLimit = Number(url.searchParams.get("limit") || 50);
  if (!Number.isFinite(rawLimit)) return 50;
  return Math.min(Math.max(Math.trunc(rawLimit), 1), 200);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "SYSTEM_COMPANY_ACCOUNT_REQUEST_LIST_FAILED");
}

export async function GET(request: Request) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  try {
    const requests = await listSystemCompanyAccountRequests(getRequestLimit(request));
    return NextResponse.json({ ok: true, requests });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "SYSTEM_COMPANY_ACCOUNT_REQUEST_LIST_FAILED",
        message: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  try {
    const payload = (await request.json()) as {
      requestId?: unknown;
      action?: unknown;
      reviewMessage?: unknown;
    };

    const requestId = typeof payload.requestId === "string" ? payload.requestId.trim() : "";
    if (!requestId) {
      return NextResponse.json(
        { ok: false, error: "SYSTEM_COMPANY_ACCOUNT_REQUEST_ID_REQUIRED" },
        { status: 400 },
      );
    }

    if (!isSystemCompanyAccountRequestReviewAction(payload.action)) {
      return NextResponse.json(
        { ok: false, error: "SYSTEM_COMPANY_ACCOUNT_REQUEST_ACTION_INVALID" },
        { status: 400 },
      );
    }

    const updatedRequest = await updateSystemCompanyAccountRequestStatus({
      requestId,
      reviewerUserId: scope.systemScope.userId,
      action: payload.action,
      reviewMessage: payload.reviewMessage,
    });

    return NextResponse.json({ ok: true, request: updatedRequest });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "SYSTEM_COMPANY_ACCOUNT_REQUEST_REVIEW_FAILED",
        message: getErrorMessage(error),
      },
      { status: getErrorMessage(error) === "SYSTEM_COMPANY_ACCOUNT_REQUEST_NOT_FOUND" ? 404 : 500 },
    );
  }
}
