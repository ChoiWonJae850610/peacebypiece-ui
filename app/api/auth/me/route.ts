import { NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { getPersonalProfile } from "@/lib/me/profileRepository";
import type { WaflCurrentUserResponse } from "@/lib/auth/currentUser";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentWaflSession();

  if (!session) {
    return NextResponse.json<WaflCurrentUserResponse>({ authenticated: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const profile = session.companyId ? await getPersonalProfile(session) : null;

  return NextResponse.json<WaflCurrentUserResponse>(
    {
      authenticated: true,
      user: {
        id: session.userId,
        name: profile?.name ?? session.name,
        email: profile?.email ?? session.email,
        role: session.role,
        companyId: session.companyId,
        companyName: profile?.companyName ?? session.companyName,
        companyMemberId: session.companyMemberId,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
