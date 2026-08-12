import { handleListMaterialPartners } from "@/lib/domain/work-orders/read/materialPartnerRoute";

type RouteContext = { params: Promise<{ workOrderId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { workOrderId } = await context.params;
  return handleListMaterialPartners(workOrderId);
}
