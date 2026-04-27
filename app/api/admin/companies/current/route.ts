import { NextResponse } from "next/server";
import { buildDefaultCompanySettings } from "@/lib/admin/companySettings.defaults";
import { getCurrentAdminCompany, getCompanySettings, updateCompanySettings } from "@/lib/admin/companySettings.repository";
import type { CompanySettingsUpdateInput } from "@/lib/admin/companySettings.types";
import { WORKSPACE_COMPANY_ID, WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";

export const runtime = "nodejs";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR");
}

function buildFallbackPayload() {
  return {
    company: { id: WORKSPACE_COMPANY_ID, name: WORKSPACE_COMPANY_NAME, memo: null, isActive: true },
    settings: buildDefaultCompanySettings(WORKSPACE_COMPANY_ID),
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
    return NextResponse.json({ ok: true, company, settings });
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
    return NextResponse.json({ ok: true, company, settings });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[ADMIN_COMPANY_SETTINGS_UPDATE_FAILED]", { message, error });
    return NextResponse.json({ ok: false, ...buildFallbackPayload(), error: "ADMIN_COMPANY_SETTINGS_UPDATE_FAILED", message }, { status: 500 });
  }
}
