import { handleMaterialOrderTransitionV2 } from "@/lib/domain/work-orders/command/materialCommandRoute";

type RouteContext = { params: Promise<{ workOrderId: string; materialLineId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { workOrderId, materialLineId } = await context.params;
  return handleMaterialOrderTransitionV2(request, workOrderId, materialLineId, "request");
}
