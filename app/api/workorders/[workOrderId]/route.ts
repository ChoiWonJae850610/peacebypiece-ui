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
  const { workOrderId } = await context.params;
  return handlePatchWorkOrderState(workOrderId, request);
}
