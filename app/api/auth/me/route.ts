import { NextResponse } from "next/server";

import { getCurrentWaflSession } from "@/lib/auth/currentSession";
import type { WaflCurrentUserResponse } from "@/lib/auth/currentUser";

export async function GET() {
  const session = await getCurrentWaflSession();

  if (!session) {
    return NextResponse.json<WaflCurrentUserResponse>({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json<WaflCurrentUserResponse>({
    authenticated: true,
    user: {
      id: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
      companyId: session.companyId,
      companyName: session.companyName,
      companyMemberId: session.companyMemberId,
    },
  });
}
