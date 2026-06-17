import { MEMBER_PERMISSION_CODE, requireApiPermission } from "@/lib/permissions";
import { handlePatchWorkOrderInventoryGroup } from "@/lib/workorder/api/workOrderRouteHandlers";

export async function PATCH(request: Request) {
  const permissionDenied = requireApiPermission(request, {
    permissionCode: MEMBER_PERMISSION_CODE.workorderUpdate,
    routeLabel: "workorders.inventory-group.update",
  });
  if (permissionDenied) return permissionDenied;
  return handlePatchWorkOrderInventoryGroup(request);
}
