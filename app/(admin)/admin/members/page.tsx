import AdminShell from "@/components/admin/layout/AdminShell";
import AdminMemberManagementDashboard from "@/components/admin/members/AdminMemberManagementDashboard";
import { getAdminNavigationItems } from "@/lib/admin/adminDashboard.presentation";
import { APP_VERSION } from "@/lib/constants/app";
import { getAdminMemberCompanyScope } from "@/lib/admin/members/sessionScope";
import { getI18n } from "@/lib/i18n";

export default async function AdminMembersPage() {
  const pageText = getI18n().admin.memberManagement;
  const companyScope = await getAdminMemberCompanyScope();

  return (
    <AdminShell
      companyName={companyScope?.companyName ?? ""}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/admin/members")}
      title={pageText.title}
      description={pageText.description}
    >
      <AdminMemberManagementDashboard />
    </AdminShell>
  );
}
