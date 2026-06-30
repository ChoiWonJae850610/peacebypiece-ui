import { NextResponse } from "next/server";

import { requireSystemAdminScope } from "@/lib/system/sessionScope";
import { listSignupReviewApplications } from "@/lib/system/signupReviewRepository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  try {
    const url = new URL(request.url);
    const result = await listSignupReviewApplications({
      statuses: url.searchParams.get("status") ?? undefined,
      limit: url.searchParams.get("limit"),
      offset: url.searchParams.get("offset"),
    });
    return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { ok: false, code: "SIGNUP_REVIEW_LIST_UNAVAILABLE" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
