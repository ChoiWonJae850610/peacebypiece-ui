import { requireWorkspaceApiGuard } from "@/lib/auth/apiRouteGuards";
import { MEMBER_PERMISSION_CODE } from "@/lib/permissions";
import { handlePatchWorkOrderInventoryGroup } from "@/lib/workorder/api/workOrderRouteHandlers";

export async function PATCH(request: Request) {
  const guard = await requireWorkspaceApiGuard({
    permissionCode: MEMBER_PERMISSION_CODE.workorderUpdate,
  });
  if (!guard.ok) return guard.response;

  return handlePatchWorkOrderInventoryGroup(request);
}
