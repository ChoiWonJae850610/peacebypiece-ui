import { NextResponse } from "next/server";
import { buildDefaultCompanySettings } from "@/lib/admin/companySettings.defaults";
import { getCurrentAdminCompany, getCompanySettings, updateCompanySettings } from "@/lib/admin/companySettings.repository";
import type { CompanySettingsUpdateInput } from "@/lib/admin/companySettings.types";
import { WORKSPACE_COMPANY_ID, WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";

export const runtime = "nodejs";

function buildFallbackPayload() {
  return {
    company: { id: WORKSPACE_COMPANY_ID, name: WORKSPACE_COMPANY_NAME, memo: null, isActive: true },
    settings: buildDefaultCompanySettings(WORKSPACE_COMPANY_ID),
  };
}

export async function GET() {
  try {
    const company = await getCurrentAdminCompany();
    const settings = await getCompanySettings(company.id);
    return NextResponse.json({ company, settings });
  } catch {
    return NextResponse.json({ ...buildFallbackPayload(), error: "ADMIN_CURRENT_COMPANY_UNAVAILABLE" }, { status: 200 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as CompanySettingsUpdateInput;
    const company = await getCurrentAdminCompany();
    const settings = await updateCompanySettings(company.id, body);
    return NextResponse.json({ ok: true, company, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    return NextResponse.json({ ok: false, ...buildFallbackPayload(), error: "ADMIN_COMPANY_SETTINGS_UPDATE_FAILED", message }, { status: 500 });
  }
}
