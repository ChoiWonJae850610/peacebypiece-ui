import { NextResponse } from "next/server";

import { requireSystemAdminScope } from "@/lib/system/sessionScope";
import { getSystemStandardsSeedStatus } from "@/lib/system/standards/seedStatusRepository";

export async function GET() {
  const scope = await requireSystemAdminScope();
  if (!scope.ok) return scope.response;

  try {
    const status = await getSystemStandardsSeedStatus();
    return NextResponse.json({ ok: true, status });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "SYSTEM_STANDARDS_SEED_STATUS_ERROR",
        message: error instanceof Error ? error.message : "Unknown system standards seed status error",
      },
      { status: 500 },
    );
  }
}
