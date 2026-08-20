import { handleSetWorkOrderSampleV2 } from "@/lib/domain/work-orders/command/sampleCommandRoute";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ workOrderId: string }> }) {
  const { workOrderId } = await context.params;
  return handleSetWorkOrderSampleV2(request, workOrderId);
}
