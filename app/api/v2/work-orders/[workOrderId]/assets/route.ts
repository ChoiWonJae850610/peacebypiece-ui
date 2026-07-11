import { handleGetWorkOrderDetailTabV2 } from "@/lib/domain/work-orders/read/detailRoute";

type RouteContext = { params: Promise<{ workOrderId: string }> };
export async function GET(request: Request, context: RouteContext) {
  const { workOrderId } = await context.params;
  return handleGetWorkOrderDetailTabV2(request, workOrderId, "assets");
}
