import { handleBatchStructureSelectionV2 } from "@/lib/domain/work-orders/command/sizeColorStructureCommandRoute";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ workOrderId: string }> }) {
  const { workOrderId } = await context.params;
  return handleBatchStructureSelectionV2(request, workOrderId);
}
