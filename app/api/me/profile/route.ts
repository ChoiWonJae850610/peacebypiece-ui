import { NextRequest, NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { getPersonalProfile, updatePersonalProfile } from "@/lib/me/profileRepository";

export const dynamic = "force-dynamic";

function isProfilePatchBody(value: unknown): value is { name?: string | null; phone?: string | null; birthday?: string | null } {
  return typeof value === "object" && value !== null;
}

export async function GET() {
  const session = await getCurrentWaflSession();
  if (!session) {
    return NextResponse.json({ profile: null, error: "AUTH_REQUIRED" }, { status: 401 });
  }

  const profile = await getPersonalProfile(session);
  if (!profile) {
    return NextResponse.json({ profile: null, error: "PERSONAL_PROFILE_NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ profile }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest) {
  const session = await getCurrentWaflSession();
  if (!session) {
    return NextResponse.json({ profile: null, error: "AUTH_REQUIRED" }, { status: 401 });
  }

  const body = (await request.json()) as unknown;
  if (!isProfilePatchBody(body)) {
    return NextResponse.json({ profile: null, error: "PERSONAL_PROFILE_PAYLOAD_REQUIRED" }, { status: 400 });
  }

  try {
    const profile = await updatePersonalProfile(session, body);
    if (!profile) {
      return NextResponse.json({ profile: null, error: "PERSONAL_PROFILE_NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ profile }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "PERSONAL_PROFILE_SAVE_FAILED";
    const status = code === "PERSONAL_PROFILE_REQUIRED_FIELDS" ? 400 : 500;
    return NextResponse.json({ profile: null, error: code }, { status });
  }
}
