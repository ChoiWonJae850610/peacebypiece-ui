import MemberWorkspaceHome from "@/components/workspace/MemberWorkspaceHome";
import { requireWaflSessionForArea } from "@/lib/auth/routeGuard";
import { resolveMemberWorkspacePermissionCodes } from "@/lib/admin/members/memberWorkspaceAccess";

export default async function WorkspacePage() {
  const session = await requireWaflSessionForArea("worker");
  const permissionCodes = await resolveMemberWorkspacePermissionCodes(session);

  return (
    <MemberWorkspaceHome
      companyName={session.companyName}
      permissionCodes={permissionCodes}
    />
  );
}
