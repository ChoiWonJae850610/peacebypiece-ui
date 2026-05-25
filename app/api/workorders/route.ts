import { MEMBER_PERMISSION_CODE, requireApiPermission } from "@/lib/permissions";
import {
  handleDeleteWorkOrders,
  handleGetWorkOrders,
  handlePatchWorkOrders,
  handlePostWorkOrders,
} from "@/lib/workorder/api/workOrderRouteHandlers";

export async function GET() {
  return handleGetWorkOrders();
}

export async function POST(request: Request) {
  const permissionDenied = requireApiPermission(request, {
    permissionCode: MEMBER_PERMISSION_CODE.workorderCreate,
    routeLabel: "workorders.create",
  });
  if (permissionDenied) return permissionDenied;

  return handlePostWorkOrders(request);
}

export async function PATCH(request: Request) {
  const permissionDenied = requireApiPermission(request, {
    permissionCode: MEMBER_PERMISSION_CODE.workorderUpdate,
    routeLabel: "workorders.update",
  });
  if (permissionDenied) return permissionDenied;

  return handlePatchWorkOrders(request);
}

export async function DELETE(request: Request) {
  const permissionDenied = requireApiPermission(request, {
    permissionCode: MEMBER_PERMISSION_CODE.workorderDelete,
    routeLabel: "workorders.delete",
  });
  if (permissionDenied) return permissionDenied;

  return handleDeleteWorkOrders(request);
}
