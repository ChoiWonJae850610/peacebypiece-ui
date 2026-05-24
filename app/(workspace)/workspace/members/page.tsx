import WorkspaceShell from "@/components/workspace/layout/WorkspaceShell";
import AdminMemberManagementDashboard from "@/components/admin/members/AdminMemberManagementDashboard";
import { getWorkspaceNavigationItems } from "@/lib/navigation/workspaceNavigation";
import { APP_VERSION } from "@/lib/constants/app";
import { getAdminMemberCompanyScope } from "@/lib/admin/members/sessionScope";
import { getI18n } from "@/lib/i18n";

export default async function AdminMembersPage() {
  const pageText = getI18n().admin.memberManagement;
  const companyScope = await getAdminMemberCompanyScope();

  return (
    <WorkspaceShell
      companyName={companyScope?.companyName ?? ""}
      appVersion={APP_VERSION}
      navigationItems={getWorkspaceNavigationItems("/workspace/members")}
      title={pageText.title}
      description={pageText.description}
    >
      <AdminMemberManagementDashboard />
    </WorkspaceShell>
  );
}
