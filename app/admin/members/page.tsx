import AdminShell from "@/components/admin/layout/AdminShell";
import AdminMemberManagementPlaceholder from "@/components/admin/members/AdminMemberManagementPlaceholder";
import { getAdminNavigationItems } from "@/lib/admin/adminDashboard.presentation";
import { APP_VERSION } from "@/lib/constants/app";
import { WORKSPACE_COMPANY_NAME } from "@/lib/constants/company";
import { getI18n } from "@/lib/i18n";

export default function AdminMembersPage() {
  const pageText = getI18n().admin.memberManagement;

  return (
    <AdminShell
      companyName={WORKSPACE_COMPANY_NAME}
      appVersion={APP_VERSION}
      navigationItems={getAdminNavigationItems("/admin/members")}
      title={pageText.title}
      description={pageText.description}
    >
      <AdminMemberManagementPlaceholder />
    </AdminShell>
  );
}
