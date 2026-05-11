import { requireApiPermission } from "@/lib/permissions";
import { handleGetWorkOrderDetail, handlePatchWorkOrderState } from "@/lib/workorder/api/workOrderRouteHandlers";

type WorkOrderDetailRouteContext = {
  params: Promise<{
    workOrderId: string;
  }>;
};

export async function GET(_request: Request, context: WorkOrderDetailRouteContext) {
  const { workOrderId } = await context.params;
  return handleGetWorkOrderDetail(workOrderId);
}

export async function PATCH(request: Request, context: WorkOrderDetailRouteContext) {
  const permissionDenied = requireApiPermission(request, {
    permissionCode: "workorder.update",
    routeLabel: "workorders.detail.update",
  });
  if (permissionDenied) return permissionDenied;

  const { workOrderId } = await context.params;
  return handlePatchWorkOrderState(workOrderId, request);
}
