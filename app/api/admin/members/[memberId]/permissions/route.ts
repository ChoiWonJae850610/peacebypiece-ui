import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import { MEMBER_PERMISSION_CODE } from "@/lib/permissions";
import { handleUpdateAdminMemberPermissions } from "@/lib/admin/members/memberRouteHandlers";

type AdminMemberPermissionsRouteContext = {
  params: Promise<{
    memberId: string;
  }>;
};

export async function PATCH(request: Request, context: AdminMemberPermissionsRouteContext) {
  const guard = await requireWorkspaceApiGuard({
    permissionCode: MEMBER_PERMISSION_CODE.memberPermissionUpdate,
  });
  if (!guard.ok) return guard.response;

  const { memberId } = await context.params;
  return handleUpdateAdminMemberPermissions(memberId, request);
}
