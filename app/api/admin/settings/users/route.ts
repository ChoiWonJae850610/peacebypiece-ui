import { NextResponse } from "next/server";

import { listCompanyUserAccessProfiles } from "@/lib/admin/settings/userAccessRepository";
import { WORKORDER_SEED_USERS } from "@/lib/data/mock/users";

export const runtime = "nodejs";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR");
}

export async function GET() {
  try {
    const users = await listCompanyUserAccessProfiles();
    return NextResponse.json({ ok: true, sourceState: "db-connected", users });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[ADMIN_USER_ACCESS_UNAVAILABLE]", { message, error });
    return NextResponse.json(
      { ok: false, sourceState: "mock-fallback", users: WORKORDER_SEED_USERS, error: "ADMIN_USER_ACCESS_UNAVAILABLE", message },
      { status: 200 },
    );
  }
}
