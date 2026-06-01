import WorkspacePageShell from "@/components/workspace/layout/WorkspacePageShell";
import AdminMemberManagementDashboard from "@/components/admin/members/AdminMemberManagementDashboard";
import { getAdminMemberCompanyScope } from "@/lib/admin/members/sessionScope";
import { getI18n } from "@/lib/i18n";
import { requireWorkspacePagePermission } from "@/lib/auth/routeGuard";

export default async function AdminMembersPage() {
  const session = await requireWorkspacePagePermission("member.read");
  const pageText = getI18n().admin.memberManagement;
  const companyScope = await getAdminMemberCompanyScope();

  return (
    <WorkspacePageShell
      session={session}
      activeHref="/workspace/members"
      companyName={companyScope?.companyName}
      title={pageText.title}
      description={pageText.description}
    >
      <AdminMemberManagementDashboard />
    </WorkspacePageShell>
  );
}
