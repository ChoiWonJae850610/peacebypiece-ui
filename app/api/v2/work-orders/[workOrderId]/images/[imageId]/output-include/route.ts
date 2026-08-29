import { handleSetWorkOrderImageOutputInclude } from "@/lib/domain/work-orders/command/imageCommandRoute";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ workOrderId: string; imageId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { workOrderId, imageId } = await context.params;
  return handleSetWorkOrderImageOutputInclude(request, workOrderId, imageId);
}
