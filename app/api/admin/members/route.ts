import { requireApiPermission } from "@/lib/permissions";
import { handleListAdminMembers } from "@/lib/admin/members/memberRouteHandlers";

export async function GET(request: Request) {
  const permissionDenied = requireApiPermission(request, {
    permissionCode: "member.read",
    routeLabel: "admin.members.list",
  });
  if (permissionDenied) return permissionDenied;

  return handleListAdminMembers(request);
}
