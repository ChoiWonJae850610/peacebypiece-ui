import { NextResponse } from "next/server";

import { getSystemStandardsRegressionSnapshot } from "@/lib/system/standards/regressionRepository";

export async function GET() {
  try {
    const snapshot = await getSystemStandardsRegressionSnapshot();
    return NextResponse.json({ ok: true, snapshot });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "SYSTEM_STANDARDS_REGRESSION_ERROR",
        message: error instanceof Error ? error.message : "Unknown system standards regression error",
      },
      { status: 500 },
    );
  }
}
