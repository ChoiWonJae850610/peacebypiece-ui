import { NextRequest, NextResponse } from "next/server";

import { getAdminStandards, replaceAdminStandards } from "@/lib/admin/settings/standardsRepository";
import { requireAdminSettingsCompanyScope } from "@/lib/admin/settings/sessionScope";
import { requireApiPermission } from "@/lib/permissions";
import type { AdminStandardsPayload } from "@/lib/admin/settings/standardsTypes";

function isRequestBody(value: unknown): value is Partial<AdminStandardsPayload> {
  return typeof value === "object" && value !== null;
}

export async function GET() {
  const scopeResult = await requireAdminSettingsCompanyScope();
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
  const scopeResult = await requireAdminSettingsCompanyScope();
  if (!scopeResult.ok) return scopeResult.response;

  const permissionDenied = requireApiPermission(request, {
    permissionCode: "standards.manage",
    routeLabel: "admin.standards.update",
  });
  if (permissionDenied) return permissionDenied;

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
