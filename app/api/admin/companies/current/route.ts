import { NextResponse } from "next/server";
import { buildDefaultCompanySettings } from "@/lib/admin/companySettings.defaults";
import { getCurrentAdminCompany, getCompanySettings } from "@/lib/admin/companySettings.repository";
import { WORKSPACE_COMPANY_ID, WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";

export async function GET() {
  try {
    const company = await getCurrentAdminCompany();
    const settings = await getCompanySettings(company.id);
    return NextResponse.json({ company, settings });
  } catch {
    return NextResponse.json({
      company: { id: WORKSPACE_COMPANY_ID, name: WORKSPACE_COMPANY_NAME, memo: null, isActive: true },
      settings: buildDefaultCompanySettings(WORKSPACE_COMPANY_ID),
      error: "ADMIN_CURRENT_COMPANY_UNAVAILABLE",
    }, { status: 200 });
  }
}
