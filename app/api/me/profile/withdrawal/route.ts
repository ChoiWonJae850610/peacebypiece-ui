import { NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { requestPersonalMemberWithdrawal } from "@/lib/me/profileRepository";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getCurrentWaflSession();
  if (!session) {
    return NextResponse.json({ profile: null, error: "AUTH_REQUIRED" }, { status: 401 });
  }

  try {
    const profile = await requestPersonalMemberWithdrawal(session);
    if (!profile) {
      return NextResponse.json({ profile: null, error: "PERSONAL_PROFILE_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ profile }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "PERSONAL_MEMBER_WITHDRAWAL_REQUEST_FAILED";
    const status = code.endsWith("_REQUIRED") ? 400 : code.endsWith("_NOT_FOUND") ? 404 : code.endsWith("_BLOCKED") || code.endsWith("_WITHDRAWN") ? 409 : 500;
    return NextResponse.json({ profile: null, error: code }, { status });
  }
}
