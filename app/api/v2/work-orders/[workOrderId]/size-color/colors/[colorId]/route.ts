import { handlePatchColorStructureV2 } from "@/lib/domain/work-orders/command/sizeColorStructureCommandRoute";

type RouteContext = { params: Promise<{ workOrderId: string; colorId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { workOrderId, colorId } = await context.params;
  return handlePatchColorStructureV2(request, workOrderId, colorId);
}
