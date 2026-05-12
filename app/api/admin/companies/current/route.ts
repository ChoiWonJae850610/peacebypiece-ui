import { NextResponse } from "next/server";
import { buildDefaultCompanySettings } from "@/lib/admin/settings/companyDefaults";
import { createAdminHistoryLogSafe } from "@/lib/admin/history/repository";
import { getCurrentAdminCompany, getCompanySettings, updateCompanySettings } from "@/lib/admin/settings/companyRepository";
import type { CompanySettingsUpdateInput } from "@/lib/admin/settings/companyTypes";
import { WORKSPACE_COMPANY_ID, WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";
import { buildAdminBillingPlanOverview } from "@/lib/admin/settings/adminBillingPlanPlaceholder";

export const runtime = "nodejs";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR");
}

function buildFallbackPayload() {
  const settings = buildDefaultCompanySettings(WORKSPACE_COMPANY_ID);
  const company = { id: WORKSPACE_COMPANY_ID, name: WORKSPACE_COMPANY_NAME, memo: null, isActive: true };

  return {
    company,
    settings,
    billing: buildAdminBillingPlanOverview({ ok: false, company, settings }),
  };
}

async function readSettingsUpdateInput(request: Request): Promise<CompanySettingsUpdateInput> {
  const payload = (await request.json().catch(() => null)) as unknown;
  return typeof payload === "object" && payload !== null ? (payload as CompanySettingsUpdateInput) : {};
}

export async function GET() {
  try {
    const company = await getCurrentAdminCompany();
    const settings = await getCompanySettings(company.id);
    const billing = buildAdminBillingPlanOverview({ ok: true, company, settings });
    return NextResponse.json({ ok: true, company, settings, billing });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[ADMIN_CURRENT_COMPANY_UNAVAILABLE]", { message, error });
    return NextResponse.json({ ok: false, ...buildFallbackPayload(), error: "ADMIN_CURRENT_COMPANY_UNAVAILABLE", message }, { status: 200 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await readSettingsUpdateInput(request);
    const company = await getCurrentAdminCompany();
    const settings = await updateCompanySettings(company.id, body);
    await createAdminHistoryLogSafe({
      company_id: company.id,
      user_id: "admin",
      action_type: "SETTINGS_CHANGED",
      target_type: "settings",
      target_id: company.id,
      message: "환경설정 변경",
      metadata: {
        companyId: company.id,
        updatedSections: Object.keys(body),
      },
    });
    return NextResponse.json({ ok: true, company, settings });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[ADMIN_COMPANY_SETTINGS_UPDATE_FAILED]", { message, error });
    return NextResponse.json({ ok: false, ...buildFallbackPayload(), error: "ADMIN_COMPANY_SETTINGS_UPDATE_FAILED", message }, { status: 500 });
  }
}
