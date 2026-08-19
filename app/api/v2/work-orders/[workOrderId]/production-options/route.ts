import { handleListProductionOptions } from "@/lib/domain/work-orders/read/productionOptionsRoute";

type RouteContext = { params: Promise<{ workOrderId: string }> };
export async function GET(_request: Request, context: RouteContext) {
  const { workOrderId } = await context.params;
  return handleListProductionOptions(workOrderId);
}
