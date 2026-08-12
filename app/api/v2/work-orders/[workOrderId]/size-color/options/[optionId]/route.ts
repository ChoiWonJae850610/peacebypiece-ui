import { handleRemoveStructureOption } from "@/lib/domain/work-orders/catalog/structureOptionRoute";

type RouteContext = { params: Promise<{ workOrderId: string; optionId: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  const { workOrderId, optionId } = await context.params;
  return handleRemoveStructureOption(request, workOrderId, optionId);
}
