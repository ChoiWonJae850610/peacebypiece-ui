import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import { MEMBER_PERMISSION_CODE } from "@/lib/permissions";
import { handleListAdminMembers } from "@/lib/admin/members/memberRouteHandlers";

export async function GET(request: Request) {
  const guard = await requireWorkspaceApiGuard({
    permissionCode: MEMBER_PERMISSION_CODE.memberRead,
  });
  if (!guard.ok) return guard.response;

  return handleListAdminMembers(request);
}
