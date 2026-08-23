import { handleCreateWorkOrderReorder, handleGetWorkOrderSeriesHistory } from "@/lib/domain/work-orders/command/reorderRoute";

type RouteContext = { params: Promise<{ workOrderId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { workOrderId } = await context.params;
  return handleGetWorkOrderSeriesHistory(request, workOrderId);
}

export async function POST(request: Request, context: RouteContext) {
  const { workOrderId } = await context.params;
  return handleCreateWorkOrderReorder(request, workOrderId);
}
