import { NextRequest, NextResponse } from "next/server";
import { getAdminStandards, replaceAdminStandards } from "@/lib/admin/settings/standardsRepository";
import type { AdminStandardsPayload } from "@/lib/admin/settings/standardsTypes";

function isRequestBody(value: unknown): value is Partial<AdminStandardsPayload> {
  return typeof value === "object" && value !== null;
}

export async function GET() {
  try {
    return NextResponse.json(await getAdminStandards());
  } catch {
    return NextResponse.json({ units: [], itemCategories: [], defaultItemCategories: [], error: "ADMIN_STANDARDS_LIST_UNAVAILABLE" }, { status: 200 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = (await request.json()) as unknown;
    if (!isRequestBody(payload)) {
      return NextResponse.json({ units: [], itemCategories: [], defaultItemCategories: [], error: "ADMIN_STANDARDS_PAYLOAD_REQUIRED" }, { status: 400 });
    }

    return NextResponse.json(await replaceAdminStandards(payload));
  } catch {
    return NextResponse.json({ units: [], itemCategories: [], defaultItemCategories: [], error: "ADMIN_STANDARDS_SAVE_FAILED" }, { status: 500 });
  }
}
