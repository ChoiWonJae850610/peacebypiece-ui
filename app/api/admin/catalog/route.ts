import { NextResponse } from "next/server";

import { requireAdminSettingsCompanyPermission } from "@/lib/admin/settings/sessionScope";
import { listCompanyCatalog, setCompanyCategoryEnabled } from "@/lib/catalog/systemCatalogRepository";

export async function GET() {
  const scope = await requireAdminSettingsCompanyPermission("standards.read");
  if (!scope.ok) return scope.response;

  try {
    return NextResponse.json({ ok: true, catalog: await listCompanyCatalog(scope.companyScope.companyId) });
  } catch {
    return NextResponse.json({ ok: false, error: "COMPANY_CATALOG_UNAVAILABLE" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const scope = await requireAdminSettingsCompanyPermission("standards.manage");
  if (!scope.ok) return scope.response;

  try {
    const payload = (await request.json()) as { categoryCode?: unknown; isEnabled?: unknown };
    const categoryCode = typeof payload.categoryCode === "string" ? payload.categoryCode.trim() : "";
    if (!categoryCode || typeof payload.isEnabled !== "boolean") {
      return NextResponse.json({ ok: false, error: "COMPANY_CATALOG_PATCH_INVALID" }, { status: 400 });
    }
    const catalog = await setCompanyCategoryEnabled({
      companyId: scope.companyScope.companyId,
      categoryCode,
      isEnabled: payload.isEnabled,
    });
    return NextResponse.json({ ok: true, catalog });
  } catch {
    return NextResponse.json({ ok: false, error: "COMPANY_CATALOG_PATCH_FAILED" }, { status: 500 });
  }
}
