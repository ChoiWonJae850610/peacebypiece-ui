import { MEMBER_PERMISSION_CODE, requireApiPermission } from "@/lib/permissions";
import { handleUpdateAdminMemberPermissions } from "@/lib/admin/members/memberRouteHandlers";

type AdminMemberPermissionsRouteContext = {
  params: Promise<{
    memberId: string;
  }>;
};

export async function PATCH(request: Request, context: AdminMemberPermissionsRouteContext) {
  const permissionDenied = requireApiPermission(request, {
    permissionCode: MEMBER_PERMISSION_CODE.memberPermissionUpdate,
    routeLabel: "admin.members.permissions.update",
  });
  if (permissionDenied) return permissionDenied;

  const { memberId } = await context.params;
  return handleUpdateAdminMemberPermissions(memberId, request);
}
