import { handlePatchWorkOrderBasicInfoV2 } from "@/lib/domain/work-orders/command/commandRoute";
import { handleGetWorkOrderDetailV2 } from "@/lib/domain/work-orders/read/detailRoute";

type RouteContext = { params: Promise<{ workOrderId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { workOrderId } = await context.params;
  return handleGetWorkOrderDetailV2(request, workOrderId);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { workOrderId } = await context.params;
  return handlePatchWorkOrderBasicInfoV2(request, workOrderId);
}
