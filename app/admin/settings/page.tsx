import AdminShell from "@/components/admin/layout/AdminShell";
import AdminCompanySettingsForm from "@/components/admin/settings/AdminCompanySettingsForm";
import AdminStandardsSection from "@/components/admin/standards/AdminStandardsSection";
import { getAdminNavigationItems } from "@/lib/admin/adminDashboard.presentation";
import { buildDefaultCompanySettings } from "@/lib/admin/companySettings.defaults";
import { getCurrentAdminCompany, getCompanySettings } from "@/lib/admin/companySettings.repository";
import type { CompanySettings } from "@/lib/admin/companySettings.types";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_ID, WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";

async function getInitialSettings(): Promise<{ companyName: string; settings: CompanySettings }> {
  try {
    const company = await getCurrentAdminCompany();
    const settings = await getCompanySettings(company.id);
    return { companyName: company.name, settings };
  } catch {
    return { companyName: WORKSPACE_COMPANY_NAME, settings: buildDefaultCompanySettings(WORKSPACE_COMPANY_ID) };
  }
}

export default async function AdminSettingsPage() {
  const { companyName, settings } = await getInitialSettings();

  return (
    <AdminShell
      companyName={companyName}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/admin/settings")}
      title="환경설정"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
        <AdminCompanySettingsForm initialSettings={settings} companyName={companyName} />
        <AdminStandardsSection />
      </div>
    </AdminShell>
  );
}
