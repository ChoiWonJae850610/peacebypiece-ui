import { NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { createCompanyApiAccessBlockedResponse } from "@/lib/billing/companyApiAccessGuard";
import { listCompanyUserAccessProfiles } from "@/lib/admin/settings/userAccessRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : String(error || "UNKNOWN_ERROR");
}

export async function GET() {
  try {
    const session = await getCurrentWaflSession();
    const companyId = session?.companyId?.trim();

    if (!companyId) {
      return NextResponse.json(
        {
          ok: false,
          sourceState: "unauthenticated",
          users: [],
          error: "COMPANY_SESSION_REQUIRED",
        },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    const blockedResponse = await createCompanyApiAccessBlockedResponse(companyId);
    if (blockedResponse) return blockedResponse;

    const users = await listCompanyUserAccessProfiles(companyId);
    return NextResponse.json(
      { ok: true, sourceState: "db-connected", users },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[ADMIN_USER_ACCESS_UNAVAILABLE]", { message, error });
    return NextResponse.json(
      {
        ok: false,
        sourceState: "unavailable",
        users: [],
        error: "ADMIN_USER_ACCESS_UNAVAILABLE",
        message,
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
