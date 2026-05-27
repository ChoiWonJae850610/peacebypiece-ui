import { NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import { getPersonalProfile } from "@/lib/me/profileRepository";
import type { WaflCurrentUserResponse } from "@/lib/auth/currentUser";
import { resolveMemberWorkspacePermissionCodes } from "@/lib/admin/members/memberWorkspaceAccess";

export const dynamic = "force-dynamic";

const noStoreHeaders = { "Cache-Control": "no-store" } as const;

export async function GET() {
  const session = await getCurrentWaflSession().catch(() => null);

  if (!session) {
    return NextResponse.json<WaflCurrentUserResponse>({ authenticated: false }, { status: 401, headers: noStoreHeaders });
  }

  const [profile, permissionCodes] = await Promise.all([
    session.companyId ? getPersonalProfile(session).catch(() => null) : null,
    session.companyId ? resolveMemberWorkspacePermissionCodes(session).catch(() => []) : Promise.resolve([]),
  ]);

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
        roleTemplateCode: profile?.roleTemplateCode ?? null,
        permissionCodes,
        profileComplete: profile?.profileComplete ?? false,
      },
    },
    { headers: noStoreHeaders },
  );
}
