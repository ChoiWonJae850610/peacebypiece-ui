import CompanyMemberInviteSkeleton from "@/components/admin/invitations/CompanyMemberInviteSkeleton";
import { requireWorkspacePagePermission } from "@/lib/auth/routeGuard";

export default async function AdminInvitesPage() {
  await requireWorkspacePagePermission("member.invite");
  return <CompanyMemberInviteSkeleton />;
}
