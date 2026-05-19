import { NextResponse } from "next/server";

import { buildAdminBillingPlanOverview } from "@/lib/admin/settings/adminBillingPlanPlaceholder";
import { buildAdminAccountSettingsOverview } from "@/lib/admin/settings/adminAccountSettingsOverview";
import { createAdminHistoryLogSafe } from "@/lib/admin/history/repository";
import {
  getAdminAccountSettingsSnapshot,
  getAdminCompanyById,
  getCompanySettings,
  updateCompanySettings,
} from "@/lib/admin/settings/companyRepository";
import { requireAdminSettingsCompanyScope } from "@/lib/admin/settings/sessionScope";
import type { CompanySettingsUpdateInput } from "@/lib/admin/settings/companyTypes";

export const runtime = "nodejs";

const ADMIN_CURRENT_COMPANY_NOT_FOUND = "ADMIN_CURRENT_COMPANY_NOT_FOUND";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error || "UNKNOWN_ERROR");
}

async function readSettingsUpdateInput(request: Request): Promise<CompanySettingsUpdateInput> {
  const payload = (await request.json().catch(() => null)) as unknown;
  return typeof payload === "object" && payload !== null ? (payload as CompanySettingsUpdateInput) : {};
}

export async function GET() {
  const scopeResult = await requireAdminSettingsCompanyScope({
    allowProfileRequired: true,
    allowApprovalPending: true,
    allowSubscriptionManagement: true,
  });
  if (!scopeResult.ok) return scopeResult.response;

  try {
    const { companyId, userId } = scopeResult.companyScope;
    const company = await getAdminCompanyById(companyId);

    if (!company) {
      return NextResponse.json(
        { ok: false, error: ADMIN_CURRENT_COMPANY_NOT_FOUND },
        { status: 404 },
      );
    }

    const settings = await getCompanySettings(company.id);
    const accountSnapshot = await getAdminAccountSettingsSnapshot(company.id, userId);
    const billing = buildAdminBillingPlanOverview({ ok: true, company, settings });
    const account = buildAdminAccountSettingsOverview({ company, account: accountSnapshot });
    return NextResponse.json({ ok: true, company, settings, billing, account });
  } catch (error) {
    const message = getErrorMessage(error);
    console.error("[ADMIN_CURRENT_COMPANY_UNAVAILABLE]", { message, error });
    return NextResponse.json(
      { ok: false, error: "ADMIN_CURRENT_COMPANY_UNAVAILABLE", message },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const scopeResult = await requireAdminSettingsCompanyScope({
    allowProfileRequired: true,
    allowApprovalPending: true,
    allowSubscriptionManagement: true,
  });
  if (!scopeResult.ok) return scopeResult.response;

  try {
    const body = await readSettingsUpdateInput(request);
    const { companyId, userId } = scopeResult.companyScope;
    const company = await getAdminCompanyById(companyId);

    if (!company) {
      return NextResponse.json(
        { ok: false, error: ADMIN_CURRENT_COMPANY_NOT_FOUND },
        { status: 404 },
      );
    }

    const settings = await updateCompanySettings(company.id, body);
    await createAdminHistoryLogSafe({
      company_id: company.id,
      user_id: userId,
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
    return NextResponse.json(
      { ok: false, error: "ADMIN_COMPANY_SETTINGS_UPDATE_FAILED", message },
      { status: 500 },
    );
  }
}
