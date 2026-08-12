import { handleCreateStructureOption, handleListStructureOptions } from "@/lib/domain/work-orders/catalog/structureOptionRoute";

type RouteContext = { params: Promise<{ workOrderId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { workOrderId } = await context.params;
  return handleListStructureOptions(workOrderId);
}

export async function POST(request: Request, context: RouteContext) {
  const { workOrderId } = await context.params;
  return handleCreateStructureOption(request, workOrderId);
}
