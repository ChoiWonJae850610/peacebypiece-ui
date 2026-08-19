import { handleGetWorkOrderDetailTabV2 } from "@/lib/domain/work-orders/read/detailRoute";
import { handleCreateProcessV2 } from "@/lib/domain/work-orders/command/processCommandRoute";

type RouteContext = { params: Promise<{ workOrderId: string }> };
export async function GET(request: Request, context: RouteContext) {
  const { workOrderId } = await context.params;
  return handleGetWorkOrderDetailTabV2(request, workOrderId, "processes");
}
export async function POST(request: Request, context: RouteContext) {
  const { workOrderId } = await context.params;
  return handleCreateProcessV2(request, workOrderId);
}
