import { NextResponse } from "next/server";

import { getAdminCompanyById } from "@/lib/admin/settings/companyRepository";
import { requireAdminSettingsCompanyScope } from "@/lib/admin/settings/sessionScope";

export async function GET() {
  const scopeResult = await requireAdminSettingsCompanyScope();
  if (!scopeResult.ok) return scopeResult.response;

  try {
    const company = await getAdminCompanyById(scopeResult.companyScope.companyId);
    return NextResponse.json({ companies: company ? [company] : [] });
  } catch {
    return NextResponse.json(
      { companies: [], error: "ADMIN_COMPANIES_LIST_UNAVAILABLE" },
      { status: 500 },
    );
  }
}
