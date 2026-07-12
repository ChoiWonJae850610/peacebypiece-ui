import { handleGetWorkOrderDetailTabV2 } from "@/lib/domain/work-orders/read/detailRoute";
import { handleAddMaterialLineV2 } from "@/lib/domain/work-orders/command/materialCommandRoute";

type RouteContext = { params: Promise<{ workOrderId: string }> };
export async function GET(request: Request, context: RouteContext) {
  const { workOrderId } = await context.params;
  return handleGetWorkOrderDetailTabV2(request, workOrderId, "materials");
}

export async function POST(request: Request, context: RouteContext) {
  const { workOrderId } = await context.params;
  return handleAddMaterialLineV2(request, workOrderId);
}
