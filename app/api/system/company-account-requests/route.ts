import { NextResponse } from "next/server";

import { requireSystemAdminScope } from "@/lib/system/sessionScope";
import { listSystemCompanyAccountRequests } from "@/lib/system/companyAccountRequestsRepository";

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
