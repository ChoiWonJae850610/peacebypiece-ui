import { handleRenameSizeStructureV2 } from "@/lib/domain/work-orders/command/sizeColorStructureCommandRoute";

type RouteContext = { params: Promise<{ workOrderId: string; sizeRowId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { workOrderId, sizeRowId } = await context.params;
  return handleRenameSizeStructureV2(request, workOrderId, sizeRowId);
}
