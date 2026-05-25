import { MEMBER_PERMISSION_CODE, requireApiPermission } from "@/lib/permissions";
import { handleUpdateAdminMember } from "@/lib/admin/members/memberRouteHandlers";

type AdminMemberRouteContext = {
  params: Promise<{
    memberId: string;
  }>;
};

export async function PATCH(request: Request, context: AdminMemberRouteContext) {
  const permissionDenied = requireApiPermission(request, {
    permissionCode: MEMBER_PERMISSION_CODE.memberPermissionUpdate,
    routeLabel: "admin.members.update",
  });
  if (permissionDenied) return permissionDenied;

  const { memberId } = await context.params;
  return handleUpdateAdminMember(memberId, request);
}
