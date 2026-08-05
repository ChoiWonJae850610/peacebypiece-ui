import { handleAddSizeStructureV2 } from "@/lib/domain/work-orders/command/sizeColorStructureCommandRoute";

type RouteContext = { params: Promise<{ workOrderId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { workOrderId } = await context.params;
  return handleAddSizeStructureV2(request, workOrderId);
}
