import AdminShell from "@/components/admin/layout/AdminShell";
import AdminCompanySettingsForm from "@/components/admin/settings/AdminCompanySettingsForm";
import AdminUserAccessPreview from "@/components/admin/settings/AdminUserAccessPreview";
import AdminStandardsSection from "@/components/admin/standards/AdminStandardsSection";
import { getAdminNavigationItems } from "@/lib/admin/adminDashboard.presentation";
import { buildDefaultCompanySettings } from "@/lib/admin/settings/companyDefaults";
import { getCurrentAdminCompany, getCompanySettings } from "@/lib/admin/settings/companyRepository";
import type { CompanySettings } from "@/lib/admin/settings/companyTypes";
import { listCompanyUserAccessProfiles } from "@/lib/admin/settings/userAccessRepository";
import type { AdminUserAccessSourceState } from "@/lib/admin/settings/userAccessPresentation";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_ID, WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";
import { WORKORDER_SEED_USERS } from "@/lib/data/mock/users";
import { getI18n } from "@/lib/i18n";
import type { UserProfile } from "@/types/user";

async function getInitialSettings(): Promise<{ companyName: string; settings: CompanySettings }> {
  try {
    const company = await getCurrentAdminCompany();
    const settings = await getCompanySettings(company.id);
    return { companyName: company.name, settings };
  } catch {
    return { companyName: WORKSPACE_COMPANY_NAME, settings: buildDefaultCompanySettings(WORKSPACE_COMPANY_ID) };
  }
}

async function getInitialUserAccess(): Promise<{ users: UserProfile[]; sourceState: AdminUserAccessSourceState }> {
  try {
    const users = await listCompanyUserAccessProfiles();
    return { users: users.length > 0 ? users : WORKORDER_SEED_USERS, sourceState: users.length > 0 ? "db-connected" : "db-prepared" };
  } catch {
    return { users: WORKORDER_SEED_USERS, sourceState: "mock-fallback" };
  }
}

export default async function AdminSettingsPage() {
  const pageText = getI18n().admin.settingsForm;
  const { companyName, settings } = await getInitialSettings();
  const userAccess = await getInitialUserAccess();

  return (
    <AdminShell
      companyName={companyName}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/admin/settings")}
      title={pageText.title}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
        <AdminCompanySettingsForm initialSettings={settings} companyName={companyName} />
        <AdminUserAccessPreview users={userAccess.users} sourceState={userAccess.sourceState} />
        <AdminStandardsSection />
      </div>
    </AdminShell>
  );
}
