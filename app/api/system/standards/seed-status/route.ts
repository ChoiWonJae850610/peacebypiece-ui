import { NextResponse } from "next/server";

import { getSystemStandardsSeedStatus } from "@/lib/system/standards/seedStatusRepository";

export async function GET() {
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
