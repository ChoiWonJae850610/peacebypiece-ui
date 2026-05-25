import { MEMBER_PERMISSION_CODE, requireApiPermission } from "@/lib/permissions";
import { handleListAdminMembers } from "@/lib/admin/members/memberRouteHandlers";

export async function GET(request: Request) {
  const permissionDenied = requireApiPermission(request, {
    permissionCode: MEMBER_PERMISSION_CODE.memberRead,
    routeLabel: "admin.members.list",
  });
  if (permissionDenied) return permissionDenied;

  return handleListAdminMembers(request);
}
