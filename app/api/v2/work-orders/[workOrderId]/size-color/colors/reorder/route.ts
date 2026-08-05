import { handleReorderColorStructuresV2 } from "@/lib/domain/work-orders/command/sizeColorStructureCommandRoute";

type RouteContext = { params: Promise<{ workOrderId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { workOrderId } = await context.params;
  return handleReorderColorStructuresV2(request, workOrderId);
}
