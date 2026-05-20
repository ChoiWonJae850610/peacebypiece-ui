import { NextRequest, NextResponse } from "next/server";

import { getAdminStandards, replaceAdminStandards } from "@/lib/admin/settings/standardsRepository";
import { requireAdminSettingsCompanyPermission } from "@/lib/admin/settings/sessionScope";
import type { AdminStandardsPayload } from "@/lib/admin/settings/standardsTypes";

function isRequestBody(value: unknown): value is Partial<AdminStandardsPayload> {
  return typeof value === "object" && value !== null;
}

export async function GET(_request: NextRequest) {
  const scopeResult = await requireAdminSettingsCompanyPermission("standards.read");
  if (!scopeResult.ok) return scopeResult.response;

  try {
    return NextResponse.json(await getAdminStandards(scopeResult.companyScope.companyId));
  } catch {
    return NextResponse.json(
      { units: [], itemCategories: [], defaultItemCategories: [], error: "ADMIN_STANDARDS_LIST_UNAVAILABLE" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const scopeResult = await requireAdminSettingsCompanyPermission("standards.manage");
  if (!scopeResult.ok) return scopeResult.response;

  try {
    const payload = (await request.json()) as unknown;
    if (!isRequestBody(payload)) {
      return NextResponse.json({ units: [], itemCategories: [], defaultItemCategories: [], error: "ADMIN_STANDARDS_PAYLOAD_REQUIRED" }, { status: 400 });
    }

    return NextResponse.json(await replaceAdminStandards(scopeResult.companyScope.companyId, payload));
  } catch {
    return NextResponse.json({ units: [], itemCategories: [], defaultItemCategories: [], error: "ADMIN_STANDARDS_SAVE_FAILED" }, { status: 500 });
  }
}
